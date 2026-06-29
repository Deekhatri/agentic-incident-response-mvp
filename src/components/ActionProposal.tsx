/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Shield, HelpCircle, Eye } from 'lucide-react';
import { RemediationStatus } from '../types';

interface ActionProposalProps {
  proposedRemediation: string;
  remediationStatus: RemediationStatus;
  remediationResult: string | null;
  blastRadius: string;
  alternativeHypothesis: string;
}

export const ActionProposal: React.FC<ActionProposalProps> = ({
  proposedRemediation,
  remediationStatus,
  remediationResult,
  blastRadius,
  alternativeHypothesis
}) => {
  return (
    <div className="space-y-4">
      {/* Proposed Remediation Card */}
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-4 h-4 text-zinc-600" />
          <h4 className="text-sm font-mono font-bold uppercase tracking-wide text-zinc-800">
            Primary Remediation Proposal
          </h4>
        </div>
        <p className="text-sm text-zinc-700 bg-white p-3 border border-zinc-200/60 rounded-md font-mono leading-relaxed break-words min-w-0">
          {proposedRemediation}
        </p>

        {remediationResult && (
          <div className="mt-3 p-3 bg-green-50/50 border border-green-200/60 rounded-md text-xs text-green-800">
            <span className="font-mono font-bold block mb-1">EXECUTION REPORT:</span>
            <span className="font-mono break-words">{remediationResult}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blast Radius */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-zinc-600" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-zinc-800">
              Blast Radius Estimate
            </h4>
          </div>
          <p className="text-xs text-zinc-600 font-sans leading-relaxed break-words">
            {blastRadius}
          </p>
        </div>

        {/* Alternative Hypothesis */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-zinc-600" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-zinc-800">
              Alternative Hypothesis
            </h4>
          </div>
          <p className="text-xs text-zinc-600 font-sans leading-relaxed break-words">
            {alternativeHypothesis}
          </p>
        </div>
      </div>
    </div>
  );
};
