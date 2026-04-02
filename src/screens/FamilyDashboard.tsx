'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  Users, Plus, Calendar, CheckCircle2, AlertCircle, Sparkles, X, Mail, Edit2, 
  UserPlus, Coins, ArrowUpRight, ArrowDownRight, History 
} from 'lucide-react';
import { useAppShell } from '@/components/AppShell';
import Header from '@/components/layout/Header';
import { useRouter } from 'next/navigation';
import LoadingScreen from './LoadingScreen';

export default function FamilyDashboard() {
  const { 
    setIsAddModalOpen, setInitialType, 
    lastRefresh, role: userRole, user: sessionUser 
  } = useAppShell();
  
  const [data, setData] = useState<any>({ expenses: [], members: [], monthly: [], role: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMonthly, setSelectedMonthly] = useState<any>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [loans, setLoans] = useState<any[]>([]);
  const [loanExpenses, setLoanExpenses] = useState<any[]>([]);

  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberNickname, setMemberNickname] = useState('');
  const [memberIncome, setMemberIncome] = useState('');
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanEMI, setNewLoanEMI] = useState('');
  const [newLoanAssignedTo, setNewLoanAssignedTo] = useState('');
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  
  const [loanExpAmount, setLoanExpAmount] = useState('');
  const [loanExpCategory, setLoanExpCategory] = useState('');
  const [loanExpNote, setLoanExpNote] = useState('');
  const [isAddingLoanExp, setIsAddingLoanExp] = useState(false);

  useEffect(() => {
    fetchFamilyStatus();
  }, [lastRefresh]);

  const fetchFamilyStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sheets/family');
      const familyData = await res.json();
      if (!familyData.familyCode) { router.push('/family-setup'); return; }

      const [expRes, monthlyRes, loanRes] = await Promise.all([
        fetch(`/api/sheets/expense?sheetName=Family_Expenses&familyCode=${familyData.familyCode}`),
        fetch(`/api/sheets/monthly?familyCode=${familyData.familyCode}`),
        fetch(`/api/sheets/loans?familyCode=${familyData.familyCode}`)
      ]);

      const expData = await expRes.json();
      const monthlyData = await monthlyRes.json();
      const loanData = await loanRes.json();

      setData({
        familyCode: familyData.familyCode,
        members: familyData.members || [],
        role: familyData.role,
        expenses: expData.expenses || [],
        monthly: monthlyData.items || [],
        repayments: loanData.repayments || []
      });
      setLoans(loanData.loans || []);
      setLoanExpenses(loanData.expenses || []);
    } catch (err) {
      setError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

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
      if (data.success) { setInviteMessage({ type: 'success', text: 'Success!' }); setInviteEmail(''); }
      else { setInviteMessage({ type: 'error', text: data.error || 'Error' }); }
    } catch (err) { setInviteMessage({ type: 'error', text: 'Error' }); }
    finally { setIsInviting(false); }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    setIsUpdatingMember(true);
    try {
      const res = await fetch('/api/sheets/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateMember', 
          targetEmail: editingMember.email,
          nickname: memberNickname,
          monthlyIncome: parseFloat(memberIncome) || 0
        }),
      });
      if (res.ok) { setEditingMember(null); fetchFamilyStatus(); }
    } finally { setIsUpdatingMember(false); }
  };

  const handleAddLoan = async () => {
    if (!newLoanName || !newLoanAmount || !newLoanEMI || !newLoanAssignedTo) return;
    setIsAddingLoan(true);
    try {
      await fetch('/api/sheets/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'addLoan', 
          loanName: newLoanName,
          amount: parseFloat(newLoanAmount),
          monthlyEMI: parseFloat(newLoanEMI),
          assignedTo: newLoanAssignedTo,
          familyCode: data.familyCode
        }),
      });
      setNewLoanName(''); setNewLoanAmount(''); setNewLoanEMI(''); setNewLoanAssignedTo('');
      fetchFamilyStatus();
    } finally {
      setIsAddingLoan(false);
    }
  };


  const handleAddLoanExp = async () => {
    if (!selectedLoan || !loanExpAmount) return;
    setIsAddingLoanExp(true);
    try {
      await fetch('/api/sheets/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'addLoanExpense', 
          loanName: selectedLoan.name,
          familyCode: data.familyCode,
          expense: {
            amount: parseFloat(loanExpAmount),
            category: loanExpCategory || 'Repayment',
            note: loanExpNote,
            date: new Date().toISOString()
          }
        }),
      });
      setLoanExpAmount(''); setLoanExpNote(''); fetchFamilyStatus();
    } finally { setIsAddingLoanExp(false); }
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
      setIsPayModalOpen(false); fetchFamilyStatus();
    } finally { setIsUpdatingStatus(false); }
  };

  const familyProsperityData = useMemo(() => {
    const incomeTotal = (data.members || []).reduce((sum: number, m: any) => sum + (m.monthlyIncome || 0), 0);
    const sharedExpenseTotal = data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    
    // Calculate paid monthly commitments for the current month
    const today = new Date();
    const paidMonthlyTotal = (data.monthly || []).reduce((sum: number, item: any) => {
      const lastPaid = item.lastPaidDate ? new Date(item.lastPaidDate) : null;
      const isPaidThisMonth = lastPaid && 
        lastPaid.getUTCMonth() === today.getUTCMonth() && 
        lastPaid.getUTCFullYear() === today.getUTCFullYear();
      return isPaidThisMonth ? sum + item.amount : sum;
    }, 0);

    const totalExpenses = sharedExpenseTotal + paidMonthlyTotal;
    const balance = incomeTotal - totalExpenses;

    return [
      { name: 'Family Income', value: incomeTotal, color: '#10b981' }, 
      { name: 'Total Expenses', value: totalExpenses, color: '#ef4444' },
      { name: 'Available Balance', value: Math.max(0, balance), color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [data.expenses, data.members, data.monthly]);

  if (isLoading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-medium mx-auto px-6 pt-12 pb-32" >
      <Header 
        title="Family Prosperity" subtitle={`Code: ${data.familyCode}`} icon={<Users size={20} />}
        actions={
          <div className="flex gap-2">
            {userRole === 'Admin' && <button onClick={() => setIsInviteModalOpen(true)} className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20"><Plus size={20} className="text-primary" /></button>}
            <button className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700"><Sparkles size={20} className="text-amber-400" /></button>
          </div>
        }
      />

      <section className="mb-8 cursor-pointer group" onClick={() => setIsMemberModalOpen(true)}>
        <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden transition-all group-hover:scale-[1.02]">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-1">Your Team</h3>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-6">{data.members.length} Active Members</p>
            <div className="flex -space-x-3">
              {data.members.map((m: any, i: number) => (
                <div key={i} className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-sm font-black shadow-sm" title={m.email}>
                  {m.nickname ? m.nickname[0].toUpperCase() : m.email[0].toUpperCase()}
                </div>
              ))}
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs font-black"><Edit2 size={16} /></div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Family Prosperity Overview</h3>
        <div className="h-48 relative mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={familyProsperityData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} stroke="none">
                {familyProsperityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-black dark:text-white">₹{(familyProsperityData.find(d => d.name === 'Available Balance')?.value || 0).toLocaleString()}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Balance</span>
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

      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Monthly Commitments</h3>
          {userRole === 'Admin' && <button onClick={() => { setInitialType('Monthly'); setIsAddModalOpen(true); }} className="p-2 bg-primary text-white rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"><Edit2 size={12} /> Add Monthly</button>}
        </div>
        <div className="space-y-3">
          {data.monthly.length === 0 ? <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No commitments set</p></div> :
            data.monthly.map((item: any) => {
              const today = new Date(); const lastPaid = item.lastPaidDate ? new Date(item.lastPaidDate) : null;
              const isPaid = lastPaid && lastPaid.getUTCMonth() === today.getUTCMonth() && lastPaid.getUTCFullYear() === today.getUTCFullYear();
              return (
                <div key={item.id} className="bg-white dark:bg-slate-800/50 p-5 rounded-3xl flex items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPaid ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>{isPaid ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}</div>
                    <div><h4 className="text-sm font-black dark:text-white">{item.title}</h4><p className="text-[10px] font-bold text-slate-400 uppercase">{isPaid ? `Paid by ${item.lastPaidBy}` : `Due Day ${item.dueDay}`}</p></div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-black text-sm dark:text-white">₹{item.amount.toLocaleString()}</span>
                    {!isPaid && (
                      <button 
                        onClick={() => {
                          if (item.linkedLoan) {
                            const loan = loans.find(l => l.name === item.linkedLoan);
                            if (loan && loan.assignedTo && loan.assignedTo !== sessionUser?.email) {
                              alert(`Only ${loan.assignedTo} can mark this loan as paid.`);
                              return;
                            }
                          }
                          setSelectedMonthly(item);
                          setIsPayModalOpen(true);
                        }}
                        className={`p-2 rounded-xl transition-colors font-black text-[10px] uppercase ${
                          item.linkedLoan ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' : 'bg-slate-50 dark:bg-slate-800 text-primary'
                        }`}
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Loan & Repayments</h3>
          {userRole === 'Admin' && <button onClick={() => { setSelectedLoan(null); setIsLoanModalOpen(true); }} className="p-2 bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"><Coins size={12} /> New Loan</button>}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {loans.length === 0 ? <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No loans</p></div> :
            loans.map((loan) => {
              const totalRepaid = (data.repayments || [])
                .filter((r: any) => r.loanName === loan.name)
                .reduce((sum: number, r: any) => sum + r.amount, 0);
              const totalSpent = loanExpenses
                .filter(e => e.loanName === loan.name)
                .reduce((sum, e) => sum + e.amount, 0);
              
              const remainingPrincipal = loan.amount - totalRepaid;
              const progress = Math.min(100, (totalRepaid / loan.amount) * 100);

              return (
                <div key={loan.name} onClick={() => { setSelectedLoan(loan); setIsLoanModalOpen(true); }} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 cursor-pointer group shadow-sm hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                        <Coins size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm dark:text-white group-hover:text-primary transition-colors">{loan.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Principal: ₹{loan.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${remainingPrincipal <= 0 ? 'text-emerald-500' : 'text-primary'}`}>
                        {remainingPrincipal <= 0 ? 'Settled' : `₹${remainingPrincipal.toLocaleString()} left`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Total Spent</span>
                      <span className="text-xs font-black dark:text-white">₹{totalSpent.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Repaid</span>
                      <span className="text-xs font-black text-emerald-500">₹{totalRepaid.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full ${remainingPrincipal <= 0 ? 'bg-emerald-500' : 'bg-primary'}`}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Shared Expenses</h3>
          {userRole === 'Admin' && <button onClick={() => { setInitialType('Expense'); setIsAddModalOpen(true); }} className="p-2 bg-primary text-white rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"><Edit2 size={12} /> Add Expense</button>}
        </div>
        <div className="space-y-3">
          {data.expenses.slice().reverse().map((exp: any) => (
             <div key={exp.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl flex items-center justify-between">
               <div><h4 className="text-sm font-bold dark:text-white">{exp.category}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{exp.note || 'No note'}</p></div>
               <div className="text-right"><span className="block font-black dark:text-white">₹{exp.amount.toLocaleString()}</span><span className="text-[8px] text-slate-400 font-bold uppercase">{exp.addedBy?.split('@')[0]} • {new Date(exp.date).toLocaleDateString()}</span></div>
             </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {isMemberModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMemberModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 max-w-medium mx-auto bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 z-[71] shadow-2xl overflow-y-auto max-h-[90vh] pb-32" >
              <div className="flex justify-between items-center mb-8"><div><h3 className="text-2xl font-black dark:text-white">Team</h3><p className="text-[10px] font-bold text-slate-400 uppercase">Profiles & Contributions</p></div><button onClick={() => setIsMemberModalOpen(false)} className="p-2 rounded-full"><X size={24} className="dark:text-white" /></button></div>
              <div className="space-y-6">
                {data.members.map((member: any) => (
                  <div key={member.email} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-lg font-black text-primary shadow-sm">{member.nickname ? member.nickname[0].toUpperCase() : member.email[0].toUpperCase()}</div><div><h4 className="font-bold text-sm dark:text-white">{member.nickname || 'No Nickname'}</h4><p className="text-[10px] text-slate-400 font-bold">{member.email}</p></div></div><span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${member.role === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>{member.role}</span></div>
                    <div className="grid grid-cols-2 gap-4 mt-4"><div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700"><span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Monthly</span><span className="text-sm font-black dark:text-white">₹{(member.monthlyIncome || 0).toLocaleString()}</span></div><div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700"><span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Status</span><span className="text-sm font-black text-emerald-500 uppercase">Active</span></div></div>
                    {userRole === 'Admin' && <button onClick={(e) => { e.stopPropagation(); setEditingMember(member); setMemberNickname(member.nickname || ''); setMemberIncome(member.monthlyIncome?.toString() || ''); }} className="w-full mt-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 rounded-xl text-xs font-black text-primary uppercase" >Edit Details</button>}
                  </div>
                ))}
              </div>
              {userRole === 'Admin' && <button onClick={() => setIsInviteModalOpen(true)} className="w-full mt-8 py-5 bg-primary/10 text-primary border-2 border-dashed border-primary/20 rounded-[2rem] text-sm font-black uppercase flex items-center justify-center gap-2"><UserPlus size={20} /> Invite</button>}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingMember && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingMember(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-6 right-6 -translate-y-1/2 max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 z-[81] shadow-2xl" >
              <h3 className="text-xl font-black mb-6 dark:text-white uppercase">Edit Member</h3>
              <div className="space-y-6">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Nickname</label><input type="text" value={memberNickname} onChange={(e) => setMemberNickname(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none dark:text-white" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Income</label><input type="number" value={memberIncome} onChange={(e) => setMemberIncome(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none dark:text-white" /></div>
              </div>
              <div className="flex gap-3 mt-8"><button onClick={() => setEditingMember(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-black text-slate-500 uppercase">Cancel</button><button onClick={handleUpdateMember} disabled={isUpdatingMember} className="flex-2 px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase">{isUpdatingMember ? '...' : 'Save'}</button></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoanModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsLoanModalOpen(false); setSelectedLoan(null); }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 max-w-medium mx-auto bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 z-[71] shadow-2xl overflow-y-auto max-h-[90vh] pb-32" >
              <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black dark:text-white">{selectedLoan ? selectedLoan.name : 'New Loan'}</h3><button onClick={() => { setIsLoanModalOpen(false); setSelectedLoan(null); }} className="p-2 rounded-full"><X size={24} className="dark:text-white" /></button></div>
              {selectedLoan ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4"><div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-3xl"><span className="text-[8px] font-black text-emerald-600 uppercase block mb-1">Repaid</span><span className="text-lg font-black dark:text-white">₹{loanExpenses.filter(e => e.loanName === selectedLoan.name).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span></div><div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-3xl"><span className="text-[8px] font-black text-primary uppercase block mb-1">Remaining</span><span className="text-lg font-black dark:text-white">₹{(selectedLoan.amount - loanExpenses.filter(e => e.loanName === selectedLoan.name).reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</span></div></div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem]"><div className="space-y-4"><input type="number" value={loanExpAmount} onChange={(e) => setLoanExpAmount(e.target.value)} placeholder="Amount" className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl text-sm font-bold outline-none dark:text-white" /><input type="text" value={loanExpNote} onChange={(e) => setLoanExpNote(e.target.value)} placeholder="Note" className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl text-sm font-bold outline-none dark:text-white" /><button onClick={handleAddLoanExp} disabled={isAddingLoanExp || !loanExpAmount} className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase">{isAddingLoanExp ? '...' : 'Commit'}</button></div></div>
                  <div className="space-y-3"><h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><History size={14} /> History</h4>{loanExpenses.filter(e => e.loanName === selectedLoan.name).reverse().map((exp, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl"><div><span className="block text-xs font-bold dark:text-white">₹{exp.amount.toLocaleString()}</span><span className="text-[8px] text-slate-400 uppercase">{new Date(exp.date).toLocaleDateString()}</span></div><span className="text-[8px] font-black bg-emerald-50 text-emerald-500 px-2 py-1 rounded-full uppercase">{exp.addedBy?.split('@')[0]}</span></div>
                    ))}</div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Loan Name</label>
                    <input type="text" value={newLoanName} onChange={(e) => setNewLoanName(e.target.value)} placeholder="e.g. Car Loan" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm font-bold outline-none dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Principal</label>
                      <input type="number" value={newLoanAmount} onChange={(e) => setNewLoanAmount(e.target.value)} placeholder="₹" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Monthly EMI</label>
                      <input type="number" value={newLoanEMI} onChange={(e) => setNewLoanEMI(e.target.value)} placeholder="₹" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Assign to Member</label>
                    <select 
                      value={newLoanAssignedTo} 
                      onChange={(e) => setNewLoanAssignedTo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm font-bold outline-none dark:text-white appearance-none"
                    >
                      <option value="">Select Member</option>
                      {data.members.map((m: any) => (
                        <option key={m.email} value={m.email}>{m.nickname || m.email}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleAddLoan} disabled={isAddingLoan || !newLoanName || !newLoanAmount || !newLoanEMI || !newLoanAssignedTo} className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase shadow-lg shadow-primary/20">
                    {isAddingLoan ? 'Initializing...' : 'Create Loan & EMI'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInviteModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInviteModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-6 right-6 -translate-y-1/2 max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 z-[71] shadow-2xl border border-slate-100" >
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black dark:text-white">Invite</h3><button onClick={() => setIsInviteModalOpen(false)} className="p-2 rounded-full"><X size={20} className="dark:text-white" /></button></div>
              <div className="relative mb-6"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@gmail.com" className="w-full bg-slate-50 dark:bg-slate-800 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold outline-none dark:text-white" /></div>
              {inviteMessage && <p className={`text-[10px] font-bold mb-4 uppercase ${inviteMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{inviteMessage.text}</p>}
              <button onClick={handleInvite} disabled={isInviting || !inviteEmail} className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase">{isInviting ? '...' : 'Send'}</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPayModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPayModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-6 right-6 -translate-y-1/2 max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 z-[71] shadow-2xl" >
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black dark:text-white">Pay</h3><button onClick={() => setIsPayModalOpen(false)} className="p-2 rounded-full"><X size={20} className="dark:text-white" /></button></div>
              <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none dark:text-white mb-6" />
              <button onClick={handleMarkAsPaid} disabled={isUpdatingStatus || !paidDate} className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase">{isUpdatingStatus ? '...' : 'Confirm'}</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
