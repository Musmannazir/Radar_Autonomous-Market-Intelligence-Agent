import React, { useEffect, useState } from 'react';
import { NavTab, WatchlistTopic, AIAgent, Briefing, EvaluationRecord, ApiKeyRecord, AgentStreamEvent } from './types';
import { INITIAL_WATCHLISTS, INITIAL_AGENTS, INITIAL_BRIEFINGS, INITIAL_EVALUATIONS, INITIAL_AGENT_STREAM, INITIAL_API_KEYS } from './data/mockData';
import { radarApi, ApiBriefing } from './api/radarApi';

function mapApiBriefingToUi(b: ApiBriefing): Briefing {
  const firstLine = (b.content.split('\n').find((l) => l.trim().length > 0) || 'Radar Briefing')
    .replace(/^\*+|\*+$/g, '')
    .slice(0, 100);
  return {
    id: b.run_id,
    title: firstLine,
    category: 'INTELLIGENCE',
    timeAgo: b.sent_at ? 'Sent' : 'Draft',
    confidence: 0,
    sourcesCount: 0,
    generatedDate: b.sent_at || '',
    executiveSummary: b.content,
    keyFindings: [],
    verifiedClaims: [],
    citations: [],
  };
}
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

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [watchlists, setWatchlists] = useState<WatchlistTopic[]>(INITIAL_WATCHLISTS);
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AGENTS);
  const [briefings, setBriefings] = useState<Briefing[]>(INITIAL_BRIEFINGS);
  const [evaluations] = useState<EvaluationRecord[]>(INITIAL_EVALUATIONS);
  const [agentStream, setAgentStream] = useState<AgentStreamEvent[]>(INITIAL_AGENT_STREAM);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(INITIAL_API_KEYS);
  const [unreadApprovalCount, setUnreadApprovalCount] = useState<number>(0);
  const [pendingApproval, setPendingApproval] = useState<{
    runId: string;
    topic: string;
    briefingDraft: string;
  } | null>(null);

  // Modals state
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [isRunResearchModalOpen, setIsRunResearchModalOpen] = useState(false);

  const refreshBriefings = () => {
    radarApi
      .getBriefings(20)
      .then((data) => {
        if (data.briefings?.length) {
          setBriefings(data.briefings.map(mapApiBriefingToUi));
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
    refreshBriefings();
    refreshPendingApprovals();
    const interval = setInterval(refreshPendingApprovals, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAwaitingApproval = (runId: string, topic: string, briefingDraft: string) => {
    setPendingApproval({ runId, topic, briefingDraft });
    setUnreadApprovalCount((prev) => prev + 1);
    setCurrentTab('approval');
  };

  // Handlers
  const handleAddWatchlist = (newTopic: WatchlistTopic) => {
    setWatchlists((prev) => [newTopic, ...prev]);
  };

  const handleToggleWatchlistStatus = (id: string) => {
    setWatchlists((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const newStatus = w.status === 'Active / Pulse' ? 'Paused' : 'Active / Pulse';
          return { ...w, status: newStatus };
        }
        return w;
      })
    );
  };

  const handleDeleteWatchlist = (id: string) => {
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
  };

  const handleDeployAgent = (newAgent: AIAgent) => {
    setAgents((prev) => [newAgent, ...prev]);
  };

  const handleResearchCompleted = (newBriefing: Briefing) => {
    setBriefings((prev) => [newBriefing, ...prev]);
    // Push new event to Agent Stream
    const streamEvt: AgentStreamEvent = {
      id: `s-${Date.now()}`,
      timeAgo: 'Just now',
      agentName: 'Radar Multi-Agent Fleet',
      action: `Research Completed: ${newBriefing.title}`,
      details: `Generated briefing report with ${newBriefing.confidence}% confidence score across ${newBriefing.sourcesCount} verified sources.`,
      tag: 'NEW BRIEFING',
      tagType: 'primary',
      color: '#3B82F6'
    };
    setAgentStream((prev) => [streamEvt, ...prev]);
    // Redirect to Briefings tab to view result
    setCurrentTab('briefings');
  };

  const handleGenerateApiKey = (name: string) => {
    const newKey: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      name,
      createdOrUsed: 'Created just now',
      keyMasked: 'rad_live_a190...82f4',
      rawKey: `rad_live_a190${Math.random().toString(36).substring(2, 10)}82f4`,
      isDev: false,
      showKey: false
    };
    setApiKeys((prev) => [newKey, ...prev]);
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleApproveSuccess = () => {
    setUnreadApprovalCount(0);
    setPendingApproval(null);
    refreshBriefings();
  };

  return (
    <div className="min-h-screen bg-[#131315] text-[#FAFAFA] flex flex-row overflow-x-hidden">
      {/* Sidebar Navigation — hidden on signin/signup */}
      {currentTab !== 'signin' && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNewWorkspace={() => setIsNewWorkspaceModalOpen(true)}
          onRunResearchModal={() => setIsRunResearchModalOpen(true)}
          unreadApprovalCount={unreadApprovalCount}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {currentTab !== 'signin' && (
          <Header
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onRunResearchModal={() => setIsRunResearchModalOpen(true)}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewView
              agentStream={agentStream}
              onSelectTab={setCurrentTab}
              onRunResearchModal={() => setIsRunResearchModalOpen(true)}
            />
          )}

          {currentTab === 'watchlist' && (
            <WatchlistView
              watchlists={watchlists}
              onAddWatchlist={handleAddWatchlist}
              onToggleStatus={handleToggleWatchlistStatus}
              onDeleteWatchlist={handleDeleteWatchlist}
              onRunResearchModal={() => setIsRunResearchModalOpen(true)}
            />
          )}

          {currentTab === 'runs' && (
            <ResearchRunsView
              onRunResearchModal={() => setIsRunResearchModalOpen(true)}
            />
          )}

          {currentTab === 'agents' && (
            <AIAgentsView
              agents={agents}
              onDeployAgent={handleDeployAgent}
              onRunResearchModal={() => setIsRunResearchModalOpen(true)}
            />
          )}

          {currentTab === 'briefings' && (
            <BriefingsView
              briefings={briefings}
              onRunResearchModal={() => setIsRunResearchModalOpen(true)}
            />
          )}

          {currentTab === 'memory' && (
            <KnowledgeMemoryView />
          )}

          {currentTab === 'evaluations' && (
            <EvaluationsView
              evaluations={evaluations}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              apiKeys={apiKeys}
              onGenerateKey={handleGenerateApiKey}
              onDeleteKey={handleDeleteApiKey}
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
        onResearchCompleted={handleResearchCompleted}
        onAwaitingApproval={handleAwaitingApproval}
      />
    </div>
  );
}

export default App;