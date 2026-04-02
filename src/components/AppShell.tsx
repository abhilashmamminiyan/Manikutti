'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import LoadingScreen from '@/screens/LoadingScreen';
import BottomNavbar from '@/components/layout/BottomNavbar';
import FAB from '@/components/FAB';
import CalculatorFAB from '@/components/CalculatorFAB';
import CalculatorModal from '@/components/CalculatorModal';
import AddRecordModal from '@/components/AddRecordModal';
import { Bell, X, AlertCircle, CheckCircle2, Landmark, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  categories: string[];
  incomeCategories: string[];
  updateCategories: (categories: string[], type?: 'Expense' | 'Income') => Promise<void>;
  pendingCount: number;
  setIsNotificationOpen: (open: boolean) => void;
  role: string;
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: (open: boolean) => void;
  prefillAmount: string;
  setPrefillAmount: (amount: string) => void;
  calculatorHistory: any[];
  fetchCalculatorHistory: () => Promise<void>;
  initialType: 'Expense' | 'Income' | 'Goal' | 'Monthly';
  setInitialType: (type: 'Expense' | 'Income' | 'Goal' | 'Monthly') => void;
};

const protectedPaths = ['/', '/personal', '/family', '/family-setup', '/profile'];
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
  const [incomeCategories, setIncomeCategories] = useState<string[]>(['Salary', 'Kadam', 'Investment', 'Other']);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [role, setRole] = useState('');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [prefillAmount, setPrefillAmount] = useState('');
  const [calculatorHistory, setCalculatorHistory] = useState<any[]>([]);
  const [initialType, setInitialType] = useState<'Expense' | 'Income' | 'Goal' | 'Monthly'>('Expense');
  const initializationRef = useRef(false);

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
    const initializeApp = async () => {
      if (!isLoggedIn) return;

      const lockKey = `manikutti_init_${session?.user?.email}`;
      const isLocked = window.localStorage.getItem(lockKey);
      
      // If we are already done, just fetch data
      if (isLocked === 'done') {
        fetchCategories();
        fetchPendingItems();
        return;
      }

      // If init is already in progress in this or another tab, wait
      if (initializationRef.current || isLocked === 'pending') return;

      initializationRef.current = true;
      window.localStorage.setItem(lockKey, 'pending');
      setIsInitializing(true);
      
      try {
        const res = await fetch('/api/sheets/init');
        if (res.ok) {
          window.localStorage.setItem(lockKey, 'done');
        } else {
          window.localStorage.removeItem(lockKey);
          initializationRef.current = false;
        }
      } catch (error) {
        window.localStorage.removeItem(lockKey);
        initializationRef.current = false;
      } finally {
        setIsInitializing(false);
        // FETCH DATA ONLY AFTER INIT FINISHES
        fetchCategories();
        fetchPendingItems();
      }
    };

    initializeApp();
  }, [isLoggedIn, session?.user?.email, lastRefresh]);

  const fetchPendingItems = async () => {
    try {
      const familyRes = await fetch('/api/sheets/family');
      const familyData = await familyRes.json();
      if (!familyData.familyCode) return;
      setRole(familyData.role || '');

      const monthlyRes = await fetch(`/api/sheets/monthly?familyCode=${familyData.familyCode}`);
      const monthlyData = await monthlyRes.json();
      
      const today = new Date();
      const currentMonth = today.getUTCMonth();
      const currentYear = today.getUTCFullYear();

      const pending = (monthlyData.items || []).filter((item: any) => {
        if (!item.lastPaidDate) return true;
        const lastPaid = new Date(item.lastPaidDate);
        const isThisMonth = lastPaid.getUTCMonth() === currentMonth && lastPaid.getUTCFullYear() === currentYear;
        return !isThisMonth;
      });

      setPendingItems(pending);
    } catch (err) {
      console.error('Failed to fetch pending items');
    }
  };

  const fetchCalculatorHistory = async () => {
    try {
      const res = await fetch('/api/sheets/calculator');
      const data = await res.json();
      if (data.history) setCalculatorHistory(data.history);
    } catch (err) {
      console.error('Failed to fetch calculator history');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/sheets/settings');
      const data = await res.json();
      if (data.categories?.length > 0) setCategories(data.categories);
      if (data.incomeCategories?.length > 0) setIncomeCategories(data.incomeCategories);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleSaveRecord = async (record: any) => {
    try {
      let endpoint = '/api/sheets/expense';
      let body: any = { 
        sheetName: record.sheetName || 'Personal_Expenses',
        expense: record 
      };

      if (record.type === 'Goal') {
        endpoint = '/api/sheets/goals';
        body = {
          title: record.title,
          targetAmount: record.targetAmount,
          currentAmount: record.amount
        };
      } else if (record.type === 'Income') {
        // Income ALWAYS goes to Personal_Expenses in this logic, 
        // but let's respect the sheetName if provided.
        body.sheetName = 'Personal_Expenses'; 
        body.expense.category = record.category || 'Income';
        body.expense.type = 'Income';
      } else if (record.type === 'Monthly') {
        const familyRes = await fetch('/api/sheets/family');
        const familyData = await familyRes.json();
        
        endpoint = '/api/sheets/monthly';
        body = {
          title: record.title,
          amount: record.amount,
          dueDay: record.dueDay,
          familyCode: familyData.familyCode
        };
      } else if (record.type === 'Expense') {
        if (body.sheetName === 'Family_Expenses') {
          const familyRes = await fetch('/api/sheets/family');
          const familyData = await familyRes.json();
          body.familyCode = familyData.familyCode;
          body.expense.type = 'Expense';
        } else {
          body.expense.type = 'Expense';
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setLastRefresh(Date.now());
        
        const recordCategory = record.category;
        if (recordCategory && !['EMI', 'Family Investment'].includes(recordCategory)) {
          if (record.type === 'Income') {
             if (!incomeCategories.includes(recordCategory)) {
               const newIncomes = [...incomeCategories, recordCategory];
               await updateCategories(newIncomes, 'Income');
             }
          } else if (record.type === 'Expense') {
             if (!categories.includes(recordCategory)) {
               const newExpenses = [...categories, recordCategory];
               await updateCategories(newExpenses, 'Expense');
             }
          }
        }
      }
    } catch (err) {
      console.error('Failed to save record:', err);
    }
  };

  const updateCategories = async (newCategories: string[], type: 'Expense' | 'Income' = 'Expense') => {
    try {
      const payload = type === 'Expense' 
        ? { categories: newCategories, incomeCategories } 
        : { categories, incomeCategories: newCategories };

      const res = await fetch('/api/sheets/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (type === 'Expense') setCategories(newCategories);
        else setIncomeCategories(newCategories);
      }
    } catch (err) {
      console.error('Failed to update categories');
    }
  };

  const login = () => signIn('google');
  const logout = () => signOut({ callbackUrl: '/login' });
  const setTheme = (nextTheme: Theme) => setThemeState(nextTheme);
  const refreshData = () => setLastRefresh(Date.now());

  const value = useMemo(() => ({
    isLoggedIn,
    isReady: mounted && status !== 'loading' && !isInitializing,
    login,
    logout,
    theme,
    setTheme,
    user: session?.user,
    isAddModalOpen,
    setIsAddModalOpen,
    refreshData,
    lastRefresh,
    categories,
    incomeCategories,
    updateCategories,
    pendingCount: pendingItems.length,
    setIsNotificationOpen,
    role,
    isCalculatorOpen,
    setIsCalculatorOpen,
    prefillAmount,
    setPrefillAmount,
    calculatorHistory,
    fetchCalculatorHistory,
    initialType,
    setInitialType,
  }), [isLoggedIn, mounted, status, theme, session, isAddModalOpen, lastRefresh, categories, incomeCategories, pendingItems, role, isCalculatorOpen, prefillAmount, calculatorHistory, initialType]);

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
            <BottomNavbar />

            {/* Notification Backdrop */}
            <AnimatePresence>
              {isNotificationOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsNotificationOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="fixed top-24 left-6 right-6 bottom-32 max-w-medium mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] p-8 z-[61] shadow-2xl border border-white/20 dark:border-slate-700/50 flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-2xl font-black font-headline dark:text-white">Pending Dues</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time to settle up</p>
                      </div>
                      <button onClick={() => setIsNotificationOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X size={24} className="dark:text-white" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-8">
                      {pendingItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                          <CheckCircle2 size={48} className="text-emerald-500" />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All clear for this month!</p>
                        </div>
                      ) : (
                        pendingItems.map((item) => (
                          <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-500">
                                <Landmark size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold dark:text-white">{item.title}</h4>
                                <p className="text-[10px] font-bold text-red-400 uppercase">Due Day: {item.dueDay}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block font-black dark:text-white">₹{item.amount.toLocaleString()}</span>
                              <button 
                                onClick={() => {
                                   setIsNotificationOpen(false);
                                   router.push('/family');
                                }}
                                className="text-[8px] font-black text-primary uppercase tracking-widest"
                              >
                                View Dashboard
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <p className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-slate-800">
                      Notifications reset on the 1st of every month
                    </p>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
        <AddRecordModal 
          isOpen={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            setPrefillAmount('');
          }} 
          onSave={handleSaveRecord}
          categories={categories}
          incomeCategories={incomeCategories}
          initialType={initialType}
        />
        <CalculatorModal 
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
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
