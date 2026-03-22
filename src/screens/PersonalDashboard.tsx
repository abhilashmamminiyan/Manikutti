'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Bell, ShoppingBag, Edit2, AlertCircle, LogOut, Target, TrendingUp } from 'lucide-react';
import { useAppShell } from '@/components/AppShell';

export default function PersonalDashboard() {
  const { setIsAddModalOpen, logout, lastRefresh, user: sessionUser } = useAppShell();
  const session = { user: sessionUser }; // Backwards compat for code below
  const [expenses, setExpenses] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['Food', 'Housing', 'Transport', 'Leisure', 'Health', 'Shopping']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchGoals();
  }, [lastRefresh]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [res, famRes] = await Promise.all([
        fetch('/api/sheets/expense?sheetName=Personal_Expenses'),
        fetch('/api/sheets/expense?sheetName=Family_Expenses')
      ]);
      
      const [data, famData] = await Promise.all([res.json(), famRes.json()]);

      let allExpenses = [...(data.expenses || [])];
      
      if (famData.expenses) {
        // Find investments (expenses paid by me in the family sheet)
        const familyInvestments = famData.expenses.filter((e: any) => e.paidBy === session?.user?.email);
        allExpenses = [...allExpenses, ...familyInvestments.map((e: any) => ({ ...e, category: 'Family Investment' }))];
      }

      setExpenses(allExpenses);
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/sheets/goals');
      const data = await res.json();
      if (data.goals) setGoals(data.goals);
    } catch (err) {
      console.error('Failed to fetch goals');
    }
  };

  const spendingData = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    const colors = ['#006972', '#fdd34d', '#ff9fba', '#00535b', '#7c4dff', '#ff5252'];
    return Object.entries(totals).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [expenses]);

  const totalProsperity = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  if (isLoading && expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 animate-pulse">Consulting the Ledger...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-medium mx-auto px-6 pt-12 pb-32"
    >
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-xl font-bold font-headline text-primary dark:text-primary-fixed">The Heritage Ledger</h1>
        <div className="flex gap-2">
          <button className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-primary dark:text-primary-fixed border border-slate-100 dark:border-slate-700">
            <Bell size={24} />
          </button>
          <button 
            onClick={logout}
            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-red-500 border border-slate-100 dark:border-slate-700"
          >
            <LogOut size={24} />
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl mb-8 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      <section className="mb-12 px-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Personal Prosperity Portfolio</span>
        <div className="flex items-baseline gap-1 mt-1">
          <h2 className="text-5xl font-extrabold font-headline dark:text-white">${totalProsperity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <TrendingUp className="text-primary" size={24} />
        </div>
      </section>

      {/* Goals Progress */}
      {goals.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Goal Progress</h3>
          </div>
          <div className="grid gap-4">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Target size={20} />
                    </div>
                    <span className="font-bold text-sm dark:text-white">{goal.title}</span>
                  </div>
                  <span className="text-xs font-black text-primary">${goal.currentAmount}/${goal.targetAmount}</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spending Chart */}
      {expenses.length > 0 && (
        <section className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 mb-12">
          <div className="h-64 relative mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={spendingData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                  {spendingData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black font-headline dark:text-white">{expenses.length}</span>
              <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Entries</span>
            </div>
          </div>
        </section>
      )}

      {/* Recent Expenses */}
      <section className="mb-8 px-2 flex justify-between items-center">
        <h3 className="text-lg font-bold font-headline dark:text-white">Recent Records</h3>
        <button onClick={() => setIsAddModalOpen(true)} className="p-2 bg-primary/10 text-primary rounded-xl">
           <Edit2 size={16} />
        </button>
      </section>

      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center p-12 opacity-40">
            <span className="text-sm font-bold dark:text-white">No records found. Bloom beautifully.</span>
          </div>
        ) : (
          [...expenses].reverse().map((expense, idx) => (
            <motion.div 
              key={idx} 
              whileHover={{ x: 5 }}
              className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-slate-50 dark:border-slate-700/50 shadow-sm"
            >
               <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center">
                  <ShoppingBag size={20} className="text-slate-400" />
               </div>
               <div className="flex-1">
                  <h4 className="font-bold text-sm dark:text-white">{expense.category}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(expense.date).toLocaleDateString()}</p>
               </div>
               <div className="text-right">
                  <div className="font-bold text-sm dark:text-white">-${expense.amount.toFixed(2)}</div>
               </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
