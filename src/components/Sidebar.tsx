/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, ShieldAlert, FileText, ClipboardList, LogOut, Terminal, Layers } from 'lucide-react';

interface SidebarProps {
  activeScreen: 'dashboard' | 'incidents' | 'audit' | 'incident-detail';
  setActiveScreen: (screen: 'dashboard' | 'incidents' | 'audit') => void;
  userEmail: string;
  onSignOut: () => void;
  systemHealth: 'Healthy' | 'Degraded' | 'Recovering';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  setActiveScreen,
  userEmail,
  onSignOut,
  systemHealth
}) => {
  const getHealthBadge = () => {
    switch (systemHealth) {
      case 'Healthy':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-green-500/15 text-green-400 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            HEALTHY
          </span>
        );
      case 'Degraded':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
            DEGRADED
          </span>
        );
      case 'Recovering':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-spin"></span>
            RECOVERING
          </span>
        );
    }
  };

  return (
    <div className="w-64 bg-zinc-950 text-zinc-100 flex flex-col justify-between shrink-0 border-r border-zinc-800">
      <div className="flex flex-col flex-1">
        {/* Branding Title */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200">
              <Terminal className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <span className="font-display text-base font-bold tracking-tight text-white block">ResolveOps</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mt-0.5">Autonomous MVP</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveScreen('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-sans font-medium transition-colors ${
              activeScreen === 'dashboard'
                ? 'bg-zinc-900 text-white border-l-2 border-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <Activity className="w-4.5 h-4.5 shrink-0" />
            Overview Dashboard
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('incidents')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-sans font-medium transition-colors ${
              activeScreen === 'incidents' || activeScreen === 'incident-detail'
                ? 'bg-zinc-900 text-white border-l-2 border-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            Active Incidents
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('audit')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-sans font-medium transition-colors ${
              activeScreen === 'audit'
                ? 'bg-zinc-900 text-white border-l-2 border-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <ClipboardList className="w-4.5 h-4.5 shrink-0" />
            Audit Log Feed
          </button>
        </nav>
      </div>

      {/* System Health Summary & User Profile */}
      <div className="p-4 border-t border-zinc-900 space-y-4 bg-zinc-950/80">
        {/* System Health */}
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-md">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">Cluster Health Status</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-zinc-300">k8s-staging-01</span>
            {getHealthBadge()}
          </div>
        </div>

        {/* User profile */}
        <div className="flex items-center justify-between pt-1">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-mono text-zinc-500 block">AUTHORIZED USER</span>
            <span className="text-xs font-mono font-medium text-zinc-300 truncate block mt-0.5" title={userEmail}>
              {userEmail}
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign Out"
            className="p-1.5 bg-zinc-900 hover:bg-red-950 hover:text-red-400 text-zinc-400 border border-zinc-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
