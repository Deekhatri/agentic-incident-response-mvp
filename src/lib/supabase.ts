import { createClient } from '@supabase/supabase-js';
import { Incident } from '../types';

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
