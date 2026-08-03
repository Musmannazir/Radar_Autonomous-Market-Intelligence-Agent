import React, { useState } from 'react';

interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, region: string) => void;
}

export const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Global (US-East / EU-Central)');
  const [agentAllocation, setAgentAllocation] = useState('Standard (5 Autonomous Agents)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name, region);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">hub</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create Intelligence Workspace</h3>
            <p className="text-xs text-slate-400">Set up an isolated multi-agent environment</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Workspace Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Defense Technology Monitoring Fleet"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Intelligence Region & Egress</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Global (US-East / EU-Central)">Global (US-East / EU-Central)</option>
              <option value="North America (US-West)">North America (US-West)</option>
              <option value="Europe (Frankfurt)">Europe (Frankfurt)</option>
              <option value="Asia Pacific (Tokyo)">Asia Pacific (Tokyo)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">AI Agent Fleet Capacity</label>
            <select
              value={agentAllocation}
              onChange={(e) => setAgentAllocation(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Standard (5 Autonomous Agents)">Standard (5 Autonomous Agents)</option>
              <option value="High Throughput (12 Agents + Parallel Scrapers)">High Throughput (12 Agents + Parallel Scrapers)</option>
              <option value="Dedicated Enterprise Cluster (25 Agents)">Dedicated Enterprise Cluster (25 Agents)</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all"
            >
              Provision Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
