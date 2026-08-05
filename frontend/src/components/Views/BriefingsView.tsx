import React, { useState } from 'react';
import { Briefing } from '../../types';
import { radarApi } from '../../api/radarApi';

interface BriefingsViewProps {
  briefings: Briefing[];
  onRunResearchModal: () => void;
}

export const BriefingsView: React.FC<BriefingsViewProps> = ({ briefings, onRunResearchModal }) => {
  const [selectedBriefingId, setSelectedBriefingId] = useState<string>(briefings[0]?.id || '');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [aiQuery, setAiQuery] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  const selectedBriefing = briefings.find((b) => b.id === selectedBriefingId) || briefings[0];

  const filteredBriefings = briefings.filter((b) => {
    if (activeFilter === 'ALL') return true;
    return b.category === activeFilter;
  });

  const handleAskRadarAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || !selectedBriefing) return;

    const question = aiQuery.trim();
    setAiQuery('');
    setConversationHistory((prev) => [...prev, { role: 'user', text: question }]);
    setIsQuerying(true);

    try {
      const result = await radarApi.queryBriefing(selectedBriefing.id, question);
      setConversationHistory((prev) => [...prev, { role: 'ai', text: result.answer }]);
    } catch {
      setConversationHistory((prev) => [
        ...prev,
        { role: 'ai', text: 'Failed to get answer from Radar AI. Please try again.' },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-hidden flex flex-col md:flex-row gap-6">
      {/* Left Column: Briefings List */}
      <div className="w-full md:w-80 shrink-0 bg-white/5 border border-white/10 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl">
        {/* Header & Filter Tags */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white">Intelligence Reports</h3>
            <span className="text-xs font-mono text-indigo-400 font-semibold">{briefings.length} Reports</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[10px] font-mono">
            {['ALL', 'AI_RESEARCH', 'OPEN_SOURCE_LLMS', 'AI_JOBS', 'AI_INNOVATION', 'OTHER'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                  activeFilter === f
                    ? f === 'OTHER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {f === 'OTHER' ? 'OUT OF DOMAIN' : f === 'ALL' ? 'ALL' : f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Briefings Scrollable List */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {filteredBriefings.map((b) => {
            const isSelected = b.id === selectedBriefing?.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBriefingId(b.id);
                  setConversationHistory([]);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white'
                    : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full border ${
                    b.category === 'OTHER'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  }`}>
                    {b.category === 'OTHER' ? 'OUT OF DOMAIN' : b.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400">{b.timeAgo}</span>
                </div>

                <div className="font-semibold text-xs text-white line-clamp-2 leading-snug">
                  {b.title}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold">{b.confidence}% Score</span>
                  <span>{b.sourcesCount} Sources</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Briefing Detail Reading Pane */}
      {selectedBriefing ? (
        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl relative">
          {/* Detail Header Bar */}
          <div className="p-6 border-b border-white/10 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                  selectedBriefing.category === 'OTHER'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {selectedBriefing.category === 'OTHER' ? 'OUT OF DOMAIN' : selectedBriefing.category.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Generated: {selectedBriefing.generatedDate}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                {selectedBriefing.title}
              </h2>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right font-mono">
                <div className="text-emerald-400 font-bold text-lg">{selectedBriefing.confidence}%</div>
                <div className="text-[10px] text-slate-400">Verification Score</div>
              </div>
              <button
                onClick={onRunResearchModal}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors flex items-center gap-1.5 font-medium"
              >
                <span className="material-symbols-outlined text-indigo-400 text-base">refresh</span>
                <span>Re-verify</span>
              </button>
            </div>
          </div>

          {/* Reading Pane Main Content Area */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 pr-4">
            {/* Executive Summary Card */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 font-mono">
                <span className="material-symbols-outlined text-base">summarize</span>
                EXECUTIVE SUMMARY
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {selectedBriefing.executiveSummary}
              </p>
            </div>

            {/* Key Findings Grid */}
            <div>
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
                Key Intelligence Findings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedBriefing.keyFindings.map((kf, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs font-bold text-white mb-1.5">{kf.title}</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{kf.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Claims Table */}
            <div>
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
                Verified Ground Truth Claims
              </h3>
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-mono text-[10px] uppercase border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3">Fact Claim</th>
                      <th className="px-5 py-3">Source Ref</th>
                      <th className="px-5 py-3">Confidence</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedBriefing.verifiedClaims.map((c) => (
                      <tr key={c.id}>
                        <td className="px-5 py-3.5 font-medium text-white">{c.claim}</td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">{c.source}</td>
                        <td className="px-5 py-3.5 font-mono text-emerald-400">{c.confidence}%</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Market Impact */}
            {selectedBriefing.marketImpact && (
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                  <span className="material-symbols-outlined text-base">trending_up</span>
                  MARKET & STRATEGIC EXPOSURE
                </div>
                <p className="text-xs text-slate-200">{selectedBriefing.marketImpact.summary}</p>
              </div>
            )}

            {/* Citations */}
            <div>
              <div className="text-xs font-bold text-slate-400 font-mono mb-2.5 uppercase">Citations & Index Mappings</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedBriefing.citations.map((cit, i) => (
                  <div key={i} className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold">{cit.ref}</span>
                    <span>{cit.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Ask Radar AI Query Drawer */}
          <div className="p-4 border-t border-white/10 bg-slate-950/80">
            {conversationHistory.length > 0 && (
              <div className="mb-3 max-h-40 overflow-y-auto space-y-2 pr-1">
                {conversationHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl text-xs ${
                      msg.role === 'user'
                        ? 'bg-white/5 border border-white/10 text-slate-200 ml-8'
                        : 'bg-indigo-500/10 border border-indigo-500/30 text-white mr-8'
                    }`}
                  >
                    <div className="font-bold font-mono mb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">
                        {msg.role === 'user' ? 'person' : 'psychology'}
                      </span>
                      {msg.role === 'user' ? 'You' : 'Radar AI'}
                    </div>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAskRadarAI} className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder={`Ask Radar AI a specific question about "${selectedBriefing.title}"...`}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isQuerying}
                className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-[0_4px_12px_rgba(99,102,241,0.4)]"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>{isQuerying ? 'Analyzing...' : 'Query Briefing'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Select a briefing report to inspect.
        </div>
      )}
    </div>
  );
};
