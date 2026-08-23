import { GitHubPullRequestInfo, GitHubRepoInfo } from '../src/types.js';
import { store } from './store.js';

interface GitHubApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN?.trim();
  const owner = process.env.GITHUB_OWNER?.trim() || 'vireon-org';
  const repo = process.env.GITHUB_REPO?.trim() || 'vireon-command-center';
  return { token, owner, repo, isConfigured: !!token };
}

export async function checkGitHubConnection(): Promise<{
  connected: boolean;
  status: 'connected' | 'configured_unverified' | 'missing_keys' | 'failing';
  message: string;
  latencyMs: number;
  user?: { login: string; name: string; avatarUrl: string };
  repo?: GitHubRepoInfo;
}> {
  const { token, owner, repo, isConfigured } = getGitHubConfig();
  const start = Date.now();

  if (!isConfigured) {
    return {
      connected: false,
      status: 'missing_keys',
      message: 'GITHUB_TOKEN غير معرّف في البيئة. يلزم إضافة Personal Access Token بصلاحيات (repo, workflow).',
      latencyMs: 8,
    };
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        connected: false,
        status: 'failing',
        message: `استجابة GitHub غير مصرح بها (${res.status} ${res.statusText}). يرجى فحص صلاحيات الرمز المميز.`,
        latencyMs,
      };
    }

    const userData = await res.json();

    // Probe repo
    let repoInfo: GitHubRepoInfo | undefined;
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Vireon-Autonomous-OS',
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (repoRes.ok) {
        const r = await repoRes.json();
        repoInfo = {
          owner: r.owner?.login || owner,
          repo: r.name || repo,
          defaultBranch: r.default_branch || 'main',
          stars: r.stargazers_count || 0,
          openIssues: r.open_issues_count || 0,
        };
      }
    } catch {
      // Non-fatal if repo is not found yet
    }

    return {
      connected: true,
      status: 'connected',
      message: `تم التحقق من حساب GitHub: @${userData.login} (${userData.name || 'Owner'})`,
      latencyMs,
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
      },
      repo: repoInfo,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'failing',
      message: `خطأ في الاتصال بواجهة GitHub: ${err.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

export async function listGitHubBranches(): Promise<GitHubApiResult<string[]>> {
  const { token, owner, repo, isConfigured } = getGitHubConfig();
  if (!isConfigured) {
    return { success: false, error: 'GITHUB_TOKEN is missing' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      return { success: false, error: `GitHub API error: ${res.statusText}`, statusCode: res.status };
    }

    const branches = await res.json();
    return { success: true, data: branches.map((b: any) => b.name) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createGitHubBranch(newBranchName: string, baseBranch: string = 'main'): Promise<GitHubApiResult> {
  const { token, owner, repo, isConfigured } = getGitHubConfig();
  if (!isConfigured) {
    return { success: false, error: 'GITHUB_TOKEN is missing' };
  }

  try {
    // 1. Get SHA of base branch
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!refRes.ok) {
      return { success: false, error: `Could not fetch base branch ${baseBranch}: ${refRes.statusText}` };
    }

    const refData = await refRes.json();
    const sha = refData.object.sha;

    // 2. Create new ref
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${newBranchName}`,
        sha,
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      return { success: false, error: errJson.message || `Failed to create branch: ${createRes.statusText}` };
    }

    const created = await createRes.json();
    store.addLog({
      agentId: 'developer',
      level: 'success',
      module: 'GitHub Engine',
      message: `Created GitHub branch "${newBranchName}" from ${baseBranch} [SHA: ${sha.slice(0, 7)}]`,
    });

    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function commitFileToGitHub(
  filePath: string,
  content: string,
  commitMessage: string,
  branch: string = 'main'
): Promise<GitHubApiResult> {
  const { token, owner, repo, isConfigured } = getGitHubConfig();
  if (!isConfigured) {
    return { success: false, error: 'GITHUB_TOKEN is missing' };
  }

  try {
    // 1. Check if file already exists to get SHA
    let existingSha: string | undefined;
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      existingSha = existing.sha;
    }

    // 2. Put file contents (base64 encoded)
    const base64Content = Buffer.from(content).toString('base64');
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch,
        sha: existingSha,
      }),
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      return { success: false, error: errJson.message || `Failed to commit file: ${putRes.statusText}` };
    }

    const result = await putRes.json();
    store.addLog({
      agentId: 'developer',
      level: 'success',
      module: 'GitHub Engine',
      message: `Committed file "${filePath}" to branch "${branch}": ${commitMessage}`,
    });

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createGitHubPullRequest(
  title: string,
  body: string,
  headBranch: string,
  baseBranch: string = 'main'
): Promise<GitHubApiResult<GitHubPullRequestInfo>> {
  const { token, owner, repo, isConfigured } = getGitHubConfig();
  if (!isConfigured) {
    return { success: false, error: 'GITHUB_TOKEN is missing' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vireon-Autonomous-OS',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head: headBranch,
        base: baseBranch,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.message || `Failed to create PR: ${res.statusText}` };
    }

    const pr = await res.json();
    const prInfo: GitHubPullRequestInfo = {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      headBranch: pr.head?.ref || headBranch,
      baseBranch: pr.base?.ref || baseBranch,
      author: pr.user?.login || 'ai-developer',
      url: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    };

    store.addLog({
      agentId: 'devops',
      level: 'success',
      module: 'GitHub PR Engine',
      message: `Opened GitHub PR #${pr.number}: "${title}" (${headBranch} -> ${baseBranch})`,
    });

    return { success: true, data: prInfo };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
