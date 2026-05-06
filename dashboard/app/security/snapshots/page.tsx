'use client'

import { useState, useEffect, useCallback } from 'react'
import { Camera, RefreshCw, Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { api as axios } from '@/lib/api'

interface Snapshot {
  filename: string
  created:  string
  size:     number
  url:      string
}

export default function SnapshotsPage() {
  const [snapshots,  setSnapshots]  = useState<Snapshot[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<Snapshot | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [imageUrls,  setImageUrls]  = useState<Record<string, string>>({})
  const [mounted,    setMounted]    = useState(false)

  // Fix hydration error
  useEffect(() => { setMounted(true) }, [])

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await axios.get('/security/snapshots')
      setSnapshots(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSnapshots()
  }, [fetchSnapshots])

  // Fetch images with auth token
  useEffect(() => {
    if (snapshots.length === 0) return
    const fetchImages = async () => {
      const urls: Record<string, string> = {}
      for (const snap of snapshots.slice(0, 50)) {
        try {
          const res = await axios.get(snap.url, { responseType: 'blob' })
          urls[snap.filename] = URL.createObjectURL(res.data)
        } catch (e) {
          console.error('Failed to fetch image:', snap.filename)
        }
      }
      setImageUrls(urls)
    }
    fetchImages()
  }, [snapshots])

  const openImage = (snapshot: Snapshot, idx: number) => {
    setSelected(snapshot)
    setCurrentIdx(idx)
  }

  const closeImage = () => setSelected(null)

  const prevImage = () => {
    const newIdx = (currentIdx - 1 + snapshots.length) % snapshots.length
    setCurrentIdx(newIdx)
    setSelected(snapshots[newIdx])
  }

  const nextImage = () => {
    const newIdx = (currentIdx + 1) % snapshots.length
    setCurrentIdx(newIdx)
    setSelected(snapshots[newIdx])
  }

  const handleDownload = async (e: React.MouseEvent, snap: Snapshot) => {
    e.stopPropagation()
    try {
      const res  = await axios.get(snap.url, { responseType: 'blob' })
      const url  = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href     = url
      link.download = snap.filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString('en-MY', {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

  const todayCount = mounted
    ? snapshots.filter(s => new Date(s.created).toDateString() === new Date().toDateString()).length
    : 0

  const totalSize = snapshots.length > 0
    ? formatSize(snapshots.reduce((acc, s) => acc + s.size, 0))
    : '0 KB'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Camera size={24} className="text-blue-400" />
            Security Snapshots
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Captured images from Triple Layer Security System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{snapshots.length} snapshots</span>
          <button
            onClick={fetchSnapshots}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{snapshots.length}</div>
          <div className="text-xs text-gray-400 mt-1">Total Snapshots</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{todayCount}</div>
          <div className="text-xs text-gray-400 mt-1">Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{totalSize}</div>
          <div className="text-xs text-gray-400 mt-1">Total Size</div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-video bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : snapshots.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Camera size={48} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No snapshots yet</p>
          <p className="text-gray-600 text-sm mt-1">
            Snapshots appear when the security system detects threats
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {snapshots.map((snap, idx) => (
            <div
              key={snap.filename}
              onClick={() => openImage(snap, idx)}
              className="group relative aspect-video bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all"
            >
              {imageUrls[snap.filename] ? (
                <img
                  src={imageUrls[snap.filename]}
                  alt={snap.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
                  <Camera size={20} className="text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs truncate">{snap.filename}</p>
                  <p className="text-gray-300 text-xs">{formatTime(snap.created)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeImage}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImage}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>

            {imageUrls[selected.filename] ? (
              <img
                src={imageUrls[selected.filename]}
                alt={selected.filename}
                className="w-full rounded-xl"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-800 rounded-xl animate-pulse" />
            )}

            <div className="flex items-center justify-between mt-3 px-1">
              <div>
                <p className="text-white text-sm font-semibold">{selected.filename}</p>
                <p className="text-gray-400 text-xs">
                  {formatTime(selected.created)} · {formatSize(selected.size)}
                </p>
              </div>
              <button
                onClick={(e) => handleDownload(e, selected)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
              >
                <Download size={12} />
                Download
              </button>
            </div>

            {snapshots.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
                <p className="text-center text-gray-500 text-xs mt-2">
                  {currentIdx + 1} / {snapshots.length}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}