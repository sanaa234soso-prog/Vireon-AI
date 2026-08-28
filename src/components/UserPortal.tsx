import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Server,
  ShieldCheck,
  Zap,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Lock,
  User,
  Key,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sliders,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  LogOut,
  ShoppingBag,
  Cpu,
} from 'lucide-react';
import { UserWebsite, UserAccount, UserProjectCredential, UserAgentInstruction } from '../types';

interface UserPortalProps {
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount, token: string) => void;
  onLogout: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  // Auth Form State (When not logged in)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // User Dashboard State
  const [websites, setWebsites] = useState<UserWebsite[]>([]);
  const [loadingWebsites, setLoadingWebsites] = useState(false);
  const [selectedSite, setSelectedSite] = useState<UserWebsite | null>(null);

  // Register New Website Modal State
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [siteCategory, setSiteCategory] = useState<UserWebsite['category']>('e_commerce');
  const [siteEnvironment, setSiteEnvironment] = useState<UserWebsite['environment']>('production');
  const [siteDesc, setSiteDesc] = useState('');
  const [siteWebhook, setSiteWebhook] = useState('');
  const [siteApiKey, setSiteApiKey] = useState('');

  // AI Assistant for User Website State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInstructions, setAiInstructions] = useState<UserAgentInstruction[]>([]);

  // Load Data when User is logged in
  useEffect(() => {
    if (currentUser) {
      fetchUserWebsites();
      fetchUserInstructions();
    }
  }, [currentUser]);

  const fetchUserWebsites = async () => {
    setLoadingWebsites(true);
    try {
      const res = await fetch('/api/user/websites');
      const data = await res.json();
      if (data.success && data.data) {
        setWebsites(data.data);
        if (data.data.length > 0 && !selectedSite) {
          setSelectedSite(data.data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch user websites:', e);
    } finally {
      setLoadingWebsites(false);
    }
  };

  const fetchUserInstructions = async () => {
    try {
      const res = await fetch('/api/user/agent/history');
      const data = await res.json();
      if (data.success && data.data) {
        setAiInstructions(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch user instructions:', e);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword, name: authName, companyName: authCompany };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.session) {
        onLoginSuccess(data.session.user, data.session.token);
      } else {
        setAuthError(data.message || 'فشلت عملية المصادقة.');
      }
    } catch (err: any) {
      setAuthError(`خطأ في الاتصال: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoUserLogin = async () => {
    setAuthEmail('merchant@storeflow.io');
    setAuthPassword('DemoUser123!');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'merchant@storeflow.io', password: 'DemoUser123!' }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        onLoginSuccess(data.session.user, data.session.token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !siteUrl.trim()) return;

    try {
      const res = await fetch('/api/user/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: siteName.trim(),
          url: siteUrl.trim(),
          category: siteCategory,
          environment: siteEnvironment,
          description: siteDesc.trim(),
          webhookUrl: siteWebhook.trim(),
          apiKey: siteApiKey.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddSiteModal(false);
        setSiteName('');
        setSiteUrl('');
        setSiteDesc('');
        setSiteWebhook('');
        setSiteApiKey('');
        fetchUserWebsites();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteWebsite = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف موقعك "${name}" وجميع بياناته المعزولة؟`)) return;

    try {
      const res = await fetch(`/api/user/websites/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (selectedSite?.id === id) setSelectedSite(null);
        fetchUserWebsites();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendAiPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    setAiLoading(true);
    try {
      const res = await fetch('/api/user/agent/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: selectedSite?.id,
          instruction: aiPrompt.trim(),
          siteContext: selectedSite
            ? { name: selectedSite.name, url: selectedSite.url, category: selectedSite.category }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiPrompt('');
        fetchUserInstructions();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // If NOT Logged In: Show Clean Login & Signup Screen
  if (!currentUser) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">بوابة المستخدمين والمتاجر المستقلة</h2>
            <p className="text-xs text-zinc-400">
              سجل موقعك، متجرك، أو تطبيقك لإدارته بأمان تام وعزل كامل لبياناتك ومشروعاتك.
            </p>
          </div>

          {/* Auth Tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'login' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'register' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: طارق المنصور"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">اسم المتجر أو المؤسسة:</label>
                  <input
                    type="text"
                    placeholder="مثال: متجر ستور فلو للأزياء"
                    value={authCompany}
                    onChange={(e) => setAuthCompany(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">البريد الإلكتروني:</label>
              <input
                type="email"
                required
                placeholder="your-name@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">كلمة المرور:</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري التحقق والتسجيل...
                </>
              ) : authMode === 'login' ? (
                'تسجيل الدخول الآمن'
              ) : (
                'إنشاء الحساب وبدء ربط الموقع'
              )}
            </button>
          </form>

          {/* Fast Test / Demo Switcher */}
          <div className="pt-3 border-t border-zinc-800 text-center space-y-2">
            <span className="text-[11px] text-zinc-500">للاختبار السريع كـ مستخدم مستقل:</span>
            <button
              type="button"
              onClick={handleDemoUserLogin}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              دخول تجريبي بحساب تاجر مستقل (StoreFlow Merchant)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN USER DASHBOARD
  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* User Dashboard Header & Tenant Isolation Banner */}
      <div className="bg-gradient-to-l from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-xl font-bold shadow-lg border border-emerald-400/30">
              {currentUser.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-semibold">
                  {currentUser.companyName || 'مستخدم معتمد'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>عزل بيانات كامل (Zero-Leakage Multi-Tenant Isolation)</span>
            </div>

            <button
              onClick={() => setShowAddSiteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              تسجيل موقع / متجر جديد
            </button>

            <button
              onClick={onLogout}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl border border-zinc-700 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Websites List + AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Registered Websites Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              المواقع والمتاجر المسجلة الخاصة بك ({websites.length})
            </h2>

            <button
              onClick={fetchUserWebsites}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingWebsites ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {websites.length === 0 ? (
            <div className="p-10 bg-zinc-900/60 border border-dashed border-zinc-800 rounded-2xl text-center space-y-4">
              <Globe className="w-12 h-12 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <div className="text-base font-bold text-white">لم تقم بتسجيل أي موقع أو متجر بعد</div>
                <p className="text-xs text-zinc-400">
                  أضف موقعك الإلكتروني أو متجرك الآن لتفعيل المراقبة اللحظية والاستعانة بالوكيل الذكي.
                </p>
              </div>
              <button
                onClick={() => setShowAddSiteModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                + تسجيل موقعك الأول
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {websites.map((site) => {
                const isSelected = selectedSite?.id === site.id;
                return (
                  <div
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                      isSelected
                        ? 'bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {site.name}
                          <span className="px-2 py-0.2 bg-zinc-800 text-zinc-300 text-[10px] rounded font-mono">
                            {site.category}
                          </span>
                        </div>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          {site.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWebsite(site.id, site.name);
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="حذف الموقع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {site.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{site.description}</p>
                    )}

                    {/* Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center text-xs">
                      <div className="p-2 bg-zinc-950 rounded-xl">
                        <div className="text-[10px] text-zinc-500">نسبة الجاهزية</div>
                        <div className="font-bold text-emerald-400">{site.uptimePercent}%</div>
                      </div>
                      <div className="p-2 bg-zinc-950 rounded-xl">
                        <div className="text-[10px] text-zinc-500">زمن الاستجابة</div>
                        <div className="font-bold text-cyan-400">{site.latencyMs}ms</div>
                      </div>
                      <div className="p-2 bg-zinc-950 rounded-xl">
                        <div className="text-[10px] text-zinc-500">درجة الصحة</div>
                        <div className="font-bold text-white">{site.healthScore}/100</div>
                      </div>
                    </div>

                    {site.aiRecommendations && site.aiRecommendations.length > 0 && (
                      <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">توصية: {site.aiRecommendations[0].title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant for Selected Website */}
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                مساعد الذكاء الاصطناعي الخاص بموقعك
              </h3>
              <p className="text-xs text-zinc-400">
                {selectedSite ? (
                  <>
                    التركيز الحالي: <span className="font-semibold text-emerald-300">{selectedSite.name}</span>
                  </>
                ) : (
                  'اختر موقعاً من القائمة لإجراء الفحص الذكي'
                )}
              </p>
            </div>

            {/* AI Prompt Input */}
            <form onSubmit={handleSendAiPrompt} className="space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="اطلب من الوكيل فحص موقعك، تدقيق الأمان، تحسين معدل التحويل، أو توليد كود الـ API..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
              />

              <button
                type="submit"
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    جاري التحليل البرمجي لموقعك...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    استشارة الوكيل الذكي
                  </>
                )}
              </button>
            </form>

            {/* Quick Prompts */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] text-zinc-500">أسئلة شائعة لموقعك:</span>
              {[
                'كيف أحسن زمن استجابة الـ API لمتجري؟',
                'افحص إعدادات الـ Webhook وأمان الدفع',
                'اقترح تحسينات SEO لزيادة الزيارات',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setAiPrompt(p)}
                  className="w-full text-right p-2 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 text-xs rounded-lg border border-zinc-800/80 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* AI Instruction History */}
            {aiInstructions.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="text-xs font-bold text-zinc-400">سجل استشاراتك السابقة:</div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {aiInstructions.map((inst) => (
                    <div key={inst.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-2">
                      <div className="font-semibold text-white">س: {inst.instruction}</div>
                      {inst.response && (
                        <div className="text-zinc-300 whitespace-pre-line text-[11px] bg-zinc-900/60 p-2.5 rounded-lg leading-relaxed border border-zinc-800/60">
                          {inst.response}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REGISTER WEBSITE MODAL */}
      {showAddSiteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-5 text-right shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                تسجيل موقع أو متجر جديد في حسابك المعزول
              </h3>
              <button onClick={() => setShowAddSiteModal(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterWebsite} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">اسم الموقع / المتجر:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: متجر الإلكترونيات المتقدم"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">رابط الموقع (URL):</label>
                <input
                  type="text"
                  required
                  placeholder="https://my-store.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">فئة المنصة:</label>
                  <select
                    value={siteCategory}
                    onChange={(e) => setSiteCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none"
                  >
                    <option value="e_commerce">🛒 متجر تجارة إلكترونية (E-commerce)</option>
                    <option value="custom_website">🌐 موقع ويب مستقل (Custom Website)</option>
                    <option value="web_app">💻 تطبيق ويب (SaaS / Web App)</option>
                    <option value="wordpress_shopify">🛍️ Shopify / WooCommerce / WP</option>
                    <option value="mobile_backend">📱 باكيند تطبيق جوال (Mobile API)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">البيئة:</label>
                  <select
                    value={siteEnvironment}
                    onChange={(e) => setSiteEnvironment(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none"
                  >
                    <option value="production">🚀 الإنتاج المباشر (Production)</option>
                    <option value="staging">🧪 بيئة المعاينة (Staging)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">مفتاح API خاص بموقعك (اختياري، مشفر معزول):</label>
                <input
                  type="password"
                  placeholder="أدخل مفتاح الـ API لموقعك إذا كان متوفراً..."
                  value={siteApiKey}
                  onChange={(e) => setSiteApiKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">وصف مختصر:</label>
                <textarea
                  rows={2}
                  placeholder="نبذة عن طبيعة الموقع وما يقدمه..."
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  تسجيل وربط الموقع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
