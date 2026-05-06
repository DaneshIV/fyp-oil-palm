'use client'

import { useState, useEffect, useCallback } from 'react'
import { diseaseApi } from '@/lib/api'
import { RefreshCw, Map, TreePine, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DiseaseDetection {
  id:            number
  disease_label: string
  confidence:    number
  severity:      string
  tree_id:       string
  block_id:      string
  timestamp:     string
}

interface TreeStatus {
  tree_id:       string
  disease_label: string
  confidence:    number
  severity:      string
  timestamp:     string
  count:         number
}

const SEVERITY_COLORS: Record<string, string> = {
  High:   'bg-red-500/80 border-red-400 text-white',
  Medium: 'bg-yellow-500/80 border-yellow-400 text-white',
  Low:    'bg-blue-500/80 border-blue-400 text-white',
  None:   'bg-green-500/80 border-green-400 text-white',
}

const SEVERITY_DOT: Record<string, string> = {
  High:   'bg-red-400',
  Medium: 'bg-yellow-400',
  Low:    'bg-blue-400',
  None:   'bg-green-400',
}

const LABEL_EMOJI: Record<string, string> = {
  healthy:      '✅',
  ganoderma:    '🔴',
  unhealthy:    '🟡',
  immature:     '🔵',
  bud_rot:      '🟠',
  crown_disease:'🟣',
}

export default function MapPage() {
  const [detections, setDetections] = useState<DiseaseDetection[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<TreeStatus | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await diseaseApi.getHistory(200)
      setDetections(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Group detections by block
  const blockMap: Record<string, Record<string, TreeStatus>> = {}

  detections.forEach(d => {
    const block = d.block_id || 'Unknown'
    const tree  = d.tree_id  || 'Unknown'

    if (!blockMap[block]) blockMap[block] = {}

    // Keep most recent detection per tree
    if (!blockMap[block][tree] ||
        new Date(d.timestamp) > new Date(blockMap[block][tree].timestamp)) {
      blockMap[block][tree] = {
        tree_id:       tree,
        disease_label: d.disease_label,
        confidence:    d.confidence,
        severity:      d.severity,
        timestamp:     d.timestamp,
        count:         (blockMap[block][tree]?.count || 0) + 1,
      }
    } else {
      blockMap[block][tree].count++
    }
  })

  // Stats
  const allTrees    = Object.values(blockMap).flatMap(b => Object.values(b))
  const totalTrees  = allTrees.length
  const diseasedTrees = allTrees.filter(t => t.disease_label !== 'healthy').length
  const healthyTrees  = allTrees.filter(t => t.disease_label === 'healthy').length
  const criticalTrees = allTrees.filter(t => t.severity === 'High').length

  const blocks = Object.keys(blockMap).filter(b => b !== 'auto' && b !== 'test' && b !== 'Unknown')
  const otherBlocks = Object.keys(blockMap).filter(b => b === 'auto' || b === 'test' || b === 'Unknown')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin" />
          Loading plantation map...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Map size={24} className="text-green-400" />
            Plantation Block Map
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Visual overview of tree health status by block
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Trees Scanned</div>
          <div className="text-3xl font-bold text-white">{totalTrees}</div>
        </div>
        <div className="bg-gray-900 border border-green-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Healthy</div>
          <div className="text-3xl font-bold text-green-400">{healthyTrees}</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Diseased</div>
          <div className="text-3xl font-bold text-yellow-400">{diseasedTrees}</div>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Critical (High)</div>
          <div className="text-3xl font-bold text-red-400">{criticalTrees}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-3">Legend</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Healthy',       color: 'bg-green-500/80',  text: 'None severity'   },
            { label: 'Low Risk',      color: 'bg-blue-500/80',   text: 'Low severity'    },
            { label: 'Warning',       color: 'bg-yellow-500/80', text: 'Medium severity' },
            { label: 'Critical',      color: 'bg-red-500/80',    text: 'High severity'   },
            { label: 'Not Scanned',   color: 'bg-gray-700',      text: 'No data'         },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color} border border-white/20`} />
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Block Grid */}
        <div className="lg:col-span-2 space-y-6">
          {blocks.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <TreePine size={48} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold">No block data yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Run disease detections with Block-A, Block-B format tree IDs
              </p>
            </div>
          ) : (
            blocks.map(block => {
              const trees = Object.values(blockMap[block])
              const blockDiseased = trees.filter(t => t.disease_label !== 'healthy').length

              return (
                <div key={block} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TreePine size={16} className="text-green-400" />
                      {block}
                    </h2>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">{trees.length} trees</span>
                      {blockDiseased > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                          {blockDiseased} diseased
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tree Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {trees.map(tree => (
                      <button
                        key={tree.tree_id}
                        onClick={() => setSelected(selected?.tree_id === tree.tree_id ? null : tree)}
                        title={`${tree.tree_id} — ${tree.disease_label} (${tree.confidence}%)`}
                        className={`
                          aspect-square rounded-lg border text-xs font-bold
                          flex items-center justify-center transition-all
                          hover:scale-110 hover:z-10 relative
                          ${SEVERITY_COLORS[tree.severity] || 'bg-gray-700 border-gray-600 text-gray-400'}
                          ${selected?.tree_id === tree.tree_id ? 'ring-2 ring-white scale-110' : ''}
                        `}
                      >
                        {tree.tree_id.split('-')[1] || tree.tree_id}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}

          {/* Other/Test blocks */}
          {otherBlocks.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 opacity-60">
              <h2 className="text-sm font-semibold text-gray-400 mb-4">Other / Test Data</h2>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {otherBlocks.flatMap(block =>
                  Object.values(blockMap[block]).map(tree => (
                    <button
                      key={`${block}-${tree.tree_id}`}
                      onClick={() => setSelected(selected?.tree_id === tree.tree_id ? null : tree)}
                      title={`${tree.tree_id} — ${tree.disease_label}`}
                      className={`
                        aspect-square rounded-lg border text-xs font-bold
                        flex items-center justify-center transition-all hover:scale-110
                        ${SEVERITY_COLORS[tree.severity] || 'bg-gray-700 border-gray-600 text-gray-400'}
                        ${selected?.tree_id === tree.tree_id ? 'ring-2 ring-white scale-110' : ''}
                      `}
                    >
                      {tree.tree_id.slice(0, 3)}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tree Detail Panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TreePine size={14} className="text-green-400" />
                Tree Details
              </h3>

              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Tree ID</div>
                  <div className="text-white font-bold">{selected.tree_id}</div>
                </div>

                <div className={`rounded-lg p-3 border ${SEVERITY_COLORS[selected.severity] || 'bg-gray-800 border-gray-700'}`}>
                  <div className="text-xs opacity-70 mb-1">Status</div>
                  <div className="font-bold capitalize flex items-center gap-2">
                    {LABEL_EMOJI[selected.disease_label]}
                    {selected.disease_label.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Severity</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[selected.severity]}`} />
                    <span className="text-white font-semibold">{selected.severity}</span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">Confidence</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${selected.confidence}%`,
                          background: selected.confidence >= 80 ? '#f87171'
                            : selected.confidence >= 60 ? '#facc15' : '#4ade80'
                        }}
                      />
                    </div>
                    <span className="text-white text-xs font-bold">{selected.confidence}%</span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Total Scans</div>
                  <div className="text-white font-bold">{selected.count}</div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Last Detected</div>
                  <div className="text-white text-xs">
                    {formatDistanceToNow(new Date(selected.timestamp))} ago
                  </div>
                </div>

                {selected.disease_label !== 'healthy' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                      <AlertTriangle size={12} />
                      Action Required
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Inspect tree {selected.tree_id} immediately and take appropriate action.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <TreePine size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Click a tree to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}