'use client';

import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, LogOut, ShieldCheck, Mail, Calendar, Settings } from 'lucide-react';
import CategorySection from '@/components/CategorySection';

import Header from '@/components/layout/Header';

export default function ProfileScreen() {
  const { data: session } = useSession();

  return (
    <div className="max-w-medium mx-auto px-6 pt-12 pb-32">
      <Header title="My Profile" className="mb-8" />
      
      <div className="text-center mb-12">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-[3.5rem] bg-gradient-to-br from-primary to-accent p-1 shadow-2xl">
            <div className="w-full h-full rounded-[3.4rem] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-slate-200" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center text-primary border border-slate-50 dark:border-slate-700">
             <ShieldCheck size={20} />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-black dark:text-white">{session?.user?.name}</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">A Member</p>
      </div>

      <div className="space-y-4 mb-12">
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400">
              <Mail size={20} />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
              <p className="text-sm font-bold dark:text-white">{session?.user?.email}</p>
           </div>
        </div>
      </div>

      <div className="mb-12">
        <CategorySection />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-[2rem] font-bold text-slate-600 dark:text-slate-400 flex flex-col items-center gap-2">
           <Settings size={20} />
           <span className="text-[10px] uppercase tracking-widest">Settings</span>
        </button>
        <button 
          onClick={() => signOut()}
          className="bg-red-50 dark:bg-red-900/20 p-6 rounded-[2rem] font-bold text-red-500 flex flex-col items-center gap-2"
        >
           <LogOut size={20} />
           <span className="text-[10px] uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
