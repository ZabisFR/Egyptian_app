import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { VocabHit } from '@/lib/search';

/**
 * Le vocabulaire du site à plat : tous les mots, avec la leçon et le module d'origine.
 *
 * Source unique pour les deux consommateurs, qui en ont besoin sous la même forme :
 * `/api/vocab` (index de la recherche globale) et `/glossaire` (le tableau complet).
 * Dupliquer la requête aurait garanti qu'un jour l'une des deux oublie un champ.
 */
type Row = {
  id: string;
  arabic: string | null;
  transliteration: string;
  french: string;
  lessons: {
    id: string;
    title: string;
    day: number | null;
    module_id: string;
    modules: { title: string } | null;
  } | null;
};

export async function getVocabIndex(): Promise<VocabHit[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vocab_items')
    .select(
      'id, arabic, transliteration, french, lessons(id, title, day, module_id, modules(title))'
    )
    .returns<Row[]>();

  if (error) throw new Error(`Lecture du vocabulaire : ${error.message}`);

  return (data ?? [])
    // Un item orphelin (leçon supprimée entre-temps) n'a pas de page où mener : l'écarter
    // vaut mieux que proposer un résultat qui aboutit sur un 404.
    .filter((row) => row.lessons !== null)
    .map((row) => ({
      i: row.id,
      a: row.arabic,
      t: row.transliteration,
      f: row.french,
      m: row.lessons!.module_id,
      mt: row.lessons!.modules?.title ?? row.lessons!.module_id,
      l: row.lessons!.id,
      lt: row.lessons!.title,
      d: row.lessons!.day,
    }));
}
