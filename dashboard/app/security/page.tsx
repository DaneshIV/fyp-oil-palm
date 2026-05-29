"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Camera,
  CircleDot,
  Lock,
  Unlock,
  Wifi,
  Fingerprint,
  Eye,
  AlertTriangle,
  ChevronRight,
  Radio,
  Crosshair,
} from "lucide-react";

interface SecurityLayer {
  id: string;
  label: string;
  subsystem: string;
  status: "ACTIVE" | "STANDBY" | "ALERT";
  icon: React.ReactNode;
  checks: { name: string; ok: boolean }[];
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: "Person" | "Animal" | "Unknown" | "System" | "Perimeter";
  severity: "critical" | "warning" | "info";
  message: string;
  zone: string;
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace SECURITY_LAYERS with live security subsystem state from FastAPI.
// Future: useEffect → fetch('/api/security/layers') for initial load,
//         WebSocket subscription to ws://<host>/ws/security for real-time status.
// ============================================================================
const SECURITY_LAYERS: SecurityLayer[] = [
  {
    id: "LAYER_01",
    label: "Perimeter Fence",
    subsystem: "PIR_ARRAY + TRIP_WIRE",
    status: "ACTIVE",
    icon: <Radio className="w-4 h-4" />,
    checks: [
      { name: "PIR_NORTH", ok: true },
      { name: "PIR_SOUTH", ok: true },
      { name: "PIR_EAST", ok: true },
      { name: "PIR_WEST", ok: false },
      { name: "TRIP_MAIN", ok: true },
      { name: "TRIP_AUX", ok: true },
    ],
  },
  {
    id: "LAYER_02",
    label: "Camera Network",
    subsystem: "4× IP_CAM + NVR",
    status: "ALERT",
    icon: <Camera className="w-4 h-4" />,
    checks: [
      { name: "CAM_01_GATE", ok: true },
      { name: "CAM_02_FIELD", ok: true },
      { name: "CAM_03_STORE", ok: false },
      { name: "CAM_04_ROAD", ok: true },
      { name: "NVR_RECORD", ok: true },
      { name: "NVR_STORAGE", ok: true },
    ],
  },
  {
    id: "LAYER_03",
    label: "AI Threat Detection",
    subsystem: "YOLOv8 + TRACKING",
    status: "ACTIVE",
    icon: <Eye className="w-4 h-4" />,
    checks: [
      { name: "MODEL_LOADED", ok: true },
      { name: "INFERENCE_OK", ok: true },
      { name: "TRACK_ENGINE", ok: true },
      { name: "ALERT_PIPE", ok: true },
      { name: "MQTT_LINK", ok: true },
      { name: "LOG_WRITER", ok: true },
    ],
  },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace INITIAL_EVENTS with live security event log from FastAPI backend.
// Future: useEffect → fetch('/api/security/events?limit=10') for initial load,
//         WebSocket subscription to ws://<host>/ws/security/events for new events.
// ============================================================================
const INITIAL_EVENTS: SecurityEvent[] = [
  { id: "EVT_0042", timestamp: "15:04:33", type: "Person", severity: "critical", message: "HUMAN_DETECTED Gate entrance // CONF 94.2%", zone: "ZONE_A" },
  { id: "EVT_0041", timestamp: "15:03:18", type: "Animal", severity: "warning", message: "ANIMAL_DETECTED Field perimeter // CLASS: primate // CONF 87.1%", zone: "ZONE_B" },
  { id: "EVT_0040", timestamp: "15:01:55", type: "System", severity: "info", message: "CAM_03 RECONNECTED after 12s dropout // STREAM_OK", zone: "SYS" },
  { id: "EVT_0039", timestamp: "14:58:22", type: "Unknown", severity: "warning", message: "UNCLASSIFIED_MOTION North fence // SIZE: large // CONF 62.4%", zone: "ZONE_A" },
  { id: "EVT_0038", timestamp: "14:55:44", type: "Perimeter", severity: "info", message: "PIR_WEST sensor sweep completed // NO_INTRUSION", zone: "ZONE_D" },
  { id: "EVT_0037", timestamp: "14:52:11", type: "Animal", severity: "warning", message: "ANIMAL_DETECTED Road approach // CLASS: canine // CONF 91.3%", zone: "ZONE_C" },
  { id: "EVT_0036", timestamp: "14:48:39", type: "System", severity: "info", message: "NVR STORAGE_CHECK 847GB / 2TB // 42.4% USED", zone: "SYS" },
  { id: "EVT_0035", timestamp: "14:45:02", type: "Person", severity: "critical", message: "HUMAN_DETECTED Store vicinity // CONF 88.9% // ALERT_SENT", zone: "ZONE_C" },
  { id: "EVT_0034", timestamp: "14:42:18", type: "Perimeter", severity: "info", message: "TRIP_WIRE_CHECK all segments nominal // RESISTANCE OK", zone: "ALL" },
  { id: "EVT_0033", timestamp: "14:38:55", type: "System", severity: "info", message: "AI MODEL ganoderma_sec_v2.pt WARM_RESTART // INFER_OK", zone: "SYS" },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace ROLLING_EVENTS with live rolling event stream from FastAPI backend.
// Future: WebSocket subscription to ws://<host>/ws/security/events for new events.
// ============================================================================
const ROLLING_EVENTS: SecurityEvent[] = [
  { id: "EVT_0043", timestamp: "15:05:12", type: "Animal", severity: "warning", message: "ANIMAL_DETECTED East fence // CLASS: bovine // CONF 83.7%", zone: "ZONE_B" },
  { id: "EVT_0044", timestamp: "15:06:01", type: "Person", severity: "critical", message: "HUMAN_DETECTED Road approach // CONF 91.8% // TRACKING", zone: "ZONE_C" },
  { id: "EVT_0045", timestamp: "15:06:44", type: "System", severity: "info", message: "PIR_ARRAY sweep cycle #4421 // ALL_CLEAR", zone: "ALL" },
  { id: "EVT_0046", timestamp: "15:07:22", type: "Unknown", severity: "warning", message: "SHADOW_ANOMALY detected CAM_02 // INVESTIGATING", zone: "ZONE_B" },
  { id: "EVT_0047", timestamp: "15:08:05", type: "Perimeter", severity: "info", message: "VIBRATION_SENSOR gate post // AMPLITUDE: LOW // WIND", zone: "ZONE_A" },
  { id: "EVT_0048", timestamp: "15:09:33", type: "Person", severity: "critical", message: "HUMAN_DETECTED Field interior // CONF 96.1% // ALARM_READY", zone: "ZONE_B" },
];

export default function SecurityMonitor() {
  const [armed, setArmed] = useState(true);
  // ============================================================================
  // MOCK DATA — INTEGRATION POINT
  // Replace events initial state with live data from FastAPI backend.
  // Future: useEffect → fetch('/api/security/events') for initial load,
  //         WebSocket subscription to ws://<host>/ws/security/events for streaming.
  // ============================================================================
  const [events, setEvents] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const [trackX, setTrackX] = useState(45);
  const [trackY, setTrackY] = useState(38);
  const evtRef = useRef<HTMLDivElement>(null);
  const rollingRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = rollingRef.current % ROLLING_EVENTS.length;
      const evt = ROLLING_EVENTS[idx];
      const newEvt = {
        ...evt,
        id: `EVT_${1043 + rollingRef.current}`,
        timestamp: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
      setEvents((prev) => [newEvt, ...prev.slice(0, 19)]);
      rollingRef.current++;
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setTrackX((prev) => {
        const next = prev + (Math.random() - 0.5) * 8;
        return Math.max(15, Math.min(85, next));
      });
      setTrackY((prev) => {
        const next = prev + (Math.random() - 0.5) * 6;
        return Math.max(15, Math.min(85, next));
      });
    }, 2000);

    return () => clearInterval(moveInterval);
  }, []);

  const statusColor = (s: SecurityLayer["status"]) =>
    s === "ACTIVE"
      ? "text-emerald-400"
      : s === "ALERT"
        ? "text-amber-500"
        : "text-zinc-500";

  const statusDot = (s: SecurityLayer["status"]) =>
    s === "ACTIVE"
      ? "bg-emerald-400"
      : s === "ALERT"
        ? "bg-amber-500 animate-pulse"
        : "bg-zinc-600";

  const eventColor = (severity: SecurityEvent["severity"]) =>
    severity === "critical"
      ? "text-rose-500"
      : severity === "warning"
        ? "text-amber-500"
        : "text-zinc-500";

  const eventDot = (severity: SecurityEvent["severity"]) =>
    severity === "critical"
      ? "bg-rose-500 animate-pulse"
      : severity === "warning"
        ? "bg-amber-500"
        : "bg-zinc-600";

  const typeIcon = (type: SecurityEvent["type"]) => {
    switch (type) {
      case "Person":
        return "👤";
      case "Animal":
        return "🐾";
      case "Unknown":
        return "❓";
      case "System":
        return "⚙";
      case "Perimeter":
        return "◎";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Security Command Center
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // TRIPLE LAYER DEFENSE MATRIX // 24/7 MONITORING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              4/4 CAMS ONLINE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CircleDot
              className={`w-3 h-3 ${armed ? "text-emerald-400 animate-pulse" : "text-zinc-600"}`}
            />
            <span
              className={`text-[10px] uppercase tracking-widest font-bold ${armed ? "text-emerald-400" : "text-zinc-600"}`}
            >
              {armed ? "ARMED" : "DISARMED"}
            </span>
          </div>
        </div>
      </div>

      {/* Triple Layer Security Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {SECURITY_LAYERS.map((layer) => {
          const okCount = layer.checks.filter((c) => c.ok).length;
          const totalCount = layer.checks.length;
          const allOk = okCount === totalCount;

          return (
            <div
              key={layer.id}
              className={`bg-zinc-900 rounded-lg border relative overflow-hidden ${
                layer.status === "ALERT"
                  ? "border-amber-500/30"
                  : "border-zinc-800"
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

              {layer.status === "ALERT" && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500 animate-pulse" />
              )}

              <div className="px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-md ${
                        layer.status === "ACTIVE"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : layer.status === "ALERT"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {layer.icon}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                        {layer.label}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                        {layer.id} // {layer.subsystem}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold ${statusColor(layer.status)}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot(layer.status)}`} />
                    {layer.status}
                  </span>
                </div>
              </div>

              {/* Check matrix */}
              <div className="grid grid-cols-3 gap-1 px-3 py-3">
                {layer.checks.map((check) => (
                  <div
                    key={check.name}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded border ${
                      check.ok
                        ? "bg-zinc-950 border-zinc-800"
                        : "bg-rose-500/5 border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        check.ok ? "bg-emerald-400" : "bg-rose-500 animate-pulse"
                      }`}
                    />
                    <span
                      className={`text-[8px] uppercase tracking-widest ${
                        check.ok ? "text-zinc-500" : "text-rose-500"
                      }`}
                    >
                      {check.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-zinc-800/50 bg-zinc-950/30 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                  INTEGRITY
                </span>
                <span
                  className={`text-[10px] font-mono font-bold ${allOk ? "text-emerald-400" : "text-amber-500"}`}
                >
                  {okCount}/{totalCount} PASS
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content: Camera + Event Log */}
      <div className="grid grid-cols-3 gap-3">
        {/* Camera Feed — 2 cols */}
        <div className="col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden flex flex-col">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 shrink-0">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Primary_Feed // CAM_01_GATE
            </span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
              1920×1080 // H.264 // 30FPS
            </span>
            <span className="text-[9px] font-mono text-rose-500 font-bold animate-pulse">
              ● LIVE
            </span>
          </div>

          {/* Mock camera viewport */}
          <div
            className="flex-1 relative bg-zinc-950 m-3 rounded border border-zinc-800 overflow-hidden"
            style={{ minHeight: 380 }}
          >
            {/* Night-vision style background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(20,83,45,0.08) 0%, rgba(9,9,11,0.4) 70%), linear-gradient(180deg, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.5) 100%)",
              }}
            />

            {/* Scan lines */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
              }}
            />

            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(63,63,70,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.4) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />

            {/* Digital reticle — center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-40 h-40">
                {/* Horizontal line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-sky-400/20" />
                {/* Vertical line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sky-400/20" />
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full bg-sky-400/40" />
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-sky-400/30" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-sky-400/30" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-sky-400/30" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-sky-400/30" />
              </div>
            </div>

            {/* Tracking bounding box — moves randomly */}
            <div
              className="absolute transition-all duration-[2000ms] ease-in-out"
              style={{
                left: `${trackX - 8}%`,
                top: `${trackY - 10}%`,
                width: "16%",
                height: "20%",
              }}
            >
              <div className="absolute inset-0 border-2 border-rose-500/70 rounded-sm shadow-[0_0_20px_rgba(244,63,94,0.2)]" />
              {/* Corner accents */}
              <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-rose-400 rounded-tl-sm" />
              <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-rose-400 rounded-tr-sm" />
              <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-rose-400 rounded-bl-sm" />
              <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-rose-400 rounded-br-sm" />

              {/* Label */}
              <div className="absolute -top-5 left-0 bg-rose-500/90 px-2 py-0.5 rounded-sm">
                <span className="text-[8px] font-mono font-bold text-white uppercase tracking-wider">
                  PERSON 94.2%
                </span>
              </div>

              {/* Track ID */}
              <div className="absolute -bottom-5 right-0">
                <span className="text-[8px] font-mono text-rose-400/60 uppercase tracking-wider">
                  TRK_ID: 007
                </span>
              </div>
            </div>

            {/* Secondary tracking box (animal) */}
            <div
              className="absolute transition-all duration-[3000ms] ease-in-out"
              style={{
                left: `${85 - trackX * 0.3}%`,
                top: `${70 - trackY * 0.3}%`,
                width: "10%",
                height: "8%",
              }}
            >
              <div className="absolute inset-0 border border-amber-500/50 rounded-sm" />
              <div className="absolute -top-4 left-0 bg-amber-500/80 px-1.5 py-0.5 rounded-sm">
                <span className="text-[7px] font-mono font-bold text-white uppercase tracking-wider">
                  ANIMAL 87%
                </span>
              </div>
            </div>

            {/* HUD overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="text-[9px] font-mono text-rose-500 font-bold bg-zinc-950/80 px-2 py-0.5 rounded animate-pulse">
                ● REC
              </span>
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded">
                CAM_01_GATE
              </span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="text-[9px] font-mono text-sky-400 bg-zinc-950/80 px-2 py-0.5 rounded">
                AI_DETECT: ON
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-zinc-950/80 px-2 py-0.5 rounded">
                IR: ACTIVE
              </span>
            </div>

            <div className="absolute bottom-3 left-3">
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded">
                3.1390°N 101.6869°E // ZONE_A
              </span>
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded tabular-nums">
                {new Date().toLocaleTimeString("en-GB")}
              </span>
            </div>
          </div>

          {/* Camera footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 shrink-0 bg-zinc-950/30">
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                OBJECTS: 2
              </span>
              <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold">
                THREAT_LEVEL: ELEVATED
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600">
              NVR: RECORDING // BITRATE 4.2 Mbps
            </span>
          </div>
        </div>

        {/* Security Event Log — 1 col */}
        <div className="flex flex-col gap-3">
          {/* Event log */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden flex-1">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Security_Event_Log
              </span>
            </div>

            <div
              ref={evtRef}
              className="overflow-y-auto p-2 space-y-1"
              style={{ maxHeight: 400 }}
            >
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`
                    px-3 py-2 rounded border bg-zinc-950 transition-all
                    ${
                      evt.severity === "critical"
                        ? "border-rose-500/20"
                        : evt.severity === "warning"
                          ? "border-amber-500/10"
                          : "border-zinc-800"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${eventDot(evt.severity)}`} />
                      <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
                        {evt.timestamp}
                      </span>
                    </div>
                    <span
                      className={`text-[8px] uppercase tracking-widest font-bold ${eventColor(evt.severity)}`}
                    >
                      {evt.type}
                    </span>
                  </div>
                  <p className={`text-[9px] font-mono leading-relaxed ${eventColor(evt.severity)}`}>
                    {evt.message}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-700">
                      {evt.id}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-zinc-700">
                      {evt.zone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arm / Disarm Controls */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800">
              <Fingerprint className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                System_Control
              </span>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={() => setArmed(true)}
                className={`
                  w-full flex items-center justify-center gap-3 py-3 rounded-lg
                  text-[11px] uppercase tracking-widest font-bold
                  border transition-all duration-500 cursor-pointer
                  ${
                    armed
                      ? "bg-emerald-400/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800 hover:border-zinc-600"
                  }
                `}
              >
                <Lock className="w-4 h-4" />
                ARM ALL SYSTEMS
                {armed && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setArmed(false)}
                className={`
                  w-full flex items-center justify-center gap-3 py-3 rounded-lg
                  text-[11px] uppercase tracking-widest font-bold
                  border transition-all duration-500 cursor-pointer
                  ${
                    !armed
                      ? "bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800 hover:border-zinc-600"
                  }
                `}
              >
                <Unlock className="w-4 h-4" />
                DISARM SYSTEM
                {!armed && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {/* Auth notice */}
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 rounded border border-zinc-800">
                <Fingerprint className="w-3 h-3 text-zinc-600" />
                <span className="text-[8px] uppercase tracking-widest text-zinc-600">
                  AUTH_REQUIRED: BIOMETRIC + PIN
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          SECURITY_CMD v1.4 // TRIPLE_LAYER_DEFENSE // 24/7 MONITOR
        </span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          NVR: 847GB/2TB // RETENTION: 30D // IRIV_AGRIBOX_01
        </span>
      </div>
    </div>
  );
}
