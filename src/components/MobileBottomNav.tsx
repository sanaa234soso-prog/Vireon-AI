import { useState } from 'react';
import {
  Terminal,
  Users,
  GitPullRequest,
  Shield,
  Menu,
  X,
  Lock,
  Cpu,
  Palette,
  Brain,
  Activity,
  CreditCard,
  FileText,
  Rocket,
  Download,
  Sparkles,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  onOpenInstallModal: () => void;
}

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  onOpenInstallModal,
}: MobileBottomNavProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mainBottomTabs = [
    { id: 'owner_command', label: 'لوحة المالك', icon: Shield },
    { id: 'command', label: 'القيادة', icon: Terminal },
    { id: 'agents', label: 'الأسطول', icon: Users },
    { id: 'deploy', label: 'النشر', icon: Rocket },
    {
      id: 'approvals',
      label: 'الموافقات',
      icon: Shield,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
  ];

  const drawerTabs = [
    { id: 'owner_command', label: 'لوحة المالك (Owner Executive)', icon: Shield, dept: 'أوامر مباشرة والمفاتيح' },
    { id: 'user_portal', label: 'بوابة المستخدمين والمتاجر', icon: Users, dept: 'عزل تام للمشروعات' },
    { id: 'workforce', label: 'AI Workforce (10 فرق متكاملة)', icon: Sparkles, dept: 'AI CTO & Orchestrator' },
    { id: 'selfhealing', label: 'الاستشفاء الذاتي (10 مراحل)', icon: Activity, dept: 'Auto-Remediation' },
    { id: 'learning', label: 'التعلم والمعرفة المشتركة', icon: Brain, dept: 'Evolution Engine' },
    { id: 'multiapp', label: 'التطبيقات والمواقع المتعددة', icon: Rocket, dept: 'Multi-App Hub' },
    { id: 'observability', label: 'المراقبة وسجلات التدقيق والنسخ', icon: Shield, dept: 'Enterprise Audit' },
    { id: 'tasks', label: 'خط سير المهام (Pipelines)', icon: GitPullRequest, dept: 'إدارة العمليات' },
    { id: 'workers', label: 'عمال الخلفية 24/7 (Queue Workers)', icon: Cpu, dept: 'المعالجة غير المتزامنة' },
    { id: 'frontend', label: 'مصمم الواجهات (Design Studio)', icon: Palette, dept: 'واجهات فاخرة' },
    { id: 'memory', label: 'الذاكرة المشتركة (Blackboard)', icon: Brain, dept: 'تزامن الأسطول' },
    { id: 'watchdog', label: 'المراقب الذاتي 24/7 (Watchdog)', icon: Activity, dept: 'الأداء والأمان' },
    { id: 'payments', label: 'مدفوعات Whop والمتجر', icon: CreditCard, dept: 'المالية والمبيعات' },
    { id: 'integrations', label: 'خزنة الرموز والمواقع المتصلة', icon: Lock, dept: 'Zero-Trust Vault' },
    { id: 'logs', label: 'سجلات النظام الحية', icon: FileText, dept: 'التدقيق الشامل' },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Native App Bottom Navigation Bar for Mobile (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 pb-safe shadow-2xl">
        <div className="flex items-center justify-around">
          {mainBottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-600 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>
                )}
              </button>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isDrawerOpen ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">المزيد</span>
          </button>
        </div>
      </div>

      {/* Drawer Overlay for Additional Tabs */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Drawer Header with App Info & Close */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  V
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">أقسام تطبيق فايريون</h4>
                  <span className="text-[10px] font-mono text-zinc-400">مركز القيادة المتكامل 24/7</span>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Install Banner in Drawer */}
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                onOpenInstallModal();
              }}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-zinc-900 border border-emerald-500/40 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-300 block">تثبيت التطبيق على جهازك</span>
                  <span className="text-[10px] text-zinc-400">تشغيل كتطبيق هاتف أصلي بملء الشاشة</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </button>

            {/* Tabs List */}
            <div className="grid grid-cols-1 gap-2">
              {drawerTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all ${
                      isActive
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-white font-bold'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-emerald-500 text-black'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{item.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{item.dept}</span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        نشط حالياً
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
