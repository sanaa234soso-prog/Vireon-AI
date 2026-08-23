import { useState } from 'react';
import { FileText, Filter, Search, RefreshCw, Terminal } from 'lucide-react';
import { AgentId, SystemLogEntry } from '../types.js';

interface SystemLogsViewProps {
  logs: SystemLogEntry[];
  onRefresh: () => void;
}

export default function SystemLogsView({ logs, onRefresh }: SystemLogsViewProps) {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase()) ||
      (log.agentId && log.agentId.toLowerCase().includes(search.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'warn':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'success':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'security':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'error':
        return 'خطأ';
      case 'warn':
        return 'تحذير';
      case 'success':
        return 'نجاح';
      case 'security':
        return 'أمان';
      default:
        return 'معلومات';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                سجلات التدقيق ونشاط النظام والعملاء الذكية
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              بث حي فوري ومتزامن 24/7 لجميع أنشطة وكلاء الذكاء الاصطناعي الـ 13، ومستمعات Whop Webhooks، وحراس الأمان.
            </p>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-medium transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث السجلات</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-zinc-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="البحث في السجلات عبر الرسالة، الوحدة، أو معرف العميل الذكي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 font-sans focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-sans focus:outline-none focus:border-emerald-500"
          >
            <option value="all">جميع المستويات</option>
            <option value="success">عمليات ناجحة (Success)</option>
            <option value="info">معلومات (Info)</option>
            <option value="warn">تحذيرات (Warnings)</option>
            <option value="error">أخطاء (Errors)</option>
            <option value="security">أمان وحماية (Security)</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs overflow-hidden">
        <div className="space-y-2 max-h-[640px] overflow-y-auto pl-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">لا توجد سجلات تطابق معايير البحث الحالية.</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${getLevelBadge(
                      log.level
                    )}`}
                  >
                    {getLevelLabel(log.level)}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-zinc-400 font-semibold text-[11px]">{log.module}</span>
                      {log.agentId && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400">
                          العميل: {log.agentId}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-200 font-sans text-xs">{log.message}</p>
                    {log.details && (
                      <p className="text-zinc-500 text-[10px] font-mono mt-1" dir="ltr">{log.details}</p>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-zinc-500 shrink-0 self-end sm:self-center font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
