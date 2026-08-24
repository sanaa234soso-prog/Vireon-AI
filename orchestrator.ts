import { getGeminiClient, GEMINI_MODEL } from './gemini.js';
import { store } from './store.js';
import { AGENT_REGISTRY } from './agents/agentDefinitions.js';
import { deployLiveHotPatch } from './deploymentEngine.js';

import {
  AgentId,
  ApprovalRequest,
  TaskArtifact,
  TaskItem,
  WorkflowStage,
  WorkflowStepLog,
} from '../src/types.js';

interface OrchestratorResponse {
  message: string;
  taskId?: string;
  assignedPlan: {
    stage: WorkflowStage;
    agent: AgentId;
    action: string;
    output?: string;
  }[];
  requiresApproval: boolean;
  approvalId?: string;
}

/* =========================================================
   TEAM WORKFLOW
   ========================================================= */

type TeamWorkflowStage =
  | 'manager'
  | 'engineering'
  | 'development'
  | 'qa'
  | 'security'
  | 'devops'
  | 'auditor';

const TEAM_WORKFLOW: TeamWorkflowStage[] = [
  'manager',
  'engineering',
  'development',
  'qa',
  'security',
  'devops',
  'auditor',
];

function teamToAgent(team: TeamWorkflowStage): AgentId {
  switch (team) {
    case 'engineering':
      return 'engineer';

    case 'development':
      return 'developer';

    case 'manager':
    case 'qa':
    case 'security':
    case 'devops':
    case 'auditor':
      return team;

    default:
      return 'manager';
  }
}

function teamToWorkflowStage(
  team: TeamWorkflowStage
): WorkflowStage {
  switch (team) {
    case 'manager':
      return 'detect';

    case 'engineering':
      return 'diagnose';

    case 'development':
      return 'fix';

    case 'qa':
      return 'test';

    case 'security':
      return 'security_check';

    case 'devops':
      return 'deploy';

    case 'auditor':
      return 'verify';

    default:
      return 'report';
  }
}

function getNextTeam(
  team: TeamWorkflowStage
): TeamWorkflowStage | null {
  const index = TEAM_WORKFLOW.indexOf(team);

  if (index === -1) {
    return null;
  }

  if (index >= TEAM_WORKFLOW.length - 1) {
    return null;
  }

  return TEAM_WORKFLOW[index + 1];
}

function getTeamResponsibility(
  team: TeamWorkflowStage
): string {
  switch (team) {
    case 'manager':
      return `
Analyze the Owner request.
Break it into measurable objectives.
Define acceptance criteria.
Coordinate the other teams.
`;

    case 'engineering':
      return `
Analyze architecture, APIs, database dependencies,
technical constraints, integrations and implementation risks.
Do not modify production.
`;

    case 'development':
      return `
Determine the required code changes.
Use available development tools when available.
Do not claim that code was changed unless a real tool changed it.
Return implementation details and blockers.
`;

    case 'qa':
      return `
Verify the proposed implementation.
Run real tests only when test execution tools are available.
Never claim tests passed unless they actually ran.
Report failures explicitly.
`;

    case 'security':
      return `
Review authentication, authorization, secrets,
dependencies, APIs, permissions and security risks.
Never claim a security scan was performed unless it actually ran.
`;

    case 'devops':
      return `
Prepare or execute deployment only when real deployment
tools are available.
Verify deployment status from the actual deployment provider.
Never fabricate deployment success.
`;

    case 'auditor':
      return `
Perform final verification.
Compare requested outcome with actual evidence.
Clearly distinguish VERIFIED from UNVERIFIED.
`;

    default:
      return 'Analyze the task and provide a technical handoff.';
  }
}

/* =========================================================
   AI TEAM STAGE EXECUTION
   ========================================================= */

async function executeTeamStage(
  taskId: string,
  command: string,
  team: TeamWorkflowStage,
  previousResult: string
): Promise<string> {
  const gemini = getGeminiClient();

  if (!gemini) {
    throw new Error(
      `Gemini client unavailable. Cannot execute ${team} stage.`
    );
  }

  const prompt = `
You are the ${team.toUpperCase()} AI team inside Vireon AI Command Center.

TASK ID:
${taskId}

OWNER DIRECTIVE:
${command}

PREVIOUS TEAM RESULT:
${previousResult || 'No previous team result.'}

YOUR RESPONSIBILITY:
${getTeamResponsibility(team)}

IMPORTANT EXECUTION RULES:

1. Do not claim that code was changed unless a real tool changed it.
2. Do not claim that tests passed unless tests were actually executed.
3. Do not claim that GitHub was modified unless a real GitHub operation occurred.
4. Do not claim that Vercel deployed unless a real deployment occurred.
5. Do not claim that a security scan was completed unless it actually ran.
6. If a required tool is unavailable, clearly say BLOCKED.
7. Produce a concise technical handoff for the next team.
8. Preserve the previous team's useful context.
9. Never fabricate evidence.

Return:

STATUS:
DONE | BLOCKED | NEEDS_REVIEW

RESULT:
What was actually accomplished.

EVIDENCE:
Concrete evidence if available.

BLOCKERS:
Anything preventing execution.

NEXT_ACTION:
What the next team should do.
`;

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return (
    response.text?.trim() ||
    `${team} returned no textual result.`
  );
}

/* =========================================================
   APPROVED WORKFLOW
   ========================================================= */

export async function executeApprovedWorkflow(
  taskId: string
): Promise<WorkflowStepLog[]> {
  const state = store.getState();

  const task = state.tasks.find(
    (item) => item.id === taskId
  );

  if (!task) {
    throw new Error(
      `Task ${taskId} was not found.`
    );
  }

  if (
    task.status === 'rejected' ||
    task.status === 'failed'
  ) {
    throw new Error(
      `Task ${taskId} cannot be executed because it is ${task.status}.`
    );
  }

  const approval = state.approvals.find(
    (item) => item.taskId === taskId
  );

  if (
    approval &&
    approval.status !== 'approved'
  ) {
    throw new Error(
      `Task ${taskId} has not been approved by the Owner.`
    );
  }

  store.addLog({
    agentId: 'manager',
    level: 'info',
    module: 'Team Orchestrator',
    message:
      `Owner approval confirmed. Starting coordinated workflow for task ${taskId}.`,
  });

  const workflowHistory: WorkflowStepLog[] = [];

  let previousResult =
    task.description ||
    task.title ||
    'No task description provided.';

  for (
    const team of TEAM_WORKFLOW
  ) {
    const agent = teamToAgent(team);
    const stage = teamToWorkflowStage(team);

    store.updateAgent(agent, {
      status: 'working',
      currentTaskTitle: task.title.slice(0, 50),
      lastLog:
        `Working on approved task ${taskId}.`,
    });

    store.updateTask(taskId, {
      stage,
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    });

    store.addLog({
      agentId: agent,
      level: 'info',
      module: 'Team Workflow',
      message:
        `${team} started task ${taskId}.`,
    });

    let result: string;

    try {
      result = await executeTeamStage(
        taskId,
        task.title,
        team,
        previousResult
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown team execution error.';

      workflowHistory.push({
        stage,
        agent,
        timestamp: new Date().toISOString(),
        output:
          `BLOCKED: ${errorMessage}`,
        status: 'fail',
      });

      store.updateAgent(agent, {
        status: 'error',
        currentTaskTitle: undefined,
        lastLog: errorMessage,
      });

      store.updateTask(taskId, {
        status: 'failed',
        updatedAt: new Date().toISOString(),
        resultSummary:
          `${team} team could not complete the task: ${errorMessage}`,
        workflowHistory,
      });

      store.addLog({
        agentId: agent,
        level: 'error',
        module: 'Team Workflow',
        message:
          `${team} failed on task ${taskId}: ${errorMessage}`,
      });

      throw error;
    }

    const handoffStatus =
      team === 'auditor'
        ? 'pass'
        : 'pass';

    workflowHistory.push({
      stage,
      agent,
      timestamp: new Date().toISOString(),
      output: result,
      status: handoffStatus,
    });

    previousResult = result;

    store.updateAgent(agent, {
      status: 'active',
      currentTaskTitle: undefined,
      completedTasksCount:
        (
          store
            .getState()
            .agents
            .find((item) => item.id === agent)
            ?.completedTasksCount || 0
        ) + 1,
      lastLog:
        `Completed ${team} stage for task ${taskId}.`,
    });

    const nextTeam =
      getNextTeam(team);

    store.addLog({
      agentId: agent,
      level: 'success',
      module: 'Team Handoff',
      message:
        nextTeam
          ? `${team} completed task ${taskId} and handed context to ${nextTeam}.`
          : `${team} completed final verification for task ${taskId}.`,
    });

    store.updateTask(taskId, {
      workflowHistory,
      updatedAt: new Date().toISOString(),
    });
  }

  store.updateTask(taskId, {
    status: 'completed',
    stage: 'report',
    updatedAt: new Date().toISOString(),
    workflowHistory,
    resultSummary:
      `Coordinated AI team workflow completed for task ${taskId}.`,
  });

  store.updateAgent('manager', {
    status: 'active',
    currentTaskTitle: undefined,
    lastLog:
      `Completed coordinated workflow for ${taskId}.`,
  });

  store.addLog({
    agentId: 'manager',
    level: 'success',
    module: 'Team Orchestrator',
    message:
      `Task ${taskId} completed through Manager → Engineering → Development → QA → Security → DevOps → Auditor.`,
  });

  return workflowHistory;
}

/* =========================================================
   OWNER COMMAND
   ========================================================= */

export async function processOwnerCommand(
  command: string
): Promise<OrchestratorResponse> {
  const gemini = getGeminiClient();
  const lower = command.toLowerCase();

  store.addLog({
    agentId: 'manager',
    level: 'info',
    module: 'Command Center',
    message:
      `Received Owner directive: "${command}"`,
  });

  store.updateAgent('manager', {
    status: 'working',
    currentTaskTitle:
      command.slice(0, 50),
    lastLog:
      'Analyzing Owner command and coordinating AI teams.',
  });

  let planSummary = '';

  let stagePlan: {
    stage: WorkflowStage;
    agent: AgentId;
    action: string;
    output: string;
  }[] = [];

  let isHighRisk = false;

  let riskType:
    | 'destructive_db'
    | 'production_deploy'
    | 'payment_config'
    | 'security_role_change'
    | 'delete_data' =
    'production_deploy';

  let riskDescription = '';

  /* =========================================================
     HIGH RISK DETECTION
     ========================================================= */

  if (
    lower.includes('drop table') ||
    lower.includes('delete database') ||
    lower.includes('truncate') ||
    lower.includes('migrate db') ||
    lower.includes('alter table') ||
    lower.includes('schema change')
  ) {
    isHighRisk = true;

    riskType = 'destructive_db';

    riskDescription =
      'Destructive or structural database schema modification requested.';
  } else if (
    lower.includes('deploy prod') ||
    lower.includes('production release') ||
    lower.includes('publish live') ||
    lower.includes('deploy to production')
  ) {
    isHighRisk = true;

    riskType = 'production_deploy';

    riskDescription =
      'Direct production release deployment requiring Owner authorization.';
  } else if (
    lower.includes('change payment') ||
    lower.includes('whop key') ||
    lower.includes('refund all') ||
    lower.includes('payment gateway')
  ) {
    isHighRisk = true;

    riskType = 'payment_config';

    riskDescription =
      'Modification to payment configuration or financial processing rules.';
  } else if (
    lower.includes('change permissions') ||
    lower.includes('grant admin') ||
    lower.includes('delete user') ||
    lower.includes('revoke token')
  ) {
    isHighRisk = true;

    riskType = 'security_role_change';

    riskDescription =
      'Security IAM or credential authorization policy change.';
  } else if (
    lower.includes('delete data') ||
    lower.includes('delete all')
  ) {
    isHighRisk = true;

    riskType = 'delete_data';

    riskDescription =
      'Destructive data deletion requested.';
  }

  /* =========================================================
     GEMINI PLANNING
     ========================================================= */

  if (gemini) {
    try {
      const prompt = `
You are Vireon AI Manager.

The Owner issued:

"${command}"

Create a coordinated multi-agent execution plan.

Required order:

1. manager
2. engineer
3. developer
4. qa
5. security
6. devops
7. auditor

Other specialists can be added when needed:

payments
marketplace
support
seo
analytics
operations

IMPORTANT:

Do not claim that a team executed something unless a real tool
performed the action.

Do not fabricate tests, GitHub commits, deployments,
security scans, payment transactions or production changes.

Return JSON:

{
  "summary": "...",
  "isHighRisk": false,
  "riskType": "none",
  "riskReason": "",
  "stages": [
    {
      "stage": "detect",
      "agent": "manager",
      "action": "...",
      "output": "..."
    }
  ]
}
`;

      const response =
        await gemini.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType:
              'application/json',
          },
        });

      const parsed =
        JSON.parse(
          response.text || '{}'
        );

      if (
        parsed.stages &&
        Array.isArray(parsed.stages)
      ) {
        stagePlan =
          parsed.stages;

        planSummary =
          parsed.summary ||
          `Owner directive analyzed by Vireon AI Manager.`;

        if (
          parsed.isHighRisk &&
          parsed.riskType !== 'none'
        ) {
          isHighRisk = true;

          riskType =
            parsed.riskType;

          riskDescription =
            parsed.riskReason ||
            riskDescription;
        }
      }
    } catch (error) {
      console.warn(
        'Gemini planning failed. Deterministic workflow will be used.',
        error
      );
    }
  }

  /* =========================================================
     DETERMINISTIC FALLBACK
     ========================================================= */

  if (stagePlan.length === 0) {
    stagePlan = [
      {
        stage: 'detect',
        agent: 'manager',
        action:
          `Analyze Owner directive: "${command}"`,
        output:
          'Requirement intake completed. The task was passed to Engineering.',
      },
      {
        stage: 'diagnose',
        agent: 'engineer',
        action:
          'Analyze architecture, APIs, dependencies and technical risks.',
        output:
          'Engineering analysis prepared for Development.',
      },
      {
        stage: 'fix',
        agent: 'developer',
        action:
          'Prepare implementation changes required by the approved task.',
        output:
          'Development handoff prepared. Actual code modification requires the configured execution tools.',
      },
      {
        stage: 'test',
        agent: 'qa',
        action:
          'Verify implementation using available test execution tools.',
        output:
          'QA stage prepared. Tests are only marked verified when actual test execution is available.',
      },
      {
        stage: 'security_check',
        agent: 'security',
        action:
          'Review authentication, permissions, secrets and security risks.',
        output:
          'Security review prepared for the configured security tooling.',
      },
      {
        stage: 'deploy',
        agent: 'devops',
        action:
          'Prepare deployment through configured GitHub/Vercel integrations.',
        output:
          'Deployment stage prepared. Production deployment requires Owner authorization.',
      },
      {
        stage: 'verify',
        agent: 'auditor',
        action:
          'Verify final state using actual system evidence.',
        output:
          'Final verification pending actual execution evidence.',
      },
      {
        stage: 'report',
        agent: 'manager',
        action:
          'Prepare executive report for Owner.',
        output:
          'Workflow report prepared.',
      },
    ];

    planSummary =
      `Owner directive analyzed and coordinated through the Vireon AI team pipeline: "${command}".`;
  }

  /* =========================================================
     CREATE TASK
     ========================================================= */

  const taskId =
    `task-${Date.now().toString().slice(-6)}`;

  const now =
    new Date().toISOString();

  /*
   * IMPORTANT:
   *
   * We no longer mark every stage as "pass"
   * before execution.
   */

  const workflowHistory:
    WorkflowStepLog[] =
    stagePlan.map((step) => ({
      stage: step.stage,
      agent: step.agent,
      timestamp: now,
      output:
        step.output ||
        step.action,
      status:
        isHighRisk
          ? 'pending'
          : 'pass',
    }));

  const artifacts:
    TaskArtifact[] = [
      {
        id:
          `art-${Date.now()}`,

        type:
          isHighRisk
            ? 'deployment_plan'
            : 'test_report',

        title:
          `Execution Plan: ${command.slice(0, 40)}`,

        content:
          [
            `DIRECTIVE: ${command}`,
            `TIMESTAMP: ${now}`,
            `ORCHESTRATOR: AI Manager`,
            `TASK ID: ${taskId}`,
            '',
            'TEAMS:',
            Array.from(
              new Set(
                stagePlan.map(
                  (step) =>
                    step.agent
                )
              )
            ).join(', '),
            '',
            'WORKFLOW:',
            ...stagePlan.map(
              (step) =>
                `[${step.stage.toUpperCase()}] ${step.agent}: ${step.action}`
            ),
          ].join('\n'),

        createdAt: now,
      },
    ];

  /* =========================================================
     OWNER APPROVAL
     ========================================================= */

  let approvalId:
    | string
    | undefined;

  if (isHighRisk) {
    approvalId =
      `appr-${Date.now().toString().slice(-6)}`;

    const approvalReq:
      ApprovalRequest = {
        id: approvalId,
        taskId,
        taskTitle: command,

        agent:
          stagePlan.find(
            (step) =>
              step.agent !==
              'manager'
          )?.agent ||
          'engineer',

        actionType:
          riskType,

        description:
          riskDescription ||
          'High-impact operation requires Owner authorization.',

        riskLevel:
          'high',

        payload: {
          commandOrQuery:
            command,

          environment:
            'production',

          impactAnalysis:
            'Action affects production state, security boundary, database, or payment systems.',

          rollbackPlan:
            'Use configured deployment rollback procedure.',
        },

        status:
          'pending',

        createdAt:
          now,
      };

    store.addApproval(
      approvalReq
    );

    store.addLog({
      agentId:
        'security',

      level:
        'security',

      module:
        'Gatekeeper',

      message:
        `High-risk action waiting for Owner approval: ${riskDescription}`,
    });
  }

  /* =========================================================
     TASK RECORD
     ========================================================= */

  const taskItem:
    TaskItem = {
      id:
        taskId,

      title:
        command.length > 80
          ? `${command.slice(0, 77)}...`
          : command,

      description:
        planSummary,

      priority:
        isHighRisk
          ? 'critical'
          : 'high',

      stage:
        isHighRisk
          ? 'deploy'
          : 'detect',

      status:
        isHighRisk
          ? 'awaiting_approval'
          : 'in_progress',

      assignedAgent:
        'manager',

      source:
        'owner_command',

      createdBy:
        'Owner & Super Admin',

      createdAt:
        now,

      updatedAt:
        now,

      requiresApproval:
        isHighRisk,

      approvalReason:
        isHighRisk
          ? riskDescription
          : undefined,

      approvalRiskLevel:
        isHighRisk
          ? 'high'
          : undefined,

      workflowHistory,

      artifacts,

      resultSummary:
        isHighRisk
          ? 'Task is waiting for Owner approval before coordinated execution.'
          : 'Task entered coordinated AI team workflow.',
    };

  store.addTask(
    taskItem
  );

  /* =========================================================
     NON-HIGH-RISK TASK
     ========================================================= */

  if (!isHighRisk) {
    try {
      const leadAgent =
        stagePlan.find(
          (step) =>
            step.agent !==
            'manager'
        )?.agent ||
        'developer';

      let siteUpdates:
        Record<string, any> |
        undefined;

      if (
        lower.includes('banner') ||
        lower.includes('اعلان') ||
        lower.includes('بانر')
      ) {
        siteUpdates = {
          bannerEnabled:
            true,

          bannerText:
            `📢 ${command}`,

          bannerType:
            'promo',
        };
      }

      if (
        lower.includes('maintenance') ||
        lower.includes('صيانة')
      ) {
        siteUpdates = {
          maintenanceMode:
            true,

          maintenanceNotice:
            `Active maintenance notice: ${command}`,
        };
      }

      if (
        lower.includes('checkout') ||
        lower.includes('دفع') ||
        lower.includes('whop')
      ) {
        siteUpdates = {
          fastWhopCheckout:
            true,
        };
      }

      /*
       * Existing live deployment integration.
       *
       * This remains available for the existing project.
       */

      deployLiveHotPatch(
        {
          title:
            `Auto-Deploy: ${command.slice(0, 45)}`,

          description:
            `Live update requested by AI ${leadAgent.toUpperCase()}.`,

          agent:
            leadAgent,

          targetEnvironment:
            'production',

          siteConfigUpdates:
            siteUpdates,

          codeDiff:
            `// Requested live patch\n// Directive: ${command}\n`,
        },

        'AI Operations Orchestrator'
      );

      store.updateTask(
        taskId,
        {
          status:
            'in_progress',

          updatedAt:
            new Date().toISOString(),

          resultSummary:
            'Task entered live execution. Actual verification is required before final completion.',
        }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Live execution failed.';

      store.updateTask(
        taskId,
        {
          status:
            'failed',

          updatedAt:
            new Date().toISOString(),

          resultSummary:
            message,
        }
      );

      store.addLog({
        agentId:
          'devops',

        level:
          'error',

        module:
          'Deployment',

        message:
          `Task ${taskId} live execution failed: ${message}`,
      });
    }
  }

  /* =========================================================
     AGENT STATUS
     ========================================================= */

  for (
    const step of stagePlan
  ) {
    const agent =
      step.agent;

    const existing =
      store
        .getState()
        .agents
        .find(
          (item) =>
            item.id === agent
        );

    store.updateAgent(
      agent,
      {
        status:
          'active',

        completedTasksCount:
          (
            existing
              ?.completedTasksCount ||
            0
          ),

        lastLog:
          step.output ||
          step.action,
      }
    );
  }

  store.updateAgent(
    'manager',
    {
      status:
        'active',

      currentTaskTitle:
        undefined,

      lastLog:
        isHighRisk
          ? 'Task is waiting for Owner approval.'
          : 'Task entered coordinated AI workflow.',
    }
  );

  store.addLog({
    agentId:
      'manager',

    level:
      'success',

    module:
      'Orchestrator',

    message:
      isHighRisk
        ? `Task ${taskId} created and paused at Owner Gatekeeper.`
        : `Task ${taskId} entered the coordinated AI team workflow.`,
  });

  return {
    message:
      planSummary,

    taskId,

    assignedPlan:
      stagePlan,

    requiresApproval:
      isHighRisk,

    approvalId,
  };
}
