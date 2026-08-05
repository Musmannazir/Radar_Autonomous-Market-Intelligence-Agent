export type NavTab = 
  | 'overview' 
  | 'watchlist' 
  | 'runs' 
  | 'agents' 
  | 'briefings' 
  | 'memory' 
  | 'evaluations' 
  | 'settings' 
  | 'approval'
  | 'signin';

export interface WatchlistTopic {
  id: string;
  name: string;
  category: 'AI_RESEARCH' | 'OPEN_SOURCE_LLMS' | 'AI_JOBS' | 'AI_INNOVATION' | 'OTHER';
  status: 'Active / Pulse' | 'Paused';
  lastRun: string;
  findingsCount: number;
  findingsNew: number;
  icon: string;
  description?: string;
  frequency?: 'Real-time (High Load)' | 'Daily' | 'Weekly' | 'Monthly';
  priority?: 'LOW' | 'MED' | 'HIGH';
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  status: 'Online' | 'Offline' | 'Busy' | 'Queued' | 'Awaiting Approval';
  model: string;
  lastExecution: string;
  successRate: number;
  icon: string;
  colorClass: string;
  borderColor: string;
  bgLight: string;
  runTopic?: string;
  runId?: string;
  pipelineState?: 'running' | 'queued' | 'completed' | 'idle' | 'waiting_approval' | 'failed';
  queuePosition?: number | null;
}

export interface Briefing {
  id: string;
  title: string;
  category: 'AI_RESEARCH' | 'OPEN_SOURCE_LLMS' | 'AI_JOBS' | 'AI_INNOVATION' | 'OTHER';
  timeAgo: string;
  confidence: number;
  sourcesCount: number;
  hasWarning?: boolean;
  executiveSummary: string;
  keyFindings: Array<{
    title: string;
    description: string;
  }>;
  verifiedClaims: Array<{
    id: string;
    claim: string;
    source: string;
    confidence: number;
    status: 'VERIFIED' | 'NEEDS REVIEW' | 'FAILED';
  }>;
  marketImpact?: {
    summary: string;
    rpaExposure: string;
    infrastructureGrowth: string;
  };
  citations: Array<{
    ref: string;
    title: string;
  }>;
  generatedDate: string;
}

export interface EvaluationRecord {
  id: string;
  claim: string;
  expectedResult: string;
  radarDecision: string;
  confidence: number;
  status: 'PASS' | 'FAIL' | 'WARN';
  decisionClass?: string;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  createdOrUsed: string;
  keyMasked: string;
  rawKey: string;
  isDev?: boolean;
  showKey?: boolean;
}

export interface AgentStreamEvent {
  id: string;
  timeAgo: string;
  agentName: string;
  action: string;
  details: string;
  tag?: string;
  tagType?: 'error' | 'primary' | 'success' | 'neutral';
  color: string;
}
