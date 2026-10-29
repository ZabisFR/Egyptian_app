/**
 * Génère la prononciation de chaque mot du vocabulaire avec Azure Speech, voix égyptienne,
 * dans `public/audio/vocab/`, et tient à jour `data/audio-manifest.json` (écriture arabe →
 * fichier), que l'app lit via `lib/vocab-audio.ts`.
 *
 * Exécuté en local, une fois après chaque ajout de contenu : en production, les sons sont
 * de simples fichiers statiques, sans clé ni appel à Azure.
 *
 *   npm run generate:audio -- --dry-run    (liste ce qui serait généré, n'appelle pas Azure)
 *   npm run generate:audio -- --limit 30   (n'en génère que 30 : pour écouter avant de tout faire)
 *   npm run generate:audio                 (tout ce qui manque)
 *   npm run generate:audio -- --force      (régénère tout, par exemple après un changement de voix)
 *
 * Rejouable : un mot déjà généré avec la même voix et le même texte est sauté. Un fichier
 * qui ne correspond plus à aucun mot est supprimé. Les enregistrements humains
 * (`voice: "humain"`) ne sont jamais régénérés.
 *
 * Un son généré n'est PAS affiché sur le site tant qu'il n'a pas été validé à l'oreille
 * (`data/audio-review.json`, voir `lib/vocab-audio.ts`) : environ un mot sur quatre sort
 * faux. Le tri et les enregistrements se font avec l'outil local décrit dans ARCHITECTURE.md.
 *
 * Corrections de prononciation, deux fichiers facultatifs :
 * - `data/audio-overrides.json` : `{ "<arabe tel qu'il est dans data/>": "<texte à lire>" | null }`.
 *   Un texte vocalisé (« كُتُب ») lève une ambiguïté de lecture ; `null` retire le son.
 * - `data/audio-phonemes.json` : `{ "<mot arabe>": "<prononciation IPA>" }`, appliqué à ce
 *   mot partout où il apparaît, phrases comprises. C'est là que vit le ق égyptien : la voix
 *   lit « qalb », la prononciation imposée « ʔalb » lui fait dire le coup de glotte. Choix
 *   validé à l'oreille sur la voix Shakir (la vocalisation et le remplacement par أ ne
 *   suffisaient pas). Le ج, lui, sort déjà en « g » sans aide.
 *   Le script signale tout mot avec un ق qui n'a pas d'entrée.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { audioKey } from '../lib/vocab-audio';

process.loadEnvFile('.env.local');

const DATA_DIR = join(process.cwd(), 'data');
const AUDIO_DIR = join(process.cwd(), 'public', 'audio', 'vocab');
const MANIFEST = join(DATA_DIR, 'audio-manifest.json');
const OVERRIDES = join(DATA_DIR, 'audio-overrides.json');
const PHONEMES = join(DATA_DIR, 'audio-phonemes.json');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
// Shakir (homme) ou Salma (femme) : les deux voix d'Azure en arabe égyptien. Shakir a été
// retenue à l'écoute comme la plus égyptienne.
const VOICE = process.env.AZURE_SPEECH_VOICE || 'ar-EG-ShakirNeural';

type Manifest = {
  entries: Record<string, { file: string; text: string; voice: string }>;
};

// ---------------------------------------------------------------------------
// Les mots à prononcer
// ---------------------------------------------------------------------------

/**
 * Le texte que la voix lira, ou `null` si l'entrée n'est pas un mot prononçable.
 *
 * - « كويس / كويسة » (masculin / féminin) : les deux formes, séparées d'une virgule arabe
 *   pour que la voix marque une pause au lieu de lire la barre.
 * - « اسمي... » : les points de suspension sont retirés.
 * - Les gabarits de grammaire — « لو + كان/كنت + الماضي », « ما...ش », « اللي ... ـه » —
 *   ne sont pas des mots : lus à voix haute, ils ne voudraient rien dire.
 */
function speakable(arabic: string): string | null {
  if (/[+ـ]/.test(arabic) || /\S(\.\.\.|…)\S/.test(arabic)) return null;
  const text = arabic
    .replace(/\s*\/\s*/g, '، ')
    .replace(/\s*(\.\.\.|…)\s*/g, '، ')
    .replace(/([؟?!])،/g, '$1')
    .replace(/[،\s]+$/, '')
    .trim();
  return text || null;
}

const overrides: Record<string, string | null> = existsSync(OVERRIDES)
  ? JSON.parse(readFileSync(OVERRIDES, 'utf8'))
  : {};

const phonemes: Record<string, string> = existsSync(PHONEMES)
  ? JSON.parse(readFileSync(PHONEMES, 'utf8'))
  : {};

/** Un mot sans voyelles ni ponctuation : « الحَلْق؟ » et « الحلق » ont la même entrée. */
const bare = (w: string) => w.replace(/[ً-ْ]/g, '').replace(/[؟?!.,،]/g, '');

/** Mots contenant un ق sans prononciation imposée : la voix les lirait à l'arabe standard. */
const missingQaf = new Set<string>();

/**
 * Le texte à lire, mis en SSML : chaque mot de `audio-phonemes.json` est enveloppé dans
 * `<phoneme>`, la ponctuation qui le suit reste en dehors pour garder l'intonation.
 */
function toSsml(text: string): string {
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const [, word, punct] = token.match(/^(.*?)([؟?!.,،]*)$/)!;
      const ipa = phonemes[bare(word)];
      if (!ipa && word.includes('ق')) missingQaf.add(bare(word));
      return ipa
        ? `<phoneme alphabet="ipa" ph="${escapeXml(ipa)}">${escapeXml(word)}</phoneme>${escapeXml(punct)}`
        : escapeXml(token);
    })
    .join('');
}

const words = new Map<string, string | null>(); // clé → SSML à lire
for (const f of readdirSync(DATA_DIR).filter((f) => f.startsWith('module-') && f.endsWith('.json')).sort()) {
  const json = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8')) as {
    lessons: { vocab_items?: { arabic?: string | null }[] }[];
  };
  for (const lesson of json.lessons) {
    for (const v of lesson.vocab_items ?? []) {
      if (!v.arabic?.trim()) continue;
      const key = audioKey(v.arabic);
      const override = Object.hasOwn(overrides, key) ? overrides[key] : undefined;
      const text = override === undefined ? speakable(key) : override;
      words.set(key, text === null ? null : toSsml(text));
    }
  }
}

// ---------------------------------------------------------------------------
// Azure
// ---------------------------------------------------------------------------

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function synthesize(inner: string): Promise<Buffer> {
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ar-EG">` +
    `<voice name="${VOICE}">${inner}</voice></speak>`;

  // Le palier gratuit limite le nombre de requêtes par minute : sur un 429, on attend ce
  // que demande Azure (ou de plus en plus longtemps) et on recommence.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY!,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'egyptian-arabic-app',
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 6) {
      throw new Error(`Azure a répondu ${res.status} ${res.statusText} : ${await res.text()}`);
    }
    const wait = Number(res.headers.get('retry-after')) || 2 ** attempt;
    console.log(`  … ${res.status}, nouvel essai dans ${wait} s`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

  const todo: { key: string; text: string; file: string }[] = [];
  let skipped = 0;
  let human = 0;
  for (const [key, text] of words) {
    if (text === null) {
      skipped++;
      continue;
    }
    const file = `${createHash('sha1').update(key).digest('hex').slice(0, 12)}.mp3`;
    const done = manifest.entries[key];
    // Un enregistrement humain (outil de tri) n'est jamais remplacé par la synthèse, même
    // avec --force : c'est précisément le mot que la voix prononçait mal.
    if (done?.voice === 'humain' && existsSync(join(AUDIO_DIR, done.file))) {
      human++;
      continue;
    }
    // Un mot dont le texte (correction) ou la voix a changé est refait.
    const upToDate =
      !FORCE &&
      done?.text === text &&
      done.voice === VOICE &&
      existsSync(join(AUDIO_DIR, done.file));
    if (!upToDate) todo.push({ key, text, file });
  }

  const batch = todo.slice(0, LIMIT);
  console.log(
    `${words.size} mots · ${skipped} sans son (gabarits) · ${human} enregistrés à la voix · ` +
      `${words.size - skipped - human - todo.length} à jour · ` +
      `${todo.length} à générer${batch.length < todo.length ? ` (${batch.length} cette fois)` : ''} · voix ${VOICE}`
  );
  if (missingQaf.size) {
    console.log(
      `⚠ ${missingQaf.size} mot(s) avec un ق sans prononciation dans audio-phonemes.json : ` +
        [...missingQaf].join(' · ')
    );
  }

  if (DRY_RUN) {
    for (const [key, text] of words) if (text === null) console.log(`  (sans son)  ${key}`);
    for (const t of batch) console.log(`  ${t.file}  ${t.text}`);
    return;
  }
  if (batch.length && (!KEY || !REGION)) {
    throw new Error('AZURE_SPEECH_KEY et AZURE_SPEECH_REGION sont requis dans .env.local');
  }

  mkdirSync(AUDIO_DIR, { recursive: true });

  // Le manifeste est réécrit après chaque mot : une coupure en plein lot (quota, réseau)
  // ne fait perdre aucun son déjà payé, et la relance reprend où elle s'était arrêtée.
  const entries: Manifest['entries'] = { ...manifest.entries };
  for (const [i, t] of batch.entries()) {
    writeFileSync(join(AUDIO_DIR, t.file), await synthesize(t.text));
    entries[t.key] = { file: t.file, text: t.text, voice: VOICE };
    writeManifest(entries);
    console.log(`  ${String(i + 1).padStart(3)}/${batch.length}  ${t.text}`);
  }

  // Entrées et fichiers orphelins : mot retiré du contenu, ou passé en `null`. Un
  // enregistrement humain n'est retiré que si le mot a disparu du contenu.
  for (const key of Object.keys(entries)) {
    if (!words.has(key) || (words.get(key) === null && entries[key].voice !== 'humain')) {
      delete entries[key];
    }
  }
  const used = new Set(Object.values(entries).map((e) => e.file));
  let removed = 0;
  for (const f of readdirSync(AUDIO_DIR)) {
    if (f.endsWith('.mp3') && !used.has(f)) {
      rmSync(join(AUDIO_DIR, f));
      removed++;
    }
  }

  writeManifest(entries);

  console.log(
    `\n✓ ${batch.length} générés · ${Object.keys(entries).length} sons au total` +
      (removed ? ` · ${removed} fichiers orphelins supprimés` : '')
  );
}

function writeManifest(entries: Manifest['entries']) {
  // Clés triées : la sortie est stable et un `git diff` du manifeste se relit.
  const sorted = Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  );
  writeFileSync(MANIFEST, JSON.stringify({ entries: sorted }, null, 2) + '\n');
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
