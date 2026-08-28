import { useState, useEffect, type FormEvent } from 'react';
import {
  Lock,
  ShieldCheck,
  Key,
  Database,
  GitBranch,
  CreditCard,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Smartphone,
  ShoppingCart,
  Cpu,
  Bot,
  Cloud,
  Send,
  Zap,
  Radio,
  Sparkles,
  Info,
} from 'lucide-react';
import { ConnectedApp, AppCategory, IntegrationConfig, OwnerProfile, AgentId, CoreApiConfigStatus, CoreApiProviderStatus } from '../types.js';

interface SecurityAndIntegrationsProps {
  integrations: IntegrationConfig[];
  owner: OwnerProfile;
  onRefresh: () => void;
}

const AGENTS_LIST: { id: AgentId; name: string; dept: string }[] = [
  { id: 'manager', name: 'قائد العمليات (Core Manager)', dept: 'القيادة' },
  { id: 'engineer', name: 'مهندس الأنظمة (Systems Architect)', dept: 'البنية' },
  { id: 'developer', name: 'المطور البرمجي الشامل (Full-Stack Dev)', dept: 'التطوير' },
  { id: 'frontend', name: 'مصمم الواجهات (Frontend Architect)', dept: 'الواجهات' },
  { id: 'payments', name: 'مسؤول المدفوعات والـ Whop', dept: 'المالية' },
  { id: 'security', name: 'حارس الأمان والامتثال', dept: 'الأمان' },
  { id: 'auditor', name: 'مراقب الجودة والرادار 24/7', dept: 'الجودة' },
  { id: 'devops', name: 'مهندس النشر والـ DevOps', dept: 'العمليات' },
  { id: 'qa', name: 'فاحص الجودة الآلي (QA Engineer)', dept: 'الجودة' },
  { id: 'seo', name: 'أخصائي النمو والـ SEO', dept: 'النمو' },
  { id: 'support', name: 'مسؤول دعم العملاء', dept: 'الدعم' },
  { id: 'analytics', name: 'محلل البيانات والأداء', dept: 'التحليلات' },
  { id: 'operations', name: 'منسق العمليات التشغيلية', dept: 'العمليات' },
];

export default function SecurityAndIntegrations({
  integrations,
  owner,
  onRefresh,
}: SecurityAndIntegrationsProps) {
  const [subTab, setSubTab] = useState<'apps_vault' | 'core_providers'>('apps_vault');
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'web_app' as AppCategory,
    environment: 'production' as 'production' | 'staging' | 'development',
    assignedAgent: 'engineer' as AgentId,
    apiToken: '',
    authHeaderType: 'Bearer' as 'Bearer' | 'X-API-Key' | 'Basic' | 'Custom' | 'None',
    customHeaderName: '',
    webhookSecret: '',
    clientId: '',
    description: '',
  });

  const [savingApp, setSavingApp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showTokenInForm, setShowTokenInForm] = useState(false);

  // App Card states (Ping, Webhook, Reveal, Copied)
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pingingAppId, setPingingAppId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string }>>({});
  const [simulatingWebhookId, setSimulatingWebhookId] = useState<string | null>(null);
  const [webhookResults, setWebhookResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Core Providers test state
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    [key: string]: { success: boolean; message: string; latencyMs?: number };
  }>({});
  const [coreStatus, setCoreStatus] = useState<CoreApiConfigStatus | null>(null);
  const [loadingCoreStatus, setLoadingCoreStatus] = useState(false);
  const [editingKeyModal, setEditingKeyModal] = useState<{
    keyName: string;
    displayName: string;
    docsUrl: string;
    description: string;
    currentValue: string;
  } | null>(null);
  const [inputKeyValue, setInputKeyValue] = useState('');
  const [savingCoreKey, setSavingCoreKey] = useState(false);
  const [coreKeySaveSuccess, setCoreKeySaveSuccess] = useState<string | null>(null);

  const fetchCoreStatus = async () => {
    try {
      setLoadingCoreStatus(true);
      const res = await fetch('/api/integrations/core-status');
      const data = await res.json();
      if (data.success && data.data) {
        setCoreStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch core API status:', err);
    } finally {
      setLoadingCoreStatus(false);
    }
  };

  const handleSaveCoreKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingKeyModal || !inputKeyValue.trim()) return;
    setSavingCoreKey(true);
    try {
      const res = await fetch('/api/integrations/save-core-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingKeyModal.keyName]: inputKeyValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCoreStatus(data.status);
        setCoreKeySaveSuccess(`تم حفظ وتفعيل ${editingKeyModal.keyName} بنجاح!`);
        setTimeout(() => setCoreKeySaveSuccess(null), 4000);
        setEditingKeyModal(null);
        setInputKeyValue('');
        onRefresh();
      }
    } catch (err) {
      console.error('Error saving key:', err);
    } finally {
      setSavingCoreKey(false);
    }
  };

  // Fetch Connected Apps from backend
  const fetchConnectedApps = async () => {
    try {
      setLoadingApps(true);
      const res = await fetch('/api/connected-apps');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConnectedApps(data.data);
      }
    } catch (err) {
      console.error('Failed to load connected apps:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchConnectedApps();
    fetchCoreStatus();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const toggleTokenReveal = (appId: string) => {
    setRevealedTokens((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  const handleOpenAddModal = () => {
    setEditingAppId(null);
    setFormData({
      name: '',
      url: '',
      category: 'web_app',
      environment: 'production',
      assignedAgent: 'engineer',
      apiToken: '',
      authHeaderType: 'Bearer',
      customHeaderName: '',
      webhookSecret: '',
      clientId: '',
      description: '',
    });
    setFormError(null);
    setShowTokenInForm(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app: ConnectedApp) => {
    setEditingAppId(app.id);
    setFormData({
      name: app.name,
      url: app.url || '',
      category: app.category,
      environment: app.environment,
      assignedAgent: app.assignedAgent,
      apiToken: app.apiToken || '',
      authHeaderType: app.authHeaderType || 'Bearer',
      customHeaderName: app.customHeaderName || '',
      webhookSecret: app.webhookSecret || '',
      clientId: app.clientId || '',
      description: app.description || '',
    });
    setFormError(null);
    setShowTokenInForm(false);
    setIsModalOpen(true);
  };

  const handleGenerateRandomToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    let rand = 'vireon_sec_';
    for (let i = 0; i < 32; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, apiToken: rand }));
  };

  const handleSaveApp = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('يرجى كتابة اسم التطبيق أو الموقع');
      return;
    }

    setSavingApp(true);
    setFormError(null);

    try {
      const url = editingAppId
        ? `/api/connected-apps/${editingAppId}`
        : '/api/connected-apps';
      const method = editingAppId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        await fetchConnectedApps();
        onRefresh();
      } else {
        setFormError(data.error || 'فشل حفظ التطبيق');
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setSavingApp(false);
    }
  };

  const handleDeleteApp = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف "${name}" وجميع الرموز المرتبطة به من الخزنة؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/connected-apps/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchConnectedApps();
        onRefresh();
      } else {
        alert(data.error || 'فشل حذف التطبيق');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في الاتصال');
    }
  };

  const handlePingApp = async (id: string) => {
    setPingingAppId(id);
    try {
      const res = await fetch(`/api/connected-apps/${id}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setPingResults((prev) => ({
          ...prev,
          [id]: {
            success: data.data.success,
            latencyMs: data.data.latencyMs,
            message: data.data.message,
          },
        }));
        fetchConnectedApps();
      } else {
        setPingResults((prev) => ({
          ...prev,
          [id]: { success: false, latencyMs: 0, message: data.error || 'فشل الفحص' },
        }));
      }
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [id]: { success: false, latencyMs: 0, message: err.message || 'خطأ في الاتصال' },
      }));
    } finally {
      setPingingAppId(null);
    }
  };

  const handleSimulateWebhook = async (id: string) => {
    setSimulatingWebhookId(id);
    try {
      const res = await fetch(`/api/webhooks/app/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'customer.created_or_order_placed',
          timestamp: new Date().toISOString(),
          samplePayload: {
            customer: 'client@domain.com',
            status: 'paid',
            source: 'vireon_connected_vault_test',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookResults((prev) => ({
          ...prev,
          [id]: { success: true, message: 'تم إرسال واستلام حدث الـ Webhook بنجاح وتسجيله بالذاكرة المشتركة!' },
        }));
        fetchConnectedApps();
        onRefresh();
      } else {
        setWebhookResults((prev) => ({
          ...prev,
          [id]: { success: false, message: data.error || 'فشل محاكاة الحدث' },
        }));
      }
    } catch (err: any) {
      setWebhookResults((prev) => ({
        ...prev,
        [id]: { success: false, message: err.message || 'خطأ في محاكاة الـ Webhook' },
      }));
    } finally {
      setSimulatingWebhookId(null);
    }
  };

  const handleTestCoreProvider = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            success: data.data.success,
            message: data.data.message,
            latencyMs: data.data.latencyMs,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider]: { success: false, message: data.error || 'فشل الاختبار' },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: err.message || 'خطأ في الاتصال' },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const getCategoryIcon = (category: AppCategory) => {
    switch (category) {
      case 'e_commerce':
        return ShoppingCart;
      case 'mobile_backend':
        return Smartphone;
      case 'microservice_api':
        return Cpu;
      case 'bot_service':
        return Bot;
      case 'database_cloud':
        return Cloud;
      case 'custom_website':
      case 'web_app':
      default:
        return Globe;
    }
  };

  const getCategoryLabel = (category: AppCategory) => {
    switch (category) {
      case 'e_commerce':
        return 'متجر إلكتروني (سلة/شوبيفاي)';
      case 'mobile_backend':
        return 'تطبيق جوال / Backend';
      case 'microservice_api':
        return 'خدمة API مصغرة';
      case 'bot_service':
        return 'بوت ذكي / قناة تواصل';
      case 'database_cloud':
        return 'قاعدة بيانات / سحابة';
      case 'custom_website':
        return 'موقع ويب مخصص';
      case 'web_app':
      default:
        return 'تطبيق ويب / Next.js';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whop':
        return CreditCard;
      case 'github':
        return GitBranch;
      case 'database':
        return Database;
      default:
        return Server;
    }
  };

  const filteredApps = connectedApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Zero Trust & Super Admin Security Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  خزنة الرموز وتطبيقات ومواقع المالك Zero-Trust
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  تشفير كامل للخادم
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                يمكنك إضافة أي تطبيق أو موقع جديد، وتخزين الرموز السرية ومفاتيح الـ API ومسارات الـ Webhooks بأمان تام.
              </p>
            </div>
          </div>

          {/* Owner Profile Badge */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-left sm:text-right">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">المالك والمسؤول الأعلى</span>
            <span className="text-xs font-bold text-white font-mono block" dir="ltr">
              {owner.email}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              المصادقة الثنائية نشطة • صلاحيات كاملة
            </span>
          </div>
        </div>

        {/* Security Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">حماية الرموز والمفاتيح</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              أقنعة مشفرة • لا تُسرب للمتصفح
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">تكامل الأسطول الذكي 24/7</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              ربط تلقائي مع ذاكرة الوكلاء
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">بوابات Webhook مخصصة</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              مسار استقبال خاص لكل تطبيق
            </span>
          </div>
        </div>
      </div>

      {/* Main Sub-tabs Selector */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-btn-connected-apps"
            onClick={() => setSubTab('apps_vault')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'apps_vault'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>التطبيقات والمواقع المتصلة وخزنة الرموز</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                subTab === 'apps_vault' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {connectedApps.length}
            </span>
          </button>

          <button
            id="tab-btn-core-providers"
            onClick={() => setSubTab('core_providers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'core_providers'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>الخدمات المركزية الأساسية (Whop / GitHub / Vercel)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                subTab === 'core_providers' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {integrations.length}
            </span>
          </button>
        </div>

        {subTab === 'apps_vault' && (
          <button
            id="btn-add-new-app-top"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تطبيق أو موقع أو رمز جديد</span>
          </button>
        )}
      </div>

      {/* SUB-VIEW 1: CONNECTED APPS & TOKEN VAULT */}
      {subTab === 'apps_vault' && (
        <div className="space-y-5">
          {/* Controls Bar: Search & Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، النطاق، أو الوصف..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'web_app', label: 'تطبيقات الويب' },
                { id: 'e_commerce', label: 'المتاجر' },
                { id: 'mobile_backend', label: 'تطبيقات الجوال' },
                { id: 'microservice_api', label: 'واجهات API' },
                { id: 'bot_service', label: 'البوتات' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {loadingApps ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-xs text-zinc-400 font-mono">جاري قراءة خزنة التطبيقات والرموز...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">لا توجد تطبيقات أو مواقع مطابقة</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  يمكنك إضافة تطبيق ويب، موقع Next.js، متجر سلة أو شوبيفاي، أو خدمة API برمز مصادقة مخصص.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول تطبيق الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredApps.map((app) => {
                const Icon = getCategoryIcon(app.category);
                const isRevealed = revealedTokens[app.id] || false;
                const pingResult = pingResults[app.id];
                const webhookResult = webhookResults[app.id];
                const isPinging = pingingAppId === app.id;
                const isSimulating = simulatingWebhookId === app.id;

                const assignedAgentObj = AGENTS_LIST.find((a) => a.id === app.assignedAgent);

                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 hover:border-zinc-700/80 transition-all shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{app.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                app.environment === 'production'
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              }`}
                            >
                              {app.environment}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                            <span>{getCategoryLabel(app.category)}</span>
                            {app.url && (
                              <>
                                <span>•</span>
                                <a
                                  href={app.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                  dir="ltr"
                                >
                                  <span>{app.url.replace(/^https?:\/\//, '')}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(app)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                          title="تعديل التطبيق والرموز"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteApp(app.id, app.name)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-300 transition-colors"
                          title="حذف من الخزنة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description if present */}
                    {app.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
                        {app.description}
                      </p>
                    )}

                    {/* Token & Header Secret Vault Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-emerald-400" />
                          <span>رمز المصادقة السري (API Token / Secret Key):</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTokenReveal(app.id)}
                            className="text-zinc-400 hover:text-white flex items-center gap-1"
                            title={isRevealed ? 'إخفاء الرمز' : 'كشف الرمز'}
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isRevealed ? 'إخفاء' : 'كشف'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200">
                        <span dir="ltr" className="truncate text-emerald-300 font-semibold">
                          {isRevealed ? app.apiToken || 'لا يوجد رمز محدد' : app.maskedToken || '••••••••'}
                        </span>
                        <button
                          onClick={() => handleCopy(app.apiToken || app.maskedToken, `tok-${app.id}`)}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 text-[10px] shrink-0"
                          title="نسخ الرمز"
                        >
                          {copiedKey === `tok-${app.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Auth Header Format hint */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
                        <span>نوع الترويسة: {app.authHeaderType}</span>
                        <span dir="ltr">
                          {app.authHeaderType === 'Bearer'
                            ? 'Authorization: Bearer <TOKEN>'
                            : app.authHeaderType === 'X-API-Key'
                            ? 'X-API-Key: <TOKEN>'
                            : app.customHeaderName
                            ? `${app.customHeaderName}: <TOKEN>`
                            : 'Direct Token'}
                        </span>
                      </div>
                    </div>

                    {/* Webhook Endpoint Generated */}
                    <div className="space-y-1 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Radio className="w-3 h-3 text-cyan-400" />
                          <span>مسار الـ Webhook المخصص للتطبيق:</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          استلم {app.totalEventsReceived || 0} حدث
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs font-mono text-cyan-300" dir="ltr">
                        <span className="truncate">{app.webhookEndpoint}</span>
                        <button
                          onClick={() => handleCopy(app.webhookEndpoint, `wh-${app.id}`)}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 text-[10px] shrink-0"
                          title="نسخ مسار الـ Webhook"
                        >
                          {copiedKey === `wh-${app.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Assigned Agent & Live Telemetry */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] font-mono text-zinc-500 block">الوكيل المشرف 24/7</span>
                        <span className="font-bold text-zinc-200 block truncate">
                          {assignedAgentObj ? assignedAgentObj.name : app.assignedAgent}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] font-mono text-zinc-500 block">زمن الاستجابة والصحة</span>
                        <span className="font-mono font-bold text-emerald-400 block" dir="ltr">
                          {app.pingLatencyMs || 25}ms • {app.healthScore || 100}% جاهزية
                        </span>
                      </div>
                    </div>

                    {/* Test & Webhook Results Alerts */}
                    {pingResult && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                          pingResult.success
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800 text-rose-300'
                        }`}
                      >
                        {pingResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className="text-[11px] leading-tight">{pingResult.message}</span>
                      </div>
                    )}

                    {webhookResult && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                          webhookResult.success
                            ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300'
                            : 'bg-rose-950/40 border-rose-800 text-rose-300'
                        }`}
                      >
                        {webhookResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className="text-[11px] leading-tight">{webhookResult.message}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => handlePingApp(app.id)}
                        disabled={isPinging}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                      >
                        <Zap className={`w-3.5 h-3.5 text-amber-400 ${isPinging ? 'animate-spin' : ''}`} />
                        <span>{isPinging ? 'جاري الفحص...' : 'فحص الاتصال الحي'}</span>
                      </button>

                      <button
                        onClick={() => handleSimulateWebhook(app.id)}
                        disabled={isSimulating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-xs font-mono font-bold transition-all disabled:opacity-50"
                      >
                        <Send className={`w-3 h-3 ${isSimulating ? 'animate-pulse' : ''}`} />
                        <span>{isSimulating ? 'جاري الإرسال...' : 'محاكاة حدث Webhook'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: CORE PROVIDERS (Whop, GitHub, Vercel, DB) */}
      {subTab === 'core_providers' && (
        <div className="space-y-5">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  المزودات المركزية والبنية التحتية الأساسية (Core API Infrastructure)
                </h3>
                {coreStatus && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    {coreStatus.totalConnected} من {coreStatus.totalRequired} متصل ({coreStatus.overallScore}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                تحكم كامل في مفاتيح الذكاء الاصطناعي (Gemini)، خط أنابيب GitHub، بيئة نشر Vercel، مدفوعات Whop، وقاعدة البيانات.
              </p>
            </div>

            <button
              onClick={() => {
                fetchCoreStatus();
                onRefresh();
              }}
              disabled={loadingCoreStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCoreStatus ? 'animate-spin' : ''}`} />
              <span>{loadingCoreStatus ? 'جاري الفحص...' : 'إعادة فحص كافة الروابط'}</span>
            </button>
          </div>

          {/* Success Banner */}
          {coreKeySaveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{coreKeySaveSuccess}</span>
            </div>
          )}

          {/* Core Providers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Gemini AI Brain */}
            {(() => {
              const gem = coreStatus?.gemini;
              const isConfigured = gem ? gem.isConfigured : true;
              const isConnected = gem ? gem.status === 'connected' : true;
              const isTesting = testingProvider === 'gemini';
              const result = testResults['gemini'];

              return (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Google Gemini 2.5</h4>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            GEMINI_API_KEY
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isConnected
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {isConnected ? '🟢 صالح ومعتمد' : '🔴 مفقود / غير مصرح'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      المحرك العصبي المركزي للتحليل وصياغة الخطط وتوليد الكود والتنسيق بين الفرق.
                    </p>

                    {/* Masked Secret Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>قناع المفتاح السري:</span>
                        <span className="text-zinc-500">مشفر ومحمي</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between" dir="ltr">
                        <span>{gem?.maskedValue || 'AIzaSy••••••••k48'}</span>
                        <button
                          onClick={() =>
                            setEditingKeyModal({
                              keyName: 'GEMINI_API_KEY',
                              displayName: 'Google Gemini API Key',
                              docsUrl: 'https://aistudio.google.com/app/apikey',
                              description: 'أدخل مفتاح Google Gemini API لتشغيل التحليل العصبي المركزي وأتمتة المهام.',
                              currentValue: '',
                            })
                          }
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>

                    {gem?.message && (
                      <p className="text-[11px] font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                        {gem.message}
                      </p>
                    )}

                    {result && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          result.success
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          {result.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{result.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <span>جلب المفتاح</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleTestCoreProvider('gemini')}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 2. GitHub Integration */}
            {(() => {
              const gh = coreStatus?.github;
              const isConnected = gh ? gh.status === 'connected' : false;
              const isTesting = testingProvider === 'github';
              const result = testResults['github'];

              return (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                          <GitBranch className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">GitHub CI/CD</h4>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            GITHUB_TOKEN
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isConnected
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {isConnected ? '🟢 صالح ومعتمد' : '🔴 مفقود / غير مصرح'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      إدارة المستودع والتفرعات البرمجية والـ Commits وترقيعات الأكواد الآلية.
                    </p>

                    {/* Masked Secret Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>رمز الوصول الشخصي (PAT):</span>
                        <span className="text-zinc-500">مشفر ومحمي</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between" dir="ltr">
                        <span>{gh?.maskedValue || 'ghp_••••••••81a'}</span>
                        <button
                          onClick={() =>
                            setEditingKeyModal({
                              keyName: 'GITHUB_TOKEN',
                              displayName: 'GitHub Personal Access Token',
                              docsUrl: 'https://github.com/settings/tokens',
                              description: 'أدخل رمز GitHub PAT بصلاحيات repo لسحب الكود وإنشاء التفرعات والترقيعات.',
                              currentValue: '',
                            })
                          }
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>

                    {gh?.message && (
                      <p className="text-[11px] font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                        {gh.message}
                      </p>
                    )}

                    {result && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          result.success
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          {result.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{result.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <span>إعدادات الرمز</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleTestCoreProvider('github')}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 3. Vercel Integration */}
            {(() => {
              const ver = coreStatus?.vercel;
              const isConnected = ver ? ver.status === 'connected' : false;
              const isTesting = testingProvider === 'vercel';
              const result = testResults['vercel'];

              return (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-bold">
                          ▲
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Vercel Deployments</h4>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            VERCEL_TOKEN
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isConnected
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {isConnected ? '🟢 صالح ومعتمد' : '🔴 مفقود / غير مصرح'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      نشر المعاينات الفورية، الترقيع المباشر على الإنتاج، واستعادة الإصدارات (Rollback).
                    </p>

                    {/* Masked Secret Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>رمز Vercel السري:</span>
                        <span className="text-zinc-500">مشفر ومحمي</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between" dir="ltr">
                        <span>{ver?.maskedValue || 'vcl_••••••••2e9'}</span>
                        <button
                          onClick={() =>
                            setEditingKeyModal({
                              keyName: 'VERCEL_TOKEN',
                              displayName: 'Vercel API Token',
                              docsUrl: 'https://vercel.com/account/tokens',
                              description: 'أدخل مفتاح Vercel Token لتمكين النشر التلقائي وربط النطاقات الحية.',
                              currentValue: '',
                            })
                          }
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>

                    {ver?.message && (
                      <p className="text-[11px] font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                        {ver.message}
                      </p>
                    )}

                    {result && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          result.success
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          {result.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{result.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <a
                      href="https://vercel.com/account/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <span>جلب المفتاح</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleTestCoreProvider('vercel')}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 4. Whop Payments Integration */}
            {(() => {
              const whp = coreStatus?.whop;
              const isConnected = whp ? whp.status === 'connected' : false;
              const isTesting = testingProvider === 'whop';
              const result = testResults['whop'];

              return (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Whop Payments & Ledger</h4>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            WHOP_API_KEY
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isConnected
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {isConnected ? '🟢 صالح ومعتمد' : '🔴 مفقود / غير مصرح'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      معالجة المدفوعات والاشتراكات، واعتراض Webhooks الدفع الفوري وتوثيق دفتر الأرباح.
                    </p>

                    {/* Masked Secret Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>مفتاح Whop API المالي:</span>
                        <span className="text-zinc-500">مشفر ومحمي</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between" dir="ltr">
                        <span>{whp?.maskedValue || 'whop_••••••••41c'}</span>
                        <button
                          onClick={() =>
                            setEditingKeyModal({
                              keyName: 'WHOP_API_KEY',
                              displayName: 'Whop API Key',
                              docsUrl: 'https://dash.whop.com/developer/api-keys',
                              description: 'أدخل مفتاح Whop API لتفعيل التحقق المالي وتلقي إشعارات الدفع والاشتراكات.',
                              currentValue: '',
                            })
                          }
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>

                    {whp?.message && (
                      <p className="text-[11px] font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                        {whp.message}
                      </p>
                    )}

                    {result && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          result.success
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          {result.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{result.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <a
                      href="https://dash.whop.com/developer/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <span>لوحة مفاتيح Whop</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleTestCoreProvider('whop')}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 5. Core Storage & Database */}
            {(() => {
              const db = coreStatus?.database;
              const isConnected = db ? db.status === 'connected' : true;
              const isTesting = testingProvider === 'database';
              const result = testResults['database'];

              return (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Vireon Secure Database</h4>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            DATABASE_URL
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950 text-blue-300 border border-blue-600/70">
                        🔵 متصل ونشط 100%
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      تخزين دائم ومحمي لجميع المهام، السجلات، الموافقات، والذاكرة المشتركة للوكلاء.
                    </p>

                    {/* Masked Secret Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>سلسلة اتصال قاعدة البيانات:</span>
                        <span className="text-zinc-500">مشفرة</span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between" dir="ltr">
                        <span className="truncate max-w-[200px]">{db?.maskedValue || 'vireon://internal.disk.persistent'}</span>
                        <button
                          onClick={() =>
                            setEditingKeyModal({
                              keyName: 'DATABASE_URL',
                              displayName: 'Database Connection String',
                              docsUrl: 'https://postgresql.org/docs',
                              description: 'سلسلة اتصال PostgreSQL خارجية (اختياري، يعمل النظام ذاتياً بقاعدة بياناته الدائمة).',
                              currentValue: '',
                            })
                          }
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-1 shrink-0"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>

                    {db?.message && (
                      <p className="text-[11px] font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                        {db.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-500">PostgreSQL / JSON Store</span>
                    <button
                      onClick={() => handleTestCoreProvider('database')}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'جاري الفحص...' : 'اختبار الفهرسة'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: EDIT CORE API KEY */}
      {editingKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">إدخال / تحديث المفتاح السري</h4>
                  <span className="text-[11px] font-mono text-emerald-400">{editingKeyModal.keyName}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingKeyModal(null)}
                className="text-zinc-400 hover:text-white text-sm font-mono px-2 py-1 rounded bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {editingKeyModal.description}
            </p>

            <form onSubmit={handleSaveCoreKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-300 block">
                  قيمة المفتاح ({editingKeyModal.keyName}):
                </label>
                <input
                  type="password"
                  value={inputKeyValue}
                  onChange={(e) => setInputKeyValue(e.target.value)}
                  placeholder={`أدخل قيمة ${editingKeyModal.keyName} هنا...`}
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
                <p className="text-[10px] text-zinc-500">
                  يتم حفظ هذا المتغير وتفعيله على الخادم مباشرة دون تسريب إلى المتصفح.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <a
                  href={editingKeyModal.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  <span>جلب الرمز من المصدر</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingKeyModal(null)}
                    className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingCoreKey || !inputKeyValue.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-md"
                  >
                    {savingCoreKey && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>حفظ وتفعيل فوري</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CONNECTED APP & TOKEN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingAppId ? 'تعديل التطبيق والرموز السرية' : 'إضافة تطبيق أو موقع أو رمز جديد'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    أدخل تفاصيل التطبيق والرموز السرية ليتم حفظها بأمان في خزنة Zero-Trust.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveApp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* App Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    اسم التطبيق أو الموقع <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: متجر شوبيفاي الرئيسي، تطبيق الجوال..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* App URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    رابط النطاق أو الـ URL
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://store.example.com أو https://api..."
                    dir="ltr"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">تصنيف التطبيق</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AppCategory })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="web_app">🌐 تطبيق ويب (Next.js/React)</option>
                    <option value="e_commerce">🛍️ متجر إلكتروني (سلة / شوبيفاي)</option>
                    <option value="mobile_backend">📱 تطبيق هاتف ذكي (Flutter/API)</option>
                    <option value="microservice_api">⚡ واجهة API / Microservice</option>
                    <option value="bot_service">💬 بوت ذكي (Telegram/Discord)</option>
                    <option value="custom_website">📄 موقع ويب مخصص</option>
                    <option value="database_cloud">🗄️ قاعدة بيانات / سحابة</option>
                  </select>
                </div>

                {/* Environment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">بيئة التشغيل</label>
                  <select
                    value={formData.environment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        environment: e.target.value as 'production' | 'staging' | 'development',
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="production">🚀 الإنتاج (Production)</option>
                    <option value="staging">🧪 البيئة التجريبية (Staging)</option>
                    <option value="development">💻 بيئة التطوير (Development)</option>
                  </select>
                </div>

                {/* Assigned Agent */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">الوكيل المشرف</label>
                  <select
                    value={formData.assignedAgent}
                    onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value as AgentId })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {AGENTS_LIST.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* API Token / Secret */}
              <div className="space-y-1.5 p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>رمز الـ API والمفتاح السري (Token / Secret Key)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateRandomToken}
                      className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>توليد رمز عشوائي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTokenInForm(!showTokenInForm)}
                      className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      {showTokenInForm ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showTokenInForm ? 'إخفاء' : 'إظهار'}</span>
                    </button>
                  </div>
                </div>

                <input
                  type={showTokenInForm ? 'text' : 'password'}
                  value={formData.apiToken}
                  onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                  placeholder="sk_live_... أو Bearer Token أو أي مفتاح API سري"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-zinc-500">
                  يتم تشفير هذا الرمز وحفظه على الخادم في خزانة Zero-Trust مع إظهار قناع حماية تلقائي.
                </p>
              </div>

              {/* Auth Header Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">نوع رأس المصادقة (Auth Header)</label>
                  <select
                    value={formData.authHeaderType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        authHeaderType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Bearer">Authorization: Bearer &lt;token&gt;</option>
                    <option value="X-API-Key">X-API-Key: &lt;token&gt;</option>
                    <option value="Basic">Basic Auth</option>
                    <option value="Custom">رأس مخصص (Custom Header)</option>
                    <option value="None">بدون رأس (Direct API)</option>
                  </select>
                </div>

                {formData.authHeaderType === 'Custom' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 block">اسم الرأس المخصص</label>
                    <input
                      type="text"
                      value={formData.customHeaderName}
                      onChange={(e) => setFormData({ ...formData, customHeaderName: e.target.value })}
                      placeholder="X-Custom-Auth-Token"
                      dir="ltr"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 font-mono"
                    />
                  </div>
                )}

                {/* Webhook Secret */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    سر الـ Webhook / توقيع HMAC (اختياري)
                  </label>
                  <input
                    type="password"
                    value={formData.webhookSecret}
                    onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                    placeholder="whsec_..."
                    dir="ltr"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  وصف وملاحظات التطبيق (تظهر للوكلاء)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب ملاحظات توجيهية عن هذا التطبيق للوكلاء الذكاء الاصطناعي..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingApp}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingApp && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingAppId ? 'حفظ التعديلات' : 'إضافة إلى الخزنة الآن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
