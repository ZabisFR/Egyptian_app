import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Level } from '@/lib/types';

export type Profile = {
  id: string;
  display_name: string | null;
  current_level: Level;
  xp_points: number;
  created_at: string;
};

/**
 * `cache()` de React : un seul appel par requête, quel que soit le nombre de composants
 * qui demandent l'utilisateur. La barre de navigation, la page et les fonctions qu'elle
 * appelle le lisaient chacune de leur côté — autant d'allers-retours vers Supabase Auth,
 * les uns après les autres, pour un visiteur connecté.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  return data ? { ...data, email: user.email } : null;
});

/** À utiliser dans toute page réservée aux comptes connectés. */
export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect('/auth/login');
  return profile;
}
