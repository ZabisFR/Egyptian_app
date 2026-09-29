import Link from 'next/link';
import type { Metadata } from 'next';
import GlossaireFiltre from '@/components/GlossaireFiltre';
import { getModules } from '@/lib/content';
import { getVocabIndex } from '@/lib/vocab-index';
import { foldArabic, foldArabizi, foldLatin, type VocabHit } from '@/lib/search';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Glossaire',
  description:
    "Tout le vocabulaire du site réuni : chaque mot en arabe, en Arabizi et en français, avec la leçon où il est enseigné. Recherche dans les trois écritures.",
};

type Entree = {
  cle: string;
  arabe: string | null;
  translitteration: string;
  francais: string;
  /** Toutes les leçons où le mot apparaît — un mot peut être enseigné à deux endroits. */
  sources: { m: string; mt: string; l: string; lt: string; d: number | null; i: string }[];
};

/**
 * Regroupe les entrées identiques.
 *
 * Un même mot est parfois enseigné dans deux modules — قلب au module 01 et dans la
 * référence du corps, المدرسة dans les lieux publics et dans l'école. Les lister deux fois
 * dans un glossaire donnerait l'impression d'un doublon oublié ; on affiche une entrée et
 * on cite ses deux emplacements.
 */
function grouper(index: VocabHit[]): Entree[] {
  const parCle = new Map<string, Entree>();

  for (const hit of index) {
    const cle = `${foldArabic(hit.a ?? '')}|${foldLatin(hit.f)}|${foldLatin(hit.t)}`;
    const source = { m: hit.m, mt: hit.mt, l: hit.l, lt: hit.lt, d: hit.d, i: hit.i };

    const existante = parCle.get(cle);
    if (existante) existante.sources.push(source);
    else
      parCle.set(cle, {
        cle,
        arabe: hit.a,
        translitteration: hit.t,
        francais: hit.f,
        sources: [source],
      });
  }

  // Ordre alphabétique français : le glossaire se lit d'abord comme un
  // français → égyptien. Le sens inverse est couvert par le champ de recherche, qui
  // accepte aussi bien l'arabe que l'Arabizi.
  //
  // La ponctuation de tête est ignorée : sans cela, « Ramadan généreux » — dont la
  // traduction commence par un guillemet — se retrouvait en première position du
  // glossaire, avant le A. `numeric` garde les nombres dans l'ordre humain (2 avant 10).
  const cleTri = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '');
  return [...parCle.values()].sort((a, b) =>
    cleTri(a.francais).localeCompare(cleTri(b.francais), 'fr', {
      sensitivity: 'base',
      numeric: true,
    })
  );
}

export default async function GlossairePage() {
  const index = await getVocabIndex();
  const entrees = grouper(index);

  // Un thème par module, avec son nombre de mots. L'ordre suit celui du programme
  // (`order_index`) et non l'alphabet des traductions : sans cette requête, les thèmes
  // sortaient dans l'ordre d'apparition des mots dans le glossaire, c'est-à-dire au
  // hasard.
  const rang = new Map((await getModules()).map((m) => [m.id, m.order_index]));

  const compte = new Map<string, { titre: string; n: number }>();
  for (const e of entrees) {
    for (const s of e.sources) {
      const t = compte.get(s.m) ?? { titre: s.mt, n: 0 };
      t.n += 1;
      compte.set(s.m, t);
    }
  }
  const themes = [...compte.entries()].sort(
    (a, b) => (rang.get(a[0]) ?? 999) - (rang.get(b[0]) ?? 999)
  );

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header>
        <p className="eyebrow">Tout le vocabulaire</p>
        <h1 className="display mt-2 text-4xl">Glossaire</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">
          Les {entrees.length} mots du site réunis en une page, classés par ordre
          alphabétique français. Cherchez dans les trois écritures — « demain », « bokra »
          ou « بكرة » mènent au même mot — et suivez le lien pour retrouver la leçon qui
          l&apos;enseigne.
        </p>
      </header>

      <GlossaireFiltre total={entrees.length} themes={themes} />

      {/*
        Liste et non tableau : à 375 px, quatre colonnes imposeraient un défilement
        horizontal sur le contenu principal de la page. Ici chaque entrée s'empile sur
        mobile et s'aligne en colonnes dès 640 px, sans jamais déborder.

        Les lignes sont rendues par le serveur, et le filtre se contente de les masquer.
        Les repasser en props d'un composant client aurait fait voyager les 543 mots deux
        fois : une fois en HTML, une fois dans la charge React.
      */}
      <ul id="glossaire" className="mt-6">
        {entrees.map((e) => (
          <li
            key={e.cle}
            className="glossaire-entree"
            data-mot={[
              foldLatin(e.translitteration),
              foldArabizi(e.translitteration),
              foldLatin(e.francais),
              foldArabic(e.arabe ?? ''),
            ]
              .filter(Boolean)
              .join(' ')}
            data-themes={e.sources.map((s) => s.m).join(' ')}
          >
            <span className="arabic glossaire-arabe" dir="rtl">
              {e.arabe ?? '—'}
            </span>
            <span className="font-semibold">{e.translitteration}</span>
            <span className="text-[var(--muted)]">{e.francais}</span>
            <span className="glossaire-sources">
              {e.sources.map((s, i) => (
                <span key={`${s.l}-${s.i}`}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <Link
                    href={`/modules/${s.m}/${s.l}#mot-${s.i}`}
                    className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    {s.d !== null ? `Jour ${s.d}` : s.mt}
                  </Link>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>

      <p id="glossaire-vide" hidden className="mt-8 text-sm text-[var(--muted)]">
        Aucun mot ne correspond à cette recherche.
      </p>
    </main>
  );
}
