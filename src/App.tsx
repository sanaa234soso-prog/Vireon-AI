/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation.js';
import CommandTerminal from './components/CommandTerminal.js';
import AgentFleetGrid from './components/AgentFleetGrid.js';
import TaskPipelineView from './components/TaskPipelineView.js';
import WatchdogDashboard from './components/WatchdogDashboard.js';
import ApprovalGatekeeper from './components/ApprovalGatekeeper.js';
import WhopAndMarketplace from './components/WhopAndMarketplace.js';
import SecurityAndIntegrations from './components/SecurityAndIntegrations.js';
import SystemLogsView from './components/SystemLogsView.js';
import LiveDeploymentHub from './components/LiveDeploymentHub.js';
import WorkersAndQueueView from './components/WorkersAndQueueView.js';
import FrontendDesignStudio from './components/FrontendDesignStudio.js';
import AgentMemoryBusView from './components/AgentMemoryBusView.js';
import {
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
  LiveSiteConfig,
} from './types.js';
import {
  DEFAULT_AGENTS,
  DEFAULT_APPROVALS,
  DEFAULT_INCIDENTS,
  DEFAULT_INTEGRATIONS,
  DEFAULT_LOGS,
  DEFAULT_MARKETPLACE,
  DEFAULT_OVERVIEW,
  DEFAULT_OWNER,
  DEFAULT_PAYMENTS,
  DEFAULT_TASKS,
  DEFAULT_WATCHDOG_METRICS,
} from './data/defaultData.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState('command');
  const [overview, setOverview] = useState<SystemOverview | null>(DEFAULT_OVERVIEW);
  const [owner, setOwner] = useState<OwnerProfile>(DEFAULT_OWNER);
  const [agents, setAgents] = useState<AgentProfile[]>(DEFAULT_AGENTS);
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [watchdogMetrics, setWatchdogMetrics] = useState<WatchdogMetric[]>(DEFAULT_WATCHDOG_METRICS);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(DEFAULT_INCIDENTS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(DEFAULT_APPROVALS);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(DEFAULT_INTEGRATIONS);
  const [payments, setPayments] = useState<WhopPaymentRecord[]>(DEFAULT_PAYMENTS);
  const [marketplace, setMarketplace] = useState<MarketplaceListing[]>(DEFAULT_MARKETPLACE);
  const [logs, setLogs] = useState<SystemLogEntry[]>(DEFAULT_LOGS);
  const [liveConfig, setLiveConfig] = useState<LiveSiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFullState = useCallback(async () => {
    try {
      const [stateRes, overviewRes, deployRes] = await Promise.allSettled([
        fetch('/api/system/state'),
        fetch('/api/system/overview'),
        fetch('/api/deploy/status'),
      ]);

      if (stateRes.status === 'fulfilled' && stateRes.value.ok) {
        const stateData = await stateRes.value.json();
        if (stateData.success && stateData.data) {
          const s = stateData.data;
          if (s.owner) setOwner(s.owner);
          if (s.agents && s.agents.length > 0) setAgents(s.agents);
          if (s.tasks) setTasks(s.tasks);
          if (s.watchdogMetrics && s.watchdogMetrics.length > 0) setWatchdogMetrics(s.watchdogMetrics);
          if (s.incidents) setIncidents(s.incidents);
          if (s.approvals) setApprovals(s.approvals);
          if (s.integrations && s.integrations.length > 0) setIntegrations(s.integrations);
          if (s.payments) setPayments(s.payments);
          if (s.marketplace) setMarketplace(s.marketplace);
          if (s.logs) setLogs(s.logs);
        }
      }

      if (overviewRes.status === 'fulfilled' && overviewRes.value.ok) {
        const ovData = await overviewRes.value.json();
        if (ovData.success && ovData.data) {
          setOverview(ovData.data);
        }
      }

      if (deployRes.status === 'fulfilled' && deployRes.value.ok) {
        const depData = await deployRes.value.json();
        if (depData.success && depData.config) {
          setLiveConfig(depData.config);
        }
      }
    } catch {
      // Server warming up, default state is already loaded gracefully
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFullState();
    // Poll every 6 seconds for continuous live telemetry
    const interval = setInterval(fetchFullState, 6000);
    return () => clearInterval(interval);
  }, [fetchFullState]);

  const handleSwitchEnvironment = async (env: 'production' | 'staging') => {
    try {
      const res = await fetch('/api/system/switch-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env }),
      });
      if (res.ok) {
        fetchFullState();
      }
    } catch (err) {
      console.error('Error switching environment:', err);
    }
  };

  const handleApprovalDecision = async (
  id: string,
  decision: 'approved' | 'rejected',
  notes?: string
) => {
  try {
    console.log('[OWNER] Decision:', {
      id,
      decision,
      notes,
    });

    const response = await fetch(
      `/api/approvals/${encodeURIComponent(id)}/decide`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          decision,
          notes: notes?.trim() || '',
        }),
      }
    );

    const contentType =
      response.headers.get('content-type') || '';

    let result: any = null;

    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();

      console.error('[OWNER] Server response:', text);

      throw new Error(
        `الخادم لم يرجع JSON. HTTP ${response.status}`
      );
    }

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error ||
          `فشل تنفيذ القرار. HTTP ${response.status}`
      );
    }

    // تحديث حالة الموافقة مباشرة
    setApprovals((current) =>
      current.map((approval) =>
        approval.id === id
          ? {
              ...approval,
              status: decision,
              resolvedAt:
                result.data?.resolvedAt ||
                new Date().toISOString(),
              resolvedBy:
                result.data?.resolvedBy ||
                owner.email,
              notes:
                notes?.trim() ||
                approval.notes,
            }
          : approval
      )
    );

    // مزامنة الحالة مع الخادم
    await fetchFullState();

    console.log(
      `[OWNER] ${decision.toUpperCase()} completed successfully`
    );

    return result;

  } catch (error) {
    console.error(
      '[OWNER] Approval decision failed:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير معروف.';

    window.alert(
      `فشل تنفيذ القرار:\n\n${message}`
    );

    throw error;
  }
};

  const handleDirectAgentTask = async (agentId: string, instruction: string) => {
    const fullCmd = `[Direct Task for ${agentId.toUpperCase()}]: ${instruction}`;
    try {
      await fetch('/api/manager/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: fullCmd }),
      });
      fetchFullState();
      setActiveTab('command');
    } catch (err) {
      console.error('Error dispatching direct agent task:', err);
    }
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Dynamic Live Announcement Banner (If Enabled on Live Site) */}
      {liveConfig?.bannerEnabled && (
        <div
          className={`py-2 px-4 text-xs font-semibold text-center flex items-center justify-center gap-2 border-b ${
            liveConfig.bannerType === 'promo'
              ? 'bg-amber-950/80 border-amber-800/60 text-amber-200'
              : liveConfig.bannerType === 'critical'
              ? 'bg-rose-950/80 border-rose-800/60 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-800/60 text-emerald-200'
          }`}
        >
          <span>{liveConfig.bannerText}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-mono text-zinc-300">
            {liveConfig.activeVersion} • LIVE
          </span>
        </div>
      )}

      {/* Top Header & Executive Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overview={overview}
        onSwitchEnv={handleSwitchEnvironment}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Command Room Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
            <p className="text-xs font-mono text-zinc-400">
              Synchronizing with Vireon 24/7 Multi-Agent Orchestrator...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'command' && (
              <CommandTerminal
                agents={agents}
                onCommandExecuted={fetchFullState}
                recentTasks={tasks}
              />
            )}

            {activeTab === 'deploy' && (
              <LiveDeploymentHub
                onRefreshAll={fetchFullState}
              />
            )}

            {activeTab === 'agents' && (
              <AgentFleetGrid
                agents={agents}
                onDirectTask={handleDirectAgentTask}
              />
            )}

            {activeTab === 'workers' && (
              <WorkersAndQueueView />
            )}

            {activeTab === 'frontend' && (
              <FrontendDesignStudio />
            )}

            {activeTab === 'memory' && (
              <AgentMemoryBusView />
            )}

            {activeTab === 'tasks' && (
              <TaskPipelineView
                tasks={tasks}
                onTaskUpdated={fetchFullState}
              />
            )}

            {activeTab === 'watchdog' && (
              <WatchdogDashboard
                metrics={watchdogMetrics}
                incidents={incidents}
                lastSweep={overview?.lastWatchdogSweep || new Date().toISOString()}
                onRefresh={fetchFullState}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalGatekeeper
                approvals={approvals}
                onDecide={handleApprovalDecision}
              />
            )}

            {activeTab === 'payments' && (
              <WhopAndMarketplace
                payments={payments}
                marketplace={marketplace}
                onWebhookSimulated={fetchFullState}
              />
            )}

            {activeTab === 'integrations' && (
              <SecurityAndIntegrations
                integrations={integrations}
                owner={owner}
                onRefresh={fetchFullState}
              />
            )}

            {activeTab === 'logs' && (
              <SystemLogsView
                logs={logs}
                onRefresh={fetchFullState}
              />
            )}
          </div>
        )}
      </main>

      {/* Persistent Status Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-3 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Vireon 24/7 Autonomous Team Active
            </span>
            <span>•</span>
            <span className="font-mono text-zinc-500">
              Environment: <strong className="text-zinc-300 uppercase">{overview?.activeEnvironment || 'production'}</strong>
            </span>
          </div>

          <div className="font-mono text-[11px] text-zinc-500">
            Protected by Owner Gatekeeper • Super Admin: {owner.email}
          </div>
        </div>
      </footer>
    </div>
  );
}
