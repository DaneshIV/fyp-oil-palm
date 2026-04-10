import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// ── Sensor API ──────────────────────────
export const sensorApi = {
  getLatest: () => api.get('/sensors/latest'),
  getHistory: (hours = 24) => api.get(`/sensors/history?hours=${hours}`),
  create: (data: {
    temperature: number
    humidity: number
    soil_moisture: number
    ec_level: number
  }) => api.post('/sensors/', data),
}

// ── Disease API ──────────────────────────
export const diseaseApi = {
  getHistory: (limit = 20) => api.get(`/disease/history?limit=${limit}`),
  getLatest: () => api.get('/disease/latest'),
  create: (data: {
    image_path: string
    disease_label: string
    confidence: number
    severity: string
    tree_id?: string
    block_id?: string
  }) => api.post('/disease/', data),
}

// ── Alerts API ───────────────────────────
export const alertApi = {
  getAll: (unacknowledgedOnly = false) =>
    api.get(`/alerts/?unacknowledged_only=${unacknowledgedOnly}`),
  getCount: () => api.get('/alerts/count'),
  acknowledge: (id: number) => api.post(`/alerts/${id}/acknowledge`),
  acknowledgeAll: () => api.post('/alerts/acknowledge-all'),
  create: (data: {
    alert_type: string
    message: string
    sensor_value?: number
    threshold?: number
  }) => api.post('/alerts/', data),
}

// ── Automation API ───────────────────────
export const automationApi = {
  getRules: () => api.get('/automation/rules'),
  toggleRule: (id: number) => api.patch(`/automation/rules/${id}/toggle`),
  deleteRule: (id: number) => api.delete(`/automation/rules/${id}`),
  controlRelay: (relay_pin: number, state: boolean) =>
    api.post('/automation/relay', { relay_pin, state }),
}

// ── Sync API ─────────────────────────────
export const syncApi = {
  manualSync: () => api.post('/sync'),
}