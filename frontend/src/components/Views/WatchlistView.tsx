import { useState } from 'react';
import { WatchlistTopic } from '../../types';

interface WatchlistViewProps {
  watchlists: WatchlistTopic[];
  onAddWatchlist: (payload: {
    name: string;
    category: WatchlistTopic['category'];
    frequency: WatchlistTopic['frequency'];
    priority: WatchlistTopic['priority'];
    description: string;
    icon: string;
  }) => void;
  onToggleStatus: (id: string) => void;
  onDeleteWatchlist: (id: string) => void;
  onRunResearchModal: (watchlist?: { watchlistItemId: number; topic: string }) => void;
}

// AI-related keywords for topic validation
const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
  'llm', 'large language model', 'neural', 'gpt', 'claude', 'gemini', 'llama',
  'transformer', 'generative', 'neural network', 'nlp', 'natural language',
  'computer vision', 'cv', 'robotics', 'autonomous agent', 'ai agent',
  'open source llm', 'ai jobs', 'ai research', 'ai innovation',
  'mlops', 'mle', 'ml engineer', 'data science'
];

const isAIRelated = (topic: string): boolean => {
  const lowerTopic = topic.toLowerCase();
  return AI_KEYWORDS.some(keyword => lowerTopic.includes(keyword));
};

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlists,
  onAddWatchlist,
  onToggleStatus,
  onDeleteWatchlist,
  onRunResearchModal
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newCategory, setNewCategory] = useState<WatchlistTopic['category']>('AI_RESEARCH');
  const [newFrequency, setNewFrequency] = useState<WatchlistTopic['frequency']>('Real-time (High Load)');
  const [newPriority, setNewPriority] = useState<WatchlistTopic['priority']>('HIGH');
  const [newDescription, setNewDescription] = useState('');
  const [topicError, setTopicError] = useState<string | null>(null);

  const categoryIcon = (cat: WatchlistTopic['category']) =>
    cat === 'OPEN_SOURCE_LLMS' ? 'memory' : cat === 'AI_JOBS' ? 'work' : cat === 'AI_INNOVATION' ? 'lightbulb' : cat === 'OTHER' ? 'category' : 'psychology';

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    // Validate that topic is AI-related
    if (!isAIRelated(newTopicName)) {
      setTopicError("Can't search - Out of Domain");
      return;
    }
    setTopicError(null);

    // Call the API to create the watchlist and let refreshDashboard handle the UI update
    onAddWatchlist({
      name: newTopicName,
      category: newCategory,
      frequency: newFrequency,
      priority: newPriority,
      description: newDescription || 'Continuous autonomous agent monitoring enabled.',
      icon: categoryIcon(newCategory),
    });

    setNewTopicName('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-3xl pointer-events-none"></div>
          <div className="text-xs text-slate-400 font-medium mb-1">Active Watchlists</div>
          <div className="text-3xl font-bold text-white">
            {watchlists.filter((w) => w.status === 'Active / Pulse').length} / {watchlists.length}
          </div>
          <p className="text-xs text-emerald-400 font-mono mt-2">Autonomous pulse online</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div className="text-xs text-slate-400 font-medium mb-1">Total Ingested Findings</div>
          <div className="text-3xl font-bold text-white">
            {watchlists.reduce((acc, curr) => acc + curr.findingsCount, 0).toLocaleString()}
          </div>
          <p className="text-xs text-indigo-300 font-mono mt-2">+58 new in last hour</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-3xl pointer-events-none"></div>
          <div className="text-xs text-slate-400 font-medium mb-1">Scraper Egress Rate</div>
          <div className="text-3xl font-bold text-white">42.8 KB/s</div>
          <p className="text-xs text-purple-300 font-mono mt-2">Low latency proxy pool</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          <div className="text-xs text-slate-400 font-medium mb-1">System Processing Load</div>
          <div className="text-3xl font-bold text-white">18.2% CPU</div>
          <p className="text-xs text-emerald-400 font-mono mt-2">Optimal queue capacity</p>
        </div>
      </div>

      {/* Main Watchlist Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-white">Active Intelligence Watchlists</h3>
            <p className="text-xs text-slate-400 mt-0.5">Continuous web crawling, filing ingestion, and patent tracking feeds</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onRunResearchModal()}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-colors flex items-center gap-1.5 font-medium"
            >
              <span className="material-symbols-outlined text-indigo-400 text-base">rocket_launch</span>
              <span>Ad-hoc Run</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add New Watchlist</span>
            </button>
          </div>
        </div>

        {/* Watchlists Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono text-[10px] uppercase border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Topic & Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Frequency</th>
                <th className="px-6 py-4">Findings</th>
                <th className="px-6 py-4">Last Execution</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {watchlists.map((wl) => (
                <tr key={wl.id} className="hover:bg-white/5 transition-colors">
                  {/* Topic */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5 border border-indigo-500/20">
                        <span className="material-symbols-outlined text-base">{wl.icon}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">{wl.name}</div>
                        <div className="text-[11px] text-slate-400 max-w-sm mt-0.5 line-clamp-1">
                          {wl.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    {wl.category === 'OTHER' ? (
                      <span className="px-2.5 py-1 rounded-full font-mono text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        OUT OF DOMAIN
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full font-mono text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {wl.category}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onToggleStatus(wl.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono transition-colors ${
                        wl.status === 'Active / Pulse'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${wl.status === 'Active / Pulse' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                      <span>{wl.status}</span>
                    </button>
                  </td>

                  {/* Frequency */}
                  <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                    {wl.frequency || 'Daily'}
                  </td>

                  {/* Findings */}
                  <td className="px-6 py-4 font-mono">
                    <span className="text-white font-semibold">{wl.findingsCount.toLocaleString()}</span>
                    {wl.findingsNew > 0 && (
                      <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                        +{wl.findingsNew}
                      </span>
                    )}
                  </td>

                  {/* Last Run */}
                  <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                    {wl.lastRun}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onRunResearchModal({ watchlistItemId: Number(wl.id), topic: wl.name })}
                        title="Run Autonomous Research Now"
                        className="p-1.5 hover:bg-white/10 text-indigo-400 hover:text-white rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">play_arrow</span>
                      </button>
                      <button
                        onClick={() => onToggleStatus(wl.id)}
                        title={wl.status === 'Active / Pulse' ? 'Pause Watchlist' : 'Resume Watchlist'}
                        className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">
                          {wl.status === 'Active / Pulse' ? 'pause' : 'resume'}
                        </span>
                      </button>
                      <button
                        onClick={() => onDeleteWatchlist(wl.id)}
                        title="Delete Watchlist"
                        className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Watchlist Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Add Intelligence Watchlist</h3>
            <p className="text-xs text-slate-400 mb-5">Configure autonomous agent monitoring parameters</p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {topicError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] px-3 py-2 rounded-xl">
                  {topicError}
                </div>
              )}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Watchlist Topic Name</label>
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={(e) => {
                    setNewTopicName(e.target.value);
                    if (topicError) setTopicError(null);
                  }}
                  placeholder="e.g. Next-Gen Nuclear Small Modular Reactors"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="AI_RESEARCH">AI RESEARCH</option>
                    <option value="OPEN_SOURCE_LLMS">OPEN SOURCE LLMS</option>
                    <option value="AI_JOBS">AI JOBS</option>
                    <option value="AI_INNOVATION">AI INNOVATION</option>
                    <option value="OTHER">OTHER (Out of Domain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Real-time (High Load)">Real-time (High Load)</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MED">MED</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Description / Keywords</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Specific patents, filings, key executives or technical terms to monitor..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
                >
                  Save Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
