import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Les Server Components ne peuvent pas écrire de cookies : sans ce middleware, un token
// expiré ne serait jamais rafraîchi et l'utilisateur serait déconnecté silencieusement.
export async function middleware(request: NextRequest) {
  // Pas de cookie de session Supabase (`sb-…-auth-token`) : visiteur anonyme, rien à
  // rafraîchir. On évite alors de monter un client pour chaque page et chaque préchargement.
  if (!request.cookies.getAll().some((c) => c.name.startsWith('sb-'))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Ni les fichiers statiques, ni les sons, ni robots/sitemap/manifeste : aucun n'a besoin
  // d'une session.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|txt|xml|json)$).*)',
  ],
};
