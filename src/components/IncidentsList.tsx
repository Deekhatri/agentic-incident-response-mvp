/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { Incident, SeverityLevel, IncidentStatus, EnvironmentType } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { ConfidenceScore } from './ConfidenceScore';
import { formatReadableTimestamp } from '../mockData';

interface IncidentsListProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({ incidents, onSelectIncident }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEnv, setSelectedEnv] = useState<string>('ALL');

  // Filter computation
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'ALL' || inc.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || inc.status === selectedStatus;
    const matchesEnv = selectedEnv === 'ALL' || inc.environment === selectedEnv;

    return matchesSearch && matchesSeverity && matchesStatus && matchesEnv;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSeverity('ALL');
    setSelectedStatus('ALL');
    setSelectedEnv('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="font-display text-xl font-bold text-zinc-900 tracking-tight">INCIDENT RECONCILIATION INDEX</h2>
        <p className="text-xs text-zinc-500 font-sans mt-0.5">
          View and query correlated incident records across production, staging, and dev.
        </p>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xxs space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by incident title, service name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-sans p-2.5 pl-9 bg-zinc-50 border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-hidden text-zinc-800"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Clear filters */}
          {(selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || selectedEnv !== 'ALL' || searchTerm) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2 text-xs font-mono font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-md transition-colors shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-zinc-100">
          {/* Severity filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wide">
              Filter Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full text-xs font-sans p-2 bg-white border border-zinc-300 rounded-md outline-hidden text-zinc-700"
            >
              <option value="ALL">All Severities</option>
              <option value="SEV-1">SEV-1 (Critical)</option>
              <option value="SEV-2">SEV-2 (High)</option>
              <option value="SEV-3">SEV-3 (Minor)</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wide">
              Filter Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-sans p-2 bg-white border border-zinc-300 rounded-md outline-hidden text-zinc-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Triggered">Triggered</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Investigating">Investigating</option>
              <option value="Remediating">Remediating</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Environment filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wide">
              Filter Environment
            </label>
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="w-full text-xs font-sans p-2 bg-white border border-zinc-300 rounded-md outline-hidden text-zinc-700"
            >
              <option value="ALL">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Dev">Dev</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table / List Representation */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-zinc-300 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-900">No Incidents Found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Your queries did not yield any correlated active or archived records. Adjust your filters or query terms.
            </p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[580px] relative">
            <table className="w-full text-left border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 font-mono border-b border-zinc-200">
                  <th className="py-3 px-4 font-bold sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">INCIDENT</th>
                  <th className="py-3 px-4 font-bold sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">SERVICE & ENVIRONMENT</th>
                  <th className="py-3 px-4 font-bold sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">SEVERITY</th>
                  <th className="py-3 px-4 font-bold sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">STATUS</th>
                  <th className="py-3 px-4 font-bold text-center sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">ALERTS GROUPED</th>
                  <th className="py-3 px-4 font-bold sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">RCA CONFIDENCE</th>
                  <th className="py-3 px-4 font-bold sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">CREATED TIME</th>
                  <th className="py-3 px-4 font-bold text-right sticky top-0 bg-zinc-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 font-sans">
                {filteredIncidents.map((inc) => (
                  <tr 
                    key={inc.id} 
                    className={`hover:bg-zinc-50/50 transition-colors ${
                      inc.status === 'Resolved' ? 'opacity-65' : ''
                    }`}
                  >
                    <td className="py-4 px-4 min-w-[220px]">
                      <div className="font-semibold text-zinc-900 font-sans max-w-[240px] truncate" title={inc.title}>
                        {inc.title}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
                        <span>ID:</span>
                        <span className="truncate max-w-[80px] inline-block font-bold text-zinc-500" title={inc.id}>{inc.id}</span>
                        <span>• Noise Suppression: {inc.noiseReduction}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono min-w-[160px]">
                      <code className="text-[10px] px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded truncate max-w-[130px] inline-block align-middle" title={inc.service}>
                        {inc.service}
                      </code>
                      <div className="text-[10px] text-zinc-500 mt-1.5 font-sans">
                        Env: <span className="font-semibold font-mono text-zinc-700">{inc.environment}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 shrink-0">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-4 px-4 shrink-0">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-zinc-800 text-center text-sm">
                      {inc.alertCount}
                    </td>
                    <td className="py-4 px-4">
                      <ConfidenceScore score={inc.confidence} />
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-500 text-xxs">
                      {inc.createdAt.includes('T') ? new Date(inc.createdAt).toLocaleString() : inc.createdAt}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectIncident(inc.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Investigate
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
