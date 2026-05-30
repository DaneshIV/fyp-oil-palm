"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Thermometer, Droplets, Waves, Zap,
  Clock, CircleDot, RefreshCw, Activity,
} from "lucide-react";
import { sensorApi } from "@/lib/api";

interface DataPoint { time: string; value: number; }
interface SensorConfig {
  id: string; label: string; unit: string;
  icon: React.ReactNode; color: string;
  safeMin: number; safeMax: number;
  warnMin?: number; warnMax?: number;
  currentValue: number;
  status: "nominal" | "warning" | "critical";
  data: DataPoint[];
}

const RANGES = ["1H", "6H", "24H", "3D"];

const SENSOR_DEFS = [
  { id: "temperature",   label: "Temperature",        unit: "°C",    color: "#f59e0b", safeMin: 22, safeMax: 35, warnMax: 32, icon: <Thermometer className="w-4 h-4" /> },
  { id: "humidity",      label: "Rel. Humidity",      unit: "%",     color: "#38bdf8", safeMin: 60, safeMax: 90, warnMin: 65, icon: <Droplets className="w-4 h-4" /> },
  { id: "soil_moisture", label: "Soil Moisture",      unit: "%",     color: "#34d399", safeMin: 40, safeMax: 80, warnMin: 45, icon: <Waves className="w-4 h-4" /> },
  { id: "ec_level",      label: "EC Level",           unit: "mS/cm", color: "#a78bfa", safeMin: 1.2, safeMax: 2.5, warnMin: 1.4, icon: <Zap className="w-4 h-4" /> },
];

function getStatus(id: string, value: number): "nominal" | "warning" | "critical" {
  const t: Record<string, { warnLow?: number; critLow?: number; warnHigh?: number; critHigh?: number }> = {
    temperature:   { warnHigh: 32, critHigh: 35 },
    humidity:      { warnLow: 60, critLow: 50 },
    soil_moisture: { warnLow: 40, critLow: 30 },
    ec_level:      { warnLow: 1.2, critLow: 1.0 },
  };
  const th = t[id];
  if (!th) return "nominal";
  if ((th.critLow !== undefined && value < th.critLow) || (th.critHigh !== undefined && value > th.critHigh)) return "critical";
  if ((th.warnLow !== undefined && value < th.warnLow) || (th.warnHigh !== undefined && value > th.warnHigh)) return "warning";
  return "nominal";
}

const statusColor = (s: string) => s === "nominal" ? "text-emerald-400" : s === "warning" ? "text-amber-500" : "text-rose-500";
const statusBorder = (s: string) => s === "nominal" ? "border-zinc-800" : s === "warning" ? "border-amber-500/30" : "border-rose-500/30";
const statusBg = (s: string) => s === "nominal" ? "" : s === "warning" ? "bg-amber-500/5" : "bg-rose-500/5";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2">
      <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-mono font-bold text-zinc-200">{payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
};

export default function SensorsPage() {
  const [range, setRange]       = useState("1H");
  const [sensors, setSensors]   = useState<SensorConfig[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const hours = range === "1H" ? 1 : range === "6H" ? 6 : range === "24H" ? 24 : 72;
      const [latestRes, historyRes] = await Promise.all([
        sensorApi.getLatest(),
        sensorApi.getHistory(hours),
      ]);

      const latest  = latestRes.data;
      const history = historyRes.data;

      const configs = SENSOR_DEFS.map(def => {
        const currentValue = latest[def.id] ?? 0;
        const data: DataPoint[] = history.map((h: any) => ({
          time:  new Date(h.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          value: h[def.id] ?? 0,
        }));
        return {
          ...def,
          currentValue,
          status: getStatus(def.id, currentValue),
          data: data.slice(-50),
        };
      });

      setSensors(configs);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Sensor fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const criticalSensors = sensors.filter(s => s.status === "critical");
  const warningSensors  = sensors.filter(s => s.status === "warning");

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Sensor Matrix</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              RS485 MODBUS RTU // SLAVE_1 + SLAVE_5 // {lastUpdate ? `LAST UPDATE: ${lastUpdate.toLocaleTimeString("en-GB")}` : "CONNECTING..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded text-[9px] uppercase tracking-widest font-bold transition-all cursor-pointer ${range === r ? "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30" : "text-zinc-600 hover:text-zinc-400"}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>
      </div>

      {/* Alert banners */}
      {criticalSensors.length > 0 && (
        <div className="mb-4 bg-rose-500/5 border border-rose-500/30 rounded-lg px-5 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">
            CRITICAL: {criticalSensors.map(s => `${s.label} (${s.currentValue}${s.unit})`).join(" // ")}
          </span>
        </div>
      )}
      {warningSensors.length > 0 && criticalSensors.length === 0 && (
        <div className="mb-4 bg-amber-500/5 border border-amber-500/30 rounded-lg px-5 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">
            WARNING: {warningSensors.map(s => `${s.label} (${s.currentValue}${s.unit})`).join(" // ")}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sensors.map(sensor => (
            <div key={sensor.id} className={`bg-zinc-900 rounded-lg border ${statusBorder(sensor.status)} ${statusBg(sensor.status)} relative overflow-hidden`}>
              <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
              {sensor.status !== "nominal" && (
                <div className={`absolute inset-x-0 top-0 h-0.5 ${sensor.status === "warning" ? "bg-amber-500" : "bg-rose-500"} animate-pulse`} />
              )}

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${sensor.status === "nominal" ? "bg-zinc-800 text-zinc-500" : sensor.status === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {sensor.icon}
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600">{sensor.id.toUpperCase()}</p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{sensor.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-mono font-bold ${statusColor(sensor.status)}`}>{sensor.currentValue}</p>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600">{sensor.unit}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="px-2 pt-3 pb-2">
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={sensor.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                    <XAxis dataKey="time" tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }}
                      tickLine={false} axisLine={false} interval={Math.floor(sensor.data.length / 5)} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={sensor.safeMin} stroke="rgba(52,211,153,0.2)" strokeDasharray="4 4" />
                    <ReferenceLine y={sensor.safeMax} stroke="rgba(52,211,153,0.2)" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="value" stroke={sensor.color} strokeWidth={1.5}
                      dot={false} activeDot={{ r: 3, fill: sensor.color }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stats footer */}
              <div className="grid grid-cols-4 divide-x divide-zinc-800 border-t border-zinc-800">
                {[
                  { label: "CURRENT", value: `${sensor.currentValue}${sensor.unit}` },
                  { label: "SAFE_MIN", value: `${sensor.safeMin}${sensor.unit}` },
                  { label: "SAFE_MAX", value: `${sensor.safeMax}${sensor.unit}` },
                  { label: "STATUS", value: sensor.status.toUpperCase() },
                ].map(stat => (
                  <div key={stat.label} className="px-3 py-2">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">{stat.label}</p>
                    <p className={`text-[10px] font-mono font-bold ${stat.label === "STATUS" ? statusColor(sensor.status) : "text-zinc-400"}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">SENSOR_MATRIX // RS485 MODBUS RTU // POLL_INTERVAL 30s</span>
        <div className="flex items-center gap-1.5">
          <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-emerald-400">LIVE</span>
        </div>
      </div>
    </div>
  );
}