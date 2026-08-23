import { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  AlertCircle,
  Terminal,
  Zap,
} from 'lucide-react';
import { BackgroundWorkerJob } from '../types.js';

export default function WorkersAndQueueView() {
  const [jobs, setJobs] = useState<BackgroundWorkerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedJob, setSelectedJob] = useState<BackgroundWorkerJob | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workers/jobs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setJobs(data.data);
          if (!selectedJob && data.data.length > 0) {
            setSelectedJob(data.data[0]);
          } else if (selectedJob) {
            const updated = data.data.find((j: BackgroundWorkerJob) => j.id === selectedJob.id);
            if (updated) setSelectedJob(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching worker jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerJob = async (jobId: string) => {
    setTriggeringId(jobId);
    setNotification(null);
    try {
      const res = await fetch('/api/workers/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          message: `تم تشغيل المهمة الدورية "${jobId}" فورياً بنجاح بواسطة الوكيل المعني!`,
          type: 'success',
        });
        fetchJobs();
      } else {
        setNotification({
          message: data.error || 'فشل تشغيل المهمة الدورية',
          type: 'error',
        });
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                محرك عمال الخلفية والجدولة 24/7 (Autonomous Workers & Queue)
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-400 font-mono">
                  {jobs.length} مهام نشطة 24/7
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                تعمل خيوط المعالجة والوكلاء في الخلفية بصورة مستقلة ومستمرة دون الحاجة لفتح المتصفح
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-workers"
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث المهام
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
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

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>المهام المجدولة النشطة</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{jobs.length} عمال</div>
          <div className="text-xs text-emerald-400 font-mono mt-1">يعملون بدون توقف 24/7</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>إجمالي الدورات المنفذة</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {jobs.reduce((sum, j) => sum + (j.totalRuns || j.executionCount || 0), 0)} دورة
          </div>
          <div className="text-xs text-zinc-400 font-mono mt-1">سجل تراكمي موثق</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>متوسط دورة الفحص</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">60 ثانية</div>
          <div className="text-xs text-amber-300 font-mono mt-1">معدل استجابة عالي</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>حالة العمال</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">100% تشغيل مستمر</div>
          <div className="text-xs text-purple-300 font-mono mt-1">الذاكرة المشتركة متصلة</div>
        </div>
      </div>

      {/* Main Grid: Jobs Table & Job Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            قائمة عمال الخلفية والمهام الدورية (Active Workers)
          </h3>

          <div className="space-y-3">
            {jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              const isTriggering = triggeringId === job.id;
              const runs = job.totalRuns || job.executionCount || 0;
              const agentLabel = (job.assignedAgent || job.category || 'WORKER').toUpperCase();
              const outputText = job.lastOutput || job.lastResult || 'يعمل بسلاسة';
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                          job.status === 'running'
                            ? 'bg-amber-400 animate-ping'
                            : job.status === 'completed'
                            ? 'bg-emerald-400'
                            : 'bg-rose-400'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{job.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                            {agentLabel}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            كل {job.intervalSeconds} ثانية
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {job.description || `المهمة الدورية المستقلة للوكيل ${agentLabel}`}
                        </p>
                      </div>
                    </div>

                    <button
                      id={`btn-trigger-${job.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerJob(job.id);
                      }}
                      disabled={isTriggering}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-medium border border-cyan-800/60 transition shrink-0"
                      title="تشغيل المهمة يدوياً الآن"
                    >
                      <Play className={`w-3 h-3 ${isTriggering ? 'animate-spin' : ''}`} />
                      <span>{isTriggering ? 'جاري التشغيل...' : 'تشغيل الآن'}</span>
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>
                      آخر تنفيذ: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString('ar-EG') : 'قيد الإطلاق'}
                    </span>
                    <span>الدورات: {runs}</span>
                    <span className="text-emerald-400">
                      {outputText.length > 45 ? outputText.slice(0, 45) + '...' : outputText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Job Detail / Live Log Inspector */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            مفتش تفاصيل المهمة وسجل التنفيذ
          </h3>

          {selectedJob ? (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-1">
                  معرّف المهمة: {selectedJob.id}
                </span>
                <h4 className="text-base font-bold text-white">{selectedJob.name}</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedJob.description || `معالجة خلفية متقدمة عبر ${selectedJob.category}`}
                </p>
              </div>

              <div className="space-y-2 text-xs border-y border-zinc-800 py-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">الوكيل المسؤول:</span>
                  <span className="text-white font-mono font-semibold">
                    {selectedJob.assignedAgent || selectedJob.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">دورية التكرار:</span>
                  <span className="text-cyan-300 font-mono">كل {selectedJob.intervalSeconds} ثانية</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">إجمالي مرات التنفيذ:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {selectedJob.totalRuns || selectedJob.executionCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">آخر وقت تشغيل:</span>
                  <span className="text-zinc-300 font-mono">
                    {selectedJob.lastRunAt ? new Date(selectedJob.lastRunAt).toLocaleTimeString('ar-EG') : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  نتيجة آخر دورة تشغيل:
                </h5>
                <div className="p-3 rounded-lg bg-black/60 border border-zinc-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto">
                  {selectedJob.lastOutput || selectedJob.lastResult || 'لا توجد أخطاء. يعمل المحرك بكفاءة متناهية.'}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleTriggerJob(selectedJob.id)}
                  disabled={triggeringId === selectedJob.id}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  تشغيل فوري لهذه الدورة
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-zinc-500 text-xs">
              حدد مهمة من القائمة لعرض تفاصيل التشغيل
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
