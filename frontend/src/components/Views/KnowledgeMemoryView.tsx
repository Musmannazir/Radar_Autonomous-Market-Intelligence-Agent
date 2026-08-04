import React from 'react';
import { DashboardMetricsResponse } from '../../api/radarApi';

interface KnowledgeMemoryViewProps {
  dashboard: DashboardMetricsResponse | null;
}

export const KnowledgeMemoryView: React.FC<KnowledgeMemoryViewProps> = ({ dashboard }) => {
  const findings = dashboard?.findings || [];
  const summary = dashboard?.memory || { vector_nodes: 0, new_nodes: 0 };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
              VECTOR MEMORY ENGINE
            </span>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
              {summary.vector_nodes} Embedded Findings
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Live Knowledge Memory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Built from findings persisted by the backend.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h3 className="font-bold text-white text-sm">Recent Findings</h3>
            <span className="text-xs text-slate-400 font-mono">{findings.length} items</span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {findings.length ? findings.map((finding) => (
              <div key={finding.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-semibold text-white">{finding.claim}</span>
                  <span className="text-[10px] font-mono text-slate-400">{finding.is_new ? 'NEW' : 'SEEN'}</span>
                </div>
                <div className="text-[11px] text-slate-400 break-all">{finding.source_url}</div>
              </div>
            )) : (
              <div className="text-sm text-slate-400">No findings are stored yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Vector Nodes</div>
            <div className="text-3xl font-bold text-white">{summary.vector_nodes}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">New Nodes</div>
            <div className="text-3xl font-bold text-emerald-400">{summary.new_nodes}</div>
          </div>
          <div className="text-xs text-slate-400">This tab is now driven entirely by backend memory and findings data.</div>
        </div>
      </div>
    </div>
  );
};
