import React, { useState } from 'react';
import { AIAgent } from '../../types';

interface AIAgentsViewProps {
  agents: AIAgent[];
  onDeployAgent: (newAgent: AIAgent) => void;
  onRunResearchModal: () => void;
}

export const AIAgentsView: React.FC<AIAgentsViewProps> = ({
  agents,
  onDeployAgent,
  onRunResearchModal
}) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('Custom Scraper & Summarizer');
  const [selectedModel, setSelectedModel] = useState('Ollama - llama3.2:3b');

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    const newAgent: AIAgent = {
      id: `agent-${Date.now()}`,
      name: agentName,
      description: agentRole,
      status: 'Online',
      model: selectedModel,
      lastExecution: 'Initialized just now',
      successRate: 100.0,
      icon: 'smart_toy',
      colorClass: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      bgLight: 'bg-indigo-500/10'
    };

    onDeployAgent(newAgent);
    setAgentName('');
    setIsDeployModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Fleet Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Fleet Operational Status</div>
          <div className="text-3xl font-bold text-white flex items-center gap-2">
            <span>{agents.filter((a) => a.status === 'Online' || a.status === 'Busy').length} / {agents.length} Online</span>
          </div>
          <p className="text-xs text-emerald-400 font-mono mt-2">100% health rating</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Avg Execution Success</div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">99.1%</div>
          <p className="text-xs text-indigo-300 font-mono mt-2">14,210 total executions</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">AI Engine Standard</div>
          <div className="text-3xl font-bold text-white">Ollama + Groq</div>
          <p className="text-xs text-purple-300 font-mono mt-2">Sub-second reasoning</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Parallel Scraper Threads</div>
          <div className="text-3xl font-bold text-white">32 Workers</div>
          <p className="text-xs text-emerald-400 font-mono mt-2">Global proxy rotation</p>
        </div>
      </div>

      {/* Agents Fleet Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Autonomous Agent Fleet</h2>
          <p className="text-xs text-slate-400 mt-0.5">Specialized Radar's multi-agent roles executing search, verification, and synthesis</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunResearchModal}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors flex items-center gap-1.5 font-medium"
          >
            <span className="material-symbols-outlined text-indigo-400 text-base">rocket_launch</span>
            <span>Test Agent Workflow</span>
          </button>
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Deploy Custom Agent</span>
          </button>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((ag) => (
          <div
            key={ag.id}
            className={`bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/50 transition-all`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
                  <span className="material-symbols-outlined text-2xl">{ag.icon}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10">
                    {ag.model}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-3 py-1 rounded-full ${
                      ag.status === 'Online'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-purple-500/10 text-purple-300 border border-purple-500/20 animate-pulse'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {ag.status}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold text-white mb-1.5">{ag.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-5">{ag.description}</p>
            </div>

            {/* Bottom Performance Metrics */}
            <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Success Metric:</span>
                <span className="text-emerald-400 font-bold">{ag.successRate}%</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${ag.successRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Last execution:</span>
                <span className="text-white">{ag.lastExecution}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deploy Custom Agent Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsDeployModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Deploy Custom AI Agent</h3>
            <p className="text-xs text-slate-400 mb-5">Extend your multi-agent fleet with specialized capabilities</p>

            <form onSubmit={handleDeploy} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Agent Name</label>
                <input
                  type="text"
                  required
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Social Sentiment & Discord Auditor"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Agent Role & Prompt Objective</label>
                <textarea
                  rows={2}
                  value={agentRole}
                  onChange={(e) => setAgentRole(e.target.value)}
                  placeholder="Describe agent behavior, data feeds to scrape, or verification criteria..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Model Engine Allocation</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Ollama llama3.2:3b">Ollama llama3.2:3b (Ultra Fast, High Throughput)</option>
                  <option value="Groq llama-3.3-70b-versatile">Groq llama-3.3-70b-versatile (Deep Verification & Reasoning)</option>
                  <option value="Rule Engine">Rule Engine (Determinism / Scrapers)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
                >
                  Deploy to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
