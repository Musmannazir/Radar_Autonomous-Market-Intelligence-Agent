import { WatchlistTopic, AIAgent, Briefing, EvaluationRecord, ApiKeyRecord, AgentStreamEvent } from '../types';

export const INITIAL_WATCHLISTS: WatchlistTopic[] = [
  {
    id: 'wl-1',
    name: 'AI Agent Frameworks',
    category: 'AI_RESEARCH',
    status: 'Active / Pulse',
    lastRun: '2 mins ago',
    findingsCount: 1420,
    findingsNew: 12,
    icon: 'psychology',
    frequency: 'Real-time (High Load)',
    priority: 'HIGH',
    description: 'Tracking autonomous agent orchestration engines, multi-agent protocols, and task execution runtimes.'
  },
  {
    id: 'wl-2',
    name: 'Quantum Key Distribution',
    category: 'OPEN_SOURCE_LLMS',
    status: 'Active / Pulse',
    lastRun: '15 mins ago',
    findingsCount: 890,
    findingsNew: 3,
    icon: 'security',
    frequency: 'Daily',
    priority: 'HIGH',
    description: 'Monitoring post-quantum cryptographic standards, lattice encryption patents, and enterprise key exchange networks.'
  },
  {
    id: 'wl-3',
    name: 'EU AI Act Compliance',
    category: 'AI_JOBS',
    status: 'Paused',
    lastRun: '3 days ago',
    findingsCount: 450,
    findingsNew: 0,
    icon: 'gavel',
    frequency: 'Weekly',
    priority: 'MED',
    description: 'Regulatory tracking for Annex IV technical documentation and high-risk AI system risk management standards.'
  },
  {
    id: 'wl-4',
    name: 'Solid-State Battery IP',
    category: 'AI_INNOVATION',
    status: 'Active / Pulse',
    lastRun: '1 hour ago',
    findingsCount: 2310,
    findingsNew: 28,
    icon: 'science',
    frequency: 'Real-time (High Load)',
    priority: 'HIGH',
    description: 'Patents and academic publications around sulfide-based electrolyte stability and cathode interface degradation.'
  },
  {
    id: 'wl-5',
    name: 'Semiconductor Foundry Supply Chains',
    category: 'OTHER',
    status: 'Active / Pulse',
    lastRun: '35 mins ago',
    findingsCount: 3840,
    findingsNew: 15,
    icon: 'memory',
    frequency: 'Daily',
    priority: 'HIGH',
    description: 'Wafer capacity allocations, EUV lithography tool lead-times, and regional fab expansion announcements.'
  }
];

export const INITIAL_AGENTS: AIAgent[] = [
  {
    id: 'agent-planner',
    name: 'Planner Agent',
    description: 'Orchestrates search plans and decomposes complex goals into sub-tasks.',
    status: 'Online',
    model: 'Ollama - llama3.2:3b',
    lastExecution: 'Just now',
    successRate: 99.4,
    icon: 'account_tree',
    colorClass: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgLight: 'bg-blue-500/10'
  },
  {
    id: 'agent-research',
    name: 'Research Agent',
    description: 'Executes web search queries, scrapes web pages, and ingests document sources.',
    status: 'Busy',
    model: 'Ollama - llama3.2:3b',
    lastExecution: 'Executing stream...',
    successRate: 98.1,
    icon: 'radar',
    colorClass: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgLight: 'bg-purple-500/10'
  },
  {
    id: 'agent-verifier',
    name: 'Verifier Agent',
    description: 'Cross-checks claims against source documents and scores factual grounding.',
    status: 'Online',
    model: 'Groq - llama-3.3-70b-versatile',
    lastExecution: '1 min ago',
    successRate: 99.8,
    icon: 'verified',
    colorClass: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10'
  },
  {
    id: 'agent-writer',
    name: 'Writer Agent',
    description: 'Synthesizes verified claims into executive briefings and markdown reports.',
    status: 'Online',
    model: 'Ollama - llama3.2:3b',
    lastExecution: '4 mins ago',
    successRate: 97.9,
    icon: 'edit_note',
    colorClass: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10'
  },
  {
    id: 'agent-deliverer',
    name: 'Deliverer Agent',
    description: 'Handles Webhook dispatch, Slack notifications, and PDF exporter pipeline.',
    status: 'Online',
    model: 'Rule Engine',
    lastExecution: '10 mins ago',
    successRate: 100.0,
    icon: 'send',
    colorClass: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgLight: 'bg-cyan-500/10'
  }
];

export const INITIAL_BRIEFINGS: Briefing[] = [
  {
    id: 'br-1',
    title: 'OpenAI Operator & Autonomous GUI Agent Infrastructure',
    category: 'AI_RESEARCH',
    timeAgo: '10 mins ago',
    confidence: 96,
    sourcesCount: 14,
    generatedDate: '2026-07-30 08:45 UTC',
    executiveSummary: 'OpenAI is preparing to launch "Operator," an autonomous computer-using agent capable of performing multi-step actions across web browsers and desktop interfaces. The architecture leverages low-latency visual grounding and browser sandbox containers.',
    keyFindings: [
      {
        title: 'Browser Automation & Execution Engine',
        description: 'Operator utilizes headless Chromium runtime containers paired with a visual transformer model that maps UI DOM elements to precise mouse and keyboard actions.'
      },
      {
        title: 'Enterprise Security & Isolation',
        description: 'Enforces ephemeral virtual machines with egress filtering to prevent unauthorized data exfiltration during autonomous session navigation.'
      },
      {
        title: 'Market Positioning',
        description: 'Directly targets enterprise robotic process automation (RPA) and complex workflow automation markets previously dominated by custom scripts.'
      }
    ],
    verifiedClaims: [
      {
        id: 'c-1',
        claim: 'Operator is scheduled for developer preview access via API endpoint.',
        source: 'SEC Filing & Tech Disclosures (Ref #1024)',
        confidence: 98,
        status: 'VERIFIED'
      },
      {
        id: 'c-2',
        claim: 'Visual reasoning model latency achieved < 120ms per screen state capture.',
        source: 'Academic Preprint & Benchmark Log (Ref #3091)',
        confidence: 94,
        status: 'VERIFIED'
      },
      {
        id: 'c-3',
        claim: 'Full replacement of legacy RPA tools expected within 18 months.',
        source: 'Analyst Projections (Ref #882)',
        confidence: 88,
        status: 'NEEDS REVIEW'
      }
    ],
    marketImpact: {
      summary: 'Expected to shift $4.2B in enterprise automation budget from legacy RPA software to LLM-native computer-use agents by Q4 2026.',
      rpaExposure: 'High vulnerability for legacy RPA platform vendors without native vision models.',
      infrastructureGrowth: 'Increased demand for isolated browser container infrastructure at scale.'
    },
    citations: [
      { ref: 'Ref #1024', title: 'Developer Portal Early Access Roadmap - OpenAI Spec 2026' },
      { ref: 'Ref #3091', title: 'Visual Grounding Benchmarks for GUI Navigation Models' },
      { ref: 'Ref #882', title: 'Gartner Enterprise Automation Intelligence Quarter Report' }
    ]
  },
  {
    id: 'br-2',
    title: 'Quarterly Semiconductor & AI Chip Supply Chain Resilience',
    category: 'OPEN_SOURCE_LLMS',
    timeAgo: '1 hour ago',
    confidence: 94,
    sourcesCount: 22,
    generatedDate: '2026-07-30 07:15 UTC',
    executiveSummary: 'Foundry capacity for 3nm and 2nm gate-all-around (GAA) nodes remains 98% committed through 2027. Advanced packaging (CoWoS) bottlenecks are easing as new packaging facilities reach high-yield volume production in Taiwan and Arizona.',
    keyFindings: [
      {
        title: 'CoWoS Capacity Expansion',
        description: 'Monthly wafer throughput increased by 35% compared to Q1 2025 following the commissioning of new packaging facilities.'
      },
      {
        title: 'Custom Silicon Surge',
        description: 'Hyperscalers now represent over 40% of total 3nm wafer orders for proprietary AI accelerator chips.'
      }
    ],
    verifiedClaims: [
      {
        id: 'c-4',
        claim: 'Advanced packaging lead time reduced from 9 months to 4.5 months.',
        source: 'TSMC Q2 Earnings Transcript & Supply Audit',
        confidence: 97,
        status: 'VERIFIED'
      }
    ],
    citations: [
      { ref: 'Ref #502', title: 'Semiconductor Industry Association Global Packaging Report' }
    ]
  },
  {
    id: 'br-3',
    title: 'Post-Quantum Encryption Standards Compliance Mandates',
    category: 'OTHER',
    timeAgo: '3 hours ago',
    confidence: 98,
    sourcesCount: 18,
    generatedDate: '2026-07-29 22:00 UTC',
    executiveSummary: 'NIST has finalized principal post-quantum cryptographic standards (ML-KEM and ML-DSA). Federal agencies and critical infrastructure providers are instructed to phase out RSA-2048 and ECC by 2030.',
    keyFindings: [
      {
        title: 'NIST Standard Release',
        description: 'FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) are now official. Migration pathways are required for all TLS 1.3 enterprise implementations.'
      }
    ],
    verifiedClaims: [
      {
        id: 'c-5',
        claim: 'FIPS 203 implementation guidance published by CISA and NSA.',
        source: 'Federal Register Notice Vol. 89 No. 162',
        confidence: 99,
        status: 'VERIFIED'
      }
    ],
    citations: [
      { ref: 'Ref #710', title: 'NIST Cryptographic Technology Publication FIPS 203' }
    ]
  }
];

export const INITIAL_EVALUATIONS: EvaluationRecord[] = [
  {
    id: 'EV-8841',
    claim: 'Operator browser agent uses visual grounding transformer.',
    expectedResult: 'TRUE (Verified via Ref #3091)',
    radarDecision: 'VERIFIED (Score: 0.98)',
    confidence: 98,
    status: 'PASS',
    decisionClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 'EV-8842',
    claim: 'TSMC CoWoS capacity increased 35% in Q2.',
    expectedResult: 'TRUE (Verified via TSMC Audit)',
    radarDecision: 'VERIFIED (Score: 0.97)',
    confidence: 97,
    status: 'PASS',
    decisionClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 'EV-8843',
    claim: 'Legacy RPA software market projected to grow 80% next year.',
    expectedResult: 'FALSE (Contradicted by Gartner & IDC)',
    radarDecision: 'FLAGGED_INACCURATE',
    confidence: 92,
    status: 'FAIL',
    decisionClass: 'text-red-400 bg-red-500/10 border-red-500/20'
  },
  {
    id: 'EV-8844',
    claim: 'NIST FIPS 203 replaces ECC algorithms for key exchange.',
    expectedResult: 'TRUE (Verified via NIST Spec)',
    radarDecision: 'VERIFIED (Score: 0.99)',
    confidence: 99,
    status: 'PASS',
    decisionClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 'EV-8845',
    claim: 'Solid-state battery electrolyte degradation fully resolved in commercial cars.',
    expectedResult: 'UNSUBSTANTIATED (Lab scale only)',
    radarDecision: 'NEEDS_REVIEW',
    confidence: 76,
    status: 'WARN',
    decisionClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  }
];

export const INITIAL_AGENT_STREAM: AgentStreamEvent[] = [
  {
    id: 's-1',
    timeAgo: '10:42:01',
    agentName: 'Verifier Agent',
    action: 'Verified Claim Node #824',
    details: 'Matched claim "Visual reasoning model latency < 120ms" with Academic Preprint PDF (Confidence 94%).',
    tag: 'CLAIM VERIFIED',
    tagType: 'success',
    color: '#10B981'
  },
  {
    id: 's-2',
    timeAgo: '10:41:48',
    agentName: 'Research Agent',
    action: 'Ingested 14 Web Sources',
    details: 'Finished crawling tech disclosure portals and SEC database feeds for "Operator GUI Agent".',
    tag: 'INGESTION COMPLETE',
    tagType: 'primary',
    color: '#3B82F6'
  },
  {
    id: 's-3',
    timeAgo: '10:41:12',
    agentName: 'Planner Agent',
    action: 'Generated Sub-Task Tree (6 Nodes)',
    details: 'Decomposed goal "Analyze AI Agent Framework Market" into technical, regulatory, and financial vectors.',
    tag: 'PLAN READY',
    tagType: 'neutral',
    color: '#8B5CF6'
  },
  {
    id: 's-4',
    timeAgo: '10:39:55',
    agentName: 'Memory Engine',
    action: 'Deduplicated Vector Space',
    details: 'Merged 4 redundant news items into existing Knowledge Cluster #402 (Deduplication efficiency: 91%).',
    tag: 'DEDUPLICATED',
    tagType: 'neutral',
    color: '#6366F1'
  }
];

export const INITIAL_API_KEYS: ApiKeyRecord[] = [
  {
    id: 'key-1',
    name: 'Production Pipeline Key',
    createdOrUsed: 'Used 2 mins ago',
    keyMasked: 'rad_live_8f93...42a1',
    rawKey: 'rad_live_8f93a74b12c98402131942a1',
    isDev: false,
    showKey: false
  },
  {
    id: 'key-2',
    name: 'Staging Integration Key',
    createdOrUsed: 'Created 3 days ago',
    keyMasked: 'rad_test_901a...71e8',
    rawKey: 'rad_test_901a88b1394c20811971e8',
    isDev: true,
    showKey: false
  }
];
