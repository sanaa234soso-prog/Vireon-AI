import fs from 'fs';
import path from 'path';
import {
  ManagedApp,
  DepartmentCode,
  AgentId,
  AppCategory,
  PodRole,
} from '../src/types.js';
import { store } from './store.js';
import { getStorageFilePath } from './storagePath.js';
import { dedicatedPodManager, ROLE_AGENT_MAP, ROLE_DEPARTMENT_MAP } from './podValidator.js';

function getAppsFilePath() {
  return getStorageFilePath('managed_apps.json');
}

const INITIAL_APPS: ManagedApp[] = [
  {
    id: 'app-01',
    name: 'منصة فايريون الرئيسية (Vireon Command Center)',
    slug: 'vireon-command-center',
    category: 'web_app',
    url: 'https://vireon.ai',
    stagingUrl: 'https://staging.vireon.ai',
    repositoryUrl: 'https://github.com/vireon/command-center',
    environment: 'production',
    status: 'healthy',
    connectionStatus: 'connected',
    healthScore: 99.8,
    assignedLeadAgent: 'manager',
    assignedTeamIds: ['architecture', 'engineering', 'security_compliance', 'devops_sre', 'incident_triage'],
    assignedAgentIds: ['manager', 'engineer', 'developer', 'frontend', 'security', 'devops', 'operations'],
    selectedRoles: ['engineering', 'design', 'security', 'devops', 'seo', 'customer_support', 'data'],
    podId: 'pod-app-01',
    workspacePath: '/workspaces/app-01',
    memoryNamespace: 'ns_vireon_core',
    rbacRolePermissions: {
      canDeployProduction: ['manager', 'devops'],
      canModifySecrets: ['security'],
      canRunSchemaMigrations: ['engineer', 'manager']
    },
    toolAuthorizations: ['github_api', 'vercel_cli', 'watchdog_probe', 'whop_sync', 'sandbox_runner'],
    apiTokensCount: 3,
    activePipelinesCount: 2,
    uptimePercent: 99.99,
    monthlyRequests: 480000,
    lastIncidentAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    lastBackupAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'نظام التشغيل والإدارة الذاتي المركزي لأسطول وكلاء الذكاء الاصطناعي وخزنة الرموز والتحكم.'
  },
  {
    id: 'app-02',
    name: 'متجر فايريون الرقمي (Vireon Digital Storefront)',
    slug: 'vireon-storefront',
    category: 'e_commerce',
    url: 'https://store.vireon.ai',
    stagingUrl: 'https://staging-store.vireon.ai',
    repositoryUrl: 'https://github.com/vireon/storefront',
    environment: 'production',
    status: 'healthy',
    connectionStatus: 'connected',
    healthScore: 99.4,
    assignedLeadAgent: 'payments',
    assignedTeamIds: ['growth_marketing', 'engineering', 'qa_testing', 'seo_content', 'customer_success'],
    assignedAgentIds: ['payments', 'marketplace', 'developer', 'frontend', 'qa', 'seo', 'support'],
    selectedRoles: ['engineering', 'design', 'seo', 'customer_support', 'data'],
    podId: 'pod-app-02',
    workspacePath: '/workspaces/app-02',
    memoryNamespace: 'ns_vireon_store',
    rbacRolePermissions: {
      canDeployProduction: ['devops', 'manager'],
      canModifySecrets: ['security'],
      canRunSchemaMigrations: ['engineer']
    },
    toolAuthorizations: ['whop_api', 'stripe_gateway', 'seo_crawler', 'email_dispatch'],
    apiTokensCount: 4,
    activePipelinesCount: 1,
    uptimePercent: 99.95,
    monthlyRequests: 195000,
    lastIncidentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    lastBackupAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'بوابة التجارة الرقمية، بيع المنتجات الرقمية والتراخيص والاشتراكات عبر تكامل Whop المباشر.'
  },
  {
    id: 'app-03',
    name: 'تطبيق فايريون للهواتف الذكية (Vireon Mobile Companion)',
    slug: 'vireon-mobile',
    category: 'mobile_backend',
    url: 'https://m.vireon.ai',
    stagingUrl: 'https://staging-m.vireon.ai',
    repositoryUrl: 'https://github.com/vireon/mobile-pwa',
    environment: 'production',
    status: 'healthy',
    connectionStatus: 'connected',
    healthScore: 99.6,
    assignedLeadAgent: 'frontend',
    assignedTeamIds: ['engineering', 'qa_testing', 'security_compliance'],
    assignedAgentIds: ['frontend', 'developer', 'qa', 'security'],
    selectedRoles: ['engineering', 'design', 'security', 'devops'],
    podId: 'pod-app-03',
    workspacePath: '/workspaces/app-03',
    memoryNamespace: 'ns_vireon_mobile',
    rbacRolePermissions: {
      canDeployProduction: ['manager', 'devops'],
      canModifySecrets: ['security'],
      canRunSchemaMigrations: ['engineer']
    },
    toolAuthorizations: ['push_notifications', 'pwa_service_worker', 'biometric_auth'],
    apiTokensCount: 2,
    activePipelinesCount: 1,
    uptimePercent: 100.0,
    monthlyRequests: 320000,
    lastIncidentAt: undefined,
    lastBackupAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'تطبيق الهاتف PWA المتكامل مع إشعارات Push ومراقبة حالة الخوادم والمهام بملء الشاشة.'
  }
];

class MultiAppManager {
  private apps: ManagedApp[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    const filePath = getAppsFilePath();
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        this.apps = JSON.parse(raw);
      } else {
        this.apps = [...INITIAL_APPS];
        this.saveState();
      }
    } catch (err) {
      console.error('Error loading managed apps:', err);
      this.apps = [...INITIAL_APPS];
    }
  }

  private saveState() {
    const filePath = getAppsFilePath();
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.apps, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving managed apps:', err);
    }
  }

  public getApps(): ManagedApp[] {
    return [...this.apps];
  }

  public getAppById(id: string): ManagedApp | undefined {
    return this.apps.find((a) => a.id === id);
  }

  public async createAppWithPod(data: {
    name: string;
    category: AppCategory;
    url: string;
    stagingUrl?: string;
    repositoryUrl?: string;
    environment?: 'production' | 'staging' | 'development';
    description?: string;
    assignedLeadAgent?: AgentId;
    selectedRoles: PodRole[];
    apiEndpoint?: string;
    apiKey?: string;
    webhookUrl?: string;
    webhookSecret?: string;
  }): Promise<{ app: ManagedApp; podResult: any }> {
    const appId = `app-${Date.now().toString().slice(-4)}`;
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || appId;

    const selectedRoles = (data.selectedRoles && data.selectedRoles.length > 0)
      ? data.selectedRoles
      : ['engineering', 'design', 'security', 'devops', 'seo', 'customer_support', 'data'] as PodRole[];

    // 1. Provision Dedicated AI Pod with real Health Check & Verification
    const podResult = await dedicatedPodManager.provisionPodForApp({
      appId,
      appName: data.name,
      url: data.url,
      apiEndpoint: data.apiEndpoint,
      apiKey: data.apiKey,
      webhookUrl: data.webhookUrl,
      webhookSecret: data.webhookSecret,
      selectedRoles,
    });

    const isConnected = podResult.allPassed;
    const connectionStatus = isConnected ? 'connected' : 'not_connected';
    const appStatus = isConnected ? 'healthy' : 'not_connected';
    const healthScore = isConnected ? 100 : (podResult.healthCheck.status === 'passed' ? 65 : 0);

    // Map selected roles to agent IDs and team IDs
    const assignedAgentIds: AgentId[] = Array.from(
      new Set(selectedRoles.map((r) => ROLE_AGENT_MAP[r] || 'developer'))
    );
    const assignedTeamIds: DepartmentCode[] = Array.from(
      new Set(selectedRoles.map((r) => ROLE_DEPARTMENT_MAP[r] || 'engineering'))
    );

    const maskedApiKey = data.apiKey && data.apiKey.length > 6
      ? `${data.apiKey.slice(0, 4)}••••${data.apiKey.slice(-3)}`
      : undefined;

    const maskedWebhookSecret = data.webhookSecret && data.webhookSecret.length > 6
      ? `whsec_••••${data.webhookSecret.slice(-4)}`
      : undefined;

    const newApp: ManagedApp = {
      id: appId,
      name: data.name,
      slug,
      category: data.category,
      url: data.url,
      stagingUrl: data.stagingUrl || '',
      repositoryUrl: data.repositoryUrl || '',
      environment: data.environment || 'production',
      status: appStatus,
      connectionStatus,
      healthScore,
      assignedLeadAgent: data.assignedLeadAgent || 'manager',
      assignedTeamIds,
      assignedAgentIds,
      selectedRoles,
      podId: podResult.pod.id,
      apiEndpoint: data.apiEndpoint || '',
      apiKey: data.apiKey || '',
      maskedApiKey,
      webhookUrl: data.webhookUrl || '',
      webhookSecret: data.webhookSecret || '',
      maskedWebhookSecret,
      workspacePath: `/workspaces/${appId}`,
      lastHealthCheck: podResult.healthCheck,
      lastApiTest: podResult.apiTest,
      lastWebhookTest: podResult.webhookTest,
      memoryNamespace: `ns_pod_${appId.replace(/[^a-zA-Z0-9]/g, '_')}`,
      rbacRolePermissions: {
        canDeployProduction: ['manager', 'devops'],
        canModifySecrets: ['security'],
        canRunSchemaMigrations: ['engineer', 'manager']
      },
      toolAuthorizations: ['watchdog_probe', 'sandbox_runner', 'pod_orchestrator'],
      apiTokensCount: data.apiKey ? 1 : 0,
      activePipelinesCount: 0,
      uptimePercent: isConnected ? 100.0 : 0.0,
      monthlyRequests: 0,
      lastBackupAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: data.description || `تطبيق جديد مخصص له Dedicated AI Pod مع فرق: ${selectedRoles.join(', ')}`
    };

    this.apps.unshift(newApp);
    this.saveState();

    store.addLog({
      level: isConnected ? 'success' : 'warn',
      module: 'MultiAppManager',
      agentId: 'manager',
      message: isConnected
        ? `تم تسجيل التطبيق [${newApp.name}] وتفعيل الـ Dedicated AI Pod وحالة الاتصال: CONNECTED.`
        : `تم تسجيل التطبيق [${newApp.name}] لكن لم يتم التحقق الحقيقي من الخادم. الحالة الحالية: NOT CONNECTED.`
    });

    return { app: newApp, podResult };
  }

  public async retestAppConnection(appId: string): Promise<ManagedApp | null> {
    const app = this.apps.find((a) => a.id === appId);
    if (!app) return null;

    const pod = await dedicatedPodManager.retestPod(
      app.podId || `pod-${app.id}`,
      app.url,
      app.apiEndpoint,
      app.apiKey,
      app.webhookUrl,
      app.webhookSecret
    );

    if (pod) {
      const isConnected = pod.verification.allPassed;
      app.connectionStatus = isConnected ? 'connected' : 'not_connected';
      app.status = isConnected ? 'healthy' : 'not_connected';
      app.healthScore = pod.healthScore;
      app.lastHealthCheck = pod.verification.healthCheck;
      app.lastApiTest = pod.verification.apiTest;
      app.lastWebhookTest = pod.verification.webhookTest;
      app.updatedAt = new Date().toISOString();
      this.saveState();
    }

    return app;
  }

  public updateApp(id: string, updates: Partial<ManagedApp>): ManagedApp | null {
    const app = this.apps.find((a) => a.id === id);
    if (!app) return null;

    Object.assign(app, updates, { updatedAt: new Date().toISOString() });
    this.saveState();

    store.addLog({
      level: 'info',
      module: 'MultiAppManager',
      agentId: 'manager',
      message: `تم تحديث بيانات وتكوينات التطبيق: ${app.name}`
    });

    return app;
  }

  public assignTeamToApp(id: string, teamIds: DepartmentCode[], agentIds: AgentId[], leadAgent: AgentId, selectedRoles?: PodRole[]): ManagedApp | null {
    const app = this.apps.find((a) => a.id === id);
    if (!app) return null;

    app.assignedTeamIds = teamIds;
    app.assignedAgentIds = agentIds;
    app.assignedLeadAgent = leadAgent;
    if (selectedRoles) {
      app.selectedRoles = selectedRoles;
      if (app.podId) {
        dedicatedPodManager.updatePodRoles(app.podId, selectedRoles);
      }
    }
    app.updatedAt = new Date().toISOString();
    this.saveState();

    store.addLog({
      level: 'success',
      module: 'MultiAppManager',
      agentId: 'manager',
      message: `تم تحديث تعيينات الفريق والوكلاء المشرفين على تطبيق [${app.name}].`
    });

    return app;
  }

  public deleteApp(id: string): boolean {
    const index = this.apps.findIndex((a) => a.id === id);
    if (index === -1) return false;

    const removed = this.apps.splice(index, 1)[0];
    if (removed.podId) {
      dedicatedPodManager.deletePod(removed.podId);
    }
    this.saveState();

    store.addLog({
      level: 'warn',
      module: 'MultiAppManager',
      agentId: 'manager',
      message: `تمت إزالة التطبيق [${removed.name}] والـ Pod المرتبط به من لوحة الإدارة.`
    });

    return true;
  }
}

export const multiAppManager = new MultiAppManager();
