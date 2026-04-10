import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types
export interface SensorReading {
  id: number
  temperature: number
  humidity: number
  soil_moisture: number
  ec_level: number
  timestamp: string
}

export interface DiseaseDetection {
  id: number
  image_path: string
  disease_label: string
  confidence: number
  severity: string
  tree_id: string
  block_id: string
  timestamp: string
}

export interface Alert {
  id: number
  alert_type: string
  message: string
  sensor_value: number
  threshold: number
  acknowledged: boolean
  triggered_at: string
}

export interface AutomationRule {
  id: number
  rule_name: string
  trigger_type: string
  sensor_field: string
  threshold_value: number
  operator: string
  relay_pin: number
  is_active: boolean
  last_triggered: string
  created_at: string
}