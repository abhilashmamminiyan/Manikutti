'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Bell, Users, Plus, Calendar, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAppShell } from '@/components/AppShell';
import { useRouter } from 'next/navigation';

export default function FamilyDashboard() {
  const { isAddModalOpen, setIsAddModalOpen } = useAppShell();
  const [data, setData] = useState<any>({ expenses: [], members: [], emis: [], role: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchFamilyStatus();
  }, []);

  const fetchFamilyStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sheets/family');
      const familyData = await res.json();
      
      if (!familyData.familyCode) {
        router.push('/family-setup');
        return;
      }

      // Fetch expenses and emis
      const [expRes, emiRes] = await Promise.all([
        fetch(`/api/sheets/expense?sheetName=Family_Expenses&familyCode=${familyData.familyCode}`),
        fetch(`/api/sheets/emi?familyCode=${familyData.familyCode}`)
      ]);

      const expData = await expRes.json();
      const emiData = await emiRes.json();

      setData({
        familyCode: familyData.familyCode,
        members: familyData.members,
        role: familyData.role,
        expenses: expData.expenses || [],
        emis: emiData.items || []
      });
    } catch (err) {
      setError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayEmi = async (id: number) => {
    try {
      await fetch('/api/sheets/emi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Paid' }),
      });
      fetchFamilyStatus();
    } catch (err) {
      console.error('Failed to update EMI');
    }
  };

  const memberSpending = useMemo(() => {
    const totals: Record<string, number> = {};
    data.expenses.forEach((e: any) => {
      totals[e.paidBy] = (totals[e.paidBy] || 0) + e.amount;
    });
    const colors = ['#006972', '#fdd34d', '#7c4dff', '#ff5252'];
    return Object.entries(totals).map(([name, value], i) => ({
      name: name.split('@')[0],
      value,
      color: colors[i % colors.length]
    }));
  }, [data.expenses]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Consulting the Clan...</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-medium mx-auto px-6 pt-12 pb-32"
    >
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-headline dark:text-white">Family Prosperity</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clan Code: {data.familyCode}</span>
          </div>
        </div>
        <button className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
          <Sparkles size={20} className="text-amber-400" />
        </button>
      </header>

      {/* Shared Analysis */}
      <section className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Individual Incomes vs Expenses</h3>
        <div className="h-48 relative">
           <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={memberSpending} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10}>
                  {memberSpending.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
           </ResponsiveContainer>
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black dark:text-white">${data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0).toLocaleString()}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Shared</span>
           </div>
        </div>
      </section>

      {/* EMI & Bills */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Upcoming Commitments</h3>
          {data.role === 'Admin' && (
             <button className="p-2 bg-primary text-white rounded-lg">
               <Plus size={16} />
             </button>
          )}
        </div>
        
        <div className="space-y-3">
          {data.emis.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
               <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No EMI artifacts found</p>
            </div>
          ) : (
            data.emis.map((emi: any) => (
              <div key={emi.id} className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.01]">
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${emi.status === 'Paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                      {emi.status === 'Paid' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                   </div>
                   <div>
                      <h4 className="text-sm font-bold dark:text-white">{emi.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Due: {new Date(emi.dueDate).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="text-right flex items-center gap-4">
                   <span className="font-extrabold text-sm dark:text-white">${emi.amount.toLocaleString()}</span>
                   {emi.status === 'Unpaid' && (
                     <button 
                       onClick={() => handlePayEmi(emi.id)}
                       className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-400 transition-colors"
                     >
                        <Plus size={16} className="rotate-45" />
                     </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
