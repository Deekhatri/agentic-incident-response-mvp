# ResolveOps - Autonomous Incident Response MVP

ResolveOps is an agentic, self-healing incident response platform designed for high-velocity engineering teams. It ingests cluster telemetry, aggregates raw alerts into single correlated incidents (reducing noise budgets up to 95%), compiles autonomous root-cause diagnoses, and proposes human-in-the-loop self-healing proposals.

This repository contains **Phase 1 of ResolveOps**, a visually rich, fully interactive frontend-only working prototype built with **React 19, TypeScript, and Tailwind CSS v4**.

---

## 🎨 Visual Identity & Architecture

ResolveOps is designed with a restrained enterprise infrastructure style to match high-fidelity engineering systems like Datadog, PagerDuty, or Kubernetes dashboards:
- **Dense, Highly Readable Typography**: Standardized on **Inter** for UI controls, **Space Grotesk** for display headers, and **JetBrains Mono** for environment parameters, pods, logs, and codes.
- **Enterprise Dark Sidebar Layout**: Dark sidebar frame contrasting with a clean, light workspace container.
- **Micro-interactions & Real-time Simulations**: Custom status badges, confidence meters, inline SVG distribution indicators, and animated live-logs streamers.

---

## 🔄 Interactive Demo Workflows

### 1. The Core Checkout 5xx Incident
- **The Context**: A deployment of version `v2.4.8` of the `checkout-api` microservice on Staging lacks the critical environment variable `PAYMENT_GATEWAY_URL`.
- **The Storm**: The cluster is flooded with 24 related alerts. ResolveOps correlates them into **1 unified SEV-1 incident**, suppressing telemetry noise by **95.8%**.
- **The Investigation**: Inspecting the incident reveals:
  - Agent-generated summary logs.
  - Core Root-Cause analysis (92% confidence score).
  - Dynamic supporting evidence parsed from pod stdout.
  - Detailed raw alerts tables with full filter capabilities.
- **Human-in-the-Loop Healing**:
  - Click **Approve Proposal**.
  - Watch the live simulation: Status updates to *Remediating*, showing container-scale reboots, and rolling out healthy replicas.
  - After 2 seconds, the action completes successfully. The incident resolves, cluster health registers as *Recovering*, and an audit ledger entry is cryptographically recorded.
- **Automated Postmortem Generation**: Once the service is healed, click **Generate Postmortem Report** to instantly synthesize timelines, root-cause diagnostics, and preventive measures.

### 2. Interactive Synthetic Alert Storm Generator
- From the primary **Overview Dashboard**, click the **Generate Test Incident** button.
- Witness a simulated live-stream alert storm in progress: RabbitMQ queue metrics and ReplicaSet collapsible events flood the console.
- Watch the ResolveOps agent correlation pipeline aggregate 15 incoming alerts, reduce noise by **93.3%**, and output a new **SEV-2 incident** complete with root-cause analysis, primary remediation blueprints, and audit events.
- Reset the entire playground at any time via **Reset Test Demo** to run the simulations again.

---

## 🛠️ Technology Stack

- **Frontend**: React 19 (functional components, hooks)
- **Language**: TypeScript (strict type interfaces)
- **Styling**: Tailwind CSS v4 (inline utilities, customized `@theme` bindings)
- **Bundler**: Vite
- **Icons**: Lucide React
- **Local State Management**: React Context & local hook states

---

## 🚀 Local Setup & Verification

Ensure you have Node.js installed on your machine.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Launch development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

3. **Verify compilation & types**:
   ```bash
   npm run lint
   ```
   and
   ```bash
   npm run build
   ```

---

## ⚠️ Phase 1 Frontend-Only Limitations

- **State Persistence**: State is maintained using memory-resident React state hooks. Refreshing or hard reloading will restore the dashboard to its initial active SEV-1 alert conditions.
- **Integration Layer**: No external API, authentication provider, database connection, or container orchestration SDKs are loaded in this prototype. All diagnostic logs and alert payloads are mocked to guarantee high availability and sandbox security.
