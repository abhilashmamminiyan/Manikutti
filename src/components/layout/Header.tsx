'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function Header({ title, subtitle, icon, actions, className = "" }: HeaderProps) {
  return (
    <header className={`flex justify-between items-center mb-10 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold font-headline dark:text-white">{title}</h1>
          {subtitle && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</span>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
