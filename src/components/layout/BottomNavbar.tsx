'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, User, Landmark } from 'lucide-react';

export default function BottomNavbar() {
  const pathname = usePathname();
  const linkClassName = (href: string) =>
    `flex flex-col items-center gap-1 transition-all duration-300 ${
      pathname === href
        ? 'text-primary dark:text-primary-fixed scale-110'
        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
    }`;

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-medium glass-nav bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-700/50 backdrop-blur-xl rounded-[2.5rem] py-4 px-8 flex justify-between items-center z-50 shadow-2xl shadow-primary/10 dark:shadow-black/40 transition-colors duration-500">
      <Link href="/personal" className={linkClassName('/personal')}>
        <Home size={24} />
      </Link>
      
      {/* Space for FAB */}
      <div className="w-8 h-8" />
      
      <Link href="/family" className={linkClassName('/family')}>
        <Users size={24} />
      </Link>
      
      <Link href="/profile" className={linkClassName('/profile')}>
        <User size={24} />
      </Link>
    </nav>
  );
}
