import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthViewProps {
  onSignInSuccess: () => void;
}

type AuthMode = 'signin' | 'signup';

const STATS = [
  { label: 'Active Watchlists', value: '5', unit: 'topics' },
  { label: 'Sources Ingested', value: '8,910', unit: 'documents' },
  { label: 'Agent Fleet', value: '5/5', unit: 'online' },
  { label: 'Factual Accuracy', value: '98.4%', unit: 'precision' },
];

const FEATURES = [
  { icon: 'account_tree', title: 'Multi-Agent Pipeline', desc: 'Planner, Researcher, Verifier, Writer & Deliverer agents working in concert.' },
  { icon: 'travel_explore', title: 'Real-Time Web Intelligence', desc: 'Autonomous web search, page extraction, and structured fact gathering.' },
  { icon: 'database', title: 'Cross-Run Memory', desc: 'Vector dedup against prior findings so briefings are genuinely new signal.' },
  { icon: 'verified_user', title: 'Human-in-the-Loop', desc: 'Every briefing is reviewed and approved before delivery — no blind dispatches.' },
  { icon: 'schedule', title: 'Scheduled Briefings', desc: 'Daily research runs on your watchlist topics, delivered straight to your inbox.' },
  { icon: 'shield', title: 'Verified Claims Only', desc: 'Independent Verifier re-checks every claim against its source. No hallucinated facts.' },
];

export const SignInView: React.FC<AuthViewProps> = ({ onSignInSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSignInSuccess();
    }, 600);
  };

  const leftContent = (
    <div className="relative z-10 flex flex-col justify-between h-full p-8 lg:p-12">
      {/* Brand */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">radar</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Radar AI</h1>
            <p className="text-xs text-slate-400">Autonomous Market Intelligence</p>
          </div>
        </motion.div>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
            Intelligence that<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">runs itself</span>
          </h2>
          <p className="text-sm text-slate-300 max-w-md leading-relaxed">
            Radar watches your chosen markets, companies, and topics around the clock.
            It plans its own research, verifies every claim, and delivers cited briefings
            — so you wake up to what matters, not noise.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="bg-white/5 border border-white/10 rounded-xl p-3"
            >
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-slate-400">{s.label}</div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">{s.unit}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {FEATURES.slice(0, 4).map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
              className="flex items-start gap-2.5"
            >
              <span className="material-symbols-outlined text-indigo-400 text-lg shrink-0 mt-0.5">
                {f.icon}
              </span>
              <div>
                <div className="text-xs font-medium text-white">{f.title}</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="text-[10px] text-slate-500 mt-8"
      >
        2026 Radar AI &mdash; Autonomous Intelligence Platform
      </motion.div>
    </div>
  );

  const rightContent = (
    <div className="relative z-10 flex items-center justify-center h-full p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === 'signin'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === 'signup'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Brand mark for mobile */}
            <div className="text-center mb-6 lg:hidden">
              <div className="w-12 h-12 rounded-xl bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] mx-auto flex items-center justify-center text-white mb-2">
                <span className="material-symbols-outlined text-2xl">radar</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'signin' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'signin'
                  ? 'Sign in to your Radar workspace'
                  : 'Start your 14-day free trial'}
              </p>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 text-xs">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Mercer"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1.5 text-xs">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-300 font-medium text-xs">Password</label>
                {mode === 'signin' && (
                  <a
                    href="#forgot"
                    onClick={(e) => { e.preventDefault(); alert('Password reset link sent.'); }}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Forgot?
                  </a>
                )}
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 text-xs">Company</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your company or team name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-bold text-xs shadow-[0_4px_12px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    {mode === 'signin' ? 'login' : 'person_add'}
                  </span>
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>

            {/* Switch mode */}
            <p className="text-center text-[11px] text-slate-400 pt-2">
              {mode === 'signin' ? (
                <>No account?{' '}<button type="button" onClick={() => setMode('signup')} className="text-indigo-400 hover:underline font-medium">Sign up free</button></>
              ) : (
                <>Already have an account?{' '}<button type="button" onClick={() => setMode('signin')} className="text-indigo-400 hover:underline font-medium">Sign in</button></>
              )}
            </p>

            {/* Encryption badge */}
            <div className="pt-4 text-center">
              <div className="inline-flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                <span className="material-symbols-outlined text-xs text-emerald-400">shield</span>
                256-Bit TLS &bull; SOC2 Type II
              </div>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#131315] text-white flex overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(168,85,247,0.06),transparent_60%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Left panel: Hero — visible on lg+ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex w-1/2 min-h-screen relative overflow-hidden"
      >
        {/* Purple glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />
        {leftContent}
      </motion.div>

      {/* Right panel: Auth form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-1/2 min-h-screen relative overflow-hidden bg-[#131315]"
      >
        {/* Divider line on desktop */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        {rightContent}
      </motion.div>

      {/* Mobile: show hero inline above form on smaller screens */}
      <div className="lg:hidden w-full overflow-y-auto">
        {leftContent}
        <div className="border-t border-white/5" />
        {rightContent}
      </div>
    </div>
  );
};
