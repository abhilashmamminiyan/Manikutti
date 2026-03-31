import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <main className="relative w-full h-screen flex flex-col items-center justify-center p-8 bg-[#f8f9fa] overflow-hidden">
      {/* Subtle Ambient Background Gradient */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ background: 'radial-gradient(circle at center, #68c9d6 0%, #f8f9fa 70%)' }}
      />
      
      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-24 h-24 md:w-32 md:h-32 mb-8 bg-white rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(25,28,29,0.06)] overflow-hidden"
        >
          <img 
            src="/favicon.png" 
            alt="Manikutti Logo" 
            className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full"
          />
        </motion.div>

        {/* Loading Indicator */}
        <div className="w-16 h-1 bg-[#e1e3e4] rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="h-full w-1/3 rounded-full"
            style={{ background: 'linear-gradient(90deg, #006972, #68c9d6)' }}
          />
        </div>
      </div>

      {/* Bottom Branding Anchor */}
      <div className="absolute bottom-12 flex flex-col items-center">
        <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-[#6f797b] opacity-60 font-bold">
          A Digital Sanctuary
        </p>
      </div>
    </main>
  );
}
