'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Plus, X, Landmark, TrendingDown, ArrowDownRight, ArrowRight, Wallet, Percent, Calendar, Trash2, Pencil } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface HomeLoanEntry {
  id?: number;
  date: string;
  totalPayment: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function HomeLoanPage() {
  const [history, setHistory] = useState<HomeLoanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{open: boolean, message: string, type: 'success' | 'info'}>({ open: false, message: '', type: 'success' });
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalPayment, setTotalPayment] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interest, setInterest] = useState('');
  const [balance, setBalance] = useState('');

  // Settings / Projection State
  const [manualInterestRate, setManualInterestRate] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [plannedEmi, setPlannedEmi] = useState<string>('');

  useEffect(() => {
    fetchHistory(false);
  }, []);

  const fetchHistory = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const familyRes = await fetch('/api/sheets/family');
      const familyData = await familyRes.json();
      if (!familyData.familyCode) {
        setError('No family code found');
        return;
      }

      const res = await fetch(`/api/sheets/home-loan?familyCode=${familyData.familyCode}`);
      const data = await res.json();
      if (data.items) {
        const sorted = data.items.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setHistory(sorted);
        
        if (sorted.length > 0) {
           const latest = sorted[sorted.length - 1];
           setBalance(latest.balance.toString());
           if (!plannedEmi) {
              setPlannedEmi(latest.totalPayment.toString());
           }
        }
      }
    } catch (err) {
      console.error('Failed to fetch home loan history:', err);
      if (!isSilent) setError('Failed to load history');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    
    // Optimistic Update
    const newEntry = {
      id: editingId || Date.now(), // temporary ID if not editing
      date,
      totalPayment: parseFloat(totalPayment),
      principal: parseFloat(principal),
      interest: parseFloat(interest),
      balance: parseFloat(balance),
    };
    
    // Update local state immediately
    if (editingId) {
      setHistory(prev => prev.map(item => item.id === editingId ? newEntry : item).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } else {
      setHistory(prev => [...prev, newEntry].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
    setBalance(newEntry.balance.toString());
    
    // Close modal and show loading toast
    setIsAddModalOpen(false);
    setToast({ open: true, message: 'Saving entry...', type: 'info' });
    
    try {
      const familyRes = await fetch('/api/sheets/family');
      const familyData = await familyRes.json();
      
      const payload = {
        ...newEntry,
        familyCode: familyData.familyCode
      };
      
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/sheets/home-loan', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save entry');
      
      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setTotalPayment('');
      setPrincipal('');
      setInterest('');
      setEditingId(null);
      
      setToast({ open: true, message: 'Entry saved successfully!', type: 'success' });
      fetchHistory(true); // silent fetch
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Failed to save entry', type: 'info' });
      // Revert optimistic update
      fetchHistory(true); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: HomeLoanEntry) => {
    setEditingId(entry.id!);
    setDate(entry.date);
    setTotalPayment(entry.totalPayment.toString());
    setPrincipal(entry.principal.toString());
    setInterest(entry.interest.toString());
    setBalance(entry.balance.toString());
    setIsAddModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    // Optimistic delete
    setHistory(prev => prev.filter(item => item.id !== deletingId));
    setDeletingId(null);
    setToast({ open: true, message: 'Deleting entry...', type: 'info' });
    
    try {
      const res = await fetch(`/api/sheets/home-loan?id=${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setToast({ open: true, message: 'Entry deleted successfully', type: 'success' });
      fetchHistory(true);
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Failed to delete entry', type: 'info' });
      fetchHistory(true);
    }
  };

  // Auto-calculate Total Payment when Principal or Interest changes
  useEffect(() => {
    const p = parseFloat(principal) || 0;
    const i = parseFloat(interest) || 0;
    if (p > 0 || i > 0) {
      setTotalPayment((p + i).toString());
    }
  }, [principal, interest]);

  // Auto-calculate Remaining Balance when Principal changes
  useEffect(() => {
    const p = parseFloat(principal) || 0;
    if (p > 0 && history.length > 0) {
      const prevBal = history[history.length - 1].balance;
      setBalance((prevBal - p).toString());
    }
  }, [principal, history]);

  // Auto-calculate interest rate based on the last payment
  const effectiveInterestRate = useMemo(() => {
    if (manualInterestRate) return parseFloat(manualInterestRate);
    if (history.length === 0) return 8.5; // default fallback

    const lastPayment = history[history.length - 1];
    let prevBalance = lastPayment.balance + lastPayment.principal;
    if (history.length > 1) {
      prevBalance = history[history.length - 2].balance;
    }
    
    if (prevBalance <= 0) return 0;
    
    const monthlyRate = lastPayment.interest / prevBalance;
    const annualRate = monthlyRate * 12 * 100;
    return parseFloat(annualRate.toFixed(2));
  }, [history, manualInterestRate]);

  // Generate Future Amortization Projection
  const futureProjection = useMemo(() => {
    if (history.length === 0) return [];
    
    const currentBalance = history[history.length - 1].balance;
    const rate = effectiveInterestRate / 100 / 12; // monthly interest rate
    const emi = parseFloat(plannedEmi) || history[history.length - 1].totalPayment;
    
    if (!currentBalance || !rate || !emi || emi <= currentBalance * rate) {
       return [];
    }

    let bal = currentBalance;
    let months = 0;
    const projection = [];
    const currentDate = new Date(history[history.length - 1].date);

    while (bal > 0 && months < 360) { // cap at 30 years
      months++;
      const int = bal * rate;
      const prin = emi - int;
      
      const actualPrin = prin >= bal ? bal : prin;
      bal -= actualPrin;
      
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      // We sample every few months or just store all for the graph
      projection.push({
        month: months,
        date: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2, '0')}`,
        principal: actualPrin,
        interest: int,
        balance: bal
      });
      
      if (bal <= 0) break;
    }

    return projection;
  }, [history, effectiveInterestRate, plannedEmi]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <CircularProgress className="text-primary" />
      </div>
    );
  }

  const latestBalance = history.length > 0 ? history[history.length - 1].balance : 0;
  const initialBalance = history.length > 0 ? history[0].balance + history[0].principal : 0; // rough estimate
  const totalPaidPrincipal = history.reduce((acc, curr) => acc + curr.principal, 0);
  const totalPaidInterest = history.reduce((acc, curr) => acc + curr.interest, 0);
  const progressPercent = initialBalance > 0 ? ((initialBalance - latestBalance) / initialBalance) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-xl">
          <p className="font-semibold mb-2 text-slate-800 dark:text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 dark:text-slate-400 capitalize">{entry.name}:</span>
              <span className="font-medium font-mono text-slate-900 dark:text-slate-100">
                ₹{Math.round(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-slate-100 pb-24">
      {/* Hero Section */}
      <div className="relative pt-12 pb-8 px-6 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Typography variant="h4" className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="text-primary w-8 h-8" />
                Home Loan
              </Typography>
              <Typography variant="body2" className="text-slate-500 dark:text-slate-400 mt-1">
                Track your journey to being debt-free
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="caption" className="text-slate-500 dark:text-slate-400 block mb-1">
                Effective Interest Rate
              </Typography>
              <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-semibold">
                <Percent size={14} />
                {effectiveInterestRate}%
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-3xl p-8 border border-primary/10">
            <div className="flex-1">
              <Typography variant="subtitle2" className="text-slate-600 dark:text-slate-400 font-medium tracking-wide uppercase">
                Remaining Balance
              </Typography>
              <Typography variant="h2" className="font-bold font-mono text-slate-900 dark:text-white my-2">
                ₹{latestBalance.toLocaleString('en-IN')}
              </Typography>
              <div className="flex gap-6 mt-6">
                <div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-1">
                    <TrendingDown size={16} className="text-green-500" /> Principal Paid
                  </div>
                  <span className="font-mono font-semibold">₹{totalPaidPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-1">
                    <ArrowDownRight size={16} className="text-red-500" /> Interest Paid
                  </div>
                  <span className="font-mono font-semibold">₹{totalPaidInterest.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" className="stroke-primary" strokeWidth="12" fill="none" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * Math.min(progressPercent, 100)) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{Math.round(progressPercent)}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Paid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        {/* Future Projection Area Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <Typography variant="h6" className="font-bold">Future Amortization</Typography>
            <Button size="small" variant="text" onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? 'Hide Settings' : 'Advanced'}
            </Button>
          </div>

          {showSettings && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex gap-4">
              <TextField
                label="Manual Interest Override (%)"
                type="number"
                inputProps={{ step: "0.1" }}
                value={manualInterestRate}
                onChange={(e) => setManualInterestRate(e.target.value)}
                size="small"
                helperText="Leave empty to auto-calculate"
                className="flex-1"
              />
              <TextField
                label="Planned EMI"
                type="number"
                value={plannedEmi}
                onChange={(e) => setPlannedEmi(e.target.value)}
                size="small"
                className="flex-1"
              />
            </div>
          )}

          {futureProjection.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={futureProjection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700 opacity-50" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="principal" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPrincipal)" name="Principal Portion" />
                  <Area type="monotone" dataKey="interest" stackId="1" stroke="#ef4444" strokeWidth={2} fill="url(#colorInterest)" name="Interest Portion" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Estimated payoff in <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.floor(futureProjection.length / 12)} years and {futureProjection.length % 12} months</span>
              </div>
            </div>
          ) : (
             <div className="flex justify-center items-center h-[200px] text-slate-500">
               Not enough data to generate projection
             </div>
          )}
        </div>

        {/* Transaction History Tiles */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <Typography variant="h6" className="font-bold mb-4">Repayment History</Typography>
          <div className="space-y-4">
            {[...history].reverse().map((entry, idx) => (
              <div key={entry.id || idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <Typography variant="subtitle2" className="font-bold text-slate-900 dark:text-white">
                      ₹{entry.totalPayment.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" className="text-slate-500">
                      {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div className="hidden sm:block">
                    <Typography variant="caption" className="text-slate-500 block mb-0.5">Principal</Typography>
                    <Typography variant="body2" className="font-mono text-green-600 dark:text-green-400">₹{entry.principal.toLocaleString('en-IN')}</Typography>
                  </div>
                  <div className="hidden sm:block">
                    <Typography variant="caption" className="text-slate-500 block mb-0.5">Interest</Typography>
                    <Typography variant="body2" className="font-mono text-red-500 dark:text-red-400">₹{entry.interest.toLocaleString('en-IN')}</Typography>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                  <div>
                    <Typography variant="caption" className="text-slate-500 block mb-0.5">Balance</Typography>
                    <Typography variant="body2" className="font-mono font-bold">₹{entry.balance.toLocaleString('en-IN')}</Typography>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <IconButton size="small" onClick={() => handleEdit(entry)} className="text-slate-400 hover:text-primary">
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeletingId(entry.id!)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No repayments added yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-32 right-6 z-40">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Add Repayment Modal */}
      <Dialog 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        PaperProps={{
          className: "bg-white dark:bg-slate-900 rounded-3xl m-4 w-full max-w-sm"
        }}
      >
        <DialogTitle className="flex items-center justify-between pb-2 pt-6 px-6">
          <Typography variant="h6" className="font-bold text-slate-900 dark:text-white">Add Repayment</Typography>
          <IconButton onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent className="px-6 pb-2 pt-2 flex flex-col gap-4">
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
            <TextField
              label="Principal Portion"
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Interest Portion"
              type="number"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="New Remaining Balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Total Payment (Auto-calculated)"
              type="number"
              value={totalPayment}
              onChange={(e) => setTotalPayment(e.target.value)}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions className="px-6 pb-6 pt-4">
            <Button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)}
              className="text-slate-500"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              className={`bg-primary hover:bg-primary-dark rounded-xl px-6 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disableElevation
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        PaperProps={{ className: "bg-white dark:bg-slate-900 rounded-3xl m-4 w-full max-w-xs" }}
      >
        <DialogTitle className="font-bold text-slate-900 dark:text-white">Delete Entry?</DialogTitle>
        <DialogContent>
          <Typography className="text-slate-500 dark:text-slate-400">
            This action will permanently delete this repayment from your history.
          </Typography>
        </DialogContent>
        <DialogActions className="px-6 pb-6">
          <Button onClick={() => setDeletingId(null)} className="text-slate-500">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" className="rounded-xl px-6" disableElevation>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.type === 'success' ? 'success' : 'info'} 
          sx={{ width: '100%', borderRadius: 2 }}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
