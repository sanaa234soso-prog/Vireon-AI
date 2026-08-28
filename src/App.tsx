/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation.js';
import MobileBottomNav from './components/MobileBottomNav.js';
import InstallPwaModal from './components/InstallPwaModal.js';
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
import AIWorkforceOrchestratorView from './components/AIWorkforceOrchestratorView.js';
import SelfHealingDashboard from './components/SelfHealingDashboard.js';
import AILearningKnowledgeHub from './components/AILearningKnowledgeHub.js';
import MultiAppWorkspace from './components/MultiAppWorkspace.js';
import ObservabilityAndAuditHub from './components/ObservabilityAndAuditHub.js';
import { OpenSourceAISandbox } from './components/OpenSourceAISandbox.js';
import { OwnerCommandCenter } from './components/OwnerCommandCenter.js';
import { UserPortal } from './components/UserPortal.js';
import FileSyncDashboard from './components/FileSyncDashboard.js';
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
  UserAccount,
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
} from './data/defaultData.js';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'owner_command';
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(true);
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
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

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

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState({}, '', url.toString());
  };

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

  const handleApprovalDecision = async (id: string, decision: 'approved' | 'rejected', notes?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-email': owner.email,
          'x-owner-role': 'super_admin',
        },
        body: JSON.stringify({ decision, notes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchFullState();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to resolve approval' };
      }
    } catch (err: any) {
      console.error('Error deciding approval:', err);
      return { success: false, error: err.message || 'Network error' };
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
        setActiveTab={handleTabChange}
        overview={overview}
        onSwitchEnv={handleSwitchEnvironment}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        currentUser={currentUser}
        isOwner={isOwner}
      />

      {/* Main Command Room Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
            <p className="text-xs font-mono text-zinc-400">
              Synchronizing with Vireon 24/7 Multi-Agent Orchestrator...
            </p>
          </div>
        ) : (
          <div>
            {/* 1. Private Owner Executive Page with Direct AI Command Box & Secrets */}
            {activeTab === 'owner_command' && (
              <OwnerCommandCenter
                ownerEmail={owner.email}
                onRefreshData={fetchFullState}
              />
            )}

            {/* 2. Isolated Multi-Tenant User Portal with Login/Signup & My Websites */}
            {activeTab === 'user_portal' && (
              <UserPortal
                currentUser={currentUser}
                onLoginSuccess={(user, token) => {
                  setCurrentUser(user);
                  setAuthToken(token);
                  setIsOwner(user.role === 'owner');
                  localStorage.setItem('vireon_token', token);
                }}
                onLogout={() => {
                  setCurrentUser(null);
                  setAuthToken('');
                  setIsOwner(false);
                  localStorage.removeItem('vireon_token');
                }}
              />
            )}

            {activeTab === 'command' && (
              <CommandTerminal
                agents={agents}
                onCommandExecuted={fetchFullState}
                recentTasks={tasks}
              />
            )}

            {activeTab === 'workforce' && (
              <AIWorkforceOrchestratorView
                agents={agents}
              />
            )}

            {activeTab === 'selfhealing' && (
              <SelfHealingDashboard />
            )}

            {activeTab === 'opensourceai' && (
              <OpenSourceAISandbox />
            )}

            {activeTab === 'learning' && (
              <AILearningKnowledgeHub />
            )}

            {activeTab === 'multiapp' && (
              <MultiAppWorkspace />
            )}

            {activeTab === 'observability' && (
              <ObservabilityAndAuditHub />
            )}

            {activeTab === 'deploy' && (
              <LiveDeploymentHub
                onRefreshAll={fetchFullState}
              />
            )}

            {activeTab === 'filesync' && (
              <FileSyncDashboard />
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

      {/* Native App Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Install PWA Modal */}
      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
