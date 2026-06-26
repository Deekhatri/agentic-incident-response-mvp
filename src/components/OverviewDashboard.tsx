/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Layers, 
  FileCheck, 
  Clock, 
  Terminal, 
  Cpu, 
  ArrowRight, 
  Zap, 
  RotateCcw,
  PlusCircle,
  Bell,
  Play,
  CheckCircle,
  TrendingDown
} from 'lucide-react';
import { Incident, AuditLogEntry, SeverityLevel } from '../types';
import { MetricCard } from './MetricCard';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { ConfidenceScore } from './ConfidenceScore';
import { formatReadableTimestamp } from '../mockData';
import { SupabaseConnectionStatus } from './SupabaseConnectionStatus';

interface OverviewDashboardProps {
  incidents: Incident[];
  auditLogs: AuditLogEntry[];
  recentActivities: { id: string; timestamp: string; message: string }[];
  onSelectIncident: (id: string) => void;
  onGenerateTestIncident: () => void;
  onResetDemo: () => void;
  isGeneratingTest: boolean;
  testAlertsStream: any[];
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  incidents,
  auditLogs,
  recentActivities,
  onSelectIncident,
  onGenerateTestIncident,
  onResetDemo,
  isGeneratingTest,
  testAlertsStream
}) => {
  // Compute metrics dynamically from current state
  const activeIncidents = incidents.filter(inc => inc.status !== 'Resolved');
  const activeCount = activeIncidents.length;
  const awaitingApprovalCount = incidents.filter(inc => inc.remediationStatus === 'Pending Approval').length;
  
  // Hardcoded or computed overall stats
  const totalAlertsReceived = incidents.length > 0
    ? incidents.reduce((acc, inc) => acc + inc.alertCount, 0) + 124
    : 0;
  const groupedAlerts = incidents.reduce((acc, inc) => acc + inc.alertCount, 0);
  const noiseReductionPercentage = totalAlertsReceived > 0 
    ? ((groupedAlerts / totalAlertsReceived) * 100).toFixed(1) 
    : '0.0';

  // Compute severity breakdown
  const sev1Count = incidents.filter(inc => inc.severity === 'SEV-1').length;
  const sev2Count = incidents.filter(inc => inc.severity === 'SEV-2').length;
  const sev3Count = incidents.filter(inc => inc.severity === 'SEV-3').length;
  const totalCount = incidents.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-900 tracking-tight">OPERATIONAL CONTROL BOARD</h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Real-time noise suppression, root-cause correlation, and agent execution dashboards.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          {incidents.some(inc => inc.id === 'inc-notification-queue') ? (
            <button
              type="button"
              onClick={onResetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              Reset Test Demo
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerateTestIncident}
              disabled={isGeneratingTest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-mono font-medium transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-zinc-300" />
              {isGeneratingTest ? 'Generating Alert Storm...' : 'Generate Test Incident'}
            </button>
          )}
        </div>
      </div>

      {/* Alert Storm Stream Overlay during generation */}
      {isGeneratingTest && (
        <div className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-5 rounded-lg font-mono space-y-3 shadow-md animate-pulse">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs">
            <span className="flex items-center gap-2 text-red-400 font-bold">
              <Bell className="w-4 h-4 animate-bounce" />
              INCOMING ALERTS DETECTED (TELEMETRY INGEST)
            </span>
            <span className="text-zinc-500">Buffering cluster logs...</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px] scrollbar-thin">
            {testAlertsStream.map((alt, idx) => (
              <div key={idx} className="flex gap-2 text-zinc-400">
                <span className="text-red-500 font-semibold shrink-0">[{alt.source}]</span>
                <span className="text-zinc-500 shrink-0">{new Date(alt.timestamp).toLocaleTimeString()}</span>
                <span className="truncate">{alt.message}</span>
              </div>
            ))}
          </div>
          {testAlertsStream.length > 5 && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-purple-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 animate-spin" />
                ResolveOps Agent Correlation pipeline analyzing failure pathways...
              </span>
              <span className="text-xxs font-mono bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                DEDUPING & SUPPRESSING
              </span>
            </div>
          )}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Active Incidents"
          value={activeCount}
          description="Awaiting mitigation"
          icon={ShieldAlert}
          trend={{ value: `${activeCount > 2 ? '+' : ''}${activeCount - 2} delta`, isPositive: activeCount < 3 }}
        />
        <MetricCard
          title="Alerts Received"
          value={totalAlertsReceived}
          description="Total raw system events"
          icon={Bell}
        />
        <MetricCard
          title="Alerts Grouped"
          value={groupedAlerts}
          description="Telemetry aggregated"
          icon={Layers}
        />
        <MetricCard
          title="Noise Reduction"
          value={`${noiseReductionPercentage}%`}
          description="Suppressed alerts ratio"
          icon={TrendingDown}
          trend={{ value: "Operational", isPositive: true }}
        />
        <MetricCard
          title="Pending Actions"
          value={awaitingApprovalCount}
          description="Awaiting manual confirm"
          icon={FileCheck}
          trend={awaitingApprovalCount > 0 ? { value: "Review Req", isPositive: false } : undefined}
        />
        <MetricCard
          title="Mean Time To Ack"
          value="1.8m"
          description="Operational average"
          icon={Clock}
        />
      </div>

      {/* Main Grid: Left column (Incidents table & System summary) - Right Column (Charts & Log feeds) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Incidents Table Card */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-800">
                Active Incidents Log
              </h3>
              {incidents.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => onSelectIncident(incidents[0].id)} 
                  className="text-xs font-mono font-medium text-zinc-500 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 font-mono border-b border-zinc-200">
                    <th className="py-3 px-4 font-bold">INCIDENT</th>
                    <th className="py-3 px-4 font-bold">SERVICE</th>
                    <th className="py-3 px-4 font-bold">SEVERITY</th>
                    <th className="py-3 px-4 font-bold">STATUS</th>
                    <th className="py-3 px-4 font-bold">CONFIDENCE</th>
                    <th className="py-3 px-4 font-bold">ACTIONS</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-zinc-200/60 font-sans">
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                        <ShieldAlert className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        <span className="block font-medium text-zinc-900 text-xs">No active incidents found</span>
                        <span className="block text-[11px] text-zinc-500 mt-0.5">Generate a test incident to begin tracking cluster alerts.</span>
                      </td>
                    </tr>
                  ) : (
                    incidents.map((inc) => (
                      <tr 
                        key={inc.id} 
                        className={`hover:bg-zinc-50/50 transition-colors ${
                          inc.status === 'Resolved' ? 'opacity-65' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-medium text-zinc-900">
                          <div className="max-w-xs sm:max-w-sm truncate" title={inc.title}>
                            {inc.title}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                            ID: {inc.id} • Grouped: {inc.alertCount} alerts
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <code className="text-xxs px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-800 font-mono rounded">
                            {inc.service}
                          </code>
                          <span className="text-xxs font-mono text-zinc-400 block mt-1">
                            Env: {inc.environment}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <SeverityBadge severity={inc.severity} />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inc.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <ConfidenceScore score={inc.confidence} />
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => onSelectIncident(inc.id)}
                            className="px-2 py-1 bg-zinc-100 border border-zinc-200 hover:bg-zinc-900 hover:text-white rounded text-[10px] font-mono font-medium transition-all cursor-pointer"
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Health Indicators Card */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-800">
              Agent Node Cluster Telemetry Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  CPU Utilisation
                </span>
                <span className="text-lg font-mono font-bold text-zinc-800">24.5%</span>
                <div className="w-full bg-zinc-200 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-zinc-800 h-full" style={{ width: '24.5%' }}></div>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Active Replica Count
                </span>
                <span className="text-lg font-mono font-bold text-zinc-800">148 / 152</span>
                <div className="w-full bg-zinc-200 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '97.3%' }}></div>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Database Connections
                </span>
                <span className="text-lg font-mono font-bold text-zinc-800">1,248 / sec</span>
                <div className="w-full bg-zinc-200 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-zinc-800 h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          
          {/* Severity Breakdown Custom Ring Chart */}
          <div className="bg-white border border-zinc-200 p-5 rounded-lg shadow-xs space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-800">
              Severity Distribution
            </h3>
            
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {/* Custom SVG Ring Representation */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f4f4f5"
                    strokeWidth="12"
                  />
                  {/* SEV-1 ring arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (sev1Count / totalCount))}
                    strokeLinecap="square"
                    className="transition-all duration-500"
                  />
                  {/* SEV-2 ring arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (sev2Count / totalCount))}
                    className="transition-all duration-500 origin-center rotate-45"
                  />
                  {/* SEV-3 ring arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (sev3Count / totalCount))}
                    className="transition-all duration-500 origin-center rotate-90"
                  />
                </svg>
                {/* Overlay Text */}
                <div className="absolute text-center">
                  <span className="text-2xl font-mono font-bold text-zinc-800">{totalCount}</span>
                  <span className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider leading-none mt-1">Total Incidents</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="w-full grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-zinc-100">
                <div className="space-y-0.5">
                  <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-xs mr-1"></span>
                  <span className="text-zinc-500">SEV-1</span>
                  <p className="font-bold text-zinc-800">{sev1Count}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-xs mr-1"></span>
                  <span className="text-zinc-500">SEV-2</span>
                  <p className="font-bold text-zinc-800">{sev2Count}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-xs mr-1"></span>
                  <span className="text-zinc-500">SEV-3</span>
                  <p className="font-bold text-zinc-800">{sev3Count}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supabase Connection Status Widget */}
          <SupabaseConnectionStatus />

          {/* Recent Agent Activity Logs Feed */}
          <div className="bg-white border border-zinc-200 p-5 rounded-lg shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                Recent Agent Pipeline
              </h3>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="text-xs space-y-1 p-2 hover:bg-zinc-50 rounded border border-transparent hover:border-zinc-100 transition-all">
                  <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400">
                    <span>AGENCY PIPELINE COMPLETED</span>
                    <span>{act.timestamp.includes('T') ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : act.timestamp}</span>
                  </div>
                  <p className="text-zinc-700 leading-relaxed font-sans">{act.message}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
