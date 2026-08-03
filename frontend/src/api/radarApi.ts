// Client for the real Radar backend (FastAPI, wrapping the LangGraph pipeline).
// Base URL is configurable via VITE_API_BASE_URL so this can point at localhost
// during development and at a deployed backend URL in production.

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export interface RunStatus {
  run_id: string;
  topic?: string;
  status: string;
  current_step?: string | null;
  started_at?: string;
  briefing_draft?: string;
  error?: string;
}

export interface PendingApprovalRecord {
  run_id: string;
  topic: string;
  briefing_draft: string;
}

export interface ApiBriefing {
  id: number;
  run_id: string;
  content: string;
  sent_at: string | null;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Radar API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export const radarApi = {
  startRun: async (topic: string): Promise<{ run_id: string; status: string }> => {
    const res = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    return handleRes(res);
  },

  getRun: async (runId: string): Promise<RunStatus> => {
    const res = await fetch(`${API_BASE}/runs/${runId}`);
    return handleRes(res);
  },

  getPendingApprovals: async (): Promise<{ pending: PendingApprovalRecord[] }> => {
    const res = await fetch(`${API_BASE}/approvals/pending`);
    return handleRes(res);
  },

  submitApproval: async (
    runId: string,
    action: 'approve' | 'edit' | 'reject',
    content?: string
  ): Promise<{ run_id: string; status: string }> => {
    const res = await fetch(`${API_BASE}/approvals/${runId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, content }),
    });
    return handleRes(res);
  },

  getBriefings: async (limit = 20): Promise<{ briefings: ApiBriefing[] }> => {
    const res = await fetch(`${API_BASE}/briefings?limit=${limit}`);
    return handleRes(res);
  },

  health: async (): Promise<{ status: string }> => {
    const res = await fetch(`${API_BASE}/health`);
    return handleRes(res);
  },
};

/**
 * Polls GET /runs/{run_id} until it reaches a terminal or approval-pending
 * status, calling onUpdate on every poll. Returns a cancel function so the
 * caller can stop polling (e.g. on unmount).
 */
export function pollRunUntilSettled(
  runId: string,
  onUpdate: (status: RunStatus) => void,
  onError?: (err: Error) => void,
  intervalMs = 3000,
  timeoutMs = 5 * 60 * 1000
): () => void {
  let stopped = false;
  const start = Date.now();
  const terminalStatuses = new Set([
    'awaiting_approval',
    'approved',
    'rejected',
    'skipped_no_news',
    'send_failed',
    'failed',
  ]);

  const tick = async () => {
    if (stopped) return;
    try {
      const status = await radarApi.getRun(runId);
      if (stopped) return;
      onUpdate(status);
      if (terminalStatuses.has(status.status)) return;
      if (Date.now() - start > timeoutMs) return;
      setTimeout(tick, intervalMs);
    } catch (err: any) {
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      if (Date.now() - start > timeoutMs) return;
      setTimeout(tick, intervalMs);
    }
  };

  tick();
  return () => {
    stopped = true;
  };
}
