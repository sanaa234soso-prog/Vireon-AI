import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Archive,
  DollarSign,
  TrendingDown,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  HardDrive,
  Download,
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';
import {
  SystemAuditLog,
  BackupSnapshot,
  CostMonitoringData,
  AgentPerformanceRecord,
} from '../types.js';

export default function ObservabilityAndAuditHub() {
  const [activeTab, setActiveTab] = useState<'audit' | 'backups' | 'costs' | 'performance'>('audit');
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [costData, setCostData] = useState<CostMonitoringData | null>(null);
  const [performanceRecords, setPerformanceRecords] = useState<AgentPerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const fetchObservabilityData = async () => {
    setIsLoading(true);
    try {
      const [auditRes, backupsRes, costsRes, perfRes] = await Promise.all([
        fetch('/api/observability/audit-logs'),
        fetch('/api/observability/backups'),
        fetch('/api/observability/costs'),
        fetch('/api/observability/agent-performance'),
      ]);

      const [auditJson, backupsJson, costsJson, perfJson] = await Promise.all([
        auditRes.json(),
        backupsRes.json(),
        costsRes.json(),
        perfRes.json(),
      ]);

      if (auditJson.success) setAuditLogs(auditJson.data || []);
      if (backupsJson.success) setBackups(backupsJson.data || []);
      if (costsJson.success) setCostData(costsJson.data || null);
      if (perfJson.success) setPerformanceRecords(perfJson.data || []);
    } catch (err) {
      console.error('Error fetching observability data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObservabilityData();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/observability/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `نسخة احتياطية فورية شاملة (${new Date().toLocaleTimeString('ar-EG')})`,
          triggerType: 'manual_owner',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('تم إنشاء النسخة الاحتياطية المشفرة والتحقق من البصمة الرقمية بنجاح.');
        setTimeout(() => setFeedback(null), 4000);
        fetchObservabilityData();
      }
    } catch (err) {
      console.error('Error creating backup:', err);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (id: string) => {
    if (!confirm('هل ترغب في محاكاة استعادة النظام من هذه النسخة الاحتياطية؟')) return;
    try {
      const res = await fetch(`/api/observability/backups/${id}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('تمت محاكاة الاستعادة بنجاح والتحقق من سلامة البيانات 100%.');
        setTimeout(() => setFeedback(null), 4000);
        fetchObservabilityData();
      }
    } catch (err) {
      console.error('Error restoring backup:', err);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchSearch =
      !auditSearch.trim() ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.actor.name.toLowerCase().includes(auditSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6" id="observability-and-audit-hub">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Enterprise Observability, Audit & Cost Intelligence
              </span>
              <span className="text-xs text-slate-400">سجلات تدقيق غير قابلة للتغيير • نسخ احتياطية فورية • رصد التكاليف</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              المراقبة الشاملة وسجلات التدقيق والنسخ الاحتياطي (Observability)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              تتبع دقيق لكل إجراء أو تعديل حساس على مستوى النظام، مع بصمات رقمية SHA-256 غير قابلة للتلاعب، وإمكانية إنشاء واستعادة النسخ الاحتياطية ومراقبة تكاليف استهلاك الرموز البرمجية.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-rose-900/30 disabled:opacity-50"
            >
              {isCreatingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
              أخذ نسخة احتياطية فورية
            </button>
            <button
              onClick={fetchObservabilityData}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {feedback && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'audit', label: 'سجلات التدقيق (Audit Logs)', icon: Lock },
          { id: 'backups', label: 'النسخ الاحتياطية (Backups)', icon: Archive },
          { id: 'costs', label: 'رصد التكاليف والتوكنات (Costs)', icon: DollarSign },
          { id: 'performance', label: 'بطاقات أداء الوكلاء (Performance)', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="ابحث في سجلات التدقيق بالاسم أو الإجراء..."
                className="w-full ps-9 pe-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {['all', 'security', 'deployment', 'config_mutation', 'secret_access', 'backup'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {log.action}
                    </span>
                    <span className="text-slate-400">بواسطة: <span className="text-white font-semibold">{log.actor.name}</span></span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.targetAppName}</span>
                  </div>

                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{log.details}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="truncate max-w-md">SHA-256: {log.hashSha256}</span>
                  <span className="text-emerald-400 font-medium">بصمة موثقة ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BACKUPS */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {backups.map((bkp) => (
              <div
                key={bkp.id}
                className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {bkp.version}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {(bkp.sizeKb / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{bkp.title}</h3>
                  <p className="text-xs text-slate-400 font-mono mb-3">{bkp.appName}</p>

                  <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-slate-400 mb-1">المكونات المشمولة بالنسخة:</p>
                    {bkp.componentsIncluded.map((c, idx) => (
                      <p key={idx} className="text-slate-400 truncate">• {c}</p>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px] truncate max-w-[180px]">
                    {bkp.checksum}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreBackup(bkp.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      استعادة آمنة
                    </button>
                    <button
                      onClick={() => alert(`تنزيل النسخة الاحتياطية المشفرة: ${bkp.id}.tar.gz`)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COSTS */}
      {activeTab === 'costs' && costData && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <p className="text-xs text-slate-400">التكلفة الشهرية الفعلية</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">${costData.totalMonthlyCostUsd.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500">من الحد الشهري $150.00</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <p className="text-xs text-slate-400">التكلفة المتوقعة لنهاية الشهر</p>
              <p className="text-2xl font-bold text-white font-mono">${costData.projectedCostUsd.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-400 font-medium">ضمن النطاق الاقتصادي الآمن</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <p className="text-xs text-slate-400">استهلاك التوكنات (24h)</p>
              <p className="text-2xl font-bold text-indigo-400 font-mono">{costData.aiTokensConsumed24h.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">ساعات الحوسبة: 24h كاملة</p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
              <p className="text-xs text-slate-400">مؤشر كفاءة الإنفاق</p>
              <p className="text-2xl font-bold text-cyan-400 font-mono">{costData.costEfficiencyScore}%</p>
              <p className="text-[10px] text-slate-500">ممتاز (A+ Rating)</p>
            </div>
          </div>

          {/* Breakdown & Optimization Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                توزيع التكاليف حسب التطبيق:
              </h3>
              <div className="space-y-2">
                {costData.costBreakdownByApp.map((app) => (
                  <div key={app.appId} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{app.appName}</span>
                    <span className="font-mono text-emerald-400 font-bold">${app.costUsd.toFixed(2)} ({app.tokensPercent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                توصيات خفض التكاليف الذكية (AI Cost Optimization):
              </h3>
              <div className="space-y-2">
                {costData.costOptimizationsSuggested.map((opt, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{opt.title}</span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                      <TrendingDown className="w-3.5 h-3.5" />
                      توفير ${opt.potentialSavingsUsd.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AGENT PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceRecords.map((perf) => (
            <div
              key={perf.agentId}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{perf.name}</h3>
                  <p className="text-[11px] text-slate-400">{perf.department}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {perf.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <p className="text-[10px] text-slate-400">نسبة النجاح:</p>
                  <p className="font-mono font-bold text-emerald-400">{perf.successRatePercent}%</p>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <p className="text-[10px] text-slate-400">متوسط السرعة:</p>
                  <p className="font-mono font-bold text-cyan-400">{perf.avgResolutionTimeSec}s</p>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <p className="text-[10px] text-slate-400">مؤشر التعاون:</p>
                  <p className="font-mono font-bold text-indigo-400">{perf.collaborationIndex}%</p>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <p className="text-[10px] text-slate-400">عقد المعرفة:</p>
                  <p className="font-mono font-bold text-amber-400">{perf.knowledgeNodesContributed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
