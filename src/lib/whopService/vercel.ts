import { VercelDeploymentInfo } from '../src/types.js';
import { store } from './store.js';

export function getVercelConfig() {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim() || 'vireon-platform';
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  return { token, projectId, teamId, isConfigured: !!token };
}

export async function checkVercelConnection(): Promise<{
  connected: boolean;
  status: 'connected' | 'configured_unverified' | 'missing_keys' | 'failing';
  message: string;
  latencyMs: number;
  project?: { id: string; name: string; framework: string; updatedAt: number };
  recentDeployments?: VercelDeploymentInfo[];
}> {
  const { token, projectId, teamId, isConfigured } = getVercelConfig();
  const start = Date.now();

  if (!isConfigured) {
    return {
      connected: false,
      status: 'missing_keys',
      message: 'VERCEL_TOKEN غير معرّف في البيئة. يلزم إضافة رمز Vercel API للتحكم في Preview والـ Production والـ Rollback.',
      latencyMs: 6,
    };
  }

  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
      },
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        connected: false,
        status: 'failing',
        message: `رفض Vercel الرمز المميز أو تعذر العثور على المشروع (${res.status} ${res.statusText}).`,
        latencyMs,
      };
    }

    const projectData = await res.json();

    // Fetch recent deployments
    let recentDeployments: VercelDeploymentInfo[] = [];
    try {
      const depUrl = teamId
        ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5&teamId=${teamId}`
        : `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`;

      const depRes = await fetch(depUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Vireon-Autonomous-OS',
        },
      });

      if (depRes.ok) {
        const depData = await depRes.json();
        recentDeployments = (depData.deployments || []).map((d: any) => ({
          id: d.uid || d.id,
          name: d.name,
          url: `https://${d.url}`,
          state: d.state,
          target: d.target || (d.meta?.githubCommitRef === 'main' ? 'production' : 'preview'),
          createdAt: new Date(d.created).toISOString(),
          creator: d.creator?.username || 'Vireon CI',
          commitSha: d.meta?.githubCommitSha?.slice(0, 7),
          commitMessage: d.meta?.githubCommitMessage,
        }));
      }
    } catch {
      // Non-fatal
    }

    return {
      connected: true,
      status: 'connected',
      message: `تم التحقق من اتصال Vercel بمشروع: ${projectData.name || projectId} (${recentDeployments.length} عمليات نشر مسجلة)`,
      latencyMs,
      project: {
        id: projectData.id,
        name: projectData.name,
        framework: projectData.framework || 'vite',
        updatedAt: projectData.updatedAt,
      },
      recentDeployments,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'failing',
      message: `خطأ في الاتصال بخوادم Vercel: ${err.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

export async function triggerVercelRollback(deploymentId: string): Promise<{
  success: boolean;
  message: string;
  rollbackDeploymentId?: string;
}> {
  const { token, projectId, teamId, isConfigured } = getVercelConfig();
  if (!isConfigured) {
    return { success: false, message: 'VERCEL_TOKEN is missing' };
  }

  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}/rollback/${deploymentId}?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}/rollback/${deploymentId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error?.message || `Rollback request rejected: ${res.statusText}` };
    }

    const data = await res.json();
    store.addLog({
      agentId: 'devops',
      level: 'warn',
      module: 'Vercel Deployment SRE',
      message: `Triggered instant Vercel rollback to deployment ID ${deploymentId}`,
    });

    return {
      success: true,
      message: `Vercel rollback to ${deploymentId} executed successfully`,
      rollbackDeploymentId: data.job?.id || deploymentId,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function promoteVercelPreviewToProduction(deploymentId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const { token, projectId, teamId, isConfigured } = getVercelConfig();
  if (!isConfigured) {
    return { success: false, message: 'VERCEL_TOKEN is missing' };
  }

  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}/promote/${deploymentId}?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}/promote/${deploymentId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error?.message || `Promote request rejected: ${res.statusText}` };
    }

    store.addLog({
      agentId: 'devops',
      level: 'success',
      module: 'Vercel Release Master',
      message: `Promoted Vercel deployment ${deploymentId} to LIVE Production!`,
    });

    return {
      success: true,
      message: `Deployment ${deploymentId} promoted to Production successfully`,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
