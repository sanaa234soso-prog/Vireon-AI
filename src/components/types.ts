export type AgentId =
  | 'manager'
  | 'engineer'
  | 'developer'
  | 'frontend'
  | 'qa'
  | 'security'
  | 'auditor'
  | 'devops'
  | 'payments'
  | 'marketplace'
  | 'support'
  | 'seo'
  | 'analytics'
  | 'operations';

export type AgentStatus = 'active' | 'working' | 'thinking' | 'idle' | 'cooldown' | 'blocked';

export type WorkflowStage =
  | 'detect'
  | 'diagnose'
  | 'assign'
  | 'fix'
  | 'test'
  | 'security_check'
  | 'deploy'
  | 'verify'
  | 'report';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';

export interface WorkflowStepLog {
  stage: WorkflowStage;
  agent: AgentId;
  timestamp: string;
  output: string;
  status: 'pass' | 'fail' | 'action_required';
  metadata?: Record<string, unknown>;
}

export interface TaskArtifact {
  id: string;
  type: 'code_diff' | 'test_report' | 'security_audit' | 'deployment_plan' | 'log_excerpt' | 'financial_reconciliation' | 'frontend_preview';
  title: string;
  content: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  stage: WorkflowStage;
  status: TaskStatus;
  assignedAgent: AgentId;
  source: 'owner_command' | 'watchdog_trigger' | 'scheduled_audit' | 'webhook_event' | 'system_recovery' | 'github_pr' | 'frontend_update';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  requiresApproval: boolean;
  approvalReason?: string;
  approvalRiskLevel?: 'critical' | 'high' | 'medium';
  approvalPayload?: {
    actionType: string;
    details: string;
    diffOrQuery?: string;
    targetEnvironment?: 'production' | 'staging';
  };
  approvedBy?: string;
  approvedAt?: string;
  workflowHistory: WorkflowStepLog[];
  artifacts: TaskArtifact[];
  resultSummary?: string;
}

export interface AgentProfile {
  id: AgentId;
  name: string;
  title: string;
  department: string;
  avatarColor: string;
  iconName: string;
  roleDescription: string;
  status: AgentStatus;
  currentTaskTitle?: string;
  completedTasksCount: number;
  activeSince: string;
  confidenceScore: number;
  capabilities: string[];
  lastLog: string;
  lastActiveTimestamp: string;
}

export interface WatchdogMetric {
  id: string;
  service: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'critical' | 'maintenance';
  latencyMs: number;
  uptime24h: number;
  lastChecked: string;
  errorRatePercent: number;
  activeIncidentId?: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  component: string;
  status: 'investigating' | 'diagnosed' | 'auto_remediated' | 'escalated_to_owner' | 'resolved';
  detectedAt: string;
  resolvedAt?: string;
  diagnosis: string;
  remediationPlan?: string;
  autoCreatedTaskId?: string;
  impact: string;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  taskTitle: string;
  agent: AgentId;
  actionType: 'destructive_db' | 'production_deploy' | 'payment_config' | 'security_role_change' | 'delete_data';
  description: string;
  riskLevel: 'critical' | 'high' | 'medium';
  payload: {
    commandOrQuery: string;
    environment: 'production' | 'staging';
    impactAnalysis: string;
    rollbackPlan: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface WhopPaymentRecord {
  id: string;
  whopEventId: string;
  whopOrderId?: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'refunded' | 'failed';
  verifiedSignature: boolean;
  timestamp: string;
  productTitle: string;
  productType: 'membership' | 'digital_download' | 'api_license';
  webhookId?: string;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  sellerName: string;
  sellerId: string;
  category: string;
  price: number;
  status: 'verified_active' | 'pending_qa_audit' | 'flagged_security' | 'suspended';
  healthScore: number;
  salesCount: number;
  revenue: number;
  lastScannedAt: string;
  securityNotes?: string;
  qaPassRate: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  agentId?: AgentId;
  level: 'info' | 'warn' | 'error' | 'success' | 'security';
  module: string;
  message: string;
  details?: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  provider: 'whop' | 'github' | 'vercel' | 'database' | 'smtp' | 'vireon_api' | 'sentry' | 'cloudflare';
  status: 'connected' | 'configured_unverified' | 'missing_keys' | 'failing';
  maskedKey: string;
  hasKey: boolean;
  lastPingAt?: string;
  lastPingStatus?: 'success' | 'error';
  pingLatencyMs?: number;
  requiredFields: string[];
  docsUrl: string;
  realVerified?: boolean;
  details?: Record<string, unknown>;
  errorMessage?: string;
}

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  stars: number;
  openIssues: number;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitDate?: string;
}

export interface GitHubPullRequestInfo {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  headBranch: string;
  baseBranch: string;
  author: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface VercelDeploymentInfo {
  id: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  target: 'production' | 'staging' | 'preview';
  createdAt: string;
  creator: string;
  commitSha?: string;
  commitMessage?: string;
}

export interface WorkerJobRecord {
  id: string;
  name: string;
  category: 'watchdog' | 'security' | 'whop_sync' | 'seo_audit' | 'support_queue' | 'frontend_check' | 'ceo_brief';
  status: 'running' | 'idle' | 'completed' | 'failed';
  intervalSeconds: number;
  lastRunAt: string;
  nextRunAt: string;
  totalRuns: number;
  lastDurationMs: number;
  lastOutput: string;
  healthScore: number;
}

export type BackgroundWorkerJob = WorkerJobRecord;

export interface AgentMemoryEntry {
  id: string;
  sourceAgent?: string;
  authorAgent?: AgentId;
  targetAgent?: AgentId | 'all' | 'broadcast';
  type: string;
  title?: string;
  content: string;
  tags: string[];
  createdAt?: string;
  timestamp?: string;
  importance?: 'high' | 'normal' | 'low';
}

export interface AgentMessage {
  id: string;
  fromAgent: AgentId | string;
  toAgent: AgentId | 'broadcast' | string;
  message: string;
  timestamp: string;
  relatedTaskId?: string;
}

export type AgentMessageRecord = AgentMessage;

export interface CeoDailyReport {
  id: string;
  date: string;
  generatedAt: string;
  summary?: string;
  executiveSummary?: string;
  salesMetrics?: {
    totalRevenue24h: number;
    ordersCount24h: number;
    arpuUsd?: number;
    churnRatePercent?: number;
  };
  operationalHealth?: {
    systemHealthScore: number;
    activeAgentsCount: number;
    webhookSuccessRate: number;
    incidentsResolved: number;
  };
  kpis?: {
    systemHealthScore: number;
    activeAgentsCount: number;
    totalRevenue24h: number;
    ordersCount24h: number;
    activeIncidentsCount: number;
    openPrsCount: number;
    uptimePercent: number;
  };
  highlights?: string[];
  keyAchievements?: string[];
  operationalRisks?: string[];
  recommendations?: string[];
  strategicActionItems?: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    assignedAgent: AgentId;
    deadline: string;
  }[];
  whopFinancialAnalysis?: string;
  watchdogReliabilityVerdict?: string;
}

export interface DesignSystemToken {
  name: string;
  category: 'color' | 'typography' | 'spacing' | 'radius' | 'shadow' | 'motion';
  value: string;
  description: string;
}

export type FrontendDesignTokens = {
  colors: Record<string, string>;
  typography: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
};

export interface FrontendDesignAudit {
  id: string;
  timestamp: string;
  overallScore: number;
  rtlCompliance: number;
  mobileResponsiveness: number;
  wcagContrastScore: number;
  motionPerformanceMs: number;
  designSystemTokensCount?: number;
  recommendations: string[];
  issues?: Array<{
    severity: 'critical' | 'warning' | 'info';
    element: string;
    issue: string;
    suggestedFix: string;
  }>;
}

export type FrontendDesignAuditResult = FrontendDesignAudit;

export interface OwnerProfile {
  email: string;
  role: 'Owner & Super Admin';
  name: string;
  mfaEnabled: boolean;
  lastLogin: string;
  sessionIp: string;
  activeEnvironment: 'production' | 'staging';
}

export interface SystemOverview {
  healthScore: number;
  activeAgentsCount: number;
  openIncidentsCount: number;
  pendingApprovalsCount: number;
  totalRevenue24h: number;
  ordersCount24h: number;
  webhookSuccessRate: number;
  averageLatencyMs: number;
  gitCommit: string;
  activeEnvironment: 'production' | 'staging';
  lastWatchdogSweep: string;
  runningWorkersCount?: number;
  activeJobsCount?: number;
}

export interface LiveSiteConfig {
  siteTitle: string;
  tagline: string;
  bannerEnabled: boolean;
  bannerText: string;
  bannerType: 'info' | 'promo' | 'warning' | 'critical';
  bannerLinkText?: string;
  bannerLinkUrl?: string;
  maintenanceMode: boolean;
  maintenanceNotice: string;
  fastWhopCheckout: boolean;
  aiChatWidgetEnabled: boolean;
  zeroDowntimeReplication: boolean;
  themeAccent: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'fuchsia';
  customCssInject?: string;
  activeVersion: string;
  activeCommitSha: string;
  lastDeployedAt: string;
  lastDeployedBy: string;
  deploymentChannel: 'production' | 'staging';
  previewUrl?: string;
  productionUrl?: string;
}

export interface DeploymentRecord {
  id: string;
  version: string;
  commitSha: string;
  title: string;
  description: string;
  deployedBy: string;
  deployedAgent: AgentId;
  environment: 'production' | 'staging' | 'preview';
  status: 'active' | 'superseded' | 'rolled_back' | 'failed' | 'preview_staged';
  deployedAt: string;
  qaPassRate: number;
  buildDurationMs: number;
  changedFiles: string[];
  diffSnippet: string;
  deploymentLogs: string[];
  vercelDeploymentUrl?: string;
  githubPrUrl?: string;
}

export interface HotPatchPayload {
  title: string;
  description: string;
  agent?: AgentId;
  targetEnvironment?: 'production' | 'staging' | 'preview';
  siteConfigUpdates?: Partial<LiveSiteConfig>;
  codeDiff?: string;
}
