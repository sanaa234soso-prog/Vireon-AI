import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Lock,
  Server,
  UserCheck,
} from 'lucide-react';
import { ApprovalRequest } from '../types.js';

interface ApprovalGatekeeperProps {
  approvals: ApprovalRequest[];
  onDecide: (id: string, decision: 'approved' | 'rejected', notes?: string) => Promise<void>;
}

export default function ApprovalGatekeeper({ approvals, onDecide }: ApprovalGatekeeperProps) {
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const resolvedApprovals = approvals.filter((a) => a.status !== 'pending');

  const handleAction = async (id: string, decision: 'approved' | 'rejected') => {
    setDecidingId(id);
    try {
      await onDecide(id, decision, notes[id]);
    } finally {
      setDecidingId(null);
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'destructive_db':
        return { label: 'تعديل بنية قاعدة بيانات حساسة', color: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 'production_deploy':
        return { label: 'إطلاق على بيئة الإنتاج المباشرة', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'payment_config':
        return { label: 'تعديل إعدادات بوابة الدفع', color: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 'security_role_change':
        return { label: 'تعديل الصلاحيات والأدوار الأمنية', color: 'bg-blue-950 text-blue-300 border-blue-800' };
      default:
        return { label: 'عملية حرجة تتطلب الموافقة', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  بوابة المالك وصلاحيات اعتماد العمليات الحساسة
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                  تصريح المالك الأعلى فقط
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تتطلب تعديلات قواعد البيانات الحساسة، وإطلاقات الإنتاج المباشرة، وتغييرات مسارات الدفع إذناً وتوقيعاً مباشراً من المالك.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-zinc-400 block">الطلبات المعلقة</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {pendingApprovals.length} {pendingApprovals.length === 1 ? 'طلب معلق' : 'طلبات معلقة'}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Approvals List */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider px-1">
          بانتظار موافقة واعتماد المالك ({pendingApprovals.length})
        </h3>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">لا توجد عمليات حساسة معلقة حالياً</p>
            <p className="text-xs text-zinc-400">
              جميع فرق الذكاء الاصطناعي تعمل ضمن الحدود الآلية الآمنة والمصرح بها.
            </p>
          </div>
        ) : (
          pendingApprovals.map((req) => {
            const badge = getActionBadge(req.actionType);
            const isProcessing = decidingId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-xl border border-amber-800/60 bg-zinc-950 p-5 space-y-4 shadow-md ring-1 ring-amber-500/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">طلب #{req.id}</span>
                      <span className="text-xs font-mono text-zinc-500">
                        العميل: <strong className="text-emerald-400">{req.agent}</strong>
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{req.taskTitle}</h4>
                  </div>

                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse self-start">
                    بانتظار الإجراء
                  </span>
                </div>

                <div className="text-xs text-zinc-300 space-y-1">
                  <p className="font-semibold text-zinc-200">تفاصيل العملية وتحليل التأثير والمخاطر:</p>
                  <p className="text-zinc-400 leading-relaxed bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    {req.description}
                  </p>
                </div>

                {/* Technical Payload / Query / Diff */}
                {req.payload?.commandOrQuery && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-zinc-400 block">
                      الاستعلام المستهدف / الأمر البرمجي / الفروقات (Diff):
                    </span>
                    <pre className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto" dir="ltr">
                      {req.payload.commandOrQuery}
                    </pre>
                  </div>
                )}

                {/* Rollback & Environment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">البيئة المستهدفة</span>
                    <span className="text-zinc-200 font-bold uppercase">{req.payload.environment}</span>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">خطة التراجع (Rollback Plan)</span>
                    <span className="text-zinc-300 truncate block">{req.payload.rollbackPlan}</span>
                  </div>
                </div>

                {/* Owner Notes & Action Form */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="ملاحظات الاعتماد والتوثيق للمالك (اختياري)..."
                    value={notes[req.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [req.id]: e.target.value })}
                    className="w-full sm:w-80 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 font-sans"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      id={`btn-reject-approval-${req.id}`}
                      onClick={() => handleAction(req.id, 'rejected')}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-mono font-bold transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>رفض وإلغاء</span>
                    </button>

                    <button
                      id={`btn-approve-approval-${req.id}`}
                      onClick={() => handleAction(req.id, 'approved')}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>موافقة واعتماد التنفيذ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolved Approvals Audit History */}
      {resolvedApprovals.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            سجل وتاريخ الموافقات السابقة من المالك ({resolvedApprovals.length})
          </h3>
          <div className="space-y-2">
            {resolvedApprovals.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {item.status === 'approved' ? 'معتمد ومُنفّذ' : 'مرفوض'}
                    </span>
                    <span className="font-bold text-zinc-200">{item.taskTitle}</span>
                  </div>
                  {item.notes && <p className="text-zinc-400 mt-1 pr-1">ملاحظة المالك: {item.notes}</p>}
                </div>
                <div className="text-right text-[10px] font-mono text-zinc-500">
                  <span>الموقع: {item.resolvedBy || 'sadeksanae50@gmail.com'}</span>
                  <span className="block">
                    {item.resolvedAt ? new Date(item.resolvedAt).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
