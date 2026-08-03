import React, { useState } from 'react';
import { ApiKeyRecord } from '../../types';

interface SettingsViewProps {
  apiKeys: ApiKeyRecord[];
  onGenerateKey: (name: string) => void;
  onDeleteKey: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  apiKeys,
  onGenerateKey,
  onDeleteKey
}) => {
  const [subTab, setSubTab] = useState<'API' | 'MODELS' | 'POLICIES'>('API');
  const [dedupToggle, setDedupToggle] = useState(true);
  const [citationToggle, setCitationToggle] = useState(true);
  const [selectedModel, setSelectedModel] = useState('Ollama - llama3.2:3b');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    onGenerateKey(newKeyName);
    setNewKeyName('');
    setIsGenerateModalOpen(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowKey = (id: string) => {
    setShowKeyMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-mono">
        <button
          onClick={() => setSubTab('API')}
          className={`px-4 py-2.5 rounded-xl transition-colors font-medium ${
            subTab === 'API'
              ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
              : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
          }`}
        >
          API Keys & Secrets
        </button>
        <button
          onClick={() => setSubTab('MODELS')}
          className={`px-4 py-2.5 rounded-xl transition-colors font-medium ${
            subTab === 'MODELS'
              ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
              : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
          }`}
        >
          AI Model Routing
        </button>
        <button
          onClick={() => setSubTab('POLICIES')}
          className={`px-4 py-2.5 rounded-xl transition-colors font-medium ${
            subTab === 'POLICIES'
              ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
              : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
          }`}
        >
          Workspace Policies
        </button>
      </div>

      {/* SubTab 1: API Keys & Secrets */}
      {subTab === 'API' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Developer API Keys</h3>
                <p className="text-xs text-slate-400">Manage authentication tokens for the Radar REST API and SDK</p>
              </div>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">key</span>
                <span>Generate New API Key</span>
              </button>
            </div>

            {/* Keys Table */}
            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{k.name}</span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {k.isDev ? 'STAGING' : 'PRODUCTION'}
                      </span>
                    </div>
                    <div className="font-mono text-slate-400 text-xs flex items-center gap-2">
                      <span>{showKeyMap[k.id] ? k.rawKey : k.keyMasked}</span>
                      <button
                        onClick={() => toggleShowKey(k.id)}
                        className="text-slate-400 hover:text-white p-0.5 rounded"
                        title={showKeyMap[k.id] ? 'Hide Key' : 'Show Key'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showKeyMap[k.id] ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => handleCopy(k.id, k.rawKey)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-[11px] border border-white/10 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span>{copiedId === k.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => onDeleteKey(k.id)}
                      className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                      title="Revoke Key"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: AI Model Routing */}
      {subTab === 'MODELS' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white">Default Model Routing Engine</h3>
              <p className="text-xs text-slate-400">Select the primary foundation model for reasoning and claim verifications</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Ollama - llama3.2:3b', provider: 'Ollama (local)', tag: 'RECOMMENDED', desc: 'Free, unlimited, runs locally — used for planning, research, and writing.' },
                { name: 'Groq - llama-3.3-70b-versatile', provider: 'Groq', tag: 'DEEP REASONING', desc: 'Reserved for the Verifier agent — higher-accuracy independent fact-checking.' },
                { name: 'Claude 3.5 Sonnet', provider: 'Anthropic Proxy', tag: 'EXTERNAL', desc: 'Alternative reasoning model via proxy gateway.' },
                { name: 'Llama 3 70B', provider: 'Groq / Local', tag: 'OPEN WEIGHTS', desc: 'Self-hosted inference pipeline for high privacy isolation.' }
              ].map((m) => (
                <div
                  key={m.name}
                  onClick={() => setSelectedModel(m.name)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedModel === m.name
                      ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white">{m.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {m.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mb-2">{m.provider}</div>
                  <p className="text-xs text-slate-300">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Workspace Policies */}
      {subTab === 'POLICIES' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white">Autonomous Agent Governance Policies</h3>
            <p className="text-xs text-slate-400">Configure safety, citation mandates, and deduplication thresholds</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-white">Real-Time Vector Deduplication</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Automatically merge redundant findings into single knowledge clusters.</div>
              </div>
              <button
                onClick={() => setDedupToggle(!dedupToggle)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${dedupToggle ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${dedupToggle ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-white">Strict Citation Mandate</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Reject any claim that lacks at least 1 verified primary source URL.</div>
              </div>
              <button
                onClick={() => setCitationToggle(!citationToggle)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${citationToggle ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${citationToggle ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 space-y-3">
        <h4 className="font-bold text-sm text-red-400">Danger Zone</h4>
        <p className="text-xs text-slate-400">Irreversible actions on current intelligence workspace</p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => confirm('Clear local vector cache and reset session state?') && alert('Local cache cleared.')}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors"
          >
            Clear Vector Cache
          </button>
        </div>
      </div>

      {/* Generate API Key Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsGenerateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Generate API Secret Key</h3>
            <p className="text-xs text-slate-400 mb-5">Create a new key to authenticate external services with Radar AI</p>

            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Key Label Name</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Analytics Pipeline Ingestion Secret"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
