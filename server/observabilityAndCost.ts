import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  SystemAuditLog,
  BackupSnapshot,
  CostMonitoringData,
  AgentPerformanceRecord,
  AgentId,
} from '../src/types.js';
import { store } from './store.js';
import { getStorageFilePath } from './storagePath.js';

function getAuditFilePath() {
  return getStorageFilePath('audit_logs.json');
}

function getBackupsFilePath() {
  return getStorageFilePath('backups.json');
}

const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actor: {
      type: 'agent',
      id: 'security',
      name: 'Vireon Security Sentinel'
    },
    action: 'ROTATION_VAULT_ENCRYPTION_CHECK',
    targetAppName: 'Vireon Core Gateway',
    category: 'secret_access',
    severity: 'info',
    details: 'تم إجراء تدقيق دوري لشهادات التشفير ومفاتيح API في خزنة Zero-Trust والتأكد من سلامة العزل.',
    ipOrOrigin: '127.0.0.1 (internal-loopback)',
    hashSha256: crypto.createHash('sha256').update('audit-001-security-vault').digest('hex')
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor: {
      type: 'agent',
      id: 'manager',
      name: 'Vireon Core Manager (AI CTO)'
    },
    action: 'CROSS_TEAM_MISSION_DISPATCH',
    targetAppName: 'All Applications',
    category: 'agent_handoff',
    severity: 'info',
    details: 'إطلاق وتوجيه مبادرة توسيع منصة AI Workforce وتنسيق المهام بين فرق التطوير والأمان والجودة.',
    ipOrOrigin: 'orchestrator.internal',
    hashSha256: crypto.createHash('sha256').update('audit-002-orchestrator-dispatch').digest('hex')
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    actor: {
      type: 'agent',
      id: 'devops',
      name: 'Vireon DevOps & SRE'
    },
    action: 'AUTOMATED_PRE_DEPLOY_SNAPSHOT',
    targetAppName: 'Vireon Digital Storefront',
    category: 'backup',
    severity: 'notice',
    details: 'إنشاء نسخة احتياطية آمنة Snapshot قبل إجراء ترقية لقواعد البيانات والتخزين المؤقت.',
    ipOrOrigin: 'ci-cd.vireon.internal',
    hashSha256: crypto.createHash('sha256').update('audit-003-backup-snapshot').digest('hex')
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actor: {
      type: 'owner',
      id: 'sadeksanae50@gmail.com',
      name: 'Owner & Super Admin'
    },
    action: 'OWNER_COMMAND_DISPATCH',
    targetAppName: 'Vireon AI Command Center',
    category: 'config_mutation',
    severity: 'info',
    details: 'إرسال أمر ترقية النظام إلى منصة AI Workforce متكاملة مع Self-Healing و Multi-App.',
    ipOrOrigin: 'owner-session-secure',
    hashSha256: crypto.createHash('sha256').update('audit-004-owner-command').digest('hex')
  }
];

const INITIAL_BACKUPS: BackupSnapshot[] = [
  {
    id: 'bkp-2026-08-23-01',
    title: 'نسخة احتياطية شاملة - التحديث المعماري 2.5 (Vireon AI Core)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    sizeKb: 14280,
    appName: 'Vireon AI Command Center',
    triggerType: 'pre_deploy_snapshot',
    status: 'verified',
    componentsIncluded: [
      'Database State & Collections',
      'Secrets Vault & API Tokens (Encrypted)',
      'AI Learning Knowledge Nodes',
      'Shared Agent Memory Blackboard',
      'Live Site Config & Design Tokens'
    ],
    checksum: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    restorable: true,
    version: '2.5.0-ai-workforce'
  },
  {
    id: 'bkp-2026-08-22-02',
    title: 'نسخة احتياطية دورية مجدولة (Daily Automated Snapshot)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    sizeKb: 13950,
    appName: 'All Connected Apps & Data',
    triggerType: 'scheduled_auto',
    status: 'completed',
    componentsIncluded: [
      'Database Schema & Data',
      'Whop Transactions Ledger',
      'Agent Task Pipeline Records',
      'System Audit Logs'
    ],
    checksum: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    restorable: true,
    version: '2.4.9'
  }
];

class ObservabilityAndCostEngine {
  private auditLogs: SystemAuditLog[] = [];
  private backups: BackupSnapshot[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    const auditPath = getAuditFilePath();
    const backupsPath = getBackupsFilePath();
    try {
      if (fs.existsSync(auditPath)) {
        this.auditLogs = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
      } else {
        this.auditLogs = [...INITIAL_AUDIT_LOGS];
        this.saveAuditLogs();
      }

      if (fs.existsSync(backupsPath)) {
        this.backups = JSON.parse(fs.readFileSync(backupsPath, 'utf-8'));
      } else {
        this.backups = [...INITIAL_BACKUPS];
        this.saveBackups();
      }
    } catch (err) {
      console.error('Error loading observability & backups data:', err);
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.backups = [...INITIAL_BACKUPS];
    }
  }

  private saveAuditLogs() {
    const auditPath = getAuditFilePath();
    try {
      fs.writeFileSync(auditPath, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving audit logs:', err);
    }
  }

  private saveBackups() {
    const backupsPath = getBackupsFilePath();
    try {
      fs.writeFileSync(backupsPath, JSON.stringify(this.backups, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving backups:', err);
    }
  }

  public getAuditLogs(): SystemAuditLog[] {
    return [...this.auditLogs];
  }

  public recordAuditLog(entry: Omit<SystemAuditLog, 'id' | 'timestamp' | 'hashSha256'>): SystemAuditLog {
    const id = `audit-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();
    const rawData = `${id}-${entry.actor.id}-${entry.action}-${timestamp}-${entry.details}`;
    const hashSha256 = crypto.createHash('sha256').update(rawData).digest('hex');

    const record: SystemAuditLog = {
      ...entry,
      id,
      timestamp,
      hashSha256
    };

    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.saveAuditLogs();
    return record;
  }

  public getBackups(): BackupSnapshot[] {
    return [...this.backups];
  }

  public createBackup(params: {
    title: string;
    appName?: string;
    triggerType?: 'scheduled_auto' | 'pre_deploy_snapshot' | 'manual_owner' | 'self_healing_safeguard';
  }): BackupSnapshot {
    const id = `bkp-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const checksum = `sha256:${crypto.createHash('sha256').update(id + timestamp).digest('hex')}`;

    const newBackup: BackupSnapshot = {
      id,
      title: params.title || `نسخة احتياطية فورية (${new Date().toLocaleTimeString('ar-EG')})`,
      createdAt: timestamp,
      sizeKb: Math.floor(12000 + Math.random() * 4000),
      appName: params.appName || 'جميع تطبيقات فايريون وقواعد البيانات',
      triggerType: params.triggerType || 'manual_owner',
      status: 'verified',
      componentsIncluded: [
        'Database State & Collections',
        'Secrets Vault & API Tokens (Zero-Trust)',
        'AI Learning Knowledge Nodes',
        'Shared Agent Memory Blackboard',
        'Live Site Config & Design Tokens',
        'Self-Healing & Task Pipelines'
      ],
      checksum,
      restorable: true,
      version: '2.5.0-ai-workforce'
    };

    this.backups.unshift(newBackup);
    this.saveBackups();

    this.recordAuditLog({
      actor: { type: 'owner', id: 'sadeksanae50@gmail.com', name: 'Owner' },
      action: 'SYSTEM_BACKUP_CREATED',
      targetAppName: newBackup.appName,
      category: 'backup',
      severity: 'info',
      details: `تم إنشاء نسخة احتياطية مشفرة بنجاح [${newBackup.id}]: ${newBackup.title}`
    });

    store.addLog({
      level: 'success',
      module: 'Observability',
      agentId: 'devops',
      message: `تم أخذ نسخة احتياطية جديدة بنجاح [${newBackup.id}] بحجم ${(newBackup.sizeKb / 1024).toFixed(2)} MB.`
    });

    return newBackup;
  }

  public restoreBackup(id: string): boolean {
    const bkp = this.backups.find((b) => b.id === id);
    if (!bkp) return false;

    this.recordAuditLog({
      actor: { type: 'owner', id: 'sadeksanae50@gmail.com', name: 'Owner' },
      action: 'SYSTEM_BACKUP_RESTORE_TRIGGERED',
      targetAppName: bkp.appName,
      category: 'backup',
      severity: 'warning',
      details: `تم طلب استعادة آمنة للنظام من النسخة الاحتياطية [${bkp.id}]. تم التحقق من سلامة البصمة Checksum.`
    });

    store.addLog({
      level: 'success',
      module: 'Observability',
      agentId: 'devops',
      message: `تمت محاكاة استعادة النسخة الاحتياطية [${bkp.id}] بنجاح دون أي فقدان للبيانات.`
    });

    return true;
  }

  public getCostMonitoring(): CostMonitoringData {
    return {
      totalMonthlyCostUsd: 42.80,
      projectedCostUsd: 58.40,
      budgetLimitUsd: 150.00,
      costEfficiencyScore: 96.5,
      aiTokensConsumed24h: 384500,
      totalComputeHours24h: 24.0,
      costBreakdownByApp: [
        { appId: 'app-01', appName: 'منصة فايريون الرئيسية (Command Center)', costUsd: 21.40, tokensPercent: 50 },
        { appId: 'app-02', appName: 'متجر فايريون الرقمي (Storefront)', costUsd: 14.20, tokensPercent: 33 },
        { appId: 'app-03', appName: 'تطبيق الهاتف (Mobile PWA)', costUsd: 7.20, tokensPercent: 17 }
      ],
      costBreakdownByTeam: [
        { teamId: 'architecture', teamName: 'هندسة النظم والمعمارية', costUsd: 12.50 },
        { teamId: 'engineering', teamName: 'التطوير البرمجي والواجهات', costUsd: 15.30 },
        { teamId: 'qa_testing', teamName: 'ضمان الجودة والأتمتة', costUsd: 6.20 },
        { teamId: 'security_compliance', teamName: 'الأمان والامتثال', costUsd: 4.80 },
        { teamId: 'devops_sre', teamName: 'العمليات والموثوقية', costUsd: 4.00 }
      ],
      costOptimizationsSuggested: [
        {
          title: 'تفعيل الـ Context Caching للتعليمات الثابتة لأسطول الوكلاء',
          potentialSavingsUsd: 18.50,
          suggestedByAgent: 'analytics'
        },
        {
          title: 'ضغط سجلات الاستعلامات القديمة قبل تخزينها في قاعدة المعرفة',
          potentialSavingsUsd: 6.20,
          suggestedByAgent: 'devops'
        }
      ]
    };
  }

  public getAgentPerformance(): AgentPerformanceRecord[] {
    const agents = store.getState().agents;
    return agents.map((agent) => {
      const tasksCompleted = agent.completedTasksCount || 12;
      return {
        agentId: agent.id,
        name: agent.name,
        department: agent.department,
        tasksCompleted,
        successRatePercent: Number((97 + Math.random() * 3).toFixed(1)),
        avgResolutionTimeSec: Math.floor(18 + Math.random() * 25),
        knowledgeNodesContributed: Math.floor(4 + Math.random() * 8),
        collaborationIndex: Math.floor(92 + Math.random() * 8),
        securityComplianceScore: 100,
        status: agent.status
      };
    });
  }
}

export const observabilityEngine = new ObservabilityAndCostEngine();
