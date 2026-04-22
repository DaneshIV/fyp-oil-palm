'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Camera, Microscope, RefreshCw, CheckCircle, AlertTriangle, Radio } from 'lucide-react'

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
  const [result, setResult]             = useState<DetectionResult | null>(null)
  const [loading, setLoading]           = useState(false)
  const [preview, setPreview]           = useState<string | null>(null)
  const [mode, setMode]                 = useState<'upload' | 'webcam'>('upload')
  const [streaming, setStreaming]       = useState(false)
  const [liveDetection, setLiveDetection] = useState(false)
  const [liveResult, setLiveResult]     = useState<DetectionResult | null>(null)
  const [fps, setFps]                   = useState(0)
  const [frameCount, setFrameCount]     = useState(0)

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fpsIntervalRef  = useRef<NodeJS.Timeout | null>(null)
  const frameCountRef   = useRef(0)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const captureFrame = useCallback((): Blob | null => {
    if (!videoRef.current || !canvasRef.current) return null
    const canvas  = canvasRef.current
    const video   = videoRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    return null // will use toBlob async
  }, [])

  const runDetection = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res  = await fetch(`${API_URL}/disease/detect`, {
        method: 'POST',
        body:   formData,
      })
      return await res.json()
    } catch {
      return null
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    setResult(null)
    const data = await runDetection(file)
    setResult(data)
    setLoading(false)
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
    } catch {
      alert('Cannot access webcam')
    }
  }

  const stopWebcam = () => {
    stopLiveDetection()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStreaming(false)
    setLiveResult(null)
  }

  const captureAndDetect = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas  = canvasRef.current
    const video   = videoRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    canvas.toBlob(async blob => {
      if (!blob) return
      const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' })
      setPreview(URL.createObjectURL(blob))
      setLoading(true)
      setResult(null)
      const data = await runDetection(file)
      setResult(data)
      setLoading(false)
    }, 'image/jpeg', 0.95)
  }

  const startLiveDetection = () => {
    setLiveDetection(true)
    frameCountRef.current = 0

    // Run detection every 1.5 seconds
    liveIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return
      const canvas  = canvasRef.current
      const video   = videoRef.current
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)

      canvas.toBlob(async blob => {
        if (!blob) return
        const file = new File([blob], 'live_frame.jpg', { type: 'image/jpeg' })
        const data = await runDetection(file)
        if (data?.success) {
          setLiveResult(data)
          frameCountRef.current += 1
          setFrameCount(frameCountRef.current)
        }
      }, 'image/jpeg', 0.8)
    }, 1500)

    // FPS counter
    fpsIntervalRef.current = setInterval(() => {
      setFps(Math.round(frameCountRef.current / 1))
      frameCountRef.current = 0
    }, 1000)
  }

  const stopLiveDetection = () => {
    setLiveDetection(false)
    setLiveResult(null)
    setFps(0)
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
    if (fpsIntervalRef.current)  clearInterval(fpsIntervalRef.current)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  const reset = () => {
    setResult(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const activeResult = liveDetection ? liveResult : result

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Microscope size={24} className="text-purple-400" />
            Disease Detection
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload image or use webcam — supports live real-time detection
          </p>
        </div>
        {!liveDetection && result && (
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

              {/* Live detection badge */}
              {liveDetection && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <Radio size={14} className="text-red-400 animate-pulse" />
                  <span className="text-red-400 text-xs font-semibold">LIVE DETECTION</span>
                  <span className="text-gray-500 text-xs ml-auto">{frameCount} frames processed</span>
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

                {/* Live result overlay on video */}
                {liveDetection && liveResult?.success && (
                  <div className="absolute top-3 left-3 right-3">
                    <div className={`rounded-lg px-3 py-2 backdrop-blur-sm bg-black/60 border ${
                      liveResult.best_detection.severity === 'High'   ? 'border-red-500/50' :
                      liveResult.best_detection.severity === 'Medium' ? 'border-yellow-500/50' :
                      'border-green-500/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold capitalize ${CLASS_COLORS[liveResult.best_detection.class_name] || 'text-white'}`}>
                          {liveResult.best_detection.class_name}
                        </span>
                        <span className="text-white text-sm font-bold">
                          {liveResult.best_detection.confidence}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${liveResult.best_detection.confidence}%`,
                            background: liveResult.best_detection.confidence >= 80 ? '#f87171' :
                                        liveResult.best_detection.confidence >= 60 ? '#facc15' : '#4ade80'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!streaming && (
                  <div className="h-48 flex items-center justify-center">
                    <Camera size={40} className="text-gray-600" />
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {/* Webcam controls */}
              {!streaming ? (
                <button
                  onClick={startWebcam}
                  className="w-full py-2 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-sm hover:bg-teal-500/30 transition-colors"
                >
                  Start Webcam
                </button>
              ) : (
                <div className="space-y-2">
                  {/* Live Detection button */}
                  {!liveDetection ? (
                    <button
                      onClick={startLiveDetection}
                      className="w-full py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Radio size={16} />
                      Start Live Detection
                    </button>
                  ) : (
                    <button
                      onClick={stopLiveDetection}
                      className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Radio size={16} className="animate-pulse" />
                      Stop Live Detection
                    </button>
                  )}

                  {/* Manual capture button */}
                  {!liveDetection && (
                    <button
                      onClick={captureAndDetect}
                      className="w-full py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                    >
                      📸 Capture + Detect (Single)
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
          )}

          {/* Preview (upload mode) */}
          {mode === 'upload' && preview && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <p className="text-xs text-gray-500 px-3 py-2 border-b border-gray-800">Preview</p>
              <img src={preview} alt="Preview" className="w-full object-cover max-h-64" />
            </div>
          )}
        </div>

        {/* Right — Results */}
        <div>
          {/* Loading */}
          {loading && !liveDetection && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={32} className="text-purple-400 animate-spin" />
              <p className="text-gray-400">Running AI detection...</p>
              <p className="text-gray-600 text-xs">YOLOv8n v3 model processing</p>
            </div>
          )}

          {/* No result yet */}
          {!loading && !activeResult && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 h-full min-h-48">
              <Microscope size={40} className="text-gray-700" />
              <p className="text-gray-500 text-sm text-center">
                {mode === 'webcam'
                  ? 'Start webcam and click Live Detection or Capture'
                  : 'Upload an image to detect disease'}
              </p>
            </div>
          )}

          {/* Results */}
          {activeResult && (
            <div className="space-y-4">
              {activeResult.success ? (
                <>
                  {/* Live indicator */}
                  {liveDetection && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <Radio size={12} className="animate-pulse" />
                      <span>Live — updating every 1.5 seconds</span>
                    </div>
                  )}

                  {/* Best Detection */}
                  <div className={`rounded-xl border p-5 ${
                    activeResult.best_detection.severity === 'High'   ? 'border-red-500/30 bg-red-500/5' :
                    activeResult.best_detection.severity === 'Medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-green-500/30 bg-green-500/5'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">Detection Result</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_STYLES[activeResult.best_detection.severity]}`}>
                        {activeResult.best_detection.severity} Severity
                      </span>
                    </div>

                    <div className={`text-2xl font-bold capitalize mb-2 ${CLASS_COLORS[activeResult.best_detection.class_name] || 'text-white'}`}>
                      {activeResult.best_detection.class_name.replace('_', ' ')}
                    </div>

                    {/* Confidence bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Confidence</span>
                        <span className="text-white font-bold">{activeResult.best_detection.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${activeResult.best_detection.confidence}%`,
                            background: activeResult.best_detection.confidence >= 80 ? '#f87171' :
                                        activeResult.best_detection.confidence >= 60 ? '#facc15' : '#4ade80'
                          }}
                        />
                      </div>
                    </div>

                    {!liveDetection && (
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <CheckCircle size={12} />
                        <span>Result saved to database</span>
                      </div>
                    )}

                    {liveDetection && (
                      <div className="flex items-center gap-2 text-xs text-red-400">
                        <Radio size={12} className="animate-pulse" />
                        <span>Live mode — results not saved to database</span>
                      </div>
                    )}
                  </div>

                  {/* All detections */}
                  {activeResult.all_detections.length > 1 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-gray-400 mb-3">
                        All Detections ({activeResult.total_detections} objects found)
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {activeResult.all_detections.map((d, i) => (
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
                  <p className="text-gray-400 text-sm">{activeResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}