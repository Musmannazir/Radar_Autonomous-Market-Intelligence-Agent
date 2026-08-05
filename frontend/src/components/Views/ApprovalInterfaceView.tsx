import React, { useState, useEffect } from 'react';
import { radarApi, ApprovalHistoryItem } from '../../api/radarApi';

interface PendingApproval {
  runId: string;
  topic: string;
  briefingDraft: string;
}

interface ApprovalInterfaceViewProps {
  onApproveSuccess: () => void;
  pendingApproval?: PendingApproval | null;
}

type ApprovalStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'error';
type Tab = 'pending' | 'history';

export const ApprovalInterfaceView: React.FC<ApprovalInterfaceViewProps> = ({
  onApproveSuccess,
  pendingApproval,
}) => {
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await radarApi.getApprovalHistory(50);
      setHistory(response.history);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load approval history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const pollForResume = (runId: string, attempt = 0) => {
    if (attempt > 15) {
      setStatus('error');
      setErrorMsg('Timed out waiting for the backend to confirm the decision.');
      return;
    }
    radarApi
      .getRun(runId)
      .then((run) => {
        if (run.status === 'approved') {
          setStatus('approved');
          onApproveSuccess();
        } else if (run.status === 'rejected') {
          setStatus('rejected');
          onApproveSuccess();
        } else if (['send_failed', 'failed'].includes(run.status)) {
          setStatus('error');
          setErrorMsg(
            run.status === 'send_failed'
              ? 'Approved, but the email failed to send. Check Gmail SMTP settings on the backend.'
              : 'The run failed on the backend while processing your decision.'
          );
        } else {
          setTimeout(() => pollForResume(runId, attempt + 1), 1500);
        }
      })
      .catch(() => setTimeout(() => pollForResume(runId, attempt + 1), 1500));
  };

  const handleApprove = async () => {
    if (!pendingApproval) return;
    setStatus('processing');
    setErrorMsg(null);
    try {
      await radarApi.submitApproval(pendingApproval.runId, 'approve');
      pollForResume(pendingApproval.runId);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to submit approval to the backend.');
    }
  };

  const handleReject = async () => {
    if (!pendingApproval) return;
    setIsRejectModalOpen(false);
    setStatus('processing');
    setErrorMsg(null);
    try {
      await radarApi.submitApproval(pendingApproval.runId, 'reject', rejectReason);
      pollForResume(pendingApproval.runId);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to submit rejection to the backend.');
    }
  };

  const handleEdit = async () => {
    if (!pendingApproval || !editContent.trim()) return;
    setIsEditModalOpen(false);
    setStatus('processing');
    setErrorMsg(null);
    try {
      await radarApi.submitApproval(pendingApproval.runId, 'edit', editContent);
      pollForResume(pendingApproval.runId);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to submit edited briefing to the backend.');
    }
  };

  const formatBriefingContent = (text: string) => {
    // Split by double newlines for paragraphs, bold headings after ** markers
    return text.split('\n\n').map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;
      const isHeading = trimmed.startsWith('**') && trimmed.endsWith('**');
      return (
        <p
          key={i}
          className={`leading-relaxed ${isHeading ? 'font-bold text-white text-xs mt-4 mb-1' : 'text-slate-300 text-xs mb-2'}`}
        >
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
    });
  };

  // --- Empty state ---
  if (!pendingApproval) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <span className="material-symbols-outlined text-4xl text-slate-500">verified_user</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No Pending Approvals</h3>
          <p className="text-xs text-slate-400 max-w-md">
            When Radar finishes a research run, the briefing will appear here for your review and sign-off before delivery.
          </p>
        </div>
      </div>
    );
  }

  // We have a pendingApproval but status tracking is local to this component.
  // 'processing' still shows the main view (buttons reflect the in-flight state);
  // only terminal states (approved/rejected/error) switch to the result screen.
  if (status === 'approved' || status === 'rejected' || status === 'error') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {status === 'approved' && (
            <>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Briefing Approved & Sent</h3>
              <p className="text-xs text-slate-400 max-w-md">
                The briefing for <span className="text-white font-medium">{pendingApproval?.topic}</span> has been approved and delivered by email.
              </p>
              <button
                onClick={onApproveSuccess}
                className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Check for More Approvals
              </button>
            </>
          )}
          {status === 'rejected' && (
            <>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <span className="material-symbols-outlined text-4xl text-amber-400">feedback</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Briefing Rejected</h3>
              <p className="text-xs text-slate-400 max-w-md">
                The briefing for <span className="text-white font-medium">{pendingApproval?.topic}</span> was not sent.
              </p>
              <button
                onClick={onApproveSuccess}
                className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Check for More Approvals
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                <span className="material-symbols-outlined text-4xl text-red-400">error</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Something Went Wrong</h3>
              <p className="text-xs text-slate-400 max-w-md">{errorMsg}</p>
              <button
                onClick={onApproveSuccess}
                className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderHistoryView = () => (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Approval History</h2>
        <button
          onClick={loadHistory}
          disabled={isLoadingHistory}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </button>
      </div>

      {isLoadingHistory && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <span className="material-symbols-outlined animate-spin mr-2">sync</span>
          Loading history...
        </div>
      )}

      {!isLoadingHistory && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <span className="material-symbols-outlined text-4xl text-slate-500">history</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No Approval History</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Your approved and rejected briefings will appear here once you take action on them.
          </p>
        </div>
      )}

      {!isLoadingHistory && history.length > 0 && (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.run_id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl flex items-center justify-center ${
                      item.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {item.status === 'approved' ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.topic || 'Unknown Topic'}</h3>
                    <p className="text-xs text-slate-400">
                      Run: <span className="font-mono">{item.run_id.slice(0, 8)}...</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`px-3 py-1 rounded-full font-mono ${
                      item.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {item.completed_at
                      ? new Date(item.completed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : item.started_at
                      ? new Date(item.started_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {item.briefing_content && (
                <div className="prose prose-invert max-w-none text-xs bg-white/3 rounded-xl p-4 border border-white/5">
                  {formatBriefingContent(item.briefing_content)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-sm">pending_actions</span>
          Pending
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-sm">history</span>
          History
        </button>
      </div>

      {activeTab === 'history' ? renderHistoryView() : (
        <>
          {/* Status Banner - Shows Approved/Rejected state */}
          {(status === 'approved' || status === 'rejected') && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              status === 'approved'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className={`p-3 rounded-xl flex items-center justify-center ${
                status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <span className="material-symbols-outlined text-2xl">
                  {status === 'approved' ? 'check_circle' : 'cancel'}
                </span>
              </div>
              <div>
                <div className={`font-bold text-sm ${
                  status === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {status === 'approved' ? '✓ APPROVED & SENT' : '✗ REJECTED'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {status === 'approved'
                    ? `Briefing for "${pendingApproval?.topic}" has been approved and delivered.`
                    : `Briefing for "${pendingApproval?.topic}" was rejected and not sent.`}
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {status === 'error' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Empty state when no pending approval */}
          {!pendingApproval && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-500">verified_user</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">No Pending Approvals</h3>
              <p className="text-xs text-slate-400 max-w-md">
                When Radar finishes a research run, the briefing will appear here for your review and sign-off before delivery.
              </p>
            </div>
          )}

          {pendingApproval && (
            <>
              {/* Approve Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-amber-400 font-bold uppercase">
                        Human-in-the-Loop Checkpoint
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                        Run: {pendingApproval.runId.slice(0, 8)}...
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">{pendingApproval.topic}</h2>
                    <p className="text-xs text-slate-400">
                      Radar has finished its research. Review the briefing below, then approve, edit, or reject before delivery.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setEditContent(pendingApproval?.briefingDraft || ''); setIsEditModalOpen(true); }}
                    disabled={status === 'processing'}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-400 border border-white/10 text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={status === 'processing'}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={status === 'processing'}
                    className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {status === 'processing' ? 'Sending...' : 'Approve & Send'}
                  </button>
                </div>
              </div>

              {errorMsg && status === 'pending' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Briefing Content */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="pb-4 border-b border-white/10 mb-4">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mb-2 inline-block">
                    Briefing Draft
                  </span>
                  <h3 className="text-xl font-bold text-white">{pendingApproval.topic}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Prepared by Radar Multi-Agent Fleet</p>
                </div>

                <div className="prose prose-invert max-w-none text-xs">
                  {formatBriefingContent(pendingApproval.briefingDraft)}
                </div>
              </div>
            </>
          )}

          {/* Reject Modal */}
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                <h3 className="text-lg font-bold text-white mb-1">Reject Briefing</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Provide feedback so the Writer Agent can revise the briefing.
                </p>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Revision Notes
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Add more detail on market impact, reduce speculation in section 2..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsRejectModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium hover:bg-amber-500/30 transition-colors"
                    >
                      Send Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                <h3 className="text-lg font-bold text-white mb-1">Edit Briefing</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Modify the briefing below. Your edited version will be sent instead of the original.
                </p>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Briefing Content
                    </label>
                    <textarea
                      rows={12}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEdit}
                      disabled={!editContent.trim()}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-40"
                    >
                      Save Edits & Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
