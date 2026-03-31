'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Calendar, CheckCircle2, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { useAppShell } from '@/components/AppShell';
import LoadingScreen from './LoadingScreen';

import Header from '@/components/layout/Header';

export default function EMIScreen() {
  const { lastRefresh } = useAppShell();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [familyCode, setFamilyCode] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [lastRefresh]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const familyRes = await fetch('/api/sheets/family');
      const familyData = await familyRes.json();
      setFamilyCode(familyData.familyCode);

      if (familyData.familyCode) {
        const emiRes = await fetch(`/api/sheets/emi?familyCode=${familyData.familyCode}`);
        const emiData = await emiRes.json();
        setItems(emiData.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch EMI data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (item: any) => {
    try {
      const newPaidMonths = (item.paidMonths || 0) + 1;
      const currentDueDate = new Date(item.dueDate);
      const nextDueDate = new Date(currentDueDate.setMonth(currentDueDate.getMonth() + 1)).toISOString().split('T')[0];
      
      const res = await fetch('/api/sheets/emi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: newPaidMonths >= item.tenure ? 'Completed' : 'Paid',
          paidMonths: newPaidMonths,
          dueDate: nextDueDate
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update EMI');
    }
  };

  const emis = useMemo(() => items.filter(i => i.type === 'EMI'), [items]);
  const bills = useMemo(() => items.filter(i => i.type === 'Bill'), [items]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-medium mx-auto px-6 pt-12 pb-32"
    >
      <Header 
        title="EMI & Commitments" 
        subtitle="Financial Backbone"
        icon={<Landmark size={20} />}
      />

      {/* EMI Section */}
      <section className="mb-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
          Active EMIs <span className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px]">{emis.length}</span>
        </h3>
        
        <div className="space-y-4">
          {emis.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
               <Landmark size={24} className="mx-auto text-slate-300 mb-2" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active EMIs tracked</p>
            </div>
          ) : (
            emis.map((emi) => (
              <div key={emi.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold dark:text-white mb-1">{emi.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                       <Calendar size={12} />
                       Next: {new Date(emi.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-black dark:text-white">₹{emi.monthlyPayment.toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Monthly</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase">{emi.paidMonths} / {emi.tenure} Months</span>
                    <span className="text-[10px] font-black text-slate-400">{Math.round((emi.paidMonths / emi.tenure) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(emi.paidMonths / emi.tenure) * 100}%` }}
                      className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => handleMarkAsPaid(emi)}
                  className="w-full py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-100 dark:border-slate-700"
                >
                  <CheckCircle2 size={14} />
                  Mark {new Date().toLocaleDateString(undefined, { month: 'long' })} Paid
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Mandatory Bills */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
          Mandatory Bills <span className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px]">{bills.length}</span>
        </h3>
        
        <div className="space-y-3">
          {bills.length === 0 ? (
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-4">All current bills clear</p>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
                       <AlertCircle size={20} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold dark:text-white">{bill.title}</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="font-extrabold text-sm dark:text-white">₹{bill.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => handleMarkAsPaid(bill)}
                      className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                       <Plus size={16} />
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
