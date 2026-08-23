import fs from 'fs';
import path from 'path';
import {
  AgentId,
  AgentProfile,
  ApprovalRequest,
  IncidentRecord,
  IntegrationConfig,
  MarketplaceListing,
  OwnerProfile,
  SystemLogEntry,
  SystemOverview,
  TaskItem,
  WatchdogMetric,
  WhopPaymentRecord,
  WorkflowStage,
} from '../src/types.js';
import { getInitialAgentProfiles } from './agents/agentDefinitions.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'vireon_state.json');

export interface SystemState {
  owner: OwnerProfile;
  agents: AgentProfile[];
  tasks: TaskItem[];
  watchdogMetrics: WatchdogMetric[];
  incidents: IncidentRecord[];
  approvals: ApprovalRequest[];
  integrations: IntegrationConfig[];
  payments: WhopPaymentRecord[];
  marketplace: MarketplaceListing[];
  logs: SystemLogEntry[];
  activeEnvironment: 'production' | 'staging';
  lastWatchdogSweep: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialState(): SystemState {
  const now = new Date().toISOString();
  const agents = getInitialAgentProfiles();

  const watchdogMetrics: WatchdogMetric[] = [
    {
      id: 'metric-1',
      service: 'Vireon Core API Gateway',
      endpoint: '/api/v1/health',
      status: 'operational',
      latencyMs: 38,
      uptime24h: 99.98,
      lastChecked: now,
      errorRatePercent: 0.02,
    },
    {
      id: 'metric-2',
      service: 'Whop Webhook Ingestion Pipe',
      endpoint: '/api/webhooks/whop',
      status: 'operational',
      latencyMs: 44,
      uptime24h: 100.0,
      lastChecked: now,
      errorRatePercent: 0.0,
    },
    {
      id: 'metric-3',
      service: 'Marketplace Catalog Service',
      endpoint: '/api/marketplace/products',
      status: 'operational',
      latencyMs: 52,
      uptime24h: 99.94,
      lastChecked: now,
      errorRatePercent: 0.05,
    },
    {
      id: 'metric-4',
      service: 'Postgres Database Replica Cluster',
      endpoint: 'db-replica.vireon.internal',
      status: 'operational',
      latencyMs: 14,
      uptime24h: 99.99,
      lastChecked: now,
      errorRatePercent: 0.01,
    },
    {
      id: 'metric-5',
      service: 'Edge SSL & Cloudflare WAF',
      endpoint: 'https://vireon.ai',
      status: 'operational',
      latencyMs: 22,
      uptime24h: 100.0,
      lastChecked: now,
      errorRatePercent: 0.0,
    },
    {
      id: 'metric-6',
      service: 'Customer Support Escalation Queue',
      endpoint: '/api/support/tickets',
      status: 'operational',
      latencyMs: 41,
      uptime24h: 99.95,
      lastChecked: now,
      errorRatePercent: 0.03,
    },
  ];

  const tasks: TaskItem[] = [
    {
      id: 'task-101',
      title: 'Automated 24/7 Security Vulnerability & Secret Audit',
      description: 'AI Security and AI Auditor completed a full scan of API endpoints, environment keys, and RBAC token signatures.',
      priority: 'high',
      stage: 'report',
      status: 'completed',
      assignedAgent: 'security',
      source: 'scheduled_audit',
      createdBy: 'AI Auditor',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
      requiresApproval: false,
      workflowHistory: [
        {
          stage: 'detect',
          agent: 'auditor',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          output: 'Routine scan triggered across 14 server routes and 3 integration keys.',
          status: 'pass',
        },
        {
          stage: 'diagnose',
          agent: 'security',
          timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString(),
          output: 'All tokens masked server-side. Zero plaintext leaks detected in client bundles.',
          status: 'pass',
        },
        {
          stage: 'report',
          agent: 'manager',
          timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
          output: 'System posture verified at 100% compliance. Zero vulnerabilities identified.',
          status: 'pass',
        },
      ],
      artifacts: [
        {
          id: 'art-1',
          type: 'security_audit',
          title: 'Vulnerability Scan Summary',
          content: 'STATUS: CLEAN\nChecked: OWASP Top 10, Whop HMAC, CORS Policies, Rate Limiting.\nAll routes bound to 0.0.0.0:3000.',
          createdAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
        },
      ],
      resultSummary: 'Zero security regressions found. Secrets vault safely isolated.',
    },
    {
      id: 'task-102',
      title: 'Whop Webhook High-Throughput Replay & Signature Assertion',
      description: 'AI Payments verified real-time Whop order ingestion with cryptographic HMAC validation.',
      priority: 'medium',
      stage: 'report',
      status: 'completed',
      assignedAgent: 'payments',
      source: 'webhook_event',
      createdBy: 'AI Payments',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
      requiresApproval: false,
      workflowHistory: [
        {
          stage: 'detect',
          agent: 'payments',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          output: 'Received Whop order event payload: $149.00 Enterprise Digital Bundle.',
          status: 'pass',
        },
        {
          stage: 'test',
          agent: 'qa',
          timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString(),
          output: 'Signature verification succeeded. Webhook response time 44ms.',
          status: 'pass',
        },
        {
          stage: 'report',
          agent: 'manager',
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
          output: 'Order fulfilled and access credentials provisioned in marketplace registry.',
          status: 'pass',
        },
      ],
      artifacts: [
        {
          id: 'art-2',
          type: 'financial_reconciliation',
          title: 'Whop Transaction Verification',
          content: 'Event ID: wh_evt_99841\nOrder ID: ord_vireon_4021\nAmount: $149.00 USD\nStatus: CONFIRMED\nSignature: VALID (sha256)',
          createdAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
        },
      ],
      resultSummary: 'Whop payment verified and ledger updated successfully.',
    },
  ];

  const approvals: ApprovalRequest[] = [
    {
      id: 'appr-01',
      taskId: 'task-105',
      taskTitle: 'Production Database Index Migration on marketplace_orders',
      agent: 'engineer',
      actionType: 'destructive_db',
      description: 'Create concurrent composite index on marketplace_orders (seller_id, created_at) to reduce query latency from 85ms to 12ms during peak traffic.',
      riskLevel: 'high',
      payload: {
        commandOrQuery: 'CREATE INDEX CONCURRENTLY idx_orders_seller_created ON marketplace_orders (seller_id, created_at DESC);',
        environment: 'production',
        impactAnalysis: 'Read-only impact during 15-second build; zero table lock expected.',
        rollbackPlan: 'DROP INDEX CONCURRENTLY IF EXISTS idx_orders_seller_created;',
      },
      status: 'pending',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const incidents: IncidentRecord[] = [
    {
      id: 'inc-01',
      title: 'Transient 504 Gateway Timeout in S3 Digital Asset Delivery CDN',
      severity: 'warning',
      component: 'Marketplace S3 Storage',
      status: 'auto_remediated',
      detectedAt: new Date(Date.now() - 7200000).toISOString(),
      resolvedAt: new Date(Date.now() - 6900000).toISOString(),
      diagnosis: 'Temporary origin throttling in EU region. AI DevOps automatically rerouted traffic to Cloudflare fallback edge.',
      remediationPlan: 'Reroute active download signatures to CDN edge cache and adjust retry exponential backoff.',
      impact: '0 lost sales. 4 downloads re-dispatched cleanly.',
    },
  ];

  const integrations: IntegrationConfig[] = [
    {
      id: 'int-whop',
      name: 'Whop Payments & Checkout',
      provider: 'whop',
      status: process.env.WHOP_API_KEY ? 'connected' : 'configured_unverified',
      maskedKey: process.env.WHOP_API_KEY ? `${process.env.WHOP_API_KEY.slice(0, 4)}••••••••` : 'whop_biz_••••••••',
      hasKey: !!process.env.WHOP_API_KEY,
      lastPingAt: now,
      lastPingStatus: 'success',
      pingLatencyMs: 38,
      requiredFields: ['WHOP_API_KEY', 'WHOP_WEBHOOK_SECRET'],
      docsUrl: 'https://dash.whop.com/developer/api-keys',
    },
    {
      id: 'int-github',
      name: 'GitHub Repository & Deployments',
      provider: 'github',
      status: process.env.GITHUB_TOKEN ? 'connected' : 'configured_unverified',
      maskedKey: process.env.GITHUB_TOKEN ? `${process.env.GITHUB_TOKEN.slice(0, 4)}••••••••` : 'ghp_••••••••',
      hasKey: !!process.env.GITHUB_TOKEN,
      lastPingAt: now,
      lastPingStatus: 'success',
      pingLatencyMs: 65,
      requiredFields: ['GITHUB_TOKEN', 'GITHUB_REPO'],
      docsUrl: 'https://github.com/settings/tokens',
    },
    {
      id: 'int-database',
      name: 'Vireon Core Database',
      provider: 'database',
      status: 'connected',
      maskedKey: 'postgresql://vireon_admin:••••••••@cluster.vireon.internal:5432/vireon_db',
      hasKey: true,
      lastPingAt: now,
      lastPingStatus: 'success',
      pingLatencyMs: 12,
      requiredFields: ['DATABASE_URL'],
      docsUrl: 'https://vireon.ai/docs/database',
    },
    {
      id: 'int-api',
      name: 'Vireon Production API Gateway',
      provider: 'vireon_api',
      status: 'connected',
      maskedKey: 'https://api.vireon.ai (Internal Gateway)',
      hasKey: true,
      lastPingAt: now,
      lastPingStatus: 'success',
      pingLatencyMs: 24,
      requiredFields: ['VIREON_API_URL'],
      docsUrl: 'https://vireon.ai/docs/api',
    },
  ];

  const payments: WhopPaymentRecord[] = [
    {
      id: 'wh-01',
      whopEventId: 'wh_evt_89201',
      whopOrderId: 'ord_vireon_910',
      customerEmail: 'alex.dev@vireon-client.com',
      amount: 299.0,
      currency: 'USD',
      status: 'confirmed',
      verifiedSignature: true,
      timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
      productTitle: 'Vireon AI Architect & Pro Pipeline Suite',
      productType: 'membership',
    },
    {
      id: 'wh-02',
      whopEventId: 'wh_evt_89202',
      whopOrderId: 'ord_vireon_911',
      customerEmail: 'sarah.m@fintechlabs.io',
      amount: 49.0,
      currency: 'USD',
      status: 'confirmed',
      verifiedSignature: true,
      timestamp: new Date(Date.now() - 3600000 * 3.4).toISOString(),
      productTitle: 'AI Auditor Watchdog License (Monthly)',
      productType: 'api_license',
    },
    {
      id: 'wh-03',
      whopEventId: 'wh_evt_89203',
      whopOrderId: 'ord_vireon_912',
      customerEmail: 'james.k@growthcorp.co',
      amount: 199.0,
      currency: 'USD',
      status: 'confirmed',
      verifiedSignature: true,
      timestamp: new Date(Date.now() - 3600000 * 5.1).toISOString(),
      productTitle: 'Vireon Marketplace High-Volume Digital Bundle',
      productType: 'digital_download',
    },
    {
      id: 'wh-04',
      whopEventId: 'wh_evt_89204',
      whopOrderId: 'ord_vireon_913',
      customerEmail: 'david.b@hypercloud.net',
      amount: 499.0,
      currency: 'USD',
      status: 'confirmed',
      verifiedSignature: true,
      timestamp: new Date(Date.now() - 3600000 * 9.8).toISOString(),
      productTitle: 'Enterprise 24/7 Multi-Agent Fleet Cluster',
      productType: 'membership',
    },
  ];

  const marketplace: MarketplaceListing[] = [
    {
      id: 'prod-01',
      title: 'Autonomous Code Refactoring Agent Suite',
      sellerName: 'Vireon Core Lab',
      sellerId: 'sel_vireon_official',
      category: 'Developer Tools',
      price: 129.0,
      status: 'verified_active',
      healthScore: 99.4,
      salesCount: 142,
      revenue: 18318.0,
      lastScannedAt: now,
      qaPassRate: 100,
      securityNotes: '0 known vulnerabilities. Sandboxed execution verified.',
    },
    {
      id: 'prod-02',
      title: 'Whop Payment Webhook Reconciliation Bot',
      sellerName: 'Apex Fintech Solutions',
      sellerId: 'sel_apex_fin',
      category: 'Fintech & Payments',
      price: 89.0,
      status: 'verified_active',
      healthScore: 98.2,
      salesCount: 88,
      revenue: 7832.0,
      lastScannedAt: now,
      qaPassRate: 98.5,
      securityNotes: 'HMAC signature verification passed with zero payload tampering.',
    },
    {
      id: 'prod-03',
      title: 'Vireon SEO & SERP Crawler Pro',
      sellerName: 'GrowthStack AI',
      sellerId: 'sel_growth_stack',
      category: 'Growth & SEO',
      price: 69.0,
      status: 'verified_active',
      healthScore: 96.8,
      salesCount: 64,
      revenue: 4416.0,
      lastScannedAt: now,
      qaPassRate: 97.0,
      securityNotes: 'Compliant with robots.txt standards and Google Search index protocols.',
    },
    {
      id: 'prod-04',
      title: 'AI Multi-Agent Customer Concierge Template',
      sellerName: 'BotCrafters Studio',
      sellerId: 'sel_botcrafters',
      category: 'Customer Support',
      price: 149.0,
      status: 'pending_qa_audit',
      healthScore: 92.1,
      salesCount: 19,
      revenue: 2831.0,
      lastScannedAt: now,
      qaPassRate: 94.0,
      securityNotes: 'Under automated test review by AI QA & AI Security.',
    },
  ];

  const logs: SystemLogEntry[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 0.1).toISOString(),
      agentId: 'manager',
      level: 'success',
      module: 'Command Orchestrator',
      message: 'Vireon 24/7 AI Team operational. All 13 agents synchronized with Watchdog loop.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000 * 0.4).toISOString(),
      agentId: 'auditor',
      level: 'info',
      module: '24/7 Watchdog',
      message: 'Health probe sweep completed: 6/6 endpoints nominal. Average latency 34.2ms.',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 3600000 * 1.1).toISOString(),
      agentId: 'payments',
      level: 'success',
      module: 'Whop Gateway',
      message: 'Verified Whop payment #wh_evt_89201 ($299.00). Access token issued.',
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      agentId: 'security',
      level: 'security',
      module: 'IAM Sentinel',
      message: 'Super Admin Owner session authenticated. All destructive actions protected by Gatekeeper approval.',
    },
  ];

  return {
    owner: {
      email: 'sadeksanae50@gmail.com',
      role: 'Owner & Super Admin',
      name: 'Sadek Sanae',
      mfaEnabled: true,
      lastLogin: now,
      sessionIp: '127.0.0.1 (Authorized Command Terminal)',
      activeEnvironment: 'production',
    },
    agents,
    tasks,
    watchdogMetrics,
    incidents,
    approvals,
    integrations,
    payments,
    marketplace,
    logs,
    activeEnvironment: 'production',
    lastWatchdogSweep: now,
  };
}

class StoreManager {
  private state: SystemState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): SystemState {
    ensureDataDir();
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure agents are populated if missing
        if (!parsed.agents || parsed.agents.length === 0) {
          parsed.agents = getInitialAgentProfiles();
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading persisted state file, initializing fresh:', err);
    }
    const initial = getInitialState();
    this.saveStateToDisk(initial);
    return initial;
  }

  private saveStateToDisk(state: SystemState) {
    ensureDataDir();
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing state file to disk:', err);
    }
  }

  public getState(): SystemState {
    return this.state;
  }

  public save() {
    this.saveStateToDisk(this.state);
  }

  public addLog(entry: Omit<SystemLogEntry, 'id' | 'timestamp'>) {
    const log: SystemLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.logs.unshift(log);
    if (this.state.logs.length > 300) {
      this.state.logs = this.state.logs.slice(0, 300);
    }
    this.save();
    return log;
  }

  public updateAgent(id: AgentId, updates: Partial<AgentProfile>) {
    const idx = this.state.agents.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.state.agents[idx] = {
        ...this.state.agents[idx],
        ...updates,
        lastActiveTimestamp: new Date().toISOString(),
      };
      this.save();
    }
  }

  public addTask(task: TaskItem) {
    this.state.tasks.unshift(task);
    this.save();
    return task;
  }

  public updateTask(id: string, updates: Partial<TaskItem>) {
    const idx = this.state.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.state.tasks[idx] = {
        ...this.state.tasks[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.state.tasks[idx];
    }
    return null;
  }

  public addApproval(approval: ApprovalRequest) {
    this.state.approvals.unshift(approval);
    this.save();
    return approval;
  }

  public resolveApproval(id: string, decision: 'approved' | 'rejected', notes?: string) {
    const idx = this.state.approvals.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.state.approvals[idx].status = decision;
      this.state.approvals[idx].resolvedAt = new Date().toISOString();
      this.state.approvals[idx].resolvedBy = this.state.owner.email;
      if (notes) this.state.approvals[idx].notes = notes;
      this.save();
      return this.state.approvals[idx];
    }
    return null;
  }

  public addIncident(incident: IncidentRecord) {
    this.state.incidents.unshift(incident);
    this.save();
    return incident;
  }

  public resolveIncident(id: string) {
    const idx = this.state.incidents.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.state.incidents[idx].status = 'resolved';
      this.state.incidents[idx].resolvedAt = new Date().toISOString();
      this.save();
      return this.state.incidents[idx];
    }
    return null;
  }

  public addPayment(payment: WhopPaymentRecord) {
    this.state.payments.unshift(payment);
    this.save();
    return payment;
  }

  public updateWatchdogMetrics(metrics: WatchdogMetric[]) {
    this.state.watchdogMetrics = metrics;
    this.state.lastWatchdogSweep = new Date().toISOString();
    this.save();
  }

  public getOverview(): SystemOverview {
    const activeAgents = this.state.agents.filter((a) => a.status === 'active' || a.status === 'working').length;
    const openIncidents = this.state.incidents.filter((i) => i.status !== 'resolved').length;
    const pendingApprovals = this.state.approvals.filter((a) => a.status === 'pending').length;
    const totalRev = this.state.payments
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0);

    const latencies = this.state.watchdogMetrics.map((m) => m.latencyMs);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 32;

    const opCount = this.state.watchdogMetrics.filter((m) => m.status === 'operational').length;
    const healthScore = Math.round((opCount / (this.state.watchdogMetrics.length || 1)) * 100);

    return {
      healthScore,
      activeAgentsCount: activeAgents,
      openIncidentsCount: openIncidents,
      pendingApprovalsCount: pendingApprovals,
      totalRevenue24h: totalRev,
      ordersCount24h: this.state.payments.length,
      webhookSuccessRate: 100,
      averageLatencyMs: avgLatency,
      gitCommit: 'main-9f2b80a-prod',
      activeEnvironment: this.state.activeEnvironment,
      lastWatchdogSweep: this.state.lastWatchdogSweep,
    };
  }
}

export const store = new StoreManager();
