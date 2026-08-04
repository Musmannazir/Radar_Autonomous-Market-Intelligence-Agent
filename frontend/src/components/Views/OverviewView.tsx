import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AgentStreamEvent, NavTab } from '../../types';
import { DashboardMetricsResponse } from '../../api/radarApi';

interface OverviewViewProps {
  agentStream: AgentStreamEvent[];
  dashboard: DashboardMetricsResponse | null;
  onSelectTab: (tab: NavTab) => void;
  onRunResearchModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  agentStream,
  dashboard,
  onSelectTab,
  onRunResearchModal
}) => {
  const watchlists = dashboard?.watchlists?.length || 0;
  const activeWatchlists = dashboard?.watchlists?.filter((item) => item.active).length || 0;
  const activeRuns = dashboard?.counts.active_runs || 0;
  const briefings = dashboard?.counts.briefings || 0;
  const findings = dashboard?.counts.findings || 0;
  const throughputData = (dashboard?.runs || []).slice(0, 7).map((run, index) => ({
    time: run.started_at ? new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Run ${index + 1}`,
    throughput: index + 1,
    claims: dashboard?.findings.filter((finding) => finding.run_id === run.id).length || 0,
  })).reverse();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              <span className="material-symbols-outlined text-sm text-indigo-400">auto_awesome</span>
              AUTONOMOUS INTELLIGENCE AGENTS ACTIVE
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Real-Time Market Intelligence Fleet
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real backend runs, watchlists, briefings, and findings flowing through the live Radar pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('runs')}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">account_tree</span>
              Inspect Execution Graph
            </button>
            <button
              onClick={onRunResearchModal}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Run Research
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div
          onClick={() => onSelectTab('watchlist')}
          className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 transition-all cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Active Watchlists</span>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">LIVE</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-3">{activeWatchlists} / {watchlists || 0}</div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${watchlists ? (activeWatchlists / watchlists) * 100 : 0}%` }} />
          </div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => onSelectTab('agents')}
          className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Multi-Agent Fleet</span>
            <span className="text-indigo-300 text-xs font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono">{activeRuns > 0 ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-3">{activeRuns} active runs</div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${Math.min(100, activeRuns * 20)}%` }} />
          </div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => onSelectTab('briefings')}
          className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Sources Ingested</span>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">REAL</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-3">{findings.toLocaleString()}</div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min(100, findings)}%` }} />
          </div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => onSelectTab('evaluations')}
          className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Fact Precision</span>
            <span className="text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full font-mono">{dashboard?.counts.new_findings ? 'WATCH' : 'STABLE'}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-3">{dashboard?.counts.new_findings ?? 0}<span className="text-lg font-normal text-slate-400 ml-1">new</span></div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" style={{ width: `${dashboard?.counts.findings ? ((dashboard.counts.findings - dashboard.counts.new_findings) / dashboard.counts.findings) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Analytics & Throughput Chart + Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Throughput Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-xl">monitoring</span>
                Network & Claim Throughput
              </h3>
              <p className="text-sm text-slate-400">Hourly ingestion and verifications across search clusters</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              LIVE STREAM
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="throughput" name="Ingested Sources" stroke="#6366f1" fillOpacity={1} fill="url(#colorThroughput)" strokeWidth={3} />
                <Area type="monotone" dataKey="claims" name="Verified Claims" stroke="#10b981" fillOpacity={1} fill="url(#colorClaims)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Quick Actions Panel */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-xl">bolt</span>
              Command Shortcuts
            </h3>
            <p className="text-xs text-slate-400 mb-5">Direct access to operational workflows</p>

            <div className="space-y-3">
              <button
                onClick={() => onSelectTab('approval')}
                className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Pending Human Sign-off</div>
                    <div className="text-[10px] text-slate-400">Quarterly Volatility Analysis</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  REVIEW
                </span>
              </button>

              <button
                onClick={() => onSelectTab('memory')}
                className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <span className="material-symbols-outlined text-lg">database</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Vector Space Explorer</div>
                    <div className="text-[10px] text-slate-400">Explore 2,400+ connected nodes</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-white">chevron_right</span>
              </button>

              <button
                onClick={() => onSelectTab('evaluations')}
                className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <span className="material-symbols-outlined text-lg">analytics</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Evaluation Matrix</div>
                    <div className="text-[10px] text-slate-400">Ground truth regression suite</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-white">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Model Engine:</span>
            <span className="font-mono text-indigo-300">Ollama llama3.2:3b / Pro</span>
          </div>
        </div>
      </div>

      {/* Agent Activity Stream Feed */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-xl">stream</span>
              Live Agent Execution Stream
            </h3>
            <p className="text-xs text-slate-400">Real-time audit log of agent operations & verification events</p>
          </div>
          <button
            onClick={() => onSelectTab('runs')}
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
          >
            Inspect Pipeline Details →
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {agentStream.length ? agentStream.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:border-white/10 transition-colors"
            >
              <div className="flex items-start md:items-center gap-3">
                <span className="font-mono text-[11px] text-slate-400 shrink-0 pt-0.5 md:pt-0">
                  {evt.timeAgo}
                </span>
                <div className="w-2 h-2 rounded-full shrink-0 my-auto shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ backgroundColor: evt.color }} />
                <div>
                  <div className="font-medium text-white flex items-center gap-2">
                    <span>{evt.agentName}:</span>
                    <span className="text-indigo-300">{evt.action}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{evt.details}</p>
                </div>
              </div>

              {evt.tag && (
                <span className="shrink-0 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10 self-start md:self-center">
                  {evt.tag}
                </span>
              )}
            </div>
              )) : (
                <div className="text-xs text-slate-400 p-4">No live agent activity yet.</div>
              )}
        </div>
      </div>
    </div>
  );
};
