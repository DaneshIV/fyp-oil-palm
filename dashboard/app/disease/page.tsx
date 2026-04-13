'use client'

import { useEffect, useState } from 'react'
import { diseaseApi } from '@/lib/api'
import { RefreshCw, Microscope, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface DiseaseDetection {
  id: number
  image_path: string
  disease_label: string
  confidence: number
  severity: string
  tree_id: string
  block_id: string
  timestamp: string
}

const DISEASE_INFO: Record<string, { description: string; action: string; color: string; bg: string }> = {
  ganoderma: {
    description: 'Basal Stem Rot caused by Ganoderma boninense fungus. Affects trunk base.',
    action: 'Isolate infected tree immediately. Apply fungicide. Monitor surrounding trees.',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
  },
  bud_rot: {
    description: 'Bud Rot caused by Phytophthora palmivora. Affects crown and spear leaves.',
    action: 'Remove infected tissue. Apply copper-based fungicide. Improve drainage.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
  },
  crown_disease: {
    description: 'Crown Disease causes frond deformity at the canopy level.',
    action: 'Monitor progression. Apply foliar nutrients. Consult agronomist.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
  },
  fruit_bunch_rot: {
    description: 'Fruit Bunch Rot causes discoloration and decay of Fresh Fruit Bunches.',
    action: 'Harvest affected bunches immediately. Improve field sanitation.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
  },
  healthy: {
    description: 'No disease detected. Tree appears healthy.',
    action: 'Continue regular monitoring and maintenance schedule.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
  },
}

const getSeverityStyle = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high':   return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    case 'low':    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    case 'none':   return 'bg-green-500/20 text-green-400 border border-green-500/30'
    default:       return 'bg-gray-500/20 text-gray-400'
  }
}

const ConfidenceBar = ({ confidence, color }: { confidence: number; color: string }) => (
  <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
    <div
      className="h-2 rounded-full transition-all duration-500"
      style={{
        width: `${confidence}%`,
        background: confidence >= 80 ? '#f87171' : confidence >= 60 ? '#facc15' : '#4ade80',
      }}
    />
  </div>
)

export default function DiseasePage() {
  const [detections, setDetections] = useState<DiseaseDetection[]>([])
  const [selected, setSelected] = useState<DiseaseDetection | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchData = async () => {
    try {
      const res = await diseaseApi.getHistory(50)
      setDetections(res.data)
      if (res.data.length > 0 && !selected) {
        setSelected(res.data[0])
      }
    } catch (err) {
      console.error('Failed to fetch disease data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all'
    ? detections
    : filter === 'diseased'
    ? detections.filter(d => d.disease_label !== 'healthy')
    : detections.filter(d => d.disease_label === 'healthy')

  // Stats
  const totalDetections = detections.length
  const diseasedCount = detections.filter(d => d.disease_label !== 'healthy').length
  const healthyCount = detections.filter(d => d.disease_label === 'healthy').length
  const avgConfidence = detections.length > 0
    ? (detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin" />
          Loading disease data...
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
            <Microscope size={24} className="text-purple-400" />
            Disease AI Detection
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            YOLOv8 model — oil palm disease classification
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Scans</div>
          <div className="text-3xl font-bold text-white">{totalDetections}</div>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Diseased</div>
          <div className="text-3xl font-bold text-red-400">{diseasedCount}</div>
        </div>
        <div className="bg-gray-900 border border-green-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Healthy</div>
          <div className="text-3xl font-bold text-green-400">{healthyCount}</div>
        </div>
        <div className="bg-gray-900 border border-purple-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Avg Confidence</div>
          <div className="text-3xl font-bold text-purple-400">{avgConfidence}%</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Detection List */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Detection History</h2>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="diseased">Diseased</option>
              <option value="healthy">Healthy</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No detections found</p>
            ) : (
              filtered.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selected?.id === d.id
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium capitalize ${
                      d.disease_label === 'healthy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {d.disease_label.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityStyle(d.severity)}`}>
                      {d.severity}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Tree {d.tree_id} · Block {d.block_id}
                  </div>
                  <ConfidenceBar confidence={d.confidence} color="purple" />
                  <div className="text-xs text-gray-600 mt-1">{d.confidence}% confidence</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detection Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">

              {/* Main detail card */}
              <div className={`rounded-xl border p-6 ${
                DISEASE_INFO[selected.disease_label]?.bg || 'bg-gray-900 border-gray-800'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className={`text-xl font-bold capitalize ${
                      DISEASE_INFO[selected.disease_label]?.color || 'text-white'
                    }`}>
                      {selected.disease_label.replace(/_/g, ' ')}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Detection ID #{selected.id}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityStyle(selected.severity)}`}>
                    {selected.severity} Severity
                  </span>
                </div>

                {/* Confidence */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Model Confidence</span>
                    <span className="text-white font-bold">{selected.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{
                        width: `${selected.confidence}%`,
                        background: selected.confidence >= 80
                          ? '#f87171'
                          : selected.confidence >= 60
                          ? '#facc15'
                          : '#4ade80',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0%</span>
                    <span className="text-yellow-600">60% threshold</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Tree info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Tree ID</div>
                    <div className="text-white font-semibold">{selected.tree_id || 'N/A'}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Block ID</div>
                    <div className="text-white font-semibold">{selected.block_id || 'N/A'}</div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>
                    {format(new Date(selected.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                    {' '}·{' '}
                    {formatDistanceToNow(new Date(selected.timestamp))} ago
                  </span>
                </div>
              </div>

              {/* Disease info */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Microscope size={14} className="text-purple-400" />
                  Disease Information
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {DISEASE_INFO[selected.disease_label]?.description || 'No information available.'}
                </p>

                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  Recommended Action
                </h3>
                <p className="text-sm text-gray-400">
                  {DISEASE_INFO[selected.disease_label]?.action || 'Consult an agronomist.'}
                </p>
              </div>

              {/* Image path */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Captured Image
                </h3>
                <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                    🌴
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">{selected.image_path}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Image stored on IRIV PiControl local storage
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl p-10">
              <div className="text-center">
                <Microscope size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Select a detection to view details</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}