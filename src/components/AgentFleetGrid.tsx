import { useState, FormEvent } from 'react';
import {
  Users,
  Cpu,
  Server,
  Code,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Cloud,
  CreditCard,
  ShoppingBag,
  Headphones,
  TrendingUp,
  BarChart3,
  Briefcase,
  Sparkles,
  Clock,
  Terminal,
  Send,
  Play,
  Pause,
  ShieldBan,
  Filter,
  Check,
  AlertTriangle,
  RotateCw,
  Zap,
  Radio,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { AgentProfile, AgentStatus, FleetConnectivityReport, AgentConnectivityStatus } from '../types.js';

const ICON_MAP: Record<string, any> = {
  Cpu,
  Server,
  Code,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Cloud,
  CreditCard,
  ShoppingBag,
  Headphones,
  TrendingUp,
  BarChart3,
  Briefcase,
  Sparkles,
};

interface AgentFleetGridProps {
  agents: AgentProfile[];
  onDirectTask: (agentId: string, instruction: string) => void;
  onRefresh?: () => void;
}

export default function AgentFleetGrid({ agents, onDirectTask, onRefresh }: AgentFleetGridProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [directPrompt, setDirectPrompt] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'stopped'>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingAgentId, setUpdatingAgentId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [testingFleet, setTestingFleet] = useState(false);
  const [testingSingleAgentId, setTestingSingleAgentId] = useState<string | null>(null);
  const [fleetReport, setFleetReport] = useState<FleetConnectivityReport | null>(null);
  const [selectedReportAgent, setSelectedReportAgent] = useState<AgentConnectivityStatus | null>(null);

  const handleTestAllAgents = async () => {
    setTestingFleet(true);
    setStatusNotification('⚡ جارٍ فحص الاتصال الحي وتوليد استجابات فورية من جميع وكلاء الأسطول الـ 14...');
    try {
      const res = await fetch('/api/agents/connectivity-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setFleetReport(data.data);
        setStatusNotification(`🟢 اكتمل فحص الاتصال الحي: ${data.data.connectedCount + data.data.degradedCount} وكيلاً متصلين بنجاح (${data.data.activeAiModel}, ${data.data.geminiLatencyMs}ms)`);
        if (onRefresh) onRefresh();
      } else {
        setStatusNotification(`🔴 فشل فحص الاتصال: ${data.error || 'حدث خطأ غير متوقع'}`);
      }
    } catch (err: any) {
      setStatusNotification(`🔴 خطأ في الاتصال: ${err.message}`);
    } finally {
      setTestingFleet(false);
      setTimeout(() => setStatusNotification(null), 6000);
    }
  };

  const handleTestSingleAgent = async (agentId: string) => {
    setTestingSingleAgentId(agentId);
    try {
      const res = await fetch(`/api/agents/${agentId}/connectivity-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedReportAgent(data.data);
        setStatusNotification(`🟢 تم فحص الوكيل [${data.data.agentName}] بنجاح: ${data.data.primaryBrain.connected ? `متصل (${data.data.primaryBrain.latencyMs}ms)` : 'غير متصل'}`);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      console.error('Failed to test single agent:', err);
    } finally {
      setTestingSingleAgentId(null);
      setTimeout(() => setStatusNotification(null), 4000);
    }
  };

  const departments = ['all', ...Array.from(new Set(agents.map((a) => a.department)))];

  // Helper to test if agent is active vs stopped/blocked
  const isAgentActive = (status: AgentStatus) => {
    return status === 'active' || status === 'working' || status === 'thinking' || status === 'idle';
  };

  const activeAgentsCount = agents.filter((a) => isAgentActive(a.status)).length;
  const stoppedAgentsCount = agents.filter((a) => !isAgentActive(a.status)).length;

  const filteredAgents = agents.filter((agent) => {
    const matchesDept = filterDept === 'all' || agent.department === filterDept;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.roleDescription.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = isAgentActive(agent.status);
    } else if (filterStatus === 'stopped') {
      matchesStatus = !isAgentActive(agent.status);
    }

    return matchesDept && matchesSearch && matchesStatus;
  });

  const handleDirectSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !directPrompt.trim()) return;
    onDirectTask(selectedAgent.id, directPrompt.trim());
    setDirectPrompt('');
    setSelectedAgent(null);
  };

  const handleAgentStatusChange = async (agentId: string, newStatus: AgentStatus) => {
    setUpdatingAgentId(agentId);
    try {
      const res = await fetch(`/api/agents/${agentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusNotification(`تم تحديث حالة الوكيل إلى [${newStatus === 'active' ? '🔵 نشط ومستعد' : '🟡 متوقف / محظور'}]`);
        setTimeout(() => setStatusNotification(null), 3500);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to change agent status:', err);
    } finally {
      setUpdatingAgentId(null);
    }
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'paused') => {
    setBulkUpdating(true);
    try {
      const res = await fetch('/api/agents/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusNotification(`تم تطبيق التحديث المجمع (${newStatus === 'active' ? '🔵 تفعيل الكل' : '🟡 إيقاف مؤقت للكل'})`);
        setTimeout(() => setStatusNotification(null), 3500);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Bulk update error:', err);
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fleet Overview Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-wide">أسطول وكلاء الذكاء الاصطناعي المتخصص 24/7</h2>
            
            {/* Status Summary Pills */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-blue-950/80 text-blue-300 border border-blue-600/70 font-semibold shadow-sm shadow-blue-500/10">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span>🔵 {activeAgentsCount} نشط ومستعد</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-300 border border-amber-600/70 font-semibold shadow-sm shadow-amber-500/10">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>🟡 {stoppedAgentsCount} متوقف / محظور</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">
            تحكم كامل في تفعيل أو إيقاف أي وكيل فورياً، مع توجيه مباشر، وذاكرة مشتركة، وتنسيق عمل حقيقي متعدد الفرق.
          </p>
        </div>

        {/* Global Bulk Control & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Real Connectivity Test Button */}
          <button
            id="btn-test-fleet-connectivity"
            onClick={handleTestAllAgents}
            disabled={testingFleet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/70 text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-950/40"
            title="فحص الاتصال الفعلي لجميع وكلاء الأسطول الـ 14 بمحرك الذكاء الاصطناعي والمفاتيح المعتمدة"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-400 fill-emerald-400 ${testingFleet ? 'animate-bounce' : ''}`} />
            <span>{testingFleet ? 'جارٍ الفحص الحي...' : '⚡ فحص الاتصال الحي للأسطول'}</span>
          </button>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => handleBulkStatusChange('active')}
              disabled={bulkUpdating}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-700/60 text-xs font-mono font-medium transition-all disabled:opacity-50"
              title="تفعيل وتشغيل جميع وكلاء الأسطول فورياً"
            >
              <Play className="w-3 h-3 text-blue-400 fill-blue-400" />
              <span>تفعيل الكل 🔵</span>
            </button>
            <button
              onClick={() => handleBulkStatusChange('paused')}
              disabled={bulkUpdating}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 text-xs font-mono font-medium transition-all disabled:opacity-50"
              title="إيقاف جميع الوكلاء مؤقتاً لحالات الصيانة أو الفحص"
            >
              <Pause className="w-3 h-3 text-amber-400" />
              <span>إيقاف الكل 🟡</span>
            </button>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                filterStatus === 'all'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الكل ({agents.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-all ${
                filterStatus === 'active'
                  ? 'bg-blue-950 text-blue-300 border border-blue-700/60 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>النشطة ({activeAgentsCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('stopped')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-all ${
                filterStatus === 'stopped'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700/60 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>المتوقفة ({stoppedAgentsCount})</span>
            </button>
          </div>

          {/* Department Filter & Search */}
          <input
            type="text"
            placeholder="بحث في الوكلاء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans w-36 sm:w-44"
          />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-sans"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'جميع الأقسام' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Status Toast Banner */}
      {statusNotification && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusNotification}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="text-zinc-400 hover:text-white font-mono text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Fleet Live Connectivity Diagnostic Panel */}
      {fleetReport && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-emerald-600/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>تقرير فحص الاتصال والنشاط الفعلي لأسطول الذكاء الاصطناعي</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    🟢 {fleetReport.connectedCount + fleetReport.degradedCount} / {fleetReport.totalAgents} متصلون
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  المحرك النشط: <strong className="text-emerald-300">{fleetReport.activeAiModel}</strong> | متوسط زمن الاستجابة: <strong className="text-emerald-300">{fleetReport.geminiLatencyMs}ms</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFleetReport(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-mono px-2 py-1 rounded bg-zinc-800"
              >
                إغلاق التقرير ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
              <span className="text-zinc-500 text-[10px] block">إجمالي الوكلاء</span>
              <span className="text-sm font-bold text-white">{fleetReport.totalAgents} وكلاء</span>
            </div>
            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-center">
              <span className="text-emerald-400 text-[10px] block">متصلون وجاهزون</span>
              <span className="text-sm font-bold text-emerald-300">🟢 {fleetReport.connectedCount}</span>
            </div>
            <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-center">
              <span className="text-amber-400 text-[10px] block">بانتظار مفاتيح اختيارية</span>
              <span className="text-sm font-bold text-amber-300">🟡 {fleetReport.degradedCount}</span>
            </div>
            <div className="p-2 rounded bg-red-950/40 border border-red-800/40 text-center">
              <span className="text-red-400 text-[10px] block">محظور / غير متصل</span>
              <span className="text-sm font-bold text-red-300">🔴 {fleetReport.blockedCount}</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 font-mono">
            {fleetReport.summary}
          </p>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const Icon = ICON_MAP[agent.iconName] || Cpu;
          const isManager = agent.id === 'manager';
          const isActive = isAgentActive(agent.status);
          const isUpdating = updatingAgentId === agent.id;

          return (
            <div
              key={agent.id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                !isActive
                  ? 'bg-zinc-900/50 border-amber-900/50 opacity-90'
                  : isManager
                  ? 'bg-gradient-to-b from-blue-950/20 via-zinc-900 to-zinc-900 border-blue-700/50 shadow-lg'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                {/* Agent Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                        !isActive
                          ? 'bg-amber-950/50 text-amber-400 border border-amber-800/60'
                          : isManager
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {agent.name}
                        {isManager && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                            القائد المركزي
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">{agent.title}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                      agent.status === 'working'
                        ? 'bg-blue-950 text-blue-300 border border-blue-500 animate-pulse'
                        : agent.status === 'blocked'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : agent.status === 'paused'
                        ? 'bg-amber-950 text-amber-300 border border-amber-600/70'
                        : 'bg-blue-950/80 text-blue-300 border border-blue-600/70'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-blue-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    ></span>
                    <span>
                      {agent.status === 'working'
                        ? '🔵 يعمل الآن'
                        : agent.status === 'blocked'
                        ? '🛑 محظور'
                        : agent.status === 'paused'
                        ? '🟡 متوقف'
                        : '🔵 نشط ومستعد'}
                    </span>
                  </span>
                </div>

                {/* Role Description */}
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  {agent.roleDescription}
                </p>

                {/* Capabilities Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {agent.capabilities.slice(0, 3).map((cap, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400"
                    >
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="text-[10px] font-mono text-zinc-500 self-center">
                      +{agent.capabilities.length - 3} أخرى
                    </span>
                  )}
                </div>

                {/* Last Agent Log Excerpt */}
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mb-1">
                    <Clock className="w-3 h-3" />
                    <span>آخر نشاط مسجل:</span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-300 truncate">
                    {agent.lastLog || 'متزامن مع مسار المراقبة 24/7.'}
                  </p>
                </div>
              </div>

              {/* Stats & Actions Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>
                    المهام: <strong className="text-zinc-200">{agent.completedTasksCount}</strong>
                  </span>
                  <span>
                    مستوى الثقة: <strong className="text-emerald-400">{agent.confidenceScore}%</strong>
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    القسم: {agent.department}
                  </span>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {/* Quick Live Test Button for this agent */}
                  <button
                    onClick={() => handleTestSingleAgent(agent.id)}
                    disabled={testingSingleAgentId === agent.id}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 text-xs font-mono font-medium transition-all disabled:opacity-40"
                    title="فحص الاتصال الحي بهذا الوكيل تحديداً"
                  >
                    <Zap className={`w-3.5 h-3.5 ${testingSingleAgentId === agent.id ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Status Toggle Button: Play / Pause */}
                  {isActive ? (
                    <button
                      onClick={() => handleAgentStatusChange(agent.id, 'paused')}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-xs font-mono font-medium transition-all disabled:opacity-40"
                      title="إيقاف هذا الوكيل مؤقتاً"
                    >
                      <Pause className="w-3 h-3" />
                      <span>إيقاف مؤقت 🟡</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAgentStatusChange(agent.id, 'active')}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-700/70 text-xs font-mono font-bold transition-all disabled:opacity-40 shadow-sm"
                      title="تشغيل وتفعيل الوكيل فورياً"
                    >
                      <Play className="w-3 h-3 fill-blue-400" />
                      <span>تشغيل وتفعيل 🔵</span>
                    </button>
                  )}

                  {/* Direct Task Button */}
                  <button
                    id={`btn-task-agent-${agent.id}`}
                    onClick={() => setSelectedAgent(agent)}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-medium transition-all"
                  >
                    <Send className="w-3 h-3 text-emerald-400" />
                    <span>تكليف مباشر</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Live Connectivity Diagnostic Modal */}
      {selectedReportAgent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-emerald-700/60 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>تقرير الفحص الحي: {selectedReportAgent.agentName}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                      {selectedReportAgent.symbol} {selectedReportAgent.overallStatus.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">{selectedReportAgent.title} | {selectedReportAgent.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportAgent(null)}
                className="text-zinc-400 hover:text-white text-sm font-mono px-2 py-1 rounded bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Primary Brain Status */}
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>محرك الذكاء الاصطناعي المركزي (Primary AI Brain):</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedReportAgent.primaryBrain.connected ? `🟢 متصل (${selectedReportAgent.primaryBrain.latencyMs}ms)` : '🔴 غير متصل'}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400">
                النموذج: <strong className="text-zinc-200">{selectedReportAgent.primaryBrain.model}</strong>
              </p>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800/80 text-xs font-mono text-emerald-300/90 leading-relaxed">
                <span className="text-zinc-500 block text-[10px] mb-1">الاستجابة التشخيصية الحية (Live Diagnostic Ping):</span>
                "{selectedReportAgent.primaryBrain.diagnosticResponse}"
              </div>
            </div>

            {/* Mapped Integrations */}
            {selectedReportAgent.providerIntegrations.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-zinc-300 font-mono">المفاتيح والربط الخارجي المعتمد لهذا الوكيل:</h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedReportAgent.providerIntegrations.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.symbol}</span>
                        <span className="font-bold text-zinc-200">{p.label}</span>
                        <span className="text-[10px] text-zinc-500">({p.key})</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        p.status === 'valid'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : p.isOptional
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {p.status === 'valid' ? 'صالح ومعتمد 🟢' : p.isOptional ? 'اختياري 🟡' : 'مطلوب 🔴'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Capabilities */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-300 font-mono">القدرات المؤكدة والجاهزة للتكليف:</h5>
              <div className="flex flex-wrap gap-1.5">
                {selectedReportAgent.verifiedCapabilities.map((cap, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                  >
                    ✓ {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedReportAgent(null)}
                className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetAgent = agents.find((a) => a.id === selectedReportAgent.agentId);
                  setSelectedReportAgent(null);
                  if (targetAgent) setSelectedAgent(targetAgent);
                }}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>تكليف مهمة مباشرة الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Tasking Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>تكليف مهمة مباشرة لـ {selectedAgent.name}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">{selectedAgent.title}</p>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-zinc-400 hover:text-white text-sm font-mono px-2 py-1 rounded bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
              <p className="font-semibold text-zinc-200">القدرات والمهام الرئيسية:</p>
              <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
                {selectedAgent.capabilities.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleDirectSubmit} className="space-y-3">
              <label className="block text-xs font-mono text-zinc-300">
                التوجيه والتعليمات لـ {selectedAgent.name}:
              </label>
              <textarea
                value={directPrompt}
                onChange={(e) => setDirectPrompt(e.target.value)}
                placeholder={`أدخل التوجيهات الدقيقة والمحددة لـ ${selectedAgent.name}...`}
                rows={4}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 text-xs font-mono font-medium hover:bg-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!directPrompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تنفيذ التكليف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
