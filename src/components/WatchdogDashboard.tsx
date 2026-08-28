import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  ShieldAlert,
  PowerOff,
  Play,
  RotateCcw,
  CheckCheck,
  Cpu,
  Lock,
} from 'lucide-react';
import { IncidentRecord, WatchdogMetric, MonitoredComponent } from '../types.js';

interface WatchdogDashboardProps {
  metrics: WatchdogMetric[];
  incidents: IncidentRecord[];
  lastSweep: string;
  onRefresh: () => void;
}

export default function WatchdogDashboard({
  metrics,
  incidents,
  lastSweep,
  onRefresh,
}: WatchdogDashboardProps) {
  const [components, setComponents] = useState<MonitoredComponent[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isolateModalOpen, setIsIsolateModalOpen] = useState(false);
  const [selectedCompToIsolate, setSelectedCompToIsolate] = useState<MonitoredComponent | null>(null);
  const [isolateForm, setIsolateForm] = useState({
    exactProblem: 'ارتفاع في معدل الأخطاء واستنزاف الاتصالات المؤقتة',
    reason: 'فشل الفحص الدوري واحتمالية حدوث عطل تسلسلي في الخدمة',
    affectedLinesOrConfig: 'server/api/gateway.ts:48',
    proposedPatch: 'applyEmergencyTrafficDrainAndSanitize();',
    rollbackStrategy: 'استرجاع النسخة المستقرة السابقة وإلغاء العزل بموافقة المالك',
  });
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchMonitoredComponents = async () => {
    try {
      const res = await fetch('/api/watchdog/monitored-components');
      const data = await res.json();
      if (data.success) {
        setComponents(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching monitored components:', err);
    }
  };

  useEffect(() => {
    fetchMonitoredComponents();
    const interval = setInterval(fetchMonitoredComponents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeepScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/watchdog/scan-now', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setScanResult(json.data.report);
        if (json.data.components) {
          setComponents(json.data.components);
        }
        onRefresh();
      }
    } catch (err) {
      console.error('Error running deep scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleIsolateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompToIsolate) return;

    try {
      const res = await fetch('/api/watchdog/isolate-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentId: selectedCompToIsolate.id,
          ...isolateForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsIsolateModalOpen(false);
        await fetchMonitoredComponents();
        onRefresh();
        setActionMsg(
          `🚨 تم إيقاف وعزل "${selectedCompToIsolate.name}" فوراً وإرسال إشعار للمالك في بوابة الموافقات (Approval #${data.approvalRequestId}).`
        );
        setTimeout(() => setActionMsg(null), 8000);
      }
    } catch (err) {
      console.error('Error isolating component:', err);
    }
  };

  const handleRecoverComponent = async (componentId: string) => {
    try {
      const res = await fetch('/api/watchdog/recover-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMonitoredComponents();
        onRefresh();
        setActionMsg(`✓ ${data.message}`);
        setTimeout(() => setActionMsg(null), 6000);
      }
    } catch (err) {
      console.error('Error recovering component:', err);
    }
  };

  const avgLatency = metrics.length
    ? Math.round(metrics.reduce((a, b) => a + b.latencyMs, 0) / metrics.length)
    : 0;

  const isolatedCount = components.filter((c) => c.status === 'isolated_stopped').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">
                خادم المراقبة والاستشعار والعزل التلقائي (Continuous Watchdog 24/7)
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                المراقبة والعزل الذاتي نشط
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              يراقب باستمرار كافة الوكلاء الـ 13، الخوادم الخارجية، ومحركات الذكاء الاصطناعي وقاعدة البيانات. في حال حدوث أي فشل: يتم عزل وإيقاف الخادم فورياً، وإشعار المالك بالسبب الجذري، وانتظار الموافقة قبل الاسترجاع.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              آخر فحص: {new Date(lastSweep).toLocaleTimeString('ar-SA')}
            </span>
            <button
              id="btn-deep-watchdog-scan"
              onClick={handleDeepScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'جاري الفحص الشامل...' : 'تشغيل فحص شامل'}</span>
            </button>
          </div>
        </div>

        {/* Global Vital Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">متوسط زمن الاستجابة</span>
            <span className="text-xl font-extrabold font-mono text-emerald-400">{avgLatency} ms</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">نسبة الجاهزية (24h)</span>
            <span className="text-xl font-extrabold font-mono text-emerald-400">99.98%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">المكونات الخاضعة للرقابة</span>
            <span className="text-xl font-extrabold font-mono text-white">{components.length} أنظمة</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">الخوادم المعزولة / المتوقفة</span>
            <span
              className={`text-xl font-extrabold font-mono ${
                isolatedCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {isolatedCount} قيد العزل
            </span>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionMsg && (
          <div className="p-3 bg-slate-950 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}
      </div>

      {/* Deep Scan Result Banner if triggered */}
      {scanResult && (
        <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/20 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>تقرير الفحص الشامل والمطابقة الأمنية من مدقق الذكاء الاصطناعي</span>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            {scanResult}
          </pre>
        </div>
      )}

      {/* Continuous Monitored Components & Active Isolation Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              مصفوفة الخوادم والمكونات المراقبة مع بروتوكول العزل الذاتي (Isolation Matrix)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">حماية استباقية وتفادي الأعطال التسلسلية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {components.map((comp) => {
            const isIsolated = comp.status === 'isolated_stopped';

            return (
              <div
                key={comp.id}
                className={`p-4 rounded-xl border transition space-y-3 relative overflow-hidden ${
                  isIsolated
                    ? 'bg-rose-950/30 border-rose-500/60 shadow-lg ring-1 ring-rose-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white">{comp.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">{comp.identifier}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isIsolated
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isIsolated ? 'معزول / متوقف' : 'سليم ومتصل'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الاستجابة</span>
                    <span className="font-bold text-emerald-400 font-mono">{comp.latencyMs}ms</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الجاهزية</span>
                    <span className="font-bold text-white font-mono">{comp.uptime24h}%</span>
                  </div>
                </div>

                {isIsolated && comp.autoRecoveryPlan && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/30 rounded-lg text-[11px] space-y-1">
                    <div className="text-rose-300 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> عطل معزول:
                    </div>
                    <p className="text-slate-300 line-clamp-2">{comp.autoRecoveryPlan.exactProblem}</p>
                    <div className="text-[10px] text-amber-300 pt-1 border-t border-rose-800/40">
                      بانتظار موافقة المالك للاسترجاع (طلب رقم #{comp.autoRecoveryPlan.approvalTicketId})
                    </div>
                  </div>
                )}

                {/* Isolation & Recovery Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {isIsolated ? (
                    <button
                      onClick={() => handleRecoverComponent(comp.id)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      استرجاع وإلغاء العزل
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCompToIsolate(comp);
                        setIsIsolateModalOpen(true);
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-700/50 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                      title="عزل الخادم فورياً في حال الاشتباه بخلل"
                    >
                      <PowerOff className="w-3 h-3 text-rose-400" />
                      عزل وإيقاف فوري
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident & Anomaly History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              سجل الحوادث والتشخيص الفني (Technical Incidents Log)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">إجمالي الحوادث: {incidents.length}</span>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    {inc.severity === 'critical' ? 'حرجة' : inc.severity === 'warning' ? 'تحذير' : 'معلومات'}
                  </span>
                  <span className="font-bold text-slate-200">{inc.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {inc.status === 'resolved' ? 'تم الحل بنجاح' : inc.status}
                </span>
              </div>

              <p className="text-slate-400 whitespace-pre-wrap">{inc.rootCause || inc.diagnosis}</p>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                <span>الخدمة المتأثرة: {inc.impactedService || inc.impact}</span>
                <span>وقت الاكتشاف: {new Date(inc.createdAt || inc.detectedAt).toLocaleTimeString('ar-SA')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Emergency Quarantine / Isolate Component */}
      {isolateModalOpen && selectedCompToIsolate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PowerOff className="w-4 h-4 text-rose-400" />
                عزل وإيقاف الخادم فورياً: {selectedCompToIsolate.name}
              </h3>
              <button
                onClick={() => setIsIsolateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIsolateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">وصف المشكلة الفنية الدقيقة:</label>
                <input
                  type="text"
                  required
                  value={isolateForm.exactProblem}
                  onChange={(e) => setIsolateForm({ ...isolateForm, exactProblem: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">السبب الفني للعزل:</label>
                <textarea
                  rows={2}
                  required
                  value={isolateForm.reason}
                  onChange={(e) => setIsolateForm({ ...isolateForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الملف / المسار المتأثر:</label>
                <input
                  type="text"
                  value={isolateForm.affectedLinesOrConfig}
                  onChange={(e) => setIsolateForm({ ...isolateForm, affectedLinesOrConfig: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الترقيعة وخطة الاسترجاع:</label>
                <input
                  type="text"
                  value={isolateForm.proposedPatch}
                  onChange={(e) => setIsolateForm({ ...isolateForm, proposedPatch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIsolateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition"
                >
                  تنفيذ العزل وإشعار المالك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
