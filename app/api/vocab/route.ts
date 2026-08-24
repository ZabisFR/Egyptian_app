import { NextResponse } from 'next/server';
import { getVocabIndex } from '@/lib/vocab-index';

/**
 * Index de recherche : tout le vocabulaire du site, à plat.
 *
 * Servi en un seul bloc plutôt que via une requête par frappe. Le corpus est petit et
 * figé (il ne change qu'à `npm run import`) : une fois chargé, la recherche est instantanée
 * et ne coûte plus une seule requête réseau. Interroger Supabase à chaque lettre aurait
 * ajouté une latence à chaque frappe pour un jeu de données qui tient dans un souffle.
 *
 * Les clés sont volontairement courtes (`t`, `f`, `lt`…) : répétées cinq cents fois, des
 * noms explicites pèseraient plus lourd que les données elles-mêmes.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const index = await getVocabIndex();

    return NextResponse.json(index, {
      headers: {
        // Le contenu ne bouge qu'à un réimport manuel : cinq minutes de cache au CDN
        // (`s-maxage`) évitent de rejouer la requête pour chaque visiteur qui ouvre la
        // recherche.
        //
        // `max-age=0` n'est pas redondant : sans lui, la réponse n'a aucune directive de
        // fraîcheur pour le NAVIGATEUR, qui applique alors sa propre heuristique. Mesuré
        // après un réimport : le navigateur resservait un index de 422 mots quand le
        // serveur en renvoyait déjà 496. Le voilà obligé de revalider (304 le plus
        // souvent), pendant que le CDN, lui, continue d'absorber la charge.
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
