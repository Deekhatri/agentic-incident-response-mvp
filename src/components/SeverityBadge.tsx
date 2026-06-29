/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SeverityLevel } from '../types';

interface SeverityBadgeProps {
  severity: SeverityLevel;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  let badgeClass = 'bg-zinc-100 text-zinc-800 border-zinc-200';

  switch (severity) {
    case 'SEV-1':
      badgeClass = 'bg-red-50 text-red-700 border-red-200 font-bold';
      break;
    case 'SEV-2':
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      break;
    case 'SEV-3':
      badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-xs font-mono border shrink-0 whitespace-nowrap ${badgeClass}`}>
      {severity}
    </span>
  );
};
