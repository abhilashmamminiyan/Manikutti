'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function VoiceDialogContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('query') || '';

  const deepLink = query
    ? `manikutti://voice-dialog?query=${encodeURIComponent(query)}`
    : 'manikutti://voice-dialog';

  const intentUrl = query
    ? `intent://voice-dialog?query=${encodeURIComponent(query)}#Intent;scheme=manikutti;package=com.abhilash.manikutti;end`
    : 'intent://voice-dialog#Intent;scheme=manikutti;package=com.abhilash.manikutti;end';

  useEffect(() => {
    // Attempt automatic deep link dispatch
    const timeout = setTimeout(() => {
      window.location.href = intentUrl;
    }, 150);

    return () => clearTimeout(timeout);
  }, [intentUrl]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Manikutti Voice Expense</h1>
        <p className="text-slate-400 text-sm mb-6">
          {query ? `Logging: "${query}"` : 'Opening voice recording overlay on your device...'}
        </p>

        <div className="space-y-3">
          <a
            href={intentUrl}
            className="block w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg transition-all"
          >
            Open in Manikutti App
          </a>

          <a
            href={deepLink}
            className="block w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-2xl transition-all text-xs"
          >
            Direct URI Scheme (manikutti://)
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VoiceDialogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Voice Expense...</div>}>
      <VoiceDialogContent />
    </Suspense>
  );
}
