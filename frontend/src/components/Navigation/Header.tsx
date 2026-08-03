import React, { useState } from 'react';
import { NavTab } from '../../types';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onRunResearchModal: () => void;
  onSearchQuery?: (q: string) => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  overview: { title: 'Command Center', subtitle: 'Real-time multi-agent intelligence throughput and agent activity stream' },
  watchlist: { title: 'Watchlist Management', subtitle: 'Active research watchlists and continuous market signal monitoring' },
  runs: { title: 'Research Run Details (RR-9421-ALPHA)', subtitle: 'Autonomous execution graph, claims verifications, and agent pipeline logs' },
  agents: { title: 'AI Agents Fleet', subtitle: 'Agent fleet operational status, model configurations, and execution success metrics' },
  briefings: { title: 'Intelligence Briefings', subtitle: 'Synthesized, multi-source claim-verified market intelligence reports' },
  memory: { title: 'Knowledge Memory', subtitle: 'High-dimensional vector embedding space and deduplication graph visualization' },
  evaluations: { title: 'Evaluation Dashboard', subtitle: 'Ground truth verifications, factual accuracy, and signal quality metrics' },
  settings: { title: 'Settings & Workspace Configuration', subtitle: 'API keys, AI model routing, webhooks, and team access permissions' },
  approval: { title: 'Human Approval Interface', subtitle: 'Human-in-the-loop review panel for high-stakes intelligence briefings' },
  signin: { title: 'Account Authentication', subtitle: 'Enterprise single sign-on and credential management' }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onRunResearchModal,
  onSearchQuery
}) => {
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const info = TAB_TITLES[currentTab] || { title: 'Radar AI', subtitle: 'Autonomous Market Intelligence' };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (onSearchQuery) {
      onSearchQuery(e.target.value);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
      {/* Title & Status */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5 font-mono">
          <span className="hover:text-white cursor-pointer" onClick={() => onSelectTab('overview')}>RADAR CORE</span>
          <span>/</span>
          <span className="text-indigo-400 font-medium capitalize">{currentTab}</span>
        </div>
        <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-3">
          <span>{info.title}</span>
          <span className="text-xs font-normal text-slate-400 hidden sm:inline">
            Status: <span className="text-emerald-400 font-medium">Nominal</span>
          </span>
        </h1>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search watchlists, briefings, agents, or vector nodes... (⌘K)"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
          />
          <kbd className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Launch Modal */}
        <button
          onClick={onRunResearchModal}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-colors"
        >
          <span className="material-symbols-outlined text-indigo-400 text-base">bolt</span>
          <span>New Run</span>
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors relative"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="font-semibold text-xs text-white">System Alerts</span>
                <span className="text-[10px] font-mono text-indigo-400 cursor-pointer hover:underline" onClick={() => setNotificationsOpen(false)}>
                  Mark all read
                </span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-semibold text-amber-400 font-mono">APPROVAL REQUIRED</span>
                    <span>5m ago</span>
                  </div>
                  <p className="text-slate-100 font-medium text-xs">Quarterly Market Volatility Analysis</p>
                  <p className="text-slate-400 text-[11px]">82 claim verifications passed. Pending human sign-off.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-semibold text-emerald-400 font-mono">RUN COMPLETED</span>
                    <span>12m ago</span>
                  </div>
                  <p className="text-slate-100 font-medium text-xs">OpenAI Operator Briefing Generated</p>
                  <p className="text-slate-400 text-[11px]">Confidence 96% across 14 sources.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <button
          onClick={() => onSelectTab('settings')}
          className="flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-colors"
        >
          <div className="w-7 h-7 rounded-full border-2 border-indigo-500/50 p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-300">
              AM
            </div>
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-white leading-none">Erik Sorenson</p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">Lead Architect</p>
          </div>
        </button>
      </div>
    </header>
  );
};
