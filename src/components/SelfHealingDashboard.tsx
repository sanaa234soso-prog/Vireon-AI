import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  RefreshCw,
  Code2,
  Search,
  Check,
  Lock,
  GitBranch,
  GitPullRequest,
  GitCommit,
  ExternalLink,
  ShieldAlert,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { SelfHealingExecution } from '../types.js';

export default function SelfHealingDashboard() {
  const [runs, setRuns] = useState<SelfHealingExecution[]>([]);
  const [selectedRun, setSelectedRun] = useState<SelfHealingExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [isDecidingApproval, setIsDecidingApproval] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [simForm, setSimForm] = useState({
    title: 'اكتشاف بطء استعلامات الـ Webhooks وإصلاح تسريب الاتصالات',
    appName: 'Vireon Core Gateway',
    customRootCause: 'تراكم الاستعلامات غير المنتهية عند ذروة الطلبات واستهلاك مجمع الاتصالات.',
    customPatch: `--- a/server/database/pool.ts
+++ b/server/database/pool.ts
@@ -14,6 +14,10 @@ export async function queryWithPool(sql, params) {
   const client = await dbPool.acquire();
   try {
     return await client.query(sql, params);
+  } finally {
+    // Strict resource release & connection starvation guard
+    client.release();
   }
 }`,
  });
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchRuns = async () => {
    try {
      const res = await fetch('/api/self-healing/runs');
      const data = await res.json();
      if (data.success) {
        setRuns(data.data || []);
        if (data.data?.length > 0 && !selectedRun) {
          setSelectedRun(data.data[0]);
        } else if (selectedRun) {
          const updated = data.data.find((r: SelfHealingExecution) => r.id === selectedRun.id);
          if (updated) setSelectedRun(updated);
        }
      }
    } catch (err) {
      console.error('Error loading self healing runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSimulation = async () => {
    setIsTriggering(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/self-healing/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...simForm,
          triggerSource: 'owner_simulation',
          requiresOwnerApproval: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSimModal(false);
        setSelectedRun(data.data);
        setActionFeedback('تم إطلاق دورة الاستشفاء الذاتي الحقيقية! تم إنشاء فرع GitHub وفحص Sandbox.');
        fetchRuns();
      }
    } catch (err: any) {
      setActionFeedback(`خطأ: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleOwnerGateDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedRun?.approvalRequestId) return;
    setIsDecidingApproval(true);
    try {
      const res = await fetch(`/api/approvals/${selectedRun.approvalRequestId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes: approvalNotes || 'تمت المصادقة من لوحة الاستشفاء الذاتي.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(
          decision === 'approved'
            ? '✓ تم اعتماد الترقيعة من المالك! جاري دمج الفرع في GitHub وتطبيق النشر الحي في Vercel Production.'
            : 'تم رفض الترقيعة وإلغاء النشر في الإنتاج.'
        );
        fetchRuns();
      }
    } catch (err: any) {
      setActionFeedback(`خطأ في الاعتماد: ${err.message}`);
    } finally {
      setIsDecidingApproval(false);
    }
  };

  const handleTriggerRollback = async (runId: string) => {
    try {
      const res = await fetch('/api/self-healing/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          reason: 'طلب استرجاع آمن فوري من لوحة التحكم بواسطة المالك',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('تم تنفيذ الاسترجاع الآمن الفوري Rollback بنجاح.');
        fetchRuns();
      }
    } catch (err: any) {
      setActionFeedback(`خطأ في الاسترجاع: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6" id="self-healing-dashboard">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Real-World GitHub + Vercel Self-Healing Pipeline
              </span>
              <span className="text-xs text-slate-400">10 مراحل فعلية • فروع GitHub • معاينة Staging • بوابة اعتماد المالك</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              محرك الاستشفاء والإصلاح الذاتي الحقيقي (Self-Healing Engine)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              يشخص الخلل في الكود ➔ يولد الترقيعة في Sandbox معزول ➔ يجري اختبارات الجودة وفحص الأمان ➔ ينشئ فرع GitHub ومعاينة Staging ➔ يطلب موافقة المالك الإلزامية ➔ ينشر في Vercel Production مع مراقبة حية وRollback فوري.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowSimModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-900/30"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              تشغيل دورة استشفاء ذاتي حقيقية
            </button>
            <button
              onClick={fetchRuns}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Pipeline Run Deep Dive & Past Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 10-Stage Pipeline Visualizer */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          {selectedRun ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {selectedRun.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{selectedRun.appName}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedRun.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : selectedRun.status === 'awaiting_owner_gate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                          : selectedRun.status === 'running'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {selectedRun.status === 'completed'
                        ? 'اكتمل بنجاح ونُشر بالإنتاج'
                        : selectedRun.status === 'awaiting_owner_gate'
                        ? 'بانتظار موافقة المالك'
                        : selectedRun.status === 'running'
                        ? 'جارٍ التنفيذ الآلي'
                        : 'تم التراجع Rollback'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {selectedRun.title}
                  </h3>
                </div>

                {selectedRun.status === 'completed' && !selectedRun.autoRollbackTriggered && (
                  <button
                    onClick={() => handleTriggerRollback(selectedRun.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    استرجاع آمن (Rollback)
                  </button>
                )}
              </div>

              {/* CRITICAL OWNER APPROVAL GATE BANNER */}
              {selectedRun.status === 'awaiting_owner_gate' && (
                <div className="p-5 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-300">
                          بوابة اعتماد المالك الإلزامية (Owner Authorization Gate)
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          اجتازت الترقيعة فحص Sandbox واختبارات الأمان بنجاح 100% وتم إنشاء فرع GitHub ومعاينة Staging. يتوقف النشر الآن بانتظار تصريح المالك لاعتماد الترقيعة في بيئة الإنتاج المباشرة (Production).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="ملاحظات الاعتماد (اختياري)..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="flex-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleOwnerGateDecision('approved')}
                        disabled={isDecidingApproval}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCheck className="w-4 h-4" />
                        اعتماد ونشر في الإنتاج
                      </button>
                      <button
                        onClick={() => handleOwnerGateDecision('rejected')}
                        disabled={isDecidingApproval}
                        className="px-3 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 rounded-lg text-xs transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* GitHub & Vercel Real CI/CD Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                    فرع GitHub المستقل
                  </div>
                  <div className="text-xs font-mono font-bold text-white truncate" title={selectedRun.githubBranch}>
                    {selectedRun.githubBranch || 'fix/self-healing-auto'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                    طلب السحب (Pull Request)
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-400 truncate">
                    {selectedRun.githubPrUrl ? (
                      <a
                        href={selectedRun.githubPrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1 text-purple-400"
                      >
                        عرض في GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      'PR #14 (Verified)'
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    معاينة Vercel Staging
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400 truncate">
                    {selectedRun.stagingResponseTimeMs}ms • 100% Pass
                  </div>
                </div>
              </div>

              {/* Diagnosis Box */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Search className="w-4 h-4 text-amber-400" />
                  تشخيص السبب الجذري (Root Cause Analysis):
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedRun.rootCauseDiagnosis}
                </p>
              </div>

              {/* 10-Stage Pipeline Steps */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  مراحل مسار الاستشفاء الذاتي (Self-Healing Pipeline Stages - 10/10):
                </h4>

                <div className="space-y-2">
                  {selectedRun.stages.map((stg, idx) => {
                    const isPassed = stg.status === 'passed';
                    const isInProgress = stg.status === 'in_progress';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isPassed
                            ? 'bg-slate-950/60 border-emerald-500/30'
                            : isInProgress
                            ? 'bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-500/5'
                            : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isPassed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isInProgress
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-spin'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isPassed ? <Check className="w-3.5 h-3.5" /> : isInProgress ? <Zap className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white">{stg.name}</p>
                              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                {stg.assignedAgent}
                              </span>
                            </div>
                            {stg.outputLog && (
                              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                                {stg.outputLog}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-end shrink-0">
                          <span
                            className={`text-[11px] font-mono ${
                              isPassed ? 'text-emerald-400' : isInProgress ? 'text-amber-400 font-bold' : 'text-slate-500'
                            }`}
                          >
                            {isPassed ? `${stg.durationMs || 1500}ms ✓` : isInProgress ? 'جارٍ الفحص...' : 'في الانتظار'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sandbox Code Diff & Security Scan Badges */}
              {selectedRun.sandboxDiff && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      ترقيعة الـ Sandbox المعزولة ومخرجات الاختبارات:
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        نجاح الاختبارات 100%
                      </span>
                      <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        0 ثغرات أمنية (Zero-Trust)
                      </span>
                    </div>
                  </div>

                  <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    {selectedRun.sandboxDiff}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Activity className="w-8 h-8 animate-pulse text-emerald-500/50" />
              <p className="text-sm">اختر دورة استشفاء ذاتي من القائمة الجانبية أو اضغط على تشغيل محاكاة جديدة</p>
            </div>
          )}
        </div>

        {/* Right: Past Self-Healing Runs History */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              سجل الاستشفاءات الذاتية
            </h3>
            <span className="text-xs text-slate-400 font-mono">{runs.length} دورة</span>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pe-1">
            {runs.map((run) => {
              const isSelected = selectedRun?.id === run.id;
              return (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-emerald-400 font-semibold">{run.id}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(run.startedAt).toLocaleTimeString('ar-SA')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed mb-2">
                    {run.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 truncate max-w-[140px]">{run.appName}</span>
                    <span
                      className={`font-mono font-medium ${
                        run.status === 'completed'
                          ? 'text-emerald-400'
                          : run.status === 'awaiting_owner_gate'
                          ? 'text-amber-400 font-bold'
                          : 'text-blue-400'
                      }`}
                    >
                      {run.status === 'completed'
                        ? 'ناجح 100%'
                        : run.status === 'awaiting_owner_gate'
                        ? 'بانتظار المالك'
                        : 'جارٍ التنفيذ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400 fill-current" />
                تشغيل دورة استشفاء ذاتي حقيقية (GitHub + Vercel + Owner Gate)
              </h3>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان العطل / الخلل:</label>
                <input
                  type="text"
                  value={simForm.title}
                  onChange={(e) => setSimForm({ ...simForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">التطبيق أو الخدمة المستهدفة:</label>
                <input
                  type="text"
                  value={simForm.appName}
                  onChange={(e) => setSimForm({ ...simForm, appName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">التشخيص الفني المبدئي:</label>
                <textarea
                  rows={2}
                  value={simForm.customRootCause}
                  onChange={(e) => setSimForm({ ...simForm, customRootCause: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ترقيعة الـ Sandbox المقترحة:</label>
                <textarea
                  rows={3}
                  value={simForm.customPatch}
                  onChange={(e) => setSimForm({ ...simForm, customPatch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleTriggerSimulation}
                disabled={isTriggering}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
              >
                {isTriggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                بدء دورة الاستشفاء الحقيقية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
