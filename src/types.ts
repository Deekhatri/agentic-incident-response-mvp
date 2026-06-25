/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Postmortem {
  summary: string;
  customerImpact: string;
  detection: string;
  timeline: string[];
  rootCause: string;
  resolution: string;
  contributingFactors: string[];
  followUpActions: string[];
}

export type IncidentStatus = 'Triggered' | 'Acknowledged' | 'Investigating' | 'Remediating' | 'Resolved';
export type SeverityLevel = 'SEV-1' | 'SEV-2' | 'SEV-3';
export type EnvironmentType = 'Staging' | 'Production' | 'Dev';
export type RemediationStatus = 'Pending Approval' | 'Approved' | 'Executing' | 'Completed' | 'Rejected';
export type SystemHealthStatus = 'Healthy' | 'Degraded' | 'Recovering';

export interface Incident {
  id: string;
  title: string;
  service: string;
  environment: EnvironmentType;
  severity: SeverityLevel;
  status: IncidentStatus;
  alertCount: number;
  confidence: number; // 0 to 100
  probableCause: string;
  supportingEvidence: string[];
  proposedRemediation: string;
  remediationStatus: RemediationStatus;
  remediationResult: string | null;
  rejectionReason: string | null;
  blastRadius: string;
  alternativeHypothesis: string;
  noiseReduction: string;
  createdAt: string;
  updatedAt: string;
  systemHealth: SystemHealthStatus;
  hasPostmortem: boolean;
  postmortem: Postmortem | null;
}

export interface Alert {
  id: string;
  timestamp: string;
  source: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  service: string;
}

export type TimelineEventType = 'Alert' | 'System' | 'Agent' | 'Human';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: TimelineEventType;
  title: string;
  description: string;
}

export type ActorType = 'Human' | 'System' | 'Agent';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: ActorType;
  action: string;
  incidentTitle: string | null;
  result: string;
}
