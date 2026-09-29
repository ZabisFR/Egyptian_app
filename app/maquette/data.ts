import { createClient } from '@/lib/supabase/server';
import type { Level, Module } from '@/lib/types';

/**
 * Données communes aux maquettes de refonte : le même contenu réel pour les quatre
 * styles, sans quoi on comparerait des textes et non des ambiances.
 */

export type MockModule = Module & { lessons: { count: number }[] };

export async function loadMockData() {
  const supabase = await createClient();
  const [{ data: modules }, { count: lessonCount }, { count: vocabCount }] = await Promise.all([
    supabase
      .from('modules')
      .select('*, lessons(count)')
      .order('order_index')
      .returns<MockModule[]>(),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('vocab_items').select('*', { count: 'exact', head: true }),
  ]);

  const all = modules ?? [];
  return {
    moduleCount: all.length,
    lessonCount: lessonCount ?? 0,
    vocabCount: vocabCount ?? 0,
    sample: all.filter((m) => m.level !== 'REF').slice(0, 6),
  };
}

export const LEVEL_NAME: Record<Level, string> = {
  A1: 'Débutant',
  A2: 'Élémentaire',
  B1: 'Intermédiaire',
  B2: 'Avancé',
  REF: 'Référence',
};

/** États de progression FICTIFS, pour montrer les trois cas sur chaque maquette. */
export const DEMO_STATE = ['done', 'progress', 'new', 'new', 'new', 'new'] as const;
export type DemoState = (typeof DEMO_STATE)[number];

export function demoProgress(state: DemoState, lessons: number) {
  const read = state === 'done' ? lessons : state === 'progress' ? Math.ceil(lessons / 3) : 0;
  return { read, pct: lessons ? Math.round((read / lessons) * 100) : 0 };
}

export const LEVELS = [
  { level: 'A1', title: 'Les fondations', text: 'Lire l’alphabet, saluer, compter, commander un café.' },
  { level: 'A2', title: 'La vie courante', text: 'Raconter sa journée, marchander au souk.' },
  { level: 'B1', title: 'L’aisance', text: 'Suivre une conversation entre amis, saisir l’humour.' },
  { level: 'B2', title: 'Le débat', text: 'Nuancer, argumenter, suivre une série sans sous-titres.' },
] as const;
