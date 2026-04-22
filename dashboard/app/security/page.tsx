'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Shield, Camera, Radio, AlertTriangle,
  CheckCircle, RefreshCw, Eye, User,
  Bird, HelpCircle, ShieldAlert, ShieldCheck
} from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SecurityEvent {
  id: number
  alert_type: string
  message: string
  sensor_value: number
  acknowledged: boolean
  triggered_at: string
}

interface SecurityCount {
  total: number
  person: number
  animal: number
  unknown: number
  unacknowledged: number
}

interface Detection {
  class_name: string
  confidence: number
}

interface LiveResult {
  success: boolean
  threat_type: string
  threat_level: string
  best_detection: Detection
  all_detections: Detection[]
  total_detections: number
  error?: string
}

const THREAT_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  security_person: {
    bg:    'bg-red-500/10',
    border: 'border-red-500/30',
    text:  'text-red-400',
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  security_animal: {
    bg:    'bg-orange-500/10',
    border: 'border-orange-500/30',
    text:  'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  },
  security_unknown: {
    bg:    'bg-gray-500/10',
    border: 'border-gray-500/30',
    text:  'text-gray-400',
    badge: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  },
}

const THREAT_ICONS: Record<string, React.ReactNode> = {
  security_person:  <User size={14} />,
  security_animal:  <Bird size={14} />,
  security_unknown: <HelpCircle size={14} />,
}

const THREAT_LABELS: Record<string, string> = {
  security_person:  'PERSON',
  security_animal:  'ANIMAL',
  security_unknown: 'UNKNOWN',
}

const LEVEL_STYLES: Record<string, string> = {
  HIGH:   'text-red-400 bg-red-500/10 border-red-500/30',
  MEDIUM: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  LOW:    'text-gray-400 bg-gray-500/10 border-gray-500/30',
  NONE:   'text-green-400 bg-green-500/10 border-green-500/30',
}

export default function SecurityPage() {
  const [events, setEvents]               = useState<SecurityEvent[]>([])
  const [counts, setCounts]               = useState<SecurityCount | null>(null)
  const [loading, setLoading]             = useState(true)
  const [streaming, setStreaming]         = useState(false)
  const [liveMode, setLiveMode]           = useState(false)
  const [liveResult, setLiveResult]       = useState<LiveResult | null>(null)
  const [frameCount, setFrameCount]       = useState(0)
  const [testLoading, setTestLoading]     = useState(false)
  const [cameras, setCameras]             = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')

  const videoRef        = useRef<HTMLVideoElement>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const frameCountRef   = useRef(0)

  // ── Load cameras ─────────────────────────────────────────
  const loadCameras = useCallback(async () => {
    try {
      const devices     = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      setCameras(videoDevices)
      const obs = videoDevices.find(d =>
        d.label.toLowerCase().includes('obs') ||
        d.label.toLowerCase().includes('virtual')
      )
      setSelectedCamera(obs?.deviceId || videoDevices[0]?.deviceId || '')
    } catch (err) {
      console.error('Failed to enumerate cameras:', err)
    }
  }, [])

  useEffect(() => {
    loadCameras()
  }, [loadCameras])

  // ── Fetch security data ──────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, countsRes] = await Promise.all([
        axios.get(`${API_URL}/security/events?limit=20`),
        axios.get(`${API_URL}/security/events/count`),
      ])
      setEvents(eventsRes.data)
      setCounts(countsRes.data)
    } catch (err) {
      console.error('Failed to fetch security data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Webcam ───────────────────────────────────────────────
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera
          ? { deviceId: { exact: selectedCamera } }
          : true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStreaming(true)
    } catch {
      alert('Cannot access webcam — check browser permissions')
    }
  }

  const stopWebcam = () => {
    stopLiveMode()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStreaming(false)
    setLiveResult(null)
  }

  // ── Live Detection ───────────────────────────────────────
  const runDetection = async (file: File): Promise<LiveResult | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_URL}/security/detect`, {
        method: 'POST',
        body:   formData,
      })
      return await res.json()
    } catch {
      return null
    }
  }

  const startLiveMode = () => {
    setLiveMode(true)
    frameCountRef.current = 0

    liveIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return
      const canvas  = canvasRef.current
      const video   = videoRef.current
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)

      canvas.toBlob(async blob => {
        if (!blob) return
        const file   = new File([blob], 'security_frame.jpg', { type: 'image/jpeg' })
        const result = await runDetection(file)
        if (result?.success) {
          setLiveResult(result)
          frameCountRef.current += 1
          setFrameCount(frameCountRef.current)
        }
      }, 'image/jpeg', 0.85)
    }, 1500)
  }

  const stopLiveMode = () => {
    setLiveMode(false)
    setLiveResult(null)
    setFrameCount(0)
    frameCountRef.current = 0
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  // ── Test Alert ───────────────────────────────────────────
  const insertTestAlert = async () => {
    setTestLoading(true)
    try {
      await axios.post(`${API_URL}/security/test-alert`)
      await fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setTestLoading(false)
    }
  }

  // ── Acknowledge ──────────────────────────────────────────
  const acknowledgeEvent = async (id: number) => {
    try {
      await axios.post(`${API_URL}/alerts/${id}/acknowledge`)
      await fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  // ── Helpers ──────────────────────────────────────────────
  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString('en-MY', {
      day:    '2-digit',
      month:  'short',
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const getLiveOverlayStyle = (result: LiveResult) => {
    if (result.threat_type === 'person')  return 'border-red-500/70'
    if (result.threat_type === 'animal')  return 'border-orange-500/70'
    return 'border-green-500/70'
  }

  const getLiveTextStyle = (result: LiveResult) => {
    if (result.threat_type === 'person')  return 'text-red-400'
    if (result.threat_type === 'animal')  return 'text-orange-400'
    return 'text-green-400'
  }

  const getLiveBarColor = (result: LiveResult) => {
    if (result.threat_type === 'person')  return '#f87171'
    if (result.threat_type === 'animal')  return '#fb923c'
    return '#4ade80'
  }

  const getLiveLabel = (result: LiveResult) => {
    if (result.threat_type === 'person')  return '🚨 PERSON DETECTED'
    if (result.threat_type === 'animal')  return `⚠️ ${result.best_detection.class_name.toUpperCase()} DETECTED`
    return '✅ AREA CLEAR'
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield size={24} className="text-blue-400" />
            Security Monitor
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Triple Layer Security — PIR + Camera + YOLOv8n AI Detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={insertTestAlert}
            disabled={testLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            {testLoading
              ? <RefreshCw size={14} className="animate-spin" />
              : <ShieldAlert size={14} />}
            Test Alert
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Events',      value: counts?.total          ?? 0, icon: <Shield size={18} />,        color: 'text-blue-400'   },
          { label: 'Person Detected',   value: counts?.person         ?? 0, icon: <User size={18} />,          color: 'text-red-400'    },
          { label: 'Animal Detected',   value: counts?.animal         ?? 0, icon: <Bird size={18} />,          color: 'text-orange-400' },
          { label: 'Unknown',           value: counts?.unknown        ?? 0, icon: <HelpCircle size={18} />,    color: 'text-gray-400'   },
          {
            label: 'Unacknowledged',
            value: counts?.unacknowledged ?? 0,
            icon:  <AlertTriangle size={18} />,
            color: counts?.unacknowledged ? 'text-yellow-400' : 'text-green-400'
          },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`${stat.color} mb-2`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Triple Layer Indicator */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Shield size={14} className="text-blue-400" />
          Triple Layer Security Architecture
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              layer: 'Layer 1',
              name:  'PIR Sensor',
              desc:  'Hardware Motion Detection',
              icon:  <Radio size={16} />,
              color: 'text-green-400',
              bg:    'bg-green-500/10 border-green-500/30',
            },
            {
              layer: 'Layer 2',
              name:  'Camera',
              desc:  'Snapshot Capture',
              icon:  <Camera size={16} />,
              color: 'text-blue-400',
              bg:    'bg-blue-500/10 border-blue-500/30',
            },
            {
              layer: 'Layer 3',
              name:  'YOLOv8n AI',
              desc:  'Threat Classification',
              icon:  <Eye size={16} />,
              color: 'text-purple-400',
              bg:    'bg-purple-500/10 border-purple-500/30',
            },
          ].map((l, i) => (
            <div key={i} className={`rounded-lg border p-3 ${l.bg}`}>
              <div className={`${l.color} mb-1 flex items-center gap-2`}>
                {l.icon}
                <span className="text-xs font-semibold">{l.layer}</span>
              </div>
              <div className="text-white text-sm font-bold">{l.name}</div>
              <div className="text-gray-400 text-xs mt-0.5">{l.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Live Camera */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Camera size={14} className="text-blue-400" />
            Live Security Camera
          </h3>

          {/* Live badge */}
          {liveMode && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <Radio size={14} className="text-red-400 animate-pulse" />
              <span className="text-red-400 text-xs font-semibold">
                LIVE SECURITY MONITORING ACTIVE
              </span>
              <span className="text-gray-500 text-xs ml-auto">
                {frameCount} frames analysed
              </span>
            </div>
          )}

          {/* Video feed */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full rounded-xl"
              style={{ display: streaming ? 'block' : 'none' }}
              autoPlay
              muted
              playsInline
            />

            {/* Live AI overlay */}
            {liveMode && liveResult?.success && (
              <div className="absolute top-3 left-3 right-3">
                <div className={`rounded-lg px-3 py-2 backdrop-blur-sm bg-black/70 border ${getLiveOverlayStyle(liveResult)}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-bold ${getLiveTextStyle(liveResult)}`}>
                      {getLiveLabel(liveResult)}
                    </span>
                    <span className="text-white text-sm font-bold">
                      {liveResult.best_detection.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width:      `${liveResult.best_detection.confidence}%`,
                        background: getLiveBarColor(liveResult),
                      }}
                    />
                  </div>
                  {liveResult.all_detections.length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {liveResult.all_detections.slice(0, 4).map((d, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-black/40 rounded text-gray-300">
                          {d.class_name} {d.confidence}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Threat level badge bottom right */}
            {liveMode && liveResult?.success && liveResult.threat_level !== 'NONE' && (
              <div className="absolute bottom-3 right-3">
                <span className={`text-xs px-2 py-1 rounded-full border font-bold ${LEVEL_STYLES[liveResult.threat_level]}`}>
                  {liveResult.threat_level} THREAT
                </span>
              </div>
            )}

            {!streaming && (
              <div className="h-52 flex flex-col items-center justify-center gap-3">
                <Camera size={40} className="text-gray-600" />
                <p className="text-gray-500 text-sm">Camera offline</p>
                <p className="text-gray-600 text-xs">Select camera and click Start</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Camera selector */}
          {!streaming && cameras.length > 1 && (
            <select
              value={selectedCamera}
              onChange={e => setSelectedCamera(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Controls */}
          {!streaming ? (
            <button
              onClick={startWebcam}
              className="w-full py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={16} />
              Start Security Camera
            </button>
          ) : (
            <div className="space-y-2">
              {!liveMode ? (
                <button
                  onClick={startLiveMode}
                  className="w-full py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Radio size={16} />
                  🛡️ Arm — Start Live Detection
                </button>
              ) : (
                <button
                  onClick={stopLiveMode}
                  className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Radio size={16} className="animate-pulse" />
                  Disarm — Stop Live Detection
                </button>
              )}
              <button
                onClick={stopWebcam}
                className="w-full py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Stop Camera
              </button>
            </div>
          )}
        </div>

        {/* Right — Event Log */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <ShieldAlert size={14} className="text-blue-400" />
            Security Event Log
            {counts?.unacknowledged ? (
              <span className="ml-auto text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                {counts.unacknowledged} new
              </span>
            ) : (
              <span className="ml-auto text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                All clear
              </span>
            )}
          </h3>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
              ))
            ) : events.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <ShieldCheck size={36} className="text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-semibold">No Security Events</p>
                <p className="text-gray-500 text-xs mt-1">System armed and monitoring</p>
                <button
                  onClick={insertTestAlert}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                >
                  Insert test alert
                </button>
              </div>
            ) : (
              events.map(event => {
                const style = THREAT_STYLES[event.alert_type] || THREAT_STYLES.security_unknown
                const icon  = THREAT_ICONS[event.alert_type] || <HelpCircle size={14} />
                const label = THREAT_LABELS[event.alert_type] || 'UNKNOWN'
                return (
                  <div
                    key={event.id}
                    className={`rounded-xl border p-3 transition-opacity ${style.bg} ${style.border} ${
                      event.acknowledged ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                            {icon}
                            {label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {event.sensor_value?.toFixed(1)}% conf
                          </span>
                          {event.acknowledged && (
                            <span className="text-xs text-gray-600">✓ ack</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-2">
                          {event.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(event.triggered_at)}
                        </p>
                      </div>
                      {!event.acknowledged && (
                        <button
                          onClick={() => acknowledgeEvent(event.id)}
                          title="Acknowledge"
                          className="shrink-0 p-1.5 bg-gray-800 hover:bg-green-500/20 rounded-lg transition-colors group"
                        >
                          <CheckCircle size={14} className="text-gray-500 group-hover:text-green-400 transition-colors" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}