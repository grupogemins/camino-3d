import { Suspense } from 'react';
import { AuthForm } from './AuthForm';

export const metadata = { title: 'Entrar ou criar conta' };

export default function EntrarPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
