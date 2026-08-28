import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Terminal,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  RefreshCw,
  Plus,
  Server,
  Layers,
  Cpu,
  Check,
  Zap,
  Globe,
  Users,
  ShieldCheck,
  Code2,
  Sliders,
  ExternalLink,
  ChevronRight,
  Database,
  Activity,
  AlertOctagon,
} from 'lucide-react';
import { DynamicSecretRequirement, AgentId, TaskItem, UserAccount, AgentActivityLog } from '../types';
import { AgentActivityLedger } from './AgentActivityLedger';
import { PrivateAiAdvisor } from './PrivateAiAdvisor';

interface OwnerCommandCenterProps {
  ownerEmail?: string;
  onRefreshData?: () => void;
}

export const OwnerCommandCenter: React.FC<OwnerCommandCenterProps> = ({
  ownerEmail = 'sadeksanae50@gmail.com',
  onRefreshData,
}) => {
  // Command Box State
  const [commandText, setCommandText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [commandPriority, setCommandPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    task?: TaskItem;
    message?: string;
    timestamp: string;
  } | null>(null);

  // Dynamic Credentials State
  const [requirements, setRequirements] = useState<DynamicSecretRequirement[]>([]);
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [editingSecrets, setEditingSecrets] = useState<Record<string, string>>({});
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Custom Variable Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customKeyName, setCustomKeyName] = useState('');
  const [customKeyValue, setCustomKeyValue] = useState('');
  const [customKeyLabel, setCustomKeyLabel] = useState('');
  const [customKeyDesc, setCustomKeyDesc] = useState('');
  const [customKeyCategory, setCustomKeyCategory] = useState<DynamicSecretRequirement['category']>('custom_env');

  // System & Users Overview State
  const [ownerOverview, setOwnerOverview] = useState<{
    totalUsers: number;
    totalWebsites: number;
    totalSecretsConfigured: number;
    missingCriticalSecretsCount: number;
    missingSecretsList: string[];
    ownerEmail: string;
  } | null>(null);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'advisor' | 'command' | 'activity_ledger' | 'credentials' | 'e2e_verify' | 'users' | 'emergency'>('advisor');

  // Real End-to-End Live Verification State
  const [e2eInstruction, setE2EInstruction] = useState('إصلاح فوري آلي والتحقق من النشر الحي (Autonomous Self-Healing Verification)');
  const [isExecutingE2E, setIsExecutingE2E] = useState(false);
  const [quickGhToken, setQuickGhToken] = useState('');
  const [quickGhOwner, setQuickGhOwner] = useState('');
  const [quickGhRepo, setQuickGhRepo] = useState('');
  const [isSavingQuickGh, setIsSavingQuickGh] = useState(false);
  const [quickGhFeedback, setQuickGhFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [e2eResult, setE2EResult] = useState<{
    success: boolean;
    data?: {
      instruction: string;
      github: {
        user?: string;
        repository: string;
        branch?: string;
        commitSha?: string;
        commitUrl?: string;
        prUrl?: string;
        prNumber?: number;
        latencyMs: number;
      };
      vercel: {
        projectId?: string;
        projectName?: string;
        deploymentId?: string;
        deploymentUrl?: string;
        state?: string;
        httpStatus: number;
        latencyMs: number;
      };
      executionLogs: string[];
    };
    error?: string;
    logs?: string[];
  } | null>(null);

  const handleQuickSaveGh = async () => {
    if (!quickGhToken.trim()) return;
    setIsSavingQuickGh(true);
    setQuickGhFeedback(null);
    try {
      const res = await fetch('/api/credentials/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'GITHUB_TOKEN',
          value: quickGhToken.trim(),
          label: 'GitHub Personal Access Token',
          category: 'source_control',
          isSensitive: true,
        }),
      });
      if (quickGhOwner.trim()) {
        await fetch('/api/credentials/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'GITHUB_REPO_OWNER',
            value: quickGhOwner.trim(),
            label: 'GitHub Repository Owner',
            category: 'source_control',
            isSensitive: false,
          }),
        });
      }
      if (quickGhRepo.trim()) {
        await fetch('/api/credentials/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'GITHUB_REPO_NAME',
            value: quickGhRepo.trim(),
            label: 'GitHub Repository Name',
            category: 'source_control',
            isSensitive: false,
          }),
        });
      }
      // Test the newly saved token immediately
      const testRes = await fetch('/api/credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'GITHUB_TOKEN' }),
      });
      const testData = await testRes.json();
      setQuickGhFeedback({
        success: testData.success,
        message: testData.message || (testData.success ? 'تم حفظ المفتاح والتحقق منه بنجاح 🟢' : 'تم الحفظ لكن التحقق فشل 🔴'),
      });
      fetchCredentials();
      if (testData.success) {
        // Auto re-run verification!
        runLiveE2EVerification();
      }
    } catch (err: any) {
      setQuickGhFeedback({ success: false, message: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setIsSavingQuickGh(false);
    }
  };

  const runLiveE2EVerification = async () => {
    setIsExecutingE2E(true);
    setE2EResult(null);
    try {
      const res = await fetch('/api/e2e/verify-command-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customInstruction: e2eInstruction }),
      });
      const data = await res.json();
      setE2EResult(data);
      fetchOwnerOverview();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setE2EResult({
        success: false,
        error: err.message || 'فشل الاتصال بالخادم',
      });
    } finally {
      setIsExecutingE2E(false);
    }
  };

  // Load Initial Data
  useEffect(() => {
    fetchCredentials();
    fetchOwnerOverview();
    fetchUsers();
  }, []);

  const fetchCredentials = async () => {
    setLoadingSecrets(true);
    try {
      const res = await fetch('/api/credentials/requirements');
      const data = await res.json();
      if (data.success && data.data) {
        setRequirements(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch credentials requirements:', e);
    } finally {
      setLoadingSecrets(false);
    }
  };

  const fetchOwnerOverview = async () => {
    try {
      const res = await fetch('/api/owner/overview');
      const data = await res.json();
      if (data.success && data.data) {
        setOwnerOverview(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch owner overview:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && data.data) {
        setUsersList(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandText.trim() || isExecutingCommand) return;

    setIsExecutingCommand(true);
    setCommandResult(null);

    try {
      const res = await fetch('/api/owner/dispatch-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandText.trim(),
          targetAgent: selectedAgent === 'all' ? undefined : selectedAgent,
          priority: commandPriority,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCommandResult({
          task: data.data,
          message: data.message || 'تم إرسال الأمر وتوزيعه بنجاح.',
          timestamp: new Date().toLocaleTimeString('ar-SA'),
        });
        setCommandText('');
        if (onRefreshData) onRefreshData();
      } else {
        alert(`فشل إرسال الأمر: ${data.message || 'خطأ غير متوقع'}`);
      }
    } catch (err: any) {
      alert(`خطأ في الاتصال بالخادم: ${err.message}`);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const handleSaveSecret = async (reqItem: DynamicSecretRequirement) => {
    const enteredValue = editingSecrets[reqItem.key];
    if (enteredValue === undefined || enteredValue === '') return;

    setSavingKey(reqItem.key);
    try {
      const res = await fetch('/api/credentials/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: reqItem.key,
          value: enteredValue,
          label: reqItem.label,
          category: reqItem.category,
          description: reqItem.description,
          isSensitive: reqItem.isSensitive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Clear local edit buffer
        setEditingSecrets((prev) => {
          const next = { ...prev };
          delete next[reqItem.key];
          return next;
        });
        fetchCredentials();
        fetchOwnerOverview();
      } else {
        alert(`فشل حفظ المفتاح: ${data.message}`);
      }
    } catch (e: any) {
      alert(`خطأ: ${e.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestSecret = async (key: string) => {
    setTestingKey(key);
    try {
      const res = await fetch('/api/credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [key]: { success: data.success, message: data.message },
      }));
      fetchCredentials();
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [key]: { success: false, message: e.message },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const handleAddCustomSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyName.trim() || !customKeyValue.trim()) return;

    const key = customKeyName.trim().toUpperCase();
    try {
      const res = await fetch('/api/credentials/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: customKeyValue.trim(),
          label: customKeyLabel.trim() || key,
          description: customKeyDesc.trim() || 'متغير بيئة مخصص للمالك.',
          category: customKeyCategory,
          isSensitive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setCustomKeyName('');
        setCustomKeyValue('');
        setCustomKeyLabel('');
        setCustomKeyDesc('');
        fetchCredentials();
        fetchOwnerOverview();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredRequirements = requirements.filter((r) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'missing') return !r.isConfigured;
    if (filterCategory === 'configured') return r.isConfigured;
    return r.category === filterCategory;
  });

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* 1. Executive Master Header */}
      <div className="bg-gradient-to-l from-zinc-900 via-zinc-900/90 to-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-wide">
                    غرفة القيادة العليا للمالك (Owner Executive Command)
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full">
                    صلاحيات المطور المطلقة ROOT
                  </span>
                </div>
                <p className="text-sm text-zinc-400">
                  الحساب المالك المعتمد:{' '}
                  <span className="text-emerald-300 font-mono font-medium">{ownerEmail}</span> | توجيه وإدارة الأسطول
                  الذكي، ضبط المفاتيح التلقائي، وعزل بيانات المستخدمين.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-center min-w-[110px]">
              <div className="text-xs text-zinc-400">المستخدمين</div>
              <div className="text-lg font-bold text-white">{ownerOverview?.totalUsers ?? '...'}</div>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-center min-w-[110px]">
              <div className="text-xs text-zinc-400">المواقع المسجلة</div>
              <div className="text-lg font-bold text-emerald-400">{ownerOverview?.totalWebsites ?? '...'}</div>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-center min-w-[120px]">
              <div className="text-xs text-zinc-400">المفاتيح والبيئة</div>
              <div className="text-lg font-bold text-cyan-400">
                {ownerOverview?.totalSecretsConfigured ?? '...'} / {requirements.length}
              </div>
            </div>
          </div>
        </div>

        {/* Missing Secrets Alert Banner if any */}
        {ownerOverview && ownerOverview.missingCriticalSecretsCount > 0 && (
          <div className="mt-5 p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-sm text-amber-200">
                <span className="font-bold">تنبيه تكوين النظام:</span> يوجد{' '}
                <span className="font-semibold underline">{ownerOverview.missingCriticalSecretsCount} مفاتيح أساسية</span>{' '}
                غير مدخلة (مثل: {ownerOverview.missingSecretsList.slice(0, 2).join('، ')}). يمكنك إدخالها أدناه لتفعيل
                كافة قدرات الوكلاء.
              </div>
            </div>
            <button
              onClick={() => setActiveTab('credentials')}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/40 transition-colors shrink-0"
            >
              ضبط المفاتيح الآن
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'advisor'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/50 font-bold'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          ✨ المستشار التنفيذي الخاص (Private AI Advisor)
        </button>

        <button
          onClick={() => setActiveTab('command')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'command'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          صندوق الأوامر والتوجيه المباشر (Direct Command Box)
        </button>

        <button
          onClick={() => setActiveTab('activity_ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'activity_ledger'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          سجل المهام والأدلة الموثقة (24/7 Verifiable Evidence Ledger)
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'credentials'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Key className="w-4 h-4" />
          خزنة المفاتيح والبيئة الذكية (Dynamic Secret Vault)
          {ownerOverview && ownerOverview.missingCriticalSecretsCount > 0 && (
            <span className="px-1.5 py-0.2 text-[11px] bg-amber-500 text-black font-bold rounded-full">
              {ownerOverview.missingCriticalSecretsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('e2e_verify')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'e2e_verify'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          🚀 فحص الإنتاج الحقيقي الشامل (Live E2E Verification)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          إدارة المستأجرين والمستخدمين (Multi-Tenants)
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB: PRIVATE AI ADVISOR (المستشار التنفيذي الخاص)          */}
      {/* ======================================================== */}
      {activeTab === 'advisor' && (
        <PrivateAiAdvisor
          onNavigateToLedger={() => setActiveTab('activity_ledger')}
          onNavigateToSecrets={() => setActiveTab('credentials')}
          onRefreshParentData={fetchOwnerOverview}
        />
      )}

      {/* ======================================================== */}
      {/* TAB: 24/7 VERIFIABLE ACTIVITY & EVIDENCE LEDGER          */}
      {/* ======================================================== */}
      {activeTab === 'activity_ledger' && (
        <AgentActivityLedger onRefreshParent={fetchOwnerOverview} />
      )}

      {/* ======================================================== */}
      {/* TAB: REAL END-TO-END LIVE VERIFICATION                   */}
      {/* ======================================================== */}
      {activeTab === 'e2e_verify' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  محرك الفحص الحقيقي الشامل للنظام المباشر (Genuine Real E2E Pipeline)
                </h2>
                <p className="text-xs text-zinc-400">
                  يقوم هذا المحرك بالتحقق الحي من قراءة المفاتيح من الخزنة المشفرة، والاتصال الحقيقي بـ GitHub API لعمل Commit و Pull Request، وفحص مشروع Vercel وإجراء فحص HTTP حي للموقع بدون أي محاكاة.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
              <label className="block text-sm font-semibold text-zinc-300">
                توجيه المالك للفحص الفعلي (Owner Verification Directive):
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={e2eInstruction}
                  onChange={(e) => setE2EInstruction(e.target.value)}
                  className="flex-1 w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                  placeholder="أدخل توجيه الفحص هنا..."
                />
                <button
                  onClick={runLiveE2EVerification}
                  disabled={isExecutingE2E}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                >
                  {isExecutingE2E ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الفحص المباشر...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      بدء الفحص الحقيقي الآن (Run Live E2E)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Result Proof Panel */}
            {e2eResult && (
              <div
                className={`p-6 rounded-2xl border ${
                  e2eResult.success
                    ? 'bg-emerald-950/20 border-emerald-500/50'
                    : 'bg-rose-950/20 border-rose-500/50'
                } space-y-6`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {e2eResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-400" />
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {e2eResult.success
                          ? '✅ تم التحقق الحقيقي الشامل بنجاح 100% بدون أي محاكاة'
                          : '❌ تعذر إكمال الفحص الحقيقي'}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {e2eResult.data?.instruction || e2eResult.error}
                      </p>
                    </div>
                  </div>
                </div>

                {e2eResult.success && e2eResult.data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* GitHub Real Proof Box */}
                    <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-emerald-400" />
                          إثباتات GitHub الفعلية (Live Proof)
                        </span>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                          {e2eResult.data.github.latencyMs}ms Latency
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">المستودع الفعلي:</span>
                          <span className="font-mono text-zinc-200 font-bold">{e2eResult.data.github.repository}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">المستخدم الموثق:</span>
                          <span className="font-mono text-emerald-300">@{e2eResult.data.github.user}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">الفرع المحدث:</span>
                          <span className="font-mono text-cyan-300">{e2eResult.data.github.branch}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Commit SHA الفعلي:</span>
                          <span className="font-mono text-amber-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                            {e2eResult.data.github.commitSha}
                          </span>
                        </div>
                        {e2eResult.data.github.commitUrl && (
                          <div className="pt-2">
                            <a
                              href={e2eResult.data.github.commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                            >
                              عرض التعديل الحقيقي في GitHub <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {e2eResult.data.github.prUrl && (
                          <div className="pt-1">
                            <a
                              href={e2eResult.data.github.prUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                            >
                              عرض طلب الدمج الحقيقي PR #{e2eResult.data.github.prNumber} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vercel Real Proof Box */}
                    <div className="bg-zinc-950/80 border border-blue-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          إثباتات Vercel والنشر الحي (Live Deployment)
                        </span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                          {e2eResult.data.vercel.latencyMs}ms Latency
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">معرف المشروع:</span>
                          <span className="font-mono text-zinc-200 font-bold">{e2eResult.data.vercel.projectId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">معرف النشر (Deployment ID):</span>
                          <span className="font-mono text-cyan-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                            {e2eResult.data.vercel.deploymentId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">حالة النشر:</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                            {e2eResult.data.vercel.state}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">فحص الاستجابة الحية:</span>
                          <span className="font-mono text-emerald-400 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                            HTTP {e2eResult.data.vercel.httpStatus} OK
                          </span>
                        </div>
                        {e2eResult.data.vercel.deploymentUrl && (
                          <div className="pt-2">
                            <a
                              href={e2eResult.data.vercel.deploymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                            >
                              زيارة الرابط الحي المنشور <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* GitHub 401 Unauthorized & Missing Keys Quick Resolution Helper */}
                {!e2eResult.success && (
                  <div className="bg-zinc-950/90 border border-amber-500/40 rounded-xl p-5 space-y-4 text-right">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-400" />
                          حل سريع: تحديث رمز وصول GitHub (GITHUB_TOKEN)
                        </h4>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          استجابة GitHub غير مصرح بها (401 Unauthorized) تعني أن الرمز منتهي الصلاحية (Expired)، أو تم إلغاؤه (Revoked)، أو غير صحيح. يمكنك لصق رمز Personal Access Token جديد هنا وتحديثه فوراً وإعادة الفحص بضغطة واحدة.
                        </p>
                      </div>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo,workflow,write:packages&description=Vireon-Autonomous-OS"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        توليد رمز جديد من GitHub ↗
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          رمز الوصول الشخصي الجديد (GitHub Personal Access Token):
                        </label>
                        <input
                          type="password"
                          value={quickGhToken}
                          onChange={(e) => setQuickGhToken(e.target.value)}
                          placeholder="ghp_•••••••••••••••••••• أو github_pat_••••••••"
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          مالك المستودع (Owner):
                        </label>
                        <input
                          type="text"
                          value={quickGhOwner}
                          onChange={(e) => setQuickGhOwner(e.target.value)}
                          placeholder="sanaa234soso-prog"
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          اسم المستودع (Repo):
                        </label>
                        <input
                          type="text"
                          value={quickGhRepo}
                          onChange={(e) => setQuickGhRepo(e.target.value)}
                          placeholder="Vireon-AI"
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleQuickSaveGh}
                          disabled={isSavingQuickGh || !quickGhToken.trim()}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSavingQuickGh ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              جاري الحفظ والفحص...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              حفظ الرمز وإعادة الفحص فوراً
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {quickGhFeedback && (
                      <div
                        className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                          quickGhFeedback.success
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {quickGhFeedback.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        )}
                        <span>{quickGhFeedback.message}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Execution Terminal Logs */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                      سجل التنفيذ المباشر (Live Pipeline Logs)
                    </span>
                    <span>{e2eResult.data?.executionLogs?.length || 0} أحداث موثقة</span>
                  </div>
                  <div className="p-3 bg-black/60 rounded-lg max-h-48 overflow-y-auto font-mono text-[11px] text-zinc-300 space-y-1 text-left" dir="ltr">
                    {(e2eResult.data?.executionLogs || e2eResult.logs || [e2eResult.error]).map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        <span className="text-zinc-600">[{new Date().toISOString().slice(11, 19)}]</span>{' '}
                        <span
                          className={
                            log?.includes('Error') || log?.includes('Failed')
                              ? 'text-rose-400'
                              : log?.includes('Real') || log?.includes('Success') || log?.includes('Verified')
                              ? 'text-emerald-400'
                              : 'text-zinc-300'
                          }
                        >
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: DIRECT OWNER COMMAND BOX                         */}
      {/* ======================================================== */}
      {activeTab === 'command' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  إرسال أمر هندسي مباشر للأسطول الذكي
                </h2>
                <p className="text-xs text-zinc-400">
                  بصفتك المالك، يمكنك توجيه أي مهمة هندسية، تدقيق أمني، مراجعة كود، أو نشر فوري إلى وكيل محدد أو
                  الأسطول بالكامل.
                </p>
              </div>

              {/* Agent & Priority Selectors */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-zinc-400">الوكيل المستهدف:</span>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="bg-transparent text-sm text-emerald-300 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-zinc-900 text-white">
                      🌟 بث عام لكافة الفرق (Workforce Broadcast)
                    </option>
                    <option value="manager" className="bg-zinc-900 text-white">
                      👑 مدير الأسطول التنفيذي (Fleet Orchestrator)
                    </option>
                    <option value="engineer" className="bg-zinc-900 text-white">
                      ⚙️ كبير المهندسين (Lead Engineer)
                    </option>
                    <option value="developer" className="bg-zinc-900 text-white">
                      💻 مطور الباكيند وقواعد البيانات (Backend Dev)
                    </option>
                    <option value="frontend" className="bg-zinc-900 text-white">
                      🎨 مهندس واجهات المستخدم (Frontend Architect)
                    </option>
                    <option value="security" className="bg-zinc-900 text-white">
                      🛡️ ضابط الأمان والحماية (Zero-Trust Security)
                    </option>
                    <option value="devops" className="bg-zinc-900 text-white">
                      🚀 مهندس الـ DevOps والنشر (Deploy Specialist)
                    </option>
                    <option value="qa" className="bg-zinc-900 text-white">
                      🧪 مهندس اختبارات الجودة (QA Tester)
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-zinc-400">الأولوية:</span>
                  <select
                    value={commandPriority}
                    onChange={(e) => setCommandPriority(e.target.value as any)}
                    className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-amber-400"
                  >
                    <option value="critical" className="bg-zinc-900 text-rose-400">
                      🔴 حرجة للغاية (Critical)
                    </option>
                    <option value="high" className="bg-zinc-900 text-amber-400">
                      🟡 مرتفعة (High Priority)
                    </option>
                    <option value="medium" className="bg-zinc-900 text-zinc-300">
                      🟢 عادية (Standard)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Prompt Directives Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-zinc-500 font-medium">أوامر سريعة جاهزة:</span>
              {[
                'فحص أمني شامل لجميع الخدمات وعزل أي ثغرة محتملة',
                'تحليل أداء الواجهات وسرعة الاستجابة لجميع المواقع',
                'فحص توافقية النماذج مفتوحة المصدر واستعداد الاستشفاء الذاتي',
                'إعادة التحقق من تكامل GitHub و Vercel و Whop',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setCommandText(preset)}
                  className="px-3 py-1 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs rounded-lg border border-zinc-700 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Main Command Input Box */}
            <form onSubmit={handleSendCommand} className="space-y-3">
              <div className="relative">
                <textarea
                  value={commandText}
                  onChange={(e) => setCommandText(e.target.value)}
                  placeholder="اكتب التوجيه أو الأمر المباشر للوكلاء... (مثال: قم بإنشاء ترقيعة لمعالجة بطء استجابة API وتوليد كود التحديث ومراجعته أمنياً)"
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed text-sm resize-none"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isExecutingCommand || !commandText.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                  >
                    {isExecutingCommand ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        جاري معالجة وتوزيع الأمر...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        إصدار الأمر التنفيذي
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Live Command Execution Result Box */}
            {commandResult && (
              <div className="p-5 bg-zinc-950 border border-emerald-500/40 rounded-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    {commandResult.message}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('activity_ledger')}
                      className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      عرض سجل الأدلة الموثقة (Full Ledger)
                    </button>
                    <span className="text-xs text-zinc-500">{commandResult.timestamp}</span>
                  </div>
                </div>

                {commandResult.task && (
                  <div className="space-y-4 bg-zinc-900/90 p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        معرف المهمة المنفذة: <span className="font-mono text-white font-bold">{commandResult.task.id || (commandResult.task as any).missionId}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-semibold">
                        الحالة: {commandResult.task.status || 'completed'} (Verified)
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white">
                      {commandResult.task.title || (commandResult.task as any).command}
                    </div>

                    {/* Verifiable Badges Row */}
                    {((commandResult.task as any).commitSha || (commandResult.task as any).vercelUrl || (commandResult.task as any).liveProbe) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {(commandResult.task as any).commitSha && (
                          <div className="p-2.5 bg-zinc-950 border border-amber-500/30 rounded-lg text-xs">
                            <span className="text-zinc-400 block text-[10px]">Commit SHA الفعلي:</span>
                            <span className="font-mono text-amber-300 font-bold">{(commandResult.task as any).commitSha}</span>
                            {(commandResult.task as any).commitUrl && (
                              <a
                                href={(commandResult.task as any).commitUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-[11px] text-emerald-400 hover:underline pt-0.5"
                              >
                                عرض في GitHub ↗
                              </a>
                            )}
                          </div>
                        )}

                        {(commandResult.task as any).vercelUrl && (
                          <div className="p-2.5 bg-zinc-950 border border-blue-500/30 rounded-lg text-xs">
                            <span className="text-zinc-400 block text-[10px]">نشر Vercel الحي:</span>
                            <a
                              href={(commandResult.task as any).vercelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-cyan-400 hover:underline truncate block"
                            >
                              {(commandResult.task as any).vercelUrl} ↗
                            </a>
                          </div>
                        )}

                        {(commandResult.task as any).liveProbe && (
                          <div className="p-2.5 bg-zinc-950 border border-emerald-500/30 rounded-lg text-xs">
                            <span className="text-zinc-400 block text-[10px]">فحص الاستجابة الحية:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              HTTP {(commandResult.task as any).liveProbe.httpStatus} OK ({(commandResult.task as any).liveProbe.latencyMs}ms)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Files Changed */}
                    {(commandResult.task as any).filesChanged && (commandResult.task as any).filesChanged.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-400">الملفات المعدلة فعلياً:</span>
                        <div className="flex flex-wrap gap-2">
                          {(commandResult.task as any).filesChanged.map((f: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300">
                              {f.filePath} <span className="text-emerald-400">+{f.linesAdded}</span> <span className="text-rose-400">-{f.linesRemoved}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Workflow steps */}
                    {commandResult.task.workflowHistory && commandResult.task.workflowHistory.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <div className="text-xs font-semibold text-zinc-400">خطوات المعالجة المنفذة:</div>
                        {commandResult.task.workflowHistory.map((step, idx) => (
                          <div key={idx} className="p-2.5 bg-zinc-950/80 rounded-lg text-xs flex items-start gap-2">
                            <span className="p-1 bg-emerald-950 text-emerald-400 rounded shrink-0">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                            <div className="space-y-1">
                              <div className="font-semibold text-emerald-300">
                                [{step.stage}] الوكيل: {step.agent}
                              </div>
                              <div className="text-zinc-300">{step.output}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DYNAMIC SECRETS & ENVIRONMENT VAULT               */}
      {/* ======================================================== */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" />
                  خزنة المفاتيح والبيئة والمتغيرات الذكية (Dynamic Secret Vault)
                </h2>
                <p className="text-xs text-zinc-400">
                  يكتشف النظام تلقائياً أي مفتاح أو رمز أو رابط يحتاجه Vireon AI، ويولد له حقلاً آمناً مشفراً مع إمكانية
                  الفحص الفوري.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة متغير بيئة مخصص (+ Custom Secret)
                </button>

                <button
                  onClick={fetchCredentials}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-colors"
                  title="تحديث القائمة"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSecrets ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">التصنيف:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'missing', label: '⚠️ يتطلب إدخال (مفقود)' },
                { id: 'configured', label: '✅ مضبوط ونشط' },
                { id: 'ai_engine', label: '🧠 محركات الذكاء (AI Engines)' },
                { id: 'source_control', label: '🐙 GitHub & Repos' },
                { id: 'deployment', label: '🚀 Vercel & Deploy' },
                { id: 'payments', label: '💳 Whop Payments' },
                { id: 'database', label: '🗄️ PostgreSQL DB' },
                { id: 'custom_env', label: '⚙️ متغيرات مخصصة' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterCategory(tab.id)}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                    filterCategory === tab.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Secret Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequirements.map((reqItem) => {
                const isConfigured = reqItem.isConfigured;
                const isRevealed = revealedKeys[reqItem.key];
                const isEditing = editingSecrets[reqItem.key] !== undefined;
                const currentValue = editingSecrets[reqItem.key] ?? (isConfigured ? reqItem.maskedValue : '');
                const isSaving = savingKey === reqItem.key;
                const isTesting = testingKey === reqItem.key;
                const testRes = testResults[reqItem.key];

                return (
                  <div
                    key={reqItem.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      isConfigured
                        ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-emerald-500/40'
                        : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{reqItem.label}</span>
                            {isConfigured ? (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                نشط ومؤمن
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {reqItem.isOptional ? 'اختياري' : 'مطلوب للإعداد'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-zinc-400">{reqItem.key}</span>
                        </div>

                        {reqItem.docsUrl && (
                          <a
                            href={reqItem.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
                            title="فتح توثيق المفتاح الرسمي"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed">{reqItem.description}</p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                        <span>يستخدم بواسطة:</span>
                        {reqItem.requiredBy.map((agent, i) => (
                          <span key={i} className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded font-mono text-[10px]">
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Input Field & Actions */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <div className="relative flex items-center">
                        <input
                          type={reqItem.isSensitive && !isRevealed ? 'password' : 'text'}
                          value={isEditing ? editingSecrets[reqItem.key] : isConfigured ? reqItem.maskedValue : ''}
                          onChange={(e) =>
                            setEditingSecrets((prev) => ({
                              ...prev,
                              [reqItem.key]: e.target.value,
                            }))
                          }
                          placeholder={reqItem.placeholder || 'أدخل القيمة المشفرة...'}
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                        />

                        {reqItem.isSensitive && (
                          <button
                            type="button"
                            onClick={() => toggleReveal(reqItem.key)}
                            className="absolute left-3 p-1 text-zinc-400 hover:text-white"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveSecret(reqItem)}
                            disabled={isSaving || editingSecrets[reqItem.key] === undefined}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
                          >
                            {isSaving ? 'جاري التشفير...' : 'حفظ وتأمين'}
                          </button>

                          {isConfigured && (
                            <button
                              onClick={() => handleTestSecret(reqItem.key)}
                              disabled={isTesting}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                              فحص الاتصال
                            </button>
                          )}
                        </div>

                        {/* Test Status Indicator */}
                        {testRes && (
                          <span
                            className={`text-[11px] font-medium flex items-center gap-1 ${
                              testRes.success ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {testRes.success ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {testRes.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MULTI-TENANT USERS DIRECTORY                     */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  سجل المستأجرين والمستخدمين المعزولين (Tenant Accounts)
                </h2>
                <p className="text-xs text-zinc-400">
                  لكل مستخدم بيئته المعزولة تماماً، ولا يمكن لأي مستخدم الاطلاع على بيانات مستخدم آخر. بصفتك المالك يمكنك
                  الإشراف ومراجعة الحسابات.
                </p>
              </div>

              <button
                onClick={fetchUsers}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">الشركة / المؤسسة</th>
                    <th className="py-3 px-4">الدور الصلاحيات</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">تاريخ التسجيل</th>
                    <th className="py-3 px-4">آخر دخول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{usr.name}</div>
                        <div className="font-mono text-zinc-400 text-[11px]">{usr.email}</div>
                      </td>
                      <td className="py-3 px-4">{usr.companyName || 'مستقل'}</td>
                      <td className="py-3 px-4">
                        {usr.role === 'owner' ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-semibold">
                            مالك المنصة (Super Admin)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                            مستأجر / مستخدم مستقل
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px]">
                          نشط ومعتمد
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{new Date(usr.createdAt).toLocaleDateString('ar-SA')}</td>
                      <td className="py-3 px-4 text-zinc-400">
                        {usr.lastLoginAt ? new Date(usr.lastLoginAt).toLocaleTimeString('ar-SA') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM SECRET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-5 text-right shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                تعريف متغير بيئة أو مفتاح سري جديد
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomSecret} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">اسم المتغير البرمجي (ENV Key Name):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: STRIPE_SECRET_KEY أو CUSTOM_API_URL"
                  value={customKeyName}
                  onChange={(e) => setCustomKeyName(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">العنوان الوصفي (Display Label):</label>
                <input
                  type="text"
                  placeholder="مثال: مفتاح بوابة Stripe للدفع المباشر"
                  value={customKeyLabel}
                  onChange={(e) => setCustomKeyLabel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">القيمة السرية (Secret Value):</label>
                <input
                  type="password"
                  required
                  placeholder="أدخل القيمة هنا لتشفيرها وحفظها..."
                  value={customKeyValue}
                  onChange={(e) => setCustomKeyValue(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">وصف الاستخدام والغرض:</label>
                <textarea
                  rows={2}
                  placeholder="ما الذي يحتاجه الوكلاء من هذا المتغير..."
                  value={customKeyDesc}
                  onChange={(e) => setCustomKeyDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  حفظ وتأمين المتغير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
