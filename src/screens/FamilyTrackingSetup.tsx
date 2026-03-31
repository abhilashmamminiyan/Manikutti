import { motion } from 'framer-motion';
import { PlusCircle, Search, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function FamilyTrackingSetup() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-medium mx-auto px-6 pt-12 pb-32 transition-colors duration-500"
    >
      <header className="mb-12 px-2">
        <h1 className="text-3xl font-black font-headline mb-3 dark:text-white">Setup Sanctuary</h1>
        <p className="text-on-surface-variant dark:text-slate-400 font-medium leading-relaxed max-w-[280px]">
          Connect your family members to begin tracking collective prosperity.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 mb-12">
        {/* Create Family */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-primary dark:bg-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/20 dark:shadow-black/40 relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
          <PlusCircle size={32} className="mb-6 opacity-80" />
          <h2 className="text-2xl font-bold font-headline mb-2">Create Family Sanctuary</h2>
          <p className="text-white/60 text-xs font-medium mb-8 leading-relaxed max-w-[200px]">
            Start a new legacy tracking group and invite your members.
          </p>
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>Get Started</span>
            <ArrowRight size={16} />
          </div>
        </motion.div>

        {/* Join Family / Invitation Info */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <Mail size={32} className="mb-6 text-primary dark:text-primary-fixed opacity-40 ml-1" />
          <h2 className="text-2xl font-bold font-headline mb-4 dark:text-white">Waiting for Invite?</h2>
          
          <div className="space-y-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              Family access is now via direct email invitation. Ask your family administrator to invite you using your Google email address.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Email</p>
              <p className="text-sm font-bold dark:text-white truncate">Check your inbox for a link.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <section className="bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <Lock size={20} />
          </div>
          <h3 className="font-bold text-emerald-900 dark:text-emerald-300">Vault-Grade Security</h3>
        </div>
        <p className="text-[10px] text-emerald-800/60 dark:text-emerald-400 font-bold uppercase tracking-widest leading-relaxed">
          Your family financial data is encrypted and accessible only by verified members.
        </p>
      </section>
    </motion.div>
  );
}
