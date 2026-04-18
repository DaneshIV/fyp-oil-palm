'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, Microscope, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'

interface Detection {
  class_name: string
  confidence: number
  severity: string
}

interface DetectionResult {
  success: boolean
  image_path: string
  best_detection: Detection
  all_detections: Detection[]
  total_detections: number
  error?: string
}

const SEVERITY_STYLES: Record<string, string> = {
  High:   'bg-red-500/20 text-red-400 border border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Low:    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  None:   'bg-green-500/20 text-green-400 border border-green-500/30',
}

const CLASS_COLORS: Record<string, string> = {
  healthy:   'text-green-400',
  ganoderma: 'text-red-400',
  unhealthy: 'text-yellow-400',
  immature:  'text-blue-400',
}

export default function DetectPage() {
  const [result, setResult]       = useState<DetectionResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [preview, setPreview]     = useState<string | null>(null)
  const [mode, setMode]           = useState<'upload' | 'webcam'>('upload')
  const [streaming, setStreaming] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const runDetection = async (file: File) => {
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res  = await fetch(`${API_URL}/disease/detect`, {
        method: 'POST',
        body:   formData,
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ success: false, error: 'Failed to connect to server', image_path: '', best_detection: { class_name: 'unknown', confidence: 0, severity: 'None' }, all_detections: [], total_detections: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    runDetection(file)
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStreaming(true)
    } catch (err) {
      alert('Cannot access webcam — make sure it is connected and allowed')
    }
  }

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStreaming(false)
  }

  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas  = canvasRef.current
    const video   = videoRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' })
      setPreview(URL.createObjectURL(blob))
      runDetection(file)
    }, 'image/jpeg', 0.95)
  }

  const reset = () => {
    setResult(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Microscope size={24} className="text-purple-400" />
            Disease Detection Test
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload an image or use webcam to test disease detection
          </p>
        </div>
        {result && (
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
            <RefreshCw size={16} />
            Reset
          </button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => { setMode('upload'); stopWebcam(); reset() }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            mode === 'upload'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Upload size={16} />
          Upload Image
        </button>
        <button
          onClick={() => { setMode('webcam'); reset() }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            mode === 'webcam'
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Camera size={16} />
          Webcam
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Input */}
        <div className="space-y-4">

          {/* Upload Mode */}
          {mode === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 hover:border-purple-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <Upload size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">Click to upload image</p>
              <p className="text-gray-600 text-sm">PNG, JPG, JPEG supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Webcam Mode */}
          {mode === 'webcam' && (
            <div className="space-y-3">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full rounded-xl"
                  style={{ display: streaming ? 'block' : 'none' }}
                />
                {!streaming && (
                  <div className="h-48 flex items-center justify-center">
                    <Camera size={40} className="text-gray-600" />
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3">
                {!streaming ? (
                  <button
                    onClick={startWebcam}
                    className="flex-1 py-2 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-sm hover:bg-teal-500/30 transition-colors"
                  >
                    Start Webcam
                  </button>
                ) : (
                  <>
                    <button
                      onClick={captureFromWebcam}
                      className="flex-1 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                    >
                      📸 Capture + Detect
                    </button>
                    <button
                      onClick={stopWebcam}
                      className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <p className="text-xs text-gray-500 px-3 py-2 border-b border-gray-800">Preview</p>
              <img src={preview} alt="Preview" className="w-full object-cover max-h-64" />
            </div>
          )}

        </div>

        {/* Right — Results */}
        <div>
          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={32} className="text-purple-400 animate-spin" />
              <p className="text-gray-400">Running AI detection...</p>
              <p className="text-gray-600 text-xs">YOLOv8n model processing image</p>
            </div>
          )}

          {!loading && !result && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 h-full">
              <Microscope size={40} className="text-gray-700" />
              <p className="text-gray-500">Upload or capture an image to detect disease</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">

              {result.success ? (
                <>
                  {/* Best Detection */}
                  <div className={`rounded-xl border p-5 ${
                    result.best_detection.severity === 'High'   ? 'border-red-500/30 bg-red-500/5' :
                    result.best_detection.severity === 'Medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-green-500/30 bg-green-500/5'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">Detection Result</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_STYLES[result.best_detection.severity]}`}>
                        {result.best_detection.severity} Severity
                      </span>
                    </div>

                    <div className={`text-2xl font-bold capitalize mb-2 ${CLASS_COLORS[result.best_detection.class_name] || 'text-white'}`}>
                      {result.best_detection.class_name.replace('_', ' ')}
                    </div>

                    {/* Confidence bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Confidence</span>
                        <span className="text-white font-bold">{result.best_detection.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${result.best_detection.confidence}%`,
                            background: result.best_detection.confidence >= 80 ? '#f87171' :
                                        result.best_detection.confidence >= 60 ? '#facc15' : '#4ade80'
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle size={12} />
                      <span>Result saved to database</span>
                    </div>
                  </div>

                  {/* All Detections */}
                  {result.all_detections.length > 1 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-gray-400 mb-3">
                        All Detections ({result.total_detections} trees found)
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.all_detections.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className={`capitalize ${CLASS_COLORS[d.class_name] || 'text-white'}`}>
                              {d.class_name}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-800 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-purple-400"
                                  style={{ width: `${d.confidence}%` }}
                                />
                              </div>
                              <span className="text-gray-400 w-10 text-right">{d.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle size={16} />
                    <span className="font-semibold">Detection Failed</span>
                  </div>
                  <p className="text-gray-400 text-sm">{result.error}</p>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  )
}