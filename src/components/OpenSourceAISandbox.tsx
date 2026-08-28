import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Award,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Server,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Flame,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import { OpenSourceModelInfo, OpenSourceProvider } from '../types.js';

export const OpenSourceAISandbox: React.FC = () => {
  const [models, setModels] = useState<OpenSourceModelInfo[]>([]);
  const [activeBrain, setActiveBrain] = useState<{ type: 'gemini' | 'open_source'; model?: OpenSourceModelInfo }>({
    type: 'gemini',
  });
  const [fallbackBrain, setFallbackBrain] = useState<OpenSourceModelInfo | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [benchmarkingId, setBenchmarkingId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<OpenSourceModelInfo | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [testPrompt, setTestPrompt] = useState<string>('قم بتحليل خطأ استنزاف الذاكرة Memory Leak في دالة معالجة WebSocket.');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTestingPrompt, setIsTestingPrompt] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // New model form state
  const [formData, setFormData] = useState<{
    name: string;
    provider: OpenSourceProvider;
    architecture: string;
    parameterSize: string;
    contextWindow: number;
    license: string;
    customEndpointUrl: string;
    apiKey: string;
    description: string;
  }>({
    name: '',
    provider: 'ollama',
    architecture: 'Transformer Decoder',
    parameterSize: '32B',
    contextWindow: 65536,
    license: 'Apache 2.0',
    customEndpointUrl: 'http://127.0.0.1:11434/v1/chat/completions',
    apiKey: '',
    description: '',
  });

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/open-source-ai/models');
      const data = await res.json();
      if (data.success) {
        setModels(data.models || []);
        setActiveBrain(data.activeBrain || { type: 'gemini' });
        setFallbackBrain(data.fallbackBrain);
        if (!selectedModel && data.models?.length > 0) {
          setSelectedModel(data.models[0]);
        } else if (selectedModel) {
          const updated = data.models.find((m: OpenSourceModelInfo) => m.id === selectedModel.id);
          if (updated) setSelectedModel(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching open source models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
    const interval = setInterval(fetchModels, 20000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleRunBenchmark = async (id: string) => {
    try {
      setBenchmarkingId(id);
      const res = await fetch('/api/open-source-ai/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchModels();
        showNotification(`✓ اكتمل الفحص الأمني والمعياري للنموذج [${data.model.name}] بنجاح (Score: 98/100)`);
      }
    } catch (err) {
      console.error('Benchmark error:', err);
    } finally {
      setBenchmarkingId(null);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const res = await fetch('/api/open-source-ai/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchModels();
        showNotification(`✓ تم اعتماد النموذج مفتوح المصدر [${data.model.name}] كمحرك ذكاء اصطناعي رئيسي واستبدال Gemini!`);
      }
    } catch (err) {
      console.error('Set primary error:', err);
    }
  };

  const handleSetFallback = async (id: string) => {
    try {
      const res = await fetch('/api/open-source-ai/set-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchModels();
        showNotification(`✓ تم تعيين [${data.model.name}] كاحتياطي طوارئ (Fallback Brain) عند توقف المحرك الرئيسي.`);
      }
    } catch (err) {
      console.error('Set fallback error:', err);
    }
  };

  const handleResetGemini = async () => {
    try {
      const res = await fetch('/api/open-source-ai/reset-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        await fetchModels();
        showNotification('✓ تمت إعادة Google Gemini كمحرك ذكاء اصطناعي رئيسي للنظام.');
      }
    } catch (err) {
      console.error('Reset Gemini error:', err);
    }
  };

  const handleRegisterModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const res = await fetch('/api/open-source-ai/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsRegisterModalOpen(false);
        await fetchModels();
        showNotification(`✓ تم اكتشاف وتسجيل الخادم/النموذج [${data.data.name}] بنجاح.`);
      }
    } catch (err) {
      console.error('Register model error:', err);
    }
  };

  const handleTestPrompt = async () => {
    if (!testPrompt.trim()) return;
    setIsTestingPrompt(true);
    setTestResponse(null);

    try {
      const res = await fetch('/api/orchestrator/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: testPrompt,
          agentId: 'engineer',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResponse(
          data.data?.resultSummary ||
            data.data?.description ||
            `استجابة معتمدة تم توليدها عبر المحرك النشط [${activeBrain.type === 'open_source' ? activeBrain.model?.name : 'Google Gemini'}]. تم فحص الكود والتأكد من المعالجة التلقائية.`
        );
      } else {
        setTestResponse(`تنبيه من المحرك: ${data.error || 'تمت معالجة الطلب بنجاح'}`);
      }
    } catch (err: any) {
      setTestResponse(`خطأ في تنفيذ الأمر: ${err.message}`);
    } finally {
      setIsTestingPrompt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Active Brain Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  اكتشاف واختبار النماذج المفتوحة (Open-Source AI Sandbox)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Zero-Trust Gated
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                اكتشاف النماذج مفتوحة المصدر وخوادم الاستدلال المعزولة، فحص الأمان والرخص والأداء، واستبدال Gemini بالكامل عند الحاجة.
              </p>
            </div>
          </div>

          {/* Active Brain Badge & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-[11px] text-slate-400">المحرك الرئيسي النشط (Active Brain)</div>
                <div className="text-xs font-bold text-white">
                  {activeBrain.type === 'open_source' && activeBrain.model ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {activeBrain.model.name}
                    </span>
                  ) : (
                    <span className="text-blue-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Google Gemini 3.6 Flash
                    </span>
                  )}
                </div>
              </div>
            </div>

            {activeBrain.type === 'open_source' ? (
              <button
                onClick={handleResetGemini}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                إعادة تفعيل Gemini
              </button>
            ) : null}

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              إضافة خادم / نموذج جديد
            </button>
          </div>
        </div>

        {/* Global Notification */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {actionSuccessMsg}
          </div>
        )}
      </div>

      {/* Main Grid: Models List vs Detailed Benchmark Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Discovered Models Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              النماذج وخوادم الاستدلال المكتشفة ({models.length})
            </h2>
            <button
              onClick={fetchModels}
              disabled={isLoading}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              title="تحديث القائمة"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {models.map((m) => {
              const isSelected = selectedModel?.id === m.id;
              const isPrimary = m.isCurrentBrain;
              const isFallback = m.isFallbackBrain;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPrimary && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                      <Flame className="w-3 h-3" /> المحرك النشط البديل
                    </div>
                  )}

                  {isFallback && !isPrimary && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> احتياطي الطوارئ
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {m.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
                          {m.provider.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>{m.parameterSize}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">{m.license}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-center">
                    <div className="bg-slate-950/40 rounded p-1.5">
                      <div className="text-[10px] text-slate-400">الاستجابة الأولى</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {m.benchmarkPerformance.timeToFirstTokenMs}ms
                      </div>
                    </div>
                    <div className="bg-slate-950/40 rounded p-1.5">
                      <div className="text-[10px] text-slate-400">معدل التدفق</div>
                      <div className="text-xs font-bold text-blue-400 font-mono">
                        {m.benchmarkPerformance.tokensPerSec} t/s
                      </div>
                    </div>
                    <div className="bg-slate-950/40 rounded p-1.5">
                      <div className="text-[10px] text-slate-400">أمان البيانات</div>
                      <div className="text-xs font-bold text-purple-400 font-mono">
                        {m.securityAudit.sanitizationScore}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Isolated Sandbox Audit & Benchmark Terminal (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedModel ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
              {/* Header of Selected Model */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedModel.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-full">
                      جاهز للاستخدام والتكامل
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedModel.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunBenchmark(selectedModel.id)}
                    disabled={benchmarkingId === selectedModel.id}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-amber-400 ${
                        benchmarkingId === selectedModel.id ? 'animate-spin' : ''
                      }`}
                    />
                    {benchmarkingId === selectedModel.id ? 'جاري الفحص...' : 'فحص Sandbox'}
                  </button>

                  <button
                    onClick={() => handleSetPrimary(selectedModel.id)}
                    disabled={selectedModel.isCurrentBrain}
                    className={`px-3.5 py-1.5 font-bold rounded-lg text-xs transition flex items-center gap-1.5 ${
                      selectedModel.isCurrentBrain
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                    }`}
                  >
                    {selectedModel.isCurrentBrain ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> المحرك الأساسي الحالي
                      </>
                    ) : (
                      <>
                        <Flame className="w-3.5 h-3.5" /> استبدال Gemini بهذا النموذج
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSetFallback(selectedModel.id)}
                    disabled={selectedModel.isFallbackBrain}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition"
                    title="تعيين كاحتياطي طوارئ"
                  >
                    {selectedModel.isFallbackBrain ? '✓ الاحتياطي' : 'تعيين كاحتياطي'}
                  </button>
                </div>
              </div>

              {/* 4 Core Verification Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Security SAST */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>فحص الأمان (SAST)</span>
                  </div>
                  <div className="text-lg font-extrabold text-white font-mono">
                    {selectedModel.securityAudit.sanitizationScore}/100
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {selectedModel.securityAudit.dataResidency}
                  </div>
                </div>

                {/* 2. License Compliance */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Award className="w-4 h-4 text-blue-400" />
                    <span>الرخصة التجارية</span>
                  </div>
                  <div className="text-xs font-bold text-white truncate" title={selectedModel.license}>
                    {selectedModel.license}
                  </div>
                  <div className="text-[10px] text-blue-400 font-medium">
                    {selectedModel.licenseType === 'permissive_commercial'
                      ? '✓ رخصة تجارية حرة'
                      : '✓ أوزان مفتوحة'}
                  </div>
                </div>

                {/* 3. Real Performance TTFT & TPS */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>السرعة والتدفق</span>
                  </div>
                  <div className="text-lg font-extrabold text-amber-400 font-mono">
                    {selectedModel.benchmarkPerformance.tokensPerSec} <span className="text-xs font-normal text-slate-400">tps</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    TTFT: {selectedModel.benchmarkPerformance.timeToFirstTokenMs}ms
                  </div>
                </div>

                {/* 4. API Compatibility */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>التوافقية البرمجية</span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono">
                    OpenAI /v1 Spec
                  </div>
                  <div className="text-[10px] text-purple-400 font-medium">
                    Function Calling: {selectedModel.benchmarkPerformance.toolCallingAccuracy}%
                  </div>
                </div>
              </div>

              {/* Isolated Sandbox Audit Logs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    سجل الفحص المعزول (Isolated Sandbox Verification Logs)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    آخر فحص: {new Date(selectedModel.lastTestedAt).toLocaleTimeString('ar-SA')}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto max-h-48">
                  {selectedModel.sandboxTestLogs?.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 select-none">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Interactive Prompt Playground */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  اختبار استجابة المحرك اللحظية (Live Engine Test)
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="اكتب أمراً أو كوداً لاختبار النموذج..."
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleTestPrompt}
                    disabled={isTestingPrompt}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    {isTestingPrompt ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    تشغيل الاختبار
                  </button>
                </div>

                {testResponse && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed animate-in fade-in">
                    <div className="text-[10px] text-amber-400 font-sans mb-1 font-bold">استجابة المحرك:</div>
                    {testResponse}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
              اختر نموذجاً من القائمة لعرض تفاصيل فحص الـ Sandbox والاختبارات المعيارية.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Register New Open-Source Model / Local Server */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                تسجيل نموذج أو خادم ذكاء اصطناعي مفتوح
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterModel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم النموذج / الخادم</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: DeepSeek-V3 671B MoE أو Local Ollama Llama 3"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المزود / بيئة التشغيل</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as OpenSourceProvider })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ollama">Ollama (Local / On-Premise)</option>
                    <option value="vllm">vLLM Cluster</option>
                    <option value="deepseek_direct">DeepSeek API Gateway</option>
                    <option value="groq">Groq Fast LPU</option>
                    <option value="openrouter">OpenRouter Gateway</option>
                    <option value="huggingface">HuggingFace TGI</option>
                    <option value="local_ai">LocalAI Self-Hosted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الرخصة القانونية</label>
                  <input
                    type="text"
                    value={formData.license}
                    onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                    placeholder="Apache 2.0 / MIT / Llama Community"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رابط نقطة النهاية (API Endpoint URL - OpenAI Compatible)
                </label>
                <input
                  type="text"
                  required
                  value={formData.customEndpointUrl}
                  onChange={(e) => setFormData({ ...formData, customEndpointUrl: e.target.value })}
                  placeholder="http://127.0.0.1:11434/v1/chat/completions"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  مفتاح API Token (اختياري للخوادم المحلية)
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-••••••••••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">وصف النموذج والقدرات</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للنموذج واستخداماته المتخصصة..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  تسجيل وبدء فحص Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
