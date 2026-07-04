'use client';

import LoginScreen from '@/screens/LoginScreen';
import AdminDashboard from '@/screens/AdminDashboard';
import { useAppShell } from '@/components/AppShell';

export default function HomePage() {
  const { isLoggedIn, login } = useAppShell();

  return isLoggedIn ? <AdminDashboard /> : <LoginScreen onLogin={login} />;
}

