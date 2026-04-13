'use client'

import { useEffect, useState } from 'react'
import { sensorApi } from '@/lib/api'
import { RefreshCw, Thermometer, Droplets, Sprout, Zap } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'

interface SensorReading {
  id: number
  temperature: number
  humidity: number
  soil_moisture: number
  ec_level: number
  timestamp: string
}

const SENSORS = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    color: '#fb923c',
    icon: Thermometer,
    min: 20,
    max: 45,
    safeMin: 22,
    safeMax: 35,
    dangerAbove: 35,
    warningAbove: 32,
  },
  {
    key: 'humidity',
    label: 'Humidity',
    unit: '%',
    color: '#2dd4bf',
    icon: Droplets,
    min: 0,
    max: 100,
    safeMin: 60,
    safeMax: 85,
    dangerBelow: 50,
    warningBelow: 60,
  },
  {
    key: 'soil_moisture',
    label: 'Soil Moisture',
    unit: '%',
    color: '#4ade80',
    icon: Sprout,
    min: 0,
    max: 100,
    safeMin: 40,
    safeMax: 70,
    dangerBelow: 30,
    warningBelow: 40,
  },
  {
    key: 'ec_level',
    label: 'EC Level',
    unit: 'mS/cm',
    color: '#c084fc',
    icon: Zap,
    min: 0,
    max: 3,
    safeMin: 1.2,
    safeMax: 2.2,
    dangerBelow: 1.0,
    warningBelow: 1.2,
  },
]

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="font-bold text-white">
          {payload[0].value.toFixed(2)} {unit}
        </p>
      </div>
    )
  }
  return null
}

export default function SensorsPage() {
  const [history, setHistory] = useState<SensorReading[]>([])
  const [latest, setLatest] = useState<SensorReading | null>(null)
  const [hours, setHours] = useState(24)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const [histRes, latestRes] = await Promise.all([
        sensorApi.getHistory(hours),
        sensorApi.getLatest(),
      ])
      setHistory(histRes.data)
      setLatest(latestRes.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch sensor data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [hours])

  const chartData = history.map(r => ({
    ...r,
    time: format(new Date(r.timestamp), 'HH:mm'),
  }))

  const getStatus = (sensor: typeof SENSORS[0], value: number) => {
    if ('dangerAbove' in sensor && value > (sensor.dangerAbove ?? 0)) return 'danger'
    if ('warningAbove' in sensor && value > (sensor.warningAbove ?? 0)) return 'warning'
    if ('dangerBelow' in sensor && value < (sensor.dangerBelow ?? 0)) return 'danger'
    if ('warningBelow' in sensor && value < (sensor.warningBelow ?? 0)) return 'warning'
    return 'normal'
  }

  const statusBg = {
    normal: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
  }

  const statusText = {
    normal: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sensors</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time monitoring — updates every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <select
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={72}>Last 3 days</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-green-400' : 'text-gray-400'} />
          </button>
        </div>
      </div>

      {/* Latest Values Row */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SENSORS.map(sensor => {
            const value = latest[sensor.key as keyof SensorReading] as number
            const status = getStatus(sensor, value)
            const Icon = sensor.icon
            return (
              <div key={sensor.key} className={`rounded-xl border p-4 ${statusBg[status]}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon size={18} style={{ color: sensor.color }} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    status === 'normal' ? 'bg-green-500/20 text-green-400' :
                    status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${statusText[status]}`}>
                  {value.toFixed(sensor.key === 'ec_level' ? 2 : 1)}
                  <span className="text-sm font-normal text-gray-400 ml-1">{sensor.unit}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{sensor.label}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Safe: {sensor.safeMin}–{sensor.safeMax} {sensor.unit}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SENSORS.map(sensor => (
          <div key={sensor.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <sensor.icon size={16} style={{ color: sensor.color }} />
                <h3 className="text-sm font-semibold text-gray-300">
                  {sensor.label}
                </h3>
              </div>
              <span className="text-xs text-gray-500">{sensor.unit}</span>
            </div>

            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[sensor.min, sensor.max]}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip content={<CustomTooltip unit={sensor.unit} />} />
                  {/* Safe zone reference lines */}
                  <ReferenceLine
                    y={sensor.safeMin}
                    stroke="#22c55e"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                  <ReferenceLine
                    y={sensor.safeMax}
                    stroke="#22c55e"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                  <Line
                    type="monotone"
                    dataKey={sensor.key}
                    stroke={sensor.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: sensor.color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* Safe range indicator */}
            <div className="mt-3 flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500 opacity-40" style={{ borderTop: '1px dashed' }} />
              <span className="text-xs text-gray-600">
                Safe range: {sensor.safeMin}–{sensor.safeMax} {sensor.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Last updated */}
      <div className="text-xs text-gray-600 text-center">
        Last updated: {format(lastUpdated, 'HH:mm:ss')} · Auto-refreshes every 5s
      </div>

    </div>
  )
}