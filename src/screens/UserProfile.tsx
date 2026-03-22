import { motion } from 'framer-motion';
import { Bell, Shield, LogOut, ChevronRight, Edit2, Mail, User, Sun, Moon } from 'lucide-react';

interface UserProfileProps {
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function UserProfile({ onLogout, theme, setTheme }: UserProfileProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-medium mx-auto px-6 pt-12 pb-32 dark:bg-on-surface"
    >
      <header className="flex justify-between items-center mb-16 px-2">
        <h2 className="text-xl font-bold font-headline text-primary dark:text-primary-fixed">The Heritage Ledger</h2>
        <button className="p-2 text-primary dark:text-primary-fixed">
          <Bell size={24} />
        </button>
      </header>

      <section className="flex flex-col items-center mb-16">
        <div className="relative mb-8">
          <div className="w-40 h-40 rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/20 rotate-3 group overflow-visible">
            <motion.div whileHover={{ rotate: 0 }} className="w-full h-full bg-white dark:bg-slate-800 rounded-[3rem] overflow-hidden border-4 border-white dark:border-slate-800">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAt_Xhhr6nejm0iEWr9ZJGEv2CN_InPdrU2wAmU1xPCe_z4TGkBQWK6uAftMMbKS9zviOT_-sfUCeTSNJjg2v9igDhJBZYGSujRyr4L0R8iJb20lLf1wQ2yL02ZYSOBYhgIq7YdsED7zzkDNrF6dACicDqXpKY62ve7pzU3eZxysOUSQ7f-XRyw3cns4KA_k1Kzu5IU1A4bTxH5qy4X84zF6v3ExWLRqLgVF7vE3xI1SB58pJjDvATe7zcdxHa6yT76dL4Rs2qX80cj" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-secondary text-on-secondary-container rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
              <Edit2 size={20} />
            </div>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-bold text-primary dark:text-primary-fixed uppercase tracking-[0.2em] opacity-60">Legacy Account</span>
          <h1 className="text-4xl font-extrabold font-headline mb-1 mt-1 dark:text-white">Manikutti</h1>
          <p className="text-on-surface-variant dark:text-slate-400 font-medium opacity-60">Primary Custodian</p>
        </div>
      </section>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-500 opacity-40 mb-1 ml-1">Account Holder Name</span>
                <div className="text-lg font-bold dark:text-white">Manikutti</div>
              </div>
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-500">
                 <User size={20} />
              </div>
           </div>

           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-500 opacity-40 mb-1 ml-1">Verified Family Email</span>
                <div className="text-sm font-bold truncate max-w-[200px] dark:text-white">manikutti.family@heritage.com</div>
              </div>
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary dark:text-primary-fixed">
                 <Mail size={20} />
              </div>
           </div>
        </div>

        {/* Theme Selector */}
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-[3xl] shadow-sm border border-slate-100 dark:border-slate-700 flex gap-2">
          <button 
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] transition-all duration-300 ${theme === 'light' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <Sun size={20} />
            <span className="font-bold">Light</span>
          </button>
          
          <button 
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] transition-all duration-300 ${theme === 'dark' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <Moon size={20} />
            <span className="font-bold">Dark</span>
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full bg-error text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-error/10 overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="flex items-center gap-4 relative z-10">
            <LogOut size={24} />
            <span className="text-xl font-bold font-headline">Logout from Sanctuary</span>
          </div>
          <ChevronRight size={24} className="relative z-10" />
        </motion.button>
      </div>

      <div className="mt-12 text-center text-[8px] font-bold text-on-surface-variant dark:text-slate-600 opacity-30 uppercase tracking-[0.2em]">
        Version 4.2.0 • Established 2023
      </div>
    </motion.div>
  );
}
