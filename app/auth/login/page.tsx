import AuthForm from '@/components/AuthForm';
import { login } from '../actions';

export default function LoginPage() {
  return (
    <main className="flex-1">
      <AuthForm mode="login" action={login} />
    </main>
  );
}
