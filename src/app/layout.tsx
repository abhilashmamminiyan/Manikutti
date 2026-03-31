import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import '../index.css';
import AppShell from '@/components/AppShell';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Manikutti',
  description: 'Finance tracking app migrated to Next.js.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
