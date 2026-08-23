import { useState } from 'react';
import {
  Shield,
  Activity,
  Terminal,
  Users,
  GitPullRequest,
  CreditCard,
  Lock,
  FileText,
  AlertTriangle,
  Radio,
  Server,
  Rocket,
  Cpu,
  Palette,
  Brain,
} from 'lucide-react';
import { SystemOverview } from '../types.js';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  overview: SystemOverview | null;
  onSwitchEnv: (env: 'production' | 'staging') => void;
  pendingApprovalsCount: number;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  overview,
  onSwitchEnv,
  pendingApprovalsCount,
}: NavigationProps) {
  const [envLoading, setEnvLoading] = useState(false);

  const navItems = [
    { id: 'command', label: 'مركز القيادة الذاتي', icon: Terminal, badge: null },
    { id: 'deploy', label: 'النشر وسلسلة CI/CD', icon: Rocket, badge: 'GitHub & Vercel', highlight: true },
    { id: 'agents', label: 'أسطول الذكاء الاصطناعي (14)', icon: Users, badge: overview?.activeAgentsCount ? `${overview.activeAgentsCount} نشط` : '14 نشط' },
    { id: 'workers', label: 'عمال الخلفية 24/7', icon: Cpu, badge: '6 عمال' },
    { id: 'frontend', label: 'مصمم الواجهات الفاخرة', icon: Palette, badge: 'RTL 100%' },
    { id: 'memory', label: 'الذاكرة المشتركة', icon: Brain, badge: null },
    { id: 'tasks', label: 'خط سير المهام', icon: GitPullRequest, badge: null },
    { id: 'watchdog', label: 'المراقب الذاتي 24/7', icon: Activity, badge: 'مباشر' },
    { id: 'approvals', label: 'موافقات المالك', icon: Shield, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null, alert: pendingApprovalsCount > 0 },
    { id: 'payments', label: 'مدفوعات Whop والمتجر', icon: CreditCard, badge: null },
    { id: 'integrations', label: 'التكاملات وخزنة الأمان', icon: Lock, badge: null },
    { id: 'logs', label: 'سجلات النظام', icon: FileText, badge: null },
  ];

  const handleEnvToggle = async () => {
    const nextEnv = overview?.activeEnvironment === 'production' ? 'staging' : 'production';
    setEnvLoading(true);
    try {
      await onSwitchEnv(nextEnv);
    } finally {
      setEnvLoading(false);
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 text-zinc-100 sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg shadow-sm">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base sm:text-lg">فايريون</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-400 font-mono font-medium">
                مركز قيادة الذكاء الاصطناعي
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">نظام العمليات والإدارة الذاتية 24/7 الخاص</p>
          </div>
        </div>

        {/* Live System Pulse & Owner Status */}
        <div className="flex items-center gap-3">
          {/* Watchdog Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300 font-medium">المراقب 24/7:</span>
            <span className="text-emerald-400 font-mono font-semibold">
              {overview?.healthScore ? `${overview.healthScore}% جاهزية كاملة` : 'متزامن'}
            </span>
          </div>

          {/* Environment Switcher */}
          <button
            id="btn-env-toggle"
            onClick={handleEnvToggle}
            disabled={envLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors ${
              overview?.activeEnvironment === 'production'
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/50'
            }`}
            title="التبديل بين بيئة الإنتاج المباشرة والبيئة التجريبية"
          >
            <Server className="w-3 h-3" />
            <span>{overview?.activeEnvironment === 'production' ? 'الإنتاج (PRODUCTION)' : 'التجريبية (STAGING)'}</span>
          </button>

          {/* Super Admin / Owner Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <div className="text-right">
              <span className="text-xs font-semibold text-zinc-200 block leading-tight">المالك والمسؤول الأعلى</span>
              <span className="text-[10px] text-zinc-400 font-mono block leading-none">sadeksanae50@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 space-x-reverse overflow-x-auto py-1 scrollbar-none" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-md whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-emerald-400 text-white bg-zinc-900/80 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      item.alert
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isActive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
