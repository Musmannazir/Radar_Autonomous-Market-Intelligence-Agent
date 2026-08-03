import React, { useState } from 'react';

interface ResearchRunsViewProps {
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
}

export const ResearchRunsView: React.FC<ResearchRunsViewProps> = ({ onRunResearchModal }) => {
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>({
    id: 'planner-1',
    label: 'Planner Agent',
    agent: 'Planner Model',
    status: 'COMPLETED',
    latency: '1.2s',
    tokensUsed: '12.4k',
    model: 'Ollama - llama3.2:3b',
    outputSummary: 'Decomposed request into 3 parallel search streams: SEC Filings, Patent Claims, and Academic Preprints.'
  });

  const nodes: NodeDetail[] = [
    {
      id: 'scheduler-0',
      label: 'Scheduler Trigger',
      agent: 'System Event Loop',
      status: 'COMPLETED',
      latency: '0.1s',
      tokensUsed: '0',
      model: 'Rule Engine',
      outputSummary: 'Cron trigger fired for Watchlist "AI Agent Frameworks". Initiated session RR-9421-ALPHA.'
    },
    {
      id: 'planner-1',
      label: 'Planner Agent',
      agent: 'Planner Model',
      status: 'COMPLETED',
      latency: '1.2s',
      tokensUsed: '12.4k',
      model: 'Ollama - llama3.2:3b',
      outputSummary: 'Generated execution graph with 18 target domain queries and structured claims verification matrix.'
    },
    {
      id: 'market-2a',
      label: 'Market Analyst',
      agent: 'Web Scraper Fleet',
      status: 'COMPLETED',
      latency: '8.4s',
      tokensUsed: '34.1k',
      model: 'Ollama - llama3.2:3b',
      outputSummary: 'Scraped 14 tech blogs and market portal feeds. Extracted 82 preliminary claim candidates.'
    },
    {
      id: 'tech-2b',
      label: 'Tech Researcher',
      agent: 'Patent Ingestion Node',
      status: 'COMPLETED',
      latency: '12.1s',
      tokensUsed: '45.8k',
      model: 'Groq - llama-3.3-70b-versatile',
      outputSummary: 'Parsed 3 USPTO patent preprints for browser sandbox visual grounding algorithms.'
    },
    {
      id: 'verifier-3',
      label: 'Verifier Agent',
      agent: 'Fact Checker Model',
      status: 'COMPLETED',
      latency: '9.3s',
      tokensUsed: '28.2k',
      model: 'Groq - llama-3.3-70b-versatile',
      outputSummary: 'Cross-checked 82 claims against ground truth vector embeddings. Score 98.4% precision.'
    },
    {
      id: 'writer-4',
      label: 'Writer Agent',
      agent: 'Briefing Synthesizer',
      status: 'COMPLETED',
      latency: '6.2s',
      tokensUsed: '22.3k',
      model: 'Ollama - llama3.2:3b',
      outputSummary: 'Synthesized executive markdown report with citation mappings and market impact score.'
    },
    {
      id: 'approval-5',
      label: 'Human Approval',
      agent: 'Governance Panel',
      status: 'IN_PROGRESS',
      latency: 'Waiting...',
      tokensUsed: '0',
      model: 'Policy Ruleset',
      outputSummary: 'Awaiting human sign-off on Quarterly Market Volatility Report.'
    }
  ];

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
              Status: 6/7 Nodes Completed
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            OpenAI Operator & GUI Automation Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Target Watchlist: AI Agent Frameworks • Initiated by Cron Scheduler (08:45 UTC)
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
          <div className="text-2xl font-bold text-white font-mono">142,800</div>
          <div className="text-[11px] text-indigo-300 mt-1 font-mono">Cost: ~$0.042 (Ollama + Groq)</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Verification Confidence</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">98.4%</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">14/14 claims verified</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Total Pipeline Latency</div>
          <div className="text-2xl font-bold text-white font-mono">37.3s</div>
          <div className="text-[11px] text-purple-300 mt-1 font-mono">3 parallel streams</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Sources Crawled</div>
          <div className="text-2xl font-bold text-white font-mono">18 Sources</div>
          <div className="text-[11px] text-indigo-300 mt-1 font-mono">0 broken proxies</div>
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
          {nodes.map((n, idx) => {
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
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300 animate-pulse'
                    }`}
                  >
                    {isCompleted ? 'DONE' : 'WAIT'}
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
          })}
        </div>

        {/* Selected Node Detailed Inspector Panel */}
        {selectedNode && (
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <span className="material-symbols-outlined text-lg">terminal</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Node Execution Logs: {selectedNode.label}
                  </h4>
                  <p className="text-xs text-slate-400">Model: {selectedNode.model} • Runtime: {selectedNode.latency}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">Tokens: <strong className="text-white">{selectedNode.tokensUsed}</strong></span>
                <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  STATUS: {selectedNode.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Agent Output Payload:</span>
                <div className="mt-1.5 p-4 rounded-xl bg-slate-900 border border-white/10 font-mono text-slate-200 text-xs leading-relaxed">
                  {selectedNode.outputSummary}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
