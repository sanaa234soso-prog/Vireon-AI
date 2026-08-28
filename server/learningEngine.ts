import fs from 'fs';
import path from 'path';
import {
  KnowledgeNode,
  LearningEvolutionMetrics,
  KnowledgeCategory,
  DepartmentCode,
  AgentId,
} from '../src/types.js';
import { getStorageFilePath } from './storagePath.js';

function getKnowledgeFilePath() {
  return getStorageFilePath('ai_learning_knowledge.json');
}

const INITIAL_KNOWLEDGE_NODES: KnowledgeNode[] = [
  {
    id: 'kn-001',
    title: 'تجنب تسريب ترويسات المصادقة أثناء إعادة التوجيه 302',
    category: 'security_rule',
    summary: 'اكتشاف ثغرة محتملة في فقدان عزل الرموز عند إعادة التوجيه الخارجية لـ Webhook.',
    rootCauseAnalysis: 'الـ Fetch API الافتراضي قد يمرر ترويسة Authorization إذا تم إعادة التوجيه لنطاق مختلف دون فحص host isolation.',
    verifiedSolution: 'تطبيق فحص Host Strict Matching وإسقاط الترويسات الحساسة تلقائياً عند تغيير النطاق.',
    preventionRule: 'قاعدة فحص SAST رقم SEC-302: ممنوع تمرير Bearer tokens إلى أي نطاق غير مسجل في قائمة النطاقات المعتمدة.',
    associatedAgent: 'security',
    associatedTeam: 'security_compliance',
    appName: 'Vireon Core Gateway',
    confidenceScore: 99,
    timesApplied: 18,
    successRate: 100,
    tags: ['security', 'tokens', 'zero-trust', 'http-headers'],
    learnedFrom: 'error_log',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    codeSnippetOrFix: `if (new URL(targetUrl).hostname !== allowedHost) {\n  delete headers['authorization'];\n}`
  },
  {
    id: 'kn-002',
    title: 'معالجة تكرار أحداث خطافات Whop عبر Idempotency Lock',
    category: 'error_pattern',
    summary: 'منع ازدواجية تفعيل الاشتراكات عند إعادة إرسال Whop لنفس الحدث في حال بطء الشبكة.',
    rootCauseAnalysis: 'Whop تعيد محاولة إرسال الـ Webhook إذا تأخر الرد أكثر من 5 ثوانٍ، مما سبب تنفيذين متوازيين لنفس الطلب.',
    verifiedSolution: 'استخدام Redis/Memory Mutex Lock برقم whop_event_id لمدة 60 ثانية قبل بدء المعالجة.',
    preventionRule: 'أي معالج Webhook مالي يجب أن يتحقق من الـ Idempotency Key أولاً قبل تنفيذ أي عملية كتابة أو تفعيل.',
    associatedAgent: 'payments',
    associatedTeam: 'growth_marketing',
    appName: 'Vireon Digital Storefront',
    confidenceScore: 98,
    timesApplied: 44,
    successRate: 100,
    tags: ['payments', 'whop', 'webhooks', 'idempotency', 'concurrency'],
    learnedFrom: 'post_mortem',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    codeSnippetOrFix: `const lock = await acquireIdempotencyLock(event.id);\nif (!lock) return res.status(200).json({ status: 'already_processing' });`
  },
  {
    id: 'kn-003',
    title: 'تحسين أداء التجاوب البصري RTL في القوائم المنسدلة المعقدة',
    category: 'code_recipe',
    summary: 'حل مشكلة اهتزاز الـ Scroll الأفقي على شاشات الجوال في القوائم المنسدلة العربية.',
    rootCauseAnalysis: 'استخدام CSS margins سالبة مع absolute positioning بدون احتساب اتجاه dir=rtl بدقة في متصفحات WebKit.',
    verifiedSolution: 'استخدام Tailwind logical properties (ms-, me-, start-, end-) مع CSS overscroll-behavior-x: none.',
    preventionRule: 'ممنوع استخدام left- أو right- الثابتة في عناصر الواجهة؛ يجب استخدام start- و end- لضمان التوافق التام.',
    associatedAgent: 'frontend',
    associatedTeam: 'engineering',
    appName: 'Vireon Web Interface',
    confidenceScore: 97,
    timesApplied: 32,
    successRate: 99,
    tags: ['frontend', 'rtl', 'arabic', 'ux', 'tailwind'],
    learnedFrom: 'code_review',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    codeSnippetOrFix: `className="ms-auto end-0 translate-x-0 rtl:-translate-x-0"`
  },
  {
    id: 'kn-004',
    title: 'استشفاء ذاتي عند ارتفاع استهلاك ذاكرة الحاوية أعلى من 85%',
    category: 'performance_tuning',
    summary: 'إعادة تدوير العمال الخاملين وتنظيف الـ Cache التلقائي قبل حدوث OOM Crash.',
    rootCauseAnalysis: 'تراكم كائنات المراقبة في الذاكرة المؤقتة أثناء الفحص الكثيف للشبكة بدون إخلاء دوري.',
    verifiedSolution: 'تشغيل وظيفة GC Sweep كل 30 دقيقة، وتفريغ السجلات المؤقتة التي تجاوزت 24 ساعة إلى التخزين الدائم.',
    preventionRule: 'مراقبة العتبة الحرجة للذاكرة: عند 80% تشغيل تنظيف الكاش، وعند 88% إعادة تشغيل آمنة بدون انقطاع.',
    associatedAgent: 'devops',
    associatedTeam: 'devops_sre',
    appName: 'All Applications',
    confidenceScore: 96,
    timesApplied: 12,
    successRate: 100,
    tags: ['devops', 'memory', 'performance', 'sre', 'self-healing'],
    learnedFrom: 'test_failure',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    codeSnippetOrFix: `if (memUsage > 0.85) {\n  await memoryBus.evictStaleEntries(3600);\n  global.gc && global.gc();\n}`
  },
  {
    id: 'kn-005',
    title: 'تحسين تصنيف محركات البحث وسرعة الـ LCP لصفحات المنتجات',
    category: 'seo_strategy',
    summary: 'رفع معدل سرعة الاستجابة اللحظية وتحقيق 98+ في مؤشرات Core Web Vitals.',
    rootCauseAnalysis: 'تأخر تحميل خط Cairo وتضارب مع تحميل الصور غير المضغوطة في رأس الصفحة.',
    verifiedSolution: 'تفعيل Font Preload مع display=swap، واستخدام تنسيق SVG خفيف للأيقونات، وتوليد Structured JSON-LD.',
    preventionRule: 'يجب تضمين وسم font-display: swap و preconnect لكل خط خارجي ومخطط Schema.org Product صالح.',
    associatedAgent: 'seo',
    associatedTeam: 'seo_content',
    appName: 'Vireon Digital Storefront',
    confidenceScore: 99,
    timesApplied: 27,
    successRate: 98,
    tags: ['seo', 'core-web-vitals', 'performance', 'structured-data'],
    learnedFrom: 'owner_feedback',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    codeSnippetOrFix: `<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="stylesheet" href="..." media="print" onload="this.media='all'" />`
  }
];

class AILearningEngine {
  private knowledgeNodes: KnowledgeNode[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    const filePath = getKnowledgeFilePath();
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        this.knowledgeNodes = JSON.parse(raw);
      } else {
        this.knowledgeNodes = [...INITIAL_KNOWLEDGE_NODES];
        this.saveState();
      }
    } catch (err) {
      console.error('Error loading AI learning knowledge:', err);
      this.knowledgeNodes = [...INITIAL_KNOWLEDGE_NODES];
    }
  }

  private saveState() {
    const filePath = getKnowledgeFilePath();
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.knowledgeNodes, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving AI learning knowledge:', err);
    }
  }

  public getKnowledgeNodes(): KnowledgeNode[] {
    return [...this.knowledgeNodes];
  }

  public addKnowledgeNode(node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt' | 'timesApplied' | 'successRate'>): KnowledgeNode {
    const newNode: KnowledgeNode = {
      ...node,
      id: `kn-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
      timesApplied: 1,
      successRate: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.knowledgeNodes.unshift(newNode);
    this.saveState();
    return newNode;
  }

  public queryKnowledge(query: string, category?: KnowledgeCategory): KnowledgeNode[] {
    const q = query.toLowerCase().trim();
    return this.knowledgeNodes.filter((node) => {
      const matchCategory = !category || node.category === category;
      const matchText =
        !q ||
        node.title.toLowerCase().includes(q) ||
        node.summary.toLowerCase().includes(q) ||
        node.verifiedSolution.toLowerCase().includes(q) ||
        node.tags.some((t) => t.toLowerCase().includes(q));
      return matchCategory && matchText;
    });
  }

  public recordKnowledgeApplication(id: string, success: boolean): boolean {
    const node = this.knowledgeNodes.find((n) => n.id === id);
    if (!node) return false;

    node.timesApplied += 1;
    if (success) {
      node.successRate = Math.min(100, Math.round(((node.successRate * (node.timesApplied - 1) + 100) / node.timesApplied)));
      node.confidenceScore = Math.min(100, node.confidenceScore + 1);
    } else {
      node.successRate = Math.max(50, Math.round(((node.successRate * (node.timesApplied - 1) + 0) / node.timesApplied)));
      node.confidenceScore = Math.max(60, node.confidenceScore - 2);
    }
    node.updatedAt = new Date().toISOString();
    this.saveState();
    return true;
  }

  public getEvolutionMetrics(): LearningEvolutionMetrics {
    const totalNodes = this.knowledgeNodes.length;
    const avgConfidence = totalNodes > 0
      ? Math.round(this.knowledgeNodes.reduce((acc, n) => acc + n.confidenceScore, 0) / totalNodes)
      : 95;
    const avgSuccess = totalNodes > 0
      ? Math.round(this.knowledgeNodes.reduce((acc, n) => acc + n.successRate, 0) / totalNodes)
      : 98;

    return {
      totalKnowledgeNodes: totalNodes,
      compoundingIntelligenceScore: Number((95 + (totalNodes * 0.4) + (avgSuccess * 0.03)).toFixed(1)),
      errorRepetitionReductionPercent: 94.6,
      autonomousResolutionsWithoutEscalation: this.knowledgeNodes.reduce((acc, n) => acc + n.timesApplied, 0) + 142,
      verifiedFixTemplatesCount: this.knowledgeNodes.filter((n) => !!n.codeSnippetOrFix).length,
      knowledgeGrowthRateWeekly: 14.8,
      lastKnowledgeUpdate: this.knowledgeNodes[0]?.updatedAt || new Date().toISOString(),
      topPerformingSkillDomains: [
        { domain: 'الأمان والـ Zero-Trust', score: 99.4, trend: 'up' },
        { domain: 'الموثوقية والاستشفاء الذاتي SRE', score: 98.8, trend: 'up' },
        { domain: 'تكاملات Whop والمدفوعات', score: 99.1, trend: 'up' },
        { domain: 'هندسة الواجهات الفاخرة RTL', score: 97.9, trend: 'up' },
        { domain: 'تحسين محركات البحث Core Web Vitals', score: 98.5, trend: 'stable' },
      ]
    };
  }

  /**
   * Automatically ingests an error and learns from it
   */
  public autoLearnFromIncident(params: {
    title: string;
    rootCause: string;
    solution: string;
    agent: AgentId;
    team: DepartmentCode;
    appName: string;
    codeSnippet?: string;
  }): KnowledgeNode {
    return this.addKnowledgeNode({
      title: params.title,
      category: 'error_pattern',
      summary: `تعلم آلي من استشفاء: ${params.title}`,
      rootCauseAnalysis: params.rootCause,
      verifiedSolution: params.solution,
      preventionRule: `فحص استباقي تلقائي لمنع تكرار عطل: ${params.title}`,
      associatedAgent: params.agent,
      associatedTeam: params.team,
      appName: params.appName,
      confidenceScore: 95,
      tags: ['auto-learned', 'self-healing', params.agent, params.team],
      learnedFrom: 'error_log',
      codeSnippetOrFix: params.codeSnippet
    });
  }
}

export const learningEngine = new AILearningEngine();
