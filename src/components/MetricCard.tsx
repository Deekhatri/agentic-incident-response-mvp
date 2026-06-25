/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean; // positive in operational terms, e.g. noise reduction is positive
  };
  icon: LucideIcon;
  id?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon,
  id
}) => {
  return (
    <div id={id} className="bg-white p-5 rounded-lg border border-zinc-200 shadow-xs flex justify-between items-start">
      <div className="space-y-1">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-semibold text-zinc-900 tracking-tight">{value}</span>
          {trend && (
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {trend.value}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-zinc-500 font-sans">{description}</p>
        )}
      </div>
      <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
        <Icon className="w-5 h-5 text-zinc-600" />
      </div>
    </div>
  );
};
