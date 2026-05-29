"use client";

import React, { useState } from "react";
import {
  Camera,
  Download,
  X,
  Shield,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  Grid3x3,
  CircleDot,
  Filter,
  ChevronDown,
} from "lucide-react";

interface Snapshot {
  id: string;
  timestamp: string;
  date: string;
  threatType: "PERSON" | "ANIMAL" | "UNKNOWN" | "VEHICLE";
  confidence: number;
  zone: string;
  camera: string;
  severity: "critical" | "warning" | "info";
  bboxCount: number;
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace SNAPSHOTS with live snapshot archive from FastAPI backend.
// Future: useEffect → fetch('/api/security/snapshots?limit=12') for initial load,
//         WebSocket subscription to ws://<host>/ws/security/snapshots for new captures.
// ============================================================================
const SNAPSHOTS: Snapshot[] = [
  { id: "SNAP_0094", timestamp: "15:04:33", date: "2025-05-30", threatType: "PERSON", confidence: 94.2, zone: "ZONE_A", camera: "CAM_01_GATE", severity: "critical", bboxCount: 2 },
  { id: "SNAP_0093", timestamp: "15:03:18", date: "2025-05-30", threatType: "ANIMAL", confidence: 87.1, zone: "ZONE_B", camera: "CAM_02_FIELD", severity: "warning", bboxCount: 1 },
  { id: "SNAP_0092", timestamp: "14:58:22", date: "2025-05-30", threatType: "UNKNOWN", confidence: 62.4, zone: "ZONE_A", camera: "CAM_01_GATE", severity: "warning", bboxCount: 3 },
  { id: "SNAP_0091", timestamp: "14:55:44", date: "2025-05-30", threatType: "PERSON", confidence: 88.9, zone: "ZONE_C", camera: "CAM_04_ROAD", severity: "critical", bboxCount: 1 },
  { id: "SNAP_0090", timestamp: "14:42:18", date: "2025-05-30", threatType: "ANIMAL", confidence: 91.3, zone: "ZONE_C", camera: "CAM_04_ROAD", severity: "warning", bboxCount: 2 },
  { id: "SNAP_0089", timestamp: "14:38:11", date: "2025-05-30", threatType: "VEHICLE", confidence: 96.7, zone: "ZONE_A", camera: "CAM_01_GATE", severity: "info", bboxCount: 1 },
  { id: "SNAP_0088", timestamp: "14:22:05", date: "2025-05-30", threatType: "PERSON", confidence: 79.4, zone: "ZONE_D", camera: "CAM_03_STORE", severity: "critical", bboxCount: 2 },
  { id: "SNAP_0087", timestamp: "14:15:33", date: "2025-05-30", threatType: "UNKNOWN", confidence: 55.8, zone: "ZONE_B", camera: "CAM_02_FIELD", severity: "warning", bboxCount: 1 },
  { id: "SNAP_0086", timestamp: "13:58:02", date: "2025-05-30", threatType: "ANIMAL", confidence: 93.1, zone: "ZONE_B", camera: "CAM_02_FIELD", severity: "warning", bboxCount: 3 },
  { id: "SNAP_0085", timestamp: "13:44:19", date: "2025-05-30", threatType: "PERSON", confidence: 97.2, zone: "ZONE_A", camera: "CAM_01_GATE", severity: "critical", bboxCount: 1 },
  { id: "SNAP_0084", timestamp: "13:31:47", date: "2025-05-30", threatType: "VEHICLE", confidence: 89.5, zone: "ZONE_C", camera: "CAM_04_ROAD", severity: "info", bboxCount: 1 },
  { id: "SNAP_0083", timestamp: "13:18:55", date: "2025-05-30", threatType: "ANIMAL", confidence: 84.6, zone: "ZONE_D", camera: "CAM_03_STORE", severity: "warning", bboxCount: 2 },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace HEATMAP_PATTERNS with real AI attention heatmap data from FastAPI.
// Future: useEffect → fetch('/api/security/snapshots/:id/heatmap') per snapshot.
// ============================================================================
const HEATMAP_PATTERNS: { cx: number; cy: number; r: number; opacity: number }[][] = [
  [{ cx: 35, cy: 40, r: 18, opacity: 0.7 }, { cx: 62, cy: 55, r: 12, opacity: 0.5 }],
  [{ cx: 50, cy: 45, r: 22, opacity: 0.6 }],
  [{ cx: 25, cy: 35, r: 14, opacity: 0.5 }, { cx: 55, cy: 60, r: 16, opacity: 0.6 }, { cx: 70, cy: 30, r: 10, opacity: 0.4 }],
  [{ cx: 45, cy: 50, r: 20, opacity: 0.7 }],
  [{ cx: 30, cy: 40, r: 15, opacity: 0.5 }, { cx: 65, cy: 45, r: 18, opacity: 0.65 }],
  [{ cx: 50, cy: 40, r: 16, opacity: 0.55 }],
  [{ cx: 40, cy: 55, r: 20, opacity: 0.7 }, { cx: 60, cy: 35, r: 12, opacity: 0.45 }],
  [{ cx: 55, cy: 50, r: 18, opacity: 0.5 }],
  [{ cx: 30, cy: 35, r: 14, opacity: 0.5 }, { cx: 50, cy: 55, r: 16, opacity: 0.6 }, { cx: 70, cy: 40, r: 12, opacity: 0.45 }],
  [{ cx: 45, cy: 42, r: 22, opacity: 0.7 }],
  [{ cx: 55, cy: 48, r: 14, opacity: 0.5 }],
  [{ cx: 35, cy: 50, r: 16, opacity: 0.55 }, { cx: 60, cy: 38, r: 14, opacity: 0.5 }],
];

const severityColor = (s: Snapshot["severity"]) =>
  s === "critical" ? "text-rose-500" : s === "warning" ? "text-amber-500" : "text-emerald-400";

const severityBg = (s: Snapshot["severity"]) =>
  s === "critical" ? "bg-rose-500/10 border-rose-500/30" : s === "warning" ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-400/10 border-emerald-400/30";

const threatColor = (t: Snapshot["threatType"]) =>
  t === "PERSON" ? "text-rose-500" : t === "ANIMAL" ? "text-amber-500" : t === "VEHICLE" ? "text-sky-400" : "text-zinc-400";

const threatBorderColor = (t: Snapshot["threatType"]) =>
  t === "PERSON" ? "border-rose-500/40" : t === "ANIMAL" ? "border-amber-500/40" : t === "VEHICLE" ? "border-sky-400/40" : "border-zinc-600";

export default function SecuritySnapshots() {
  const [selectedSnap, setSelectedSnap] = useState<Snapshot | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showHeatmap, setShowHeatmap] = useState(true);

  const FILTER_OPTIONS = ["ALL", "PERSON", "ANIMAL", "VEHICLE", "UNKNOWN"];

  const filteredSnaps = filterType === "ALL"
    ? SNAPSHOTS
    : SNAPSHOTS.filter((s) => s.threatType === filterType);

  const stats = {
    total: SNAPSHOTS.length,
    critical: SNAPSHOTS.filter((s) => s.severity === "critical").length,
    persons: SNAPSHOTS.filter((s) => s.threatType === "PERSON").length,
    avgConf: (SNAPSHOTS.reduce((a, s) => a + s.confidence, 0) / SNAPSHOTS.length).toFixed(1),
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Security Capture Gallery
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // NVR_SNAPSHOT_ARCHIVE // AI-TAGGED EVENT CAPTURES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <Grid3x3 className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              TOTAL_CAPTURES:
            </span>
            <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              CRITICAL:
            </span>
            <span className="text-[10px] font-bold text-rose-500 tabular-nums">
              {stats.critical}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <Eye className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              AVG_CONF:
            </span>
            <span className="text-[10px] font-bold text-sky-400 tabular-nums">
              {stats.avgConf}%
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-400">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            FILTER_CLASS:
          </span>
        </div>
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilterType(opt)}
              className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer border-r border-zinc-800 last:border-r-0 ${
                filterType === opt
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
              showHeatmap
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Eye className="w-3 h-3" />
            HEATMAP_{showHeatmap ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Snapshot grid */}
      <div className="grid grid-cols-4 gap-3">
        {filteredSnaps.map((snap, idx) => (
          <div
            key={snap.id}
            className={`bg-zinc-900 rounded-lg border ${threatBorderColor(snap.threatType)} relative overflow-hidden group cursor-pointer transition-all duration-200 hover:border-zinc-600`}
            onClick={() => setSelectedSnap(snap)}
          >
            {/* Machined edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

            {/* Mock camera viewport */}
            <div className="relative aspect-[16/10] bg-zinc-950 overflow-hidden">
              {/* Scanlines */}
              <div className="absolute inset-0" style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
              }} />

              {/* Simulated scene gradient */}
              <div className="absolute inset-0" style={{
                background: `radial-gradient(ellipse at ${30 + idx * 5}% ${40 + idx * 3}%, rgba(16,185,129,0.08) 0%, transparent 60%), radial-gradient(ellipse at ${60 - idx * 3}% ${55 + idx * 2}%, rgba(14,165,233,0.06) 0%, transparent 50%)`,
              }} />

              {/* Bounding box overlays */}
              {Array.from({ length: snap.bboxCount }).map((_, bi) => {
                const bx = 15 + bi * 28 + (idx % 3) * 8;
                const by = 18 + bi * 12 + (idx % 2) * 10;
                const bw = 22 + (bi % 2) * 8;
                const bh = 28 + (bi % 2) * 6;
                return (
                  <div
                    key={bi}
                    className="absolute border-2"
                    style={{
                      left: `${bx}%`,
                      top: `${by}%`,
                      width: `${bw}%`,
                      height: `${bh}%`,
                      borderColor: snap.threatType === "PERSON" ? "rgba(239,68,68,0.7)" : snap.threatType === "ANIMAL" ? "rgba(245,158,11,0.7)" : snap.threatType === "VEHICLE" ? "rgba(56,189,248,0.6)" : "rgba(161,161,170,0.5)",
                    }}
                  >
                    {/* Corner brackets */}
                    <div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2" style={{ borderColor: "inherit" }} />
                    <div className="absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2" style={{ borderColor: "inherit" }} />
                    <div className="absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2" style={{ borderColor: "inherit" }} />
                    <div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2" style={{ borderColor: "inherit" }} />
                    <span className={`absolute -top-4 left-0 text-[8px] font-mono font-bold ${threatColor(snap.threatType)}`}>
                      {snap.threatType} {snap.confidence}%
                    </span>
                  </div>
                );
              })}

              {/* Heatmap overlay */}
              {showHeatmap && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <radialGradient id={`hm-${snap.id}`}>
                      <stop offset="0%" stopColor="rgba(239,68,68,0.6)" />
                      <stop offset="50%" stopColor="rgba(245,158,11,0.3)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                  {(HEATMAP_PATTERNS[idx] || HEATMAP_PATTERNS[0]).map((h, hi) => (
                    <circle key={hi} cx={h.cx} cy={h.cy} r={h.r} fill={`url(#hm-${snap.id})`} opacity={h.opacity} />
                  ))}
                </svg>
              )}

              {/* Camera label */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold">
                  {snap.camera}
                </span>
              </div>

              {/* Timestamp overlay */}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded">
                <span className="text-[8px] font-mono text-zinc-400 tabular-nums">
                  {snap.date} {snap.timestamp}
                </span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-zinc-900/90 border border-zinc-700 rounded-md px-3 py-1.5 flex items-center gap-2">
                  <Search className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                    INSPECT
                  </span>
                </div>
              </div>
            </div>

            {/* Card footer */}
            <div className="px-3 py-2.5 border-t border-zinc-800/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${severityBg(snap.severity)} ${severityColor(snap.severity)}`}>
                    {snap.severity}
                  </span>
                  <span className={`text-[10px] font-bold tracking-widest ${threatColor(snap.threatType)}`}>
                    {snap.threatType}
                  </span>
                </div>
                <span className="text-[9px] text-zinc-600 tabular-nums">{snap.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-zinc-600" />
                    <span className="text-[9px] text-zinc-500 tabular-nums">{snap.timestamp}</span>
                  </div>
                  <span className="text-[9px] text-zinc-600">{snap.zone}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                    <Shield className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">
                      BLOB_AUTH_SECURE
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-2.5 h-2.5 text-zinc-400" />
                    <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold">
                      DOWNLOAD_SOURCE
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      {selectedSnap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedSnap(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden max-w-4xl w-full mx-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-100 font-bold">
                    {selectedSnap.id} // {selectedSnap.camera}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 mt-0.5">
                    {selectedSnap.date} {selectedSnap.timestamp} // {selectedSnap.zone} // CONF {selectedSnap.confidence}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${severityBg(selectedSnap.severity)} ${severityColor(selectedSnap.severity)}`}>
                  {selectedSnap.severity}
                </span>
                <span className={`text-[10px] font-bold tracking-widest ${threatColor(selectedSnap.threatType)}`}>
                  {selectedSnap.threatType}
                </span>
                <button
                  onClick={() => setSelectedSnap(null)}
                  className="ml-4 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Modal viewport */}
            <div className="relative aspect-video bg-zinc-950 overflow-hidden">
              {/* Scanlines */}
              <div className="absolute inset-0" style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 6px)",
              }} />

              {/* Scene simulation */}
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse at 35% 40%, rgba(16,185,129,0.06) 0%, transparent 50%), radial-gradient(ellipse at 65% 55%, rgba(14,165,233,0.05) 0%, transparent 45%), radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)",
              }} />

              {/* Large bounding boxes */}
              {Array.from({ length: selectedSnap.bboxCount }).map((_, bi) => {
                const bx = 20 + bi * 22;
                const by = 15 + bi * 10;
                const bw = 25;
                const bh = 35;
                const color = selectedSnap.threatType === "PERSON" ? "rgba(239,68,68,0.8)" : selectedSnap.threatType === "ANIMAL" ? "rgba(245,158,11,0.8)" : selectedSnap.threatType === "VEHICLE" ? "rgba(56,189,248,0.7)" : "rgba(161,161,170,0.6)";
                return (
                  <div
                    key={bi}
                    className="absolute border-2"
                    style={{ left: `${bx}%`, top: `${by}%`, width: `${bw}%`, height: `${bh}%`, borderColor: color }}
                  >
                    <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color }} />
                    <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2" style={{ borderColor: color }} />
                    <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2" style={{ borderColor: color }} />
                    <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color }} />
                    <span className={`absolute -top-5 left-0 text-[10px] font-mono font-bold ${threatColor(selectedSnap.threatType)} bg-black/60 px-1.5 py-0.5 rounded`}>
                      {selectedSnap.threatType} #{bi + 1} // {selectedSnap.confidence}%
                    </span>
                  </div>
                );
              })}

              {/* AI Heatmap overlay in lightbox */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="hm-lightbox-hot">
                    <stop offset="0%" stopColor="rgba(239,68,68,0.5)" />
                    <stop offset="40%" stopColor="rgba(245,158,11,0.25)" />
                    <stop offset="70%" stopColor="rgba(234,179,8,0.1)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <radialGradient id="hm-lightbox-warm">
                    <stop offset="0%" stopColor="rgba(245,158,11,0.4)" />
                    <stop offset="50%" stopColor="rgba(234,179,8,0.15)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <circle cx="35" cy="38" r="22" fill="url(#hm-lightbox-hot)" opacity="0.7" />
                <circle cx="58" cy="52" r="16" fill="url(#hm-lightbox-hot)" opacity="0.55" />
                <circle cx="72" cy="35" r="12" fill="url(#hm-lightbox-warm)" opacity="0.4" />
                <circle cx="25" cy="60" r="10" fill="url(#hm-lightbox-warm)" opacity="0.35" />
              </svg>

              {/* Overlay legend */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 px-2.5 py-1.5 rounded">
                <Eye className="w-3 h-3 text-rose-400" />
                <span className="text-[9px] uppercase tracking-widest text-rose-400 font-bold">
                  AI HEATMAP OVERLAY
                </span>
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/70 px-2.5 py-1.5 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold tabular-nums">
                  {selectedSnap.camera} // {selectedSnap.date} {selectedSnap.timestamp}
                </span>
              </div>

              {/* Heatmap gradient legend */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 px-2.5 py-1.5 rounded">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500">INTENSITY:</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-3 h-2 rounded-sm bg-yellow-500/40" />
                  <div className="w-3 h-2 rounded-sm bg-amber-500/50" />
                  <div className="w-3 h-2 rounded-sm bg-orange-500/60" />
                  <div className="w-3 h-2 rounded-sm bg-rose-500/70" />
                </div>
                <span className="text-[8px] text-zinc-500">LOW → HIGH</span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-600">BBOX_COUNT:</span>
                  <span className="text-[10px] font-bold text-zinc-300 tabular-nums">{selectedSnap.bboxCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-600">CONF:</span>
                  <span className="text-[10px] font-bold text-emerald-400 tabular-nums">{selectedSnap.confidence}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">BLOB_AUTH_SECURE</span>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-md transition-colors cursor-pointer">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">DOWNLOAD_SOURCE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
