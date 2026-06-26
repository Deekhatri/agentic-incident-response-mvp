import { createClient } from '@supabase/supabase-js';
import { Incident, Alert } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Safely initialize the Supabase client only if both variables are present.
// If missing, we export null to allow the application to proceed gracefully in local-only mode.
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function mapRowToIncident(row: any): Incident {
  return {
    id: String(row.id),
    title: row.title || 'Untitled Incident',
    service: row.service_name || 'unknown-service',
    environment: (row.environment === 'staging' || row.environment === 'Staging' ? 'Staging' : row.environment === 'production' || row.environment === 'Production' ? 'Production' : 'Dev') as any,
    severity: (row.severity || 'SEV-1') as any,
    status: (row.status === 'OPEN' ? 'Triggered' : row.status === 'CLOSED' || row.status === 'RESOLVED' || row.status === 'Resolved' ? 'Resolved' : 'Triggered') as any,
    alertCount: Number(row.alert_count ?? 0),
    confidence: 92,
    probableCause: 'The latest checkout-api deployment is missing the PAYMENT_GATEWAY_URL environment variable.',
    supportingEvidence: [
      'Version v2.4.8 was deployed at 14:32.',
      'HTTP 5xx errors increased at 14:35.',
      'Three checkout-api pods entered CrashLoopBackOff.',
      'Application logs show that PAYMENT_GATEWAY_URL is missing.'
    ],
    proposedRemediation: 'Restart checkout-api after restoring the required environment configuration.',
    remediationStatus: 'Pending Approval',
    remediationResult: null,
    rejectionReason: null,
    blastRadius: 'Staging checkout flow affected. Zero production traffic impacted.',
    alternativeHypothesis: 'The downstream stripe-gateway service is experiencing an DNS resolution failure (34% confidence).',
    noiseReduction: `${row.noise_reduction_percentage ?? 96}% (${row.alert_count ?? 24} alerts grouped into 1 incident)`,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    systemHealth: (row.health_status === 'DEGRADED' ? 'Degraded' : 'Healthy') as any,
    hasPostmortem: false,
    postmortem: null
  };
}

export async function listIncidents(): Promise<Incident[]> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapRowToIncident);
}

export async function createTestIncident(userId: string): Promise<Incident> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const payload = {
    user_id: userId,
    title: 'Checkout API elevated 5xx errors after deployment',
    service_name: 'checkout-api',
    environment: 'staging',
    severity: 'SEV-1',
    status: 'OPEN',
    alert_count: 24,
    noise_reduction_percentage: 96,
    health_status: 'DEGRADED'
  };

  console.log('[Supabase] Inserting test incident with payload:', payload);

  const { data, error } = await supabase
    .from('incidents')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('[Supabase Insert Error Object]:', error);
    const detailString = [
      `Message: ${error.message}`,
      error.code ? `Code: ${error.code}` : null,
      error.details ? `Details: ${error.details}` : null,
      error.hint ? `Hint: ${error.hint}` : null
    ].filter(Boolean).join(' | ');
    throw new Error(`Supabase Insertion Failed: ${detailString}`);
  }

  if (!data) {
    console.warn('[Supabase] Insert succeeded but returned no row data (possible RLS read restriction).');
    throw new Error('Supabase insert succeeded but returned no row data. This may be due to Row Level Security (RLS) policies preventing reading the inserted row.');
  }

  console.log('[Supabase] Successfully inserted and retrieved test incident:', data);
  return mapRowToIncident(data);
}

export async function getIncident(id: string): Promise<Incident> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Incident with ID ${id} not found.`);
  }

  return mapRowToIncident(data);
}

export async function deleteIncident(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to roll back / delete incident: ${error.message}`);
  }
}

export async function createIncidentAlerts(userId: string, incidentId: string): Promise<Alert[]> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  // Define 24 synthetic alert templates matching the requested scenarios
  const alertTemplates = [
    {
      fingerprint: 'nginx-ingress-upstream-502',
      title: 'Nginx-Ingress',
      message: 'Upstream connection failed: 502 Bad Gateway for checkout-api backend service',
      severity: 'Critical'
    },
    {
      fingerprint: 'datadog-checkout-completion-drop',
      title: 'Datadog',
      message: 'Checkout service transaction completion rate dropped to 0% due to processing failures',
      severity: 'Critical'
    },
    {
      fingerprint: 'app-log-fatal-payment-gateway-env',
      title: 'LogSeverityAlert',
      message: 'CRITICAL error in checkout-api: "FATAL: Config key PAYMENT_GATEWAY_URL not found in process.env on initialization"',
      severity: 'Critical'
    },
    {
      fingerprint: 'kubelet-pod-crashloopbackoff',
      title: 'Kubelet',
      message: 'Pod checkout-api-7db6cf5b8d-klmno is crashing: CrashLoopBackOff (exit code 1) restarting dynamically',
      severity: 'Critical'
    },
    {
      fingerprint: 'kubelet-readiness-probe-failed',
      title: 'Kubelet',
      message: 'Readiness probe failed on pod checkout-api-7db6cf5b8d-klmno: HTTP request to http://10.244.1.45:3000/healthz failed: connection refused',
      severity: 'Warning'
    },
    {
      fingerprint: 'prometheus-http-5xx-elevated',
      title: 'Prometheus',
      message: 'High error budget burn rate on checkout-api endpoint /checkout/charge (http-status: 500 error rate at 18.4%)',
      severity: 'Critical'
    },
    {
      fingerprint: 'jaeger-span-latency-payment-charge',
      title: 'Jaeger-Tracing',
      message: 'Trace latency spike detected on span checkout-api:process-payment (average latency: 3120ms, normal: 250ms)',
      severity: 'Warning'
    },
    {
      fingerprint: 'linkerd-checkout-api-degradation',
      title: 'Linkerd',
      message: 'Service mesh metrics show checkout-api failure rate has reached 94.2% over last 120 seconds',
      severity: 'Critical'
    }
  ];

  const alertsToInsert: any[] = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const template = alertTemplates[i % alertTemplates.length];
    // Create staggered timestamps (older first)
    const receivedAt = new Date(now.getTime() - (24 - i) * 15 * 1000).toISOString();
    
    // Add realistic variations so every record is unique
    let message = template.message;
    if (i >= alertTemplates.length) {
      const replicaId = i % 3;
      const nodeId = 100 + i;
      message = message.replace('-klmno', `-replica-${replicaId}`) + ` (Node: i-${nodeId}, replica: ${replicaId})`;
    }

    alertsToInsert.push({
      user_id: userId,
      incident_id: incidentId,
      fingerprint: `${template.fingerprint}-${incidentId}-${i}`,
      title: template.title,
      message: message,
      severity: template.severity,
      received_at: receivedAt
    });
  }

  console.log(`[Supabase] Inserting 24 synthetic alerts for incident ${incidentId}...`);

  const { data, error } = await supabase
    .from('alerts')
    .insert(alertsToInsert)
    .select('*');

  if (error) {
    console.error('[Supabase Alerts Insert Error]:', error);
    const detailString = [
      `Message: ${error.message}`,
      error.code ? `Code: ${error.code}` : null,
      error.details ? `Details: ${error.details}` : null,
      error.hint ? `Hint: ${error.hint}` : null
    ].filter(Boolean).join(' | ');
    throw new Error(`Failed to insert 24 alerts: ${detailString}`);
  }

  if (!data || data.length === 0) {
    console.warn('[Supabase] Alerts inserted but no data returned on select (possible RLS read restriction).');
    return alertsToInsert.map((alt) => ({
      id: alt.fingerprint,
      timestamp: alt.received_at,
      source: alt.title,
      severity: alt.severity as any,
      message: alt.message,
      service: 'checkout-api'
    }));
  }

  return data.map((row: any) => ({
    id: row.fingerprint || String(row.id),
    timestamp: row.received_at || new Date().toISOString(),
    source: row.title || 'System',
    severity: (row.severity || 'Critical') as any,
    message: row.message || '',
    service: 'checkout-api'
  }));
}

export async function listIncidentAlerts(incidentId: string): Promise<Alert[]> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('incident_id', incidentId)
    .order('received_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: row.fingerprint || String(row.id),
    timestamp: row.received_at || new Date().toISOString(),
    source: row.title || 'System',
    severity: (row.severity || 'Critical') as any,
    message: row.message || '',
    service: 'checkout-api'
  }));
}
