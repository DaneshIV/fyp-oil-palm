'use client'

import { useEffect, useState } from 'react'
import { sensorApi, diseaseApi } from '@/lib/api'
import { RefreshCw, BarChart3, Download, Calendar } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, subDays } from 'date-fns'

interface SensorReading {
  id: number
  temperature: number
  humidity: number
  soil_moisture: number
  ec_level: number
  timestamp: string
}

interface DiseaseDetection {
  id: number
  disease_label: string
  confidence: number
  severity: string
  tree_id: string
  block_id: string
  timestamp: string
}

const COLORS = ['#f87171', '#4ade80', '#facc15', '#c084fc', '#2dd4bf']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs">
        <p className="text-gray-400 mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const [sensorData, setSensorData] = useState<SensorReading[]>([])
  const [diseaseData, setDiseaseData] = useState<DiseaseDetection[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  const fetchData = async () => {
    try {
      const [sensorRes, diseaseRes] = await Promise.all([
        sensorApi.getHistory(days * 24),
        diseaseApi.getHistory(100),
      ])
      setSensorData(sensorRes.data)
      setDiseaseData(diseaseRes.data)
    } catch (err) {
      console.error('Failed to fetch report data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [days])

  // Format sensor data for charts
  const chartData = sensorData.map(r => ({
    ...r,
    time: format(new Date(r.timestamp), 'dd/MM HH:mm'),
    date: format(new Date(r.timestamp), 'dd/MM'),
  }))

  // Disease breakdown for pie chart
  const diseaseCounts = diseaseData.reduce((acc, d) => {
    const label = d.disease_label.replace(/_/g, ' ')
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(diseaseCounts).map(([name, value]) => ({
    name, value
  }))

  // Daily averages for bar chart
  const dailyAverages = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i)
    const dateStr = format(date, 'dd/MM')
    const dayReadings = sensorData.filter(r =>
      format(new Date(r.timestamp), 'dd/MM') === dateStr
    )
    return {
      date: dateStr,
      temperature: dayReadings.length
        ? +(dayReadings.reduce((s, r) => s + r.temperature, 0) / dayReadings.length).toFixed(1)
        : 0,
      humidity: dayReadings.length
        ? +(dayReadings.reduce((s, r) => s + r.humidity, 0) / dayReadings.length).toFixed(1)
        : 0,
      soil_moisture: dayReadings.length
        ? +(dayReadings.reduce((s, r) => s + r.soil_moisture, 0) / dayReadings.length).toFixed(1)
        : 0,
    }
  })

  // Summary stats
  const avgTemp = sensorData.length
    ? (sensorData.reduce((s, r) => s + r.temperature, 0) / sensorData.length).toFixed(1)
    : 'N/A'
  const avgHumidity = sensorData.length
    ? (sensorData.reduce((s, r) => s + r.humidity, 0) / sensorData.length).toFixed(1)
    : 'N/A'
  const avgSoil = sensorData.length
    ? (sensorData.reduce((s, r) => s + r.soil_moisture, 0) / sensorData.length).toFixed(1)
    : 'N/A'
  const avgEC = sensorData.length
    ? (sensorData.reduce((s, r) => s + r.ec_level, 0) / sensorData.length).toFixed(2)
    : 'N/A'

  // CSV Export
  const exportCSV = () => {
    const headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Soil Moisture (%)', 'EC Level (mS/cm)']
    const rows = sensorData.map(r => [
      format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      r.temperature,
      r.humidity,
      r.soil_moisture,
      r.ec_level,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oil_palm_sensor_report_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportDiseaseCSV = () => {
    const headers = ['Timestamp', 'Disease Label', 'Confidence (%)', 'Severity', 'Tree ID', 'Block ID']
    const rows = diseaseData.map(d => [
      format(new Date(d.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      d.disease_label,
      d.confidence,
      d.severity,
      d.tree_id,
      d.block_id,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oil_palm_disease_report_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin" />
          Loading reports...
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
            <BarChart3 size={24} className="text-blue-400" />
            Reports
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Historical data analysis and exports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value={1}>Last 1 day</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Temperature', value: avgTemp, unit: '°C', color: 'text-orange-400' },
          { label: 'Avg Humidity',    value: avgHumidity, unit: '%', color: 'text-teal-400' },
          { label: 'Avg Soil Moisture', value: avgSoil, unit: '%', color: 'text-green-400' },
          { label: 'Avg EC Level',   value: avgEC, unit: 'mS/cm', color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
              <span className="text-sm font-normal text-gray-500 ml-1">{stat.unit}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Over last {days} day{days > 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm hover:bg-blue-500/20 transition-colors"
        >
          <Download size={16} />
          Export Sensor Data CSV
        </button>
        <button
          onClick={exportDiseaseCSV}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-sm hover:bg-purple-500/20 transition-colors"
        >
          <Download size={16} />
          Export Disease Data CSV
        </button>
      </div>

      {/* Temperature + Humidity Line Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-blue-400" />
          Temperature & Humidity Trend
        </h2>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
            No data for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Line type="monotone" dataKey="temperature" stroke="#fb923c" strokeWidth={2} dot={false} name="Temperature (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#2dd4bf" strokeWidth={2} dot={false} name="Humidity (%)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Daily Averages Bar Chart + Disease Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Daily Averages */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Daily Soil Moisture Averages
          </h2>
          {dailyAverages.every(d => d.soil_moisture === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              No data for selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyAverages} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="soil_moisture" fill="#4ade80" radius={[4, 4, 0, 0]} name="Soil Moisture (%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Disease Breakdown Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Disease Detection Breakdown
          </h2>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              No disease data available
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-gray-400 capitalize flex-1">{entry.name}</span>
                    <span className="text-xs font-bold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Soil Moisture + EC Line Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">
          Soil Moisture & EC Level Trend
        </h2>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
            No data for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Line type="monotone" dataKey="soil_moisture" stroke="#4ade80" strokeWidth={2} dot={false} name="Soil Moisture (%)" />
              <Line type="monotone" dataKey="ec_level" stroke="#c084fc" strokeWidth={2} dot={false} name="EC Level (mS/cm)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}