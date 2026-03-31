'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

function JoinFamilyContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (status === 'authenticated' && token && !loading && !success && !error) {
      handleJoin();
    }
  }, [status, token]);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sheets/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join family');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/family');
      }, 3000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
        <p className="text-slate-500">The invitation link is missing or malformed.</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <ShieldCheck size={48} className="text-primary mb-6" />
        <h1 className="text-2xl font-bold mb-4">You're Invited!</h1>
        <p className="text-slate-500 mb-8 max-w-sm">
          Please sign in with your Google account to accept the invitation and join your family sanctuary.
        </p>
        <button
          onClick={() => signIn('google')}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-2 transition-all"
        >
          Sign In with Google
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      {loading ? (
        <>
          <Loader2 size={48} className="text-primary animate-spin mb-4" />
          <h1 className="text-2xl font-bold mb-2">Joining Family Sanctuary...</h1>
          <p className="text-slate-500">Please wait while we set up your access.</p>
        </>
      ) : success ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
          <h1 className="text-2xl font-bold mb-2">Welcome Home!</h1>
          <p className="text-slate-500 mb-8">You have successfully joined the family group.</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Redirecting to Dashboard...
          </p>
        </motion.div>
      ) : error ? (
        <>
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unable to Join</h1>
          <p className="text-slate-500 mb-8">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-primary font-bold hover:underline"
          >
            Back to Home
          </button>
        </>
      ) : (
        <>
          <Loader2 size={48} className="text-primary animate-spin mb-4" />
          <p className="text-slate-500">Checking invitation...</p>
        </>
      )}
    </div>
  );
}

export default function JoinFamilyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="text-primary animate-spin" />
      </div>
    }>
      <JoinFamilyContent />
    </Suspense>
  );
}
