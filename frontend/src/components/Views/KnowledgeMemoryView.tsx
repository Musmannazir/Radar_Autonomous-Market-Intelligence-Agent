import React, { useState } from 'react';

interface VectorNode {
  id: string;
  label: string;
  cluster: string;
  x: number;
  y: number;
  color: string;
  connections: string[];
  summary: string;
}

export const KnowledgeMemoryView: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-1');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeClusterFilter, setActiveClusterFilter] = useState<string>('ALL');

  const nodes: VectorNode[] = [
    {
      id: 'node-1',
      label: 'OpenAI Operator GUI Agent',
      cluster: 'AI GUI Agents',
      x: 220,
      y: 140,
      color: '#3B82F6',
      connections: ['node-2', 'node-3'],
      summary: 'Visual grounding transformer model mapping UI DOM elements to keyboard and mouse actions.'
    },
    {
      id: 'node-2',
      label: 'Headless Chromium Sandbox',
      cluster: 'AI GUI Agents',
      x: 310,
      y: 190,
      color: '#3B82F6',
      connections: ['node-1'],
      summary: 'Ephemeral virtual machine container for browser session execution and network isolation.'
    },
    {
      id: 'node-3',
      label: 'Computer-Use Agent Benchmarks',
      cluster: 'AI GUI Agents',
      x: 180,
      y: 240,
      color: '#3B82F6',
      connections: ['node-1'],
      summary: 'Latency benchmarks: < 120ms screen capture to reasoning pipeline execution.'
    },
    {
      id: 'node-4',
      label: 'FIPS 203 ML-KEM Standard',
      cluster: 'Post-Quantum Crypto',
      x: 520,
      y: 120,
      color: '#8B5CF6',
      connections: ['node-5'],
      summary: 'Lattice-based key encapsulation mechanism approved by NIST.'
    },
    {
      id: 'node-5',
      label: 'TLS 1.3 Post-Quantum Handshake',
      cluster: 'Post-Quantum Crypto',
      x: 600,
      y: 200,
      color: '#8B5CF6',
      connections: ['node-4'],
      summary: 'Hybrid classical-quantum key exchange for enterprise TLS gateways.'
    },
    {
      id: 'node-6',
      label: 'TSMC CoWoS Packaging Yield',
      cluster: 'Semiconductors',
      x: 380,
      y: 350,
      color: '#10B981',
      connections: ['node-7'],
      summary: 'Monthly throughput up 35% in Arizona and Taiwan advanced packaging facilities.'
    },
    {
      id: 'node-7',
      label: '3nm GAA Wafer Allocations',
      cluster: 'Semiconductors',
      x: 480,
      y: 320,
      color: '#10B981',
      connections: ['node-6'],
      summary: 'Hyperscaler custom AI accelerators consuming 40% of 3nm foundry capacity.'
    }
  ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const filteredNodes = nodes.filter((n) => {
    if (activeClusterFilter === 'ALL') return true;
    return n.cluster === activeClusterFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Knowledge Memory Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
              VECTOR MEMORY ENGINE
            </span>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
              2,410 Embedded Semantic Vectors
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Knowledge Graph & Deduplication Space
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cosine similarity matrix clustering market filings, patent claims, and research articles
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => alert('Exporting vector similarity map...')}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Vector Map</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Graph & Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Canvas Container */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between relative min-h-[440px]">
          {/* Canvas Top Controls */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 z-10">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-white">Filter Clusters:</span>
              <select
                value={activeClusterFilter}
                onChange={(e) => setActiveClusterFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Clusters (3)</option>
                <option value="AI GUI Agents">AI GUI Agents</option>
                <option value="Post-Quantum Crypto">Post-Quantum Crypto</option>
                <option value="Semiconductors">Semiconductors</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
                className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 text-[10px] font-mono text-slate-400 hover:text-white"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
                className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
            </div>
          </div>

          {/* SVG Vector Nodes Graph View */}
          <div className="relative w-full h-[360px] bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
            <svg
              className="w-full h-full transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Connection Lines */}
              {nodes.map((node) =>
                node.connections.map((targetId) => {
                  const targetNode = nodes.find((n) => n.id === targetId);
                  if (!targetNode) return null;
                  const isSelectedLine = selectedNodeId === node.id || selectedNodeId === targetId;
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={node.x}
                      y1={node.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isSelectedLine ? '#3B82F6' : '#27272A'}
                      strokeWidth={isSelectedLine ? 2 : 1}
                      strokeDasharray={isSelectedLine ? 'none' : '4 4'}
                    />
                  );
                })
              )}

              {/* Node Elements */}
              {filteredNodes.map((n) => {
                const isSelected = n.id === selectedNodeId;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    onClick={() => setSelectedNodeId(n.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      r={isSelected ? 14 : 9}
                      fill={n.color}
                      className="transition-all duration-200 group-hover:scale-125"
                      opacity={isSelected ? 1 : 0.8}
                    />
                    {isSelected && (
                      <circle
                        r={20}
                        fill="none"
                        stroke={n.color}
                        strokeWidth={1.5}
                        className="animate-ping opacity-40"
                      />
                    )}
                    <text
                      y={isSelected ? 26 : 22}
                      textAnchor="middle"
                      fill="#FAFAFA"
                      fontSize={10}
                      fontFamily="sans-serif"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none select-none"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Node Inspector Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <span className="material-symbols-outlined text-base">radar</span>
              NODE EMBEDDING DETAILS
            </div>

            <h3 className="font-bold text-lg text-white mb-1">{selectedNode.label}</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Cluster: {selectedNode.cluster}
            </span>

            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400">Semantic Summary:</span>
              <p className="text-slate-200 leading-relaxed">{selectedNode.summary}</p>
            </div>

            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Vector Dimension:</span>
                <span className="text-white">1,536 float32</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cluster Density:</span>
                <span className="text-emerald-400 font-bold">0.941 High</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Connected Nodes:</span>
                <span className="text-blue-400">{selectedNode.connections.length} Nodes</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-white/10">
            <button
              onClick={() => alert(`Triggered deep vector search on "${selectedNode.label}"`)}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors"
            >
              Search Similar Embeddings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
