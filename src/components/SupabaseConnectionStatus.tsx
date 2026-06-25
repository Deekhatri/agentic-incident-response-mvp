import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertTriangle, Loader2, Database } from 'lucide-react';

interface SupabaseConnectionStatusProps {
  isDark?: boolean;
}

export const SupabaseConnectionStatus: React.FC<SupabaseConnectionStatusProps> = ({ isDark = false }) => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error' | 'missing'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function checkConnection() {
      if (!supabase) {
        setStatus('missing');
        setErrorMessage('Supabase environment variables (URL or Anon Key) are missing.');
        return;
      }

      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus('error');
          setErrorMessage(error.message || 'Failed to query Supabase API.');
        } else {
          setStatus('connected');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message || 'Network error connecting to Supabase gateway.');
      }
    }

    checkConnection();
  }, []);

  if (isDark) {
    return (
      <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-md font-mono text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            Supabase Connection
          </span>
          <span className="text-[9px] text-zinc-500">Gateway Check</span>
        </div>
        <div className="pt-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400">Connection Status</span>
          {status === 'loading' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
              <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
              Checking backend connection
            </span>
          )}
          {status === 'connected' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              Supabase connected
            </span>
          )}
          {status === 'missing' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title={errorMessage}>
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              Local Demo (Env Missing)
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20" title={errorMessage}>
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              Connection Error
            </span>
          )}
        </div>
        {(status === 'missing' || status === 'error') && (
          <div className="mt-2 text-[9px] text-zinc-500 leading-normal border-t border-zinc-800/60 pt-1.5">
            {status === 'missing' 
              ? 'Operating in local demo mode. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to activate.' 
              : errorMessage}
          </div>
        )}
      </div>
    );
  }

  // Light theme for main cards / dashboard widgets
  return (
    <div className="bg-white border border-zinc-200 p-5 rounded-lg shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-zinc-500" />
          Backend Connection
        </h3>
        <span className="text-xxs font-mono text-zinc-400">Gateway Status</span>
      </div>
      <div className="flex items-center justify-between gap-4 py-1 text-xs">
        <span className="text-zinc-600 font-medium">Supabase API Status</span>
        {status === 'loading' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-zinc-50 text-zinc-500 border border-zinc-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            Checking backend connection
          </span>
        )}
        {status === 'connected' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-green-50 text-green-700 border border-green-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Supabase connected
          </span>
        )}
        {status === 'missing' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200/60" title={errorMessage}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Local Demo (Env Missing)
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-red-50 text-red-700 border border-red-200/60" title={errorMessage}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            Connection Error
          </span>
        )}
      </div>
      {(status === 'missing' || status === 'error') && (
        <p className="text-[10px] font-mono text-zinc-400 leading-normal bg-zinc-50 p-2.5 rounded border border-zinc-150">
          {status === 'missing'
            ? 'The application is running in local-only demo mode because Supabase env parameters are missing.'
            : `Connection error details: ${errorMessage}`}
        </p>
      )}
    </div>
  );
};
