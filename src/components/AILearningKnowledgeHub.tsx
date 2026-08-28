import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Search,
  Plus,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Code2,
  RefreshCw,
  Tag,
  ThumbsUp,
  SlidersHorizontal
} from 'lucide-react';
import { KnowledgeNode, LearningEvolutionMetrics, KnowledgeCategory } from '../types.js';

export default function AILearningKnowledgeHub() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [metrics, setMetrics] = useState<LearningEvolutionMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeForm, setNewNodeForm] = useState({
    title: '',
    category: 'error_pattern' as KnowledgeCategory,
    summary: '',
    rootCauseAnalysis: '',
    verifiedSolution: '',
    preventionRule: '',
    associatedAgent: 'developer' as any,
    associatedTeam: 'engineering' as any,
    appName: 'Vireon Core System',
    tags: 'performance, optimization, security',
    codeSnippetOrFix: '',
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/learning/knowledge', window.location.origin);
      if (selectedCategory !== 'all') url.searchParams.set('category', selectedCategory);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error('Error loading knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKnowledge();
  };

  const handleApplyFeedback = async (nodeId: string) => {
    try {
      const res = await fetch('/api/learning/apply-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nodeId, success: true }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess('تم تسجيل تطبيق الحل المعرفي بنجاح وزيادة مؤشر الثقة.');
        setTimeout(() => setFeedbackSuccess(null), 3000);
        fetchKnowledge();
      }
    } catch (err) {
      console.error('Error applying feedback:', err);
    }
  };

  const handleCreateKnowledgeNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newNodeForm,
        tags: newNodeForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        confidenceScore: 98,
        learnedFrom: 'owner_feedback',
      };

      const res = await fetch('/api/learning/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewNodeForm({
          title: '',
          category: 'error_pattern',
          summary: '',
          rootCauseAnalysis: '',
          verifiedSolution: '',
          preventionRule: '',
          associatedAgent: 'developer',
          associatedTeam: 'engineering',
          appName: 'Vireon Core System',
          tags: 'performance, optimization, security',
          codeSnippetOrFix: '',
        });
        fetchKnowledge();
      }
    } catch (err) {
      console.error('Error creating knowledge node:', err);
    }
  };

  return (
    <div className="space-y-6" id="ai-learning-knowledge-hub">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/60 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                AI Learning & Knowledge Server (Evolution Engine)
              </span>
              <span className="text-xs text-slate-400">تعلم تراكمي من السجلات والأخطاء والاختبارات لمنع تكرار الأعطال</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              خادم التعلم التراكمي والمعرفة المشتركة (AI Learning Hub)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              يقوم هذا الخادم بفحص وتخزين نتائج الاستشفاء الذاتي، تشخيص الأخطاء، اختبارات الجودة، وملاحظات المالك ليتحول كل عطل إلى قاعدة أمان دائمة وحل برمجي مؤكد تستفيد منه جميع فرق العمل.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة خبرة / درس موثق
            </button>
            <button
              onClick={fetchKnowledge}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {feedbackSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}
      </div>

      {/* Evolution Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] text-slate-400">مؤشر الذكاء التراكمي</p>
            <p className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              {metrics.compoundingIntelligenceScore}%
            </p>
            <p className="text-[10px] text-slate-500">يتزايد مع كل دورة إصلاح</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] text-slate-400">نسبة منع تكرار الأخطاء</p>
            <p className="text-xl font-bold text-indigo-400 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {metrics.errorRepetitionReductionPercent}%
            </p>
            <p className="text-[10px] text-slate-500">انخفاض ملحوظ في الأعطال</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] text-slate-400">إجمالي العقد المعرفية</p>
            <p className="text-xl font-bold text-white font-mono">
              {metrics.totalKnowledgeNodes} عقدة
            </p>
            <p className="text-[10px] text-slate-500">قواعد معمارية وحلول موثقة</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] text-slate-400">حلول ذاتية دون تصعيد</p>
            <p className="text-xl font-bold text-amber-400 font-mono">
              {metrics.autonomousResolutionsWithoutEscalation}
            </p>
            <p className="text-[10px] text-slate-500">تم حلها ذاتياً بالكامل</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <p className="text-[11px] text-slate-400">قوالب الترقيع المعتمدة</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">
              {metrics.verifiedFixTemplatesCount} قالب
            </p>
            <p className="text-[10px] text-slate-500">جاهزة للتطبيق الفوري</p>
          </div>
        </div>
      )}

      {/* Search & Categories Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في قاعدة المعرفة والحلول والترقيعات..."
            className="w-full ps-9 pe-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[
            { id: 'all', label: 'الكل' },
            { id: 'error_pattern', label: 'أنماط الأخطاء' },
            { id: 'security_rule', label: 'قواعد الأمان' },
            { id: 'code_recipe', label: 'حلول برمجية' },
            { id: 'performance_tuning', label: 'تحسين الأداء' },
            { id: 'seo_strategy', label: 'استراتيجيات SEO' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Nodes Grid */}
      <div className="space-y-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition space-y-3.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {node.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono text-slate-400">الوكيل: {node.associatedAgent}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">{node.appName || 'Vireon Core'}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  نسبة النجاح {node.successRate}% ({node.timesApplied} تطبيق)
                </span>
                <button
                  onClick={() => handleApplyFeedback(node.id)}
                  title="تأكيد نجاح تطبيق هذا الحل في بيئة العمل"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/40 text-slate-300 hover:text-emerald-300 border border-slate-700 text-xs flex items-center gap-1 transition"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>تأكيد الفاعلية</span>
                </button>
              </div>
            </div>

            <h3 className="text-base font-bold text-white leading-snug">{node.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{node.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {node.rootCauseAnalysis && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    تشخيص السبب الجذري:
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{node.rootCauseAnalysis}</p>
                </div>
              )}

              {node.verifiedSolution && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-500/20 space-y-1">
                  <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    الحل المعتمد والمطبق:
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{node.verifiedSolution}</p>
                </div>
              )}
            </div>

            {node.preventionRule && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/20 text-xs text-indigo-300">
                <span className="font-bold text-indigo-400">قاعدة المنع الاستباقية: </span>
                {node.preventionRule}
              </div>
            )}

            {node.codeSnippetOrFix && (
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  قالب الترقيع البرمجي (Verified Code Fix):
                </p>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                  {node.codeSnippetOrFix}
                </pre>
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Tag className="w-3 h-3 text-slate-500" />
              {node.tags.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Knowledge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                إضافة عقدة معرفية أو درس موثق جديد
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKnowledgeNode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان العقدة المعرفية:</label>
                <input
                  type="text"
                  required
                  value={newNodeForm.title}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, title: e.target.value })}
                  placeholder="مثال: حماية ترويسات الاستجابة أو حل تسريب الذاكرة"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">التصنيف:</label>
                  <select
                    value={newNodeForm.category}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="error_pattern">نمط أخطاء (Error Pattern)</option>
                    <option value="architecture_pattern">معمارية برمجية (Architecture Pattern)</option>
                    <option value="security_rule">قاعدة أمان (Security Rule)</option>
                    <option value="code_recipe">وصفة كود (Code Recipe)</option>
                    <option value="performance_tuning">تحسين أداء (Performance Tuning)</option>
                    <option value="seo_strategy">استراتيجية SEO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الوكيل المعني:</label>
                  <input
                    type="text"
                    value={newNodeForm.associatedAgent}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, associatedAgent: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الملخص والشرح:</label>
                <textarea
                  rows={2}
                  required
                  value={newNodeForm.summary}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الحل المعتمد:</label>
                <textarea
                  rows={2}
                  required
                  value={newNodeForm.verifiedSolution}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, verifiedSolution: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">قالب الكود (اختياري):</label>
                <textarea
                  rows={2}
                  value={newNodeForm.codeSnippetOrFix}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, codeSnippetOrFix: e.target.value })}
                  placeholder="// Code snippet..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  حفظ العقدة المعرفية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
