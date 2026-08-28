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

export type AgentStatus = 'active' | 'working' | 'thinking' | 'idle' | 'cooldown' | 'blocked' | 'paused';

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
  appId?: string;
  appName?: string;
  podId?: string;
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
  createdAt?: string;
  resolvedAt?: string;
  diagnosis: string;
  rootCause?: string;
  remediationPlan?: string;
  autoCreatedTaskId?: string;
  impact: string;
  impactedService?: string;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  taskTitle: string;
  agent: AgentId;
  actionType: 'destructive_db' | 'production_deploy' | 'payment_config' | 'security_role_change' | 'delete_data' | 'server_recovery';
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

export type AppCategory = 
  | 'web_app'
  | 'mobile_backend'
  | 'e_commerce'
  | 'custom_website'
  | 'microservice_api'
  | 'wordpress_shopify'
  | 'bot_service'
  | 'database_cloud';

export interface ConnectedApp {
  id: string;
  name: string;
  url: string;
  category: AppCategory;
  environment: 'production' | 'staging' | 'development';
  status: 'active' | 'pending' | 'error' | 'paused';
  assignedAgent: AgentId;
  description?: string;
  // Token & Secrets Vault
  apiToken: string; // Plaintext or securely kept
  maskedToken: string; // Masked for display e.g. sk_live_•••••••
  authHeaderType: 'Bearer' | 'X-API-Key' | 'Basic' | 'Custom' | 'None';
  customHeaderName?: string;
  webhookSecret?: string;
  maskedWebhookSecret?: string;
  clientId?: string;
  // Telemetry & Health
  lastPingAt?: string;
  lastPingStatus?: 'success' | 'failed';
  pingLatencyMs?: number;
  healthScore: number;
  totalEventsReceived: number;
  createdAt: string;
  updatedAt: string;
  webhookEndpoint: string;
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

// ----------------------------------------------------
// AI WORKFORCE PLATFORM & CROSS-FUNCTIONAL TEAMS
// ----------------------------------------------------

export type DepartmentCode =
  | 'engineering'
  | 'architecture'
  | 'qa_testing'
  | 'devops_sre'
  | 'security_compliance'
  | 'seo_content'
  | 'growth_marketing'
  | 'analytics_finance'
  | 'customer_success'
  | 'incident_triage';

export interface WorkforceTeam {
  id: DepartmentCode;
  name: string;
  nameEn: string;
  leadAgentId: AgentId;
  memberAgentIds: AgentId[];
  color: string;
  description: string;
  responsibilities: string[];
  activeMissionsCount: number;
  slaResponseTimeSec: number;
  healthScore: number;
  lastHandoff?: {
    fromAgent: AgentId;
    toAgent: AgentId;
    timestamp: string;
    mission: string;
  };
}

export interface CrossTeamMission {
  id: string;
  title: string;
  objective: string;
  status: 'active' | 'in_review' | 'awaiting_gate' | 'completed' | 'failed';
  priority: TaskPriority;
  appId?: string;
  appName?: string;
  leadTeamId: DepartmentCode;
  involvedTeamIds: DepartmentCode[];
  involvedAgentIds: AgentId[];
  createdAt: string;
  updatedAt: string;
  progressPercent: number;
  currentMilestone: string;
  milestones: Array<{
    id: string;
    name: string;
    assignedTeam: DepartmentCode;
    assignedAgent: AgentId;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    completedAt?: string;
  }>;
  handOffLogs: Array<{
    fromAgent: AgentId;
    toAgent: AgentId;
    fromTeam: DepartmentCode;
    toTeam: DepartmentCode;
    handoffNotes: string;
    timestamp: string;
  }>;
}

// ----------------------------------------------------
// AI LEARNING & KNOWLEDGE SERVER (EVOLUTION ENGINE)
// ----------------------------------------------------

export type KnowledgeCategory =
  | 'error_pattern'
  | 'architecture_pattern'
  | 'post_mortem'
  | 'security_rule'
  | 'code_recipe'
  | 'performance_tuning'
  | 'seo_strategy'
  | 'customer_faq';

export interface KnowledgeNode {
  id: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  rootCauseAnalysis?: string;
  verifiedSolution: string;
  preventionRule: string;
  associatedAgent: AgentId;
  associatedTeam: DepartmentCode;
  appId?: string;
  appName?: string;
  confidenceScore: number; // 0 to 100
  timesApplied: number;
  successRate: number; // 0 to 100
  tags: string[];
  learnedFrom: 'error_log' | 'test_failure' | 'post_mortem' | 'owner_feedback' | 'code_review';
  createdAt: string;
  updatedAt: string;
  codeSnippetOrFix?: string;
}

export interface LearningEvolutionMetrics {
  totalKnowledgeNodes: number;
  compoundingIntelligenceScore: number; // e.g. 98.4%
  errorRepetitionReductionPercent: number; // e.g. 94.2%
  autonomousResolutionsWithoutEscalation: number;
  verifiedFixTemplatesCount: number;
  knowledgeGrowthRateWeekly: number;
  lastKnowledgeUpdate: string;
  topPerformingSkillDomains: Array<{
    domain: string;
    score: number;
    trend: 'up' | 'stable';
  }>;
}

// ----------------------------------------------------
// SELF-HEALING LIFECYCLE ENGINE
// ----------------------------------------------------

export type SelfHealingStepStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped' | 'auto_remediated';

export interface SelfHealingStageDetail {
  stage:
    | 'detect'
    | 'diagnose'
    | 'sandbox_patch'
    | 'automated_tests'
    | 'security_scan'
    | 'code_review'
    | 'staging_verify'
    | 'deploy_gate'
    | 'telemetry_monitor'
    | 'auto_rollback_check';
  name: string;
  assignedAgent: AgentId;
  status: SelfHealingStepStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  outputLog?: string;
  details?: Record<string, unknown>;
}

export interface SelfHealingExecution {
  id: string;
  incidentId: string;
  appId?: string;
  appName: string;
  title: string;
  rootCauseDiagnosis: string;
  triggerSource: 'watchdog_alert' | 'sentry_error' | 'synthetic_probe' | 'owner_simulation' | 'health_degradation';
  status: 'running' | 'completed' | 'rolled_back' | 'awaiting_owner_gate' | 'failed';
  currentStageIndex: number;
  stages: SelfHealingStageDetail[];
  sandboxDiff?: string;
  testPassRate?: number;
  securityVulnerabilitiesFound: number;
  stagingResponseTimeMs?: number;
  autoRollbackTriggered: boolean;
  rollbackReason?: string;
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
  requiresOwnerApproval: boolean;
  approvalRequestId?: string;
  githubBranch?: string;
  githubPrUrl?: string;
  githubCommitSha?: string;
  vercelStagingUrl?: string;
  productionDeployedAt?: string;
}

// ----------------------------------------------------
// MULTI-APP, MULTI-TENANCY & DEDICATED AI PODS
// ----------------------------------------------------

export type PodRole = 
  | 'engineering'
  | 'design'
  | 'security'
  | 'devops'
  | 'seo'
  | 'customer_support'
  | 'data';

export interface PodRoleConfig {
  role: PodRole;
  enabled: boolean;
  assignedAgent: AgentId;
  status: 'active' | 'standby' | 'paused';
  activeTasksCount: number;
  lastActionAt?: string;
}

export interface PodTestVerification {
  type: 'health_check' | 'api_test' | 'webhook_test' | 'ssl_probe';
  status: 'passed' | 'failed' | 'skipped' | 'running';
  latencyMs?: number;
  statusCode?: number;
  message: string;
  testedAt: string;
  details?: Record<string, unknown>;
}

export interface AppPod {
  id: string;
  appId: string;
  appName: string;
  workspaceId: string;
  workspacePath: string;
  connectionStatus: 'connected' | 'not_connected' | 'testing' | 'degraded';
  healthScore: number;
  roles: PodRoleConfig[];
  selectedRoleKeys: PodRole[];
  verification: {
    healthCheck: PodTestVerification;
    apiTest: PodTestVerification;
    webhookTest: PodTestVerification;
    lastVerifiedAt?: string;
    allPassed: boolean;
  };
  apiEndpoint?: string;
  apiKeyMasked?: string;
  webhookUrl?: string;
  webhookSecretMasked?: string;
  orchestratorLinked: boolean;
  taskQueueLinked: boolean;
  isolatedMemoryNamespace: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedApp {
  id: string;
  name: string;
  slug: string;
  category: AppCategory;
  url: string;
  stagingUrl?: string;
  repositoryUrl?: string;
  environment: 'production' | 'staging' | 'development';
  status: 'healthy' | 'degraded' | 'healing' | 'maintenance' | 'offline' | 'not_connected';
  healthScore: number;
  connectionStatus: 'connected' | 'not_connected' | 'testing' | 'degraded';
  assignedLeadAgent: AgentId;
  assignedTeamIds: DepartmentCode[];
  assignedAgentIds: AgentId[];
  selectedRoles: PodRole[];
  podId?: string;
  apiEndpoint?: string;
  apiKey?: string;
  maskedApiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  maskedWebhookSecret?: string;
  workspacePath?: string;
  lastHealthCheck?: PodTestVerification;
  lastApiTest?: PodTestVerification;
  lastWebhookTest?: PodTestVerification;
  memoryNamespace: string;
  rbacRolePermissions: {
    canDeployProduction: AgentId[];
    canModifySecrets: AgentId[];
    canRunSchemaMigrations: AgentId[];
  };
  toolAuthorizations: string[];
  apiTokensCount: number;
  activePipelinesCount: number;
  uptimePercent: number;
  monthlyRequests: number;
  lastIncidentAt?: string;
  lastBackupAt?: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

// ----------------------------------------------------
// OBSERVABILITY, AUDIT & BACKUPS
// ----------------------------------------------------

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actor: {
    type: 'agent' | 'owner' | 'watchdog' | 'system' | 'webhook';
    id: string;
    name: string;
  };
  action: string;
  targetAppId?: string;
  targetAppName?: string;
  category: 'security' | 'deployment' | 'self_healing' | 'config_mutation' | 'secret_access' | 'agent_handoff' | 'backup';
  severity: 'info' | 'notice' | 'warning' | 'critical';
  details: string;
  ipOrOrigin?: string;
  hashSha256: string;
}

export interface BackupSnapshot {
  id: string;
  title: string;
  createdAt: string;
  sizeKb: number;
  appId?: string;
  appName: string;
  triggerType: 'scheduled_auto' | 'pre_deploy_snapshot' | 'manual_owner' | 'self_healing_safeguard';
  status: 'completed' | 'in_progress' | 'restoring' | 'verified';
  componentsIncluded: string[];
  checksum: string;
  restorable: boolean;
  version: string;
}

export interface CostMonitoringData {
  totalMonthlyCostUsd: number;
  projectedCostUsd: number;
  budgetLimitUsd: number;
  costEfficiencyScore: number; // 0 to 100
  aiTokensConsumed24h: number;
  totalComputeHours24h: number;
  costBreakdownByApp: Array<{
    appId: string;
    appName: string;
    costUsd: number;
    tokensPercent: number;
  }>;
  costBreakdownByTeam: Array<{
    teamId: DepartmentCode;
    teamName: string;
    costUsd: number;
  }>;
  costOptimizationsSuggested: Array<{
    title: string;
    potentialSavingsUsd: number;
    suggestedByAgent: AgentId;
  }>;
}

export interface AgentPerformanceRecord {
  agentId: AgentId;
  name: string;
  department: string;
  tasksCompleted: number;
  successRatePercent: number;
  avgResolutionTimeSec: number;
  knowledgeNodesContributed: number;
  collaborationIndex: number; // 0 to 100
  securityComplianceScore: number; // 0 to 100
  status: AgentStatus;
}

export interface CoreApiProviderStatus {
  keyName: string;
  provider: 'gemini' | 'github' | 'vercel' | 'whop' | 'database';
  name: string;
  isConfigured: boolean;
  maskedValue: string;
  status: 'connected' | 'missing_keys' | 'failing' | 'configured_unverified';
  latencyMs?: number;
  message: string;
  accountDetails?: Record<string, unknown>;
  docsUrl: string;
  description: string;
}

export interface CoreApiConfigStatus {
  gemini: CoreApiProviderStatus;
  github: CoreApiProviderStatus;
  vercel: CoreApiProviderStatus;
  whop: CoreApiProviderStatus;
  database: CoreApiProviderStatus;
  overallScore: number;
  totalConnected: number;
  totalRequired: number;
}

// ----------------------------------------------------
// OPEN-SOURCE AI DISCOVERY, BENCHMARK SANDBOX & REPLACEMENT
// ----------------------------------------------------

export type OpenSourceProvider =
  | 'ollama'
  | 'vllm'
  | 'huggingface'
  | 'deepseek_direct'
  | 'groq'
  | 'together'
  | 'local_ai'
  | 'openrouter';

export interface OpenSourceModelInfo {
  id: string;
  name: string;
  provider: OpenSourceProvider;
  architecture: string;
  parameterSize: string;
  contextWindow: number;
  license: string;
  licenseType: 'permissive_commercial' | 'open_weights_commercial' | 'research_only';
  licenseVerified: boolean;
  securityAudit: {
    sanitizationScore: number; // 0-100
    dataResidency: 'local_isolated' | 'ephemeral_cloud' | 'strict_zero_logging';
    promptInjectionResistance: number; // 0-100
    zeroDataRetention: boolean;
    passed: boolean;
  };
  benchmarkPerformance: {
    timeToFirstTokenMs: number;
    tokensPerSec: number;
    latencyP95Ms: number;
    costPerMillionTokensUsd: number;
    jsonReliabilityScore: number; // 0-100
    toolCallingAccuracy: number; // 0-100
  };
  compatibility: {
    openAiApiCompatible: boolean;
    supportsJsonSchema: boolean;
    supportsFunctionCalling: boolean;
    supportsStreaming: boolean;
    endpointTested: string;
  };
  status: 'discovered' | 'benchmarking' | 'verified_ready' | 'active_primary' | 'active_fallback' | 'quarantined';
  isCurrentBrain: boolean;
  isFallbackBrain: boolean;
  lastTestedAt: string;
  sandboxTestLogs: string[];
  customEndpointUrl?: string;
  apiKey?: string;
  maskedApiKey?: string;
  description: string;
}

// ----------------------------------------------------
// CONTINUOUS COMPONENT MONITORING & AUTOMATED ISOLATION
// ----------------------------------------------------

export interface MonitoredComponent {
  id: string;
  type: 'agent' | 'external_api' | 'microservice' | 'database' | 'ai_model_server';
  name: string;
  identifier: string;
  status: 'healthy' | 'degraded' | 'isolated_stopped' | 'recovering' | 'awaiting_approval';
  isolationReason?: string;
  isolatedAt?: string;
  latencyMs: number;
  errorRate: number;
  uptime24h: number;
  lastHeartbeat: string;
  consecutiveFailures: number;
  autoRecoveryPlan?: {
    diagnosis: string;
    exactProblem: string;
    affectedLinesOrConfig: string;
    proposedPatch: string;
    rollbackStrategy: string;
    requiresOwnerApproval: true;
    approvalTicketId?: string;
  };
}

// ----------------------------------------------------
// MULTI-TENANT USER AUTH, SITES & ISOLATION TYPES
// ----------------------------------------------------

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  role: 'owner' | 'user';
  createdAt: string;
  lastLoginAt?: string;
  status: 'active' | 'suspended';
  mfaEnabled: boolean;
  avatarUrl?: string;
}

export interface UserWebsite {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  url: string;
  category: 'e_commerce' | 'custom_website' | 'web_app' | 'wordpress_shopify' | 'saas_service' | 'mobile_backend';
  environment: 'production' | 'staging' | 'development';
  status: 'active' | 'pending_verification' | 'degraded' | 'error' | 'maintenance';
  description?: string;
  webhookUrl?: string;
  customApiKeyMasked?: string;
  sslStatus: 'valid' | 'pending' | 'expired';
  healthScore: number;
  uptimePercent: number;
  latencyMs: number;
  autoHealingEnabled: boolean;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
  analytics: {
    pageViews24h: number;
    uptimePercent: number;
    errorRatePercent: number;
    avgResponseTimeMs: number;
    lastAuditSummary?: string;
  };
  aiRecommendations?: Array<{
    id: string;
    category: 'performance' | 'security' | 'seo' | 'conversion';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    suggestedAction: string;
    timestamp: string;
  }>;
}

export interface UserProjectCredential {
  id: string;
  userId: string;
  websiteId?: string;
  keyName: string;
  maskedValue: string;
  category: 'api_key' | 'webhook_secret' | 'db_url' | 'token';
  createdAt: string;
  lastUsedAt?: string;
}

export interface UserAgentInstruction {
  id: string;
  userId: string;
  websiteId?: string;
  instruction: string;
  targetAgent: AgentId | 'general_assistant';
  status: 'processing' | 'completed' | 'failed';
  response?: string;
  suggestedPatch?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
  expiresAt: string;
}

// ----------------------------------------------------
// DYNAMIC SECRETS & ENVIRONMENT REQUIREMENT MANAGER
// ----------------------------------------------------

export interface DynamicSecretRequirement {
  id: string;
  key: string;
  label: string;
  category: 'ai_engine' | 'source_control' | 'deployment' | 'database' | 'payments' | 'custom_env';
  description: string;
  requiredBy: string[];
  isConfigured: boolean;
  maskedValue?: string;
  placeholder?: string;
  isSensitive: boolean;
  isOptional: boolean;
  docsUrl?: string;
  lastTestedAt?: string;
  testStatus?: 'valid' | 'invalid' | 'untested' | 'testing';
  testMessage?: string;
}

// ----------------------------------------------------
// VERIFIABLE 24/7 AGENT EXECUTION & ACTIVITY LOGS
// ----------------------------------------------------

export interface AgentActivityLog {
  id: string;
  activityId: string;
  agentId: AgentId;
  agentName: string;
  teamId?: string;
  commandId?: string;
  taskId?: string;
  taskReceived: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  status: 'running' | 'completed' | 'failed';
  problemFound?: string;
  actionsPerformed: string[];
  solution?: string;
  filesChanged: Array<{
    filePath: string;
    action: 'modified' | 'created' | 'deleted' | 'verified';
    linesAdded: number;
    linesRemoved: number;
    diffSnippet?: string;
  }>;
  commitSha?: string;
  commitUrl?: string;
  branch?: string;
  prUrl?: string;
  prNumber?: number;
  buildStatus?: 'pass' | 'fail' | 'skipped';
  buildLogs?: string[];
  deploymentResult?: {
    platform: 'vercel' | 'cloud_run' | 'edge';
    deploymentId: string;
    deploymentUrl: string;
    state: string;
    deployedAt: string;
  };
  verificationResult?: {
    targetUrl: string;
    httpStatus: number;
    latencyMs: number;
    sslValid: boolean;
    bodyVerified: boolean;
    verifiedAt: string;
  };
  serverConfig?: {
    serverId: string;
    serverName: string;
    port: number;
    action: 'created' | 'configured' | 'connected' | 'scaled';
    status: 'running' | 'healthy';
  };
  errors?: Array<{
    code: string;
    message: string;
    timestamp: string;
  }>;
  evidence: {
    githubVerified: boolean;
    vercelVerified: boolean;
    liveEndpointVerified: boolean;
    proofSummary: string;
  };
  createdAt: string;
}

// ----------------------------------------------------
// PRIVATE AI ADVISOR (المستشار التنفيذي الخاص) TYPES
// ----------------------------------------------------

export interface AdvisorAgentAssignment {
  agentId: AgentId;
  agentName: string;
  role: string;
  taskTitle: string;
  actionRequired: string;
  status: 'assigned' | 'in_progress' | 'verified_done' | 'failed' | 'blocked';
  expectedOutcome: string;
}

export interface PrivateAdvisorPlan {
  planId: string;
  objective: string;
  strategicAssessment: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  assignedAgents: AdvisorAgentAssignment[];
  executionPhases: Array<{
    phaseNumber: number;
    title: string;
    description: string;
    agentId: AgentId;
  }>;
}

export interface PrivateAdvisorExecutionResult {
  missionId: string;
  command: string;
  success: boolean;
  summary: string;
  commitSha?: string;
  commitUrl?: string;
  branch?: string;
  prUrl?: string;
  prNumber?: number;
  deploymentUrl?: string;
  filesChanged?: Array<{
    filePath: string;
    action: 'modified' | 'created' | 'deleted' | 'verified';
    linesAdded: number;
    linesRemoved: number;
    diffSnippet?: string;
  }>;
  liveProbe?: {
    httpStatus: number;
    latencyMs: number;
    sslValid: boolean;
    url: string;
  };
  serverConfig?: any;
  executedAt: string;
  durationMs: number;
}

export interface CredentialRequirementStatus {
  key: string;
  label: string;
  category: string;
  status: 'valid' | 'invalid' | 'missing';
  symbol: '🟢' | '🔴';
  requiredByAgents: AgentId[];
  message: string;
  maskedValue: string;
  isOptional: boolean;
  docsUrl?: string;
}

export interface VerifiableTaskReport {
  taskId: string;
  command: string;
  problem: string;
  solution: string;
  agentsInvolved: Array<{
    agentId: AgentId;
    agentName: string;
    role: string;
    contribution: string;
    status: '🟢 verified' | '🔴 failed';
  }>;
  filesChanged: Array<{
    filePath: string;
    action: 'modified' | 'created' | 'deleted' | 'verified';
    linesAdded: number;
    linesRemoved: number;
    diffSnippet?: string;
  }>;
  exactTime: string;
  durationMs: number;
  commitSha?: string;
  commitUrl?: string;
  branch?: string;
  prUrl?: string;
  deploymentUrl?: string;
  liveVerification?: {
    httpStatus: number;
    latencyMs: number;
    sslValid: boolean;
    url: string;
  };
  serverConfig?: any;
  finalResult: string;
  proofCertificate: string;
  status: '🟢 SUCCESS' | '🔴 BLOCKED_CREDENTIALS' | '🔴 EXECUTION_ERROR';
}

export interface PrivateAdvisorMessage {
  id: string;
  sender: 'owner' | 'advisor';
  text: string;
  timestamp: string;
  plan?: PrivateAdvisorPlan;
  executionResult?: PrivateAdvisorExecutionResult;
  verifiableReport?: VerifiableTaskReport;
  blockedCredentials?: CredentialRequirementStatus[];
  suggestedActions?: string[];
  systemHealthContext?: {
    healthScore: number;
    activeAgentsCount: number;
    connectedApisCount: number;
    openIncidents: number;
    totalRevenue24h: number;
  };
}

export interface AdvisorPulseStatus {
  healthScore: number;
  activeAgentsCount: number;
  connectedApisCount: number;
  totalSecretsConfigured: number;
  missingCriticalSecrets: string[];
  openIncidentsCount: number;
  revenue24h: number;
  lastMissionTimestamp?: string;
  topStrategicAdvice: string[];
  readyForExecution: boolean;
  credentialGate: {
    isOperational: boolean;
    validCount: number;
    invalidCount: number;
    missingCount: number;
    credentials: CredentialRequirementStatus[];
  };
}

export interface AgentConnectivityStatus {
  agentId: AgentId;
  agentName: string;
  title: string;
  department: string;
  overallStatus: 'connected' | 'degraded' | 'blocked';
  symbol: '🟢' | '🔴';
  primaryBrain: {
    connected: boolean;
    model: string;
    latencyMs: number;
    testedAt: string;
    diagnosticResponse: string;
    error?: string;
  };
  providerIntegrations: Array<{
    key: string;
    label: string;
    category: string;
    status: 'valid' | 'missing' | 'invalid';
    symbol: '🟢' | '🔴';
    isOptional: boolean;
    message: string;
  }>;
  verifiedCapabilities: string[];
  readyForDirectives: boolean;
  lastVerifiedAt: string;
}

export interface FleetConnectivityReport {
  timestamp: string;
  totalAgents: number;
  connectedCount: number;
  degradedCount: number;
  blockedCount: number;
  activeAiModel: string;
  geminiEngineStatus: 'connected' | 'disconnected';
  geminiLatencyMs: number;
  agentResults: AgentConnectivityStatus[];
  summary: string;
}

export type FileSyncStatus = 'missing_remote' | 'modified' | 'in_sync' | 'remote_only';

export interface FileSyncItem {
  path: string;
  size: number;
  status: FileSyncStatus;
  diff?: string;
  localSha?: string;
  remoteSha?: string;
  lastModified?: string;
}

export interface FileSyncComparison {
  localTotal: number;
  remoteTotal: number;
  missingOnRemote: FileSyncItem[];
  modified: FileSyncItem[];
  inSync: FileSyncItem[];
  remoteOnly: FileSyncItem[];
  branch: string;
  repo: string;
}

export interface FileSyncExecutedFile {
  path: string;
  action: 'created' | 'updated';
  size: number;
  commitSha: string;
  commitUrl: string;
  verified: boolean;
  timestamp: string;
}

export interface FileSyncExecutionReport {
  success: boolean;
  branch: string;
  syncedFiles: FileSyncExecutedFile[];
  errors: string[];
  durationMs: number;
  commitSha?: string;
  commitUrl?: string;
  timestamp: string;
}


