import { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Play,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { TaskItem, WorkflowStage } from '../types.js';

interface TaskPipelineViewProps {
  tasks: TaskItem[];
  onTaskUpdated: () => void;
}

const WORKFLOW_STAGES: { id: WorkflowStage; label: string; order: number }[] = [
  { id: 'detect', label: '1. الكشف', order: 1 },
  { id: 'diagnose', label: '2. التشخيص', order: 2 },
  { id: 'assign', label: '3. التكليف', order: 3 },
  { id: 'fix', label: '4. المعالجة', order: 4 },
  { id: 'test', label: '5. الفحص', order: 5 },
  { id: 'security_check', label: '6. الفحص الأمني', order: 6 },
  { id: 'deploy', label: '7. النشر', order: 7 },
  { id: 'verify', label: '8. التحقق', order: 8 },
  { id: 'report', label: '9. التقرير', order: 9 },
];

export default function TaskPipelineView({ tasks, onTaskUpdated }: TaskPipelineViewProps) {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(tasks[0] || null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    const pMatch = filterPriority === 'all' || t.priority === filterPriority;
    const sMatch = filterStatus === 'all' || t.status === filterStatus;
    return pMatch && sMatch;
  });

  const handleAdvanceTask = async (taskId: string) => {
    if (!selectedTask || isAdvancing) return;
    setIsAdvancing(true);
    try {
      const currentIdx = WORKFLOW_STAGES.findIndex((s) => s.id === selectedTask.stage);
      const nextStage = WORKFLOW_STAGES[Math.min(WORKFLOW_STAGES.length - 1, currentIdx + 1)].id;

      const res = await fetch(`/api/tasks/${taskId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: nextStage,
          agent: 'qa',
          output: `تم تقديم المرحلة تلقائياً إلى [${nextStage.toUpperCase()}] مع التحقق البرمجي.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTask(data.data);
        onTaskUpdated();
      }
    } catch (err) {
      console.error('Error advancing task:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const currentStageIndex = selectedTask
    ? WORKFLOW_STAGES.findIndex((s) => s.id === selectedTask.stage)
    : -1;

  return (
    <div className="space-y-6">
      {/* Header & Stage Visualizer */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                خط سير عمل المهام المستقل (9 مراحل)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              تتبع كل عملية برمجية وفحص أمني صارم ومحدد قبل الاعتماد والنشر على الإنتاج.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-sans"
            >
              <option value="all">جميع الأولويات</option>
              <option value="critical">حرجة</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-sans"
            >
              <option value="all">جميع الحالات</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="awaiting_approval">بانتظار الموافقة</option>
              <option value="completed">مكتملة</option>
            </select>
          </div>
        </div>

        {/* 9-Stage Progress Track Bar */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[760px] justify-between gap-1 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            {WORKFLOW_STAGES.map((stg, i) => {
              const isPast = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const isFuture = i > currentStageIndex;

              return (
                <div key={stg.id} className="flex items-center flex-1">
                  <div
                    className={`flex-1 flex items-center justify-center p-2 rounded text-center transition-all ${
                      isCurrent
                        ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-bold shadow'
                        : isPast
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                        : 'bg-zinc-950/60 text-zinc-600 border border-zinc-900'
                    }`}
                  >
                    <span className="text-[11px] font-mono whitespace-nowrap">{stg.label}</span>
                  </div>
                  {i < WORKFLOW_STAGES.length - 1 && (
                    <ChevronLeft
                      className={`w-4 h-4 mx-1 shrink-0 ${
                        isPast ? 'text-zinc-600' : 'text-zinc-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Split View: Task List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span>قائمة طابور المهام ({filteredTasks.length})</span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pl-1">
            {filteredTasks.map((t) => {
              const isSelected = selectedTask?.id === t.id;
              return (
                <div
                  key={t.id}
                  id={`task-item-${t.id}`}
                  onClick={() => setSelectedTask(t)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        t.priority === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : t.priority === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {t.priority === 'critical' ? 'حرجة' : t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        t.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : t.status === 'awaiting_approval'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {t.status === 'completed' ? 'مكتملة' : t.status === 'awaiting_approval' ? 'بانتظار الموافقة' : t.status === 'in_progress' ? 'قيد التنفيذ' : t.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">{t.title}</h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">{t.description}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/80">
                    <span>المرحلة: <strong className="text-emerald-400">{t.stage}</strong></span>
                    <span>المسؤول: <strong className="text-zinc-300">{t.assignedAgent}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Task Details (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedTask ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-5">
              {/* Task Header */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      رقم المهمة: #{selectedTask.id}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      تاريخ الإنشاء: {new Date(selectedTask.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedTask.title}</h3>
                </div>

                {selectedTask.status !== 'completed' && (
                  <button
                    onClick={() => handleAdvanceTask(selectedTask.id)}
                    disabled={isAdvancing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>تقديم المرحلة</span>
                  </button>
                )}
              </div>

              {/* Task Description & Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase">الوصف والملخص</h4>
                <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  {selectedTask.description}
                </p>
              </div>

              {/* Workflow Step Logs */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase">
                  سجل تنفيذ الخطوات بين الفرق الذكية ({selectedTask.workflowHistory.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pl-1">
                  {selectedTask.workflowHistory.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[9px] font-bold flex items-center justify-center border border-emerald-800/60">
                            ✓
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            [{step.stage}]
                          </span>
                          <span className="text-zinc-300 font-semibold font-mono">
                            العميل: {step.agent}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-zinc-300 font-sans pr-6">{step.output}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Artifacts (Code Diff, Test Suite, Security Matrix) */}
              {selectedTask.artifacts && selectedTask.artifacts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase">
                    المخرجات والملفات المعتمدة ({selectedTask.artifacts.length})
                  </h4>
                  {selectedTask.artifacts.map((art) => (
                    <div
                      key={art.id}
                      className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden"
                    >
                      <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-zinc-200">
                          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold">{art.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase">{art.type}</span>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {art.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs font-mono">
              حدد مهمة من الطابور لمراجعة خطوات التنفيذ ومخرجات الكود.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
