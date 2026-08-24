import { executeApprovedWorkflow } from './orchestrator.js';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { store } from './server/store.js';
import { processOwnerCommand } from './server/orchestrator.js';
import { startWatchdog, runDeepWatchdogScan } from './server/watchdog.js';
import { testIntegrationConnection, processWhopWebhookEvent } from './server/integrations.js';
import {
  getLiveSiteConfig,
  getDeploymentHistory,
  updateLiveSiteConfig,
  deployLiveHotPatch,
  rollbackDeployment,
} from './server/deploymentEngine.js';
import {
  checkGitHubConnection,
  listGitHubBranches,
  createGitHubBranch,
  commitFileToGitHub,
  createGitHubPullRequest,
} from './server/github.js';
import {
  checkVercelConnection,
  triggerVercelRollback,
  promoteVercelPreviewToProduction,
} from './server/vercel.js';
import {
  getWorkerJobs,
  startBackgroundWorkers,
  triggerJobManually,
} from './server/queue.js';
import {
  getSharedMemory,
  addMemoryEntry,
  getAgentMessages,
  sendAgentMessage,
} from './server/agentMemory.js';
import {
  generateCeoDailyReport,
  getLatestCeoReport,
} from './server/ceo.js';
import {
  getFrontendDesignAudit,
  getDesignTokens,
  runFrontendDesignAudit,
  applyFrontendDesignHotPatch,
} from './server/frontendAgent.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/system/overview', (req, res) => {
    try {
      const overview = store.getOverview();
      const jobs = getWorkerJobs();
      overview.runningWorkersCount = jobs.filter((j) => j.status === 'running' || j.status === 'completed').length;
      overview.activeJobsCount = jobs.length;
      res.json({ success: true, data: overview });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/system/state', (req, res) => {
    try {
      const state = store.getState();
      res.json({ success: true, data: state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/agents', (req, res) => {
    try {
      const agents = store.getState().agents;
      res.json({ success: true, data: agents });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/manager/command', async (req, res) => {
    try {
      const { command } = req.body;
      if (!command || typeof command !== 'string' || command.trim() === '') {
        return res.status(400).json({ success: false, error: 'Command prompt is required' });
      }

      const result = await processOwnerCommand(command.trim());
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('Error processing command:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/tasks', (req, res) => {
    try {
      const tasks = store.getState().tasks;
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/tasks/:id/advance', (req, res) => {
    try {
      const { id } = req.params;
      const { stage, output, agent } = req.body;
      const task = store.getState().tasks.find((t) => t.id === id);
      if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      const nextStage = stage || 'verify';
      const history = [...task.workflowHistory];
      history.push({
        stage: nextStage,
        agent: agent || 'qa',
        timestamp: new Date().toISOString(),
        output: output || `Advanced to ${nextStage} stage by Owner intervention.`,
        status: 'pass',
      });

      const updated = store.updateTask(id, {
        stage: nextStage,
        workflowHistory: history,
        status: nextStage === 'report' ? 'completed' : 'in_progress',
      });

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/approvals', (req, res) => {
    try {
      const approvals = store.getState().approvals;
      res.json({ success: true, data: approvals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/approvals/:id/decide', (req, res) => {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      if (decision !== 'approved' && decision !== 'rejected') {
        return res.status(400).json({ success: false, error: 'Decision must be approved or rejected' });
      }

      const approval = store.resolveApproval(id, decision, notes);
      if (!approval) {
        return res.status(404).json({ success: false, error: 'Approval request not found' });
      }

      // If approved, update associated task to completed and trigger live deployment
      if (approval.taskId) {
        store.updateTask(approval.taskId, {
          status: decision === 'approved' ? 'completed' : 'failed',
          approvedBy: store.getState().owner.email,
          approvedAt: new Date().toISOString(),
          stage: decision === 'approved' ? 'report' : 'deploy',
          resultSummary: decision === 'approved' 
            ? 'Action approved by Owner and executed cleanly in production.'
            : `Action rejected by Owner: ${notes || 'Authorization withheld.'}`
        });

        if (decision === 'approved') {
          deployLiveHotPatch(
            {
              title: `Owner Approved: ${approval.taskTitle.slice(0, 40)}`,
              description: `Executed approved action "${approval.taskTitle}" in production environment.`,
              agent: approval.agent,
              targetEnvironment: 'production',
              codeDiff: approval.payload.commandOrQuery
                ? `+ /* EXECUTED OWNER APPROVED ACTION */\n+ ${approval.payload.commandOrQuery}`
                : undefined,
            },
            store.getState().owner.name
          );
        }
      }

      store.addLog({
        agentId: 'security',
        level: decision === 'approved' ? 'success' : 'warn',
        module: 'Owner Gatekeeper',
        message: `Owner ${decision.toUpperCase()} approval #${id} for task "${approval.taskTitle}"`,
      });

      res.json({ success: true, data: approval });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Live Site & Deployment Engine Routes
  app.get('/api/deploy/status', (req, res) => {
    try {
      const config = getLiveSiteConfig();
      const history = getDeploymentHistory();
      res.json({ success: true, config, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/deploy/site-config', (req, res) => {
    try {
      const updates = req.body;
      const updatedBy = store.getState().owner.name || 'Super Admin';
      const result = updateLiveSiteConfig(updates, updatedBy);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/deploy/hot-patch', (req, res) => {
    try {
      const payload = req.body;
      const deployedBy = store.getState().owner.name || 'Super Admin';
      const result = deployLiveHotPatch(payload, deployedBy);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/deploy/rollback', (req, res) => {
    try {
      const { deploymentId } = req.body;
      if (!deploymentId) {
        return res.status(400).json({ success: false, error: 'Deployment ID is required for rollback' });
      }
      const rolledBackBy = store.getState().owner.name || 'Super Admin';
      const result = rollbackDeployment(deploymentId, rolledBackBy);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GitHub Real Integration Endpoints
  app.get('/api/github/status', async (req, res) => {
    try {
      const status = await checkGitHubConnection();
      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/github/branches', async (req, res) => {
    try {
      const result = await listGitHubBranches();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/github/create-branch', async (req, res) => {
    try {
      const { branchName, baseBranch } = req.body;
      if (!branchName) {
        return res.status(400).json({ success: false, error: 'branchName is required' });
      }
      const result = await createGitHubBranch(branchName, baseBranch);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/github/commit', async (req, res) => {
    try {
      const { filePath, content, commitMessage, branch } = req.body;
      if (!filePath || !content || !commitMessage) {
        return res.status(400).json({ success: false, error: 'filePath, content, commitMessage are required' });
      }
      const result = await commitFileToGitHub(filePath, content, commitMessage, branch);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/github/create-pr', async (req, res) => {
    try {
      const { title, body, headBranch, baseBranch } = req.body;
      if (!title || !headBranch) {
        return res.status(400).json({ success: false, error: 'title and headBranch are required' });
      }
      const result = await createGitHubPullRequest(title, body || '', headBranch, baseBranch || 'main');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vercel Real Integration Endpoints
  app.get('/api/vercel/status', async (req, res) => {
    try {
      const status = await checkVercelConnection();
      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/vercel/rollback', async (req, res) => {
    try {
      const { deploymentId } = req.body;
      if (!deploymentId) {
        return res.status(400).json({ success: false, error: 'deploymentId is required' });
      }
      const result = await triggerVercelRollback(deploymentId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/vercel/promote', async (req, res) => {
    try {
      const { deploymentId } = req.body;
      if (!deploymentId) {
        return res.status(400).json({ success: false, error: 'deploymentId is required' });
      }
      const result = await promoteVercelPreviewToProduction(deploymentId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 24/7 Background Workers & Queue Endpoints
  app.get('/api/workers/jobs', (req, res) => {
    try {
      const jobs = getWorkerJobs();
      res.json({ success: true, data: jobs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/workers/trigger', async (req, res) => {
    try {
      const { jobId } = req.body;
      if (!jobId) {
        return res.status(400).json({ success: false, error: 'jobId is required' });
      }
      const result = await triggerJobManually(jobId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Shared Agent Memory & Blackboard Endpoints
  app.get('/api/memory/entries', (req, res) => {
    try {
      const { tag, type } = req.query;
      const entries = getSharedMemory(tag as string, type as string);
      res.json({ success: true, data: entries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/memory/add', (req, res) => {
    try {
      const entry = req.body;
      const created = addMemoryEntry(entry);
      res.json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/memory/messages', (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const messages = getAgentMessages(limit);
      res.json({ success: true, data: messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/memory/send-message', (req, res) => {
    try {
      const { fromAgent, toAgent, message, relatedTaskId } = req.body;
      if (!fromAgent || !toAgent || !message) {
        return res.status(400).json({ success: false, error: 'fromAgent, toAgent, and message are required' });
      }
      const msg = sendAgentMessage(fromAgent, toAgent, message, relatedTaskId);
      res.json({ success: true, data: msg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI CEO Daily Briefing Endpoints
  app.get('/api/ceo/daily-report', (req, res) => {
    try {
      const report = getLatestCeoReport();
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ceo/generate-now', async (req, res) => {
    try {
      const report = await generateCeoDailyReport();
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI Frontend Designer Endpoints
  app.get('/api/frontend/audit', (req, res) => {
    try {
      const audit = getFrontendDesignAudit();
      res.json({ success: true, data: audit });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/frontend/tokens', (req, res) => {
    try {
      const tokens = getDesignTokens();
      res.json({ success: true, data: tokens });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/frontend/run-audit', async (req, res) => {
    try {
      const audit = await runFrontendDesignAudit();
      res.json({ success: true, data: audit });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/frontend/apply-patch', async (req, res) => {
    try {
      const { tokenUpdates } = req.body;
      const result = await applyFrontendDesignHotPatch(tokenUpdates || {});
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Watchdog deep scan
  app.post('/api/watchdog/scan-now', async (req, res) => {
    try {
      const result = await runDeepWatchdogScan();
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/integrations/test', async (req, res) => {
    try {
      const { provider } = req.body;
      if (!provider) {
        return res.status(400).json({ success: false, error: 'Provider is required' });
      }

      const result = await testIntegrationConnection(provider);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/webhooks/whop', (req, res) => {
    try {
      const sig = req.headers['x-whop-signature'] as string | undefined;
      const result = processWhopWebhookEvent(req.body, sig);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/system/switch-env', (req, res) => {
    try {
      const { env } = req.body;
      if (env !== 'production' && env !== 'staging') {
        return res.status(400).json({ success: false, error: 'Invalid environment' });
      }
      store.getState().activeEnvironment = env;
      store.save();

      store.addLog({
        agentId: 'devops',
        level: 'info',
        module: 'Release Controller',
        message: `Environment switched to ${env.toUpperCase()} by Owner`,
      });

      res.json({ success: true, env });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Start 24/7 Watchdog background loop & Autonomous Workers
  startWatchdog();
  startBackgroundWorkers();

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vireon AI Command Center server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
