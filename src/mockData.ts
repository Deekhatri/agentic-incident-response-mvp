/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Alert, AuditLogEntry, TimelineEvent, Postmortem } from './types';

// Helper to format timestamps relative to current time
export function getRelativeTime(minutesAgo: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

// Format date for readable display
export function formatReadableTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + 
         date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt-101',
    timestamp: getRelativeTime(43),
    source: 'Kubelet',
    severity: 'Critical',
    message: 'Pod checkout-api-7db6cf5b8d-abcde is crashing: CrashLoopBackOff (exit code 1)',
    service: 'checkout-api'
  },
  {
    id: 'alt-102',
    timestamp: getRelativeTime(42),
    source: 'Prometheus',
    severity: 'Critical',
    message: 'HTTP 5xx error rate for service checkout-api exceeded threshold (current: 14.5%, threshold: 1.0%)',
    service: 'checkout-api'
  },
  {
    id: 'alt-103',
    timestamp: getRelativeTime(42),
    source: 'Kubelet',
    severity: 'Critical',
    message: 'Pod checkout-api-7db6cf5b8d-fghij is crashing: CrashLoopBackOff (exit code 1)',
    service: 'checkout-api'
  },
  {
    id: 'alt-104',
    timestamp: getRelativeTime(40),
    source: 'Nginx-Ingress',
    severity: 'Warning',
    message: 'Upstream connection failed for checkout-api backend',
    service: 'checkout-api'
  },
  {
    id: 'alt-105',
    timestamp: getRelativeTime(39),
    source: 'Datadog',
    severity: 'Critical',
    message: 'Checkout transaction completion rate dropped to 0%',
    service: 'checkout-api'
  },
  {
    id: 'alt-106',
    timestamp: getRelativeTime(38),
    source: 'LogSeverityAlert',
    severity: 'Critical',
    message: 'CRITICAL error in checkout-api: "FATAL: Config key PAYMENT_GATEWAY_URL not found in process.env"',
    service: 'checkout-api'
  },
  {
    id: 'alt-107',
    timestamp: getRelativeTime(38),
    source: 'Kubelet',
    severity: 'Critical',
    message: 'Pod checkout-api-7db6cf5b8d-klmno is crashing: CrashLoopBackOff (exit code 1)',
    service: 'checkout-api'
  }
];

// Generate 17 more mock alerts to make up the 24 grouped alerts
for (let i = 1; i <= 17; i++) {
  INITIAL_ALERTS.push({
    id: `alt-group-${i}`,
    timestamp: getRelativeTime(43 - i * 0.2),
    source: i % 2 === 0 ? 'Jaeger-Tracing' : 'Prometheus',
    severity: i % 3 === 0 ? 'Critical' : 'Warning',
    message: i % 2 === 0 
      ? `Trace latency spike detected on span checkout-api:process-payment (${(2000 + i * 150)}ms)`
      : `High error budget burn rate on checkout-api endpoint /checkout/charge (http-status: 500)`,
    service: 'checkout-api'
  });
}

// Sorting alerts by timestamp (descending)
INITIAL_ALERTS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    timestamp: getRelativeTime(45),
    type: 'System',
    title: 'Deployment Detected',
    description: 'Service checkout-api deployed version v2.4.8 by system account cd-pipeline.'
  },
  {
    id: 'evt-2',
    timestamp: getRelativeTime(43),
    type: 'Alert',
    title: 'First Alert Triggered',
    description: 'Kubelet reported checkout-api-7db6cf5b8d-abcde in CrashLoopBackOff.'
  },
  {
    id: 'evt-3',
    timestamp: getRelativeTime(42),
    type: 'Alert',
    title: 'Alert Storm Initiated',
    description: 'HTTP 5xx error rate exceeded 14.5%. Total of 24 distinct infrastructure alerts received within 5 minutes.'
  },
  {
    id: 'evt-4',
    timestamp: getRelativeTime(41),
    type: 'Agent',
    title: 'ResolveOps Agent Activated',
    description: 'Autonomous core ingest correlates 24 incoming telemetry alerts. Deduped & suppressed noise by 95.8%.'
  },
  {
    id: 'evt-5',
    timestamp: getRelativeTime(40),
    type: 'Agent',
    title: 'Root-Cause Analysis Complete',
    description: 'Analyzed application startup logs, pod exit codes, and recent deployment manifests. Identified missing PAYMENT_GATEWAY_URL environment variable (92% confidence).'
  },
  {
    id: 'evt-6',
    timestamp: getRelativeTime(39),
    type: 'Agent',
    title: 'Remediation Proposal Created',
    description: 'Generated self-healing plan: Inject config map with missing variable and restart the checkout-api deployment. Awaiting human-in-the-loop approval.'
  }
];

export const CORE_INCIDENT_ID = 'inc-checkout-5xx';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: CORE_INCIDENT_ID,
    title: 'Checkout API elevated 5xx errors after deployment',
    service: 'checkout-api',
    environment: 'Staging',
    severity: 'SEV-1',
    status: 'Triggered',
    alertCount: 24,
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
    noiseReduction: '95.8% (24 alerts grouped into 1 incident)',
    createdAt: getRelativeTime(43),
    updatedAt: getRelativeTime(39),
    systemHealth: 'Degraded',
    hasPostmortem: false,
    postmortem: null
  },
  {
    id: 'inc-redis-latency',
    title: 'Redis Staging cache latency spike',
    service: 'cache-redis',
    environment: 'Staging',
    severity: 'SEV-3',
    status: 'Resolved',
    alertCount: 8,
    confidence: 85,
    probableCause: 'Eviction policy misconfiguration on staging redis instance, leading to Out of Memory restarts.',
    supportingEvidence: [
      'Memory utilization hit 100% at 09:12.',
      'Average response time increased from 2ms to 450ms.',
      'Redis container restarted with exit code 137 (OOM killed).'
    ],
    proposedRemediation: 'Increase memory limit to 4GB and change maxmemory-policy to volatile-lru.',
    remediationStatus: 'Completed',
    remediationResult: 'Memory limits adjusted. Cache latency returned to baseline (<3ms).',
    rejectionReason: null,
    blastRadius: 'Staging environment caching only. Minimal performance hit.',
    alternativeHypothesis: 'An un-indexed queries pattern from catalog-api (12% confidence).',
    noiseReduction: '87.5% (8 alerts grouped into 1 incident)',
    createdAt: getRelativeTime(180),
    updatedAt: getRelativeTime(160),
    systemHealth: 'Healthy',
    hasPostmortem: true,
    postmortem: {
      summary: 'Staging Redis cache instance crashed repeatedly due to Out of Memory (OOM) conditions under synthetic load, causing downstream latency spikes across catalog services.',
      customerImpact: 'None. Affected staging environment only.',
      detection: 'Automated Datadog threshold alert on Redis latency (>100ms) triggered.',
      timeline: [
        '09:12 UTC: Memory utilization hit 100% limit.',
        '09:14 UTC: Container OOM killed and entered crash loop.',
        '09:15 UTC: ResolveOps correlated 8 alerts and proposed memory allocation adjustments.',
        '09:18 UTC: Proposal approved; config changes pushed.',
        '09:20 UTC: Redis healthy, latency returned to 2ms.'
      ],
      rootCause: 'Maxmemory policy was set to "noeviction", preventing Redis from clearing older keys when limits were reached, forcing an OOM crash.',
      resolution: 'Allocated 4GB (up from 2GB) and updated policy to "volatile-lru" for graceful key eviction.',
      contributingFactors: [
        'High synthetic volume run without cache TTL controls.',
        'Staging resource limits were set too tightly.'
      ],
      followUpActions: [
        'Sync staging cache configuration policies with production.',
        'Implement automatic TTL validation in staging deployment pipelines.'
      ]
    }
  },
  {
    id: 'inc-auth-cpu',
    title: 'auth-service high CPU utilization',
    service: 'auth-service',
    environment: 'Production',
    severity: 'SEV-2',
    status: 'Acknowledged',
    alertCount: 12,
    confidence: 78,
    probableCause: 'Bcrypt hashing complexity factor inadvertently increased in recent security package update.',
    supportingEvidence: [
      'CPU load on auth-service instances jumped to 96%.',
      'Average token signing duration increased from 40ms to 980ms.',
      'Deployment of auth-security-lib version v1.2.0 recorded 1 hour prior.'
    ],
    proposedRemediation: 'Roll back auth-security-lib dependency to version v1.1.9 and trigger rolling deployment.',
    remediationStatus: 'Pending Approval',
    remediationResult: null,
    rejectionReason: null,
    blastRadius: 'All login flows experiencing slower response times (approx. 1s delay).',
    alternativeHypothesis: 'Active dictionary brute-force attack on /api/v1/auth/login endpoint (45% confidence).',
    noiseReduction: '91.6% (12 alerts grouped into 1 incident)',
    createdAt: getRelativeTime(120),
    updatedAt: getRelativeTime(115),
    systemHealth: 'Degraded',
    hasPostmortem: false,
    postmortem: null
  },
  {
    id: 'inc-payment-timeouts',
    title: 'payment-gateway webhook timeouts',
    service: 'payment-gateway',
    environment: 'Production',
    severity: 'SEV-1',
    status: 'Investigating',
    alertCount: 19,
    confidence: 88,
    probableCause: 'Stripe webhook endpoint experiencing SSL handshake failures due to expired root certificate authority bundle.',
    supportingEvidence: [
      'Stripe reported webhook delivery failures (HTTP 502/504 timeouts).',
      'Ingress gateway logs report "SSL verification failed for external peer".',
      'No application code changes deployed in the last 24 hours.'
    ],
    proposedRemediation: 'Update CA cert bundle in ingress pod config and perform zero-downtime reload.',
    remediationStatus: 'Pending Approval',
    remediationResult: null,
    rejectionReason: null,
    blastRadius: 'Critical production checkout processing delayed. Real-time fulfillment delayed.',
    alternativeHypothesis: 'External Stripe webhook infrastructure downtime (15% confidence).',
    noiseReduction: '94.7% (19 alerts grouped into 1 incident)',
    createdAt: getRelativeTime(60),
    updatedAt: getRelativeTime(55),
    systemHealth: 'Degraded',
    hasPostmortem: false,
    postmortem: null
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    timestamp: getRelativeTime(160),
    actor: 'admin@resolveops.io',
    actorType: 'Human',
    action: 'Approved Remediation Proposal',
    incidentTitle: 'Redis Staging cache latency spike',
    result: 'Success. Script exec: adjust_redis_mem.sh completed.'
  },
  {
    id: 'aud-2',
    timestamp: getRelativeTime(120),
    actor: 'ResolveOps Agent',
    actorType: 'Agent',
    action: 'Correlated telemetry storm',
    incidentTitle: 'auth-service high CPU utilization',
    result: 'Grouped 12 alerts into inc-auth-cpu'
  },
  {
    id: 'aud-3',
    timestamp: getRelativeTime(60),
    actor: 'ResolveOps Agent',
    actorType: 'Agent',
    action: 'Correlated telemetry storm',
    incidentTitle: 'payment-gateway webhook timeouts',
    result: 'Grouped 19 alerts into inc-payment-timeouts'
  },
  {
    id: 'aud-4',
    timestamp: getRelativeTime(41),
    actor: 'ResolveOps Agent',
    actorType: 'Agent',
    action: 'Correlated telemetry storm',
    incidentTitle: 'Checkout API elevated 5xx errors after deployment',
    result: 'Grouped 24 alerts into inc-checkout-5xx'
  },
  {
    id: 'aud-5',
    timestamp: getRelativeTime(39),
    actor: 'ResolveOps Agent',
    actorType: 'Agent',
    action: 'Created Remediation Proposal',
    incidentTitle: 'Checkout API elevated 5xx errors after deployment',
    result: 'Proposal "Restart checkout-api after restoring config" status: Pending Approval'
  }
];

export const RECENT_AGENT_ACTIVITIES = [
  {
    id: 'act-1',
    timestamp: getRelativeTime(2),
    message: 'Analyzing ingress-nginx access patterns for auth-service.'
  },
  {
    id: 'act-2',
    timestamp: getRelativeTime(5),
    message: 'Telemetry polling: checking cluster node pressure metrics (CPU: 23%, Mem: 54%).'
  },
  {
    id: 'act-3',
    timestamp: getRelativeTime(12),
    message: 'Completed code review logs cross-correlation index.'
  },
  {
    id: 'act-4',
    timestamp: getRelativeTime(39),
    message: 'RCA pipeline evaluated logs matching "PAYMENT_GATEWAY_URL missing" with 92% confidence.'
  }
];

// Interactive Test Incident Generator Data
export const TEST_INCIDENT_ALERTS_FLOW: Alert[] = [
  {
    id: 'test-alt-1',
    timestamp: new Date().toISOString(),
    source: 'Kubernetes API',
    severity: 'Critical',
    message: 'Deployment "notification-worker" replicas dropped from 5 to 1 (under-provisioned)',
    service: 'notification-worker'
  },
  {
    id: 'test-alt-2',
    timestamp: new Date().toISOString(),
    source: 'RabbitMQ Broker',
    severity: 'Critical',
    message: 'Queue "user.notifications" length exceeded 10,000 pending messages (unacknowledged)',
    service: 'notification-worker'
  },
  {
    id: 'test-alt-3',
    timestamp: new Date().toISOString(),
    source: 'Prometheus',
    severity: 'Critical',
    message: 'RabbitMQ consumer count dropped to 1 for queue user.notifications',
    service: 'notification-worker'
  },
  {
    id: 'test-alt-4',
    timestamp: new Date().toISOString(),
    source: 'LogSeverityAlert',
    severity: 'Critical',
    message: 'notification-worker log error: "AMQP connection timeout - secondary broker host unreachable"',
    service: 'notification-worker'
  }
];

// Add 11 more alerts to make a total of 15 alerts grouped
for (let i = 1; i <= 11; i++) {
  TEST_INCIDENT_ALERTS_FLOW.push({
    id: `test-alt-group-${i}`,
    timestamp: new Date().toISOString(),
    source: i % 2 === 0 ? 'Jaeger-Tracing' : 'Prometheus',
    severity: 'Warning',
    message: i % 2 === 0 
      ? `Jaeger trace error: publish-event timed out after 5000ms`
      : `Prometheus alert: Queue latency spike detected (current: ${3000 + i * 200}ms)`,
    service: 'notification-worker'
  });
}

export const TEST_INCIDENT_ID = 'inc-notification-queue';

export function createMockTestIncident(): Incident {
  return {
    id: TEST_INCIDENT_ID,
    title: 'RabbitMQ message queue congestion in notification-worker',
    service: 'notification-worker',
    environment: 'Production',
    severity: 'SEV-2',
    status: 'Triggered',
    alertCount: 15,
    confidence: 94,
    probableCause: 'Misconfigured AMQP connection string pointing to outdated staging broker node after TLS update.',
    supportingEvidence: [
      'AMQP connection timeout exceptions thrown by notification-worker pods.',
      'Active queue consumer count fell from 5 to 1 at 08:34.',
      'Total queue length for user.notifications exceeded 10,000 and is rising exponentially.'
    ],
    proposedRemediation: 'Hot-patch the AMQP connection string variables on k8s secrets and force restart notification-worker replicas.',
    remediationStatus: 'Pending Approval',
    remediationResult: null,
    rejectionReason: null,
    blastRadius: 'All user notification deliveries (emails, SMS, push) delayed. No critical transactional data lost.',
    alternativeHypothesis: 'RabbitMQ secondary broker instance hardware resource exhaustion (28% confidence).',
    noiseReduction: '93.3% (15 alerts grouped into 1 incident)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    systemHealth: 'Degraded',
    hasPostmortem: false,
    postmortem: null
  };
}

export const TEST_INCIDENT_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'test-evt-1',
    timestamp: new Date().toISOString(),
    type: 'Alert',
    title: 'Kubernetes Event',
    description: 'Kubernetes ReplicaSet notification-worker reported replicas collapsed.'
  },
  {
    id: 'test-evt-2',
    timestamp: new Date().toISOString(),
    type: 'Alert',
    title: 'RabbitMQ Congestion Alert',
    description: 'Queue length exceeded 10k messages. Severe consumer shortage detected.'
  },
  {
    id: 'test-evt-3',
    timestamp: new Date().toISOString(),
    type: 'Agent',
    title: 'ResolveOps Agent Triggered',
    description: 'Correlated 15 alerts into a single incident, suppressing 93.3% of monitoring noise.'
  },
  {
    id: 'test-evt-4',
    timestamp: new Date().toISOString(),
    type: 'Agent',
    title: 'Root Cause Pinpointed',
    description: 'Identified outdated host URI in AMQP credentials following yesterdays cluster certificate updates.'
  }
];
