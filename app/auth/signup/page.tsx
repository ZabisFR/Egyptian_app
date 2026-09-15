import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';
import { signup } from '../actions';

export const metadata: Metadata = {
  title: 'Créer un compte',
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <main className="flex-1">
      <AuthForm mode="signup" action={signup} />
    </main>
  );
}
