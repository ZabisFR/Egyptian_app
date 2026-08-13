'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Droit d'accès et de portabilité (RGPD art. 15 et 20) : renvoie l'intégralité des
 * données rattachées au compte, dans un format structuré et lisible par machine.
 *
 * Les lectures passent par le client de session, donc par les policies RLS : il est
 * impossible d'exporter les données de quelqu'un d'autre, même en falsifiant la requête.
 */
export async function exportMyData(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, progress, attempts, lessons, dailies] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_progress').select('*').eq('user_id', user.id),
    supabase.from('quiz_attempts').select('*').eq('user_id', user.id),
    supabase.from('lesson_completions').select('*').eq('user_id', user.id),
    supabase.from('daily_reviews').select('*').eq('user_id', user.id),
  ]);

  return JSON.stringify(
    {
      exporte_le: new Date().toISOString(),
      compte: {
        id: user.id,
        email: user.email,
        cree_le: user.created_at,
        derniere_connexion: user.last_sign_in_at,
      },
      profil: profile.data,
      progression_par_module: progress.data ?? [],
      tentatives_de_quiz: attempts.data ?? [],
      lecons_lues: lessons.data ?? [],
      revisions_quotidiennes: dailies.data ?? [],
    },
    null,
    2
  );
}

/**
 * Droit à l'effacement (RGPD art. 17).
 *
 * Supprimer la ligne `auth.users` suffit à tout effacer : chaque table de données
 * personnelles la référence en `on delete cascade` (voir migration 001). Cette opération
 * exige la clé de service — la clé publique ne peut pas supprimer un utilisateur, ce qui
 * est justement la protection recherchée.
 */
export async function deleteMyAccount(): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Vous devez être connecté.' };

  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    return {
      error:
        "La suppression automatique n'est pas configurée sur ce serveur. Écrivez-nous et nous supprimerons votre compte manuellement.",
    };
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: `La suppression a échoué : ${error.message}` };

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/?compte=supprime');
}
