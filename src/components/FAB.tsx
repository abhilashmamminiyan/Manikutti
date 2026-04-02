'use client';

import { Plus, Calculator, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppShell } from './AppShell';

export default function FAB() {
  const { setIsCalculatorOpen } = useAppShell();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-8 z-[60] flex flex-col items-center gap-4">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={() => {
                setIsCalculatorOpen(true);
                setIsOpen(false);
              }}
              className="w-12 h-12 bg-white dark:bg-slate-800 text-primary rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700"
            >
              <Calculator size={22} />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={() => {
                // Calendar placeholder or modal
                setIsOpen(false);
              }}
              className="w-12 h-12 bg-white dark:bg-slate-800 text-primary rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700"
            >
              <Calendar size={22} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-slate-800 text-white rotate-45' : 'bg-primary text-white shadow-primary/40'
        }`}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
