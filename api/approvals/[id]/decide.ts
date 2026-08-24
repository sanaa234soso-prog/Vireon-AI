import { store } from '../../../server/store.js';
import { commitFileToGitHub } from '../../../server/github.js';

type RequestWithQuery = Request & {
  query?: Record<string, string | string[] | undefined>;
};

type ApprovalDecision = 'approved' | 'rejected';

function json(
  status: number,
  body: unknown,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
}

export default async function handler(
  req: RequestWithQuery,
): Promise<Response> {
  if (req.method !== 'POST') {
    return json(405, {
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const url = new URL(req.url);

    const parts = url.pathname
      .split('/')
      .filter(Boolean);

    const decideIndex =
      parts.indexOf('decide');

    const id =
      decideIndex > 0
        ? parts[decideIndex - 1]
        : '';

    if (!id) {
      return json(400, {
        success: false,
        error: 'Approval ID is required',
      });
    }

    const body = await req.json().catch(
      () => ({}),
    );

    const decision =
      body?.decision as ApprovalDecision;

    const notes =
      typeof body?.notes === 'string'
        ? body.notes.trim()
        : '';

    if (
      decision !== 'approved' &&
      decision !== 'rejected'
    ) {
      return json(400, {
        success: false,
        error:
          'Decision must be approved or rejected',
      });
    }

    const current =
      store
        .getState()
        .approvals
        .find(
          (item) => item.id === id,
        );

    if (!current) {
      return json(404, {
        success: false,
        error:
          'Approval request not found',
      });
    }

    if (current.status !== 'pending') {
      return json(409, {
        success: false,
        error:
          `This approval is already ${current.status}`,
      });
    }

    const approval =
      store.resolveApproval(
        id,
        decision,
        notes,
      );

    if (!approval) {
      return json(409, {
        success: false,
        error:
          'Approval was already processed',
      });
    }

    const now =
      new Date().toISOString();

    /*
     * REJECT
     */
    if (decision === 'rejected') {
      if (approval.taskId) {
        store.updateTask(
          approval.taskId,
          {
            status: 'failed',
            stage: 'report',
            approvedBy:
              approval.resolvedBy ||
              store.getState().owner.email,
            approvedAt: now,
            resultSummary:
              `Rejected by Owner: ${
                notes ||
                'Authorization withheld.'
              }`,
            updatedAt: now,
          },
        );
      }

      store.addLog({
        agentId: 'security',
        level: 'warn',
        module:
          'Owner Gatekeeper',
        message:
          `Owner rejected approval ${id} for task "${approval.taskTitle}"`,
      });
    }

    /*
     * APPROVE
     *
     * Approval itself is now recorded as a real
     * state transition. We deliberately do NOT mark
     * the task "completed" here.
     */
    if (decision === 'approved') {
      if (!approval.taskId) {
        return json(400, {
          success: false,
          error:
            'Approval has no associated task',
        });
      }

      store.updateTask(
        approval.taskId,
        {
          status: 'in_progress',
          stage: 'diagnose',
          approvedBy:
            approval.resolvedBy ||
            store.getState().owner.email,
          approvedAt: now,
          resultSummary:
            'Owner approved the operation. The task is authorized for execution.',
          updatedAt: now,
        },
      );

      store.addLog({
        agentId: 'security',
        level: 'success',
        module:
          'Owner Gatekeeper',
        message:
          `Owner approved approval ${id} for task "${approval.taskTitle}"`,
      });
    }

    /*
     * Persist an immutable approval audit
     * to the configured GitHub repository.
     */
    let githubAudit = {
      attempted: false,
      success: false,
      error: undefined as
        | string
        | undefined,
    };

    try {
      githubAudit.attempted = true;

      const auditDocument = {
        approvalId: approval.id,
        taskId: approval.taskId,
        taskTitle: approval.taskTitle,
        actionType: approval.actionType,
        riskLevel: approval.riskLevel,
        decision,
        notes: approval.notes || '',
        resolvedBy:
          approval.resolvedBy,
        resolvedAt:
          approval.resolvedAt,
        environment:
          approval.payload.environment,
        commandOrQuery:
          approval.payload.commandOrQuery,
        timestamp: now,
      };

      const githubResult =
        await commitFileToGitHub(
          `data/approvals/${approval.id}.json`,
          `${JSON.stringify(
            auditDocument,
            null,
            2,
          )}\n`,
          `owner: ${decision} approval ${approval.id}`,
          process.env.GITHUB_BRANCH?.trim() ||
            'main',
        );

      githubAudit.success =
        githubResult.success;

      if (!githubResult.success) {
        githubAudit.error =
          githubResult.error ||
          'GitHub audit commit failed';
      }
    } catch (error) {
      githubAudit.error =
        error instanceof Error
          ? error.message
          : 'GitHub audit failed';
    }

    return json(200, {
      success: true,
      decision,
      executed:
        decision === 'approved',
      data: approval,
      githubAudit,
    });
  } catch (error) {
    console.error(
      'Owner approval API error:',
      error,
    );

    return json(500, {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Internal server error',
    });
  }
}
