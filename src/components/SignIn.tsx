/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Shield, Lock, ArrowRight, Server, Key, User, Mail, Loader2, CheckCircle } from 'lucide-react';
import { SupabaseConnectionStatus } from './SupabaseConnectionStatus';
import { supabase } from '../lib/supabase';

interface SignInProps {
  onSignIn: (email: string) => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!supabase) {
      setError('Supabase connection is not initialized. Please verify your environment parameters.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up Flow
        if (!fullName.trim()) {
          setError('Full Name is required.');
          setIsLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          // After successful signup, attempt to insert into profiles table
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                full_name: fullName,
              });

            if (profileError) {
              console.warn('Failed to insert profile row. Note that table/RLS policy might not exist yet:', profileError.message);
            }
          } catch (profileErr: any) {
            console.error('Profile table insertion encountered exception:', profileErr);
          }

          // Check if session was auto-started (e.g. email confirmation disabled on Supabase project)
          if (data.session) {
            setSuccessMessage('Account created and authenticated successfully!');
            setTimeout(() => {
              onSignIn(data.user?.email || email);
            }, 1200);
          } else {
            setSuccessMessage('Registration successful! Please check your email inbox to confirm registration.');
            // Clear passwords to prepare for sign in
            setPassword('');
          }
        } else {
          setSuccessMessage('Registration initiated. Please verify your email inbox.');
        }
      } else {
        // Sign In Flow
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          onSignIn(data.user.email || email);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication system failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    // Set sessionStorage so refreshing maintains demo state
    sessionStorage.setItem('resolveops_demo_user', 'demo-operator@resolveops.io');
    onSignIn('demo-operator@resolveops.io');
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
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
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-900 font-sans">
              {isSignUp ? 'Create Operator Account' : 'Operator Authentication'}
            </h3>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              {isSignUp 
                ? 'Register your profile in the cluster auth directory to secure your remediation capabilities.'
                : 'Authenticate using your cluster credentials to access active self-healing runtimes.'
              }
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs font-mono text-red-600 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] text-red-800 mb-0.5">AUTHENTICATION ERROR</span>
                {error}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-xs font-mono text-green-700 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] text-green-800 mb-0.5">SUCCESS TIMELINE</span>
                {successMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase text-zinc-500 tracking-wide">
                  OPERATOR FULL NAME
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full text-xs font-mono p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

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
                  placeholder="name@company.com"
                  className="w-full text-xs font-mono p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
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
                  placeholder="••••••••••••"
                  className="w-full text-xs font-mono p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-md text-xs font-mono font-bold transition-all border border-transparent shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Processing Authentication...
                </>
              ) : isSignUp ? (
                <>
                  Register New Account
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Authenticate Operator
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between sign in and sign up */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-900 underline underline-offset-4 cursor-pointer"
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : 'Need a persistent profile? Create Operator Account'}
            </button>
          </div>

          {/* Separation line */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-zinc-400 uppercase tracking-widest">OR USE TEST RUNTIME</span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          {/* Quick Demo entrance */}
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 rounded-md text-xs font-mono font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Key className="w-4 h-4 text-zinc-500" />
            Explore Demo Without Saving
          </button>

          {/* Backend connection status */}
          <div className="pt-1">
            <SupabaseConnectionStatus isDark={true} />
          </div>
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
