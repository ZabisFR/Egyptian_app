import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';
import { login } from '../actions';

export const metadata: Metadata = {
  title: 'Connexion',
  // `robots` : ces pages n'ont rien à faire dans un index de recherche. Le robots.txt
  // les écarte déjà, mais il n'empêche pas l'indexation d'une URL trouvée ailleurs —
  // seul cet en-tête le fait.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex-1">
      <AuthForm mode="login" action={login} />
    </main>
  );
}
