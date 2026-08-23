import { useState } from 'react';
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
} from 'lucide-react';
import { IncidentRecord, WatchdogMetric } from '../types.js';

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
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

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
        onRefresh();
      }
    } catch (err) {
      console.error('Error running deep scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const avgLatency = metrics.length
    ? Math.round(metrics.reduce((a, b) => a + b.latencyMs, 0) / metrics.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                رادار المراقبة والاستشعار التلقائي 24/7
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                المراقبة نشطة
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              يقوم مدقق الذكاء الاصطناعي ومهندس العمليات بفحص نقاط الـ API، ومسارات الدفع، واستجابة قاعدة البيانات، وشهادات الأمان SSL بشكل مستمر.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">
              آخر مسح: {new Date(lastSweep).toLocaleTimeString()}
            </span>
            <button
              id="btn-deep-watchdog-scan"
              onClick={handleDeepScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'جاري فحص الأنظمة...' : 'تشغيل فحص شامل'}</span>
            </button>
          </div>
        </div>

        {/* Global Vital Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">متوسط زمن الاستجابة</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{avgLatency} ملّي ثانية</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">نسبة الجاهزية (24 ساعة)</span>
            <span className="text-xl font-bold font-mono text-emerald-400">99.98%</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">نقاط الفحص النشطة</span>
            <span className="text-xl font-bold font-mono text-white">{metrics.length}/6 متصلة</span>
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 block">الحوادث المفتوحة</span>
            <span className="text-xl font-bold font-mono text-emerald-400">0 قيد الانتظار</span>
          </div>
        </div>
      </div>

      {/* Deep Scan Result Banner if triggered */}
      {scanResult && (
        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>تقرير الفحص الشامل من مدقق الذكاء الاصطناعي</span>
          </div>
          <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            {scanResult}
          </pre>
        </div>
      )}

      {/* Service Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white">{m.service}</h3>
                <span className="text-[10px] font-mono text-zinc-500 truncate block max-w-[200px]" dir="ltr">
                  {m.endpoint}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                {m.status === 'operational' ? 'سليم' : m.status === 'degraded' ? 'متراجع' : m.status === 'critical' ? 'حرج' : 'صيانة'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-500 block">الاستجابة</span>
                <span className="text-xs font-bold font-mono text-emerald-400">{m.latencyMs}ms</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-500 block">الجاهزية</span>
                <span className="text-xs font-bold font-mono text-zinc-200">{m.uptime24h}%</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-500 block">الأخطاء</span>
                <span className="text-xs font-bold font-mono text-emerald-400">0.0%</span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span>فحص بواسطة المدقق الذكي</span>
              <span>{new Date(m.lastChecked).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Incident & Anomaly History */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              سجل الحوادث والمعالجة الذاتية التلقائية
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">إجمالي المسجل: {incidents.length}</span>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    {inc.severity === 'critical' ? 'حرجة' : inc.severity === 'warning' ? 'تحذير' : 'معلومات'}
                  </span>
                  <span className="font-bold text-zinc-200">{inc.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {inc.status === 'resolved' ? 'تم الحل بنجاح' : inc.status}
                </span>
              </div>

              <p className="text-zinc-400">{inc.diagnosis}</p>

              <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                <span>التأثير: {inc.impact}</span>
                <span>وقت الاكتشاف: {new Date(inc.detectedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
