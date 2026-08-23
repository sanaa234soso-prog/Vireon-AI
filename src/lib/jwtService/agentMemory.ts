import { AgentId, AgentMemoryEntry, AgentMessage } from '../src/types.js';
import { store } from './store.js';

let sharedMemory: AgentMemoryEntry[] = [
  {
    id: 'mem-001',
    authorAgent: 'security',
    targetAgent: 'all',
    type: 'security_rule',
    title: 'Zero-Trust Secrets Isolation Policy',
    content: 'All API keys (WHOP_API_KEY, GITHUB_TOKEN, VERCEL_TOKEN) must be strictly accessed on the Node.js server proxy. No secret key can ever be exposed to Vite bundles or client window objects.',
    tags: ['security', 'tokens', 'zero-trust', 'compliance'],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    importance: 'high',
  },
  {
    id: 'mem-002',
    authorAgent: 'frontend',
    targetAgent: 'all',
    type: 'design_token',
    title: 'Vireon Design System & RTL Guidelines',
    content: 'Primary brand: Emerald-500 (#10b981) + Obsidian Zinc (#09090b). Arabic typography: Cairo (display & titles) and Plus Jakarta Sans (numbers/code). RTL padding ratio must be strictly balanced.',
    tags: ['design-system', 'frontend', 'rtl', 'cairo', 'luxury'],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    importance: 'high',
  },
  {
    id: 'mem-003',
    authorAgent: 'payments',
    targetAgent: 'all',
    type: 'architecture_decision',
    title: 'Whop Webhook HMAC Timing-Safe Assertion',
    content: 'Whop order events must be cryptographically asserted using crypto.timingSafeEqual against WHOP_WEBHOOK_SECRET before ledger settlement.',
    tags: ['payments', 'whop', 'hmac', 'fintech'],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    importance: 'high',
  },
  {
    id: 'mem-004',
    authorAgent: 'qa',
    targetAgent: 'devops',
    type: 'bug_remediation',
    title: 'Automated Pre-Deploy Quality Gatekeeping',
    content: 'No code diff can be pushed to live production without passing 100% of static typescript linting and automated assertion suites.',
    tags: ['qa', 'ci-cd', 'testing', 'gatekeeper'],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    importance: 'normal',
  },
];

let agentMessages: AgentMessage[] = [
  {
    id: 'msg-001',
    fromAgent: 'auditor',
    toAgent: 'broadcast',
    message: '24/7 Watchdog sweep completed: all 6 internal and external routes are 100% operational (Avg latency 28ms).',
    timestamp: new Date(Date.now() - 3600000 * 0.3).toISOString(),
  },
  {
    id: 'msg-002',
    fromAgent: 'payments',
    toAgent: 'analytics',
    message: 'Whop 24h ledger reconciled: 4 confirmed transactions ($1,046.00 USD total GMV). Zero disputed webhooks.',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
  },
  {
    id: 'msg-003',
    fromAgent: 'frontend',
    toAgent: 'qa',
    message: 'Design token audit complete: 100% WCAG AA contrast score and RTL Cairo typography scaling verified.',
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
  },
];

export function getSharedMemory(tagFilter?: string, typeFilter?: string): AgentMemoryEntry[] {
  let result = [...sharedMemory];
  if (tagFilter) {
    result = result.filter((m) => m.tags.includes(tagFilter));
  }
  if (typeFilter) {
    result = result.filter((m) => m.type === typeFilter);
  }
  return result;
}

export function addMemoryEntry(entry: Omit<AgentMemoryEntry, 'id' | 'createdAt'>): AgentMemoryEntry {
  const newEntry: AgentMemoryEntry = {
    ...entry,
    id: `mem-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  sharedMemory.unshift(newEntry);
  if (sharedMemory.length > 200) {
    sharedMemory = sharedMemory.slice(0, 200);
  }
  return newEntry;
}

export function getAgentMessages(limit: number = 50): AgentMessage[] {
  return agentMessages.slice(0, limit);
}

export function sendAgentMessage(
  fromAgent: AgentId,
  toAgent: AgentId | 'broadcast',
  message: string,
  relatedTaskId?: string
): AgentMessage {
  const msg: AgentMessage = {
    id: `msg-${Date.now().toString(36)}`,
    fromAgent,
    toAgent,
    message,
    timestamp: new Date().toISOString(),
    relatedTaskId,
  };
  agentMessages.unshift(msg);
  if (agentMessages.length > 200) {
    agentMessages = agentMessages.slice(0, 200);
  }

  store.addLog({
    agentId: fromAgent,
    level: 'info',
    module: 'Agent Message Bus',
    message: `[${fromAgent.toUpperCase()} -> ${toAgent.toUpperCase()}]: ${message}`,
  });

  return msg;
}
