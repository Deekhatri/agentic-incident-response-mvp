/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Shield, Lock, ArrowRight, Server, Key } from 'lucide-react';

interface SignInProps {
  onSignIn: (email: string) => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('deekhatri20@gmail.com');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(email);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        {/* Banner header with code styling */}
        <div className="p-6 bg-zinc-950 text-zinc-100 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-white leading-tight">ResolveOps</h2>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Autonomous Incident Remediation</span>
            </div>
          </div>
        </div>

        {/* Form area */}
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-900 font-sans">Operator Authentication</h3>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              Authenticate using your cluster IAM credentials to access active remediation runtimes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-zinc-500 tracking-wide">
                OPERATOR EMAIL
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
                />
                <Server className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-zinc-500 tracking-wide">
                PASSPHRASE
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-400"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-mono font-bold transition-all border border-transparent shadow-xs cursor-pointer"
            >
              Authenticate Operator
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Separation line */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-zinc-400 uppercase tracking-widest">OR USE TEST RUNTIME</span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          {/* Quick Demo entrance */}
          <button
            type="button"
            onClick={() => onSignIn('deekhatri20@gmail.com')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 rounded-md text-xs font-mono font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Key className="w-4 h-4 text-zinc-500" />
            Access Demo Environment
          </button>
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100/80 text-center">
          <span className="text-[10px] font-mono text-zinc-400 flex items-center justify-center gap-1.5 leading-none">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            SECURE SANDBOX ENVIRONMENT ENABLED
          </span>
        </div>
      </div>
    </div>
  );
};
