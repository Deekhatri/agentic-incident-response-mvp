/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { SignIn } from './components/SignIn';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { IncidentsList } from './components/IncidentsList';
import { AuditLogView } from './components/AuditLogView';
import { IncidentDetail } from './components/IncidentDetail';
import { supabase, listIncidents, createTestIncident, getIncident, createIncidentAlerts, deleteIncident } from './lib/supabase';
import { 
  Incident, 
  Alert, 
  AuditLogEntry, 
  TimelineEvent, 
  Postmortem, 
  RemediationStatus, 
  IncidentStatus, 
  SystemHealthStatus 
} from './types';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_ALERTS, 
  INITIAL_TIMELINE_EVENTS, 
  INITIAL_AUDIT_LOGS, 
  RECENT_AGENT_ACTIVITIES,
  createMockTestIncident,
  TEST_INCIDENT_ALERTS_FLOW,
  TEST_INCIDENT_TIMELINE_EVENTS,
  TEST_INCIDENT_ID
} from './mockData';

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return sessionStorage.getItem('resolveops_demo_user');
  });
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'incidents' | 'audit' | 'incident-detail'>('dashboard');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  // Deep cloned state for incidents, alerts, audit log, and timeline map to allow pristine resets
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ id: string; timestamp: string; message: string }[]>([]);
  
  // Timeline events mapped by incident ID
  const [timelineEventsMap, setTimelineEventsMap] = useState<Record<string, TimelineEvent[]>>({});

  // Simulation state for alert storm generation
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testAlertsStream, setTestAlertsStream] = useState<Alert[]>([]);

  // Database loading & error states
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Initialize state from deep clone
  const initializeDemoState = () => {
    const clonedIncidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS)) as Incident[];
    const clonedAlerts = JSON.parse(JSON.stringify(INITIAL_ALERTS)) as Alert[];
    const clonedAuditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)) as AuditLogEntry[];
    const clonedActivities = JSON.parse(JSON.stringify(RECENT_AGENT_ACTIVITIES)) as { id: string; timestamp: string; message: string }[];
    
    setIncidents(clonedIncidents);
    setAlerts(clonedAlerts);
    setAuditLogs(clonedAuditLogs);
    setRecentActivities(clonedActivities);
    
    // Set up timeline map
    setTimelineEventsMap({
      'inc-checkout-5xx': JSON.parse(JSON.stringify(INITIAL_TIMELINE_EVENTS)),
      'inc-redis-latency': [
        {
          id: 'red-evt-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          type: 'Alert',
          title: 'Memory Limit Exceeded',
          description: 'Cache redis instance hit 100% capacity.'
        },
        {
          id: 'red-evt-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
          type: 'Agent',
          title: 'Configuration Patched',
          description: 'Agent scaled allocation to 4GB and changed eviction policy.'
        },
        {
          id: 'red-evt-3',
          timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
          type: 'System',
          title: 'Deployment Stabilized',
          description: 'Database health probes reporting 100% availability.'
        }
      ],
      'inc-auth-cpu': [
        {
          id: 'auth-evt-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          type: 'Alert',
          title: 'CPU Usage High',
          description: 'CPU utilisation on auth-service exceeded critical threshold (96%).'
        },
        {
          id: 'auth-evt-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
          type: 'Agent',
          title: 'RCA Completed',
          description: 'Correlated latency spike with Bcrypt complexity config changes.'
        }
      ],
      'inc-payment-timeouts': [
        {
          id: 'pay-evt-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          type: 'Alert',
          title: 'Webhook delivery failures',
          description: 'Stripe reported delivery failures (HTTP 502/504 timeouts).'
        },
        {
          id: 'pay-evt-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
          type: 'Agent',
          title: 'RCA Completed',
          description: 'Expired SSL certificates identified on Ingress Controller.'
        }
      ]
    });
  };

  useEffect(() => {
    initializeDemoState();

    async function initSession() {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUserEmail(session.user.email ?? null);
            sessionStorage.removeItem('resolveops_demo_user');
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        }
      }
      setIsLoadingSession(false);
    }

    initSession();

    let subscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveringPassword(true);
        }

        if (session?.user) {
          setUserEmail(session.user.email ?? null);
          sessionStorage.removeItem('resolveops_demo_user');
        } else {
          const demoUser = sessionStorage.getItem('resolveops_demo_user');
          if (!demoUser) {
            setUserEmail(null);
          }
        }
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const isDemoMode = !supabase || userEmail === 'demo-operator@resolveops.io';

  const fetchSupabaseIncidents = async () => {
    if (isDemoMode) {
      return;
    }
    setIsDbLoading(true);
    setDbError(null);
    try {
      const dbIncidents = await listIncidents();
      setIncidents(dbIncidents);

      // Pre-populate alerts if empty
      setAlerts(prev => prev.length === 0 ? JSON.parse(JSON.stringify(INITIAL_ALERTS)) : prev);

      // Pre-populate timeline events for any Supabase incidents so they are interactive
      setTimelineEventsMap(prev => {
        const nextMap = { ...prev };
        dbIncidents.forEach(inc => {
          if (!nextMap[inc.id]) {
            nextMap[inc.id] = TEST_INCIDENT_TIMELINE_EVENTS.map(evt => ({
              ...evt,
              id: `${inc.id}-${evt.id}`
            }));
          }
        });
        return nextMap;
      });
    } catch (err: any) {
      console.error('Failed to fetch incidents from Supabase:', err);
      setDbError(err.message || 'Database connection error');
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      if (isDemoMode) {
        initializeDemoState();
      } else {
        fetchSupabaseIncidents();
      }
    }
  }, [userEmail, isDemoMode]);

  // Determine system cluster health from active incidents
  const getOverallSystemHealth = (): SystemHealthStatus => {
    const unresolved = incidents.filter(inc => inc.status !== 'Resolved');
    if (unresolved.length === 0) return 'Healthy';
    
    // Check if any incident is in active healing state
    if (unresolved.some(inc => inc.status === 'Remediating')) {
      return 'Recovering';
    }
    
    return 'Degraded';
  };

  const activeIncident = incidents.find(inc => inc.id === activeIncidentId);

  // Authentication Handlers
  const handleSignIn = (email: string) => {
    setUserEmail(email);
    setActiveScreen('dashboard');
  };

  const handleSignOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    sessionStorage.removeItem('resolveops_demo_user');
    setUserEmail(null);
    setActiveIncidentId(null);
    setActiveScreen('dashboard');
  };

  // Select incident handler
  const handleSelectIncident = (id: string) => {
    setActiveIncidentId(id);
    setActiveScreen('incident-detail');
  };

  // Back from details handler
  const handleBack = () => {
    setActiveScreen('incidents');
    setActiveIncidentId(null);
  };

  // Approve proposal handler
  const handleApproveRemediation = (incidentId: string) => {
    if (!userEmail) return;

    // Find and update active incident state
    setIncidents(prevIncidents => 
      prevIncidents.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: 'Remediating',
            remediationStatus: 'Approved',
            systemHealth: 'Recovering',
            updatedAt: new Date().toISOString()
          };
        }
        return inc;
      })
    );

    const targetInc = incidents.find(inc => inc.id === incidentId);
    const incTitle = targetInc ? targetInc.title : 'Incident';

    // Append Audit Log Entry
    const approveAudit: AuditLogEntry = {
      id: `aud-app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: userEmail,
      actorType: 'Human',
      action: 'Approved Remediation Proposal',
      incidentTitle: incTitle,
      result: 'Success. Action engine triggered. Running kubectl patch config-map.'
    };
    setAuditLogs(prev => [approveAudit, ...prev]);

    // Append Timeline Event
    const approveTimeline: TimelineEvent = {
      id: `evt-app-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'Human',
      title: 'Remediation Action Approved',
      description: `Operator ${userEmail} approved the primary remediation proposal. Cluster agent is deploying the configuration fix.`
    };
    setTimelineEventsMap(prev => ({
      ...prev,
      [incidentId]: [...(prev[incidentId] || []), approveTimeline]
    }));

    // Trigger simulation pipeline (Pending Approved -> Executing -> Completed)
    // 1. Approved -> Executing (after 1000ms)
    setTimeout(() => {
      setIncidents(prevIncidents => 
        prevIncidents.map(inc => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              remediationStatus: 'Executing',
              updatedAt: new Date().toISOString()
            };
          }
          return inc;
        })
      );

      const execTimeline: TimelineEvent = {
        id: `evt-exec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'System',
        title: 'Deployment Rollout Triggered',
        description: 'Executing Kubernetes rolling update rollout on deployment.'
      };
      setTimelineEventsMap(prev => ({
        ...prev,
        [incidentId]: [...(prev[incidentId] || []), execTimeline]
      }));
    }, 1000);

    // 2. Executing -> Completed (after another 1200ms)
    setTimeout(() => {
      setIncidents(prevIncidents => 
        prevIncidents.map(inc => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              status: 'Resolved',
              remediationStatus: 'Completed',
              remediationResult: `Successfully updated environment configurations on configmap. 3 checkout pods restarted. Active traffic checks reporting 100% success rate.`,
              systemHealth: 'Healthy',
              updatedAt: new Date().toISOString()
            };
          }
          return inc;
        })
      );

      // Append Succeeded Audit Log
      const successAudit: AuditLogEntry = {
        id: `aud-suc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'ResolveOps Agent',
        actorType: 'Agent',
        action: 'Completed Remediation Execution',
        incidentTitle: incTitle,
        result: 'Success. Pod rolling restart completed safely. HTTP 200 OK verified across 100% of routes.'
      };
      setAuditLogs(prev => [successAudit, ...prev]);

      // Append Succeeded Timeline Event
      const successTimeline: TimelineEvent = {
        id: `evt-suc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'Agent',
        title: 'Remediation Succeeded',
        description: 'Autonomic service health verifications passed. All checkout-api replicas are healthy, and customer checkout flows are fully operational.'
      };
      setTimelineEventsMap(prev => ({
        ...prev,
        [incidentId]: [...(prev[incidentId] || []), successTimeline]
      }));

      // Add recent activity entry
      setRecentActivities(prev => [
        {
          id: `act-suc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: `Self-healing completed for ${incTitle}. Latency returned to baseline.`
        },
        ...prev
      ]);
    }, 2200);
  };

  // Reject proposal handler
  const handleRejectRemediation = (incidentId: string, reason: string) => {
    if (!userEmail) return;

    setIncidents(prevIncidents => 
      prevIncidents.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            remediationStatus: 'Rejected',
            rejectionReason: reason,
            status: 'Acknowledged', // return to investigation/acknowledged
            updatedAt: new Date().toISOString()
          };
        }
        return inc;
      })
    );

    const targetInc = incidents.find(inc => inc.id === incidentId);
    const incTitle = targetInc ? targetInc.title : 'Incident';

    // Append Audit Log
    const rejectAudit: AuditLogEntry = {
      id: `aud-rej-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: userEmail,
      actorType: 'Human',
      action: 'Rejected Remediation Proposal',
      incidentTitle: incTitle,
      result: `Rejected. Reason: "${reason}"`
    };
    setAuditLogs(prev => [rejectAudit, ...prev]);

    // Append Timeline Event
    const rejectTimeline: TimelineEvent = {
      id: `evt-rej-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'Human',
      title: 'Remediation Proposal Declined',
      description: `Operator rejected the proposed healing action. Reason: "${reason}". Automated healing pipeline paused.`
    };
    setTimelineEventsMap(prev => ({
      ...prev,
      [incidentId]: [...(prev[incidentId] || []), rejectTimeline]
    }));
  };

  // Generate Postmortem handler
  const handleGeneratePostmortem = (incidentId: string) => {
    setIncidents(prevIncidents => 
      prevIncidents.map(inc => {
        if (inc.id === incidentId) {
          const generatedPostmortem: Postmortem = {
            summary: `Automated postmortem report compiled by ResolveOps Agent following resolution of the checkout-api crash conditions in the staging cluster.`,
            customerImpact: `Minimal customer impact. Internal engineers reported checkout blockage in staging environments for 43 minutes. Production traffic remained entirely isolated.`,
            detection: `Alerting initiated at 14:32 after an API gateway failure rate spiked to 14.5% during rolling deployment. Ingress checks triggered cluster-alert-checkout-5xx.`,
            timeline: [
              '14:32:00 UTC - CI/CD pipeline triggered deployment of version v2.4.8 of checkout-api.',
              '14:33:02 UTC - First checkout-api pod entered CrashLoopBackOff due to a fatal initialization config error.',
              '14:35:15 UTC - Prometheus triggered HTTP 5xx threshold alerts.',
              '14:41:00 UTC - ResolveOps core ingested 24 clustered alerts, suppressed noise by 95.8%, and designated SEV-1 incident inc-checkout-5xx.',
              '14:45:00 UTC - ResolveOps Agent parsed container startup exceptions, identifying the missing environment variable. Action proposal generated.',
              '14:52:12 UTC - Operator manually authorized remediation proposal. Automation patches ConfigMap and triggers rollout.',
              '14:54:30 UTC - Service replicas stabilized. Active synthetic traffic probes reporting 100% charge success rate.'
            ],
            rootCause: `The helm values template for version v2.4.8 lacked parameter mapping definitions for the required PAYMENT_GATEWAY_URL environment variable during the staging overlay render.`,
            resolution: `Patched k8s ConfigMap manually via script and performed zero-downtime kubectl rollout restart deployment/checkout-api.`,
            contributingFactors: [
              'The staging environment variables configuration lacked schema integration tests.',
              'Checkout-api was programmed to crash-loop rather than degrade gracefully if payment endpoints were unreachable.'
            ],
            followUpActions: [
              'Add static configuration schema analysis to CI/CD pipeline tests.',
              'Implement fallback mock pathways in checkout-api to permit testing during gateway outages.'
            ]
          };

          return {
            ...inc,
            hasPostmortem: true,
            postmortem: generatedPostmortem,
            updatedAt: new Date().toISOString()
          };
        }
        return inc;
      })
    );

    // Append Timeline Event
    const pmTimeline: TimelineEvent = {
      id: `evt-pm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'Agent',
      title: 'Postmortem Report Synthesized',
      description: 'The autonomous Agent compiled cluster telemetry, timelines, and action metrics into a post-incident review report.'
    };
    setTimelineEventsMap(prev => ({
      ...prev,
      [incidentId]: [...(prev[incidentId] || []), pmTimeline]
    }));
  };

  // Interactive Test Incident Generator Flow
  const handleGenerateTestIncident = async () => {
    if (isGeneratingTest) return;

    if (isDemoMode) {
      setIsGeneratingTest(true);
      setTestAlertsStream([]);

      // Stream alerts step by step for immersion (one every 150ms)
      let currentIdx = 0;
      const intervalId = setInterval(() => {
        if (currentIdx < TEST_INCIDENT_ALERTS_FLOW.length) {
          const nextAlert = TEST_INCIDENT_ALERTS_FLOW[currentIdx];
          setTestAlertsStream(prev => [nextAlert, ...prev]);
          currentIdx++;
        } else {
          clearInterval(intervalId);
          
          // Finalize test incident generation
          const newIncident = createMockTestIncident();
          
          setIncidents(prev => [newIncident, ...prev]);
          setAlerts(prev => [...TEST_INCIDENT_ALERTS_FLOW, ...prev]);
          
          // Append Audit Log
          const testIncidentAudit: AuditLogEntry = {
            id: `aud-test-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: 'ResolveOps Agent',
            actorType: 'Agent',
            action: 'Correlated telemetry storm',
            incidentTitle: newIncident.title,
            result: `Grouped 15 raw broker alerts into ${newIncident.id}. Noise suppressed by 93.3%.`
          };

          const testIncidentProposalAudit: AuditLogEntry = {
            id: `aud-test-prop-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: 'ResolveOps Agent',
            actorType: 'Agent',
            action: 'Created Remediation Proposal',
            incidentTitle: newIncident.title,
            result: `Proposed AMQP credential hot-patch. Awaiting authorization.`
          };

          setAuditLogs(prev => [testIncidentProposalAudit, testIncidentAudit, ...prev]);

          // Map timeline events
          setTimelineEventsMap(prev => ({
            ...prev,
            [TEST_INCIDENT_ID]: TEST_INCIDENT_TIMELINE_EVENTS
          }));

          // Add recent activity
          setRecentActivities(prev => [
            {
              id: `act-test-${Date.now()}`,
              timestamp: new Date().toISOString(),
              message: `Autonomously correlated 15 alerts for notification-worker.`
            },
            ...prev
          ]);

          setIsGeneratingTest(false);
        }
      }, 150);
    } else {
      if (!supabase) return;
      setIsGeneratingTest(true);
      setDbError(null);
      let createdIncidentId: string | null = null;
      try {
        console.log('[App] Retrieving Supabase user session for test incident...');
        const { data: { session } } = await supabase.auth.getSession();
        let user = session?.user;

        if (!user) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          user = authUser;
        }

        if (!user) {
          throw new Error('No active user session found. Please verify you are authenticated via Supabase.');
        }

        console.log('[App] Calling createTestIncident with user_id:', user.id);
        const newIncident = await createTestIncident(user.id);
        createdIncidentId = newIncident.id;

        console.log('[App] Inserting 24 alerts in Supabase for incident_id:', newIncident.id);
        await createIncidentAlerts(user.id, newIncident.id);

        console.log('[App] Refreshing incident list after successful insertion...');
        // Refresh incident list
        await fetchSupabaseIncidents();

        console.log('[App] Loading detail page for newly saved incident:', newIncident.id);
        // Open newly created incident
        setActiveIncidentId(newIncident.id);
        setActiveScreen('incident-detail');
      } catch (err: any) {
        console.error('Failed to generate test incident or alerts in Supabase:', err);
        // If the incident was created but alert insertion failed, delete the incident so no incomplete records are left behind
        if (createdIncidentId) {
          console.log('[App] Alert generation failed. Rolling back created incident ID:', createdIncidentId);
          try {
            await deleteIncident(createdIncidentId);
            console.log('[App] Rollback deletion complete.');
          } catch (deleteErr) {
            console.error('[App] Failed to rollback/delete incident after alert insertion failure:', deleteErr);
          }
        }
        setDbError(err.message || 'Error occurred during persistent incident creation.');
      } finally {
        setIsGeneratingTest(false);
      }
    }
  };

  // Reset Demo State
  const handleResetDemo = () => {
    initializeDemoState();
    setActiveIncidentId(null);
    setActiveScreen('dashboard');
  };

  // Main UI Screen switching
  const renderMainContent = () => {
    if (isDbLoading && incidents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 min-h-[400px] border border-dashed border-zinc-200 rounded-lg bg-white space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          <div className="text-center space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase text-zinc-800">CONNECTING TO SUPABASE</h4>
            <p className="text-xs text-zinc-500 font-sans">Querying active incidents from the central operational register...</p>
          </div>
        </div>
      );
    }

    if (dbError) {
      const isInsertError = dbError.toLowerCase().includes('failed') || 
                            dbError.toLowerCase().includes('incident') || 
                            dbError.toLowerCase().includes('insertion') ||
                            dbError.toLowerCase().includes('row');

      return (
        <div className="p-8 border border-red-200 rounded-lg bg-red-50/50 space-y-4 max-w-2xl mx-auto my-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 border border-red-200 text-red-600 rounded">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-mono font-bold uppercase text-red-800 tracking-wider">
                {isInsertError ? 'INCIDENT GENERATION ERROR' : 'DATABASE CONNECTION ERROR'}
              </h4>
              <p className="text-xs text-zinc-700 mt-1 font-sans">{dbError}</p>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={fetchSupabaseIncidents}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
            <button
              type="button"
              onClick={() => setDbError(null)}
              className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    switch (activeScreen) {
      case 'dashboard':
        return (
          <OverviewDashboard
            incidents={incidents}
            auditLogs={auditLogs}
            recentActivities={recentActivities}
            onSelectIncident={handleSelectIncident}
            onGenerateTestIncident={handleGenerateTestIncident}
            onResetDemo={handleResetDemo}
            isGeneratingTest={isGeneratingTest}
            testAlertsStream={testAlertsStream}
          />
        );
      case 'incidents':
        return (
          <IncidentsList
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
          />
        );
      case 'audit':
        return (
          <AuditLogView
            auditLogs={auditLogs}
          />
        );
      case 'incident-detail':
        if (activeIncident) {
          return (
            <IncidentDetail
              incident={activeIncident}
              alerts={alerts}
              isDemoMode={isDemoMode}
              timelineEvents={timelineEventsMap[activeIncident.id] || []}
              onBack={handleBack}
              onApproveRemediation={handleApproveRemediation}
              onRejectRemediation={handleRejectRemediation}
              onGeneratePostmortem={handleGeneratePostmortem}
            />
          );
        }
        return <div className="p-8 text-center text-zinc-500 font-mono">Loading incident details...</div>;
      default:
        return <div className="p-8 text-center text-zinc-500 font-mono">Screen routing error</div>;
    }
  };

  // Render authentic authentication screen if user isn't authenticated yet
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          <span className="text-xs font-mono text-zinc-500">Retrieving active session...</span>
        </div>
      </div>
    );
  }

  if (isRecoveringPassword) {
    return (
      <SignIn 
        onSignIn={handleSignIn} 
        initialRecoveryMode={true} 
        onRecoveryComplete={async () => {
          setIsRecoveringPassword(false);
          await handleSignOut();
        }} 
      />
    );
  }

  if (!userEmail) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Primary Sidebar Layout */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        systemHealth={getOverallSystemHealth()}
      />

      {/* Main viewport area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto">
        {renderMainContent()}
      </main>
    </div>
  );
}
