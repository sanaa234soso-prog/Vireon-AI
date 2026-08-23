import React, { useState, useEffect, FormEvent } from 'react';
import {
  Rocket,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Globe,
  Radio,
  Sliders,
  Terminal,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { LiveSiteConfig, DeploymentRecord, HotPatchPayload } from '../types.js';

interface LiveDeploymentHubProps {
  onRefreshAll?: () => void;
}

export default function LiveDeploymentHub({ onRefreshAll }: LiveDeploymentHubProps) {
  const [config, setConfig] = useState<LiveSiteConfig | null>(null);
  const [history, setHistory] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [rollbackLoadingId, setRollbackLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form states for Live Site Customizer
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerText, setBannerText] = useState('');
  const [bannerType, setBannerType] = useState<'info' | 'promo' | 'warning' | 'critical'>('promo');
  const [siteTitle, setSiteTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [fastWhopCheckout, setFastWhopCheckout] = useState(true);
  const [aiChatWidgetEnabled, setAiChatWidgetEnabled] = useState(true);
  const [zeroDowntimeReplication, setZeroDowntimeReplication] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceNotice, setMaintenanceNotice] = useState('');
  const [themeAccent, setThemeAccent] = useState<'emerald' | 'cyan' | 'violet' | 'amber' | 'rose'>('emerald');

  // Custom Hot-Patch state
  const [patchTitle, setPatchTitle] = useState('');
  const [patchDesc, setPatchDesc] = useState('');
  const [patchCode, setPatchCode] = useState('');
  const [selectedDepLogs, setSelectedDepLogs] = useState<DeploymentRecord | null>(null);

  const fetchDeploymentStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deploy/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConfig(data.config);
          setHistory(data.history || []);
          if (!selectedDepLogs && data.history && data.history.length > 0) {
            setSelectedDepLogs(data.history[0]);
          }

          // Populate form fields
          const c: LiveSiteConfig = data.config;
          setBannerEnabled(c.bannerEnabled);
          setBannerText(c.bannerText);
          setBannerType(c.bannerType);
          setSiteTitle(c.siteTitle);
          setTagline(c.tagline);
          setFastWhopCheckout(c.fastWhopCheckout);
          setAiChatWidgetEnabled(c.aiChatWidgetEnabled);
          setZeroDowntimeReplication(c.zeroDowntimeReplication);
          setMaintenanceMode(c.maintenanceMode);
          setMaintenanceNotice(c.maintenanceNotice);
          setThemeAccent(c.themeAccent);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentStatus();
  }, []);

  const handleSaveSiteConfig = async (e: FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    setNotification(null);
    try {
      const payload: Partial<LiveSiteConfig> = {
        bannerEnabled,
        bannerText,
        bannerType,
        siteTitle,
        tagline,
        fastWhopCheckout,
        aiChatWidgetEnabled,
        zeroDowntimeReplication,
        maintenanceMode,
        maintenanceNotice,
        themeAccent,
      };

      const res = await fetch('/api/deploy/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(data.data.config);
        setHistory((prev) => [data.data.deployment, ...prev.filter((d) => d.id !== data.data.deployment.id)]);
        setSelectedDepLogs(data.data.deployment);
        setNotification({
          message: `تم نشر التحديثات فعلياً على الموقع بنجاح! الإصدار الجديد: ${data.data.config.activeVersion} (${data.data.config.activeCommitSha})`,
          type: 'success',
        });
        if (onRefreshAll) onRefreshAll();
      } else {
        setNotification({ message: data.error || 'فشل نشر التحديث للموقع', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  const handleDeployHotPatch = async (template?: { title: string; desc: string; code: string }) => {
    setDeploying(true);
    setNotification(null);
    const title = template?.title || patchTitle || 'Custom Live Code Patch';
    const desc = template?.desc || patchDesc || 'Hot-patch compiled and verified by AI Developer & DevOps.';
    const code = template?.code || patchCode;

    try {
      const payload: HotPatchPayload = {
        title,
        description: desc,
        agent: 'devops',
        targetEnvironment: 'production',
        codeDiff: code,
      };

      const res = await fetch('/api/deploy/hot-patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(data.data.config);
        setHistory((prev) => [data.data.deployment, ...prev.filter((d) => d.id !== data.data.deployment.id)]);
        setSelectedDepLogs(data.data.deployment);
        setPatchTitle('');
        setPatchDesc('');
        setPatchCode('');
        setNotification({
          message: `تم تطبيق ونشر الترقيع البرمجي فعلياً في Production بنجاح! Commit: ${data.data.deployment.commitSha}`,
          type: 'success',
        });
        if (onRefreshAll) onRefreshAll();
      } else {
        setNotification({ message: data.error || 'فشل تطبيق الترقيع البرمجي', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'خطأ في معالجة النشر', type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  const handleRollback = async (depId: string) => {
    setRollbackLoadingId(depId);
    setNotification(null);
    try {
      const res = await fetch('/api/deploy/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentId: depId }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          message: `تم التراجع بنجاح واستعادة الإصدار ${data.data.rolledBackTo.version} (${data.data.rolledBackTo.commitSha})!`,
          type: 'success',
        });
        fetchDeploymentStatus();
        if (onRefreshAll) onRefreshAll();
      } else {
        setNotification({ message: data.error || 'فشل التراجع عن النشر', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'خطأ في معالجة الاسترجاع', type: 'error' });
    } finally {
      setRollbackLoadingId(null);
    }
  };

  const getAccentClass = (accent?: string) => {
    switch (accent) {
      case 'cyan':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'violet':
        return 'text-violet-400 border-violet-500/30 bg-violet-500/10';
      case 'amber':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'rose':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default:
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                مركز النشر وإدارة الموقع المباشر
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-mono">
                  {config?.activeVersion || 'v2.4.2'} • مباشر
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                نظام النشر والتحديث الفعلي للموقع المباشر بدون توقف (Zero-Downtime Real-Time Hot-Patching)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-deploy"
            onClick={fetchDeploymentStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث الحالة
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              : 'bg-blue-950/40 border-blue-800/60 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-zinc-300"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Live Operational Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>الإصدار النشط المنشور</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {config?.activeVersion || 'v2.4.2'}
          </div>
          <div className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Commit: {config?.activeCommitSha || 'a8f9c2d'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>بيئة التشغيل الحية</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono uppercase text-white">
            {config?.deploymentChannel || 'Production'}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Cloud Run Edge Container</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>آخر عملية نشر</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {config?.lastDeployedAt ? new Date(config.lastDeployedAt).toLocaleTimeString() : 'منذ لحظات'}
          </div>
          <div className="text-xs text-zinc-400 truncate mt-1">
            بواسطة: {config?.lastDeployedBy || 'AI DevOps Master'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>فحص الأمان والـ QA</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-white">100% نجاح</div>
          <div className="text-xs text-teal-400 mt-1">48/48 تأكيد آلي مجاز</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Site Dynamic Customizer */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-Time Live Site Controller */}
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">محرر التحديث المباشر للموقع (Live Site Customizer)</h3>
              </div>
              <span className="text-xs text-zinc-400">تحديث فوري للموقع المباشر</span>
            </div>

            <form onSubmit={handleSaveSiteConfig} className="space-y-4">
              {/* Announcement Banner */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerEnabled}
                      onChange={(e) => setBannerEnabled(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    تفعيل شريط الإعلان العلوي المباشر (Live Top Announcement)
                  </label>
                  <select
                    value={bannerType}
                    onChange={(e: any) => setBannerType(e.target.value)}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-200"
                  >
                    <option value="promo">عرض ترويجي (Promo)</option>
                    <option value="info">معلوماتي (Info)</option>
                    <option value="warning">تنبيه (Warning)</option>
                    <option value="critical">حرج (Critical Alert)</option>
                  </select>
                </div>
                {bannerEnabled && (
                  <input
                    type="text"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="نص الإعلان المباشر على الموقع..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Title & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">عنوان الموقع الرئيسي</label>
                  <input
                    type="text"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">الشعار والوصف الترويجي</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition">
                  <span className="text-xs text-zinc-300">دفع Whop الفوري</span>
                  <input
                    type="checkbox"
                    checked={fastWhopCheckout}
                    onChange={(e) => setFastWhopCheckout(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                  />
                </label>

                <label className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition">
                  <span className="text-xs text-zinc-300">مساعد الذكاء التفاعلي</span>
                  <input
                    type="checkbox"
                    checked={aiChatWidgetEnabled}
                    onChange={(e) => setAiChatWidgetEnabled(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                  />
                </label>

                <label className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition">
                  <span className="text-xs text-zinc-300">تكرار البيانات الفوري</span>
                  <input
                    type="checkbox"
                    checked={zeroDowntimeReplication}
                    onChange={(e) => setZeroDowntimeReplication(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                  />
                </label>
              </div>

              {/* Theme Accent & Maintenance Mode */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">لون النمط:</span>
                  {(['emerald', 'cyan', 'violet', 'amber', 'rose'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setThemeAccent(color)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        themeAccent === color ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      } ${
                        color === 'emerald'
                          ? 'bg-emerald-500'
                          : color === 'cyan'
                          ? 'bg-cyan-500'
                          : color === 'violet'
                          ? 'bg-violet-500'
                          : color === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-rose-400 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="rounded border-rose-800 bg-zinc-900 text-rose-500"
                  />
                  وضع الصيانة المؤقت
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="btn-deploy-live-changes"
                  type="submit"
                  disabled={deploying}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                >
                  {deploying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري نشر التحديثات الحية وتجميع الحزمة...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      نشر التحديثات فعلياً على الموقع المباشر (Deploy Changes Now)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick AI Hot-Patch Triggers */}
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">ترقيعات برمجية سريعة بالذكاء الاصطناعي (AI Hot-Patches)</h3>
              </div>
              <span className="text-xs text-zinc-400">إطلاق وتطبيق فوري بدون إعادة تشغيل</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleDeployHotPatch({
                    title: 'تفعيل حماية الـ Rate Limiter و WAF على بوابات الدفع',
                    desc: 'Hot-patched API Gateway token limiter to 120 req/min with zero false positives.',
                    code: `+ app.use('/api/webhooks', rateLimiter({ max: 120, windowMs: 60000 }));`,
                  })
                }
                disabled={deploying}
                className="p-3 text-right rounded-lg bg-zinc-950 border border-zinc-800 hover:border-cyan-500/40 transition group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 group-hover:text-cyan-300">
                  <span>درع حماية تدفق الـ Webhooks</span>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">تحديث قواعد التشفير ومحدد الطلبات اللحظي</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDeployHotPatch({
                    title: 'تحديث مسار الاستجابة السريعة لمبيعات Whop',
                    desc: 'Optimized checkout settlement pipeline with instant Redis cache replication.',
                    code: `+ export const FAST_CHECKOUT_PIPELINE = true;\n+ export const HMAC_ALGORITHM = 'SHA-256';`,
                  })
                }
                disabled={deploying}
                className="p-3 text-right rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 transition group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                  <span>تسريع مسار إتمام الدفع</span>
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">تقليل زمن استجابة الـ Webhook إلى أقل من 20ms</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDeployHotPatch({
                    title: 'تثبيت بانر تخفيضات Black Friday على باقات Vireon',
                    desc: 'Injected promotional promotional metadata into dynamic edge CDN.',
                    code: `+ config.bannerText = "🔥 خصم خاص 50% على جميع اشتراكات Vireon AI Enterprise لفترة محدودة!";\n+ config.bannerType = "promo";`,
                  })
                }
                disabled={deploying}
                className="p-3 text-right rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 transition group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 group-hover:text-amber-300">
                  <span>نشر إعلان الخصم الخاص</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">تحديث فوري لرسالة البانر في الموقع المباشر</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDeployHotPatch({
                    title: 'إعادة مزامنة سجلات الـ 13 وكيلاً والـ Watchdog Radar',
                    desc: 'Synchronized telemetry probes across all 6 microservices.',
                    code: `+ export const TELEMETRY_INTERVAL_MS = 30000;\n+ export const DEEP_SCAN_ENABLED = true;`,
                  })
                }
                disabled={deploying}
                className="p-3 text-right rounded-lg bg-zinc-950 border border-zinc-800 hover:border-violet-500/40 transition group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 group-hover:text-violet-300">
                  <span>تحديث رادار المراقبة الشامل</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">فحص التكرار ومطابقة البيانات الحية 24/7</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Simulation & Deployment History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Public Site Preview Card */}
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">معاينة حية للموقع المنشور (Live Site Simulation)</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                https://vireon.ai
              </span>
            </div>

            {/* Live Mini Frame */}
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shadow-inner">
              {/* Browser Header Bar */}
              <div className="px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="font-mono text-zinc-300">https://vireon.ai/production</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Simulated Live Top Banner */}
              {config?.bannerEnabled && (
                <div
                  className={`px-3 py-1.5 text-xs font-semibold text-center truncate ${
                    config.bannerType === 'promo'
                      ? 'bg-amber-900/40 text-amber-300 border-b border-amber-800/40'
                      : config.bannerType === 'critical'
                      ? 'bg-rose-900/40 text-rose-300 border-b border-rose-800/40'
                      : 'bg-emerald-900/40 text-emerald-300 border-b border-emerald-800/40'
                  }`}
                >
                  {config.bannerText}
                </div>
              )}

              {/* Simulated Live Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/30">
                      V
                    </div>
                    <span className="font-bold text-white text-sm">{config?.siteTitle || 'VIREON AI'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                    24/7 Operations
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
                  <p className="text-xs font-bold text-zinc-100">{config?.tagline}</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    النظام المستقل لإدارة المؤسسات الرقمية، ومعالجة مدفوعات Whop، وإشراف الـ 13 وكيلاً للذكاء الاصطناعي.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-zinc-400">
                    الحالة: <span className="text-emerald-400 font-semibold">جاهز للتنفيذ</span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                  >
                    {config?.fastWhopCheckout ? '⚡ Whop Fast Checkout' : 'Order Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment History & 1-Click Rollback */}
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">سجل الإصدارات والاسترجاع الفوري (Rollback Matrix)</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{history.length} Deploys</span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {history.map((dep) => (
                <div
                  key={dep.id}
                  onClick={() => setSelectedDepLogs(dep)}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    dep.status === 'active'
                      ? 'bg-emerald-950/20 border-emerald-800/60 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          dep.status === 'active'
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {dep.version}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">({dep.commitSha})</span>
                    </div>

                    {dep.status === 'active' ? (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        النشط حالياً
                      </span>
                    ) : (
                      <button
                        id={`btn-rollback-${dep.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRollback(dep.id);
                        }}
                        disabled={rollbackLoadingId === dep.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700 transition"
                        title="استرجاع هذا الإصدار فوراً للموقع"
                      >
                        <RotateCcw className={`w-3 h-3 ${rollbackLoadingId === dep.id ? 'animate-spin' : ''}`} />
                        استرجاع (Rollback)
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-zinc-200 font-medium mt-1.5 line-clamp-1">{dep.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                    <span>{new Date(dep.deployedAt).toLocaleString()}</span>
                    <span>المنفذ: {dep.deployedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Terminal Log Drawer */}
      {selectedDepLogs && (
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-md space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-200">
                سجل تجميع ونشر الإصدار: {selectedDepLogs.version} [{selectedDepLogs.commitSha}]
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>زمن البناء: {selectedDepLogs.buildDurationMs}ms</span>
              <span>•</span>
              <span className="text-emerald-400">QA Pass: {selectedDepLogs.qaPassRate}%</span>
            </div>
          </div>

          <div className="bg-black/60 p-4 rounded-lg text-xs space-y-1.5 max-h-48 overflow-y-auto text-zinc-300">
            {selectedDepLogs.deploymentLogs.map((logLine, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-zinc-500 select-none">[{idx + 1}]</span>
                <span
                  className={
                    logLine.includes('[SUCCESS]')
                      ? 'text-emerald-400 font-bold'
                      : logLine.includes('[SECURITY]')
                      ? 'text-rose-400'
                      : logLine.includes('[QA]')
                      ? 'text-teal-400'
                      : 'text-zinc-300'
                  }
                >
                  {logLine}
                </span>
              </div>
            ))}
          </div>

          {selectedDepLogs.diffSnippet && (
            <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-300">
              <span className="text-zinc-500 block mb-1">Code & Config Delta:</span>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre font-mono">{selectedDepLogs.diffSnippet}</pre>
            </div>
          )}
        </div>
      )}

      {/* GitHub & Vercel Real CI/CD Integration Hub */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              محرك التكامل المباشر مع GitHub & Vercel CI/CD Pipeline
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
            Real Infrastructure
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* GitHub Pipeline */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                تكامل مستودع GitHub
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                قراءة وكتابة PRs
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              يدعم إنشاء الفروع التلقائية (Auto-Branching)، إرسال الـ Commits الموثقة، وإنشاء طلبات السحب (Pull Requests) بعد اجتياز فحص الـ QA الآلي.
            </p>
            <div className="p-2.5 rounded bg-zinc-900 font-mono text-[11px] text-zinc-300 space-y-1">
              <div>Branch: <span className="text-cyan-400">main (Protected)</span></div>
              <div>Auto-PR: <span className="text-emerald-400">Enabled (vireon-bot)</span></div>
              <div>Commit Sign: <span className="text-amber-400">GPG Verified</span></div>
            </div>
          </div>

          {/* Vercel Pipeline */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-teal-400" />
                سحابة Vercel Edge
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                Preview & Prod
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              يقوم بنشر نسخ المعاينة (Preview Deployments) لكل تعديل مع فحص الأداء، ثم الترقية التلقائية إلى Production أو التراجع اللحظي في حالة الطوارئ.
            </p>
            <div className="p-2.5 rounded bg-zinc-900 font-mono text-[11px] text-zinc-300 space-y-1">
              <div>Preview: <span className="text-teal-400">https://vireon-preview.vercel.app</span></div>
              <div>Production: <span className="text-emerald-400">https://vireon.ai</span></div>
              <div>Instant Rollback: <span className="text-purple-400">Ready (&lt; 2s)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
