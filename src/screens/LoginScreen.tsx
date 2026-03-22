import { motion } from 'framer-motion';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-medium mx-auto px-8 pt-24 pb-12 min-h-screen flex flex-col justify-between dark:bg-on-surface transition-colors duration-500"
    >
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl shadow-primary/20 flex items-center justify-center mb-12 overflow-hidden border-4 border-white dark:border-slate-700">
           <img 
             src="https://lh3.googleusercontent.com/aida/ADBb0uhx8pQnLFbGdlLpMYfKAjQo3rm38XO1-Z_53Sx1BpZ0Ypb_U4ktGNGU1zNoMRR8cYfvfltYBVUkcWdL0hEA3kDZrFwaOpPOylHVUwPCAh0p0PvrW33NMUW8mQh2gNICBdbMXESF_VwwrU79YvdAEBWthfMLIezUjrTJOvWpM-omdadyIcrLdwobSnnRLWiHodAdN4fjLIrGyiO7VY9edBf_2fekxU21vkiIIEoq1B9JNk_2W8j_pRwAtCxcDsxZXd9_bD2EjKJ3tA" 
             alt="Manikutti Logo" 
             className="w-full h-full object-cover"
           />
        </div>
        
        <h1 className="text-4xl font-black font-headline text-center mb-4 dark:text-white">Welcome to Manikutti</h1>
        <p className="text-on-surface-variant dark:text-slate-400 text-center font-medium opacity-60 leading-relaxed max-w-[280px]">
          Seamlessly track your legacy and family prosperity in one sacred space.
        </p>
      </div>

      <div className="space-y-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white p-5 rounded-2xl flex items-center justify-center gap-4 shadow-sm border border-slate-100 dark:border-slate-700 font-bold"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-6 h-6" />
          Continue with Google
        </motion.button>

        <p className="text-[10px] text-center text-on-surface-variant dark:text-slate-500 font-medium px-4 opacity-40 leading-relaxed uppercase tracking-[0.2em]">
          By continuing, you agree to our <span className="text-primary dark:text-primary-fixed border-b border-primary/30 font-bold">Prosperity Policy</span> and <span className="text-primary dark:text-primary-fixed border-b border-primary/30 font-bold">Privacy Agreement</span>.
        </p>
      </div>
    </motion.div>
  );
}
