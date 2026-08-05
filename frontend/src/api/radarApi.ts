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

export interface ApiBriefingDetail {
  id: number;
  run_id: string;
  content: string;
  sent_at: string | null;
  topic: string;
  findings: Array<{
    id: number;
    run_id: string;
    claim: string;
    source_url: string;
    confidence: number | null;
    is_new: number | null;
  }>;
}

export interface ApiWatchlist {
  id: number;
  topic: string;
  active: number;
  category?: string | null;
  frequency?: string | null;
  priority?: string | null;
  description?: string | null;
  icon?: string | null;
}

export interface ApiRunRow {
  id: string;
  item_id: number | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  watchlist_topic: string | null;
  watchlist_active: number | null;
}

export interface ApprovalHistoryItem {
  run_id: string;
  status: 'approved' | 'rejected';
  started_at: string | null;
  completed_at: string | null;
  topic: string | null;
  briefing_content: string | null;
  sent_at: string | null;
}

export interface ApprovalHistoryResponse {
  history: ApprovalHistoryItem[];
}

export interface DashboardMetricsResponse {
  watchlists: ApiWatchlist[];
  runs: ApiRunRow[];
  briefings: ApiBriefing[];
  findings: Array<{
    id: number;
    run_id: string;
    claim: string;
    source_url: string;
    confidence: number | null;
    is_new: number | null;
  }>;
  counts: {
    watchlists: number;
    runs: number;
    active_runs: number;
    briefings: number;
    findings: number;
    new_findings: number;
  };
  agent_statuses: Array<{
    run_id: string | null;
    topic: string;
    status: string;
    current_step: string | null;
    started_at?: string;
    briefing_draft?: string;
    error?: string;
  }>;
  active_agents: number;
  busy_agents: number;
  agent_fleet: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    model: string;
    lastExecution: string | null;
    successRate: number;
    icon: string;
    colorClass: string;
    borderColor: string;
    bgLight: string;
    runTopic?: string | null;
    runId?: string | null;
    pipelineState?: string;
    queuePosition?: number | null;
  }>;
  current_run?: {
    run_id: string;
    topic?: string;
    status: string;
    current_step?: string | null;
    started_at?: string;
    briefing_draft?: string;
    error?: string;
  } | null;
  current_run_events?: Array<{
    step: string;
    status: string;
    timestamp: string;
    message?: string;
    details?: unknown;
  }>;
  memory: {
    vector_nodes: number;
    new_nodes: number;
  };
  system: {
    status: string;
    timestamp: string;
  };
}

export interface DashboardEvaluationsResponse {
  summary: {
    accuracy: number;
    precision: number;
    false_positive_rate: number;
    signal_quality: number;
  };
  findings: DashboardMetricsResponse['findings'];
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

  startWatchlistRun: async (watchlistItemId: number, topic?: string): Promise<{ run_id: string; status: string }> => {
    const res = await fetch(`${API_BASE}/watchlists/${watchlistItemId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topic ? { topic } : {}),
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

  getApprovalHistory: async (limit = 50): Promise<ApprovalHistoryResponse> => {
    const res = await fetch(`${API_BASE}/approvals/history?limit=${limit}`);
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

  getDashboardMetrics: async (): Promise<DashboardMetricsResponse> => {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    return handleRes(res);
  },

  getDashboardEvaluations: async (): Promise<DashboardEvaluationsResponse> => {
    const res = await fetch(`${API_BASE}/dashboard/evaluations`);
    return handleRes(res);
  },

  getDashboardSettings: async (): Promise<{ system: { database: string; watchlists: number; runs: number; briefings: number } }> => {
    const res = await fetch(`${API_BASE}/dashboard/settings`);
    return handleRes(res);
  },

  listWatchlists: async (): Promise<{ watchlists: ApiWatchlist[] }> => {
    const res = await fetch(`${API_BASE}/watchlists`);
    return handleRes(res);
  },

  createWatchlist: async (payload: {
    name: string;
    category?: string;
    frequency?: string;
    priority?: string;
    description?: string;
    icon?: string;
  }): Promise<{ id: number; name: string }> => {
    const res = await fetch(`${API_BASE}/watchlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleRes(res);
  },

  updateWatchlist: async (itemId: number, active: boolean): Promise<{ id: number; active: boolean }> => {
    const res = await fetch(`${API_BASE}/watchlists/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    return handleRes(res);
  },

  deleteWatchlist: async (itemId: number): Promise<{ id: number; deleted: boolean }> => {
    const res = await fetch(`${API_BASE}/watchlists/${itemId}`, {
      method: 'DELETE',
    });
    return handleRes(res);
  },

  listRuns: async (limit = 50): Promise<{ runs: ApiRunRow[] }> => {
    const res = await fetch(`${API_BASE}/runs?limit=${limit}`);
    return handleRes(res);
  },

  health: async (): Promise<{ status: string }> => {
    const res = await fetch(`${API_BASE}/health`);
    return handleRes(res);
  },

  getBriefingDetail: async (runId: string): Promise<ApiBriefingDetail> => {
    const res = await fetch(`${API_BASE}/briefings/${runId}`);
    return handleRes(res);
  },

  queryBriefing: async (runId: string, question: string): Promise<{ answer: string }> => {
    const res = await fetch(`${API_BASE}/briefings/${runId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
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
