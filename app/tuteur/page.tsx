import Link from 'next/link';
import type { Metadata } from 'next';
import ChatTutor from '@/components/ChatTutor';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CHAT_LIMITS, CHAT_TIMEZONE } from '@/lib/chat-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tuteur IA',
  description:
    'Pose tes questions sur l’arabe égyptien à un tuteur IA : chaque réponse en arabe, en Arabizi et en français, avec la correction de tes phrases.',
};

/** Date du jour à Paris, au format de la colonne `chat_usage.day` (AAAA-MM-JJ). */
function todayInParis() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CHAT_TIMEZONE }).format(new Date());
}

export default async function TuteurPage() {
  const user = await getUser();

  let remaining: number | null = null;
  if (user) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chat_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('day', todayInParis())
      .maybeSingle<{ count: number }>();
    // Table absente (migration non appliquée) ou lecture en échec : on n'affiche pas de
    // compteur plutôt qu'un chiffre faux. La route, elle, refusera proprement.
    if (error) console.error('Tuteur : compteur illisible :', error.message);
    else remaining = Math.max(0, CHAT_LIMITS.dailyMessages - (data?.count ?? 0));
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-8">
      <p className="cartouche">Tuteur IA</p>
      <h1 className="display mt-4 text-4xl sm:text-5xl">
        Pose ta question à <span className="pop-hl pop-tone-turquoise">Ostaz</span>
      </h1>
      <p className="mt-3 max-w-xl text-[var(--muted)]">
        Un tuteur qui parle l’égyptien du Caire : chaque réponse en arabe, en Arabizi et en
        français. Écris-lui une phrase, il la corrige.
      </p>

      {user ? (
        <>
          <ChatTutor initialRemaining={remaining} />
          <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
            Le tuteur est une IA (Google Gemini) : il peut se tromper, vérifie avec les
            leçons en cas de doute. Tes messages sont envoyés à Google pour produire la
            réponse : n’y écris pas d’informations personnelles.{' '}
            {CHAT_LIMITS.dailyMessages} messages par jour.{' '}
            <Link href="/confidentialite#tuteur" className="underline underline-offset-2">
              En savoir plus
            </Link>
          </p>
        </>
      ) : (
        <div className="card-sand mt-8 p-6">
          <h2 className="display text-xl">Connecte-toi pour discuter avec le tuteur</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Le tuteur est réservé aux comptes, gratuits : {CHAT_LIMITS.dailyMessages}{' '}
            messages par jour.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/auth/login" className="btn-sand">
              Se connecter
            </Link>
            <Link href="/auth/signup" className="btn-outline">
              Créer un compte
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
