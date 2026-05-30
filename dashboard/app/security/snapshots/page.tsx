"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Camera, Download, X, Shield, RefreshCw,
  AlertTriangle, Eye, CheckCircle, Clock,
} from "lucide-react";
import { api } from "@/lib/api";

interface Snapshot {
  filename: string;
  created:  string;
  size:     number;
  url:      string;
}

const API_BASE = typeof window !== "undefined"
  ? (window.location.hostname === "localhost" ? "http://localhost:8000" : "https://api.project2030.me")
  : "http://localhost:8000";

function getToken() {
  if (typeof document === "undefined") return "";
  return document.cookie.match(/auth_token=([^;]+)/)?.[1] || "";
}

// Parse threat type from filename
function getThreat(filename: string) {
  const f = filename.toLowerCase();
  if (f.includes("person"))  return { label: "PERSON",  color: "text-rose-500",   border: "border-rose-500/40",   bg: "bg-rose-500/5",   dot: "bg-rose-500 animate-pulse"  };
  if (f.includes("animal"))  return { label: "ANIMAL",  color: "text-amber-500",  border: "border-amber-500/40",  bg: "bg-amber-500/5",  dot: "bg-amber-500"               };
  if (f.includes("vehicle")) return { label: "VEHICLE", color: "text-sky-400",    border: "border-sky-400/40",    bg: "bg-sky-400/5",    dot: "bg-sky-400"                 };
  return                            { label: "UNKNOWN", color: "text-zinc-400",   border: "border-zinc-700",      bg: "bg-zinc-800/20",  dot: "bg-zinc-600"                };
}

// Parse timestamp from filename like security_20260530_040917
function parseTime(filename: string) {
  const m = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (!m) return { date: "—", time: "—" };
  return {
    date: `${m[3]}-${m[2]}-${m[1]}`,
    time: `${m[4]}:${m[5]}:${m[6]}`,
  };
}

// Individual snapshot card
function SnapCard({ snap, onClick }: { snap: Snapshot; onClick: () => void }) {
  const [imgSrc, setImgSrc]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const threat = getThreat(snap.filename);
  const ts     = parseTime(snap.filename);

  useEffect(() => {
    fetch(`${API_BASE}/security/snapshot/${snap.filename}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => {
      if (!r.ok) throw new Error();
      return r.blob();
    }).then(blob => {
      setImgSrc(URL.createObjectURL(blob));
    }).catch(() => setError(true))
    .finally(() => setLoading(false));
  }, [snap.filename]);

  return (
    <div onClick={onClick}
      className={`bg-zinc-900 rounded-lg border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${threat.border} ${threat.bg} group`}>

      {/* Top accent */}
      {threat.label !== "UNKNOWN" && (
        <div className={`h-0.5 ${threat.label === "PERSON" ? "bg-rose-500" : threat.label === "ANIMAL" ? "bg-amber-500" : "bg-sky-400"} animate-pulse`} />
      )}

      {/* Image */}
      <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
        {loading && <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />}
        {error   && <div className="text-center"><Camera className="w-6 h-6 text-zinc-700 mx-auto" /><p className="text-[8px] text-zinc-700 mt-1">No preview</p></div>}
        {imgSrc  && <img src={imgSrc} alt={snap.filename} className="w-full h-full object-cover" />}

        {/* Threat badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border bg-black/60 backdrop-blur-sm ${threat.color} ${threat.border}`}>
            <span className={`w-1 h-1 rounded-full ${threat.dot}`} />
            {threat.label}
          </span>
        </div>

        {/* Annotated badge */}
        {snap.filename.includes("annotated") && (
          <div className="absolute top-2 right-2">
            <span className="text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-400 border border-emerald-500/30">
              BBOX
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Eye className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-[8px] font-mono text-zinc-600 truncate mb-1">{snap.filename}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-zinc-700" />
            <span className="text-[8px] font-mono text-zinc-700">{ts.date} {ts.time}</span>
          </div>
          <span className="text-[7px] text-zinc-700">{(snap.size / 1024).toFixed(0)}KB</span>
        </div>
      </div>
    </div>
  );
}

// Lightbox
function Lightbox({ snap, onClose }: { snap: Snapshot; onClose: () => void }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const threat = getThreat(snap.filename);
  const ts     = parseTime(snap.filename);

  useEffect(() => {
    fetch(`${API_BASE}/security/snapshot/${snap.filename}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.blob()).then(blob => {
      setImgSrc(URL.createObjectURL(blob));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [snap.filename]);

  const handleDownload = () => {
    if (!imgSrc) return;
    const a = document.createElement("a");
    a.href = imgSrc; a.download = snap.filename; a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 font-mono" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
        {threat.label !== "UNKNOWN" && (
          <div className={`h-0.5 ${threat.label === "PERSON" ? "bg-rose-500" : "bg-amber-500"} animate-pulse`} />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-md ${threat.label === "PERSON" ? "bg-rose-500/10" : threat.label === "ANIMAL" ? "bg-amber-500/10" : "bg-zinc-800"}`}>
              <Camera className={`w-4 h-4 ${threat.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${threat.color} ${threat.border} ${threat.bg}`}>
                  {threat.label}
                </span>
                {snap.filename.includes("annotated") && (
                  <span className="text-[8px] uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-400/5 px-2 py-0.5 rounded">BBOX ANNOTATED</span>
                )}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">{ts.date} {ts.time} // {(snap.size / 1024).toFixed(0)}KB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <Download className="w-3 h-3" /> SAVE
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded cursor-pointer">
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="bg-zinc-950 flex items-center justify-center" style={{ minHeight: 400 }}>
          {loading ? (
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          ) : imgSrc ? (
            <img src={imgSrc} alt={snap.filename} className="max-w-full max-h-[60vh] object-contain" />
          ) : (
            <p className="text-[10px] text-zinc-600">Failed to load</p>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-950/50">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">
            {snap.filename.includes("annotated")
              ? "YOLOv8n COCO bounding boxes applied // saved by Triple Layer Security System"
              : "Raw capture // no annotation applied"
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SecuritySnapshots() {
  const [allSnaps, setAllSnaps]   = useState<Snapshot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Snapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState("ALL");
  const [showAnnotated, setShowAnnotated] = useState(true);

  const fetchSnaps = useCallback(async () => {
    try {
      const res = await api.get("/security/snapshots");
      setAllSnaps(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchSnaps(); }, [fetchSnaps]);

  // Filter logic
  const filtered = allSnaps.filter(s => {
    // Optionally show only annotated
    if (showAnnotated && !s.filename.includes("annotated")) return false;
    // Threat filter
    if (filter === "ALL")     return true;
    if (filter === "PERSON")  return s.filename.toLowerCase().includes("person");
    if (filter === "ANIMAL")  return s.filename.toLowerCase().includes("animal");
    if (filter === "UNKNOWN") return !s.filename.toLowerCase().includes("person") && !s.filename.toLowerCase().includes("animal");
    return true;
  });

  // Stats
  const annotatedSnaps = allSnaps.filter(s => s.filename.includes("annotated"));
  const personCount    = allSnaps.filter(s => s.filename.toLowerCase().includes("person")).length;
  const animalCount    = allSnaps.filter(s => s.filename.toLowerCase().includes("animal")).length;
  const unknownCount   = allSnaps.filter(s => !s.filename.toLowerCase().includes("person") && !s.filename.toLowerCase().includes("animal")).length;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Security Snapshots</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              {allSnaps.length} CAPTURES // {annotatedSnaps.length} ANNOTATED // YOLOv8n COCO BBOXES
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Annotated toggle */}
          <button onClick={() => setShowAnnotated(!showAnnotated)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[9px] uppercase tracking-widest cursor-pointer transition-all ${showAnnotated ? "bg-emerald-400/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
            <CheckCircle className="w-3 h-3" /> BBOX ONLY
          </button>
          {/* Filter */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
            {[
              { label: "ALL",     val: "ALL"     },
              { label: "PERSON",  val: "PERSON"  },
              { label: "ANIMAL",  val: "ANIMAL"  },
              { label: "UNKNOWN", val: "UNKNOWN" },
            ].map(f => (
              <button key={f.val} onClick={() => setFilter(f.val)}
                className={`px-2 py-1 rounded text-[8px] uppercase tracking-widest font-bold cursor-pointer transition-all ${filter === f.val ? "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30" : "text-zinc-600 hover:text-zinc-400"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setRefreshing(true); fetchSnaps(); }} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "TOTAL",      value: allSnaps.length,      color: "text-zinc-400"    },
          { label: "ANNOTATED",  value: annotatedSnaps.length,color: "text-emerald-400" },
          { label: "PERSON",     value: personCount,           color: "text-rose-500"   },
          { label: "ANIMAL",     value: animalCount,           color: "text-amber-500"  },
          { label: "UNKNOWN",    value: unknownCount,          color: "text-zinc-500"   },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 rounded-lg border border-zinc-800 px-4 py-3">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1">{s.label}</p>
            <p className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <Shield className="w-12 h-12 text-zinc-700 mx-auto" />
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">No snapshots found</p>
            <p className="text-[9px] text-zinc-700">
              {showAnnotated ? "No annotated snapshots — try disabling BBOX ONLY filter" : "Arm security system to start capturing"}
            </p>
            {showAnnotated && (
              <button onClick={() => setShowAnnotated(false)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 cursor-pointer">
                SHOW ALL FILES
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map(snap => (
            <SnapCard key={snap.filename} snap={snap} onClick={() => setSelected(snap)} />
          ))}
        </div>
      )}

      {selected && <Lightbox snap={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}