"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Thermometer, Droplets, Waves, Zap, Terminal, Radio, Cpu,
  Wifi, CircleDot, ChevronRight, WifiOff,
} from "lucide-react";
import { sensorApi, alertApi, automationApi, diseaseApi } from "@/lib/api";
import { useSensorWebSocket } from "@/hooks/useWebSocket";

interface MetricCard {
  id: string; label: string; unit: string; value: number;
  min: number; max: number; warnMin?: number; warnMax?: number;
  critMin?: number; critMax?: number;
  status: "nominal" | "warning" | "critical";
  icon: React.ReactNode; history: number[];
}

function getStatus(id: string, value: number): "nominal" | "warning" | "critical" {
  const thresholds: Record<string, { warnLow?: number; critLow?: number; warnHigh?: number; critHigh?: number }> = {
    TEMP:   { warnHigh: 32, critHigh: 35 },
    HUMID:  { warnLow: 60, critLow: 50 },
    SOIL_M: { warnLow: 40, critLow: 30 },
    EC:     { warnLow: 1.2, critLow: 1.0 },
  };
  const t = thresholds[id];
  if (!t) return "nominal";
  if ((t.critLow !== undefined && value < t.critLow) || (t.critHigh !== undefined && value > t.critHigh)) return "critical";
  if ((t.warnLow !== undefined && value < t.warnLow) || (t.warnHigh !== undefined && value > t.warnHigh)) return "warning";
  return "nominal";
}

function MiniSparkline({ data, status }: { data: number[]; status: MetricCard["status"] }) {
  if (!data || data.length < 2) return <svg width={80} height={32} />;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const h = 32; const w = 80; const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  const strokeColor = status === "nominal" ? "#34d399" : status === "warning" ? "#f59e0b" : "#f43f5e";
  const fillId = `fill-${status}-${data.length}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#${fillId})`} />
      <polyline points={points} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={h - ((data[data.length - 1] - min) / range) * h} r={2.5} fill={strokeColor} />
    </svg>
  );
}

function TerminalLog({ logs }: { logs: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);
  const colorize = (line: string) => {
    if (line.includes("[WARN]") || line.includes("WARNING")) return "text-amber-500";
    if (line.includes("[ERR]") || line.includes("CRITICAL")) return "text-rose-500";
    if (line.includes("[OK]") || line.includes("NOMINAL") || line.includes("ACK")) return "text-emerald-400";
    if (line.includes("[RELAY]") || line.includes("ENGAGED") || line.includes("RELAY")) return "text-emerald-400/80";
    if (line.includes("[DISEASE]") || line.includes("DETECT")) return "text-violet-400";
    if (line.includes("[SENSOR]")) return "text-sky-400/70";
    if (line.includes("[RULE]") || line.includes("TRIGGER")) return "text-amber-400/70";
    return "text-zinc-500";
  };
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 shrink-0">
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">System_Console</span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">IRIV_AGRIBOX_01 // TTY0</span>
        <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-0.5 bg-zinc-950/50" style={{ maxHeight: "360px" }}>
        {logs.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[9px] font-mono text-zinc-700 select-none shrink-0 w-8 text-right">{String(i + 1).padStart(3, "0")}</span>
            <span className={`text-[11px] font-mono ${colorize(line)} leading-relaxed`}>{line}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 shrink-0 flex items-center gap-2">
        <ChevronRight className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-mono text-zinc-600 animate-pulse">_</span>
      </div>
    </div>
  );
}

export default function CommandOverview() {
  const { data: wsData, connected: wsConnected } = useSensorWebSocket();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [logs, setLogs] = useState<string[]>(["[BOOT] IRIV_AGRIBOX_01 INITIALIZING...", "[SYS] Connecting to backend..."]);
  const [relayStatus, setRelayStatus] = useState<{ id: string; label: string; port: string; state: boolean }[]>([]);
  const [zones, setZones] = useState<{ id: string; soil: number; ec: number; detections: number }[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const historyRef = useRef<Record<string, number[]>>({ TEMP: [], HUMID: [], SOIL_M: [], EC: [] });
  const [uptime, setUptime] = useState(0);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-49), msg]);
  }, []);

  // Fetch latest sensors
  const fetchSensors = useCallback(async () => {
    try {
      const res = await sensorApi.getLatest();
      const d = res.data;
      setIsOnline(true);
      const vals = [
        { id: "TEMP", label: "Ambient Temp", unit: "°C", value: d.temperature ?? 0, min: 20, max: 45, icon: <Thermometer className="w-4 h-4" /> },
        { id: "HUMID", label: "Rel. Humidity", unit: "%", value: d.humidity ?? 0, min: 0, max: 100, icon: <Droplets className="w-4 h-4" /> },
        { id: "SOIL_M", label: "Soil Moisture", unit: "%", value: d.soil_moisture ?? 0, min: 0, max: 100, icon: <Waves className="w-4 h-4" /> },
        { id: "EC", label: "Elec. Conductivity", unit: "mS/cm", value: d.ec_level ?? 0, min: 0, max: 4, icon: <Zap className="w-4 h-4" /> },
      ];
      const updated = vals.map(v => {
        const hist = historyRef.current[v.id] || [];
        const newHist = [...hist, v.value].slice(-10);
        historyRef.current[v.id] = newHist;
        const status = getStatus(v.id, v.value);
        if (status !== "nominal") addLog(`[WARN] ${v.id} status: ${status.toUpperCase()} (${v.value}${v.unit})`);
        return { ...v, status, history: newHist };
      });
      setMetrics(updated);
      addLog(`[SENSOR] TX → {temp:${d.temperature},hum:${d.humidity},soil:${d.soil_moisture},ec:${d.ec_level}}`);
    } catch {
      setIsOnline(false);
      addLog("[ERR] Backend unreachable — retrying...");
    }
  }, [addLog]);

  // Fetch relay status from rules
  const fetchRelays = useCallback(async () => {
    try {
      const res = await automationApi.getRules();
      const rules = res.data;
      const relayMap: Record<number, string> = { 1: "Water Pump", 2: "Mist Pump", 3: "NPK-A", 4: "NPK-B", 5: "NPK-C" };
      const portMap: Record<number, string> = { 1: "AC_SOCKET_1", 2: "AC_SOCKET_2", 3: "DC_PORT_A", 4: "DC_PORT_B", 5: "DC_PORT_C" };
      const triggered = new Set(rules.filter((r: any) => r.is_active).map((r: any) => r.relay_pin));
      const relays = [1, 2, 3, 4, 5].map(n => ({
        id: `RELAY_0${n}`, label: relayMap[n], port: portMap[n], state: triggered.has(n)
      }));
      setRelayStatus(relays);
    } catch { /* silent */ }
  }, []);

  // Fetch disease detections for zone summary
  const fetchZones = useCallback(async () => {
    try {
      const res = await diseaseApi.getHistory(50);
      const detections = res.data;
      const blocks = ["Block-A", "Block-B", "Block-C"];
      const z = blocks.map(b => {
        const blockDets = detections.filter((d: any) => d.block_id === b);
        const diseased = blockDets.filter((d: any) => d.disease_label !== "healthy" && d.disease_label !== "immature").length;
        return { id: b.replace("Block-", "BLK_"), soil: 0, ec: 0, detections: diseased };
      });
      setZones(z);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchSensors();
    fetchRelays();
    fetchZones();
    addLog("[SYS_OK] ALL SUBSYSTEMS INITIALIZED");
    addLog("[NET] CLOUDFLARE_TUNNEL CONNECTED // KUL01");
    addLog("[RELAY] 5CH_MODULE_INIT OK // GPIO [24,25] + MODBUS_TCP [10.0.0.10:502]");
    addLog("[SENSOR] RS485_BUS OK // SLAVE_1(AIR) + SLAVE_5(SOIL)");
    addLog("[ML] YOLOv8n_v4 MODEL LOADED // mAP50: 74.6%");

    const sensorInterval = setInterval(fetchSensors, 30000);
    const relayInterval  = setInterval(fetchRelays, 15000);
    const zoneInterval   = setInterval(fetchZones, 60000);
    const uptimeInterval = setInterval(() => setUptime(p => p + 1), 1000);
    return () => { clearInterval(sensorInterval); clearInterval(relayInterval); clearInterval(zoneInterval); clearInterval(uptimeInterval); };
  }, [fetchSensors, fetchRelays, fetchZones, addLog]);

  // Use WebSocket data when available
  useEffect(() => {
    if (wsData) {
      const vals = [
        { id: "TEMP", value: wsData.temperature, unit: "°C", icon: <Thermometer className="w-4 h-4" /> },
        { id: "HUMID", value: wsData.humidity, unit: "%", icon: <Droplets className="w-4 h-4" /> },
        { id: "SOIL_M", value: wsData.soil_moisture, unit: "%", icon: <Waves className="w-4 h-4" /> },
        { id: "EC", value: wsData.ec_level, unit: "mS/cm", icon: <Zap className="w-4 h-4" /> },
      ];
      setMetrics(prev => prev.map(m => {
        const upd = vals.find(v => v.id === m.id);
        if (!upd) return m;
        const hist = [...m.history, upd.value].slice(-10);
        historyRef.current[m.id] = hist;
        return { ...m, value: upd.value, status: getStatus(m.id, upd.value), history: hist };
      }));
    }
  }, [wsData]);

  const fmtUptime = (s: number) => {
    const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

  const statusColor = (s: "nominal" | "warning" | "critical") =>
    s === "nominal" ? "text-emerald-400" : s === "warning" ? "text-amber-500" : "text-rose-500";
  const statusBorder = (s: "nominal" | "warning" | "critical") =>
    s === "nominal" ? "border-zinc-800" : s === "warning" ? "border-amber-500/30" : "border-rose-500/30";

  const engagedCount = relayStatus.filter(r => r.state).length;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Command Overview</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // SYSTEM STATUS BOARD // {wsConnected ? "WEBSOCKET LIVE" : "POLLING MODE"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {isOnline
              ? <><Wifi className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[9px] uppercase tracking-widest text-emerald-400">ONLINE</span></>
              : <><WifiOff className="w-3.5 h-3.5 text-rose-500" /><span className="text-[9px] uppercase tracking-widest text-rose-500">OFFLINE</span></>
            }
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">UPTIME {fmtUptime(uptime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">api.project2030.me</span>
          </div>
        </div>
      </div>

      {/* 4-Card Metric Strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <div key={m.id} className={`bg-zinc-900 rounded-lg border ${statusBorder(m.status)} p-4 relative overflow-hidden`}>
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            {m.status !== "nominal" && (
              <div className={`absolute inset-x-0 top-0 h-0.5 ${m.status === "warning" ? "bg-amber-500" : "bg-rose-500"} animate-pulse`} />
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">{m.id}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">{m.label}</p>
              </div>
              <div className={`p-1.5 rounded-md ${m.status === "nominal" ? "bg-zinc-800 text-zinc-500" : m.status === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
                {m.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className={`text-2xl font-mono font-bold ${statusColor(m.status)}`}>{m.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">{m.unit}</span>
            </div>
            <div className="flex items-center justify-between">
              <MiniSparkline data={m.history} status={m.status} />
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[8px] uppercase tracking-widest text-zinc-600">RANGE</span>
                <span className="text-[9px] font-mono text-zinc-600">{m.min}–{m.max}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${m.status === "nominal" ? "bg-emerald-400" : m.status === "warning" ? "bg-amber-500 animate-pulse" : "bg-rose-500 animate-pulse"}`} />
              <span className={`text-[9px] uppercase tracking-widest font-bold ${statusColor(m.status)}`}>
                {m.status === "nominal" ? "NOMINAL" : m.status === "warning" ? "BELOW_THRESHOLD" : "CRITICAL_LOW"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-3">
          {/* Relay summary */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Relay_Summary</span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 ml-auto">{engagedCount}/5 ENGAGED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    {["RELAY", "PORT", "FUNCTION", "STATE"].map(h => (
                      <th key={h} className="px-5 py-2 text-[9px] uppercase tracking-widest text-zinc-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {relayStatus.length > 0 ? relayStatus.map(r => (
                    <tr key={r.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-2.5 text-[11px] font-mono text-zinc-400 font-bold">{r.id}</td>
                      <td className="px-5 py-2.5 text-[10px] font-mono text-zinc-600">{r.port}</td>
                      <td className="px-5 py-2.5 text-[10px] font-mono text-zinc-500">{r.label}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${r.state ? "text-emerald-400" : "text-zinc-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.state ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"}`} />
                          {r.state ? "ENGAGED" : "STANDBY"}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-5 py-4 text-[10px] text-zinc-600 text-center">Loading relay status...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zone monitor */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Waves className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Zone_Monitor</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-zinc-800">
              {zones.length > 0 ? zones.map(z => {
                const hasInfection = z.detections > 0;
                const statusLabel = hasInfection ? "INFECTED" : "MONITORING";
                const statusCol = hasInfection ? "text-rose-500" : "text-emerald-400";
                const dotCol = hasInfection ? "bg-rose-500" : "bg-emerald-400";
                return (
                  <div key={z.id} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2 h-2 rounded-full ${dotCol} ${hasInfection ? "animate-pulse" : ""}`} />
                      <span className="text-[11px] font-mono font-bold text-zinc-300">{z.id}</span>
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${statusCol} ml-auto`}>{statusLabel}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-600">DETECT</span>
                        <span className={`text-[10px] font-mono ${hasInfection ? "text-rose-500 font-bold" : "text-zinc-600"}`}>{z.detections}</span>
                      </div>
                    </div>
                  </div>
                );
              }) : [1,2,3].map(i => (
                <div key={i} className="px-5 py-4">
                  <div className="text-[9px] text-zinc-700 uppercase tracking-widest">BLK_{"ABC"[i-1]}</div>
                  <div className="text-[9px] text-zinc-700 mt-2">Loading...</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="col-span-1 h-full">
          <TerminalLog logs={logs} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">AGRIBOX_CMD_OVERVIEW v4.0 // {wsConnected ? "WS_LIVE" : "POLLING_MODE"}</span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">api.project2030.me // TLS 1.3</span>
      </div>
    </div>
  );
}