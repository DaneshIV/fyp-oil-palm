'use client'

import { useEffect, useState } from 'react'
import { sensorApi, alertApi, diseaseApi } from '@/lib/api'
import SensorCard from '@/components/ui/SensorCard'
import { AlertTriangle, CheckCircle, RefreshCw, Wifi } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SensorData {
  temperature: number
  humidity: number
  soil_moisture: number
  ec_level: number
  timestamp: string
}

interface Alert {
  id: number
  alert_type: string
  message: string
  acknowledged: boolean
  triggered_at: string
}

interface Disease {
  id: number
  disease_label: string
  confidence: number
  severity: string
  tree_id: string
  timestamp: string
}

export default function OverviewPage() {
  const [sensors, setSensors] = useState<SensorData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const [sensorRes, alertRes, diseaseRes] = await Promise.all([
        sensorApi.getLatest(),
        alertApi.getAll(),
        diseaseApi.getHistory(5),
      ])
      setSensors(sensorRes.data)
      setAlerts(alertRes.data)
      setDiseases(diseaseRes.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const getSensorStatus = (type: string, value: number) => {
    if (type === 'temperature') {
      if (value > 35) return 'danger'
      if (value > 32) return 'warning'
      return 'normal'
    }
    if (type === 'humidity') {
      if (value < 50) return 'danger'
      if (value < 60) return 'warning'
      return 'normal'
    }
    if (type === 'soil_moisture') {
      if (value < 30) return 'danger'
      if (value < 40) return 'warning'
      return 'normal'
    }
    if (type === 'ec') {
      if (value < 1.0 || value > 2.5) return 'danger'
      if (value < 1.2 || value > 2.2) return 'warning'
      return 'normal'
    }
    return 'normal'
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin" />
          Loading dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-gray-400 text-sm mt-1">
            Oil Palm IoT Monitoring System
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Wifi size={14} className="text-green-400" />
          <span>Live — updated {formatDistanceToNow(lastUpdated)} ago</span>
          <button
            onClick={fetchData}
            className="ml-2 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Sensor Cards */}
      {sensors ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SensorCard
            label="Temperature"
            value={sensors.temperature.toFixed(1)}
            unit="°C"
            icon="🌡️"
            status={getSensorStatus('temperature', sensors.temperature)}
          />
          <SensorCard
            label="Humidity"
            value={sensors.humidity.toFixed(1)}
            unit="%"
            icon="💧"
            status={getSensorStatus('humidity', sensors.humidity)}
          />
          <SensorCard
            label="Soil Moisture"
            value={sensors.soil_moisture.toFixed(1)}
            unit="%"
            icon="🌱"
            status={getSensorStatus('soil_moisture', sensors.soil_moisture)}
          />
          <SensorCard
            label="EC Level"
            value={sensors.ec_level.toFixed(2)}
            unit="mS/cm"
            icon="⚡"
            status={getSensorStatus('ec', sensors.ec_level)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['Temperature', 'Humidity', 'Soil Moisture', 'EC Level'].map(l => (
            <div key={l} className="rounded-xl border border-gray-800 bg-gray-900 p-5 animate-pulse">
              <div className="h-8 bg-gray-800 rounded mb-3 w-8" />
              <div className="h-8 bg-gray-800 rounded mb-2 w-24" />
              <div className="h-4 bg-gray-800 rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Unacknowledged Alerts</div>
          <div className={`text-3xl font-bold ${unacknowledgedAlerts.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {unacknowledgedAlerts.length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Disease Detections</div>
          <div className="text-3xl font-bold text-purple-400">
            {diseases.length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">System Status</div>
          <div className="text-3xl font-bold text-green-400">Online</div>
        </div>
      </div>

      {/* Alerts + Disease side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            Recent Alerts
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm">No alerts yet</p>
            ) : (
              alerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.acknowledged
                      ? 'bg-gray-800/50 opacity-50'
                      : alert.alert_type === 'danger'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                  }`}
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    alert.alert_type === 'danger' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(alert.triggered_at))} ago
                    </p>
                  </div>
                  {alert.acknowledged && (
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Disease Detections */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span>🔬</span>
            Recent Disease Detections
          </h2>
          <div className="space-y-3">
            {diseases.length === 0 ? (
              <p className="text-gray-500 text-sm">No detections yet</p>
            ) : (
              diseases.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    d.severity === 'High' ? 'bg-red-400' :
                    d.severity === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 capitalize">{d.disease_label}</p>
                    <p className="text-xs text-gray-500">
                      Tree {d.tree_id} · {d.confidence}% confidence
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    d.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                    d.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {d.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}