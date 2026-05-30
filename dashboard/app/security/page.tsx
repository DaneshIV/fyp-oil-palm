"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield, ShieldAlert, ShieldCheck, Camera, CircleDot,
  Lock, Unlock, Eye, AlertTriangle, Radio, RefreshCw,
  CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface SecurityEvent {
  id: number; alert_type: string; message: string;
  sensor_value: number; acknowledged: boolean; triggered_at: string;
}

const API_BASE = typeof window !== "undefined"
  ? (window.location.hostname === "localhost" ? "http://localhost:8000" : "https://api.project2030.me")
  : "http://localhost:8000";

function getToken() {
  if (typeof document === "undefined") return "";
  return document.cookie.match(/auth_token=([^;]+)/)?.[1] || "";
}

export default function SecurityMonitor() {
  const [armed, setArmed]           = useState(false);
  const [events, setEvents]         = useState<SecurityEvent[]>([]);
  const [counts, setCounts]         = useState({ person: 0, animal: 0, unknown: 0, unack: 0 });
  const [imgSrc, setImgSrc]         = useState<string | null>(null);
  const [camError, setCamError]     = useState("");
  const [camIndex, setCamIndex]     = useState("0");
  const [threatType, setThreatType] = useState("clear");
  const [detCount, setDetCount]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [fps, setFps]               = useState(0);
  const intervalRef  = useRef<NodeJS.Timeout | null>(null);
  const frameCount   = useRef(0);
  const lastFpsTime  = useRef(Date.now());

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/security/events");
      const evts: SecurityEvent[] = res.data;
      setEvents(evts);
      setCounts({
        person:  evts.filter(e => e.alert_type === "security_person").length,
        animal:  evts.filter(e => e.alert_type === "security_animal").length,
        unknown: evts.filter(e => e.alert_type === "security_unknown").length,
        unack:   evts.filter(e => !e.acknowledged).length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Fetch security live frame — uses YOLOv8n COCO model!
  const fetchSecurityFrame = useCallback(async () => {
    if (!armed) return;
    try {
      const res = await fetch(
        `${API_BASE}/security/live-frame?camera_index=${camIndex}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        setCamError(`Camera ${camIndex} offline`);
        return;
      }

      // Read threat info from headers
      const threat = res.headers.get("X-Threat-Type") || "clear";
      const dets   = parseInt(res.headers.get("X-Detection-Count") || "0");
      setThreatType(threat);
      setDetCount(dets);

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setImgSrc(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      setCamError("");

      // FPS counter
      frameCount.current++;
      const now = Date.now();
      if (now - lastFpsTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFpsTime.current = now;
      }

      // Refresh events if threat detected
      if (threat === "person" || threat === "animal") {
        fetchEvents();
      }

    } catch (e) {
      setCamError("Connection failed");
    }
  }, [armed, camIndex, fetchEvents]);

  useEffect(() => {
    fetchEvents();
    const i = setInterval(fetchEvents, 10000);
    return () => clearInterval(i);
  }, [fetchEvents]);

  useEffect(() => {
    if (armed) {
      fetchSecurityFrame();
      intervalRef.current = setInterval(fetchSecurityFrame, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setImgSrc(null);
      setThreatType("clear");
      setDetCount(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [armed, fetchSecurityFrame]);

  const handleAcknowledge = async (id: number) => {
    try { await api.post(`/alerts/${id}/acknowledge`); fetchEvents(); }
    catch (e) { console.error(e); }
  };

  const handleAckAll = async () => {
    try { await api.post("/alerts/acknowledge-all"); fetchEvents(); }
    catch (e) { console.error(e); }
  };

  const getThreatCfg = () => {
    if (threatType === "person")  return { color: "text-rose-500",  border: "border-rose-500",  label: "!! PERSON DETECTED !!", pulse: true  };
    if (threatType === "animal")  return { color: "text-amber-500", border: "border-amber-500", label: "ANIMAL DETECTED",        pulse: true  };
    if (threatType === "clear")   return { color: "text-emerald-400", border: "border-emerald-400", label: "CLEAR",             pulse: false };
    return                               { color: "text-zinc-500",  border: "border-zinc-700",  label: "STANDBY",               pulse: false };
  };

  const threatCfg = getThreatCfg();

  const getEventColor = (type: string) => {
    if (type === "security_person") return { color: "text-rose-500",  border: "border-rose-500/20",  bg: "bg-rose-500/5",  dot: "bg-rose-500"  };
    if (type === "security_animal") return { color: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/5", dot: "bg-amber-500" };
    return                                 { color: "text-zinc-400",  border: "border-zinc-700",     bg: "bg-zinc-800/20", dot: "bg-zinc-600"  };
  };

  const LAYERS = [
    { id: "L1", label: "PIR Motion Sensor", sub: "GPIO 24 // HC-SR501",      icon: <Radio className="w-4 h-4" /> },
    { id: "L2", label: "Camera Capture",    sub: `USB CAM INDEX ${camIndex}`,icon: <Camera className="w-4 h-4" /> },
    { id: "L3", label: "AI Classification", sub: "YOLOv8n COCO // 80-CLASS", icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Security Monitor</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              TRIPLE LAYER // PIR + CAMERA + YOLOv8n COCO // 30s COOLDOWN
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {counts.unack > 0 && (
            <button onClick={handleAckAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded text-[9px] uppercase tracking-widest cursor-pointer hover:bg-amber-500/20">
              <CheckCircle className="w-3 h-3" /> ACK ALL ({counts.unack})
            </button>
          )}
          <div className="flex items-center gap-2">
            <label className="text-[9px] uppercase tracking-widest text-zinc-600">CAM:</label>
            <input value={camIndex} onChange={e => setCamIndex(e.target.value)} disabled={armed}
              className="w-10 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-300 focus:border-emerald-500/50 outline-none text-center disabled:opacity-50" />
          </div>
          <button onClick={() => setArmed(!armed)}
            className={`flex items-center gap-2 px-4 py-2 rounded border font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all ${armed ? "bg-rose-500/10 border-rose-500/40 text-rose-500 hover:bg-rose-500/20" : "bg-emerald-400/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20"}`}>
            {armed ? <><Unlock className="w-3.5 h-3.5" /> DISARM</> : <><Lock className="w-3.5 h-3.5" /> ARM</>}
          </button>
        </div>
      </div>

      {/* Threat alert banner */}
      {armed && threatType !== "clear" && threatType !== "error" && (
        <div className={`mb-4 flex items-center gap-3 px-5 py-3 rounded-lg border ${threatType === "person" ? "bg-rose-500/10 border-rose-500/40" : "bg-amber-500/10 border-amber-500/40"}`}>
          <AlertTriangle className={`w-4 h-4 ${threatCfg.color} animate-pulse`} />
          <span className={`text-[11px] uppercase tracking-widest font-bold ${threatCfg.color}`}>
            {threatCfg.label} — {detCount} DETECTION{detCount !== 1 ? "S" : ""} // YOLOv8n COCO
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left col */}
        <div className="space-y-4">
          {/* Layer status */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Security_Layers</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${armed ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                <span className={`text-[9px] uppercase tracking-widest font-bold ${armed ? "text-emerald-400" : "text-zinc-600"}`}>
                  {armed ? "ARMED" : "DISARMED"}
                </span>
              </div>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {LAYERS.map(layer => (
                <div key={layer.id} className="px-4 py-3 flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${armed ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-800 text-zinc-600"}`}>
                    {layer.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{layer.label}</p>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-700 truncate">{layer.sub}</p>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-bold shrink-0 ${armed ? "text-emerald-400" : "text-zinc-600"}`}>
                    {armed ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Threat_Statistics</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-800">
              {[
                { label: "PERSON",  value: counts.person,  color: "text-rose-500"    },
                { label: "ANIMAL",  value: counts.animal,  color: "text-amber-500"   },
                { label: "UNKNOWN", value: counts.unknown, color: "text-zinc-400"    },
                { label: "UNACK",   value: counts.unack,   color: counts.unack > 0 ? "text-amber-500" : "text-zinc-600" },
              ].map(s => (
                <div key={s.label} className="px-4 py-3">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1">{s.label}</p>
                  <p className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Current threat */}
          {armed && (
            <div className={`bg-zinc-900 rounded-lg border overflow-hidden ${armed ? threatCfg.border + "/30" : "border-zinc-800"}`}>
              <div className="px-4 py-3">
                <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-2">CURRENT_THREAT</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${threatType === "person" ? "bg-rose-500 animate-pulse" : threatType === "animal" ? "bg-amber-500 animate-pulse" : "bg-emerald-400"}`} />
                  <span className={`text-sm font-mono font-bold uppercase ${threatCfg.color}`}>{threatType}</span>
                </div>
                <p className="text-[9px] font-mono text-zinc-600 mt-1">
                  {fps > 0 ? `${fps} fps` : "connecting..."} // YOLOv8n COCO
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center — live feed */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col relative">
          {armed && threatType === "person" && (
            <div className="absolute inset-0 border-2 border-rose-500 rounded-lg pointer-events-none animate-pulse z-10" />
          )}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Live_Feed</span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-1">YOLOv8n COCO</span>
            {armed && (
              <div className="ml-auto flex items-center gap-1.5">
                <CircleDot className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                <span className="text-[9px] uppercase tracking-widest text-rose-500">LIVE</span>
              </div>
            )}
          </div>

          <div className="flex-1 bg-zinc-950 flex items-center justify-center" style={{ minHeight: "300px" }}>
            {!armed ? (
              <div className="text-center space-y-3">
                <Shield className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">System Disarmed</p>
                <p className="text-[9px] text-zinc-700">Click ARM to start monitoring</p>
              </div>
            ) : camError ? (
              <div className="text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-500/50 mx-auto" />
                <p className="text-[10px] uppercase tracking-widest text-rose-500">{camError}</p>
                <p className="text-[9px] text-zinc-600">Camera index: {camIndex}</p>
              </div>
            ) : imgSrc ? (
              <img src={imgSrc} alt="Security feed" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mx-auto" />
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">Connecting...</p>
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
            <span className="text-[9px] font-mono text-zinc-600">
              {armed ? `CAM_${camIndex} // PERSON+ANIMAL DETECTION // 2s` : "STANDBY"}
            </span>
            {armed && (
              <span className={`text-[9px] uppercase tracking-widest font-bold ${threatCfg.color}`}>
                {threatCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Right — event log */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Event_Log</span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">{events.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/30">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">No events</p>
              </div>
            ) : events.slice(0, 20).map(evt => {
              const cfg = getEventColor(evt.alert_type);
              return (
                <div key={evt.id} className={`px-4 py-3 ${evt.acknowledged ? "opacity-40" : ""} ${cfg.bg} border-l-2 ${cfg.border}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                        <span className={`text-[9px] uppercase tracking-widest font-bold ${cfg.color}`}>
                          {evt.alert_type.replace("security_", "").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{evt.message}</p>
                      <p className="text-[8px] text-zinc-700 mt-1">
                        {formatDistanceToNow(new Date(evt.triggered_at))} ago
                      </p>
                    </div>
                    {!evt.acknowledged ? (
                      <button onClick={() => handleAcknowledge(evt.id)}
                        className="shrink-0 text-[8px] uppercase tracking-widest px-2 py-1 border border-zinc-700 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
                        ACK
                      </button>
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}