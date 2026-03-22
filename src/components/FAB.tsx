'use client';

import { Plus, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppShell } from './AppShell';

export default function FAB() {
  const { setIsAddModalOpen } = useAppShell();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-8 z-[60]">
       <button
        onClick={() => setIsAddModalOpen(true)}
        className="w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
