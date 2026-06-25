/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Terminal, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface EvidenceItemProps {
  evidence: string;
  index: number;
}

export const EvidenceItem: React.FC<EvidenceItemProps> = ({ evidence, index }) => {
  // Try to parse out technical variables or numbers for highlighting
  const renderHighlightedText = (text: string) => {
    // Regex to match things like v2.4.8, 14:32, PAYMENT_GATEWAY_URL, CrashLoopBackOff, HTTP 5xx, checkout-api etc.
    const regex = /(v\d+\.\d+\.\d+|PAYMENT_GATEWAY_URL|CrashLoopBackOff|checkout-api|HTTP 5xx|5xx|\d{2}:\d{2})/g;
    
    if (!regex.test(text)) {
      return text;
    }
    
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono">
            {part}
          </code>
        );
      }
      return part;
    });
  };

  const getIcon = () => {
    if (evidence.toLowerCase().includes('version') || evidence.toLowerCase().includes('deployed')) {
      return <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />;
    }
    if (evidence.toLowerCase().includes('error') || evidence.toLowerCase().includes('5xx')) {
      return <Terminal className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />;
    }
    if (evidence.toLowerCase().includes('crash') || evidence.toLowerCase().includes('pods')) {
      return <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />;
  };

  return (
    <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200/60 rounded-lg text-sm text-zinc-700">
      {getIcon()}
      <div className="flex-1 leading-relaxed font-sans">
        <span className="font-mono text-zinc-400 mr-1 text-xs">[{index + 1}]</span>{' '}
        {renderHighlightedText(evidence)}
      </div>
    </div>
  );
};
