'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TrendingUp, TrendingDown, Target } from 'lucide-react';

type RecordType = 'Expense' | 'Income' | 'Goal';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  categories: string[];
}

export default function AddRecordModal({ isOpen, onClose, onSave, categories }: AddRecordModalProps) {
  const [type, setType] = useState<RecordType>('Expense');
  const [amount, setAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Food');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!amount && type !== 'Goal') return;
    if (type === 'Goal' && (!title || !targetAmount)) return;

    setIsSaving(true);
    try {
      const data = {
        type,
        amount: parseFloat(amount) || 0,
        targetAmount: parseFloat(targetAmount) || 0,
        category,
        title: title || note,
        note,
        date: new Date().toISOString()
      };
      await onSave(data);
      setAmount('');
      setTargetAmount('');
      setTitle('');
      setNote('');
      onClose();
    } catch (error) {
      console.error('Failed to save record:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 pb-32 z-50 max-w-medium mx-auto shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black font-headline dark:text-white">Record prosperity</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={24} className="dark:text-white" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2 mb-8 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl">
              {(['Expense', 'Income', 'Goal'] as RecordType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
                    type === t 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-primary-fixed' 
                      : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t === 'Expense' && <TrendingDown size={14} />}
                    {t === 'Income' && <TrendingUp size={14} />}
                    {t === 'Goal' && <Target size={14} />}
                    {t}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {type === 'Goal' ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="e.g. New Car, Vacation"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black dark:text-white">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 pl-10 text-2xl font-black dark:text-white outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {type === 'Goal' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black dark:text-white">$</span>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 pl-10 text-2xl font-black dark:text-white outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {type !== 'Goal' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-bold dark:text-white outline-none appearance-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-bold dark:text-white outline-none"
                  placeholder="Additional details..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || (type !== 'Goal' && !amount) || (type === 'Goal' && (!title || !targetAmount))}
                className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={24} />
                    Commit to Ledger
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
