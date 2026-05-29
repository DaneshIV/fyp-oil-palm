"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Thermometer,
  Droplets,
  Waves,
  Zap,
  Terminal,
  Radio,
  Cpu,
  HardDrive,
  Wifi,
  CircleDot,
  ChevronRight,
} from "lucide-react";

interface MetricCard {
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  status: "nominal" | "warning" | "critical";
  icon: React.ReactNode;
  history: number[];
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace METRICS with live state from FastAPI backend.
// Future: useEffect → fetch('/api/sensors/summary') or
//         WebSocket subscription to ws://<host>/ws/telemetry for real-time push.
// ============================================================================
const METRICS: MetricCard[] = [
  {
    id: "TEMP",
    label: "Ambient Temp",
    unit: "°C",
    value: 31.4,
    min: 20,
    max: 45,
    status: "nominal",
    icon: <Thermometer className="w-4 h-4" />,
    history: [28, 29, 30, 29.5, 31, 30.5, 31.4, 32, 31.8, 31.4],
  },
  {
    id: "HUMID",
    label: "Rel. Humidity",
    unit: "%",
    value: 68,
    min: 0,
    max: 100,
    status: "nominal",
    icon: <Droplets className="w-4 h-4" />,
    history: [72, 70, 68, 71, 69, 66, 65, 67, 68, 68],
  },
  {
    id: "SOIL_M",
    label: "Soil Moisture",
    unit: "%",
    value: 37,
    min: 0,
    max: 100,
    status: "warning",
    icon: <Waves className="w-4 h-4" />,
    history: [52, 50, 48, 46, 44, 42, 41, 39, 38, 37],
  },
  {
    id: "EC",
    label: "Elec. Conductivity",
    unit: "mS/cm",
    value: 0.84,
    min: 0,
    max: 4,
    status: "critical",
    icon: <Zap className="w-4 h-4" />,
    history: [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.92, 0.88, 0.84],
  },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace SYSTEM_LOGS with live log stream from FastAPI backend.
// Future: WebSocket subscription to ws://<host>/ws/syslog for real-time push,
//         or useEffect → fetch('/api/system/logs?limit=30') for polling.
// ============================================================================
const SYSTEM_LOGS = [
  "[BOOT] IRIV_AGRIBOX_01 FIRMWARE v3.2.1 LOADED",
  "[SYS_OK] WATCHDOG TIMER INITIALIZED // INTERVAL 30000ms",
  "[NET] WIFI_CONNECTED SSID:PLANTATION_5G RSSI:-42dBm",
  "[NET] DHCP_LEASE 192.168.4.101 // GW 192.168.4.1",
  "[SYS_OK] WEBSOCKET CONNECTED TO wss://agri.srv:8443/ws",
  "[MQTT] BROKER_CONNECTED mqtt://192.168.4.50:1883",
  "[MQTT] SUBSCRIBED topic/sensor/+/telemetry QoS=1",
  "[SENSOR] DHT22_INIT OK // ADDR 0x44 // POLL 5000ms",
  "[SENSOR] SOIL_PROBE_INIT OK // ADC_CH0 // CAL 0-4095→0-100%",
  "[SENSOR] EC_METER_INIT OK // I2C 0x64 // TEMP_COMP ENABLED",
  "[RELAY] 5CH_MODULE_INIT OK // GPIO [16,17,18,19,21]",
  "[SYS_OK] ALL SUBSYSTEMS NOMINAL",
  "[TELEM] TX → {temp:31.4,hum:68,soil:37,ec:0.84} // SEQ#4420",
  "[RULE] EVAL RULE_001 → soil_moisture(37) < 40 → CONDITION_MET",
  "[RELAY] ENGAGING RELAY_01 // DURATION 300s // PWR_CHECK OK",
  "[WARN] SOIL_MOISTURE BELOW THRESHOLD → 37% < 40%",
  "[WARN] EC_READING BELOW OPTIMAL → 0.84 mS/cm < 1.0",
  "[CAM] FRAME_CAPTURED seq#1882 // RES 640x480 // FMT JPEG",
  "[YOLO] INFERENCE_START model:ganoderma_v3.pt // DEVICE CPU",
  "[YOLO] INFERENCE_COMPLETE 142ms // DETECTIONS: 0",
  "[TELEM] TX → {temp:31.6,hum:67,soil:37,ec:0.83} // SEQ#4421",
  "[GPS] FIX_ACQUIRED 3.1390°N 101.6869°E // SAT 8 // HDOP 1.2",
  "[MQTT] PUB topic/alert/soil_low {zone:'BLK_B',val:37}",
  "[SYS_OK] HEAP_FREE 142,384 bytes // UPTIME 847201s",
  "[NET] PING agri.srv RTT 12ms",
  "[TELEM] TX → {temp:31.5,hum:68,soil:38,ec:0.84} // SEQ#4422",
  "[RELAY] RELAY_01 DISENGAGE // ELAPSED 300s // CYCLE_COMPLETE",
  "[RULE] EVAL RULE_002 → temp(31.5) < 35 → CONDITION_NOT_MET",
  "[RULE] EVAL RULE_003 → ec(0.84) < 1.2 AND days(2) < 3 → WAIT",
  "[SYS_OK] CHECKPOINT SAVED // NEXT EVAL IN 250ms",
];

function MiniSparkline({
  data,
  status,
}: {
  data: number[];
  status: MetricCard["status"];
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  const strokeColor =
    status === "nominal"
      ? "#34d399"
      : status === "warning"
        ? "#f59e0b"
        : "#f43f5e";

  const fillId = `fill-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#${fillId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Current value dot */}
      <circle
        cx={w}
        cy={h - ((data[data.length - 1] - min) / range) * h}
        r={2.5}
        fill={strokeColor}
      />
    </svg>
  );
}

function TerminalLog() {
  // ============================================================================
  // MOCK DATA — INTEGRATION POINT
  // Replace local lines state with live log stream from FastAPI backend.
  // Future: WebSocket subscription to ws://<host>/ws/syslog for real-time push.
  // ============================================================================
  const [lines, setLines] = useState<string[]>(SYSTEM_LOGS.slice(0, 12));
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(12);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = indexRef.current % SYSTEM_LOGS.length;
      setLines((prev) => [...prev, SYSTEM_LOGS[nextIndex]]);
      indexRef.current++;
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const colorize = (line: string) => {
    if (line.startsWith("[WARN]")) return "text-amber-500";
    if (line.startsWith("[ERR]") || line.startsWith("[CRIT]"))
      return "text-rose-500";
    if (line.startsWith("[SYS_OK]")) return "text-emerald-400";
    if (line.startsWith("[RELAY]")) return "text-emerald-400/80";
    if (line.startsWith("[YOLO]")) return "text-violet-400";
    if (line.startsWith("[TELEM]")) return "text-sky-400/70";
    if (line.startsWith("[RULE]")) return "text-amber-400/70";
    if (line.startsWith("[MQTT]") || line.startsWith("[NET]"))
      return "text-cyan-400/60";
    return "text-zinc-500";
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 shrink-0">
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          System_Console
        </span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
          IRIV_AGRIBOX_01 // TTY0
        </span>
        <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-0.5 bg-zinc-950/50"
        style={{ maxHeight: "360px" }}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[9px] font-mono text-zinc-700 select-none shrink-0 w-8 text-right">
              {String(i + 1).padStart(3, "0")}
            </span>
            <span className={`text-[11px] font-mono ${colorize(line)} leading-relaxed`}>
              {line}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-zinc-800 shrink-0 flex items-center gap-2">
        <ChevronRight className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-mono text-zinc-600 animate-pulse">
          _
        </span>
      </div>
    </div>
  );
}

export default function CommandOverview() {
  const statusColor = (s: MetricCard["status"]) =>
    s === "nominal"
      ? "text-emerald-400"
      : s === "warning"
        ? "text-amber-500"
        : "text-rose-500";

  const statusBorder = (s: MetricCard["status"]) =>
    s === "nominal"
      ? "border-zinc-800"
      : s === "warning"
        ? "border-amber-500/30"
        : "border-rose-500/30";

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Command Overview
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // SYSTEM STATUS BOARD // REAL-TIME FEED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9px] uppercase tracking-widest text-emerald-400">
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">
              142KB FREE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">
              RSSI -42dBm
            </span>
          </div>
        </div>
      </div>

      {/* 4-Card Metric Strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {METRICS.map((m) => (
          <div
            key={m.id}
            className={`bg-zinc-900 rounded-lg border ${statusBorder(m.status)} p-4 relative overflow-hidden`}
          >
            {/* Top machined edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

            {/* Glow bar for non-nominal */}
            {m.status !== "nominal" && (
              <div
                className={`absolute inset-x-0 top-0 h-0.5 ${m.status === "warning" ? "bg-amber-500" : "bg-rose-500"} animate-pulse`}
              />
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">
                  {m.id}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {m.label}
                </p>
              </div>
              <div
                className={`p-1.5 rounded-md ${m.status === "nominal" ? "bg-zinc-800 text-zinc-500" : m.status === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}
              >
                {m.icon}
              </div>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className={`text-2xl font-mono font-bold ${statusColor(m.status)}`}>
                {m.value}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                {m.unit}
              </span>
            </div>

            {/* Sparkline */}
            <div className="flex items-center justify-between">
              <MiniSparkline data={m.history} status={m.status} />
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[8px] uppercase tracking-widest text-zinc-600">
                  RANGE
                </span>
                <span className="text-[9px] font-mono text-zinc-600">
                  {m.min}–{m.max}
                </span>
              </div>
            </div>

            {/* Status pill */}
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${m.status === "nominal" ? "bg-emerald-400" : m.status === "warning" ? "bg-amber-500 animate-pulse" : "bg-rose-500 animate-pulse"}`}
              />
              <span className={`text-[9px] uppercase tracking-widest font-bold ${statusColor(m.status)}`}>
                {m.status === "nominal"
                  ? "NOMINAL"
                  : m.status === "warning"
                    ? "BELOW_THRESHOLD"
                    : "CRITICAL_LOW"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* System overview - left 2 cols */}
        <div className="col-span-2 space-y-3">
          {/* Node status strip */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Node_Status
              </span>
            </div>

            <div className="grid grid-cols-4 divide-x divide-zinc-800">
              {[
                { label: "UPTIME", value: "9d 19h 13m", color: "text-zinc-300" },
                { label: "CPU_LOAD", value: "23%", color: "text-emerald-400" },
                { label: "MQTT_MSG/s", value: "4.2", color: "text-cyan-400" },
                { label: "WS_LATENCY", value: "12ms", color: "text-emerald-400" },
              ].map((item) => (
                <div key={item.label} className="px-5 py-4">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">
                    {item.label}
                  </p>
                  <p className={`text-lg font-mono font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active relay status */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Relay_Summary
              </span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 ml-auto">
                3/5 ENGAGED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    {["RELAY", "PORT", "STATE", "V_OUT", "I_DRAW", "RUNTIME"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-2 text-[9px] uppercase tracking-widest text-zinc-600 font-medium"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "RELAY_01", port: "AC_SOCKET_1", state: "ON", v: "238.1V", i: "4.2A", rt: "4m 22s" },
                    { id: "RELAY_02", port: "AC_SOCKET_2", state: "OFF", v: "—", i: "—", rt: "—" },
                    { id: "RELAY_03", port: "DC_PORT_A", state: "ON", v: "12.4V", i: "1.1A", rt: "12m 08s" },
                    { id: "RELAY_04", port: "DC_PORT_B", state: "OFF", v: "—", i: "—", rt: "—" },
                    { id: "RELAY_05", port: "DC_PORT_C", state: "ON", v: "12.6V", i: "1.3A", rt: "12m 08s" },
                  ].map((r) => (
                    <tr key={r.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-2.5 text-[11px] font-mono text-zinc-400 font-bold">
                        {r.id}
                      </td>
                      <td className="px-5 py-2.5 text-[10px] font-mono text-zinc-600">
                        {r.port}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${r.state === "ON" ? "text-emerald-400" : "text-zinc-600"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${r.state === "ON" ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"}`}
                          />
                          {r.state}
                        </span>
                      </td>
                      <td className={`px-5 py-2.5 text-[11px] font-mono font-bold ${r.state === "ON" ? "text-emerald-400" : "text-zinc-600"}`}>
                        {r.v}
                      </td>
                      <td className={`px-5 py-2.5 text-[11px] font-mono font-bold ${r.state === "ON" ? "text-amber-500" : "text-zinc-600"}`}>
                        {r.i}
                      </td>
                      <td className="px-5 py-2.5 text-[10px] font-mono text-zinc-500">
                        {r.rt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zone overview */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Waves className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Zone_Monitor
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-zinc-800">
              {[
                { id: "BLK_A", status: "OPTIMAL", color: "text-emerald-400", dot: "bg-emerald-400", soil: "72%", ec: "1.8", det: "0" },
                { id: "BLK_B", status: "WARNING", color: "text-amber-500", dot: "bg-amber-500", soil: "38%", ec: "0.9", det: "0" },
                { id: "BLK_C", status: "INFECTED", color: "text-rose-500", dot: "bg-rose-500", soil: "55%", ec: "1.4", det: "7" },
              ].map((z) => (
                <div key={z.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${z.dot} ${z.status === "INFECTED" ? "animate-pulse" : ""}`} />
                    <span className="text-[11px] font-mono font-bold text-zinc-300">
                      {z.id}
                    </span>
                    <span className={`text-[9px] uppercase tracking-widest font-bold ${z.color} ml-auto`}>
                      {z.status}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                        SOIL
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {z.soil}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                        EC
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {z.ec} mS/cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                        DETECT
                      </span>
                      <span className={`text-[10px] font-mono ${z.det !== "0" ? "text-rose-500 font-bold" : "text-zinc-600"}`}>
                        {z.det}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal log - right col */}
        <div className="col-span-1 h-full">
          <TerminalLog />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          AGRIBOX_CMD_OVERVIEW v1.0 // SESSION {Math.random().toString(36).slice(2, 10).toUpperCase()}
        </span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          192.168.4.101:8443 // TLS 1.3
        </span>
      </div>
    </div>
  );
}
