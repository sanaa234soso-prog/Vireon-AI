import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Server,
  Layers,
  ExternalLink,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Shield,
  Palette,
  Terminal,
  Search,
  Users,
  Database,
  KeyRound,
  Send,
  Radio,
  Check,
} from 'lucide-react';
import {
  ManagedApp,
  DepartmentCode,
  AgentId,
  AppCategory,
  PodRole,
  AppPod,
} from '../types.js';

const AVAILABLE_POD_ROLES: Array<{
  id: PodRole;
  label: string;
  nameEn: string;
  assignedAgent: AgentId;
  agentName: string;
  icon: any;
  color: string;
}> = [
  {
    id: 'engineering',
    label: 'الفريق الهندسي (Engineering)',
    nameEn: 'Core Software Development',
    assignedAgent: 'developer',
    agentName: 'AI Lead Developer',
    icon: Terminal,
    color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  },
  {
    id: 'design',
    label: 'فريق التصميم وواجهات المستخدم (Design)',
    nameEn: 'Frontend & UI Architecture',
    assignedAgent: 'frontend',
    agentName: 'AI Frontend Architect',
    icon: Palette,
    color: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
  },
  {
    id: 'security',
    label: 'فريق الحماية والامتثال (Security)',
    nameEn: 'Zero-Trust IAM & Vault',
    assignedAgent: 'security',
    agentName: 'AI Security Sentinel',
    icon: Shield,
    color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
  },
  {
    id: 'devops',
    label: 'فريق العمليات السحابية (DevOps)',
    nameEn: 'CI/CD & Cloud SRE',
    assignedAgent: 'devops',
    agentName: 'AI DevOps Engineer',
    icon: Server,
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
  },
  {
    id: 'seo',
    label: 'فريق السيو والمحتوى (SEO)',
    nameEn: 'Technical SEO & Content Growth',
    assignedAgent: 'seo',
    agentName: 'AI SEO Specialist',
    icon: Search,
    color: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
  },
  {
    id: 'customer_support',
    label: 'فريق خدمة العملاء (Customer Support)',
    nameEn: '24/7 AI Concierge',
    assignedAgent: 'support',
    agentName: 'AI Support Concierge',
    icon: Users,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  },
  {
    id: 'data',
    label: 'فريق البيانات والتحليلات (Data & Analytics)',
    nameEn: 'Metrics, Cost & Analytics',
    assignedAgent: 'analytics',
    agentName: 'AI Data & Finance',
    icon: Database,
    color: 'border-violet-500/40 text-violet-400 bg-violet-500/10',
  },
];

export default function MultiAppWorkspace() {
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [pods, setPods] = useState<AppPod[]>([]);
  const [selectedApp, setSelectedApp] = useState<ManagedApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isRetesting, setIsRetesting] = useState(false);
  const [customTaskPrompt, setCustomTaskPrompt] = useState('');
  const [isDispatchingTask, setIsDispatchingTask] = useState(false);

  // Add App Form State
  const [newAppForm, setNewAppForm] = useState<{
    name: string;
    category: AppCategory;
    url: string;
    stagingUrl: string;
    repositoryUrl: string;
    environment: 'production' | 'staging' | 'development';
    description: string;
    assignedLeadAgent: AgentId;
    selectedRoles: PodRole[];
    apiEndpoint: string;
    apiKey: string;
    webhookUrl: string;
    webhookSecret: string;
  }>({
    name: '',
    category: 'web_app',
    url: '',
    stagingUrl: '',
    repositoryUrl: '',
    environment: 'production',
    description: '',
    assignedLeadAgent: 'manager',
    selectedRoles: ['engineering', 'design', 'security', 'devops', 'seo', 'customer_support', 'data'],
    apiEndpoint: '',
    apiKey: '',
    webhookUrl: '',
    webhookSecret: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'warn' | 'error'; message: string } | null>(null);

  const fetchAppsAndPods = async () => {
    setIsLoading(true);
    try {
      const [appsRes, podsRes] = await Promise.all([
        fetch('/api/managed-apps'),
        fetch('/api/pods'),
      ]);
      const appsData = await appsRes.json();
      const podsData = await podsRes.json();

      if (appsData.success) {
        setApps(appsData.data || []);
        if (appsData.data?.length > 0 && !selectedApp) {
          setSelectedApp(appsData.data[0]);
        } else if (selectedApp) {
          const fresh = appsData.data?.find((a: ManagedApp) => a.id === selectedApp.id);
          if (fresh) setSelectedApp(fresh);
        }
      }

      if (podsData.success) {
        setPods(podsData.data || []);
      }
    } catch (err) {
      console.error('Error loading managed apps and pods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppsAndPods();
  }, []);

  const handleRoleToggle = (role: PodRole) => {
    setNewAppForm((prev) => {
      const exists = prev.selectedRoles.includes(role);
      const updated = exists
        ? prev.selectedRoles.filter((r) => r !== role)
        : [...prev.selectedRoles, role];
      return { ...prev, selectedRoles: updated };
    });
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/managed-apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        const isConnected = data.data.connectionStatus === 'connected';
        setFeedback({
          type: isConnected ? 'success' : 'warn',
          message: isConnected
            ? `تم التحقق بنجاح وتفعيل الـ Dedicated AI Pod لتطبيق "${data.data.name}". الحالة: CONNECTED.`
            : `تم حفظ بيانات التطبيق "${data.data.name}"، لكن لم يتم التحقق الحقيقي من الخادم. الحالة: NOT CONNECTED.`,
        });
        setTimeout(() => setFeedback(null), 6000);

        setNewAppForm({
          name: '',
          category: 'web_app',
          url: '',
          stagingUrl: '',
          repositoryUrl: '',
          environment: 'production',
          description: '',
          assignedLeadAgent: 'manager',
          selectedRoles: ['engineering', 'design', 'security', 'devops', 'seo', 'customer_support', 'data'],
          apiEndpoint: '',
          apiKey: '',
          webhookUrl: '',
          webhookSecret: '',
        });
        await fetchAppsAndPods();
        if (data.data) {
          setSelectedApp(data.data);
        }
      } else {
        setFeedback({
          type: 'error',
          message: `فشل تسجيل التطبيق: ${data.error || 'خطأ غير معروف'}`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `خطأ في الاتصال بالخادم: ${err?.message || ''}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetestConnection = async (id: string) => {
    setIsRetesting(true);
    try {
      const res = await fetch(`/api/managed-apps/${id}/retest`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedApp(data.data);
        const isConn = data.data.connectionStatus === 'connected';
        setFeedback({
          type: isConn ? 'success' : 'warn',
          message: isConn
            ? `نجح الفحص الحقيقي للتطبيق [${data.data.name}]: الحالة CONNECTED (صحة: ${data.data.healthScore}%).`
            : `فشل الفحص الحقيقي للتطبيق [${data.data.name}]: الحالة NOT CONNECTED (${data.data.lastHealthCheck?.message || 'غير متاح'}).`,
        });
        setTimeout(() => setFeedback(null), 5000);
        fetchAppsAndPods();
      }
    } catch (err) {
      console.error('Error retesting app connection:', err);
    } finally {
      setIsRetesting(false);
    }
  };

  const handleDeleteApp = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف التطبيق [${name}] والـ Dedicated AI Pod المرتبط به؟`)) return;
    try {
      const res = await fetch(`/api/managed-apps/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'warn',
          message: `تم حذف التطبيق [${name}] والـ Pod المعزول بنجاح.`,
        });
        setTimeout(() => setFeedback(null), 4000);
        fetchAppsAndPods();
        if (selectedApp?.id === id) {
          setSelectedApp(null);
        }
      }
    } catch (err) {
      console.error('Error deleting app:', err);
    }
  };

  const handleDispatchAppTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !customTaskPrompt.trim()) return;

    setIsDispatchingTask(true);
    try {
      const fullCmd = `[App Pod: ${selectedApp.name}] ${customTaskPrompt.trim()}`;
      const res = await fetch('/api/manager/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: fullCmd,
          appId: selectedApp.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `تم توجيه المهمة بنجاح إلى الـ Dedicated AI Pod لتطبيق [${selectedApp.name}] وربطها بالـ Task Queue.`,
        });
        setTimeout(() => setFeedback(null), 4000);
        setCustomTaskPrompt('');
        fetchAppsAndPods();
      }
    } catch (err) {
      console.error('Error dispatching app task:', err);
    } finally {
      setIsDispatchingTask(false);
    }
  };

  const activePod = selectedApp ? pods.find((p) => p.appId === selectedApp.id) : null;

  return (
    <div className="space-y-6" id="multi-app-workspace">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Dedicated AI Pod Engine
              </span>
              <span className="text-xs text-slate-400">نظام الـ Pods المستقلة لكل تطبيق مع فحص حقيقي وضمان عدم عرض CONNECTED إلا بعد التأكد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              مركز إدارة التطبيقات و Dedicated AI Pods
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              عند إضافة أي تطبيق يتم إنشاء مساحة عمل مستقلة (Workspace) و Dedicated AI Pod حقيقي مع اختيار الفرق المطلوبة (Engineering, Design, Security, DevOps, SEO, Support, Data)، وربط المهام والـ Logs والمراقبة بالتطبيق حصراً.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-cyan-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة تطبيق وإنشاء AI Pod
            </button>
            <button
              onClick={fetchAppsAndPods}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : feedback.type === 'warn'
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : feedback.type === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Apps Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => {
          const isSelected = selectedApp?.id === app.id;
          const isConnected = app.connectionStatus === 'connected';

          return (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{app.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{app.slug}</p>
                    </div>
                  </div>

                  {/* Real Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        CONNECTED
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        NOT CONNECTED
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                  {app.description || 'لا يوجد وصف للتطبيق.'}
                </p>

                {/* Selected Roles Count */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {(app.selectedRoles || []).map((r) => {
                    const roleInfo = AVAILABLE_POD_ROLES.find((pr) => pr.id === r);
                    return (
                      <span
                        key={r}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                          roleInfo?.color || 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {r}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>الصحة: {app.healthScore}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-cyan-400 transition"
                    title="زيارة الرابط"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteApp(app.id, app.name);
                    }}
                    className="hover:text-rose-400 transition"
                    title="حذف التطبيق"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected App Dedicated AI Pod Control Station */}
      {selectedApp && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">{selectedApp.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedApp.connectionStatus === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {selectedApp.connectionStatus === 'connected' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        CONNECTED & VERIFIED
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        NOT CONNECTED
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Workspace: {selectedApp.workspacePath || `/workspaces/${selectedApp.id}`} • الذاكرة: {selectedApp.memoryNamespace}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => handleRetestConnection(selectedApp.id)}
                disabled={isRetesting}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetesting ? 'animate-spin text-cyan-400' : ''}`} />
                إعادة الفحص والتحقق الحقيقي
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                تعديل الفرق والأدوار
              </button>
            </div>
          </div>

          {/* Real Verification Test Results Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Health Check */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  1. Real Health Check Probe
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedApp.lastHealthCheck?.status === 'passed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedApp.lastHealthCheck?.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {selectedApp.lastHealthCheck?.message || 'تم فحص الرابط مباشرة عبر HTTP GET.'}
              </p>
              {selectedApp.lastHealthCheck?.latencyMs !== undefined && (
                <div className="text-[11px] text-slate-400">
                  Latency: <span className="text-cyan-400 font-bold">{selectedApp.lastHealthCheck.latencyMs}ms</span>
                </div>
              )}
            </div>

            {/* 2. API Test */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  2. API Authentication Test
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedApp.lastApiTest?.status === 'passed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : selectedApp.lastApiTest?.status === 'skipped'
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedApp.lastApiTest?.status?.toUpperCase() || 'SKIPPED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {selectedApp.lastApiTest?.message || (selectedApp.apiEndpoint ? 'فحص المصادقة عبر API' : 'لم يتم توفير API')}
              </p>
              {selectedApp.maskedApiKey && (
                <p className="text-[11px] text-slate-400">
                  Key: <span className="font-mono text-slate-300">{selectedApp.maskedApiKey}</span>
                </p>
              )}
            </div>

            {/* 3. Webhook Test */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  3. Webhook Handshake Probe
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedApp.lastWebhookTest?.status === 'passed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : selectedApp.lastWebhookTest?.status === 'skipped'
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedApp.lastWebhookTest?.status?.toUpperCase() || 'SKIPPED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {selectedApp.lastWebhookTest?.message || (selectedApp.webhookUrl ? 'فحص Handshake للـ Webhook' : 'لم يتم توفير Webhook')}
              </p>
              {selectedApp.webhookUrl && (
                <p className="text-[11px] text-slate-400 font-mono line-clamp-1">
                  URL: {selectedApp.webhookUrl}
                </p>
              )}
            </div>
          </div>

          {/* Pod Roles Fleet Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              طاقم وكلاء الـ Dedicated AI Pod المعين للتطبيق:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(selectedApp.selectedRoles || []).map((r) => {
                const roleDef = AVAILABLE_POD_ROLES.find((pr) => pr.id === r);
                if (!roleDef) return null;
                const Icon = roleDef.icon;

                return (
                  <div
                    key={r}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-start gap-3"
                  >
                    <div className={`p-2 rounded-lg border ${roleDef.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">{roleDef.label.split('(')[0]}</p>
                      <p className="text-[11px] text-slate-400">{roleDef.nameEn}</p>
                      <p className="text-[10px] text-cyan-400 font-mono font-medium">
                        الوكيل: {roleDef.agentName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* App-Scoped Task Dispatcher */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              إرسال مهمة موجهة ومقيدة بهذا التطبيق فقط (Scoped Task Dispatch):
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              سيتم توجيه هذه المهمة إلى الـ Dedicated AI Pod لتطبيق [{selectedApp.name}]، وتسجيل مخرجاتها في الـ Workspace والذاكرة المعزولة الخاصة به، وربطها بالـ Task Queue. العمليات الحساسة ستتطلب موافقة المالك تلقائياً.
            </p>

            <form onSubmit={handleDispatchAppTask} className="flex gap-2">
              <input
                type="text"
                value={customTaskPrompt}
                onChange={(e) => setCustomTaskPrompt(e.target.value)}
                placeholder="مثال: قم بفحص أمان الـ API وإصلاح ثغرات CORS، ثم توليد تقرير SEO وتجهيز خطة النشر..."
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isDispatchingTask || !customTaskPrompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shrink-0"
              >
                {isDispatchingTask ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                تنفيذ المهمة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  إضافة تطبيق جديد وإنشاء Dedicated AI Pod
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  سيقوم النظام بحفظ البيانات، وإجراء فحص حقيقي للرابط وAPI والـ Webhook، وعزل الـ Workspace.
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4 text-xs">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">اسم التطبيق / الموقع:</label>
                  <input
                    type="text"
                    required
                    value={newAppForm.name}
                    onChange={(e) => setNewAppForm({ ...newAppForm, name: e.target.value })}
                    placeholder="مثال: Vireon Customer Portal أو E-Store"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">نوع التطبيق:</label>
                  <select
                    value={newAppForm.category}
                    onChange={(e) => setNewAppForm({ ...newAppForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="web_app">تطبيق ويب (Web App)</option>
                    <option value="e_commerce">متجر إلكتروني (E-Commerce)</option>
                    <option value="mobile_backend">خلفية جوال (Mobile Backend)</option>
                    <option value="custom_website">موقع مخصص (Custom Website)</option>
                    <option value="microservice_api">واجهة برمجية API</option>
                  </select>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">رابط التطبيق (Production URL - مطلوب للفحص الحقيقي):</label>
                <input
                  type="url"
                  required
                  value={newAppForm.url}
                  onChange={(e) => setNewAppForm({ ...newAppForm, url: e.target.value })}
                  placeholder="https://app.example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* API Endpoint & Key (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">مسار API (اختياري للفحص):</label>
                  <input
                    type="url"
                    value={newAppForm.apiEndpoint}
                    onChange={(e) => setNewAppForm({ ...newAppForm, apiEndpoint: e.target.value })}
                    placeholder="https://app.example.com/api/v1/health"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">مفتاح API Token (اختياري):</label>
                  <input
                    type="password"
                    value={newAppForm.apiKey}
                    onChange={(e) => setNewAppForm({ ...newAppForm, apiKey: e.target.value })}
                    placeholder="sk_live_••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Webhook Endpoint & Secret (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">رابط Webhook (اختياري للفحص):</label>
                  <input
                    type="url"
                    value={newAppForm.webhookUrl}
                    onChange={(e) => setNewAppForm({ ...newAppForm, webhookUrl: e.target.value })}
                    placeholder="https://app.example.com/api/webhooks"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Webhook Secret (اختياري):</label>
                  <input
                    type="password"
                    value={newAppForm.webhookSecret}
                    onChange={(e) => setNewAppForm({ ...newAppForm, webhookSecret: e.target.value })}
                    placeholder="whsec_••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Select AI Pod Roles */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block font-bold text-white">
                  اختر الفرق المطلوبة للـ Dedicated AI Pod:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_POD_ROLES.map((role) => {
                    const isSelected = newAppForm.selectedRoles.includes(role.id);
                    const Icon = role.icon;
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleToggle(role.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 shrink-0" />
                          <div>
                            <p className="font-semibold text-white">{role.label.split('(')[0]}</p>
                            <p className="text-[10px] text-slate-400">{role.agentName}</p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-cyan-600 border-cyan-500 text-white'
                              : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">الوصف:</label>
                <textarea
                  rows={2}
                  value={newAppForm.description}
                  onChange={(e) => setNewAppForm({ ...newAppForm, description: e.target.value })}
                  placeholder="وصف مختصر للوظيفة والهدف من التطبيق..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  حفظ وفحص وإنشاء الـ AI Pod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Team Modal */}
      {showAssignModal && selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                تعديل تكوينات الـ Pod للتطبيق [{selectedApp.name}]
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                الـ Dedicated AI Pod مرتبط مباشرة بالـ Orchestrator و Task Queue. سيتم توجيه المهام والمراقبة لهذا التطبيق مع الحفاظ على عزل الذاكرة.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono">
                <p>• الذاكرة المعزولة: {selectedApp.memoryNamespace}</p>
                <p>• المالك المعتمد: sadeksanae50@gmail.com</p>
                <p>• الرقابة الأمنية: Owner Approval Active</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
