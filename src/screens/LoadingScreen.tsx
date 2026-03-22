import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F9FA]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl shadow-primary/10">
          <img 
            src="https://lh3.googleusercontent.com/aida/ADBb0uhx8pQnLFbGdlLpMYfKAjQo3rm38XO1-Z_53Sx1BpZ0Ypb_U4ktGNGU1zNoMRR8cYfvfltYBVUkcWdL0hEA3kDZrFwaOpPOylHVUwPCAh0p0PvrW33NMUW8mQh2gNICBdbMXESF_VwwrU79YvdAEBWthfMLIezUjrTJOvWpM-omdadyIcrLdwobSnnRLWiHodAdN4fjLIrGyiO7VY9edBf_2fekxU21vkiIIEoq1B9JNk_2W8j_pRwAtCxcDsxZXd9_bD2EjKJ3tA" 
            alt="Manikutti Logo" 
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 60 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="h-1 bg-[#006972] mt-12 rounded-full opacity-60"
      />

      <div className="absolute bottom-12 text-[#94A3B8] tracking-[0.2em] text-xs font-bold uppercase">
        A Digital Sanctuary
      </div>
    </div>
  );
}
