'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import LoadingScreen from '@/screens/LoadingScreen';
import BottomNav from '@/components/BottomNav';
import FAB from '@/components/FAB';
import AddRecordModal from '@/components/AddRecordModal';

type Theme = 'light' | 'dark';

type AppShellContextValue = {
  isLoggedIn: boolean;
  isReady: boolean;
  login: () => void;
  logout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  user?: any;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  refreshData: () => void;
  lastRefresh: number;
};

const protectedPaths = ['/personal', '/family', '/family-setup', '/profile'];
const AppShellContext = createContext<AppShellContextValue | null>(null);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setThemeState] = useState<Theme>('light');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(['Food', 'Housing', 'Transport', 'Leisure', 'Health', 'Shopping', 'Investment']);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const isLoggedIn = status === 'authenticated';

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setThemeState(storedTheme);
    }
    setMounted(true);
    const timer = window.setTimeout(() => setShowSplash(false), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [mounted, theme]);

  useEffect(() => {
    if (!mounted || status === 'loading') return;
    if (pathname === '/login' && isLoggedIn) {
      router.replace('/personal');
      return;
    }
    if (protectedPaths.includes(pathname) && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, mounted, status, pathname, router]);

  useEffect(() => {
    if (isLoggedIn) fetchCategories();
  }, [isLoggedIn]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/sheets/settings');
      const data = await res.json();
      if (data.categories?.length > 0) setCategories(data.categories);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleSaveRecord = async (record: any) => {
    try {
      let endpoint = '/api/sheets/expense';
      const body: any = { expense: record };

      if (record.type === 'Goal') {
        endpoint = '/api/sheets/goals';
        body.title = record.title;
        body.targetAmount = record.targetAmount;
        body.currentAmount = record.amount;
      } else if (record.type === 'Income') {
        // Income is just an expense with 'Income' category or special handling
        body.expense.category = 'Income';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setLastRefresh(Date.now());
      }
    } catch (err) {
      console.error('Failed to save record');
    }
  };

  const login = () => signIn('google');
  const logout = () => signOut({ callbackUrl: '/login' });
  const setTheme = (nextTheme: Theme) => setThemeState(nextTheme);
  const refreshData = () => setLastRefresh(Date.now());

  const value = useMemo(() => ({
    isLoggedIn,
    isReady: mounted && status !== 'loading',
    login,
    logout,
    theme,
    setTheme,
    user: session?.user,
    isAddModalOpen,
    setIsAddModalOpen,
    refreshData,
    lastRefresh,
  }), [isLoggedIn, mounted, status, theme, session, isAddModalOpen, lastRefresh]);

  if (!mounted || status === 'loading' || showSplash) {
    return <LoadingScreen />;
  }

  const showNav = isLoggedIn && protectedPaths.includes(pathname);

  return (
    <AppShellContext.Provider value={value}>
      <div className="min-h-screen bg-surface font-body text-on-surface transition-colors duration-500 dark:bg-slate-900 dark:text-white">
        {children}
        {showNav && (
          <>
            <FAB />
            <BottomNav />
          </>
        )}
        <AddRecordModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleSaveRecord}
          categories={categories}
        />
      </div>
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error('useAppShell must be used within AppShell.');
  return context;
}
