/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Cpu, Settings, ShieldCheck, ShieldAlert } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditEventProps {
  entry: AuditLogEntry;
}

export const AuditEvent: React.FC<AuditEventProps> = ({ entry }) => {
  const getActorBadge = () => {
    switch (entry.actorType) {
      case 'Human':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-100">
            <User className="w-3 h-3" />
            HUMAN
          </span>
        );
      case 'Agent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-100">
            <Cpu className="w-3 h-3" />
            AGENT
          </span>
        );
      case 'System':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            <Settings className="w-3 h-3" />
            SYSTEM
          </span>
        );
    }
  };

  const isSuccess = !entry.result.toLowerCase().includes('fail') && !entry.result.toLowerCase().includes('reject');

  return (
    <div className="bg-white border border-zinc-200/80 rounded-lg p-4 hover:border-zinc-300 transition-all shadow-xxs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          {getActorBadge()}
          <span className="text-xs font-mono font-bold text-zinc-800">{entry.actor}</span>
        </div>
        <span className="text-xxs font-mono text-zinc-400">
          {entry.timestamp.includes('T') ? new Date(entry.timestamp).toLocaleString() : entry.timestamp}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
          <span className="text-xs font-mono font-bold text-zinc-900 uppercase shrink-0">Action:</span>
          <span className="text-xs font-sans text-zinc-700 break-words flex-1 min-w-0">{entry.action}</span>
        </div>

        {entry.incidentTitle && (
          <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
            <span className="text-xxs font-mono text-zinc-400 uppercase shrink-0">Target Incident:</span>
            <span className="text-xxs font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded break-words max-w-full">
              {entry.incidentTitle}
            </span>
          </div>
        )}

        <div className="pt-1.5 border-t border-zinc-50 flex items-start gap-2 min-w-0">
          {isSuccess ? (
            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          )}
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase">Result payload:</span>
            <span className="text-xs font-mono text-zinc-600 leading-relaxed block break-words">{entry.result}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
