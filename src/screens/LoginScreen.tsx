import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { AlertCircle, Loader2, Mail, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setVerificationToken(data.token);
      setStep('otp');
      setSuccessMessage('Verification code sent to your email.');
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        otp,
        token: verificationToken,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Successful login
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-medium mx-auto px-8 pt-24 pb-12 min-h-screen flex flex-col justify-between dark:bg-slate-900 transition-colors duration-500"
    >
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl shadow-primary/20 flex items-center justify-center mb-12 overflow-hidden border-4 border-white dark:border-slate-700">
          <img 
            src="/favicon.png" 
            alt="Manikutti Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <h1 className="text-4xl font-black font-headline text-center mb-4 dark:text-white">Welcome to Manikutti</h1>
        <p className="text-on-surface-variant dark:text-slate-400 text-center font-medium opacity-60 leading-relaxed max-w-[280px]">
          {step === 'email' 
            ? 'Access your legacy and family prosperity admin dashboard.'
            : 'Enter the 6-digit code sent to your admin email address.'
          }
        </p>
      </div>

      <div className="my-8 flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium animate-shake">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Mail size={20} />
              </span>
              <input
                type="email"
                placeholder="Admin Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white p-5 pl-12 rounded-2xl border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500 font-medium transition-all"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock size={20} />
              </span>
              <input
                type="text"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="6-Digit Verification Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={loading}
                required
                className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white p-5 pl-12 rounded-2xl border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500 font-bold tracking-[0.3em] text-center text-lg transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enter Dashboard'
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setError('');
                setSuccessMessage('');
              }}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-2"
            >
              Change Email Address
            </button>
          </form>
        )}
      </div>

      <div className="space-y-8">
        <p className="text-[10px] text-center text-on-surface-variant dark:text-slate-500 font-medium px-4 opacity-40 leading-relaxed uppercase tracking-[0.2em]">
          By continuing, you agree to our <span className="text-primary dark:text-indigo-400 border-b border-primary/30 font-bold">Prosperity Policy</span> and <span className="text-primary dark:text-indigo-400 border-b border-primary/30 font-bold">Privacy Agreement</span>.
        </p>
      </div>
    </motion.div>
  );
}
