'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppShell } from './AppShell';
import { X, History, Calculator as CalcIcon, ArrowRight, Delete, RotateCcw } from 'lucide-react';

export default function Calculator() {
  const { 
    setIsCalculatorOpen, 
    setIsAddModalOpen, 
    setPrefillAmount, 
    calculatorHistory, 
    fetchCalculatorHistory 
  } = useAppShell();
  
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchCalculatorHistory();
  }, []);

  const handleNumber = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOperator = (op: string) => {
    setExpression(prev => prev + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = async () => {
    try {
      const fullExpression = expression + display;
      // Basic safety: only allow math characters
      if (/[^0-9\s\+\-\*\/\.\%]/.test(fullExpression)) return;
      
      const result = eval(fullExpression.replace(/%/g, '/100'));
      const formattedResult = Number(result.toFixed(2)).toString();
      
      setDisplay(formattedResult);
      setExpression('');

      // Save to history
      setIsSyncing(true);
      await fetch('/api/sheets/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: fullExpression, result: formattedResult }),
      });
      await fetchCalculatorHistory();
      setIsSyncing(false);
    } catch (err) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
  };

  const backspace = () => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const sendToLedger = () => {
    setPrefillAmount(display);
    setIsCalculatorOpen(false);
    setIsAddModalOpen(true);
  };

  const buttons = [
    { label: 'C', action: clear, className: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
    { label: '⌫', action: backspace, className: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
    { label: '%', action: () => handleOperator('%'), className: 'text-primary bg-primary/10' },
    { label: '/', action: () => handleOperator('/'), className: 'text-primary bg-primary/10' },
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '*', action: () => handleOperator('*'), className: 'text-primary bg-primary/10' },
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '-', action: () => handleOperator('-'), className: 'text-primary bg-primary/10' },
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '+', action: () => handleOperator('+'), className: 'text-primary bg-primary/10' },
    { label: '0', action: () => handleNumber('0'), className: 'col-span-2' },
    { label: '.', action: () => handleNumber('.') },
    { label: '=', action: calculate, className: 'bg-primary text-white shadow-lg shadow-primary/30' },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowHistory(!showHistory)}
             className={`p-3 rounded-2xl transition-all ${showHistory ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
           >
             <History size={20} />
           </button>
           <h3 className="font-black text-lg dark:text-white">{showHistory ? 'Sync History' : 'Magic Calculator'}</h3>
        </div>
        {isSyncing && (
           <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold uppercase">Syncing</span>
           </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!showHistory ? (
            <motion.div
              key="calc"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full gap-6"
            >
              {/* Display */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 flex flex-col items-end justify-center gap-1">
                <div className="text-xs font-bold text-slate-400 h-4">{expression}</div>
                <div className="text-4xl font-black dark:text-white truncate max-w-full">{display}</div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-4 gap-3">
                {buttons.map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className={`h-16 rounded-2xl font-black text-lg transition-all active:scale-90 hover:brightness-95 flex items-center justify-center ${btn.className || 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white shadow-sm'}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <button
                onClick={sendToLedger}
                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white p-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all hover:gap-5 group"
              >
                Send sum to Ledger
                <ArrowRight size={20} className="transition-all group-hover:translate-x-1" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col gap-4"
            >
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar pb-20">
                {calculatorHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <CalcIcon size={48} className="mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">No shared history yet</p>
                  </div>
                ) : (
                  calculatorHistory.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => setDisplay(item.result)}
                      className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60%]">{item.user}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 mb-1">{item.expression}</div>
                      <div className="text-lg font-black dark:text-white flex justify-between items-center">
                        = {item.result}
                        <CalcIcon size={14} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="absolute bottom-0 left-0 right-0 py-4 bg-gradient-to-t from-white dark:from-slate-900 to-transparent flex justify-center"
              >
                 <div className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                    Back to keypad
                 </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
