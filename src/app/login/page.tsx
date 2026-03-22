'use client';

import LoginScreen from '@/screens/LoginScreen';
import { useAppShell } from '@/components/AppShell';

export default function LoginPage() {
  const { isLoggedIn, login } = useAppShell();

  if (isLoggedIn) {
    return null;
  }

  return <LoginScreen onLogin={login} />;
}

