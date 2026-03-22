'use client';

import LoginScreen from '@/screens/LoginScreen';
import PersonalDashboard from '@/screens/PersonalDashboard';
import { useAppShell } from '@/components/AppShell';

export default function HomePage() {
  const { isLoggedIn, login } = useAppShell();

  return isLoggedIn ? <PersonalDashboard /> : <LoginScreen onLogin={login} />;
}

