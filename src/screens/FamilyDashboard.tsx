'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users, Plus, Calendar, CheckCircle2, AlertCircle, Sparkles, X, Mail } from 'lucide-react';
import { useAppShell } from '@/components/AppShell';
import Header from '@/components/layout/Header';
import { useRouter } from 'next/navigation';
import LoadingScreen from './LoadingScreen';

export default function FamilyDashboard() {
  const { isAddModalOpen, setIsAddModalOpen, setIsNotificationOpen, pendingCount, role: userRole } = useAppShell();
  const [data, setData] = useState<any>({ expenses: [], members: [], monthly: [], role: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMonthly, setSelectedMonthly] = useState<any>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchFamilyStatus();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    setInviteMessage(null);
    try {
      const res = await fetch('/api/sheets/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: inviteEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteMessage({ type: 'success', text: 'Invitation email sent successfully!' });
        setInviteEmail('');
      } else {
        setInviteMessage({ type: 'error', text: data.error || 'Failed to share' });
      }
    } catch (err) {
      setInviteMessage({ type: 'error', text: 'Connection failed' });
    } finally {
      setIsInviting(false);
    }
  };

  const fetchFamilyStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sheets/family');
      const familyData = await res.json();
      
      if (!familyData.familyCode) {
        router.push('/family-setup');
        return;
      }

      // Fetch expenses and monthly
      const [expRes, monthlyRes] = await Promise.all([
        fetch(`/api/sheets/expense?sheetName=Family_Expenses&familyCode=${familyData.familyCode}`),
        fetch(`/api/sheets/monthly?familyCode=${familyData.familyCode}`)
      ]);

      const expData = await expRes.json();
      const monthlyData = await monthlyRes.json();

      setData({
        familyCode: familyData.familyCode,
        members: familyData.members,
        role: familyData.role,
        expenses: expData.expenses || [],
        monthly: monthlyData.items || []
      });
    } catch (err) {
      setError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedMonthly) return;
    setIsUpdatingStatus(true);
    try {
      await fetch('/api/sheets/monthly', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedMonthly.id, paidDate }),
      });
      setIsPayModalOpen(false);
      fetchFamilyStatus();
    } catch (err) {
      console.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isIncome = (category: string) => ['Income', 'Salary'].includes(category);

  const familyProsperityData = useMemo(() => {
    const expenseTotal = data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    // For visual purposes, we'll just show expenses and balance if we had a budget, 
    // but since we only track expenses for family now, let's just show total expenses.
    return [
      { name: 'Expenses', value: expenseTotal, color: '#ef4444' }, 
      { name: 'Others', value: 0, color: '#10b981' }
    ].filter(d => d.value > 0);
  }, [data.expenses]);

  const memberSpending = useMemo(() => {
    const totals: Record<string, number> = {};
    data.expenses.forEach((e: any) => {
      const user = e.addedBy || 'Unknown';
      totals[user] = (totals[user] || 0) + e.amount;
    });
    const colors = ['#006972', '#fdd34d', '#7c4dff', '#ff5252'];
    return Object.entries(totals)
      .map(([name, value], i) => ({
        name: name.split('@')[0],
        value: value,
        color: colors[i % colors.length]
      }));
  }, [data.expenses]);

  if (isLoading) return <LoadingScreen />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-medium mx-auto px-6 pt-12 pb-32"
    >
      <Header 
        title="Family Prosperity" 
        subtitle={`Family Code: ${data.familyCode} • ${data.role}`}
        icon={<Users size={20} />}
        actions={
          <div className="flex gap-2">
            {data.role === 'Admin' && (
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="w-12 h-12 bg-primary/10 dark:bg-primary-fixed/10 rounded-2xl flex items-center justify-center shadow-sm border border-primary/20"
                title="Invite Member"
              >
                <Plus size={20} className="text-primary dark:text-primary-fixed" />
              </button>
            )}
            <button className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
              <Sparkles size={20} className="text-amber-400" />
            </button>
          </div>
        }
      />

      {/* Members & Invite Card */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black mb-1">Your Team</h3>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{data.members.length} Active Members</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                {data.role}
              </div>
            </div>
            
            <div className="flex -space-x-3 mb-8">
              {data.members.map((m: any, i: number) => (
                <div key={i} className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-sm font-black shadow-sm" title={m.email}>
                  {m.email[0].toUpperCase()}
                </div>
              ))}
              {data.role === 'Admin' && (
                <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>

            {data.role === 'Admin' && (
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Mail size={16} /> Invite via Gmail
              </button>
            )}
          </div>
          
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* Shared Analysis */}
      <section className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Family Prosperity Overview</h3>
         <div className="h-48 relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={familyProsperityData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} stroke="none">
                  {familyProsperityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-black dark:text-white">
                ₹{data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0).toLocaleString()}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Shared Spending</span>
            </div>
        </div>

        <div className="flex justify-center gap-4 border-t border-slate-50 dark:border-slate-700/50 pt-6">
          {familyProsperityData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{d.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Monthly Expenses */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Monthly Commitments</h3>
          {data.role === 'Admin' && (
             <button 
               onClick={() => setIsAddModalOpen(true)}
               className="p-2 bg-primary text-white rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
             >
               <Plus size={14} /> Add Monthly
             </button>
          )}
        </div>
        
        <div className="space-y-3">
          {data.monthly.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
               <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No monthly expenses set</p>
            </div>
          ) : (
            data.monthly.map((item: any) => {
              const today = new Date();
              const lastPaid = item.lastPaidDate ? new Date(item.lastPaidDate) : null;
              const isPaidThisMonth = lastPaid && lastPaid.getUTCMonth() === today.getUTCMonth() && lastPaid.getUTCFullYear() === today.getUTCFullYear();

              return (
                <div key={item.id} className="bg-white dark:bg-slate-800/50 p-5 rounded-3xl flex items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPaidThisMonth ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-red-50 text-red-500 dark:bg-red-500/10'}`}>
                      {isPaidThisMonth ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black dark:text-white">{item.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {isPaidThisMonth ? `Paid on ${new Date(item.lastPaidDate).toLocaleDateString()} by ${item.lastPaidBy?.split('@')[0]}` : `Due on Day ${item.dueDay}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-black text-sm dark:text-white">₹{item.amount.toLocaleString()}</span>
                    {!isPaidThisMonth && (
                      <button 
                        onClick={() => {
                          setSelectedMonthly(item);
                          setIsPayModalOpen(true);
                        }}
                        className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-primary transition-colors font-black text-[10px] uppercase tracking-widest"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Family Expenses List */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Shared Expenses</h3>
          {data.role === 'Admin' && (
             <button 
               onClick={() => setIsAddModalOpen(true)}
               className="p-2 bg-primary text-white rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
             >
               <Plus size={14} /> Add Expense
             </button>
          )}
        </div>
        <div className="space-y-3">
          {data.expenses.slice().reverse().map((exp: any) => (
             <div key={exp.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl flex items-center justify-between">
               <div>
                  <h4 className="text-sm font-bold dark:text-white">{exp.category}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{exp.note || 'No note'}</p>
               </div>
               <div className="text-right">
                  <span className="block font-black dark:text-white">₹{exp.amount.toLocaleString()}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">{exp.addedBy?.split('@')[0]} • {new Date(exp.date).toLocaleDateString()}</span>
               </div>
             </div>
          ))}
        </div>
      </section>
      
      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-6 right-6 -translate-y-1/2 max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 z-[71] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black dark:text-white">Invite Member</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="dark:text-white" />
                </button>
              </div>

              <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">
                Enter the Google email address of the person you want to invite. We will send them an invitation link to join directly.
              </p>

              <div className="relative mb-6">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family@gmail.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                />
              </div>

              {inviteMessage && (
                <p className={`text-[10px] font-bold mb-4 uppercase tracking-widest ${inviteMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {inviteMessage.text}
                </p>
              )}

              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {isInviting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Invitation'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Mark as Paid Modal */}
      <AnimatePresence>
        {isPayModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-6 right-6 -translate-y-1/2 max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 z-[71] shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black dark:text-white">Mark as Paid</h3>
                <button onClick={() => setIsPayModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} className="dark:text-white" />
                </button>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                Settling {selectedMonthly?.title}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleMarkAsPaid}
                disabled={isUpdatingStatus || !paidDate}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {isUpdatingStatus ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Payment'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
