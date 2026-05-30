"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Thermometer, Droplets, Waves, Zap,
  Wind, Leaf, RefreshCw, Activity, CircleDot,
} from "lucide-react";
import { sensorApi } from "@/lib/api";

interface DataPoint { time: string; value: number; }

const RANGES = ["1H", "6H", "24H", "3D"];

// ── Sensor definitions split into Air and Soil sections
const AIR_SENSORS = [
  { id: "temperature",      label: "Air Temperature", unit: "°C",    color: "#f59e0b", icon: Thermometer, safeMin: 22, safeMax: 35, warnHigh: 32, critHigh: 35 },
  { id: "humidity",         label: "Air Humidity",    unit: "%",     color: "#38bdf8", icon: Wind,        safeMin: 60, safeMax: 90, warnLow: 60,  critLow: 50  },
];

const SOIL_SENSORS = [
  { id: "soil_moisture",    label: "Soil Moisture",    unit: "%",     color: "#34d399", icon: Waves,       safeMin: 40, safeMax: 80, warnLow: 40, critLow: 30  },
  { id: "soil_temperature", label: "Soil Temperature", unit: "°C",    color: "#fb923c", icon: Thermometer, safeMin: 20, safeMax: 35, warnHigh: 32, critHigh: 35 },
  { id: "ec_level",         label: "EC Level",         unit: "mS/cm", color: "#a78bfa", icon: Zap,         safeMin: 1.2, safeMax: 2.5, warnLow: 1.2, critLow: 1.0 },
];

function getStatus(id: string, value: number): "nominal" | "warning" | "critical" {
  const thresholds: Record<string, { warnLow?: number; critLow?: number; warnHigh?: number; critHigh?: number }> = {
    temperature:      { warnHigh: 32, critHigh: 35 },
    humidity:         { warnLow: 60, critLow: 50 },
    soil_moisture:    { warnLow: 40, critLow: 30 },
    soil_temperature: { warnHigh: 32, critHigh: 35 },
    ec_level:         { warnLow: 1.2, critLow: 1.0 },
  };
  const t = thresholds[id];
  if (!t) return "nominal";
  if ((t.critLow !== undefined && value < t.critLow) || (t.critHigh !== undefined && value > t.critHigh)) return "critical";
  if ((t.warnLow !== undefined && value < t.warnLow) || (t.warnHigh !== undefined && value > t.warnHigh)) return "warning";
  return "nominal";
}

const statusColor  = (s: string) => s === "nominal" ? "text-emerald-400" : s === "warning" ? "text-amber-500" : "text-rose-500";
const statusBorder = (s: string) => s === "nominal" ? "border-zinc-800" : s === "warning" ? "border-amber-500/30" : "border-rose-500/30";
const statusBg     = (s: string) => s === "warning" ? "bg-amber-500/5" : s === "critical" ? "bg-rose-500/5" : "";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 font-mono">
      <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-zinc-200">{payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
};

// ── Single sensor card with chart
function SensorCard({ def, value, data, range }: {
  def: typeof AIR_SENSORS[0];
  value: number;
  data: DataPoint[];
  range: string;
}) {
  const status = getStatus(def.id, value);
  const Icon   = def.icon;

  return (
    <div className={`bg-zinc-900 rounded-lg border ${statusBorder(status)} ${statusBg(status)} overflow-hidden relative`}>
      {status !== "nominal" && (
        <div className={`absolute inset-x-0 top-0 h-0.5 ${status === "warning" ? "bg-amber-500" : "bg-rose-500"} animate-pulse`} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${status === "nominal" ? "bg-zinc-800 text-zinc-500" : status === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-zinc-600">{def.id.toUpperCase()}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{def.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-mono font-bold ${statusColor(status)}`}>{value}</p>
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">{def.unit}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-2 pb-1">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
            <XAxis dataKey="time" tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }}
              tickLine={false} axisLine={false} interval={Math.floor(data.length / 4)} />
            <YAxis tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={def.safeMin} stroke="rgba(52,211,153,0.2)" strokeDasharray="4 4" />
            <ReferenceLine y={def.safeMax} stroke="rgba(52,211,153,0.2)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="value" stroke={def.color} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: def.color }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800">
        {[
          { label: "CURRENT",  value: `${value}${def.unit}` },
          { label: "SAFE_MIN", value: `${def.safeMin}${def.unit}` },
          { label: "SAFE_MAX", value: `${def.safeMax}${def.unit}` },
        ].map(s => (
          <div key={s.label} className="px-3 py-2">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">{s.label}</p>
            <p className={`text-[9px] font-mono font-bold ${s.label === "CURRENT" ? statusColor(status) : "text-zinc-500"}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section header
function SectionHeader({ icon, title, subtitle, status }: {
  icon: React.ReactNode; title: string; subtitle: string; status: "nominal" | "warning" | "critical";
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-3 ${
      status === "critical" ? "bg-rose-500/5 border-rose-500/30" :
      status === "warning"  ? "bg-amber-500/5 border-amber-500/30" :
      "bg-zinc-900 border-zinc-800"
    }`}>
      <div className={`p-2 rounded-md ${
        status === "critical" ? "bg-rose-500/10 text-rose-500" :
        status === "warning"  ? "bg-amber-500/10 text-amber-500" :
        "bg-emerald-400/10 text-emerald-400"
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-200">{title}</p>
        <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${
          status === "critical" ? "bg-rose-500 animate-pulse" :
          status === "warning"  ? "bg-amber-500 animate-pulse" :
          "bg-emerald-400"
        }`} />
        <span className={`text-[9px] uppercase tracking-widest font-bold ${statusColor(status)}`}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export default function SensorsPage() {
  const [range, setRange]       = useState("1H");
  const [latest, setLatest]     = useState<any>({});
  const [history, setHistory]   = useState<any[]>([]);
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
      setLatest(latestRes.data);
      setHistory(historyRes.data);
      setLastUpdate(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [range]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 30000);
    return () => clearInterval(i);
  }, [fetchData]);

  const getChartData = (key: string): DataPoint[] =>
    history.slice(-50).map((h: any) => ({
      time:  new Date(h.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      value: h[key] ?? 0,
    }));

  // Overall section status
  const airStatus = (["temperature", "humidity"] as const)
    .map(k => getStatus(k, latest[k] ?? 0))
    .includes("critical") ? "critical"
    : (["temperature", "humidity"] as const)
    .map(k => getStatus(k, latest[k] ?? 0))
    .includes("warning") ? "warning" : "nominal";

  const soilStatus = (["soil_moisture", "soil_temperature", "ec_level"] as const)
    .map(k => getStatus(k, latest[k] ?? 0))
    .includes("critical") ? "critical"
    : (["soil_moisture", "soil_temperature", "ec_level"] as const)
    .map(k => getStatus(k, latest[k] ?? 0))
    .includes("warning") ? "warning" : "nominal";

  // Alert banners
  const allStatuses = [...AIR_SENSORS, ...SOIL_SENSORS].map(s => getStatus(s.id, latest[s.id] ?? 0));
  const hasCritical = allStatuses.includes("critical");
  const hasWarning  = allStatuses.includes("warning");

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Sensor Matrix</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              RS485 MODBUS RTU // AIR: SLAVE_1 // SOIL: SLAVE_5 (SN-3000-ECTH-N01)
              {lastUpdate && ` // ${lastUpdate.toLocaleTimeString("en-GB")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all ${range === r ? "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30" : "text-zinc-600 hover:text-zinc-400"}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>
      </div>

      {/* Alert banners */}
      {hasCritical && (
        <div className="mb-4 bg-rose-500/5 border border-rose-500/30 rounded-lg px-5 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">
            CRITICAL: {[...AIR_SENSORS, ...SOIL_SENSORS].filter(s => getStatus(s.id, latest[s.id] ?? 0) === "critical").map(s => `${s.label} (${latest[s.id] ?? 0}${s.unit})`).join(" // ")}
          </span>
        </div>
      )}
      {hasWarning && !hasCritical && (
        <div className="mb-4 bg-amber-500/5 border border-amber-500/30 rounded-lg px-5 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">
            WARNING: {[...AIR_SENSORS, ...SOIL_SENSORS].filter(s => getStatus(s.id, latest[s.id] ?? 0) === "warning").map(s => `${s.label} (${latest[s.id] ?? 0}${s.unit})`).join(" // ")}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── AIR SECTION ── */}
          <div>
            <SectionHeader
              icon={<Wind className="w-4 h-4" />}
              title="Air Sensor"
              subtitle="SLAVE_1 // TEMPERATURE + HUMIDITY // INDOOR/OUTDOOR AMBIENT"
              status={airStatus}
            />
            <div className="grid grid-cols-2 gap-4">
              {AIR_SENSORS.map(def => (
                <SensorCard
                  key={def.id}
                  def={def}
                  value={latest[def.id] ?? 0}
                  data={getChartData(def.id)}
                  range={range}
                />
              ))}
            </div>
          </div>

          {/* ── SOIL SECTION ── */}
          <div>
            <SectionHeader
              icon={<Leaf className="w-4 h-4" />}
              title="Soil Sensor"
              subtitle="SLAVE_5 // SN-3000-ECTH-N01 // MOISTURE + TEMPERATURE + EC"
              status={soilStatus}
            />
            <div className="grid grid-cols-3 gap-4">
              {SOIL_SENSORS.map(def => (
                <SensorCard
                  key={def.id}
                  def={def}
                  value={latest[def.id] ?? 0}
                  data={getChartData(def.id)}
                  range={range}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          RS485 // /dev/ttyACM0 // 9600 BAUD // POLL 30s
        </span>
        <div className="flex items-center gap-1.5">
          <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-emerald-400">LIVE</span>
        </div>
      </div>
    </div>
  );
}