'use client';

import { Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppShell } from './AppShell';

export default function CalculatorFAB() {
  const { setIsCalculatorOpen } = useAppShell();

  return (
    <div className="fixed bottom-44 right-8 z-[60]">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCalculatorOpen(true)}
        className="w-14 h-14 bg-white dark:bg-slate-800 text-primary dark:text-primary-fixed rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 flex items-center justify-center border border-slate-100 dark:border-slate-700 transition-all duration-300"
      >
        <Calculator size={28} />
      </motion.button>
    </div>
  );
}
