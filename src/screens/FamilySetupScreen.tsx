'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Link, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FamilySetupScreen() {
  const [step, setStep] = useState<'info' | 'create' | 'join'>('info');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sheets/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/family');
      }
    } catch (err) {
      setError('Failed to create family');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/sheets/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/family');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Failed to join family');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-medium mx-auto px-6 pt-12 pb-32 min-h-screen flex flex-col justify-center">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-primary/10 dark:bg-primary-fixed/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-primary dark:text-primary-fixed">
          <Users size={32} />
        </div>
        <h1 className="text-3xl font-black font-headline dark:text-white mb-4">Prosperity Together</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
          Create a shared legacy with your family. Track joint expenses, incomes, and upcoming bills.
        </p>
      </div>

      <div className="space-y-4">
        {step === 'info' && (
          <>
            <button
              onClick={() => setStep('create')}
              className="w-full bg-primary text-white p-6 rounded-[2rem] font-black flex items-center justify-between shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <div className="text-left">
                  <div className="text-lg">Create Family</div>
                  <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Start a new legacy</div>
                </div>
              </div>
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => setStep('join')}
              className="w-full bg-white dark:bg-slate-800 p-6 rounded-[2rem] font-black flex items-center justify-between border border-slate-100 dark:border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all dark:text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400">
                  <Link size={24} />
                </div>
                <div className="text-left">
                  <div className="text-lg">Join Family</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter invite code</div>
                </div>
              </div>
              <ArrowRight size={20} />
            </button>
          </>
        )}

        {step === 'create' && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 text-center">
            <ShieldCheck size={48} className="mx-auto text-primary mb-4" />
            <h3 className="text-xl font-black mb-4 dark:text-white">Admin Privileges</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">
              As the creator, you will be the Admin. Admins can add Bills, EMIs, and invite others.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep('info')} className="flex-1 p-5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">Back</button>
              <button 
                onClick={handleCreate}
                disabled={isLoading}
                className="flex-[2] bg-primary text-white p-5 rounded-2xl font-black flex items-center justify-center"
              >
                {isLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm & Create'}
              </button>
            </div>
          </div>
        )}

        {step === 'join' && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-black mb-6 dark:text-white">Enter Family Code</h3>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. XJ28KL"
              className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl text-center text-2xl font-black tracking-widest focus:ring-2 focus:ring-primary/20 outline-none mb-6 dark:text-white"
            />
            {error && <p className="text-red-500 text-[10px] font-bold mb-4 text-center uppercase tracking-widest">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep('info')} className="flex-1 p-5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">Back</button>
              <button 
                onClick={handleJoin}
                disabled={isLoading || !code}
                className="flex-[2] bg-primary text-white p-5 rounded-2xl font-black flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'Join Prosperity'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
