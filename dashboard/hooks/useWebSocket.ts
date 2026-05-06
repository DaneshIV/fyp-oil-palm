import { useState, useEffect, useRef, useCallback } from 'react'

// WebSocket only works on localhost
// Cloudflare free plan does not support WSS tunneling
// Falls back to polling when accessed remotely via tunnel
const WS_URL = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost'
    ? 'ws://localhost:8000'
    : `wss://api.project2030.me`  // ← enable on tunnel too
  : null

interface SensorData {
  temperature:   number
  humidity:      number
  soil_moisture: number
  ec_level:      number
  timestamp:     string
}

export function useSensorWebSocket() {
  const [data,      setData]      = useState<SensorData | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef    = useRef<WebSocket | null>(null)
  const retryRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!WS_URL) return  // Disable WS when accessed via tunnel

    try {
      const ws = new WebSocket(`${WS_URL}/sensors/ws/sensors`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        console.log('Sensor WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'sensor_update') {
            setData(msg)
          }
        } catch (e) {
          console.error('WS parse error:', e)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        retryRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }

    } catch (e) {
      retryRef.current = setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [connect])

  return { data, connected }
}

export function useAlertWebSocket() {
  const [unacknowledged, setUnacknowledged] = useState(0)
  const [connected,      setConnected]      = useState(false)
  const wsRef    = useRef<WebSocket | null>(null)
  const retryRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!WS_URL) return  // Disable WS when accessed via tunnel

    try {
      const ws = new WebSocket(`${WS_URL}/sensors/ws/alerts`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'alert_update') {
            setUnacknowledged(msg.unacknowledged)
          }
        } catch (e) {
          console.error('WS parse error:', e)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        retryRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()

    } catch (e) {
      retryRef.current = setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [connect])

  return { unacknowledged, connected }
}