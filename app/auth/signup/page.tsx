import AuthForm from '@/components/AuthForm';
import { signup } from '../actions';

export default function SignupPage() {
  return (
    <main className="flex-1">
      <AuthForm mode="signup" action={signup} />
    </main>
  );
}
