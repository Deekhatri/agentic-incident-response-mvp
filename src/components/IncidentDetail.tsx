/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Activity, 
  Clock, 
  Compass, 
  ShieldAlert, 
  Bell, 
  ClipboardList, 
  FileText, 
  Cpu,
  Search,
  CheckCircle2,
  Terminal,
  AlertTriangle,
  BellOff
} from 'lucide-react';
import { Incident, Alert, TimelineEvent as TimelineEventType, Postmortem } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { ConfidenceScore } from './ConfidenceScore';
import { EvidenceItem } from './EvidenceItem';
import { ActionProposal } from './ActionProposal';
import { ApprovalControls } from './ApprovalControls';
import { TimelineEvent } from './TimelineEvent';
import { PostmortemSection } from './PostmortemSection';
import { listIncidentAlerts, listAuditEvents, mapRowToTimelineEvent, getRemediationDetails, createPostmortem, getPostmortem, supabase } from '../lib/supabase';

interface IncidentDetailProps {
  incident: Incident;
  alerts: Alert[];
  isDemoMode?: boolean;
  timelineEvents: TimelineEventType[];
  onBack: () => void;
  onApproveRemediation: (id: string) => Promise<void>;
  onRejectRemediation: (id: string, reason: string) => void;
  onGeneratePostmortem: (id: string) => void | Promise<void>;
}

function buildPostmortemPayload(incident: Incident, remediationResult: string | null) {
  const resultText = remediationResult || 'Successfully resolved configuration issues and verified active service traffic.';
  return {
    incident_id: incident.id,
    status: 'DRAFT',
    summary: `Automated postmortem report compiled by ResolveOps Agent following resolution of the ${incident.service || 'checkout-api'} crash conditions in the ${incident.environment || 'Staging'} cluster.`,
    customer_impact: `Minimal customer impact. Internal engineers reported service blockage in ${incident.environment || 'Staging'} environments for 43 minutes. Production traffic remained entirely isolated.`,
    detection: `Alerting initiated at 14:32 after an API gateway failure rate spiked to 14.5% during rolling deployment. Ingress checks triggered cluster-alert-${incident.service || 'checkout-api'}-5xx.`,
    root_cause: `The helm values template for the current deployment lacked parameter mapping definitions for the required configuration parameters in the ${incident.environment || 'Staging'} overlay render.`,
    resolution: resultText,
    timeline: [
      '14:32:00 UTC - CI/CD pipeline triggered deployment of version v2.4.8 of checkout-api.',
      '14:33:02 UTC - First checkout-api pod entered CrashLoopBackOff due to a fatal initialization config error.',
      '14:35:15 UTC - Prometheus triggered HTTP 5xx threshold alerts.',
      '14:41:00 UTC - ResolveOps core designated SEV-1 incident.',
      '14:45:00 UTC - ResolveOps Agent parsed container startup exceptions. Action proposal generated.',
      '14:52:12 UTC - Operator manually authorized remediation proposal. Automation patches ConfigMap and triggers rollout.',
      '14:54:30 UTC - Service replicas stabilized. Active synthetic traffic probes reporting 100% success rate.'
    ],
    contributing_factors: [
      `The ${incident.environment || 'Staging'} environment variables configuration lacked schema integration tests.`,
      `${incident.service || 'checkout-api'} was programmed to crash-loop rather than degrade gracefully if configuration endpoints were unreachable.`
    ],
    follow_up_actions: [
      'Add static configuration schema analysis to CI/CD pipeline tests.',
      `Implement fallback mock pathways in ${incident.service || 'checkout-api'} to permit testing during gateway outages.`
    ]
  };
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incident,
  alerts,
  isDemoMode = true,
  timelineEvents,
  onBack,
  onApproveRemediation,
  onRejectRemediation,
  onGeneratePostmortem
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'alerts' | 'timeline' | 'postmortem'>('overview');
  const [alertSearch, setAlertSearch] = useState('');

  const [dbAlerts, setDbAlerts] = useState<Alert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const [dbAuditEvents, setDbAuditEvents] = useState<TimelineEventType[]>([]);
  const [isLoadingAuditEvents, setIsLoadingAuditEvents] = useState(false);
  const [auditEventsError, setAuditEventsError] = useState<string | null>(null);

  const [remediationDetails, setRemediationDetails] = useState<{
    proposal: any | null;
    approval: any | null;
    execution: any | null;
  } | null>(null);
  const [isLoadingRemediation, setIsLoadingRemediation] = useState(false);
  const [remediationError, setRemediationError] = useState<string | null>(null);

  const [dbPostmortem, setDbPostmortem] = useState<Postmortem | null>(null);
  const [hasDbPostmortem, setHasDbPostmortem] = useState(false);
  const [isLoadingPostmortem, setIsLoadingPostmortem] = useState(false);
  const [postmortemError, setPostmortemError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadSupabaseAlerts = async () => {
    if (isDemoMode) return;
    setIsLoadingAlerts(true);
    setAlertsError(null);
    try {
      console.log('[IncidentDetail] Fetching Supabase alerts for incident ID:', incident.id);
      const fetchedAlerts = await listIncidentAlerts(incident.id);
      setDbAlerts(fetchedAlerts);
    } catch (err: any) {
      console.error('[IncidentDetail] Error loading alerts from Supabase:', err);
      setAlertsError(err.message || 'Failed to load database alerts.');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const loadSupabaseAuditEvents = async () => {
    if (isDemoMode) return;
    setIsLoadingAuditEvents(true);
    setAuditEventsError(null);
    try {
      console.log('[IncidentDetail] Fetching Supabase audit events for incident ID:', incident.id);
      const fetchedAuditEvents = await listAuditEvents(incident.id);
      const mappedEvents = fetchedAuditEvents.map(mapRowToTimelineEvent);
      setDbAuditEvents(mappedEvents);
    } catch (err: any) {
      console.error('[IncidentDetail] Error loading audit events from Supabase:', err);
      setAuditEventsError(err.message || 'Failed to load database audit events.');
    } finally {
      setIsLoadingAuditEvents(false);
    }
  };

  const loadSupabaseRemediation = async () => {
    if (isDemoMode) return;
    setIsLoadingRemediation(true);
    setRemediationError(null);
    try {
      console.log('[IncidentDetail] Fetching Supabase remediation details for:', incident.id);
      const details = await getRemediationDetails(incident.id);
      setRemediationDetails(details);
    } catch (err: any) {
      console.error('[IncidentDetail] Failed to load remediation details:', err);
      setRemediationError(err.message || 'Failed to load remediation records.');
    } finally {
      setIsLoadingRemediation(false);
    }
  };

  const parseJsonArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const loadSupabasePostmortem = async () => {
    if (isDemoMode) return;
    setIsLoadingPostmortem(true);
    setPostmortemError(null);
    try {
      console.log('[IncidentDetail] Fetching Supabase postmortem for incident:', incident.id);
      const pmData = await getPostmortem(incident.id);
      if (pmData) {
        const mappedPm: Postmortem = {
          summary: pmData.summary || '',
          customerImpact: pmData.customer_impact || '',
          detection: pmData.detection || '',
          timeline: parseJsonArray(pmData.timeline),
          rootCause: pmData.root_cause || '',
          resolution: pmData.resolution || '',
          contributingFactors: parseJsonArray(pmData.contributing_factors),
          followUpActions: parseJsonArray(pmData.follow_up_actions)
        };
        setDbPostmortem(mappedPm);
        setHasDbPostmortem(true);
      } else {
        setDbPostmortem(null);
        setHasDbPostmortem(false);
      }
    } catch (err: any) {
      console.error('[IncidentDetail] Failed to load postmortem from Supabase:', err);
      setPostmortemError(err.message || 'Failed to load postmortem record.');
    } finally {
      setIsLoadingPostmortem(false);
    }
  };

  useEffect(() => {
    loadSupabaseAlerts();
    loadSupabaseAuditEvents();
    loadSupabaseRemediation();
    loadSupabasePostmortem();
  }, [incident.id, isDemoMode]);

  const displayAlerts = isDemoMode ? alerts : dbAlerts;
  const displayTimelineEvents = isDemoMode ? timelineEvents : dbAuditEvents;

  // Determine mapped remediation state for presentation
  let derivedStatus = incident.remediationStatus;
  let derivedResult = incident.remediationResult;
  let derivedRejectionReason = incident.rejectionReason;

  if (!isDemoMode && remediationDetails) {
    const { proposal, approval, execution } = remediationDetails;
    if (proposal) {
      if (proposal.status === 'PENDING') {
        derivedStatus = 'Pending Approval';
      } else if (proposal.status === 'REJECTED') {
        derivedStatus = 'Rejected';
        if (approval && approval.reason) {
          derivedRejectionReason = approval.reason;
        }
      } else if (proposal.status === 'APPROVED') {
        derivedStatus = 'Approved';
        if (execution) {
          if (execution.status === 'RUNNING') {
            derivedStatus = 'Executing';
          } else if (execution.status === 'SUCCESS') {
            derivedStatus = 'Completed';
            derivedResult = execution.output || 'Execution completed successfully.';
          }
        }
      }
    }
  }

  const statusToUse = isDemoMode ? incident.remediationStatus : derivedStatus;
  const hasPostmortemToUse = isDemoMode ? incident.hasPostmortem : hasDbPostmortem;
  const postmortemToUse = isDemoMode ? incident.postmortem : dbPostmortem;

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    setPostmortemError(null);
    try {
      if (isDemoMode) {
        onGeneratePostmortem(incident.id);
      } else {
        // Double-check existing to absolutely prevent duplicates
        const existingPm = await getPostmortem(incident.id);
        if (existingPm) {
          await loadSupabasePostmortem();
          return;
        }

        const payload = buildPostmortemPayload(incident, derivedResult);
        await createPostmortem(payload);
        await loadSupabasePostmortem();
        await onGeneratePostmortem(incident.id);
      }
    } catch (err: any) {
      console.error('[IncidentDetail] Generate Postmortem error:', err);
      setPostmortemError(err.message || 'Failed to generate postmortem.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter alerts associated with this incident's service
  const associatedAlerts = displayAlerts.filter(alt => {
    const matchesService = isDemoMode ? (alt.service === incident.service) : true;
    const matchesSearch = alt.message.toLowerCase().includes(alertSearch.toLowerCase()) ||
                          alt.source.toLowerCase().includes(alertSearch.toLowerCase());
    return matchesService && matchesSearch;
  });

  const getSystemHealthBadge = () => {
    switch (incident.systemHealth) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-green-50 text-green-700 border border-green-200">
            HEALTHY
          </span>
        );
      case 'Degraded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse">
            DEGRADED
          </span>
        );
      case 'Recovering':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            RECOVERING
          </span>
        );
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview Analysis', icon: Cpu },
    { id: 'evidence', name: 'Supporting Logs', icon: Terminal },
    { id: 'alerts', name: `Aggregated Alerts (${associatedAlerts.length})`, icon: Bell },
    { id: 'timeline', name: 'Incident Timeline', icon: Clock },
    { id: 'postmortem', name: 'Postmortem Review', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button and Header Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 rounded text-xs font-mono font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Active Session</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-zinc-950 text-zinc-100 rounded-lg p-6 border border-zinc-900">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                INCIDENT ID: {incident.id}
              </span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              {getSystemHealthBadge()}
            </div>
            <h1 className="font-display text-lg md:text-xl font-bold tracking-tight text-white leading-snug">
              {incident.title}
            </h1>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Target microservice: <code className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xxs rounded">{incident.service}</code> • Cluster Environment: <span className="font-mono text-zinc-300 font-semibold">{incident.environment}</span>
            </p>
          </div>

          {/* Quick stats panel */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-md p-4 grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto font-mono text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Telemetry Grouped</span>
              <span className="text-white font-bold text-sm block mt-0.5">{incident.alertCount} alerts</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Noise Suppressed</span>
              <span className="text-emerald-400 font-bold text-sm block mt-0.5">95.8% ratio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-200 flex overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-mono text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-zinc-900 text-zinc-950 bg-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xxs min-h-[300px]">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (RCA & Evidence) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Agent-generated Summary block */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Agent-Generated Summary
                  </h3>
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 leading-relaxed font-sans">
                    At <span className="font-mono font-semibold">14:32</span>, system deployments recorded a roll-out of version <span className="font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200 text-xs">v2.4.8</span> of the <code className="font-mono text-xs bg-zinc-100 px-1 rounded">checkout-api</code>. Following this, API latencies spike and HTTP 5xx error budgets burn out. ResolveOps core telemetry engine correlated 24 related alerts into this incident, pinpointing a failure to load essential configuration keys on service initialization.
                  </div>
                </div>

                {/* Root cause hypothesis */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Root-Cause Hypothesis
                  </h3>
                  <div className="p-4 border border-zinc-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="text-sm font-sans font-semibold text-zinc-900">Probable Cause</span>
                      <ConfidenceScore score={incident.confidence} size="md" />
                    </div>
                    <p className="text-sm font-mono text-zinc-700 bg-zinc-50 p-3 border border-zinc-200 rounded-md">
                      {incident.probableCause}
                    </p>
                  </div>
                </div>

                {/* Supporting evidence list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Supporting Diagnostic Evidence
                  </h3>
                  <div className="space-y-2">
                    {incident.supportingEvidence.map((ev, index) => (
                      <EvidenceItem key={index} evidence={ev} index={index} />
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column (Remediation Actions & Approvals) */}
              <div className="space-y-6">
                
                {remediationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs flex items-center gap-2 font-sans">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span><strong>Database Error:</strong> {remediationError}</span>
                  </div>
                )}

                {isLoadingRemediation && !remediationDetails && (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-500 text-xs flex items-center gap-2 font-sans">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-zinc-500"></div>
                    <span>Synchronizing remediation state...</span>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Remediation & Healing Plan
                  </h3>
                  <ActionProposal
                    proposedRemediation={incident.proposedRemediation}
                    remediationStatus={derivedStatus}
                    remediationResult={derivedResult}
                    blastRadius={incident.blastRadius}
                    alternativeHypothesis={incident.alternativeHypothesis}
                  />
                </div>

                {/* Approval Control panel */}
                <ApprovalControls
                  status={derivedStatus}
                  rejectionReason={derivedRejectionReason}
                  onApprove={async () => {
                    // Propagate the error so ApprovalControls can catch and display it
                    await onApproveRemediation(incident.id);

                    // Fetch latest details immediately after immediate writes are completed
                    await loadSupabaseRemediation();
                    await loadSupabaseAuditEvents();

                    // Refresh again 2.1 seconds later when background job completes
                    setTimeout(async () => {
                      await loadSupabaseRemediation();
                      await loadSupabaseAuditEvents();
                    }, 2100);
                  }}
                  onReject={async (reason) => {
                    try {
                      await onRejectRemediation(incident.id, reason);
                      setTimeout(() => {
                        loadSupabaseRemediation();
                        loadSupabaseAuditEvents();
                      }, 400);
                    } catch (err) {
                      console.error('[IncidentDetail] reject error:', err);
                    }
                  }}
                />

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: DETAILED SUPPORTING LOGS */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Cluster Pod Stdout / Event stream</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Isolated logs associated with service failures on staging-node-04.</p>
              </div>
              <span className="text-xxs font-mono bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-600">
                CONTAINER ID: cri://dcb348911
              </span>
            </div>

            {/* Container logs display */}
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto border border-zinc-900 shadow-md">
              <div className="space-y-1">
                <p className="text-zinc-500">[14:32:01] INFO  cd-pipeline: Initiating deployment of replica-set checkout-api:v2.4.8 ...</p>
                <p className="text-zinc-500">[14:32:15] INFO  kubelet: Pulling image "gcr.io/resolveops-sandbox/checkout-api:v2.4.8"</p>
                <p className="text-zinc-500">[14:32:45] INFO  kubelet: Pod checkout-api-7db6cf5b8d-abcde launched successfully on node staging-node-04.</p>
                <p className="text-red-400 font-semibold">[14:33:02] FATAL checkout-api: [CONFIG VALIDATION ERROR] Missing critical environment dependency.</p>
                <p className="text-red-500 font-bold">[14:33:02] FATAL checkout-api: "FATAL: Config key PAYMENT_GATEWAY_URL not found in process.env" - system must crash.</p>
                <p className="text-red-400 font-semibold">[14:33:02] INFO  checkout-api: Process exiting with code 1.</p>
                <p className="text-zinc-500">[14:33:15] WARN  kubelet: Pod checkout-api-7db6cf5b8d-abcde exited unexpectedly. Restarting in 10s...</p>
                <p className="text-zinc-500">[14:33:30] INFO  kubelet: Pod checkout-api-7db6cf5b8d-abcde restarted.</p>
                <p className="text-red-400 font-semibold">[14:33:31] FATAL checkout-api: [CONFIG VALIDATION ERROR] Missing critical environment dependency.</p>
                <p className="text-red-500 font-bold">[14:33:31] FATAL checkout-api: "FATAL: Config key PAYMENT_GATEWAY_URL not found in process.env" - system must crash.</p>
                <p className="text-zinc-500">[14:33:31] WARN  kubelet: Pod checkout-api-7db6cf5b8d-abcde entered CrashLoopBackOff.</p>
                <p className="text-zinc-500">[14:34:02] INFO  kubelet: Pod checkout-api-7db6cf5b8d-fghij launched.</p>
                <p className="text-red-500 font-bold">[14:34:03] FATAL checkout-api: "FATAL: Config key PAYMENT_GATEWAY_URL not found in process.env" - system must crash.</p>
                <p className="text-zinc-500">[14:34:03] WARN  kubelet: Pod checkout-api-7db6cf5b8d-fghij entered CrashLoopBackOff.</p>
                <p className="text-amber-400 font-semibold">[14:35:12] ALERT nginx-ingress: [HTTP 502 Bad Gateway] Upstream server failed on path /api/v1/checkout/charge</p>
                <p className="text-amber-400 font-semibold">[14:35:15] ALERT prometheus-operator: [ALERT_STORM] checkout-api 5xx rate has hit 14.5% - threshold: 1.0%</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AGGREGATED INCIDENT ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Aggregated Active Alert Storm</h3>
                <p className="text-xs text-zinc-500 mt-0.5">These telemetry alerts were correlated and grouped together by the Agent algorithm.</p>
              </div>

              {/* Alert search bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Query aggregated alerts..."
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="w-full text-xs font-sans p-2 pl-8 bg-zinc-50 border border-zinc-300 rounded-md outline-hidden text-zinc-800"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Alerts Table / Loading / Error / Empty States */}
            {isLoadingAlerts ? (
              <div className="flex flex-col items-center justify-center p-12 border border-zinc-200 rounded-lg bg-white space-y-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900"></div>
                <p className="text-xs text-zinc-500 font-sans">Querying telemetry alerts from the database...</p>
              </div>
            ) : alertsError ? (
              <div className="p-6 border border-red-200 rounded-lg bg-red-50/50 flex flex-col items-center justify-center text-center space-y-3">
                <div className="text-red-500">
                  <ShieldAlert className="w-8 h-8 mx-auto" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-red-800">Alert Query Failed</h4>
                  <p className="text-xs text-zinc-600 mt-1 font-sans">{alertsError}</p>
                </div>
                <button
                  type="button"
                  onClick={loadSupabaseAlerts}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  Retry Query
                </button>
              </div>
            ) : associatedAlerts.length === 0 ? (
              <div className="p-12 border border-zinc-200 rounded-lg bg-zinc-50/50 text-center space-y-2">
                <BellOff className="w-8 h-8 text-zinc-300 mx-auto" />
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-800">No Alerts Correlated</h4>
                <p className="text-xs text-zinc-500 font-sans">No telemetry alerts match the search criteria or were logged for this event.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono">
                      <th className="py-2.5 px-3 font-bold">SOURCE</th>
                      <th className="py-2.5 px-3 font-bold">SEVERITY</th>
                      <th className="py-2.5 px-3 font-bold">ALERT MESSAGE</th>
                      <th className="py-2.5 px-3 font-bold">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 font-sans">
                    {associatedAlerts.map((alt) => (
                      <tr key={alt.id} className="hover:bg-zinc-50/40">
                        <td className="py-2.5 px-3 font-mono font-semibold text-zinc-800">
                          {alt.source}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-1.5 py-0.25 rounded text-[10px] font-mono font-medium ${
                            alt.severity === 'Critical' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {alt.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700 leading-relaxed max-w-sm md:max-w-md truncate" title={alt.message}>
                          {alt.message}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400 text-xxs">
                          {alt.timestamp.includes('T') ? new Date(alt.timestamp).toLocaleTimeString() : alt.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INCIDENT TIMELINE EVENT CHRONOLOGY */}
        {activeTab === 'timeline' && (
          <div className="max-w-2xl mx-auto py-4">
            {isLoadingAuditEvents ? (
              <div className="flex flex-col items-center justify-center p-12 border border-zinc-200 rounded-lg bg-white space-y-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900"></div>
                <p className="text-xs text-zinc-500 font-sans">Querying operational audit trail from the database...</p>
              </div>
            ) : auditEventsError ? (
              <div className="p-6 border border-red-200 rounded-lg bg-red-50/50 flex flex-col items-center justify-center text-center space-y-3">
                <div className="text-red-500">
                  <ShieldAlert className="w-8 h-8 mx-auto" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-red-800">Timeline Query Failed</h4>
                  <p className="text-xs text-zinc-600 mt-1 font-sans">{auditEventsError}</p>
                </div>
                <button
                  type="button"
                  onClick={loadSupabaseAuditEvents}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  Retry Query
                </button>
              </div>
            ) : displayTimelineEvents.length === 0 ? (
              <div className="p-12 border border-zinc-200 rounded-lg bg-zinc-50/50 text-center space-y-2">
                <ClipboardList className="w-8 h-8 text-zinc-300 mx-auto" />
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-800">No Events Logged</h4>
                <p className="text-xs text-zinc-500 font-sans">No audit events have been logged for this incident yet.</p>
              </div>
            ) : (
              <div className="relative border-l-0 border-zinc-200 pl-0">
                {displayTimelineEvents.map((event, index) => (
                  <TimelineEvent
                    key={event.id}
                    event={event}
                    isLast={index === displayTimelineEvents.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: POSTMORTEM */}
        {activeTab === 'postmortem' && (
          <div className="space-y-6">
            {postmortemError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs flex items-start gap-2 font-sans max-w-lg mx-auto">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Postmortem Error</span>
                  <p className="mt-0.5">{postmortemError}</p>
                </div>
              </div>
            )}

            {isLoadingPostmortem ? (
              <div className="flex flex-col items-center justify-center p-12 border border-zinc-200 rounded-lg bg-white space-y-3 max-w-lg mx-auto">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900"></div>
                <p className="text-xs text-zinc-500 font-sans">Querying saved postmortem review from the database...</p>
              </div>
            ) : statusToUse !== 'Completed' ? (
              <div className="p-8 text-center bg-zinc-50 rounded-lg border border-zinc-200 space-y-3.5 max-w-lg mx-auto">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">Postmortem Incomplete</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                    An operations postmortem summary can only be generated once the remediation proposal is fully executed and the microservice cluster health is restored.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {!hasPostmortemToUse ? (
                  <div className="p-8 text-center bg-zinc-50 rounded-lg border border-zinc-200 space-y-4 max-w-lg mx-auto">
                    <FileText className="w-8 h-8 text-zinc-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 font-sans">Generate Incident Postmortem</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                        Use the ResolveOps Agent to synthesize audit records, telemetry timestamps, and execution reports into an operations review template.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleGenerateClick}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded text-xs font-mono font-semibold transition-colors cursor-pointer"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Postmortem Report'}
                    </button>
                  </div>
                ) : (
                  postmortemToUse && (
                    <div className="space-y-4">
                      {/* Postmortem Generated Banner */}
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <span>Postmortem Generated successfully and saved as <strong>DRAFT</strong>.</span>
                      </div>
                      <PostmortemSection postmortem={postmortemToUse} />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
