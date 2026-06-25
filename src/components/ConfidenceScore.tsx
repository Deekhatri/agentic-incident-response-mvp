/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ConfidenceScoreProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({ score, size = 'sm' }) => {
  let colorClass = 'text-green-600 bg-green-50 border-green-200';
  let barColorClass = 'bg-green-500';

  if (score < 60) {
    colorClass = 'text-red-600 bg-red-50 border-red-200';
    barColorClass = 'bg-red-500';
  } else if (score < 85) {
    colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
    barColorClass = 'bg-amber-500';
  }

  if (size === 'lg') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-zinc-500">Agent Confidence</span>
          <span className="text-2xl font-mono font-bold text-zinc-900">{score}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
          <div className={`h-full ${barColorClass} transition-all duration-500`} style={{ width: `${score}%` }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 bg-zinc-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
        <div className={`h-full ${barColorClass}`} style={{ width: `${score}%` }}></div>
      </div>
      <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium border ${colorClass}`}>
        {score}%
      </span>
    </div>
  );
};
