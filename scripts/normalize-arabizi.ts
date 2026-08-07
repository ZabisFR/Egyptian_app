/**
 * Uniformise la translittération de `data/*.json` en Arabizi.
 *
 * Les modules A1/A2 ont été rédigés en Arabizi (« 3arabi », « 7akol », « Bakhod ») tandis
 * que les modules B1/B2 utilisent une translittération académique (« ʿarabi », « ḥaawel »,
 * « maʾfuul »). Deux systèmes dans un même parcours obligent l'apprenant à réapprendre à
 * lire à mi-chemin — et le module-01 enseigne explicitement l'Arabizi comme LE système
 * d'écriture informel égyptien.
 *
 * Aucun des caractères remplacés n'existe en français : la substitution peut donc
 * s'appliquer à tout le fichier sans abîmer les descriptions ni les traductions.
 *
 * Les voyelles longues (uu, aa, ii) sont conservées : l'Arabizi les utilise aussi
 * (« Engleezi » dans le module-02), ce n'est pas une divergence de système.
 *
 * Rejouable : une fois la conversion faite, une seconde exécution ne trouve plus rien.
 *
 *   npm run normalize
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = 'data';

// Les 3 chiffres de l'Arabizi tels qu'enseignés au module-01, puis les emphatiques dont
// l'Arabizi ne marque tout simplement pas l'emphase.
const MAP: Record<string, string> = {
  'ʿ': '3', // 'Ayn — contraction du fond de la gorge
  'ʾ': '2', // Hamza — coup de glotte
  'ḥ': '7', // Ha râpeux
  'Ḥ': '7',
  'ṣ': 's',
  'Ṣ': 'S',
  'ṭ': 't',
  'Ṭ': 'T',
  'ḍ': 'd',
  'Ḍ': 'D',
  'ẓ': 'z',
  'Ẓ': 'Z',
};

const PATTERN = new RegExp(`[${Object.keys(MAP).join('')}]`, 'g');

function main() {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  let grandTotal = 0;

  for (const file of files) {
    const path = join(DATA_DIR, file);
    const before = readFileSync(path, 'utf8');

    const counts: Record<string, number> = {};
    const after = before.replace(PATTERN, (ch) => {
      counts[ch] = (counts[ch] ?? 0) + 1;
      return MAP[ch];
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) continue;

    // Filet de sécurité : on ne réécrit que si le JSON reste valide et de même forme.
    JSON.parse(after);

    writeFileSync(path, after, 'utf8');
    grandTotal += total;

    const detail = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch}→${MAP[ch]} ×${n}`)
      .join('  ');
    console.log(`  ${file.padEnd(24)} ${String(total).padStart(4)}   ${detail}`);
  }

  console.log(
    grandTotal === 0
      ? '\nRien à convertir : la translittération est déjà uniforme.'
      : `\n${grandTotal} caractères convertis en Arabizi.`
  );
}

main();
