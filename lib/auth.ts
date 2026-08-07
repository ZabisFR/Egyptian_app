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

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  return data ? { ...data, email: user.email } : null;
}

/** À utiliser dans toute page réservée aux comptes connectés. */
export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect('/auth/login');
  return profile;
}
