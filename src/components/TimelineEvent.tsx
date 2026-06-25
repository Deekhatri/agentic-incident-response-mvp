/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Cpu, User, CpuIcon, Layers } from 'lucide-react';
import { TimelineEvent as TimelineEventType } from '../types';
import { getRelativeTime } from '../mockData';

interface TimelineEventProps {
  event: TimelineEventType;
  isLast?: boolean;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ event, isLast }) => {
  const getIcon = () => {
    switch (event.type) {
      case 'Alert':
        return (
          <div className="p-1 bg-red-50 border border-red-200 rounded-full text-red-600">
            <Bell className="w-4 h-4" />
          </div>
        );
      case 'System':
        return (
          <div className="p-1 bg-zinc-100 border border-zinc-200 rounded-full text-zinc-600">
            <Layers className="w-4 h-4" />
          </div>
        );
      case 'Agent':
        return (
          <div className="p-1 bg-purple-50 border border-purple-200 rounded-full text-purple-600">
            <Cpu className="w-4 h-4" />
          </div>
        );
      case 'Human':
        return (
          <div className="p-1 bg-blue-50 border border-blue-200 rounded-full text-blue-600">
            <User className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="z-10 shrink-0">
          {getIcon()}
        </div>
        {!isLast && (
          <div className="w-0.5 bg-zinc-200 flex-1 my-1 group-last:hidden"></div>
        )}
      </div>

      <div className="pb-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <span className="text-sm font-semibold text-zinc-900 font-sans">{event.title}</span>
          <span className="text-xxs font-mono text-zinc-400">
            {event.timestamp.includes('T') ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : event.timestamp}
          </span>
        </div>
        <p className="text-xs text-zinc-600 mt-1 leading-relaxed font-sans">{event.description}</p>
        <span className="inline-block text-[10px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-200/50 px-1.5 py-0.25 rounded-sm mt-1.5">
          Type: {event.type}
        </span>
      </div>
    </div>
  );
};
