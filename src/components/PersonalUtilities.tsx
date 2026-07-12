'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Plus, Trash2, CheckCircle2, Edit2, Zap } from 'lucide-react';
import { useAppShell } from '@/components/AppShell';

export default function PersonalUtilities() {
  const { lastRefresh, setLastRefresh } = useAppShell();
  const [utilities, setUtilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUtilities();
  }, [lastRefresh]);

  const fetchUtilities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sheets/utilities');
      const data = await res.json();
      if (data.items) setUtilities(data.items);
    } catch (err) {
      console.error('Failed to fetch utilities');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async (util: any) => {
    if (!window.confirm(`Mark ${util.title} as paid?`)) return;
    try {
      const res = await fetch('/api/sheets/utilities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: util.id,
          paidDate: new Date().toISOString()
        })
      });
      if (res.ok) setLastRefresh(Date.now());
    } catch (err) {
      console.error('Failed to pay utility');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this utility tracker?')) return;
    try {
      const res = await fetch(`/api/sheets/utilities?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) setLastRefresh(Date.now());
    } catch (err) {
      console.error('Failed to delete utility');
    }
  };

  const calculateDaysLeft = (nextDueDate: string) => {
    if (!nextDueDate) return null;
    const due = new Date(nextDueDate);
    const today = new Date();
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  if (isLoading && utilities.length === 0) return null;

  if (utilities.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Zap size={16} /> My Utilities
        </h3>
      </div>
      
      <div className="grid gap-4">
        {utilities.map((util) => {
          const daysLeft = calculateDaysLeft(util.nextDueDate);
          const isOverdue = daysLeft !== null && daysLeft < 0;

          return (
            <motion.div 
              key={util.id}
              className="bg-white dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Wifi size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm dark:text-white">{util.title}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => handlePay(util)} className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-lg hover:scale-105 transition-transform">
                      <CheckCircle2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(util.id)} className="text-red-500 bg-red-50 dark:bg-red-900/30 p-1.5 rounded-lg hover:scale-105 transition-transform">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <span className="text-lg font-black dark:text-white">₹{util.amount}</span>
                    <span className="text-[10px] text-slate-400 ml-1">/ {util.validity}</span>
                  </div>
                  {daysLeft !== null && (
                    <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {isOverdue ? `${Math.abs(daysLeft)} Days Overdue` : `${daysLeft} Days Left`}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
