import fs from 'fs';
import path from 'path';
import {
  AppPod,
  ManagedApp,
  PodRole,
  PodRoleConfig,
  PodTestVerification,
  AgentId,
  DepartmentCode,
} from '../src/types.js';
import { getStorageFilePath, getStorageDirectory } from './storagePath.js';
import { store } from './store.js';
import { addMemoryEntry } from './agentMemory.js';

function getPodsFilePath() {
  return getStorageFilePath('app_pods.json');
}

export const ROLE_AGENT_MAP: Record<PodRole, AgentId> = {
  engineering: 'developer',
  design: 'frontend',
  security: 'security',
  devops: 'devops',
  seo: 'seo',
  customer_support: 'support',
  data: 'analytics',
};

export const ROLE_DEPARTMENT_MAP: Record<PodRole, DepartmentCode> = {
  engineering: 'engineering',
  design: 'engineering',
  security: 'security_compliance',
  devops: 'devops_sre',
  seo: 'seo_content',
  customer_support: 'customer_success',
  data: 'analytics_finance',
};

export async function testAppHealthCheck(url: string): Promise<PodTestVerification> {
  const now = new Date().toISOString();
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return {
      type: 'health_check',
      status: 'failed',
      message: 'الرابط غير صالح أو غير مدعوم (يجب أن يبدأ بـ http:// أو https://)',
      testedAt: now,
    };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Vireon-AI-Pod-Probe/2.0 (+https://vireon.ai/probe)',
        'Accept': 'text/html,application/json,*/*',
      },
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    const isOk = res.status >= 200 && res.status < 400;

    return {
      type: 'health_check',
      status: isOk ? 'passed' : 'failed',
      latencyMs: latency,
      statusCode: res.status,
      message: isOk
        ? `Health check passed with HTTP ${res.status} in ${latency}ms`
        : `Health check failed with HTTP ${res.status}`,
      testedAt: now,
    };
  } catch (err: any) {
    const latency = Date.now() - start;
    return {
      type: 'health_check',
      status: 'failed',
      latencyMs: latency,
      message: `فشل الاتصال: ${err?.message || 'Connection refused or timeout'}`,
      testedAt: now,
    };
  }
}

export async function testAppApiEndpoint(
  endpoint: string,
  apiKey?: string,
  authHeader = 'Bearer'
): Promise<PodTestVerification> {
  const now = new Date().toISOString();
  if (!endpoint) {
    return {
      type: 'api_test',
      status: 'skipped',
      message: 'لم يتم توفير مسار API مخصص (تجاوز الفحص)',
      testedAt: now,
    };
  }

  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    return {
      type: 'api_test',
      status: 'failed',
      message: 'مسار API غير صالح (يجب أن يبدأ بـ http:// أو https://)',
      testedAt: now,
    };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'User-Agent': 'Vireon-AI-Pod-API-Tester/2.0',
      'Accept': 'application/json',
    };

    if (apiKey) {
      if (authHeader === 'Bearer') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (authHeader === 'X-API-Key') {
        headers['X-API-Key'] = apiKey;
      } else {
        headers['Authorization'] = `${authHeader} ${apiKey}`;
      }
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    const isOk = res.status >= 200 && res.status < 400;

    return {
      type: 'api_test',
      status: isOk ? 'passed' : 'failed',
      latencyMs: latency,
      statusCode: res.status,
      message: isOk
        ? `API test successful with status ${res.status} in ${latency}ms`
        : `API returned error status ${res.status}`,
      testedAt: now,
    };
  } catch (err: any) {
    const latency = Date.now() - start;
    return {
      type: 'api_test',
      status: 'failed',
      latencyMs: latency,
      message: `فشل فحص الـ API: ${err?.message || 'Network unreachable'}`,
      testedAt: now,
    };
  }
}

export async function testAppWebhookEndpoint(
  webhookUrl: string,
  secret?: string
): Promise<PodTestVerification> {
  const now = new Date().toISOString();
  if (!webhookUrl) {
    return {
      type: 'webhook_test',
      status: 'skipped',
      message: 'لم يتم توفير مسار Webhook مخصص (تجاوز الفحص)',
      testedAt: now,
    };
  }

  if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
    return {
      type: 'webhook_test',
      status: 'failed',
      message: 'رابط Webhook غير صالح (يجب أن يبدأ بـ http:// أو https://)',
      testedAt: now,
    };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const testPayload = JSON.stringify({
      event: 'vireon.pod.handshake',
      timestamp: now,
      probeId: `probe_${Date.now()}`,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Vireon-Webhook-Validator/2.0',
    };
    if (secret) {
      headers['X-Vireon-Signature'] = `v1_mock_${secret.slice(0, 6)}`;
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: testPayload,
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    const isOk = res.status >= 200 && res.status < 400;

    return {
      type: 'webhook_test',
      status: isOk ? 'passed' : 'failed',
      latencyMs: latency,
      statusCode: res.status,
      message: isOk
        ? `Webhook handshake delivered successfully (${res.status}) in ${latency}ms`
        : `Webhook target returned HTTP status ${res.status}`,
      testedAt: now,
    };
  } catch (err: any) {
    const latency = Date.now() - start;
    return {
      type: 'webhook_test',
      status: 'failed',
      latencyMs: latency,
      message: `فشل إرسال Webhook Handshake: ${err?.message || 'Target host unreachable'}`,
      testedAt: now,
    };
  }
}

class DedicatedPodManager {
  private pods: AppPod[] = [];

  constructor() {
    this.loadPods();
  }

  private loadPods() {
    const filePath = getPodsFilePath();
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        this.pods = JSON.parse(raw);
      }
      if (!this.pods || this.pods.length === 0) {
        this.pods = this.getInitialDefaultPods();
        this.savePods();
      }
    } catch (err) {
      console.error('Error loading app pods:', err);
      this.pods = this.getInitialDefaultPods();
    }
  }

  private getInitialDefaultPods(): AppPod[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'pod-app-01',
        appId: 'app-01',
        appName: 'منصة فايريون الرئيسية (Vireon Command Center)',
        workspaceId: 'ws-app-01-core',
        workspacePath: '/workspaces/app-01',
        connectionStatus: 'connected',
        healthScore: 99.8,
        roles: (['engineering', 'design', 'security', 'devops', 'seo', 'customer_support', 'data'] as PodRole[]).map((r) => ({
          role: r,
          enabled: true,
          assignedAgent: ROLE_AGENT_MAP[r] || 'developer',
          status: 'active',
          activeTasksCount: r === 'engineering' ? 2 : 1,
          lastActionAt: now,
        })),
        selectedRoleKeys: ['engineering', 'design', 'security', 'devops', 'seo', 'customer_support', 'data'],
        verification: {
          healthCheck: {
            type: 'health_check',
            status: 'passed',
            latencyMs: 18,
            statusCode: 200,
            message: 'Health check passed with HTTP 200 (Core Service Active)',
            testedAt: now,
          },
          apiTest: {
            type: 'api_test',
            status: 'passed',
            latencyMs: 24,
            statusCode: 200,
            message: 'API test successful with status 200 (Bearer Token Verified)',
            testedAt: now,
          },
          webhookTest: {
            type: 'webhook_test',
            status: 'passed',
            latencyMs: 31,
            statusCode: 200,
            message: 'Webhook handshake delivered successfully (200)',
            testedAt: now,
          },
          lastVerifiedAt: now,
          allPassed: true,
        },
        apiEndpoint: 'https://vireon.ai/api/v1/health',
        apiKeyMasked: 'vr_l••••99a',
        webhookUrl: 'https://vireon.ai/api/webhooks/pod',
        webhookSecretMasked: 'whsec_••••4f8a',
        orchestratorLinked: true,
        taskQueueLinked: true,
        isolatedMemoryNamespace: 'ns_vireon_core',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pod-app-02',
        appId: 'app-02',
        appName: 'متجر فايريون الرقمي (Vireon Digital Storefront)',
        workspaceId: 'ws-app-02-store',
        workspacePath: '/workspaces/app-02',
        connectionStatus: 'connected',
        healthScore: 99.4,
        roles: (['engineering', 'design', 'seo', 'customer_support', 'data'] as PodRole[]).map((r) => ({
          role: r,
          enabled: true,
          assignedAgent: ROLE_AGENT_MAP[r] || 'developer',
          status: 'active',
          activeTasksCount: 1,
          lastActionAt: now,
        })),
        selectedRoleKeys: ['engineering', 'design', 'seo', 'customer_support', 'data'],
        verification: {
          healthCheck: {
            type: 'health_check',
            status: 'passed',
            latencyMs: 29,
            statusCode: 200,
            message: 'Health check passed with HTTP 200 in 29ms',
            testedAt: now,
          },
          apiTest: {
            type: 'api_test',
            status: 'passed',
            latencyMs: 35,
            statusCode: 200,
            message: 'Whop & Storefront API probe passed',
            testedAt: now,
          },
          webhookTest: {
            type: 'webhook_test',
            status: 'passed',
            latencyMs: 42,
            statusCode: 200,
            message: 'Webhook handshake delivered successfully (200)',
            testedAt: now,
          },
          lastVerifiedAt: now,
          allPassed: true,
        },
        apiEndpoint: 'https://store.vireon.ai/api/health',
        apiKeyMasked: 'sk_w••••11c',
        webhookUrl: 'https://store.vireon.ai/api/webhooks/whop',
        webhookSecretMasked: 'whsec_••••882b',
        orchestratorLinked: true,
        taskQueueLinked: true,
        isolatedMemoryNamespace: 'ns_vireon_store',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pod-app-03',
        appId: 'app-03',
        appName: 'تطبيق فايريون للهواتف الذكية (Vireon Mobile Companion)',
        workspaceId: 'ws-app-03-mobile',
        workspacePath: '/workspaces/app-03',
        connectionStatus: 'connected',
        healthScore: 99.6,
        roles: (['engineering', 'design', 'security', 'devops'] as PodRole[]).map((r) => ({
          role: r,
          enabled: true,
          assignedAgent: ROLE_AGENT_MAP[r] || 'developer',
          status: 'active',
          activeTasksCount: 1,
          lastActionAt: now,
        })),
        selectedRoleKeys: ['engineering', 'design', 'security', 'devops'],
        verification: {
          healthCheck: {
            type: 'health_check',
            status: 'passed',
            latencyMs: 21,
            statusCode: 200,
            message: 'PWA Health check passed with HTTP 200',
            testedAt: now,
          },
          apiTest: {
            type: 'api_test',
            status: 'skipped',
            message: 'PWA Client Direct',
            testedAt: now,
          },
          webhookTest: {
            type: 'webhook_test',
            status: 'skipped',
            message: 'Push Service Worker Endpoint',
            testedAt: now,
          },
          lastVerifiedAt: now,
          allPassed: true,
        },
        orchestratorLinked: true,
        taskQueueLinked: true,
        isolatedMemoryNamespace: 'ns_vireon_mobile',
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private savePods() {
    const filePath = getPodsFilePath();
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.pods, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving app pods:', err);
    }
  }

  public getPods(): AppPod[] {
    return [...this.pods];
  }

  public getPodByAppId(appId: string): AppPod | undefined {
    return this.pods.find((p) => p.appId === appId);
  }

  public getPodById(id: string): AppPod | undefined {
    return this.pods.find((p) => p.id === id);
  }

  public async provisionPodForApp(params: {
    appId: string;
    appName: string;
    url: string;
    apiEndpoint?: string;
    apiKey?: string;
    webhookUrl?: string;
    webhookSecret?: string;
    selectedRoles: PodRole[];
  }): Promise<{ pod: AppPod; allPassed: boolean; healthCheck: PodTestVerification; apiTest: PodTestVerification; webhookTest: PodTestVerification }> {
    const {
      appId,
      appName,
      url,
      apiEndpoint,
      apiKey,
      webhookUrl,
      webhookSecret,
      selectedRoles = ['engineering', 'security', 'devops'],
    } = params;

    const podId = `pod-${appId.replace(/^app-/, '')}-${Date.now().toString(36).slice(-4)}`;
    const workspaceId = `ws-${appId}-${Date.now().toString(36)}`;
    const workspacePath = `/workspaces/${appId}`;
    const isolatedMemoryNamespace = `ns_pod_${appId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 1. Run Real Health Check
    const healthCheck = await testAppHealthCheck(url);

    // 2. Run Real API Test if provided
    const apiTest = await testAppApiEndpoint(apiEndpoint || '', apiKey);

    // 3. Run Real Webhook Test if provided
    const webhookTest = await testAppWebhookEndpoint(webhookUrl || '', webhookSecret);

    // Evaluate overall connectivity
    const healthPassed = healthCheck.status === 'passed';
    const apiPassed = apiTest.status === 'passed' || apiTest.status === 'skipped';
    const webhookPassed = webhookTest.status === 'passed' || webhookTest.status === 'skipped';
    const allPassed = healthPassed && apiPassed && webhookPassed;

    const connectionStatus: 'connected' | 'not_connected' = allPassed ? 'connected' : 'not_connected';
    const healthScore = allPassed ? 100 : healthPassed ? 65 : 0;

    const roleConfigs: PodRoleConfig[] = selectedRoles.map((r) => ({
      role: r,
      enabled: true,
      assignedAgent: ROLE_AGENT_MAP[r] || 'developer',
      status: allPassed ? 'active' : 'standby',
      activeTasksCount: 0,
      lastActionAt: new Date().toISOString(),
    }));

    const maskedApiKey = apiKey && apiKey.length > 6 ? `${apiKey.slice(0, 4)}••••${apiKey.slice(-3)}` : undefined;
    const maskedWebhookSecret = webhookSecret && webhookSecret.length > 6 ? `whsec_••••${webhookSecret.slice(-4)}` : undefined;

    const newPod: AppPod = {
      id: podId,
      appId,
      appName,
      workspaceId,
      workspacePath,
      connectionStatus,
      healthScore,
      roles: roleConfigs,
      selectedRoleKeys: selectedRoles,
      verification: {
        healthCheck,
        apiTest,
        webhookTest,
        lastVerifiedAt: new Date().toISOString(),
        allPassed,
      },
      apiEndpoint: apiEndpoint || undefined,
      apiKeyMasked: maskedApiKey,
      webhookUrl: webhookUrl || undefined,
      webhookSecretMasked: maskedWebhookSecret,
      orchestratorLinked: allPassed,
      taskQueueLinked: allPassed,
      isolatedMemoryNamespace,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Replace if exists for this app, otherwise insert
    const existingIndex = this.pods.findIndex((p) => p.appId === appId);
    if (existingIndex >= 0) {
      this.pods[existingIndex] = newPod;
    } else {
      this.pods.unshift(newPod);
    }
    this.savePods();

    // Log to store audit and memory
    store.addLog({
      agentId: 'manager',
      level: allPassed ? 'success' : 'warn',
      module: 'DedicatedAIPodManager',
      message: allPassed
        ? `تم إنشاء Dedicated AI Pod بنجاح للتطبيق [${appName}] وربطه بالـ Orchestrator و Task Queue.`
        : `فشل التحقق الحقيقي من اتصال التطبيق [${appName}]. حالة البود: NOT CONNECTED (Health: ${healthCheck.status}, API: ${apiTest.status}, Webhook: ${webhookTest.status}).`,
    });

    try {
      addMemoryEntry({
        authorAgent: 'manager',
        type: 'system_architecture',
        title: `Dedicated AI Pod ${allPassed ? 'Connected' : 'Unverified'}: ${appName}`,
        content: `تم تشغيل Dedicated AI Pod (${podId}) للتطبيق "${appName}". الفرق المعينة: ${selectedRoles.join(', ')}. حالة الاتصال الحقيقي: ${connectionStatus.toUpperCase()}. فحص الصحة: ${healthCheck.message}`,
        tags: ['dedicated_pod', appId, connectionStatus, ...selectedRoles],
        importance: allPassed ? 'high' : 'normal',
      });
    } catch {}

    return {
      pod: newPod,
      allPassed,
      healthCheck,
      apiTest,
      webhookTest,
    };
  }

  public async retestPod(podId: string, url: string, apiEndpoint?: string, apiKey?: string, webhookUrl?: string, webhookSecret?: string): Promise<AppPod | null> {
    const pod = this.pods.find((p) => p.id === podId);
    if (!pod) return null;

    const healthCheck = await testAppHealthCheck(url);
    const apiTest = await testAppApiEndpoint(apiEndpoint || pod.apiEndpoint || '', apiKey);
    const webhookTest = await testAppWebhookEndpoint(webhookUrl || pod.webhookUrl || '', webhookSecret);

    const healthPassed = healthCheck.status === 'passed';
    const apiPassed = apiTest.status === 'passed' || apiTest.status === 'skipped';
    const webhookPassed = webhookTest.status === 'passed' || webhookTest.status === 'skipped';
    const allPassed = healthPassed && apiPassed && webhookPassed;

    pod.connectionStatus = allPassed ? 'connected' : 'not_connected';
    pod.healthScore = allPassed ? 100 : healthPassed ? 65 : 0;
    pod.orchestratorLinked = allPassed;
    pod.taskQueueLinked = allPassed;
    pod.verification = {
      healthCheck,
      apiTest,
      webhookTest,
      lastVerifiedAt: new Date().toISOString(),
      allPassed,
    };
    pod.updatedAt = new Date().toISOString();

    this.savePods();

    store.addLog({
      agentId: 'manager',
      level: allPassed ? 'success' : 'warn',
      module: 'DedicatedAIPodManager',
      message: `إعادة فحص Dedicated AI Pod للتطبيق [${pod.appName}]: النتيجة = ${pod.connectionStatus.toUpperCase()}`,
    });

    return pod;
  }

  public updatePodRoles(podId: string, selectedRoles: PodRole[]): AppPod | null {
    const pod = this.pods.find((p) => p.id === podId);
    if (!pod) return null;

    pod.selectedRoleKeys = selectedRoles;
    pod.roles = selectedRoles.map((r) => ({
      role: r,
      enabled: true,
      assignedAgent: ROLE_AGENT_MAP[r] || 'developer',
      status: pod.connectionStatus === 'connected' ? 'active' : 'standby',
      activeTasksCount: 0,
      lastActionAt: new Date().toISOString(),
    }));
    pod.updatedAt = new Date().toISOString();

    this.savePods();
    return pod;
  }

  public deletePod(podId: string): boolean {
    const idx = this.pods.findIndex((p) => p.id === podId);
    if (idx === -1) return false;
    this.pods.splice(idx, 1);
    this.savePods();
    return true;
  }
}

export const dedicatedPodManager = new DedicatedPodManager();
