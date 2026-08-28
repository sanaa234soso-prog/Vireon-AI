import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  getGitHubConfig,
  getGitHubRepositoryTree,
  getGitHubFileContent,
  commitFileToGitHub,
  createGitHubBranch,
} from './github.js';
import { store } from './store.js';
import {
  FileSyncItem,
  FileSyncComparison,
  FileSyncExecutionReport,
  FileSyncExecutedFile,
} from '../src/types.js';

export interface LocalFileEntry {
  path: string;
  size: number;
  content: string;
  sha: string;
  lastModified: string;
}

export type FileSyncReport = FileSyncExecutionReport;


export class FileSyncAgent {
  private ignoredDirectories = new Set([
    'node_modules',
    'dist',
    '.git',
    '.cache',
    'coverage',
    '.vscode',
    '.local',
  ]);

  private ignoredFiles = new Set([
    '.DS_Store',
    'temp_gh_server.ts',
    'server_patched.ts',
    'bun.lock',
  ]);

  /**
   * Computes Git blob SHA for matching GitHub's tree SHA
   */
  public computeGitBlobSha(content: string | Buffer): string {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    const header = `blob ${buffer.length}\0`;
    const full = Buffer.concat([Buffer.from(header, 'utf-8'), buffer]);
    return crypto.createHash('sha1').update(full).digest('hex');
  }

  /**
   * Recursively scans local AI Studio workspace files
   */
  public scanLocalFiles(dir: string = process.cwd(), baseDir: string = process.cwd()): LocalFileEntry[] {
    const entries: LocalFileEntry[] = [];
    if (!fs.existsSync(dir)) return entries;

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      if (this.ignoredDirectories.has(item.name)) continue;
      if (this.ignoredFiles.has(item.name)) continue;

      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

      if (item.isDirectory()) {
        entries.push(...this.scanLocalFiles(fullPath, baseDir));
      } else if (item.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > 3 * 1024 * 1024) continue; // Skip files > 3MB
          const content = fs.readFileSync(fullPath, 'utf-8');
          const sha = this.computeGitBlobSha(content);

          entries.push({
            path: relativePath,
            size: stats.size,
            content,
            sha,
            lastModified: stats.mtime.toISOString(),
          });
        } catch {
          // Ignore binary or inaccessible files
        }
      }
    }

    return entries;
  }

  /**
   * Generates a clean Unified Diff between two text contents
   */
  public generateUnifiedDiff(oldText: string, newText: string, filePath: string): string {
    if (oldText === newText) return '';
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

    let changes = 0;
    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines && changes < 30; i++) {
      const o = oldLines[i];
      const n = newLines[i];
      if (o !== n) {
        if (o !== undefined) diff.push(`- ${o}`);
        if (n !== undefined) diff.push(`+ ${n}`);
        changes++;
      }
    }

    if (changes >= 30) {
      diff.push('... (additional changes truncated for preview)');
    }

    return diff.join('\n');
  }

  /**
   * Compares local AI Studio workspace against GitHub repository tree
   */
  public async compareWithGitHub(branch: string = 'main'): Promise<FileSyncComparison> {
    const ghConfig = getGitHubConfig();
    const localFiles = this.scanLocalFiles();
    const ghTree = await getGitHubRepositoryTree(branch);

    const gitHubFiles = (ghTree.success && ghTree.data)
      ? ghTree.data.filter((f) => f.type === 'blob')
      : [];

    const gitHubFileMap = new Map<string, { size?: number; sha?: string }>();
    for (const gf of gitHubFiles) {
      gitHubFileMap.set(gf.path, { size: gf.size, sha: gf.sha });
    }

    const missingOnRemote: FileSyncItem[] = [];
    const modified: FileSyncItem[] = [];
    const inSync: FileSyncItem[] = [];
    const remoteOnly: FileSyncItem[] = [];

    const localPathSet = new Set<string>();

    for (const lf of localFiles) {
      localPathSet.add(lf.path);
      const ghItem = gitHubFileMap.get(lf.path);

      if (!ghItem) {
        // File does not exist on GitHub
        missingOnRemote.push({
          path: lf.path,
          size: lf.size,
          status: 'missing_remote',
          localSha: lf.sha,
          lastModified: lf.lastModified,
          diff: `+ New file (${lf.size} bytes, ${lf.content.split('\n').length} lines)`,
        });
      } else {
        // Exists on both - compare SHA / size
        const shaMatches = ghItem.sha === lf.sha;
        if (shaMatches) {
          inSync.push({
            path: lf.path,
            size: lf.size,
            status: 'in_sync',
            localSha: lf.sha,
            remoteSha: ghItem.sha,
            lastModified: lf.lastModified,
          });
        } else {
          // Content or size differs -> modified
          modified.push({
            path: lf.path,
            size: lf.size,
            status: 'modified',
            localSha: lf.sha,
            remoteSha: ghItem.sha,
            lastModified: lf.lastModified,
          });
        }
      }
    }

    // Identify remote-only files (safe: we do NOT delete them)
    for (const gf of gitHubFiles) {
      if (!localPathSet.has(gf.path)) {
        remoteOnly.push({
          path: gf.path,
          size: gf.size || 0,
          status: 'remote_only',
          remoteSha: gf.sha,
        });
      }
    }

    return {
      localTotal: localFiles.length,
      remoteTotal: gitHubFiles.length,
      missingOnRemote,
      modified,
      inSync,
      remoteOnly,
      branch,
      repo: `${ghConfig.owner}/${ghConfig.repo}`,
    };
  }

  /**
   * Fetches the Diff for a specific modified file against GitHub
   */
  public async getFileDiffWithGitHub(filePath: string, branch: string = 'main'): Promise<string> {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return 'Local file does not exist';
    const localContent = fs.readFileSync(fullPath, 'utf-8');

    const remoteRes = await getGitHubFileContent(filePath, branch);
    if (!remoteRes.success || !remoteRes.data) {
      return `+ New file on local: ${filePath} (${localContent.split('\n').length} lines)`;
    }

    return this.generateUnifiedDiff(remoteRes.data.content, localContent, filePath);
  }

  /**
   * Executes real non-destructive synchronization to GitHub via GitHub API
   */
  public async syncFilesToGitHub(options: {
    filesToSync?: string[];
    targetBranch?: string;
    commitMessage?: string;
    createBranchIfNotExists?: boolean;
  } = {}): Promise<FileSyncExecutionReport> {
    const startTime = Date.now();
    const ghConfig = getGitHubConfig();
    const targetBranch = options.targetBranch || 'main';

    const report: FileSyncExecutionReport = {
      success: false,
      branch: targetBranch,
      syncedFiles: [],
      errors: [],
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };

    if (!ghConfig.isConfigured) {
      report.errors.push('GitHub Token is missing. Configure GITHUB_TOKEN in settings.');
      report.durationMs = Date.now() - startTime;
      return report;
    }

    store.addLog({
      agentId: 'devops',
      level: 'info',
      module: 'FileSyncAgent',
      message: `Initiating real recursive file synchronization from AI Studio to GitHub (${ghConfig.owner}/${ghConfig.repo} @ ${targetBranch})...`,
    });

    try {
      // 1. Scan and compare
      const comparison = await this.compareWithGitHub(targetBranch);
      const localFiles = this.scanLocalFiles();
      const localMap = new Map<string, LocalFileEntry>();
      for (const lf of localFiles) {
        localMap.set(lf.path, lf);
      }

      // 2. Select candidates (missing on remote + modified)
      const candidatePaths = new Set<string>([
        ...comparison.missingOnRemote.map((f) => f.path),
        ...comparison.modified.map((f) => f.path),
      ]);

      const selectedPaths = options.filesToSync && options.filesToSync.length > 0
        ? options.filesToSync.filter((p) => candidatePaths.has(p) || localMap.has(p))
        : Array.from(candidatePaths);

      if (selectedPaths.length === 0) {
        report.success = true;
        report.durationMs = Date.now() - startTime;
        store.addLog({
          agentId: 'devops',
          level: 'info',
          module: 'FileSyncAgent',
          message: 'Workspace is already 100% in-sync with GitHub repository. No files needed sync.',
        });
        return report;
      }

      // If targeting a non-main branch and it might not exist
      if (targetBranch !== 'main' && options.createBranchIfNotExists) {
        await createGitHubBranch(targetBranch, 'main');
      }

      let lastCommitSha = '';
      let lastCommitUrl = '';

      for (const filePath of selectedPaths) {
        const localEntry = localMap.get(filePath);
        if (!localEntry) {
          report.errors.push(`Local file ${filePath} could not be read`);
          continue;
        }

        const isNew = comparison.missingOnRemote.some((m) => m.path === filePath);
        const action = isNew ? 'created' : 'updated';
        const msg = options.commitMessage || `[Vireon FileSync] ${action === 'created' ? 'Add' : 'Update'} ${filePath} from AI Studio`;

        try {
          const commitRes = await commitFileToGitHub(
            filePath,
            localEntry.content,
            msg,
            targetBranch
          );

          if (commitRes.success && commitRes.data) {
            const commitSha = commitRes.data.commit?.sha || commitRes.data.content?.sha || '';
            const commitUrl = `https://github.com/${ghConfig.owner}/${ghConfig.repo}/commit/${commitSha}`;

            lastCommitSha = commitSha;
            lastCommitUrl = commitUrl;

            // Verify live on remote
            const verifyCheck = await this.verifyFileOnGitHub(filePath, targetBranch);

            report.syncedFiles.push({
              path: filePath,
              action,
              size: localEntry.size,
              commitSha,
              commitUrl,
              verified: verifyCheck.exists,
              timestamp: new Date().toISOString(),
            });
          } else {
            report.errors.push(`Failed syncing ${filePath}: ${commitRes.error || 'Commit failed'}`);
          }
        } catch (err: any) {
          report.errors.push(`Exception syncing ${filePath}: ${err.message}`);
        }
      }

      report.commitSha = lastCommitSha;
      report.commitUrl = lastCommitUrl;
      report.success = report.errors.length === 0 && report.syncedFiles.length > 0;
      report.durationMs = Date.now() - startTime;

      store.addLog({
        agentId: 'devops',
        level: report.success ? 'success' : 'warn',
        module: 'FileSyncAgent',
        message: `FileSync completed: ${report.syncedFiles.length} files pushed to GitHub [Branch: ${targetBranch}, Commit: ${lastCommitSha ? lastCommitSha.slice(0, 7) : 'n/a'}].`,
      });

      return report;
    } catch (err: any) {
      report.errors.push(`Fatal sync error: ${err.message}`);
      report.durationMs = Date.now() - startTime;
      return report;
    }
  }

  /**
   * Verifies file existence and status directly from GitHub API
   */
  public async verifyFileOnGitHub(filePath: string, branch: string = 'main'): Promise<{
    exists: boolean;
    path: string;
    sha?: string;
    size?: number;
    remoteUrl?: string;
    error?: string;
  }> {
    const ghConfig = getGitHubConfig();
    const res = await getGitHubFileContent(filePath, branch);

    if (res.success && res.data) {
      return {
        exists: true,
        path: filePath,
        sha: res.data.sha,
        size: res.data.size,
        remoteUrl: `https://github.com/${ghConfig.owner}/${ghConfig.repo}/blob/${branch}/${filePath}`,
      };
    }

    return {
      exists: false,
      path: filePath,
      error: res.error || 'File not found on GitHub repository',
    };
  }
}

export const fileSyncAgent = new FileSyncAgent();
