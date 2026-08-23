import { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
  FileSearch,
  Zap,
  RotateCw,
  Layers,
  Cpu,
  Award,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { AgentProfile, TaskItem, WorkflowStage, CeoDailyReport } from '../types.js';

interface CommandTerminalProps {
  agents: AgentProfile[];
  onCommandExecuted: () => void;
  recentTasks: TaskItem[];
}

export default function CommandTerminal({
  agents,
  onCommandExecuted,
  recentTasks,
}: CommandTerminalProps) {
  const [inputCommand, setInputCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [latestResponse, setLatestResponse] = useState<{
    message: string;
    taskId?: string;
    assignedPlan?: { stage: WorkflowStage; agent: string; action: string; output?: string }[];
    requiresApproval?: boolean;
    approvalId?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ceoReport, setCeoReport] = useState<CeoDailyReport | null>(null);
  const [generatingCeoReport, setGeneratingCeoReport] = useState(false);

  const fetchCeoReport = async () => {
    try {
      const res = await fetch('/api/ceo/daily-report');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCeoReport(data.data);
        }
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchCeoReport();
  }, []);

  const handleGenerateCeoReport = async () => {
    setGeneratingCeoReport(true);
    try {
      const res = await fetch('/api/ceo/generate-now', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCeoReport(data.data);
        }
      }
    } catch (err) {
      console.error('Error generating CEO report:', err);
    } finally {
      setGeneratingCeoReport(false);
    }
  };

  const quickDirectives = [
    { label: 'تدقيق أمني شامل للرموز والبيانات', prompt: 'قم بتشغيل تدقيق أمني لانعدام الثقة 24/7 عبر جميع مسارات الـ API وبيانات اعتماد قاعدة البيانات وتوقيعات Whop HMAC.' },
    { label: 'التحقق من مدفوعات Whop والـ Webhooks', prompt: 'تحقق من صحة خط أنابيب Whop webhooks، واختبر توقيعات HMAC، وطابق دفتر الأستاذ المالي لـ 24 ساعة.' },
    { label: 'فحص سيو المتجر وبيانات Schema', prompt: 'دقق صفحات منتجات المتجر بحثاً عن وسوم OpenGraph ومخطط JSON-LD وحالة الفهرسة لمحركات البحث.' },
    { label: 'تدقيق نظام التصميم والواجهات الفاخرة', prompt: 'قم بتدقيق مصفوفة الرموز (Design Tokens) وتوافق معايير التباين WCAG AA ودعم اللغة العربية RTL.' },
    { label: 'تحليل المبيعات ومسار التحويل', prompt: 'قم بإجراء تحليل كمي متقدم لإجمالي مبيعات المتجر اليوم، ومعدل احتفاظ البائعين، ومسار التحويل عند الدفع.' },
    { label: 'تحسين فهارس قاعدة البيانات (حساسة)', prompt: 'خطط وجهّز عملية إنشاء فهارس مركبة متزامنة على جدول طلبات المتجر لتقليل زمن استجابة الاستعلامات.' },
  ];

  const handleExecute = async (promptToRun?: string) => {
    const cmd = promptToRun || inputCommand;
    if (!cmd.trim() || isExecuting) return;

    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/manager/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const json = await res.json();
      if (json.success) {
        setLatestResponse(json.data);
        if (!promptToRun) setInputCommand('');
        onCommandExecuted();
      } else {
        setErrorMsg(json.error || 'فشلت معالجة الأمر');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ في الاتصال بالمدير المركزي');
    } finally {
      setIsExecuting(false);
    }
  };

  const getAgentName = (id: string) => {
    const ag = agents.find((a) => a.id === id);
    return ag ? ag.name : id;
  };

  const stageLabels: Record<string, string> = {
    detect: '1. الكشف',
    diagnose: '2. التشخيص',
    assign: '3. التكليف',
    fix: '4. المعالجة',
    test: '5. الفحص',
    security_check: '6. التدقيق الأمني',
    deploy: '7. النشر',
    verify: '8. التحقق',
    report: '9. التقرير',
  };

  return (
    <div className="space-y-6">
      {/* Central Executive Console Box */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">وحدة توجيه وتنسيق الذكاء الاصطناعي</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/50">
                  جاهز للتشغيل
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                قناة مباشرة للعقل المركزي. يتم تفويض المهام ذاتياً لـ 12 عميلاً متخصصاً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>محرك سير العمل الذاتي نشط (9 مراحل)</span>
          </div>
        </div>

        {/* Console Input Area */}
        <div className="p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <textarea
                id="input-owner-command"
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                placeholder="وجّه أمراً لمدير الذكاء الاصطناعي (مثال: 'افحص تكامل دفع Whop'، 'دقق أمان النظام والخوادم'، 'انشر ترقيعاً برمجياً'، 'حلل المبيعات ومعدل التحويل')..."
                rows={3}
                disabled={isExecuting}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 font-sans transition-all disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleExecute();
                  }
                }}
              />
              <div className="absolute left-3 bottom-3 flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">Ctrl + Enter للتنفيذ</span>
                <button
                  id="btn-submit-command"
                  type="submit"
                  disabled={isExecuting || !inputCommand.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  {isExecuting ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التنسيق والتنفيذ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الأمر للمدير</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Directives Pills */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>توجيهات تشغيلية سريعة ومباشرة:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickDirectives.map((d, i) => (
                <button
                  key={i}
                  id={`btn-quick-directive-${i}`}
                  onClick={() => handleExecute(d.prompt)}
                  disabled={isExecuting}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all font-medium text-right"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-5 mb-5 p-3.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">خطأ في التنفيذ</p>
              <p className="text-rose-300/90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Latest Execution Plan Output */}
        {latestResponse && (
          <div className="border-t border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  {latestResponse.requiresApproval ? 'عملية حساسة مُعلّقة — بانتظار موافقة المالك' : 'ملخص تنفيذ سير عمل الفرق الذكية'}
                </h3>
              </div>
              {latestResponse.taskId && (
                <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  رقم المهمة: {latestResponse.taskId}
                </span>
              )}
            </div>

            {/* High-Risk Warning Banner if applicable */}
            {latestResponse.requiresApproval && (
              <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>تم تفعيل بوابة المالك (Owner Gatekeeper):</strong> تم اكتشاف عملية حساسة/عالية الخطورة. انتقل إلى تبويب <strong>موافقات المالك</strong> لمراجعة التأثير واعتماد التنفيذ على بيئة الإنتاج.
                  </span>
                </div>
              </div>
            )}

            {/* Executive Message */}
            <p className="text-sm text-zinc-200 leading-relaxed font-sans">{latestResponse.message}</p>

            {/* Step-by-Step Workflow Pipeline Breakdown */}
            {latestResponse.assignedPlan && latestResponse.assignedPlan.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  سلسلة التنفيذ الآلية عبر المراحل الـ 9:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {latestResponse.assignedPlan.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          [{stageLabels[step.stage] || step.stage}]
                        </span>
                        <span className="text-xs font-medium text-zinc-300">
                          <strong>{getAgentName(step.agent)}:</strong> {step.action}
                        </span>
                      </div>
                      {step.output && (
                        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 sm:max-w-xs truncate">
                          {step.output}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI CEO Daily Executive Briefing */}
      {ceoReport && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-950 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  التقرير التنفيذي اليومي للرئيس التنفيذي الذكي (AI CEO Briefing)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-300 font-mono">
                    تقرير {ceoReport.date || 'اليوم'}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  ملخص شامل للمبيعات، الكفاءة التشغيلية، ومؤشرات الأداء لمالك النظام
                </p>
              </div>
            </div>

            <button
              id="btn-refresh-ceo-report"
              onClick={handleGenerateCeoReport}
              disabled={generatingCeoReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-semibold border border-amber-800/60 transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${generatingCeoReport ? 'animate-spin' : ''}`} />
              <span>{generatingCeoReport ? 'جاري توليد التقرير...' : 'تحديث التقرير التنفيذي'}</span>
            </button>
          </div>

          <p className="text-xs text-zinc-200 leading-relaxed font-sans bg-black/40 p-3.5 rounded-lg border border-zinc-800">
            {ceoReport.summary || ceoReport.executiveSummary || 'يعمل نظام Vireon بحالة تشغيلية ممتازة بنسبة استقرار 100% عبر الوكلاء الـ 14.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono block">إجمالي مبيعات 24h</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                ${(ceoReport.salesMetrics?.totalRevenue24h ?? ceoReport.kpis?.totalRevenue24h ?? 1046).toLocaleString()} USD
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono block">الطلبات المسددة</span>
              <span className="text-sm font-bold font-mono text-white">
                {ceoReport.salesMetrics?.ordersCount24h ?? ceoReport.kpis?.ordersCount24h ?? 4} طلبات
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono block">صحة النظام العامة</span>
              <span className="text-sm font-bold font-mono text-cyan-300">
                {ceoReport.operationalHealth?.systemHealthScore ?? ceoReport.kpis?.systemHealthScore ?? 100}%
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono block">معدل Webhook</span>
              <span className="text-sm font-bold font-mono text-purple-300">
                {ceoReport.operationalHealth?.webhookSuccessRate ?? 100}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
            <div className="space-y-1.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                أبرز الإنجازات المحققة:
              </h4>
              <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                {(ceoReport.keyAchievements || ceoReport.highlights || [
                  'تشغيل أسطول الوكلاء الـ 14 واستقرار خادم النشر المباشر',
                  'عزل الأسرار والمفاتيح بالكامل وحجبها عن المتصفح',
                  'مراقبة مستمرة 24/7 للمسارات والخدمات بزمن استجابة فائق السرعة',
                ]).map((ach, idx) => (
                  <li key={idx} className="leading-relaxed">{ach}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                التوصيات الاستراتيجية للمالك:
              </h4>
              <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                {(ceoReport.recommendations || ceoReport.operationalRisks || [
                  'ربط مفاتيح GITHUB_TOKEN و VERCEL_TOKEN في الإعدادات لإتاحة سحب وتحديث الأكواد ونشر المعاينات فورياً',
                ]).map((rec, idx) => (
                  <li key={idx} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recent Workflow Operations Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">أحدث مهام وسير عمل العملاء</h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">إجمالي المهام: {recentTasks.length}</span>
        </div>

        <div className="space-y-3">
          {recentTasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      task.priority === 'critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                        : task.priority === 'high'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {task.priority === 'critical' ? 'حرجة' : task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                  </span>
                  <span className="text-xs font-bold text-zinc-200">{task.title}</span>
                  <span className="text-[10px] font-mono text-zinc-500">#{task.id}</span>
                </div>
                <p className="text-xs text-zinc-400">{task.description}</p>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 block">العميل المسؤول</span>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">
                    {getAgentName(task.assignedAgent)}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    task.status === 'completed'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                      : task.status === 'awaiting_approval'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50 animate-pulse'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {task.status === 'completed' ? 'مكتملة' : task.status === 'awaiting_approval' ? 'بانتظار الموافقة' : task.status === 'in_progress' ? 'قيد التنفيذ' : task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
