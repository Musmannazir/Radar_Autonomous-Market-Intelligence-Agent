import React from 'react';

interface SettingsViewProps {
  apiKeys: Array<{ id: string; name: string }>;
  onGenerateKey: (name: string) => void;
  onDeleteKey: (id: string) => void;
  systemSummary?: { database: string; watchlists: number; runs: number; briefings: number };
}

export const SettingsView: React.FC<SettingsViewProps> = ({ apiKeys, onDeleteKey, systemSummary }) => {
  const summary = systemSummary || { database: 'sqlite', watchlists: 0, runs: 0, briefings: 0 };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
        <div>
          <h3 className="text-lg font-bold text-white">Live Backend Snapshot</h3>
          <p className="text-xs text-slate-400">Only backend-backed values are shown here.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Database</div>
            <div className="text-lg font-bold text-white mt-1">{summary.database}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Watchlists</div>
            <div className="text-lg font-bold text-white mt-1">{summary.watchlists}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Runs / Briefings</div>
            <div className="text-lg font-bold text-white mt-1">{summary.runs} / {summary.briefings}</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-2">API Keys</h4>
          {apiKeys.length ? (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white">{key.name}</span>
                  <button onClick={() => onDeleteKey(key.id)} className="text-xs text-rose-400 hover:text-rose-300">Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">No API keys are persisted in the backend yet.</div>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3">
        <h4 className="font-bold text-sm text-white">Backend Limitations</h4>
        <p className="text-xs text-slate-400">Model routing, policy toggles, and key creation are not backed by an API yet, so they are intentionally not shown as editable controls.</p>
      </div>
    </div>
  );
};
