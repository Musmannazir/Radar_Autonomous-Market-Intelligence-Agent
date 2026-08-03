import React, { useState } from 'react';
import { NavTab } from '../../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewWorkspace: () => void;
  onRunResearchModal: () => void;
  unreadApprovalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewWorkspace,
  onRunResearchModal,
  unreadApprovalCount = 1
}) => {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('Enterprise Intelligence Fleet');

  const navItems: { id: NavTab; label: string; icon: string; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Command Center', icon: 'dashboard' },
    { id: 'watchlist', label: 'Watchlist Management', icon: 'visibility', badge: '5 Active' },
    { id: 'runs', label: 'Research Runs', icon: 'account_tree' },
    { id: 'agents', label: 'AI Agents Fleet', icon: 'smart_toy', badge: '5 Online' },
    { id: 'briefings', label: 'Intelligence Briefings', icon: 'article', badge: '3 New', badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    { id: 'memory', label: 'Knowledge Memory', icon: 'database' },
    { id: 'evaluations', label: 'Evaluation Dashboard', icon: 'analytics' },
    { id: 'approval', label: 'Human Approval', icon: 'verified_user', badge: unreadApprovalCount, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' },
    { id: 'settings', label: 'Settings & Secrets', icon: 'settings' }
  ];

  return (
    <aside className="w-64 bg-slate-950/70 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Top Header & Brand */}
      <div>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-xl">radar</span>
              </div>
              <div>
                <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                  RADAR AI
                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400">Autonomous Core</p>
              </div>
            </div>
          </div>

          {/* Workspace Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2.5 text-left flex items-center justify-between transition-colors text-xs text-slate-200"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-indigo-400 text-sm">hub</span>
                <span className="font-medium truncate">{currentWorkspace}</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">unfold_more</span>
            </button>

            {workspaceMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Workspaces
                </div>
                {['Enterprise Intelligence Fleet', 'Autonomous Research Lab', 'Global Security Monitoring'].map((ws) => (
                  <button
                    key={ws}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                      currentWorkspace === ws ? 'bg-white/10 text-white font-medium border border-white/10' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{ws}</span>
                    {currentWorkspace === ws && <span className="material-symbols-outlined text-indigo-400 text-xs">check</span>}
                  </button>
                ))}
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    onOpenNewWorkspace();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:bg-indigo-500/10 rounded-xl flex items-center gap-2 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Create New Workspace
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Button: Run Research */}
        <div className="p-3">
          <button
            onClick={onRunResearchModal}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-sm">rocket_launch</span>
            Run Autonomous Research
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-380px)]">
          <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
            Navigation & Controls
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'text-indigo-400' : 'text-slate-400 opacity-70'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      item.badgeColor ? item.badgeColor : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Status & User Profile */}
      <div className="p-4 border-t border-white/5 space-y-3">
        {/* Pro / Account Upgrade Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest">Enterprise Core</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              99.98%
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-tight mb-2">Scale operations across multi-node clusters.</p>
        </div>

        {/* User Card & Sign In/Out */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/50 p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300">
                AM
              </div>
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-medium text-white truncate">Alex Mercer</div>
              <div className="text-[10px] text-slate-400 truncate font-mono">Lead Architect</div>
            </div>
          </div>

          <button
            onClick={() => onSelectTab(currentTab === 'signin' ? 'overview' : 'signin')}
            title={currentTab === 'signin' ? 'Return to App' : 'Sign In / Account'}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base">
              {currentTab === 'signin' ? 'meeting_room' : 'logout'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
