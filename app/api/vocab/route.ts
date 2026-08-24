import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VocabHit } from '@/lib/search';

/**
 * Index de recherche : les 422 mots du site, à plat.
 *
 * Servi en un seul bloc plutôt que via une requête par frappe. Le corpus est petit et
 * figé (il ne change qu'à `npm run import`) : une fois chargé, la recherche est instantanée
 * et ne coûte plus une seule requête réseau. Interroger Supabase à chaque lettre aurait
 * ajouté une latence à chaque frappe pour un jeu de données qui tient dans un souffle.
 *
 * Les clés sont volontairement courtes (`t`, `f`, `lt`…) : répétées 422 fois, des noms
 * explicites pèseraient plus lourd que les données elles-mêmes.
 */
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  arabic: string | null;
  transliteration: string;
  french: string;
  lessons: { id: string; title: string; day: number | null; module_id: string } | null;
};

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vocab_items')
    .select('id, arabic, transliteration, french, lessons(id, title, day, module_id)')
    .returns<Row[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const index: VocabHit[] = (data ?? [])
    // Un item orphelin (leçon supprimée entre-temps) n'a pas de page où mener : l'écarter
    // vaut mieux que proposer un résultat qui aboutit sur un 404.
    .filter((row) => row.lessons !== null)
    .map((row) => ({
      i: row.id,
      a: row.arabic,
      t: row.transliteration,
      f: row.french,
      m: row.lessons!.module_id,
      l: row.lessons!.id,
      lt: row.lessons!.title,
      d: row.lessons!.day,
    }));

  return NextResponse.json(index, {
    headers: {
      // Le contenu ne bouge qu'à un réimport manuel : cinq minutes de cache au CDN
      // évitent de rejouer la requête pour chaque visiteur qui ouvre la recherche.
      // Contrepartie assumée : après `npm run import`, l'index peut rester périmé
      // jusqu'à cinq minutes.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
