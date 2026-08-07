'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string; notice?: string };

// Les messages de Supabase sont en anglais et parfois cryptiques ; on ne traduit que ceux
// qu'un utilisateur peut réellement provoquer, le reste passe tel quel.
const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email not confirmed': "Compte non confirmé : ouvrez le lien reçu par email.",
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Password should be at least 6 characters':
    'Le mot de passe doit faire au moins 6 caractères.',
};

const translate = (message: string) => MESSAGES[message] ?? message;

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Email et mot de passe requis.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: translate(error.message) };

  revalidatePath('/', 'layout');
  redirect('/profile');
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();

  if (!email || !password) return { error: 'Email et mot de passe requis.' };
  if (password.length < 6)
    return { error: 'Le mot de passe doit faire au moins 6 caractères.' };

  const origin = (await headers()).get('origin') ?? 'http://localhost:3000';
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: translate(error.message) };

  // Si la confirmation par email est activée dans Supabase, signUp ne renvoie pas de
  // session : il n'y a rien à rediriger tant que le lien n'est pas ouvert.
  if (!data.session) {
    return {
      notice: `Compte créé. Ouvrez le lien de confirmation envoyé à ${email}.`,
    };
  }

  revalidatePath('/', 'layout');
  redirect('/profile');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
