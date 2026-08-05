import React, { useEffect, useMemo, useState } from 'react';
import { NavTab, WatchlistTopic, AIAgent, Briefing, EvaluationRecord, ApiKeyRecord, AgentStreamEvent } from './types';
import {
  radarApi,
  ApiBriefing,
  ApiRunRow,
  ApiWatchlist,
  DashboardEvaluationsResponse,
  DashboardMetricsResponse,
} from './api/radarApi';
import { Sidebar } from './components/Navigation/Sidebar';
import { Header } from './components/Navigation/Header';
import { NewWorkspaceModal } from './components/Modals/NewWorkspaceModal';
import { RunResearchModal } from './components/Modals/RunResearchModal';
import { OverviewView } from './components/Views/OverviewView';
import { WatchlistView } from './components/Views/WatchlistView';
import { ResearchRunsView } from './components/Views/ResearchRunsView';
import { AIAgentsView } from './components/Views/AIAgentsView';
import { BriefingsView } from './components/Views/BriefingsView';
import { KnowledgeMemoryView } from './components/Views/KnowledgeMemoryView';
import { EvaluationsView } from './components/Views/EvaluationsView';
import { SettingsView } from './components/Views/SettingsView';
import { ApprovalInterfaceView } from './components/Views/ApprovalInterfaceView';
import { SignInView } from './components/Views/SignInView';

function mapApiBriefingToUi(
  b: ApiBriefing,
  findings?: Array<{ id: number; run_id: string; claim: string; source_url: string; confidence: number | null; is_new: number | null }>,
  topic?: string,
  category?: Briefing['category'],
): Briefing {
  const firstLine = (b.content.split('\n').find((l) => l.trim().length > 0) || 'Radar Briefing')
    .replace(/^\*+|\*+$/g, '')
    .slice(0, 100);

  const findingsList = findings || [];
  const avgConfidence = findingsList.length > 0
    ? Math.round(
        (findingsList.reduce((sum, f) => sum + (f.confidence || 0), 0) / findingsList.length) * 100,
      )
    : 0;
  const uniqueSources = new Set(findingsList.map((f) => f.source_url));

  return {
    id: b.run_id,
    title: topic || firstLine,
    category: category || 'AI_RESEARCH',
    timeAgo: b.sent_at ? 'Sent' : 'Draft',
    confidence: avgConfidence,
    sourcesCount: uniqueSources.size,
    generatedDate: b.sent_at || '',
    executiveSummary: b.content,
    keyFindings: findingsList.slice(0, 3).map((f) => ({
      title: f.claim.slice(0, 80),
      description: f.claim,
    })),
    verifiedClaims: findingsList.map((f) => ({
      id: String(f.id),
      claim: f.claim,
      source: f.source_url,
      confidence: Math.round((f.confidence || 0) * 100),
      status: f.is_new ? ('VERIFIED' as const) : ('NEEDS REVIEW' as const),
    })),
    citations: findingsList.map((f) => ({
      ref: `Ref #${f.id}`,
      title: f.source_url,
    })),
  };
}

function formatRelativeTime(timestamp?: string | null): string {
  if (!timestamp) return 'No runs yet';
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return 'No runs yet';
  const delta = Date.now() - value;
  if (delta < 60_000) return 'Just now';
  if (delta < 3_600_000) return `${Math.max(1, Math.round(delta / 60_000))} mins ago`;
  if (delta < 86_400_000) return `${Math.max(1, Math.round(delta / 3_600_000))} hours ago`;
  return `${Math.max(1, Math.round(delta / 86_400_000))} days ago`;
}

function toWatchlistTopic(item: ApiWatchlist, runs: ApiRunRow[]): WatchlistTopic {
  const latestRun = runs.find((run) => run.item_id === item.id);
  const lastRun = latestRun ? latestRun.completed_at || latestRun.started_at : null;
  return {
    id: String(item.id),
    name: item.topic,
    category: (item.category as WatchlistTopic['category']) || 'AI_RESEARCH',
    status: item.active ? 'Active / Pulse' : 'Paused',
    lastRun: formatRelativeTime(lastRun),
    findingsCount: 0,
    findingsNew: 0,
    icon: item.icon || 'psychology',
    frequency: (item.frequency as WatchlistTopic['frequency']) || undefined,
    priority: (item.priority as WatchlistTopic['priority']) || undefined,
    description: item.description || '',
  };
}

function buildAgentFleet(dashboard: DashboardMetricsResponse | null): AIAgent[] {
  if (dashboard?.agent_fleet?.length) {
    return dashboard.agent_fleet.map((agent) => ({
      ...agent,
      status: agent.status as AIAgent['status'],
      pipelineState: agent.pipelineState as AIAgent['pipelineState'],
      lastExecution: agent.lastExecution || 'No live run',
      colorClass: agent.colorClass || 'text-slate-400',
      borderColor: agent.borderColor || 'border-white/10',
      bgLight: agent.bgLight || 'bg-white/5',
      runId: agent.runId ?? undefined,
      runTopic: agent.runTopic ?? undefined,
    }));
  }

  const activeStatuses = new Set(['running', 'queued', 'processing_approval', 'awaiting_approval']);
  const latestActive = [...(dashboard?.agent_statuses ?? [])]
    .filter((entry) => activeStatuses.has(entry.status))
    .sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime())[0];
  const stepOrder = ['planner', 'researcher', 'verifier', 'writer', 'deliverer'];
  const roleRows: Array<Pick<AIAgent, 'id' | 'name' | 'description' | 'icon' | 'colorClass' | 'borderColor' | 'bgLight' | 'model'>> = [
    {
      id: 'planner',
      name: 'Planner Agent',
      description: 'Breaks topics into executable research questions.',
      icon: 'account_tree',
      colorClass: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      bgLight: 'bg-blue-500/10',
      model: 'Ollama - llama3.2:3b',
    },
    {
      id: 'researcher',
      name: 'Research Agent',
      description: 'Fetches and extracts live source material.',
      icon: 'radar',
      colorClass: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      bgLight: 'bg-purple-500/10',
      model: 'Ollama - llama3.2:3b',
    },
    {
      id: 'verifier',
      name: 'Verifier Agent',
      description: 'Checks every claim against source text.',
      icon: 'verified',
      colorClass: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      bgLight: 'bg-emerald-500/10',
      model: 'Groq - llama-3.3-70b-versatile',
    },
    {
      id: 'writer',
      name: 'Writer Agent',
      description: 'Compiles the briefing draft.',
      icon: 'edit_note',
      colorClass: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgLight: 'bg-amber-500/10',
      model: 'Ollama - llama3.2:3b',
    },
    {
      id: 'deliverer',
      name: 'Deliverer Agent',
      description: 'Handles approval and email delivery.',
      icon: 'send',
      colorClass: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      bgLight: 'bg-cyan-500/10',
      model: 'Rule Engine',
    },
  ];

  return roleRows.map((role) => {
    const activeEntry = latestActive && latestActive.current_step === role.id ? latestActive : undefined;
    const activeIndex = latestActive?.current_step ? stepOrder.indexOf(latestActive.current_step) : -1;
    const roleIndex = stepOrder.indexOf(role.id);
    const completedOrActive = latestActive && activeIndex >= 0 && roleIndex <= activeIndex;
    const isQueued = Boolean(latestActive) && activeIndex >= 0 && roleIndex > activeIndex;
    const isWaitingApproval = latestActive?.status === 'awaiting_approval' && role.id === 'deliverer';
    const queuePosition = isQueued ? roleIndex - activeIndex : null;
    return {
      ...role,
      status: activeEntry
        ? 'Busy'
        : isWaitingApproval
        ? 'Awaiting Approval'
        : isQueued
        ? 'Queued'
        : completedOrActive
        ? 'Online'
        : 'Offline',
      lastExecution: activeEntry?.started_at
        ? formatRelativeTime(activeEntry.started_at)
        : latestActive?.started_at
        ? formatRelativeTime(latestActive.started_at)
        : 'No live run',
      successRate: dashboard && dashboard.counts.runs > 0 ? Number(((dashboard.counts.runs - dashboard.counts.new_findings) / dashboard.counts.runs * 100).toFixed(1)) : 0,
      runTopic: latestActive?.topic,
      runId: latestActive?.run_id ?? undefined,
      pipelineState: activeEntry
        ? 'running'
        : isWaitingApproval
        ? 'waiting_approval'
        : isQueued
        ? 'queued'
        : completedOrActive
        ? 'completed'
        : 'idle',
      queuePosition,
    };
  });
}

function buildAgentStream(dashboard: DashboardMetricsResponse | null): AgentStreamEvent[] {
  const events = dashboard?.agent_statuses ?? [];
  return events.slice(0, 10).map((entry, index) => ({
    id: `${entry.run_id || 'idle'}-${index}`,
    timeAgo: formatRelativeTime(entry.started_at),
    agentName: entry.current_step ? entry.current_step.toUpperCase() : entry.topic,
    action: entry.status,
    details: entry.briefing_draft || entry.error || entry.topic,
    tag: entry.run_id ? 'LIVE' : 'IDLE',
    tagType: entry.run_id ? 'primary' : 'neutral',
    color: entry.status === 'failed' ? '#ef4444' : entry.status === 'awaiting_approval' ? '#f59e0b' : '#3b82f6',
  }));
}

function toNodeLogs(
  dashboard: DashboardMetricsResponse | null,
  step: string
): Array<{ timestamp: string; status: string; message: string; details?: unknown }> {
  return (dashboard?.current_run_events || [])
    .filter((event) => event.step === step)
    .map((event) => ({
      timestamp: event.timestamp,
      status: event.status,
      message: event.message || `${event.step} ${event.status}`,
      details: event.details,
    }));
}

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [watchlists, setWatchlists] = useState<WatchlistTopic[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [agentStream, setAgentStream] = useState<AgentStreamEvent[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [unreadApprovalCount, setUnreadApprovalCount] = useState<number>(0);
  const [pendingApproval, setPendingApproval] = useState<{
    runId: string;
    topic: string;
    briefingDraft: string;
  } | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMetricsResponse | null>(null);
  const [dashboardEvaluations, setDashboardEvaluations] = useState<DashboardEvaluationsResponse | null>(null);
  const [dashboardSettings, setDashboardSettings] = useState<{ system: { database: string; watchlists: number; runs: number; briefings: number } } | null>(null);

  // Modals state
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [isRunResearchModalOpen, setIsRunResearchModalOpen] = useState(false);
  const [runModalContext, setRunModalContext] = useState<{ watchlistItemId?: number; topic?: string } | null>(null);

  const refreshDashboard = async () => {
    try {
      const [metrics, evaluationsResponse, settingsResponse] = await Promise.all([
        radarApi.getDashboardMetrics(),
        radarApi.getDashboardEvaluations(),
        radarApi.getDashboardSettings(),
      ]);

      setDashboard(metrics);
      setDashboardEvaluations(evaluationsResponse);
      setDashboardSettings(settingsResponse);

      const runRows = metrics.runs;
      const findingsByRun = new Map<string, { total: number; newCount: number }>();
      metrics.findings.forEach((finding) => {
        const current = findingsByRun.get(finding.run_id) || { total: 0, newCount: 0 };
        current.total += 1;
        current.newCount += finding.is_new ? 1 : 0;
        findingsByRun.set(finding.run_id, current);
      });

      const watchlistMap = new Map<number, WatchlistTopic>();
      metrics.watchlists.forEach((item) => {
        watchlistMap.set(item.id, toWatchlistTopic(item, runRows));
      });
      setWatchlists(Array.from(watchlistMap.values()));

      // Join findings and topic to each briefing for rich UI rendering
      const findingsDataByRun = new Map<string, typeof metrics.findings>();
      metrics.findings.forEach((finding) => {
        const list = findingsDataByRun.get(finding.run_id) || [];
        list.push(finding);
        findingsDataByRun.set(finding.run_id, list);
      });
      const topicByRun = new Map<string, string>();
      metrics.runs.forEach((run) => {
        if (run.watchlist_topic) topicByRun.set(run.id, run.watchlist_topic);
      });
      // Map run_id → category via the watchlist item_id
      const categoryByRun = new Map<string, Briefing['category']>();
      const watchlistById = new Map<number, typeof metrics.watchlists[0]>();
      metrics.watchlists.forEach((w) => watchlistById.set(w.id, w));
      metrics.runs.forEach((run) => {
        const wl = run.item_id != null ? watchlistById.get(run.item_id) : undefined;
        if (wl?.category) categoryByRun.set(run.id, wl.category as Briefing['category']);
      });
      setBriefings(
        (metrics.briefings || []).map((b) =>
          mapApiBriefingToUi(b, findingsDataByRun.get(b.run_id), topicByRun.get(b.run_id), categoryByRun.get(b.run_id)),
        ),
      );
      setAgents(buildAgentFleet(metrics));
      setAgentStream(buildAgentStream(metrics));
      setEvaluations(
        (evaluationsResponse.findings || []).slice(0, 20).map((finding, index) => ({
          id: String(finding.id || index),
          claim: finding.claim,
          expectedResult: finding.source_url,
          radarDecision: finding.is_new ? 'NEW SIGNAL' : 'DEDUPED',
          confidence: Math.round((finding.confidence || 0) * 100),
          status: finding.is_new ? 'WARN' : 'PASS',
          decisionClass: finding.is_new ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        }))
      );
    } catch {
      // Leave the UI empty when the backend is not available.
    }
  };

  const refreshBriefings = () => {
    radarApi
      .getBriefings(20)
      .then((data) => {
        if (data.briefings?.length) {
          setBriefings(data.briefings.map((b) => mapApiBriefingToUi(b)));
        }
      })
      .catch(() => {
        // Backend not reachable yet (e.g. not started) — keep whatever is in state.
      });
  };

  const refreshPendingApprovals = () => {
    radarApi
      .getPendingApprovals()
      .then((data) => {
        setUnreadApprovalCount(data.pending?.length || 0);
        if (data.pending?.length && !pendingApproval) {
          const first = data.pending[0];
          setPendingApproval({
            runId: first.run_id,
            topic: first.topic,
            briefingDraft: first.briefing_draft,
          });
        }
      })
      .catch(() => {
        // Backend not reachable — leave state as-is.
      });
  };

  useEffect(() => {
    refreshDashboard();
    refreshPendingApprovals();
    const interval = setInterval(() => {
      refreshDashboard();
      refreshPendingApprovals();
    }, 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAwaitingApproval = (runId: string, topic: string, briefingDraft: string) => {
    setPendingApproval({ runId, topic, briefingDraft });
    setUnreadApprovalCount((prev) => prev + 1);
    setCurrentTab('approval');
  };

  // Handlers
  const handleAddWatchlist = async (payload: {
    name: string;
    category: WatchlistTopic['category'];
    frequency: WatchlistTopic['frequency'];
    priority: WatchlistTopic['priority'];
    description: string;
    icon: string;
  }) => {
    await radarApi.createWatchlist(payload);
    await refreshDashboard();
  };

  const handleToggleWatchlistStatus = async (id: string) => {
    const current = watchlists.find((w) => w.id === id);
    if (!current) return;
    await radarApi.updateWatchlist(Number(id), current.status !== 'Active / Pulse');
    await refreshDashboard();
  };

  const handleDeleteWatchlist = async (id: string) => {
    await radarApi.deleteWatchlist(Number(id));
    await refreshDashboard();
  };

  const handleResearchCompleted = async (newBriefing: Briefing) => {
    await refreshDashboard();
    setCurrentTab('briefings');
  };

  const handleLaunchStarted = async () => {
    setCurrentTab('agents');
    setIsRunResearchModalOpen(false);
    setRunModalContext(null);
    await refreshDashboard();
  };

  const handleGenerateApiKey = (name: string) => {
    setApiKeys((prev) => prev);
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleApproveSuccess = () => {
    setUnreadApprovalCount(0);
    setPendingApproval(null);
    refreshDashboard();
  };

  const openRunModal = (watchlist?: { watchlistItemId: number; topic: string }) => {
    setRunModalContext(watchlist || null);
    setIsRunResearchModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#131315] text-[#FAFAFA] flex flex-row overflow-x-hidden">
      {/* Sidebar Navigation — hidden on signin/signup */}
      {currentTab !== 'signin' && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNewWorkspace={() => setIsNewWorkspaceModalOpen(true)}
          onRunResearchModal={() => openRunModal()}
          unreadApprovalCount={unreadApprovalCount}
          dashboard={dashboard}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {currentTab !== 'signin' && (
          <Header
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onRunResearchModal={() => openRunModal()}
            dashboard={dashboard}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewView
              agentStream={agentStream}
              onSelectTab={setCurrentTab}
              dashboard={dashboard}
              onRunResearchModal={() => openRunModal()}
            />
          )}

          {currentTab === 'watchlist' && (
            <WatchlistView
              watchlists={watchlists}
              onAddWatchlist={handleAddWatchlist}
              onToggleStatus={handleToggleWatchlistStatus}
              onDeleteWatchlist={handleDeleteWatchlist}
              onRunResearchModal={(watchlist) => openRunModal(watchlist)}
            />
          )}

          {currentTab === 'runs' && (
            <ResearchRunsView
              dashboard={dashboard}
              onRunResearchModal={() => openRunModal()}
            />
          )}

          {currentTab === 'agents' && (
            <AIAgentsView
              agents={agents}
              dashboard={dashboard}
              onRunResearchModal={() => openRunModal()}
            />
          )}

          {currentTab === 'briefings' && (
            <BriefingsView
              briefings={briefings}
              onRunResearchModal={() => openRunModal()}
            />
          )}

          {currentTab === 'memory' && (
            <KnowledgeMemoryView dashboard={dashboard} />
          )}

          {currentTab === 'evaluations' && (
            <EvaluationsView
              evaluations={evaluations}
              summary={dashboardEvaluations?.summary}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              apiKeys={apiKeys}
              onGenerateKey={handleGenerateApiKey}
              onDeleteKey={handleDeleteApiKey}
              systemSummary={dashboardSettings?.system}
            />
          )}

          {currentTab === 'approval' && (
            <ApprovalInterfaceView
              onApproveSuccess={handleApproveSuccess}
              pendingApproval={pendingApproval}
            />
          )}

          {currentTab === 'signin' && (
            <SignInView
              onSignInSuccess={() => setCurrentTab('overview')}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NewWorkspaceModal
        isOpen={isNewWorkspaceModalOpen}
        onClose={() => setIsNewWorkspaceModalOpen(false)}
        onCreate={(name) => {
          alert(`Workspace "${name}" provisioned successfully!`);
        }}
      />

      <RunResearchModal
        isOpen={isRunResearchModalOpen}
        onClose={() => setIsRunResearchModalOpen(false)}
        onLaunchStarted={handleLaunchStarted}
        onResearchCompleted={handleResearchCompleted}
        onAwaitingApproval={handleAwaitingApproval}
        watchlistItemId={runModalContext?.watchlistItemId}
        initialTopic={runModalContext?.topic}
      />
    </div>
  );
}

export default App;