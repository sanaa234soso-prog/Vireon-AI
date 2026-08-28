import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  GitCommit,
  GitPullRequest,
  Globe,
  Activity,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  Lock,
  Zap,
  Server,
  Key,
  DollarSign,
  TrendingUp,
  Clock,
  Terminal,
  Cpu,
} from 'lucide-react';
import {
  PrivateAdvisorMessage,
  AdvisorPulseStatus,
  AdvisorAgentAssignment,
  PrivateAdvisorExecutionResult,
} from '../types';

interface PrivateAiAdvisorProps {
  onNavigateToLedger?: () => void;
  onNavigateToSecrets?: () => void;
  onRefreshParentData?: () => void;
}

export const PrivateAiAdvisor: React.FC<PrivateAiAdvisorProps> = ({
  onNavigateToLedger,
  onNavigateToSecrets,
  onRefreshParentData,
}) => {
  const [messages, setMessages] = useState<PrivateAdvisorMessage[]>([]);
  const [pulse, setPulse] = useState<AdvisorPulseStatus | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/advisor/history');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Error fetching advisor history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchPulse = async () => {
    try {
      const res = await fetch('/api/advisor/pulse');
      const data = await res.json();
      if (data.success && data.data) {
        setPulse(data.data);
      }
    } catch (err) {
      console.error('Error fetching advisor pulse:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchPulse();
    const interval = setInterval(fetchPulse, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const tempUserMsg: PrivateAdvisorMessage = {
      id: `temp-${Date.now()}`,
      sender: 'owner',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsSending(true);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          autoExecute,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        // Replace temp or re-fetch full history
        fetchHistory();
        fetchPulse();
        if (onRefreshParentData) onRefreshParentData();
      } else {
        setStatusNotice(data.error || 'تعذر إرسال التوجيه إلى المستشار الخاص.');
      }
    } catch (err: any) {
      setStatusNotice(err.message || 'خطأ في الاتصال بالخادم.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('هل أنت متأكد من إعادة تهيئة سجل محادثات المستشار التنفيذي الخاص؟')) return;
    try {
      await fetch('/api/advisor/clear', { method: 'POST' });
      fetchHistory();
      fetchPulse();
    } catch (err) {
      console.error('Error clearing advisor history:', err);
    }
  };

  const quickPrompts = [
    '🔍 فحص شامل للموقع الحي والمستودع على GitHub (Full Diagnostic)',
    '🚀 تطبيق إصلاحات وتحسينات الأداء والنشر الحي (Deploy Hotfix)',
    '🛡️ تدقيق أمني شامل ومسح الثغرات وحماية الأسرار (Security Sweep)',
    '💳 تدقيق مسارات الدفع وتوقيعات Whop Webhooks (Whop Audit)',
    '🎨 تحسين وتناسق الواجهات الأمامية عبر AI Frontend (UI/UX Review)',
    '⚡ إنشاء خادم مصغر جديد للخدمات المعزولة (Deploy Microservice)',
  ];

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* ======================================================== */}
      {/* TOP HEADER & EXECUTIVE PULSE BANNER                      */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl shadow-lg shadow-emerald-500/20 text-white flex items-center justify-center">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white tracking-tight">
                    المستشار التنفيذي الخاص للذكاء الاصطناعي (Private AI Advisor)
                  </h2>
                  <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    حساب المالك المعتمد (Owner-Only)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  شريكك الاستراتيجي والتنفيذي الذكي — متصل مباشرة بأسطول الوكلاء الـ 14 والمستودع البرمجي وخوادم النشر السحابي لتنفيذ الأوامر وتوثيق النتائج بأدلة حية.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchPulse();
                  fetchHistory();
                }}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تحديث البيانات اللحظية"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تحديث
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-700/60 hover:border-rose-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="إعادة تهيئة المحادثة"
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح السجل
              </button>
            </div>
          </div>

          {/* Pulse Live Metrics Bar */}
          {pulse && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-zinc-800/80">
              <div className="p-3 bg-zinc-950/70 border border-emerald-500/20 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  صحة المنظومة الحية
                </span>
                <div className="text-base font-black text-emerald-400">{pulse.healthScore}%</div>
                <span className="text-[10px] text-zinc-500">جاهزية تشغيلية كاملة</span>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-indigo-500/20 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  أسطول الوكلاء المتصل
                </span>
                <div className="text-base font-black text-indigo-300">{pulse.activeAgentsCount} وكلاء</div>
                <span className="text-[10px] text-zinc-500">مربوطين بالخطة الموحدة</span>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-cyan-500/20 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  الاتصالات والمفاتيح
                </span>
                <div className="text-base font-black text-cyan-300">{pulse.connectedApisCount} / 5 نشطة</div>
                <span className="text-[10px] text-zinc-500">GitHub, Vercel, Whop, AI</span>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-amber-500/20 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  إيرادات الـ 24 ساعة
                </span>
                <div className="text-base font-black text-amber-300">${pulse.revenue24h.toFixed(2)}</div>
                <span className="text-[10px] text-zinc-500">موثقة بتوقيع HMAC</span>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-zinc-700/40 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  حوادث الرادار
                </span>
                <div className="text-base font-black text-white">{pulse.openIncidentsCount} مفتوحة</div>
                <span className="text-[10px] text-zinc-500">Watchdog 24/7 Radar</span>
              </div>
            </div>
          )}

          {/* Strategic Actionable Guidance Callout */}
          {pulse && pulse.topStrategicAdvice && pulse.topStrategicAdvice.length > 0 && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-xs">
              <Zap className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-zinc-200">
                <span className="font-bold text-emerald-300">توصية المستشار الاستراتيجية اللحظية: </span>
                {pulse.topStrategicAdvice[0]}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN ADVISOR INTERACTION & CHAT CANVAS                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Conversation Stream (3 Cols) */}
        <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col h-[700px] shadow-xl overflow-hidden">
          {/* Chat Stream Header */}
          <div className="px-5 py-3.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>جلسة التوجيه والاستشارة التنفيذية المباشرة</span>
              <span className="text-zinc-500">({messages.length} رسالة)</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExecute}
                  onChange={(e) => setAutoExecute(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-emerald-500"
                />
                <span>تنفيذ الأوامر برمجياً وحياً تلقائياً (Auto-Execute)</span>
              </label>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {isLoadingHistory && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs">جاري تحميل سجل المستشار الخاص...</span>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'owner' ? 'items-end' : 'items-start'
                  } space-y-2`}
                >
                  {/* Sender Badge */}
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 px-1">
                    {msg.sender === 'owner' ? (
                      <>
                        <span>أنت (المالك والمسؤول الأعلى)</span>
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          <User className="w-3 h-3" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          <Bot className="w-3 h-3" />
                        </div>
                        <span className="text-indigo-400">Private AI Advisor (المستشار الخاص)</span>
                      </>
                    )}
                    <span className="text-zinc-600 font-mono text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[92%] md:max-w-[85%] rounded-2xl p-4.5 text-sm leading-relaxed ${
                      msg.sender === 'owner'
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-50 shadow-md'
                        : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Multi-Agent Delegation Plan Card */}
                    {msg.plan && (
                      <div className="mt-4 pt-3.5 border-t border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            خطة تفويض المهام وتوزيع الوكلاء الـ 14 (Agent Workforce Plan)
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-700/60 rounded text-[10px] text-indigo-300">
                            مستوى المخاطرة: {msg.plan.riskLevel}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400">{msg.plan.strategicAssessment}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {msg.plan.assignedAgents.map((agent, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white flex items-center gap-1">
                                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                                  {agent.agentName}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                    agent.status === 'verified_done'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                                  }`}
                                >
                                  {agent.status === 'verified_done' ? '✓ مكتمل وموثق' : 'مكلّف'}
                                </span>
                              </div>
                              <div className="text-zinc-300 text-[11px]">{agent.taskTitle}</div>
                              <div className="text-zinc-500 text-[10px]">{agent.actionRequired}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Real Verifiable Evidence Box */}
                    {msg.executionResult && (
                      <div className="mt-4 pt-3.5 border-t border-emerald-500/30 space-y-3 bg-zinc-950/90 p-4 rounded-xl border border-emerald-500/30">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            الأدلة والإثباتات الموثقة للتنفيذ الفعلي (Verifiable Live Evidence)
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Task: #{msg.executionResult.missionId}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                          {/* Commit Evidence */}
                          {msg.executionResult.commitSha && (
                            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <span className="text-zinc-400 block text-[10px]">GitHub Commit SHA:</span>
                              <span className="font-mono text-amber-300 font-bold block truncate">
                                {msg.executionResult.commitSha}
                              </span>
                              {msg.executionResult.commitUrl && (
                                <a
                                  href={msg.executionResult.commitUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-1"
                                >
                                  <GitCommit className="w-3 h-3" />
                                  عرض في المستودع ↗
                                </a>
                              )}
                            </div>
                          )}

                          {/* Vercel Evidence */}
                          {msg.executionResult.deploymentUrl && (
                            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <span className="text-zinc-400 block text-[10px]">نشر Vercel الحي:</span>
                              <a
                                href={msg.executionResult.deploymentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-cyan-300 hover:underline block truncate mt-0.5"
                              >
                                {msg.executionResult.deploymentUrl} ↗
                              </a>
                            </div>
                          )}

                          {/* Live Probe Evidence */}
                          {msg.executionResult.liveProbe && (
                            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <span className="text-zinc-400 block text-[10px]">فحص الاستجابة الحية:</span>
                              <span className="font-mono text-emerald-400 font-bold block mt-0.5">
                                HTTP {msg.executionResult.liveProbe.httpStatus} OK ({msg.executionResult.liveProbe.latencyMs}ms)
                              </span>
                              <span className="text-[10px] text-zinc-500">SSL شهادة مشفرة وصالحة</span>
                            </div>
                          )}
                        </div>

                        {/* Files Changed */}
                        {msg.executionResult.filesChanged && msg.executionResult.filesChanged.length > 0 && (
                          <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                            <span className="text-[11px] text-zinc-400 font-semibold block">
                              الملفات المعدلة فعلياً:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {msg.executionResult.filesChanged.map((f, fi) => (
                                <span
                                  key={fi}
                                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300"
                                >
                                  {f.filePath} <span className="text-emerald-400">+{f.linesAdded}</span>{' '}
                                  <span className="text-rose-400">-{f.linesRemoved}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Typing / Executing Indicator */}
            {isSending && (
              <div className="flex items-start gap-2 animate-pulse">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl text-xs text-zinc-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>المستشار الذكي يقوم بتحليل التوجيه، وتوزيع المهام على الوكلاء، وتنفيذ الإجراء الحقيقي...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Status Notice */}
          {statusNotice && (
            <div className="px-5 py-2 bg-rose-950/60 border-t border-rose-800/60 text-xs text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {statusNotice}
              </span>
              <button
                onClick={() => setStatusNotice(null)}
                className="text-xs text-rose-400 hover:text-white"
              >
                تجاهل
              </button>
            </div>
          )}

          {/* Input Console Bar */}
          <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="أدخل توجيهك الاستراتيجي أو طلب الفحص والإصلاح الفوري للمستشار الذكي..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 pl-10"
                  disabled={isSending}
                />
                <Terminal className="w-4 h-4 text-zinc-600 absolute left-3 top-3.5" />
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 rotate-180" />
                )}
                <span>إرسال وتفويض</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar: Quick Directives & Connected Workforce (1 Col) */}
        <div className="space-y-6">
          {/* Quick Directives Box */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>التوجيهات السريعة الجاهزة (Quick Directives)</span>
            </div>
            <p className="text-xs text-zinc-400">
              انقر على أي توجيه لإصداره فوراً للمستشار وتفويض الوكلاء بتنفيذه:
            </p>

            <div className="space-y-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isSending}
                  className="w-full text-right p-2.5 bg-zinc-900/80 hover:bg-zinc-850 hover:border-emerald-500/40 border border-zinc-800/80 rounded-xl text-xs text-zinc-300 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
                >
                  <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 shrink-0 mr-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>مفاتيح الإدارة التنفيذية</span>
            </div>

            {onNavigateToLedger && (
              <button
                onClick={onNavigateToLedger}
                className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  سجل الأدلة والإثباتات الموثقة (Full Ledger)
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            )}

            {onNavigateToSecrets && (
              <button
                onClick={onNavigateToSecrets}
                className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  خزنة المفاتيح والبيئة (Secret Vault)
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
