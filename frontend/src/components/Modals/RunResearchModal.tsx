import React, { useEffect, useRef, useState } from 'react';
import { Briefing } from '../../types';
import { radarApi, pollRunUntilSettled, RunStatus } from '../../api/radarApi';

interface RunResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResearchCompleted: (newBriefing: Briefing) => void;
  onAwaitingApproval: (runId: string, topic: string, briefingDraft: string) => void;
}

const PIPELINE_STAGES = [
  { key: 'planner', label: 'Planner', desc: 'Writing research sub-questions' },
  { key: 'researcher', label: 'Researchers', desc: 'Parallel web search + extraction' },
  { key: 'verifier', label: 'Verifier', desc: 'Independently fact-checking every claim' },
  { key: 'dedup', label: 'Memory / Dedup', desc: 'Filtering out already-seen findings' },
  { key: 'writer', label: 'Writer', desc: 'Drafting the cited briefing' },
  { key: 'deliverer', label: 'Your Approval', desc: 'Waiting for you to review it' },
] as const;

const TERMINAL_STATUSES = new Set([
  'awaiting_approval',
  'approved',
  'rejected',
  'skipped_no_news',
  'send_failed',
  'failed',
]);

type StageState = 'done' | 'active' | 'pending' | 'failed';

function getStageStates(currentStep: string | null | undefined, status: string): StageState[] {
  const isTerminal = TERMINAL_STATUSES.has(status);
  const isFailed = status === 'failed';
  const currentIndex = currentStep ? PIPELINE_STAGES.findIndex((s) => s.key === currentStep) : -1;

  return PIPELINE_STAGES.map((_, i) => {
    if (isFailed && i === Math.max(currentIndex, 0)) return 'failed';
    if (isTerminal) return i <= Math.max(currentIndex, PIPELINE_STAGES.length - 1) ? 'done' : 'pending';
    if (currentIndex < 0) return i === 0 ? 'active' : 'pending';
    if (i <= currentIndex) return 'done';
    if (i === currentIndex + 1) return 'active';
    return 'pending';
  });
}

const StageIcon: React.FC<{ state: StageState }> = ({ state }) => {
  if (state === 'done') {
    return (
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-red-400 text-sm">close</span>
      </div>
    );
  }
  if (state === 'active') {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin shrink-0" />
    );
  }
  return <div className="w-6 h-6 rounded-full border border-white/10 bg-white/5 shrink-0" />;
};

export const RunResearchModal: React.FC<RunResearchModalProps> = ({
  isOpen,
  onClose,
  onResearchCompleted,
  onAwaitingApproval,
}) => {
  const [topic, setTopic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>('queued');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const stopPollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopPollRef.current) stopPollRef.current();
    };
  }, []);

  if (!isOpen) return null;

  const finishWithBriefing = (runId: string, status: RunStatus, currentTopic: string) => {
    const generated: Briefing = {
      id: runId,
      title: `Autonomous Research: ${currentTopic}`,
      category: 'INTELLIGENCE',
      timeAgo: 'Just now',
      confidence: 0,
      sourcesCount: 0,
      generatedDate: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      executiveSummary: status.briefing_draft || 'No briefing content was produced for this run.',
      keyFindings: [],
      verifiedClaims: [],
      citations: [],
    };
    onResearchCompleted(generated);
    setIsProcessing(false);
    setTopic('');
    onClose();
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isProcessing) return;

    const currentTopic = topic.trim();
    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentStep(null);
    setRunStatus('queued');

    try {
      const { run_id } = await radarApi.startRun(currentTopic);

      stopPollRef.current = pollRunUntilSettled(
        run_id,
        (status) => {
          setRunStatus(status.status);
          setCurrentStep(status.current_step ?? null);

          if (status.status === 'awaiting_approval') {
            onAwaitingApproval(run_id, currentTopic, status.briefing_draft || '');
            setIsProcessing(false);
            setTopic('');
            onClose();
          } else if (
            ['approved', 'skipped_no_news', 'send_failed', 'failed'].includes(status.status)
          ) {
            finishWithBriefing(run_id, status, currentTopic);
          }
        },
        (err) => setErrorMsg(err.message),
        2000
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Could not reach the Radar backend. Is it running on port 8000?'
      );
      setIsProcessing(false);
    }
  };

  const stageStates = getStageStates(currentStep, runStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <span className="material-symbols-outlined text-2xl">rocket_launch</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Run Autonomous Research</h3>
            <p className="text-xs text-slate-400">Deploys the real Radar multi-agent pipeline</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {!isProcessing ? (
          <form onSubmit={handleRun} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Watchlist Topic</label>
              <textarea
                required
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. New open-source LLM releases and AI agent frameworks..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Backend engines:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                Ollama (plan/research/write) + Groq (verify)
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                Launch Research Fleet
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-1">
            <div className="text-center mb-4">
              <h4 className="font-bold text-white text-sm">Multi-Agent Pipeline Active</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Real web search, extraction, and independent fact-checking — not a simulation.
                This can take a few minutes.
              </p>
            </div>

            <div className="space-y-0.5">
              {PIPELINE_STAGES.map((stage, i) => {
                const state = stageStates[i];
                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                      state === 'active' ? 'bg-indigo-500/10 border border-indigo-500/20' : ''
                    }`}
                  >
                    <StageIcon state={state} />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-semibold ${
                          state === 'pending' ? 'text-slate-500' : 'text-white'
                        }`}
                      >
                        {stage.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{stage.desc}</div>
                    </div>
                    {state === 'active' && (
                      <span className="text-[9px] font-mono text-indigo-400 shrink-0">running</span>
                    )}
                    {state === 'done' && (
                      <span className="text-[9px] font-mono text-emerald-400 shrink-0">done</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
