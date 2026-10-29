/**
 * Outil local de tri des sons du vocabulaire : `npm run review:audio`, puis
 * http://localhost:3020 (dans Chrome : le micro y est autorisé, `localhost` étant un
 * contexte sûr).
 *
 * Pour chaque mot : écouter le son généré par Azure, le valider (✓) ou le refuser (✗).
 * Sur un ✗, une locutrice égyptienne l'enregistre au micro (ou on importe un fichier audio
 * du téléphone). L'enregistrement est nettoyé dans le navigateur (silences coupés, volume
 * égalisé, mp3 24 kHz) puis écrit à la place du son d'Azure.
 *
 * Ce que l'outil écrit, et que le site lit (`lib/vocab-audio.ts`) :
 * - `data/audio-review.json` : les verdicts. Seuls les ✓ sont affichés sur le site.
 * - `data/audio-manifest.json` : `voice: "humain"` pour un mot enregistré.
 * - `public/audio/vocab/<fichier>.mp3` : le son lui-même.
 *
 * Jamais exécuté en production : aucun fichier de ce dossier n'est servi par Next.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'data');
const AUDIO = join(ROOT, 'public', 'audio', 'vocab');
const MANIFEST = join(DATA, 'audio-manifest.json');
const REVIEW = join(DATA, 'audio-review.json');
const PAGE = join(dirname(fileURLToPath(import.meta.url)), 'page.html');
const PORT = Number(process.env.PORT) || 3020;

const key = (s) => s.trim().normalize('NFC');
const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);

/** Écriture atomique : un arrêt brutal pendant l'écriture ne laisse pas un JSON à moitié écrit. */
function writeJson(path, value, sortKeys = false) {
  const v = sortKeys
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
    : value;
  writeFileSync(path + '.tmp', JSON.stringify(v, null, 2) + '\n');
  renameSync(path + '.tmp', path);
}

/** Les mots dans l'ordre du cours, avec leur son et leur verdict. */
function words() {
  const manifest = readJson(MANIFEST, { entries: {} }).entries;
  const review = readJson(REVIEW, {});
  const seen = new Set();
  const list = [];
  for (const f of readdirSync(DATA).filter((f) => f.startsWith('module-') && f.endsWith('.json')).sort()) {
    const json = JSON.parse(readFileSync(join(DATA, f), 'utf8'));
    for (const lesson of json.lessons) {
      for (const v of lesson.vocab_items ?? []) {
        if (!v.arabic?.trim()) continue;
        const k = key(v.arabic);
        if (seen.has(k) || !manifest[k]) continue;
        seen.add(k);
        const e = manifest[k];
        const r = review[k];
        list.push({
          key: k,
          tr: v.transliteration,
          fr: v.french,
          module: f.replace('.json', ''),
          file: e.file,
          human: e.voice === 'humain',
          // Un verdict ne vaut que pour le texte écouté : régénéré autrement, le mot est à réécouter.
          verdict: r && r.text === e.text ? r.verdict : null,
        });
      }
    }
  }
  return list;
}

async function body(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(res, status, data, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/') {
      return send(res, 200, readFileSync(PAGE), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/api/words') {
      return send(res, 200, words());
    }
    if (req.method === 'GET' && url.pathname.startsWith('/audio/')) {
      const file = url.pathname.slice('/audio/'.length);
      if (!/^[0-9a-f]{12}\.mp3$/.test(file) || !existsSync(join(AUDIO, file))) return send(res, 404, 'introuvable', 'text/plain');
      return send(res, 200, readFileSync(join(AUDIO, file)), 'audio/mpeg');
    }

    if (req.method === 'POST' && url.pathname === '/api/verdict') {
      const { key: k, verdict } = await body(req);
      const entry = readJson(MANIFEST, { entries: {} }).entries[k];
      if (!entry) return send(res, 400, { error: 'mot inconnu' });
      const review = readJson(REVIEW, {});
      if (verdict === 'ok' || verdict === 'ko') review[k] = { verdict, text: entry.text };
      else delete review[k];
      writeJson(REVIEW, review, true);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/record') {
      const { key: k, mp3 } = await body(req);
      const manifest = readJson(MANIFEST, { entries: {} });
      const entry = manifest.entries[k];
      if (!entry) return send(res, 400, { error: 'mot inconnu' });
      const audio = Buffer.from(mp3, 'base64');
      // En-tête mp3 (ID3 ou synchro MPEG) : refuse tout ce qui n'en est pas un.
      if (!(audio.subarray(0, 3).toString() === 'ID3' || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0))) {
        return send(res, 400, { error: 'pas un mp3' });
      }
      writeFileSync(join(AUDIO, entry.file), audio);
      // Date locale (en-CA = AAAA-MM-JJ) : en UTC, un enregistrement fait après minuit à
      // Paris porterait la date de la veille.
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
      manifest.entries[k] = { file: entry.file, text: `enregistrement ${today}`, voice: 'humain' };
      writeJson(MANIFEST, { entries: Object.fromEntries(Object.entries(manifest.entries).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) });
      return send(res, 200, { ok: true });
    }

    send(res, 404, 'introuvable', 'text/plain');
  } catch (e) {
    console.error(e);
    send(res, 500, { error: String(e.message ?? e) });
  }
}).listen(PORT, 'localhost', () => {
  console.log(`Tri des sons : http://localhost:${PORT}  (Ctrl+C pour arrêter)`);
});
