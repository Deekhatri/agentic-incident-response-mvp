/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, X, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { RemediationStatus } from '../types';

interface ApprovalControlsProps {
  status: RemediationStatus;
  rejectionReason: string | null;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => void;
}

export const ApprovalControls: React.FC<ApprovalControlsProps> = ({
  status,
  rejectionReason,
  onApprove,
  onReject
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const handleApproveClick = async () => {
    setIsApproving(true);
    setApproveError(null);
    try {
      await onApprove();
    } catch (err: any) {
      console.error('[ApprovalControls] Approve Error:', err);
      setApproveError(err.message || 'Failed to approve action proposal.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) return;
    
    setIsSubmittingReject(true);
    // Simulate a brief delay
    setTimeout(() => {
      onReject(reasonInput.trim());
      setShowRejectForm(false);
      setReasonInput('');
      setIsSubmittingReject(false);
    }, 400);
  };

  if (status === 'Pending Approval') {
    return (
      <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-5">
        {!showRejectForm ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 rounded-md text-amber-800">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">Human-In-The-Loop Authorization Required</h4>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  The ResolveOps Agent has formulated a self-healing action. It requires manual confirmation before running scripts in the cluster environment.
                </p>
              </div>
            </div>

            {approveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs flex items-start gap-2 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Approval Failed:</span>
                  <p className="mt-0.5">{approveError}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApproveClick}
                disabled={isApproving}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-sm font-mono font-medium transition-colors border border-transparent shadow-xs disabled:opacity-50 w-full sm:w-auto"
              >
                {isApproving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Approve Proposal
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isApproving}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 rounded-md text-sm font-mono font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                <X className="w-4 h-4 text-zinc-500" />
                Reject
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-mono font-bold uppercase text-amber-800 tracking-wide">
                Reject Remediation Proposal
              </h4>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-700">
                Reason for Rejection
              </label>
              <textarea
                required
                rows={3}
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Specify why this proposal is rejected (e.g. invalid root cause, incorrect target service)..."
                className="w-full text-sm font-sans p-2.5 bg-white border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReject}
                className="px-3 py-1.5 text-xs font-mono bg-red-600 hover:bg-red-700 text-white rounded font-medium shadow-xs disabled:opacity-50"
              >
                {isSubmittingReject ? 'Saving...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (status === 'Approved') {
    return (
      <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-5 flex flex-col items-center justify-center text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">Remediation Executing</h4>
          <p className="text-xs text-zinc-600 mt-1 max-w-md">
            Spinning up ResolveOps action engine. Injecting environment variables and triggering rolling restart on Kubernetes deployments...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'Executing') {
    return (
      <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-5 flex flex-col items-center justify-center text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">Injecting Config Map & Restarting Pods</h4>
          <p className="text-xs text-zinc-600 mt-1 max-w-md font-mono">
            $ kubectl rollout restart deployment/checkout-api -n staging
          </p>
        </div>
      </div>
    );
  }

  if (status === 'Completed') {
    return (
      <div className="border border-green-200 bg-green-50/40 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-green-100 rounded-md text-green-800">
            <Check className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-zinc-900">Remediation Action Succeeded</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              The automated script completed execution. Environment variable was set to correct values, and service replicas have successfully finished a healthy rolling restart. Traffic routing verified.
            </p>
            <div className="text-xxs font-mono text-zinc-400 mt-2 bg-white/50 p-2 border border-zinc-100 rounded">
              Exit Code: 0 | Health probe: HTTP 200 OK
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Rejected') {
    return (
      <div className="border border-red-200 bg-red-50/40 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-red-100 rounded-md text-red-800">
            <X className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-sm font-semibold text-zinc-900">Remediation Proposal Rejected</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              This action proposal was manually declined. The Agent has paused automated mitigation pipelines for this incident.
            </p>
            {rejectionReason && (
              <div className="p-3 bg-white border border-red-100 rounded-md">
                <span className="block text-xxs font-mono font-bold text-red-500 uppercase tracking-wider mb-1">
                  Rejection Reason:
                </span>
                <p className="text-xs text-zinc-700 italic font-sans">
                  "{rejectionReason}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
