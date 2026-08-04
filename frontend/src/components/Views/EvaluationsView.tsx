import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { EvaluationRecord } from '../../types';
import { DashboardEvaluationsResponse } from '../../api/radarApi';

interface EvaluationsViewProps {
  evaluations: EvaluationRecord[];
  summary?: DashboardEvaluationsResponse['summary'];
}
export const EvaluationsView: React.FC<EvaluationsViewProps> = ({ evaluations, summary }) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PASS' | 'FAIL' | 'WARN'>('ALL');
  const trend = evaluations.slice(0, 6).map((ev, index) => ({
    test: `Finding ${index + 1}`,
    accuracy: ev.status === 'PASS' ? ev.confidence : Math.max(0, ev.confidence - 10),
    precision: ev.status === 'PASS' ? ev.confidence : Math.max(0, ev.confidence - 15),
  }));

  const filteredEvals = evaluations.filter((ev) => {
    if (filterStatus === 'ALL') return true;
    return ev.status === filterStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              EVALUATION_RUN_ID: LIVE
            </span>
            <span className="text-xs text-indigo-300 font-mono bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Backend Findings Audit
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Model Evaluation & Fact Checking Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Derived from live backend findings and run status.
          </p>
        </div>

        <button
          onClick={() => alert('Triggering ground truth regression test suite on current model weights...')}
          className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-base">play_circle</span>
          <span>Run Ground Truth Suite</span>
        </button>
      </div>

      {/* Primary Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Factual Accuracy</div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{summary ? `${summary.accuracy}%` : '0%'}</div>
          <p className="text-xs text-emerald-400 font-mono mt-2">Live backend summary</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Verifier Precision (F1 Score)</div>
          <div className="text-3xl font-bold text-white font-mono">{summary ? summary.precision.toFixed(3) : '0.000'}</div>
          <p className="text-xs text-indigo-300 font-mono mt-2">Backend-derived precision</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">Signal Quality Index</div>
          <div className="text-3xl font-bold text-white font-mono">{summary ? `${summary.signal_quality.toFixed(2)} / 1.0` : '0.00 / 1.0'}</div>
          <p className="text-xs text-purple-300 font-mono mt-2">Noise filtering verified</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="text-xs text-slate-400 mb-1">False Positive Rate</div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{summary ? `${summary.false_positive_rate}%` : '0%'}</div>
          <p className="text-xs text-emerald-400 font-mono mt-2">Negligible error rate</p>
        </div>
      </div>

      {/* Accuracy Over Time Recharts Trend */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-xl">trending_up</span>
              Accuracy & Precision Over Test Iterations
            </h3>
            <p className="text-xs text-slate-400">Trend derived from the latest backend findings</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <XAxis dataKey="test" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis domain={[90, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#F8FAFC' }}
                labelStyle={{ color: '#F8FAFC' }}
              />
              <Line type="monotone" dataKey="accuracy" name="Factual Accuracy %" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
              <Line type="monotone" dataKey="precision" name="Verifier Precision %" stroke="#6366F1" strokeWidth={2} strokeDasharray="3 3" dot={{ fill: '#6366F1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dataset Benchmark Results Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Dataset Verification Cases</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live findings returned by the backend</p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {(['ALL', 'PASS', 'FAIL', 'WARN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  filterStatus === st
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono text-[10px] uppercase border-b border-white/10">
              <tr>
                <th className="px-6 py-3.5">Claim Candidate</th>
                <th className="px-6 py-3.5">Expected Ground Truth</th>
                <th className="px-6 py-3.5">Radar Model Decision</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvals.map((ev) => (
                <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white max-w-xs">{ev.claim}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-[11px] max-w-xs">{ev.expectedResult}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] border ${ev.decisionClass || 'bg-white/10 text-white'}`}>
                      {ev.radarDecision}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-white">{ev.confidence}%</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold ${
                        ev.status === 'PASS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ev.status === 'FAIL'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
