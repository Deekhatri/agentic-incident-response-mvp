/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IncidentStatus } from '../types';

interface StatusBadgeProps {
  status: IncidentStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
  let dotClass = 'bg-zinc-400';

  switch (status) {
    case 'Triggered':
      bgClass = 'bg-red-50 text-red-700 border-red-200';
      dotClass = 'bg-red-500 animate-pulse';
      break;
    case 'Acknowledged':
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
      dotClass = 'bg-amber-500';
      break;
    case 'Investigating':
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      dotClass = 'bg-blue-500 animate-pulse';
      break;
    case 'Remediating':
      bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
      dotClass = 'bg-purple-500 animate-pulse';
      break;
    case 'Resolved':
      bgClass = 'bg-green-50 text-green-700 border-green-200';
      dotClass = 'bg-green-500';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium border shrink-0 whitespace-nowrap ${bgClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
      {status}
    </span>
  );
};
