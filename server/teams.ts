import { WorkforceTeam, CrossTeamMission, DepartmentCode, AgentId } from '../src/types.js';

export const INITIAL_WORKFORCE_TEAMS: WorkforceTeam[] = [
  {
    id: 'architecture',
    name: 'فريق هندسة النظم والمعمارية (AI CTO & Systems)',
    nameEn: 'Architecture & CTO Office',
    leadAgentId: 'manager',
    memberAgentIds: ['manager', 'engineer'],
    color: 'emerald',
    description: 'القيادة الفنية والتخطيط المعماري الشامل، وإدارة المخططات والتكاملات العابرة للتطبيقات.',
    responsibilities: [
      'تخطيط وتوزيع المبادرات الكبرى بين الفرق',
      'تصميم معمارية الأنظمة والـ APIs وقواعد البيانات',
      'إدارة بوابات الأمان والحوكمة والامتثال التقني',
      'اتخاذ قرارات الـ Scale والتوسع المتوازي'
    ],
    activeMissionsCount: 3,
    slaResponseTimeSec: 15,
    healthScore: 99.8,
    lastHandoff: {
      fromAgent: 'manager',
      toAgent: 'developer',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      mission: 'تسليم مواصفات معمارية خطوط المعالجة المجمعة Batch Queue'
    }
  },
  {
    id: 'engineering',
    name: 'فريق التطوير البرمجي الشامل (Full-Stack & Mobile)',
    nameEn: 'Core Software Engineering',
    leadAgentId: 'developer',
    memberAgentIds: ['developer', 'frontend'],
    color: 'blue',
    description: 'بناء الخدمات الخلفية والواجهات الأمامية الفاخرة وتطبيقات الهاتف وتوليد الترقيعات البرمجية.',
    responsibilities: [
      'برمجة المنطق الخلفي Node.js/TypeScript و REST/GraphQL APIs',
      'بناء الواجهات الفاخرة، أنظمة التصميم Design Tokens ودعم RTL',
      'تجهيز وتطوير تطبيقات الجوال PWA & React Native',
      'إصلاح الثغرات وتطبيق الترقيعات الساخنة Hot Patches في الـ Sandbox'
    ],
    activeMissionsCount: 4,
    slaResponseTimeSec: 25,
    healthScore: 99.4,
    lastHandoff: {
      fromAgent: 'developer',
      toAgent: 'qa',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      mission: 'تسليم ترقيعة Sandbox لمعالجة أخطاء معالجة خطافات Webhook'
    }
  },
  {
    id: 'qa_testing',
    name: 'فريق ضمان الجودة والأتمتة (QA & Automation)',
    nameEn: 'Automated QA & Reliability',
    leadAgentId: 'qa',
    memberAgentIds: ['qa'],
    color: 'amber',
    description: 'تنفيذ الاختبارات التلقائية، اختبارات التراجع، وفحص الأداء والتكاملات قبل أي اعتماد.',
    responsibilities: [
      'تنفيذ اختبارات الوحدة والتكامل (Unit & Integration Tests)',
      'فحص واجهات المستخدم والتأكد من عدم وجود تراجعات بصرية (Visual Regression)',
      'اختبارات التحمل والضغط واختبارات السيناريوهات الحادة (Edge Cases)',
      'التحقق من كفاءة الترقيعات البرمجية قبل النشر التجريبي'
    ],
    activeMissionsCount: 2,
    slaResponseTimeSec: 20,
    healthScore: 98.9,
    lastHandoff: {
      fromAgent: 'qa',
      toAgent: 'security',
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      mission: 'اعتماد نجاح 42 اختبار وحدة بنسبة 100% وتحويل الكود للفحص الأمني'
    }
  },
  {
    id: 'devops_sre',
    name: 'فريق العمليات والموثوقية السحابية (DevOps & SRE)',
    nameEn: 'DevOps, SRE & Cloud Operations',
    leadAgentId: 'devops',
    memberAgentIds: ['devops'],
    color: 'cyan',
    description: 'إدارة خطوط CI/CD، بيئات Staging، النشر الفوري، وعمليات الاسترجاع التلقائي Rollback.',
    responsibilities: [
      'إدارة خطوط النشر الآلي Vercel / GitHub Actions / Cloud Run',
      'مراقبة جهوزية الحاويات والسيرفرات 24/7',
      'تنفيذ الاسترجاع التلقائي الفوري (Auto-Rollback) عند انخفاض الصحة',
      'إدارة النسخ الاحتياطية Snapshot Backups والمزامنة السحابية'
    ],
    activeMissionsCount: 3,
    slaResponseTimeSec: 10,
    healthScore: 100.0,
    lastHandoff: {
      fromAgent: 'devops',
      toAgent: 'manager',
      timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      mission: 'نشر حزمة التحديث 2.4.1 إلى بيئة Staging للتحقق النهائي'
    }
  },
  {
    id: 'security_compliance',
    name: 'فريق الحماية والامتثال والأمان (Zero-Trust Security)',
    nameEn: 'Security, Zero-Trust & Compliance',
    leadAgentId: 'security',
    memberAgentIds: ['security', 'auditor'],
    color: 'rose',
    description: 'حراسة خزنة الرموز السرية، المسح الأمني للثغرات، تدقيق الصلاحيات RBAC، ومنع التجاوزات.',
    responsibilities: [
      'المسح الأمني التلقائي للكود المصدري (SAST & Vulnerability Scanning)',
      'تشفير وحماية المفاتيح والرموز السرية داخل الخزنة',
      'منع أي وصول غير مصرح به أو تعديل حساس دون موافقة المالك',
      'تدقيق وتوثيق سجلات النظام غير القابلة للتغيير (Immutable Audit Logs)'
    ],
    activeMissionsCount: 2,
    slaResponseTimeSec: 8,
    healthScore: 100.0,
    lastHandoff: {
      fromAgent: 'security',
      toAgent: 'devops',
      timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      mission: 'اجتياز فحص الثغرات الأمني بنتيجة 0 ثغرات واعتماد الترقيعة'
    }
  },
  {
    id: 'incident_triage',
    name: 'فريق الرصد والفرز السريع للحوادث (Incident Triage & Watchdog)',
    nameEn: 'Incident Discovery & Rapid Triage',
    leadAgentId: 'operations',
    memberAgentIds: ['operations'],
    color: 'purple',
    description: 'اكتشاف الأخطاء والأعطال فور حدوثها، تشخيصها، وتوجيهها فوراً للفريق المختص للاستشفاء الذاتي.',
    responsibilities: [
      'المراقبة اللحظية للمقاييس ومعدلات الأخطاء والاستجابة 24/7',
      'فرز وتصنيف المشاكل وتحديد مستوى الخطورة (Critical / High / Medium)',
      'إطلاق دورة الاستشفاء الذاتي Self-Healing التلقائية',
      'توجيه المهام إلى الفريق الأنسب وحفظ السجلات للمحرك المعرفي'
    ],
    activeMissionsCount: 1,
    slaResponseTimeSec: 5,
    healthScore: 99.7,
    lastHandoff: {
      fromAgent: 'operations',
      toAgent: 'engineer',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      mission: 'رصد زيادة طفيفة في زمن استجابة API وفرزها كعنصر فحص معماري'
    }
  },
  {
    id: 'seo_content',
    name: 'فريق تحسين محركات البحث والمحتوى (Technical SEO & Content)',
    nameEn: 'Technical SEO & Content Growth',
    leadAgentId: 'seo',
    memberAgentIds: ['seo'],
    color: 'teal',
    description: 'تحسين بنية المواقع التقنية لـ Google، بناء خريطة الموقع، والكلمات المفتاحية والمحتوى.',
    responsibilities: [
      'فحص مؤشرات Core Web Vitals وسرعة الأداء',
      'توليد وتحسين العلامات الوصفية Schema.org و OpenGraph',
      'إعداد استراتيجيات المحتوى التنافسي والكلمات المفتاحية',
      'مراقبة الأرشفة وتصنيف المقالات والمنتجات'
    ],
    activeMissionsCount: 2,
    slaResponseTimeSec: 45,
    healthScore: 98.6,
    lastHandoff: {
      fromAgent: 'seo',
      toAgent: 'frontend',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      mission: 'تحسين بنية عناصر العناوين H1/H2 وضبط سرعة تحميل الخطوط'
    }
  },
  {
    id: 'growth_marketing',
    name: 'فريق النمو والمبيعات والتسويق (Growth & Marketplace)',
    nameEn: 'Growth, Marketing & Marketplace',
    leadAgentId: 'marketplace',
    memberAgentIds: ['marketplace', 'payments'],
    color: 'orange',
    description: 'إدارة متجر فايريون، زيادة المبيعات، ضبط التسعير الديناميكي، وتحسين مسارات التحويل.',
    responsibilities: [
      'تنسيق العروض والخصومات وإدارة تصنيفات المنتجات',
      'تحسين بوابات الشراء السريعة Fast Checkout',
      'تحليل سلوك المشترين وزيادة معدل التحويل (Conversion Rate Optimization)',
      'إدارة حملات الإطلاق والترويج للتطبيقات والخدمات'
    ],
    activeMissionsCount: 3,
    slaResponseTimeSec: 30,
    healthScore: 99.1,
    lastHandoff: {
      fromAgent: 'marketplace',
      toAgent: 'payments',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      mission: 'تحديث تسعير باقة المطورين ومزامنتها مع متجر Whop'
    }
  },
  {
    id: 'analytics_finance',
    name: 'فريق التحليلات والتكاليف والمالية (Analytics & Cost Intelligence)',
    nameEn: 'Data Analytics & Cost Intelligence',
    leadAgentId: 'analytics',
    memberAgentIds: ['analytics', 'payments'],
    color: 'violet',
    description: 'رصد تكاليف استهلاك النماذج والسيرفرات، تحليل الإيرادات، وتقديم توصيات خفض المصاريف.',
    responsibilities: [
      'مراقبة استهلاك رموز الذكاء الاصطناعي (AI Tokens) وحساب التكلفة الدقيقة',
      'تحليل الأرباح وصافي الإيرادات ومعدلات النمو اليومية والأسبوعية',
      'اكتشاف مواضع الهدر البرمجي واقتراح حلول التوفير التلقائية',
      'إعداد التقارير المالية والتحليلية المجمعة للمالك'
    ],
    activeMissionsCount: 2,
    slaResponseTimeSec: 30,
    healthScore: 99.9,
    lastHandoff: {
      fromAgent: 'analytics',
      toAgent: 'manager',
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      mission: 'تضمين تقرير كفاءة التكاليف وخفض استهلاك التوكنات بنسبة 18%'
    }
  },
  {
    id: 'customer_success',
    name: 'فريق دعم ونجاح العملاء (Customer Support & Success)',
    nameEn: 'Customer Support & Success Fleet',
    leadAgentId: 'support',
    memberAgentIds: ['support'],
    color: 'emerald',
    description: 'الرد الفوري على تذاكر واستفسارات المستخدمين 24/7 وجمع التغذية الراجعة لتحسين النظام.',
    responsibilities: [
      'حل استفسارات ومشاكل العملاء آلياً بذكاء ودقة',
      'تحويل المشاكل التقنية المكتشفة من المستخدمين لفريق الفرز Triage',
      'تحديث قاعدة المعرفة بالأسئلة الشائعة والحلول المعتمدة',
      'قياس رضا العملاء وتتبع مقاييس CSAT'
    ],
    activeMissionsCount: 1,
    slaResponseTimeSec: 12,
    healthScore: 99.5,
    lastHandoff: {
      fromAgent: 'support',
      toAgent: 'operations',
      timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      mission: 'إغلاق تذكرة عميل بنجاح ورفع ملخص الاستفسار للذاكرة المعرفية'
    }
  }
];

export const INITIAL_CROSS_TEAM_MISSIONS: CrossTeamMission[] = [
  {
    id: 'mission-1',
    title: 'تطوير وتوسيع منصة قوى الذكاء الاصطناعي AI Workforce ومحرك الاستشفاء الذاتي',
    objective: 'ربط جميع وكلاء النظام الـ 14 ضمن فرق موحدة وتفعيل التعلم التراكمي ونظام الإصلاح الذاتي التلقائي الشامل.',
    status: 'active',
    priority: 'critical',
    appName: 'Vireon AI Command Center',
    leadTeamId: 'architecture',
    involvedTeamIds: ['architecture', 'engineering', 'qa_testing', 'security_compliance', 'devops_sre'],
    involvedAgentIds: ['manager', 'engineer', 'developer', 'frontend', 'qa', 'security', 'devops'],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date().toISOString(),
    progressPercent: 92,
    currentMilestone: 'التحقق النهائي من جاهزية محرك التعلم وواجهات المراقبة المتكاملة',
    milestones: [
      {
        id: 'm1',
        name: 'تصميم معمارية AI Orchestrator & Knowledge Engine',
        assignedTeam: 'architecture',
        assignedAgent: 'manager',
        status: 'completed',
        completedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString()
      },
      {
        id: 'm2',
        name: 'بناء مسارات Self-Healing والعزل في Sandbox',
        assignedTeam: 'engineering',
        assignedAgent: 'developer',
        status: 'completed',
        completedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString()
      },
      {
        id: 'm3',
        name: 'تنفيذ الفحص الأمني الشامل Zero-Trust واختبارات الجودة',
        assignedTeam: 'security_compliance',
        assignedAgent: 'security',
        status: 'completed',
        completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'm4',
        name: 'النشر التجريبي في Staging وتفعيل المراقبة اللحظية',
        assignedTeam: 'devops_sre',
        assignedAgent: 'devops',
        status: 'in_progress'
      }
    ],
    handOffLogs: [
      {
        fromAgent: 'manager',
        toAgent: 'developer',
        fromTeam: 'architecture',
        toTeam: 'engineering',
        handoffNotes: 'تم تسليم المعمارية البرمجية للمطور لتنفيذ محرك التعلم والاستشفاء الذاتي.',
        timestamp: new Date(Date.now() - 1000 * 60 * 135).toISOString()
      },
      {
        fromAgent: 'developer',
        toAgent: 'qa',
        fromTeam: 'engineering',
        toTeam: 'qa_testing',
        handoffNotes: 'تم إنجاز الترقيعات البرمجية والمسارات وتحويلها لاختبارات الجودة الشاملة.',
        timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString()
      },
      {
        fromAgent: 'qa',
        toAgent: 'security',
        fromTeam: 'qa_testing',
        toTeam: 'security_compliance',
        handoffNotes: 'اجتياز جميع الاختبارات 100% والتحويل لحارس الأمان للتحقق من أمان الرموز.',
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString()
      },
      {
        fromAgent: 'security',
        toAgent: 'devops',
        fromTeam: 'security_compliance',
        toTeam: 'devops_sre',
        handoffNotes: 'تم فحص الكود وتأكيد عدم وجود ثغرات أمنية، وجاهزية النشر.',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      }
    ]
  },
  {
    id: 'mission-2',
    title: 'تحسين مسار تحويل المتجر والمزامنة الفورية مع Whop Webhooks',
    objective: 'تقليل زمن استجابة الـ Checkout بنسبة 35% وضمان عدم فقدان أي حدث دفع نهائياً.',
    status: 'completed',
    priority: 'high',
    appName: 'Vireon Digital Storefront',
    leadTeamId: 'growth_marketing',
    involvedTeamIds: ['growth_marketing', 'engineering', 'qa_testing'],
    involvedAgentIds: ['marketplace', 'payments', 'developer', 'qa'],
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    progressPercent: 100,
    currentMilestone: 'تم الإنجاز والاعتماد بنجاح',
    milestones: [
      {
        id: 'm2-1',
        name: 'تحليل نقاط التأخير في استجابة Webhook',
        assignedTeam: 'growth_marketing',
        assignedAgent: 'payments',
        status: 'completed',
        completedAt: new Date(Date.now() - 1000 * 60 * 280).toISOString()
      },
      {
        id: 'm2-2',
        name: 'تفعيل التخزين المؤقت ومعالجة الـ Idempotency Keys',
        assignedTeam: 'engineering',
        assignedAgent: 'developer',
        status: 'completed',
        completedAt: new Date(Date.now() - 1000 * 60 * 160).toISOString()
      },
      {
        id: 'm2-3',
        name: 'محاكاة 500 عملية دفع متزامنة بدون أي فشل',
        assignedTeam: 'qa_testing',
        assignedAgent: 'qa',
        status: 'completed',
        completedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      }
    ],
    handOffLogs: [
      {
        fromAgent: 'payments',
        toAgent: 'developer',
        fromTeam: 'growth_marketing',
        toTeam: 'engineering',
        handoffNotes: 'تم رصد حاجة لتطبيق Idempotency Cache لمنع ازدواجية الفواتير.',
        timestamp: new Date(Date.now() - 1000 * 60 * 270).toISOString()
      },
      {
        fromAgent: 'developer',
        toAgent: 'qa',
        fromTeam: 'engineering',
        toTeam: 'qa_testing',
        handoffNotes: 'تم تطبيق الكاش وتمريره لاختبارات التحمل المتزامنة.',
        timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString()
      }
    ]
  }
];
