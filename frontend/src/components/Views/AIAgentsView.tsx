import React from 'react';
import { AIAgent } from '../../types';
import { DashboardMetricsResponse } from '../../api/radarApi';

interface AIAgentsViewProps {
  agents: AIAgent[];
  dashboard: DashboardMetricsResponse | null;
  onRunResearchModal: () => void;
}

export const AIAgentsView: React.FC<AIAgentsViewProps> = ({
  agents,
  dashboard,
  onRunResearchModal
}) => {
  const active = dashboard?.active_agents ?? 0;
  const busy = dashboard?.busy_agents ?? 0;
  const queued = agents.filter((agent) => agent.status === 'Queued').length;
  const totalRuns = dashboard?.counts.runs ?? 0;
  const liveAverage = totalRuns > 0 ? Math.max(0, 100 - (dashboard?.counts.new_findings ?? 0) / totalRuns * 100) : 0;
  const currentRun = dashboard?.agent_statuses.find((entry) => entry.status === 'running' || entry.status === 'queued' || entry.status === 'processing_approval' || entry.status === 'awaiting_approval');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Fleet Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Fleet Operational Status</div>
          <div className="text-3xl font-bold text-white flex items-center gap-2">
            <span>{busy} running / {queued} queued</span>
          </div>
          <p className="text-xs text-emerald-400 font-mono mt-2">
            {active} active runs across {agents.length} tracked roles
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Avg Execution Success</div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{liveAverage.toFixed(1)}%</div>
          <p className="text-xs text-indigo-300 font-mono mt-2">{totalRuns} total runs</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">AI Engine Standard</div>
          <div className="text-3xl font-bold text-white">{currentRun?.current_step || 'Idle'}</div>
          <p className="text-xs text-purple-300 font-mono mt-2">{currentRun?.topic || 'No active research run'}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Parallel Scraper Threads</div>
          <div className="text-3xl font-bold text-white">{agents.length} Roles</div>
          <p className="text-xs text-emerald-400 font-mono mt-2">Live pipeline stages from backend state</p>
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
            <span>Run Selected Watchlist</span>
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
                      ag.status === 'Busy'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : ag.status === 'Queued'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : ag.status === 'Awaiting Approval'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        : ag.status === 'Offline'
                        ? 'bg-white/5 text-slate-400 border border-white/10'
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

              <div className="mb-4 rounded-2xl bg-white/5 border border-white/10 p-3 text-[11px] font-mono text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Live run</span>
                  <span className="text-white truncate max-w-[180px]">{ag.runTopic || 'No active run'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Pipeline state</span>
                  <span className={ag.status === 'Busy' ? 'text-emerald-400' : ag.status === 'Queued' ? 'text-amber-300' : ag.status === 'Awaiting Approval' ? 'text-cyan-300' : 'text-slate-400'}>
                    {ag.pipelineState || 'idle'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Queue position</span>
                  <span className="text-white">{ag.queuePosition ?? '—'}</span>
                </div>
              </div>
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
    </div>
  );
};
