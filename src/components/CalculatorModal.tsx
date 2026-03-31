'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Calculator from './Calculator';
import { X } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-medium mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-t-[3rem] p-8 pb-32 z-[71] shadow-2xl border border-white/20 dark:border-slate-700/50 flex flex-col h-[85vh] md:h-[80vh]"
          >
            {/* Close Handle / Button */}
            <div className="flex justify-center mb-4">
              <div 
                className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer" 
                onClick={onClose}
              />
            </div>

            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="text-2xl font-black font-headline dark:text-white">Finance Oracle</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculate your prosperity</p>
               </div>
               <button 
                 onClick={onClose} 
                 className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
               >
                 <X size={24} className="dark:text-white" />
               </button>
            </div>

            <div className="flex-1 overflow-hidden">
               <Calculator />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
