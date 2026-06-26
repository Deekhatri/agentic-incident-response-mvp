/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Shield, Lock, ArrowRight, Server, Key, User, Mail, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { SupabaseConnectionStatus } from './SupabaseConnectionStatus';
import { supabase } from '../lib/supabase';

interface SignInProps {
  onSignIn: (email: string) => void;
  initialRecoveryMode?: boolean;
  onRecoveryComplete?: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ 
  onSignIn,
  initialRecoveryMode = false,
  onRecoveryComplete
}) => {
  // Support modes: 'signin', 'signup', 'forgot', 'recovery'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'recovery'>(
    initialRecoveryMode ? 'recovery' : 'signin'
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Recovery password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      if (mode === 'signup') {
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
            // Clear fields
            setPassword('');
            setFullName('');
          }
        } else {
          setSuccessMessage('Registration initiated. Please verify your email inbox.');
        }
      } else if (mode === 'signin') {
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
      } else if (mode === 'forgot') {
        // Password Reset Request Flow
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`
        });

        if (resetError) {
          setError(resetError.message);
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Password reset email sent. Check your inbox.');
        // Clear fields
        setEmail('');
      } else if (mode === 'recovery') {
        // Update/Set New Password Flow
        if (newPassword.length < 8) {
          setError('Password must be at least 8 characters long.');
          setIsLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setError('Passwords do not match. Please verify.');
          setIsLoading(false);
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          setError(updateError.message);
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Password updated successfully. Returning to operator portal...');
        setTimeout(() => {
          if (onRecoveryComplete) {
            onRecoveryComplete();
          } else {
            setMode('signin');
            setNewPassword('');
            setConfirmPassword('');
            setSuccessMessage(null);
          }
        }, 2200);
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

  const getSubTitleText = () => {
    switch (mode) {
      case 'signup':
        return 'Register your profile in the cluster auth directory to secure your remediation capabilities.';
      case 'forgot':
        return 'Initiate secure password recovery by specifying your registered operator account email.';
      case 'recovery':
        return 'Define a highly secure new password passphrase for your cluster operator login.';
      case 'signin':
      default:
        return 'Authenticate using your cluster credentials to access active self-healing runtimes.';
    }
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
            <h3 className="text-sm font-semibold text-zinc-900 font-sans flex items-center gap-1.5">
              {mode === 'forgot' && (
                <button 
                  type="button" 
                  onClick={() => { setMode('signin'); setError(null); setSuccessMessage(null); }}
                  className="p-1 hover:bg-zinc-100 rounded-full transition-colors mr-0.5"
                  title="Return to sign in"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-600" />
                </button>
              )}
              {mode === 'signin' && 'Operator Authentication'}
              {mode === 'signup' && 'Create Operator Account'}
              {mode === 'forgot' && 'Reset Operator Passphrase'}
              {mode === 'recovery' && 'Establish New Passphrase'}
            </h3>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              {getSubTitleText()}
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
            {mode === 'signup' && (
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

            {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
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
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-500 tracking-wide">
                    PASSPHRASE
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xxs font-mono text-zinc-500 hover:text-zinc-900 underline underline-offset-4 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
            )}

            {mode === 'recovery' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-500 tracking-wide">
                    NEW PASSPHRASE (MIN 8 CHARS)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs font-mono p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
                    />
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-500 tracking-wide">
                    CONFIRM NEW PASSPHRASE
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs font-mono p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
                    />
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-md text-xs font-mono font-bold transition-all border border-transparent shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Processing...
                </>
              ) : mode === 'signup' ? (
                <>
                  Register New Account
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'signin' ? (
                <>
                  Authenticate Operator
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'forgot' ? (
                <>
                  Send Recovery Dispatch
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Save New Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between states */}
          {mode !== 'recovery' && (
            <div className="text-center">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); setSuccessMessage(null); }}
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-900 underline underline-offset-4 cursor-pointer"
                >
                  Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                    setSuccessMessage(null);
                    setPassword('');
                  }}
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-900 underline underline-offset-4 cursor-pointer"
                >
                  {mode === 'signin' 
                    ? 'Need a persistent profile? Create Operator Account' 
                    : 'Already have an account? Sign In'}
                </button>
              )}
            </div>
          )}

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
