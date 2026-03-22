'use client';

import type { ReactNode } from 'react';

import { useAppShell } from '@/components/AppShell';

export default function ProtectedPage({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoggedIn } = useAppShell();

  if (!isLoggedIn) {
    return null;
  }

  return children;
}

