'use client'

import { useEffect, useState } from 'react'
import { automationApi } from '@/lib/api'
import {
  RefreshCw,
  Settings,
  Zap,
  Droplets,
  Thermometer,
  FlaskConical,
  Lightbulb,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'

interface AutomationRule {
  id: number
  rule_name: string
  trigger_type: string
  sensor_field: string
  threshold_value: number
  operator: string
  relay_pin: number
  is_active: boolean
  last_triggered: string | null
  created_at: string
}

const RELAY_ICONS: Record<number, { icon: any; label: string; color: string }> = {
  1: { icon: Droplets,    label: 'Irrigation Pump',  color: 'text-teal-400'   },
  2: { icon: Thermometer, label: 'Mist Cooling',     color: 'text-orange-400' },
  3: { icon: FlaskConical,label: 'Fertilizer Pump',  color: 'text-purple-400' },
  4: { icon: Lightbulb,   label: 'Grow Lighting',    color: 'text-yellow-400' },
}

const SENSOR_LABELS: Record<string, string> = {
  soil_moisture: 'Soil Moisture',
  temperature:   'Temperature',
  humidity:      'Humidity',
  ec_level:      'EC Level',
}

const SENSOR_UNITS: Record<string, string> = {
  soil_moisture: '%',
  temperature:   '°C',
  humidity:      '%',
  ec_level:      'mS/cm',
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [relayStates, setRelayStates] = useState<Record<number, boolean>>({})
  const [toggling, setToggling] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRule, setNewRule] = useState({
    rule_name: '',
    trigger_type: 'threshold',
    sensor_field: 'soil_moisture',
    threshold_value: 40,
    operator: '<',
    relay_pin: 1,
    is_active: true,
  })

  const fetchRules = async () => {
    try {
      const res = await automationApi.getRules()
      setRules(res.data)
    } catch (err) {
      console.error('Failed to fetch rules:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleToggleRule = async (id: number) => {
    setToggling(id)
    try {
      await automationApi.toggleRule(id)
      setRules(prev =>
        prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r)
      )
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    } finally {
      setToggling(null)
    }
  }

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    try {
      await automationApi.deleteRule(id)
      setRules(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }

  const handleRelayControl = async (pin: number, state: boolean) => {
    try {
      await automationApi.controlRelay(pin, state)
      setRelayStates(prev => ({ ...prev, [pin]: state }))
    } catch (err) {
      console.error('Failed to control relay:', err)
    }
  }

  const handleAddRule = async () => {
    try {
      await automationApi.getRules() // placeholder — we'll add POST later
      setShowAddForm(false)
      fetchRules()
    } catch (err) {
      console.error('Failed to add rule:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin" />
          Loading automation...
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
            <Settings size={24} className="text-teal-400" />
            Automation
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Control relays and manage automation rules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-sm hover:bg-green-500/20 transition-colors"
          >
            <Plus size={16} />
            Add Rule
          </button>
          <button
            onClick={fetchRules}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Manual Relay Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" />
          Manual Relay Control
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(pin => {
            const relay = RELAY_ICONS[pin]
            const Icon = relay.icon
            const isOn = relayStates[pin] || false
            return (
              <div
                key={pin}
                className={`rounded-xl border p-4 transition-colors ${
                  isOn
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-gray-700 bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon size={20} className={isOn ? 'text-green-400' : relay.color} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isOn
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {isOn ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-1">{relay.label}</div>
                <div className="text-xs text-gray-500 mb-3">Relay Pin {pin}</div>
                <div className="flex gap-2">
                  <button
  onClick={() => handleRelayControl(pin, true)}
  className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
>
  ON
</button>
<button
  onClick={() => handleRelayControl(pin, false)}
  className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
>
  OFF
</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2">
            <Plus size={16} />
            New Automation Rule
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Rule Name</label>
              <input
                type="text"
                value={newRule.rule_name}
                onChange={e => setNewRule({ ...newRule, rule_name: e.target.value })}
                placeholder="e.g. Night Irrigation"
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sensor</label>
              <select
                value={newRule.sensor_field}
                onChange={e => setNewRule({ ...newRule, sensor_field: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              >
                <option value="soil_moisture">Soil Moisture</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="ec_level">EC Level</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Operator</label>
              <select
                value={newRule.operator}
                onChange={e => setNewRule({ ...newRule, operator: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              >
                <option value="<">Less than (&lt;)</option>
                <option value=">">Greater than (&gt;)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Threshold ({SENSOR_UNITS[newRule.sensor_field]})
              </label>
              <input
                type="number"
                value={newRule.threshold_value}
                onChange={e => setNewRule({ ...newRule, threshold_value: Number(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Relay Pin</label>
              <select
                value={newRule.relay_pin}
                onChange={e => setNewRule({ ...newRule, relay_pin: Number(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              >
                <option value={1}>Pin 1 — Irrigation</option>
                <option value={2}>Pin 2 — Mist Cooling</option>
                <option value={3}>Pin 3 — Fertilizer</option>
                <option value={4}>Pin 4 — Lighting</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddRule}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Save Rule
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Automation Rules */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-teal-400" />
          Automation Rules
          <span className="ml-auto text-xs text-gray-500">{rules.length} rules</span>
        </h2>

        <div className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No automation rules yet — add one above
            </p>
          ) : (
            rules.map(rule => {
              const relay = RELAY_ICONS[rule.relay_pin]
              const Icon = relay?.icon || Zap
              return (
                <div
                  key={rule.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    rule.is_active
                      ? 'border-teal-500/20 bg-teal-500/5'
                      : 'border-gray-800 bg-gray-800/50 opacity-60'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    rule.is_active ? 'bg-teal-500/20' : 'bg-gray-700'
                  }`}>
                    <Icon size={18} className={rule.is_active ? 'text-teal-400' : 'text-gray-500'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{rule.rule_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        rule.is_active
                          ? 'bg-teal-500/20 text-teal-400'
                          : 'bg-gray-700 text-gray-500'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Trigger: {SENSOR_LABELS[rule.sensor_field] || rule.sensor_field}{' '}
                      {rule.operator}{' '}
                      {rule.threshold_value}
                      {SENSOR_UNITS[rule.sensor_field]}
                      {' → '}
                      Relay Pin {rule.relay_pin} ({relay?.label || 'Unknown'})
                    </div>
                    {rule.last_triggered && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        Last triggered: {format(new Date(rule.last_triggered), 'dd MMM HH:mm')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      disabled={toggling === rule.id}
                      className="text-gray-400 hover:text-white transition-colors"
                      title={rule.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {toggling === rule.id ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : rule.is_active ? (
                        <ToggleRight size={24} className="text-teal-400" />
                      ) : (
                        <ToggleLeft size={24} className="text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}