"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  TreePine, X, MapPin, Droplets, Bug, Thermometer,
  Layers, Camera, Plus, Trash2, Wifi, WifiOff,
  RefreshCw, Eye, FlaskConical,
} from "lucide-react";
import { api } from "@/lib/api";

type ZoneStatus = "optimal" | "warning" | "infected" | "offline";

interface Block {
  block_id:      string;
  name:          string;
  camera_id:     number;
  rtsp_url:      string;
  location:      string;
  plant_count:   number;
  last_frame:    string | null;
  status:        ZoneStatus;
  detections:    number;
  disease_list:  { disease_label: string; confidence: number; severity: string }[];
  temperature:   number;
  humidity:      number;
  soil_moisture: number;
  ec_level:      number;
}

const STATUS_CFG: Record<ZoneStatus, {
  border: string; bg: string; text: string;
  glow: string; label: string; dot: string; wall: string;
}> = {
  optimal:  { border: "border-emerald-500/50", bg: "bg-emerald-400/5",  text: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.12)]",  label: "OPTIMAL",   dot: "bg-emerald-400", wall: "bg-emerald-900/30" },
  warning:  { border: "border-amber-500/50",   bg: "bg-amber-400/5",    text: "text-amber-500",   glow: "shadow-[0_0_20px_rgba(245,158,11,0.12)]",   label: "WARNING",    dot: "bg-amber-500",   wall: "bg-amber-900/30"   },
  infected: { border: "border-rose-500/50",    bg: "bg-rose-400/5",     text: "text-rose-500",    glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",    label: "INFECTED",   dot: "bg-rose-500",    wall: "bg-rose-900/30"    },
  offline:  { border: "border-zinc-700/50",    bg: "bg-zinc-800/20",    text: "text-zinc-600",    glow: "",                                           label: "OFFLINE",    dot: "bg-zinc-600",    wall: "bg-zinc-900/30"    },
};

// ── Isometric tree grid ───────────────────────────────────────────────────────
function TreeGrid({ count, status }: { count: number; status: ZoneStatus }) {
  const color = status === "optimal" ? "text-emerald-700" : status === "warning" ? "text-amber-700" : status === "infected" ? "text-rose-700" : "text-zinc-700";
  const display = Math.min(count, 24);
  return (
    <div className="flex flex-wrap gap-[3px] justify-center my-2">
      {Array.from({ length: display }).map((_, i) => (
        <TreePine key={i} className={`w-[10px] h-[10px] ${color} ${status === "infected" && i % 4 === 0 ? "text-rose-500 animate-pulse" : ""}`} />
      ))}
      {count > 24 && <span className="text-[8px] text-zinc-600 font-mono">+{count - 24}</span>}
    </div>
  );
}

// ── Live Camera Feed Panel ────────────────────────────────────────────────────
function CameraFeedPanel({ block, onClose }: { block: Block; onClose: () => void }) {
  const [imgSrc, setImgSrc]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [plantCount, setPlantCount] = useState(block.plant_count);
  const [fps, setFps]             = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCount  = useRef(0);
  const lastFpsTime = useRef(Date.now());
  const cfg = STATUS_CFG[block.status];

  const fetchFrame = useCallback(async () => {
    try {
      const res = await fetch(`${window.location.hostname === "localhost" ? "http://localhost:8000" : "https://api.project2030.me"}/cameras/${block.camera_id}/frame`, {
        headers: { Authorization: `Bearer ${document.cookie.match(/auth_token=([^;]+)/)?.[1] || ""}` },
        cache: "no-store",
      });
      if (!res.ok) { setError("Camera offline"); setLoading(false); return; }
      const count = res.headers.get("X-Plant-Count");
      if (count) setPlantCount(parseInt(count));
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setImgSrc(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      setLoading(false);
      setError("");
      frameCount.current++;
      const now = Date.now();
      if (now - lastFpsTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFpsTime.current = now;
      }
    } catch { setError("Connection failed"); setLoading(false); }
  }, [block.camera_id]);

  useEffect(() => {
    fetchFrame();
    intervalRef.current = setInterval(fetchFrame, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchFrame]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
        <div className={`absolute inset-x-0 top-0 h-0.5 ${block.status === "infected" ? "bg-rose-500" : block.status === "warning" ? "bg-amber-500" : "bg-emerald-400"} animate-pulse`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Camera className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-200">{block.block_id} // {block.name}</p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600">{block.location || "No location set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-rose-500" : "bg-emerald-400 animate-pulse"}`} />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">{error ? "OFFLINE" : `LIVE // ${fps}fps`}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${cfg.border} ${cfg.bg}`}>
              <TreePine className={`w-3 h-3 ${cfg.text}`} />
              <span className={`text-[10px] font-mono font-bold ${cfg.text}`}>{plantCount} PLANTS</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded transition-colors cursor-pointer">
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="relative bg-zinc-950 aspect-video flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">Connecting to camera...</p>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3">
              <WifiOff className="w-8 h-8 text-rose-500/50" />
              <p className="text-[10px] uppercase tracking-widest text-rose-500">{error}</p>
              <p className="text-[9px] text-zinc-600 font-mono">{block.rtsp_url}</p>
            </div>
          )}
          {imgSrc && !error && (
            <img src={imgSrc} alt="Camera feed" className="w-full h-full object-contain" />
          )}

          {/* Overlay stats */}
          {!error && !loading && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded border border-zinc-700/50">
                <span className="text-[9px] font-mono text-emerald-400">{block.block_id} // YOLOv8n v4 // LIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* Detection stats */}
        <div className="grid grid-cols-4 divide-x divide-zinc-800 border-t border-zinc-800">
          {[
            { label: "PLANTS", value: plantCount, color: "text-emerald-400" },
            { label: "DETECTIONS", value: block.detections, color: block.detections > 0 ? "text-rose-500" : "text-zinc-600" },
            { label: "STATUS", value: block.status.toUpperCase(), color: cfg.text },
            { label: "LAST_SCAN", value: block.last_frame ? new Date(block.last_frame).toLocaleTimeString("en-GB") : "—", color: "text-zinc-500" },
          ].map(stat => (
            <div key={stat.label} className="px-4 py-3">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">{stat.label}</p>
              <p className={`text-sm font-mono font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Add Camera Modal ──────────────────────────────────────────────────────────
function AddCameraModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [form, setForm] = useState({ name: "", block_id: "", rtsp_url: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleAdd = async () => {
    if (!form.name || !form.block_id || !form.rtsp_url) { setError("All fields required"); return; }
    setLoading(true);
    try {
      await api.post("/cameras/", form);
      onAdd();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to add camera");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-sm text-zinc-300 font-mono placeholder:text-zinc-700 focus:border-emerald-400/50 focus:outline-none transition-all";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-zinc-200">Add_Camera</span>
          </div>
          <button onClick={onClose} className="cursor-pointer p-1 hover:bg-zinc-800 rounded"><X className="w-4 h-4 text-zinc-500" /></button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5 block">CAMERA_NAME</label>
            <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Block-D Main Camera" className={inputCls} />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5 block">BLOCK_ID</label>
            <input value={form.block_id} onChange={e => setForm(p => ({...p, block_id: e.target.value.toUpperCase()}))} placeholder="BLK_D" className={inputCls} />
            <p className="text-[9px] text-zinc-700 mt-1">e.g. BLK_A, BLK_B, BLK_C, BLK_D...</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5 block">RTSP_URL</label>
            <input value={form.rtsp_url} onChange={e => setForm(p => ({...p, rtsp_url: e.target.value}))} placeholder="rtsp://192.168.1.x:554/stream or 0 for webcam" className={inputCls} />
            <p className="text-[9px] text-zinc-700 mt-1">Use "0", "1", "2" for USB webcam index</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5 block">LOCATION (optional)</label>
            <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="North-East corner, Block D field" className={inputCls} />
          </div>

          {error && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded px-3 py-2 text-[10px] uppercase tracking-widest text-rose-500">{error}</div>
          )}

          <button onClick={handleAdd} disabled={loading}
            className="w-full py-3 bg-emerald-400/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20 rounded text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer disabled:opacity-50">
            {loading ? "ADDING..." : "ADD_CAMERA → CREATE_BLOCK"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IsometricMap() {
  const [blocks, setBlocks]           = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await api.get("/cameras/blocks/summary");
      setBlocks(res.data);
    } catch (e) {
      console.error("Block fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
    const i = setInterval(fetchBlocks, 30000);
    return () => clearInterval(i);
  }, [fetchBlocks]);

  const handleRefresh = () => { setRefreshing(true); fetchBlocks(); };

  const handleDeleteCamera = async (cameraId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this camera and block?")) return;
    try {
      await api.delete(`/cameras/${cameraId}`);
      fetchBlocks();
    } catch { /* silent */ }
  };

  // Assign grid positions dynamically
  const GRID_POSITIONS = [
    { col: "1 / 3", row: "1 / 3", w: "280px", h: "280px" },
    { col: "3 / 5", row: "1 / 2", w: "145px", h: "145px" },
    { col: "3 / 5", row: "2 / 3", w: "145px", h: "145px" },
    { col: "1 / 2", row: "3 / 4", w: "145px", h: "145px" },
    { col: "2 / 3", row: "3 / 4", w: "145px", h: "145px" },
    { col: "3 / 4", row: "3 / 4", w: "145px", h: "145px" },
    { col: "4 / 5", row: "3 / 4", w: "145px", h: "145px" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Plantation Spatial Overview</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              {blocks.length}-BLOCK ISOMETRIC GRID // CAMERA-DRIVEN // YOLOV8 LIVE DETECTION
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          {(["optimal", "warning", "infected"] as ZoneStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s].dot} ${s === "infected" ? "animate-pulse" : ""}`} />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">{STATUS_CFG[s].label}</span>
            </div>
          ))}
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            REFRESH
          </button>
          <button onClick={() => setShowAddCamera(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400/10 border border-emerald-500/40 rounded text-[9px] uppercase tracking-widest text-emerald-400 hover:bg-emerald-400/20 transition-colors cursor-pointer">
            <Plus className="w-3 h-3" />
            ADD_CAMERA
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mx-auto" />
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Loading block data...</p>
          </div>
        </div>
      ) : blocks.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <Camera className="w-12 h-12 text-zinc-700 mx-auto" />
            <p className="text-[11px] uppercase tracking-widest text-zinc-500">No cameras configured</p>
            <p className="text-[10px] text-zinc-700">Add a camera to create a block in the map</p>
            <button onClick={() => setShowAddCamera(true)}
              className="mt-2 px-4 py-2 bg-emerald-400/10 border border-emerald-500/40 text-emerald-400 rounded text-[10px] uppercase tracking-widest cursor-pointer hover:bg-emerald-400/20">
              ADD_FIRST_CAMERA
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Isometric grid */}
          <div className="flex justify-center items-center py-12">
            <div className="relative" style={{ perspective: "1200px" }}>
              <div className="grid grid-cols-4 grid-rows-2 gap-3"
                style={{ transform: "rotateX(55deg) rotateZ(-45deg)", transformStyle: "preserve-3d" }}>
                {blocks.map((block, idx) => {
                  const pos = GRID_POSITIONS[idx % GRID_POSITIONS.length];
                  const cfg = STATUS_CFG[block.status];
                  return (
                    <div key={block.block_id}
                      onClick={() => setSelectedBlock(block)}
                      className={`relative cursor-pointer transition-all duration-500 ${cfg.bg} ${cfg.border} ${cfg.glow} border rounded-sm hover:scale-105`}
                      style={{ gridColumn: pos.col, gridRow: pos.row, width: pos.w, height: pos.h, transformStyle: "preserve-3d" }}
                    >
                      {/* Elevated surface */}
                      <div className={`absolute inset-0 rounded-sm border ${cfg.border} ${cfg.bg} backdrop-blur-sm`}
                        style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}>
                        <div className="absolute inset-x-0 top-0 h-px bg-white/5 rounded-t-sm" />

                        {/* Block label + plant count */}
                        <div className="absolute top-3 left-3">
                          <p className={`text-[10px] uppercase tracking-widest font-bold ${cfg.text}`}>{block.block_id}</p>
                          <p className="text-[8px] uppercase tracking-widest text-zinc-600 mt-0.5 flex items-center gap-1">
                            <TreePine className="w-2.5 h-2.5" />
                            {block.plant_count > 0 ? `${block.plant_count} PLANTS` : "SCANNING..."}
                          </p>
                        </div>

                        {/* Status + camera icon */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <Camera className={`w-3 h-3 ${cfg.text} opacity-60`} />
                          <span className={`inline-flex items-center gap-1 text-[8px] uppercase tracking-widest font-bold ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${block.status === "infected" ? "animate-pulse" : ""}`} />
                            {cfg.label.split("_")[0]}
                          </span>
                        </div>

                        {/* Tree cluster — dynamic count from camera */}
                        <div className="absolute inset-0 flex items-center justify-center pt-6">
                          <TreeGrid count={Math.max(block.plant_count, 1)} status={block.status} />
                        </div>

                        {/* Quick stats */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-zinc-600" />
                            <span className={`text-[9px] font-mono ${block.soil_moisture < 40 ? "text-amber-500" : "text-zinc-500"}`}>
                              {block.soil_moisture}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-zinc-600" />
                            <span className="text-[9px] font-mono text-zinc-500">{block.temperature}°C</span>
                          </div>
                          {block.detections > 0 && (
                            <div className="flex items-center gap-1">
                              <Bug className="w-3 h-3 text-rose-500" />
                              <span className="text-[9px] font-mono text-rose-500 font-bold">{block.detections}</span>
                            </div>
                          )}
                        </div>

                        {/* Click hint */}
                        <div className="absolute bottom-3 right-3">
                          <Eye className="w-3 h-3 text-zinc-700" />
                        </div>
                      </div>

                      {/* 3D walls */}
                      <div className={`absolute top-0 rounded-sm ${cfg.wall} border-r ${cfg.border}`}
                        style={{ right: "-1px", width: "20px", height: "100%", transform: "rotateY(90deg)", transformOrigin: "right" }} />
                      <div className={`absolute left-0 rounded-sm ${cfg.wall} border-b ${cfg.border}`}
                        style={{ bottom: "-1px", width: "100%", height: "20px", transform: "rotateX(-90deg)", transformOrigin: "bottom" }} />
                    </div>
                  );
                })}
              </div>

              {/* Grid floor */}
              <div className="absolute inset-0 -z-10" style={{
                transform: "rotateX(55deg) rotateZ(-45deg) translateZ(-5px)",
                backgroundImage: "linear-gradient(rgba(63,63,70,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.15) 1px, transparent 1px)",
                backgroundSize: "30px 30px", width: "600px", height: "400px", marginLeft: "-20px", marginTop: "-20px",
              }} />
            </div>
          </div>

          {/* Camera list */}
          <div className="mt-8 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
              <Camera className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Camera_Registry</span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">{blocks.length} CAMERAS // {blocks.filter(b => b.plant_count > 0).length} ACTIVE</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    {["BLOCK_ID", "NAME", "RTSP_URL", "PLANTS_DETECTED", "STATUS", "LAST_SCAN", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-[9px] uppercase tracking-widest text-zinc-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blocks.map(block => {
                    const cfg = STATUS_CFG[block.status];
                    return (
                      <tr key={block.block_id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-zinc-400 font-bold">{block.block_id}</td>
                        <td className="px-4 py-3 text-[11px] font-mono text-zinc-500">{block.name}</td>
                        <td className="px-4 py-3 text-[10px] font-mono text-zinc-600 max-w-xs truncate">{block.rtsp_url}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-[11px] font-mono">
                            <TreePine className={`w-3 h-3 ${cfg.text}`} />
                            <span className={cfg.text}>{block.plant_count}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${block.status === "infected" ? "animate-pulse" : ""}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] font-mono text-zinc-600">
                          {block.last_frame ? new Date(block.last_frame).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <button onClick={() => setSelectedBlock(block)} className="text-zinc-600 hover:text-emerald-400 transition-colors cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={e => handleDeleteCamera(block.camera_id, e)} className="text-zinc-700 hover:text-rose-500 transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600">
              Click any block to open live camera feed // YOLOv8n v4 auto-counts plants every 2s
            </p>
          </div>
        </>
      )}

      {/* Camera Feed Modal */}
      {selectedBlock && (
        <CameraFeedPanel block={selectedBlock} onClose={() => setSelectedBlock(null)} />
      )}

      {/* Add Camera Modal */}
      {showAddCamera && (
        <AddCameraModal onClose={() => setShowAddCamera(false)} onAdd={fetchBlocks} />
      )}
    </div>
  );
}