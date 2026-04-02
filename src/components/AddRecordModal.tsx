'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useAppShell } from './AppShell';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

type RecordType = 'Expense' | 'Income' | 'Goal' | 'Monthly';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  categories: string[];
  incomeCategories: string[];
  role?: string;
  initialType?: RecordType;
}

export default function AddRecordModal({ 
  isOpen, 
  onClose, 
  onSave, 
  categories, 
  incomeCategories, 
  role,
  initialType = 'Expense' 
}: AddRecordModalProps) {
  const [type, setType] = useState<RecordType>(initialType);
  const [amount, setAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setIsOthersSelected(false);
      if (initialType === 'Income') setCategory(incomeCategories[0] || 'Salary');
      else if (initialType === 'Expense') setCategory(categories[0] || 'Food');
    }
  }, [isOpen, initialType, incomeCategories, categories]);
  const [category, setCategory] = useState(type === 'Income' ? (incomeCategories[0] || 'Salary') : (categories[0] || 'Food'));
  const [customCategory, setCustomCategory] = useState('');
  const [isOthersSelected, setIsOthersSelected] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { prefillAmount } = useAppShell();

  const pathname = usePathname();

  useEffect(() => {
    if (isOpen && prefillAmount) {
      setAmount(prefillAmount);
    }
  }, [isOpen, prefillAmount]);
  
  // Monthly fields
  const [dueDay, setDueDay] = useState('1');

  const handleSave = async () => {
    if (!amount && type !== 'Goal') return;
    if (type === 'Goal' && (!title || !targetAmount)) return;

    setIsSaving(true);
    try {
      const finalCategory = isOthersSelected ? customCategory : category;
      if (isOthersSelected && !customCategory) return;

      const data = {
        type,
        amount: parseFloat(amount) || 0,
        targetAmount: parseFloat(targetAmount) || 0,
        category: type === 'Monthly' ? 'Monthly' : finalCategory,
        title: title || note,
        note,
        date: new Date().toISOString(),
        isPaid: type !== 'Expense',
        dueDay: parseInt(dueDay) || 1,
        sheetName: pathname === '/family' ? 'Family_Expenses' : 'Personal_Expenses'
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
            <div className="flex gap-2 mb-8 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl overflow-x-auto no-scrollbar">
              {(['Expense', 'Income', 'Goal', 'Monthly'] as RecordType[])
                .filter(t => (t !== 'Monthly' && t !== 'Expense') || role === 'Admin' || !role) 
                .map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setIsOthersSelected(false);
                    if (t === 'Income') setCategory(incomeCategories[0] || 'Salary');
                    else if (t === 'Expense') setCategory(categories[0] || 'Food');
                  }}
                  className={`flex-none px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                    type === t 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-primary-fixed' 
                      : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t === 'Expense' && <TrendingDown size={14} />}
                    {t === 'Income' && <TrendingUp size={14} />}
                    {t === 'Goal' && <Target size={14} />}
                    {t === 'Monthly' && <Save size={14} />}
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black dark:text-white">₹</span>
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black dark:text-white">₹</span>
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

              {type === 'Monthly' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Monthly Expense Name</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-bold dark:text-white"
                      placeholder="e.g. Rent, Internet, Maid"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Due Day (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-bold dark:text-white"
                      placeholder="1"
                    />
                  </div>
                </>
              )}

              {type !== 'Goal' && type !== 'Monthly' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                  <select
                    value={isOthersSelected ? 'Others' : category}
                    onChange={(e) => {
                      if (e.target.value === 'Others') {
                        setIsOthersSelected(true);
                      } else {
                        setIsOthersSelected(false);
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-bold dark:text-white outline-none appearance-none"
                  >
                    {(type === 'Income' ? incomeCategories : categories).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Others">Others</option>
                  </select>

                  {isOthersSelected && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4"
                    >
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Enter Custom Category</label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-sm font-bold dark:text-white outline-none"
                        placeholder="e.g. Gifts, Charity"
                        autoFocus
                      />
                    </motion.div>
                  )}
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
                disabled={isSaving || 
                  (type === 'Expense' && !amount) || 
                  (type === 'Income' && !amount) ||
                  (type === 'Goal' && (!title || !targetAmount)) ||
                  (type === 'Monthly' && (!title || !amount || !dueDay)) ||
                  (isOthersSelected && !customCategory)
                }
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
