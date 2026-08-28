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
  Download,
  Smartphone,
  Sparkles,
  Zap,
  BrainCircuit,
  Globe,
  HardDrive,
  Crown,
  Key,
  FolderSync,
} from 'lucide-react';
import { SystemOverview, UserAccount } from '../types.js';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  overview: SystemOverview | null;
  onSwitchEnv: (env: 'production' | 'staging') => void;
  pendingApprovalsCount: number;
  onOpenInstallModal?: () => void;
  currentUser?: UserAccount | null;
  isOwner?: boolean;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  overview,
  onSwitchEnv,
  pendingApprovalsCount,
  onOpenInstallModal,
  currentUser,
  isOwner = true,
}: NavigationProps) {
  const [envLoading, setEnvLoading] = useState(false);

  const navItems = [
    // 1. Private Owner Page (Only for Owner)
    ...(isOwner
      ? [
          {
            id: 'owner_command',
            label: 'لوحة تحكم المالك (Owner Page)',
            icon: Crown,
            badge: 'ROOT ONLY',
            highlight: true,
            isOwnerOnly: true,
          },
        ]
      : []),
    // 2. Separate Multi-Tenant User Portal
    {
      id: 'user_portal',
      label: 'بوابة المستخدمين والمواقع',
      icon: Globe,
      badge: 'Multi-Tenant',
      highlight: true,
    },
    // Platform Core Services
    { id: 'command', label: 'مركز القيادة الذاتي', icon: Terminal, badge: null },
    { id: 'workforce', label: 'AI Workforce (10 فرق)', icon: Sparkles, badge: 'AI CTO', highlight: true },
    { id: 'selfhealing', label: 'الاستشفاء الذاتي (10 مراحل)', icon: Zap, badge: 'GitHub + Vercel' },
    { id: 'opensourceai', label: 'النماذج المفتوحة و Sandbox', icon: Cpu, badge: 'Open-Source AI' },
    { id: 'learning', label: 'التعلم والمعرفة المشتركة', icon: BrainCircuit, badge: 'Evolution' },
    { id: 'multiapp', label: 'التطبيقات والمواقع المتعددة', icon: Globe, badge: 'Multi-App' },
    { id: 'observability', label: 'المراقبة والنسخ الاحتياطي', icon: HardDrive, badge: 'Audit & Backup' },
    { id: 'deploy', label: 'النشر وسلسلة CI/CD', icon: Rocket, badge: 'GitHub & Vercel' },
    { id: 'filesync', label: 'مزامنة الملفات (File Sync)', icon: FolderSync, badge: 'Live Sync', highlight: true },
    { id: 'agents', label: 'أسطول الوكلاء (14)', icon: Users, badge: overview?.activeAgentsCount ? `${overview.activeAgentsCount} نشط` : '14 نشط' },
    { id: 'workers', label: 'عمال الخلفية 24/7', icon: Cpu, badge: '6 عمال' },
    { id: 'frontend', label: 'مصمم الواجهات الفاخرة', icon: Palette, badge: 'RTL 100%' },
    { id: 'memory', label: 'الذاكرة المشتركة', icon: Brain, badge: null },
    { id: 'tasks', label: 'خط سير المهام', icon: GitPullRequest, badge: null },
    { id: 'watchdog', label: 'المراقب الذاتي 24/7', icon: Activity, badge: 'مباشر' },
    { id: 'approvals', label: 'موافقات المالك', icon: Shield, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null, alert: pendingApprovalsCount > 0 },
    { id: 'payments', label: 'مدفوعات Whop والمتجر', icon: CreditCard, badge: null },
    { id: 'integrations', label: 'خزنة الرموز والمواقع المتصلة', icon: Lock, badge: 'خزنة الرموز' },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg shadow-sm shadow-emerald-500/10">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">تطبيق فايريون</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-400 font-mono font-medium">
                PWA APP
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">مركز القيادة والعمليات الذاتية 24/7</p>
          </div>
        </div>

        {/* Live System Pulse & Owner Status & Install App Action */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Install App Button */}
          {onOpenInstallModal && (
            <button
              id="btn-install-app"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              title="تثبيت التطبيق على هاتفك أو جهازك"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>تثبيت التطبيق</span>
            </button>
          )}

          {/* Watchdog Status */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300 font-medium">المراقب:</span>
            <span className="text-emerald-400 font-mono font-semibold">
              {overview?.healthScore ? `${overview.healthScore}%` : 'جاهز'}
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
            <span className="hidden sm:inline">{overview?.activeEnvironment === 'production' ? 'الإنتاج (PROD)' : 'التجريبية (STAGE)'}</span>
            <span className="sm:hidden">{overview?.activeEnvironment === 'production' ? 'PROD' : 'STAGE'}</span>
          </button>

          {/* Super Admin / Owner Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <div className="text-right">
              <span className="text-xs font-semibold text-zinc-200 block leading-tight">المالك والمسؤول الأعلى</span>
              <span className="text-[10px] text-zinc-400 font-mono block leading-none">sadeksanae50@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Desktop / Tablet Scrollable Tabs) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 hidden md:block">
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
