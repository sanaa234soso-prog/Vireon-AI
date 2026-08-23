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
} from 'lucide-react';
import { AgentProfile } from '../types.js';

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
};

interface AgentFleetGridProps {
  agents: AgentProfile[];
  onDirectTask: (agentId: string, instruction: string) => void;
}

export default function AgentFleetGrid({ agents, onDirectTask }: AgentFleetGridProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [directPrompt, setDirectPrompt] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = ['all', ...Array.from(new Set(agents.map((a) => a.department)))];

  const filteredAgents = agents.filter((agent) => {
    const matchesDept = filterDept === 'all' || agent.department === filterDept;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.roleDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleDirectSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !directPrompt.trim()) return;
    onDirectTask(selectedAgent.id, directPrompt.trim());
    setDirectPrompt('');
    setSelectedAgent(null);
  };

  return (
    <div className="space-y-6">
      {/* Fleet Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-wide">أسطول عملاء الذكاء الاصطناعي المتخصص 24/7</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
              13 عميلاً متصلاً ونشطاً
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            فريق متكامل يعمل بتنسيق ذاتي مع قاعدة بيانات موحدة، وصلاحيات معزولة، ومزامنة مراقبة حية 24/7.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="بحث في العملاء والأدوار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
          />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-sans"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'جميع الأقسام' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const Icon = ICON_MAP[agent.iconName] || Cpu;
          const isManager = agent.id === 'manager';

          return (
            <div
              key={agent.id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all hover:border-zinc-700 ${
                isManager
                  ? 'bg-gradient-to-b from-emerald-950/20 to-zinc-900 border-emerald-800/50 shadow-lg'
                  : 'bg-zinc-900/80 border-zinc-800'
              }`}
            >
              <div className="space-y-3">
                {/* Agent Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isManager
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {agent.name}
                        {isManager && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            القائد المركزي
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">{agent.title}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      agent.status === 'working'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    }`}
                  >
                    {agent.status === 'working' ? 'يعمل الآن' : 'نشط'}
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

              {/* Stats & Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span>
                    المهام: <strong className="text-zinc-200">{agent.completedTasksCount}</strong>
                  </span>
                  <span>
                    مستوى الثقة: <strong className="text-emerald-400">{agent.confidenceScore}%</strong>
                  </span>
                </div>

                <button
                  id={`btn-task-agent-${agent.id}`}
                  onClick={() => setSelectedAgent(agent)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-medium transition-all"
                >
                  تكليف مباشر
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
