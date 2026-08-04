import React, { useMemo, useState } from 'react';
import { DashboardMetricsResponse } from '../../api/radarApi';

interface ResearchRunsViewProps {
  dashboard: DashboardMetricsResponse | null;
  onRunResearchModal: () => void;
}

interface NodeDetail {
  id: string;
  label: string;
  agent: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'QUEUED';
  latency: string;
  tokensUsed: string;
  model: string;
  outputSummary: string;
  logs: Array<{
    timestamp: string;
    status: string;
    message: string;
    details?: unknown;
  }>;
}

export const ResearchRunsView: React.FC<ResearchRunsViewProps> = ({ dashboard, onRunResearchModal }) => {
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);

  const latestActiveRun = useMemo(() => {
    return [...(dashboard?.agent_statuses || [])]
      .filter((entry) => ['running', 'queued', 'processing_approval', 'awaiting_approval'].includes(entry.status))
      .sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime())[0];
  }, [dashboard]);

  const pipelineStages = [
    { id: 'planner', label: 'Planner', agent: 'Planner Agent', model: 'Ollama - llama3.2:3b' },
    { id: 'researcher', label: 'Researcher', agent: 'Research Agent', model: 'Ollama - llama3.2:3b' },
    { id: 'verifier', label: 'Verifier', agent: 'Verifier Agent', model: 'Groq - llama-3.3-70b-versatile' },
    { id: 'dedup', label: 'Dedup', agent: 'Memory / Dedup', model: 'Backend dedup store' },
    { id: 'writer', label: 'Writer', agent: 'Writer Agent', model: 'Ollama - llama3.2:3b' },
    { id: 'deliverer', label: 'Deliverer', agent: 'Deliverer Agent', model: 'Rule Engine' },
  ];

  const activeStep = latestActiveRun?.current_step || null;
  const currentRunEvents = dashboard?.current_run_events || [];

  const nodes: NodeDetail[] = pipelineStages.map((stage, index) => {
    const isCurrent = activeStep === stage.id;
    const isQueued = Boolean(activeStep) && pipelineStages.findIndex((stageItem) => stageItem.id === stage.id) > pipelineStages.findIndex((stageItem) => stageItem.id === activeStep);
    const stageLogs = currentRunEvents
      .filter((event) => event.step === stage.id)
      .map((event) => ({
        timestamp: event.timestamp,
        status: event.status,
        message: event.message || `${event.step} ${event.status}`,
        details: event.details,
      }));

    return {
      id: `${latestActiveRun?.run_id || 'idle'}-${stage.id}`,
      label: stage.label,
      agent: latestActiveRun?.topic || 'No active run',
      status: isCurrent ? 'IN_PROGRESS' : isQueued ? 'QUEUED' : 'COMPLETED',
      latency: latestActiveRun?.started_at ? 'live' : 'n/a',
      tokensUsed: dashboard ? String(dashboard.counts.findings) : '0',
      model: stage.model,
      outputSummary:
        stageLogs[stageLogs.length - 1]?.message ||
        (isCurrent ? `Running ${stage.label.toLowerCase()} stage.` : `No logs yet for ${stage.label.toLowerCase()}.`),
      logs: stageLogs,
    };
  });

  const currentNode = selectedNode || nodes[0] || null;

  const renderStatusLabel = (status: NodeDetail['status']) => {
    if (status === 'IN_PROGRESS') return 'running';
    if (status === 'QUEUED') return 'queued';
    return 'done';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Session Stats Header */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-indigo-300 font-bold px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              RUN ID: RR-9421-ALPHA
            </span>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Status: {dashboard?.counts.active_runs ? `${dashboard.counts.active_runs} active` : 'idle'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Live Research Runs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Every node shown here comes from the backend run state.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => alert('Exporting full research run logs in JSON format...')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors flex items-center gap-1.5 font-medium"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export JSON</span>
          </button>
          <button
            onClick={onRunResearchModal}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Re-Run Pipeline</span>
          </button>
        </div>
      </div>

      {/* Execution Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Total Tokens Consumed</div>
            <div className="text-2xl font-bold text-white font-mono">{dashboard?.counts.runs || 0}</div>
            <div className="text-[11px] text-indigo-300 mt-1 font-mono">Total runs recorded</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Verification Confidence</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{dashboard?.counts.findings ? `${Math.max(0, dashboard.counts.findings - dashboard.counts.new_findings)} verified` : '0 verified'}</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-mono">{dashboard?.counts.new_findings || 0} new findings</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Total Pipeline Latency</div>
            <div className="text-2xl font-bold text-white font-mono">{dashboard?.busy_agents || 0}</div>
            <div className="text-[11px] text-purple-300 mt-1 font-mono">Currently busy agents</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Sources Crawled</div>
            <div className="text-2xl font-bold text-white font-mono">{dashboard?.counts.findings || 0}</div>
            <div className="text-[11px] text-indigo-300 mt-1 font-mono">Live findings</div>
        </div>
      </div>

      {/* Interactive Multi-Agent Execution Graph */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-xl">account_tree</span>
              Autonomous Multi-Agent Pipeline Graph
            </h3>
            <p className="text-xs text-slate-400">Click any node to inspect model input, output, tokens, and latency logs</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Click Node for Debug Logs</span>
        </div>

        {/* Graph Visual Pipeline Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 relative py-2">
          {nodes.length ? nodes.map((n, idx) => {
            const isSelected = selectedNode?.id === n.id;
            const isCompleted = n.status === 'COMPLETED';

            return (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105 z-10'
                    : isCompleted
                    ? 'bg-white/5 border-white/10 hover:border-white/20 text-white'
                    : 'bg-white/5 border-amber-500/30 text-amber-300'
                }`}
              >
                {/* Node Step badge */}
                <div className="flex items-center justify-between text-[9px] font-mono mb-2">
                  <span className="text-slate-400">STEP 0{idx + 1}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      n.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : n.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {renderStatusLabel(n.status)}
                  </span>
                </div>

                <div className="font-bold text-xs text-white truncate">{n.label}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{n.agent}</div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{n.latency}</span>
                  <span className="text-indigo-300">{n.tokensUsed}</span>
                </div>
              </div>
            );
          }) : <div className="col-span-full text-sm text-slate-400">No runs yet. Launch one to populate the pipeline graph.</div>}
        </div>

        {/* Selected Node Detailed Inspector Panel */}
        {currentNode && (
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <span className="material-symbols-outlined text-lg">terminal</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Node Execution Logs: {currentNode.label}
                  </h4>
                  <p className="text-xs text-slate-400">Model: {currentNode.model} • Runtime: {currentNode.latency}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">Tokens: <strong className="text-white">{currentNode.tokensUsed}</strong></span>
                <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  STATUS: {currentNode.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Agent Output Payload:</span>
                <div className="mt-1.5 p-4 rounded-xl bg-slate-900 border border-white/10 font-mono text-slate-200 text-xs leading-relaxed">
                  {currentNode.outputSummary}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Node Logs:</span>
                <div className="mt-1.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {currentNode.logs.length ? currentNode.logs.map((log, logIndex) => (
                    <div key={`${currentNode.id}-${logIndex}`} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
                        <span>{log.timestamp}</span>
                        <span className="text-indigo-300">{log.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-200">{log.message}</div>
                      {log.details !== undefined && (
                        <pre className="mt-2 text-[10px] text-slate-400 whitespace-pre-wrap break-words">{JSON.stringify(log.details, null, 2)}</pre>
                      )}
                    </div>
                  )) : (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400">
                      No logs recorded yet for this node.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
