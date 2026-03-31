'use client';

import { useState } from 'react';
import { useAppShell } from './AppShell';
import { Plus, X, Settings, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategorySection() {
  const { categories, incomeCategories, updateCategories } = useAppShell();
  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentCategories = activeTab === 'Expense' ? categories : incomeCategories;

  const handleAddCategory = async () => {
    if (!newCategory.trim() || currentCategories.includes(newCategory.trim())) return;
    
    setIsSaving(true);
    const updated = [...currentCategories, newCategory.trim()];
    await updateCategories(updated, activeTab);
    setNewCategory('');
    setIsSaving(false);
  };

  const handleDeleteCategory = async (cat: string) => {
    setIsSaving(true);
    const updated = currentCategories.filter(c => c !== cat);
    await updateCategories(updated, activeTab);
    setIsSaving(false);
  };

  return (
    <section className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Settings size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black font-headline dark:text-white leading-none">Category Ledger</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Classifications</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl">
        {(['Expense', 'Income'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-primary-fixed' 
                : 'text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <button
          onClick={handleAddCategory}
          disabled={isSaving || !newCategory.trim()}
          className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode='popLayout'>
          {currentCategories.map((cat) => (
            <motion.div
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              key={cat}
              className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 group transition-all hover:border-primary/30"
            >
              <span className="text-xs font-bold dark:text-white">{cat}</span>
              <button
                onClick={() => handleDeleteCategory(cat)}
                disabled={isSaving}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {currentCategories.length === 0 && (
        <div className="text-center py-8 opacity-40">
           <p className="text-xs font-bold dark:text-white uppercase tracking-widest">No categories defined in the ledger</p>
        </div>
      )}
    </section>
  );
}
