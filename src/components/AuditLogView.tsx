/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ClipboardList, Shield, Filter, RotateCcw } from 'lucide-react';
import { AuditLogEntry, ActorType } from '../types';
import { AuditEvent } from './AuditEvent';

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actorFilter, setActorFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(entry => {
    const matchesSearch = entry.actor.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (entry.incidentTitle && entry.incidentTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          entry.result.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActor = actorFilter === 'ALL' || entry.actorType === actorFilter;
    
    return matchesSearch && matchesActor;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="font-display text-xl font-bold text-zinc-900 tracking-tight">OPERATIONS AUDIT LOG TRAIL</h2>
        <p className="text-xs text-zinc-500 font-sans mt-0.5">
          Immutable cryptographic ledger verifying actions of human operators, automated pipelines, and the autonomous Agent.
        </p>
      </div>

      {/* Filter Options */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xxs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search audit trail by actor, action, result, or target incident..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-sans p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
        </div>

        <div className="flex gap-2 shrink-0">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="text-xs font-sans p-2.5 bg-white border border-zinc-300 rounded-md outline-hidden text-zinc-700 w-36"
          >
            <option value="ALL">All Actors</option>
            <option value="Human">Humans</option>
            <option value="Agent">Agents</option>
            <option value="System">Systems</option>
          </select>

          {(searchTerm || actorFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActorFilter('ALL');
              }}
              title="Reset search"
              className="p-2.5 border border-zinc-200 bg-zinc-50 rounded hover:bg-zinc-100"
            >
              <RotateCcw className="w-4 h-4 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {/* Logs Feed List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center space-y-2">
            <ClipboardList className="w-10 h-10 text-zinc-300 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-900">No Logs Recorded</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No immutable operations entries matched your active filters. Expand search keywords or select 'All Actors'.
            </p>
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <AuditEvent key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
};
