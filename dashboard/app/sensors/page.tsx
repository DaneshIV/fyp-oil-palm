"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Thermometer,
  Droplets,
  Waves,
  Zap,
  Clock,
  CircleDot,
  RefreshCw,
  Activity,
} from "lucide-react";

interface DataPoint {
  time: string;
  value: number;
}

interface SensorConfig {
  id: string;
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  safeMin: number;
  safeMax: number;
  currentValue: number;
  status: "nominal" | "warning" | "critical";
}

function generateTimeSeriesData(
  range: string,
  baseValue: number,
  variance: number,
  trend: number
): DataPoint[] {
  const points: DataPoint[] = [];
  let count: number;
  let stepLabel: (i: number) => string;

  switch (range) {
    case "1H":
      count = 60;
      stepLabel = (i) => {
        const m = 60 - i;
        return m === 0 ? "now" : `-${m}m`;
      };
      break;
    case "6H":
      count = 72;
      stepLabel = (i) => {
        const m = (72 - i) * 5;
        if (m === 0) return "now";
        if (m >= 60) return `-${(m / 60).toFixed(0)}h`;
        return `-${m}m`;
      };
      break;
    case "24H":
      count = 96;
      stepLabel = (i) => {
        const h = 24 - (i * 24) / 96;
        if (h <= 0.25) return "now";
        return `-${h.toFixed(0)}h`;
      };
      break;
    case "3D":
      count = 72;
      stepLabel = (i) => {
        const h = 72 - i;
        if (h === 0) return "now";
        if (h >= 24) return `-${(h / 24).toFixed(0)}d`;
        return `-${h}h`;
      };
      break;
    default:
      count = 60;
      stepLabel = (i) => `-${60 - i}m`;
  }

  let val = baseValue - trend * count * 0.01;
  for (let i = 0; i < count; i++) {
    val += trend * 0.01 + (Math.random() - 0.48) * variance;
    val = Math.max(0, val);
    points.push({
      time: stepLabel(i),
      value: parseFloat(val.toFixed(2)),
    });
  }
  return points;
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace SENSORS with live sensor config/state from FastAPI backend.
// Future: useEffect → fetch('/api/sensors') for initial load,
//         WebSocket subscription to ws://<host>/ws/telemetry for real-time push.
// ============================================================================
const SENSORS: SensorConfig[] = [
  {
    id: "TEMP_01",
    label: "Temperature",
    unit: "°C",
    icon: <Thermometer className="w-4 h-4" />,
    color: "#f59e0b",
    safeMin: 22,
    safeMax: 35,
    currentValue: 31.4,
    status: "nominal",
  },
  {
    id: "HUMID_01",
    label: "Humidity",
    unit: "%",
    icon: <Droplets className="w-4 h-4" />,
    color: "#38bdf8",
    safeMin: 55,
    safeMax: 85,
    currentValue: 68,
    status: "nominal",
  },
  {
    id: "SOIL_M_01",
    label: "Soil Moisture",
    unit: "%",
    icon: <Waves className="w-4 h-4" />,
    color: "#34d399",
    safeMin: 40,
    safeMax: 80,
    currentValue: 37,
    status: "warning",
  },
  {
    id: "EC_01",
    label: "Elec. Conductivity",
    unit: "mS/cm",
    icon: <Zap className="w-4 h-4" />,
    color: "#a78bfa",
    safeMin: 1.0,
    safeMax: 3.0,
    currentValue: 0.84,
    status: "critical",
  },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace SENSOR_DATA_CONFIG with live time-series from FastAPI backend.
// Future: useEffect → fetch('/api/sensors/history?range=24H') for chart data,
//         or WebSocket for streaming datapoints.
// ============================================================================
const SENSOR_DATA_CONFIG = [
  { base: 31.4, variance: 0.8, trend: 0.3 },
  { base: 68, variance: 3, trend: -0.5 },
  { base: 37, variance: 2, trend: -2 },
  { base: 0.84, variance: 0.08, trend: -0.3 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 shadow-xl">
      <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">
        {label}
      </p>
      <p className="text-sm font-mono font-bold text-zinc-200">
        {payload[0].value}
      </p>
    </div>
  );
}

export default function SensorsPage() {
  const [timeRange, setTimeRange] = useState("24H");
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const [dataRevision, setDataRevision] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setDataRevision((r) => r + 1);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const allData = SENSORS.map((sensor, idx) => {
    const cfg = SENSOR_DATA_CONFIG[idx];
    return generateTimeSeriesData(timeRange, cfg.base, cfg.variance, cfg.trend);
  });

  const TIME_OPTIONS = ["1H", "6H", "24H", "3D"];

  const statusColor = (s: SensorConfig["status"]) =>
    s === "nominal"
      ? "text-emerald-400"
      : s === "warning"
        ? "text-amber-500"
        : "text-rose-500";

  const statusBorder = (s: SensorConfig["status"]) =>
    s === "nominal"
      ? "border-zinc-800"
      : s === "warning"
        ? "border-amber-500/30"
        : "border-rose-500/30";

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Sensor Telemetry History
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // 4-CH ANALOG FEED // HIGH-DENSITY TEMPORAL VIEW
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-refresh indicator */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <RefreshCw
              className={`w-3 h-3 text-emerald-400 ${refreshCountdown <= 1 ? "animate-spin" : ""}`}
            />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              REFRESH_INTERVAL:
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums w-4 text-right">
              {String(refreshCountdown).padStart(2, "0")}s
            </span>
          </div>

          {/* Timeframe controller */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setTimeRange(opt)}
                className={`
                  px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold
                  transition-all duration-200 cursor-pointer border-r border-zinc-800 last:border-r-0
                  ${
                    timeRange === opt
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }
                `}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-400">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* 4 Chart Grid */}
      <div className="grid grid-cols-2 gap-3">
        {SENSORS.map((sensor, idx) => {
          const data = allData[idx];
          const currentVal = data[data.length - 1]?.value ?? sensor.currentValue;
          const isOutOfRange =
            currentVal < sensor.safeMin || currentVal > sensor.safeMax;

          return (
            <div
              key={sensor.id}
              className={`bg-zinc-900 rounded-lg border ${statusBorder(sensor.status)} relative overflow-hidden`}
            >
              {/* Machined edge */}
              <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

              {/* Glow bar for non-nominal */}
              {sensor.status !== "nominal" && (
                <div
                  className={`absolute inset-x-0 top-0 h-0.5 ${
                    sensor.status === "warning"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  } animate-pulse`}
                />
              )}

              {/* Chart header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-md ${
                      sensor.status === "nominal"
                        ? "bg-zinc-800 text-zinc-500"
                        : sensor.status === "warning"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    {sensor.icon}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                      {sensor.label}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                      {sensor.id} // RANGE {sensor.safeMin}–{sensor.safeMax}
                      {sensor.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-mono font-bold ${statusColor(sensor.status)}`}
                  >
                    {currentVal}
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 ml-1">
                      {sensor.unit}
                    </span>
                  </p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        sensor.status === "nominal"
                          ? "bg-emerald-400"
                          : sensor.status === "warning"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-rose-500 animate-pulse"
                      }`}
                    />
                    <span
                      className={`text-[9px] uppercase tracking-widest font-bold ${statusColor(sensor.status)}`}
                    >
                      {sensor.status === "nominal"
                        ? "IN_RANGE"
                        : sensor.status === "warning"
                          ? "BELOW_MIN"
                          : "CRITICAL_LOW"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="px-2 py-3" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(63,63,70,0.4)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{
                        fontSize: 9,
                        fill: "#52525b",
                        fontFamily: "ui-monospace, monospace",
                      }}
                      axisLine={{ stroke: "#27272a" }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={40}
                    />
                    <YAxis
                      tick={{
                        fontSize: 9,
                        fill: "#52525b",
                        fontFamily: "ui-monospace, monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Safe zone threshold lines */}
                    <ReferenceLine
                      y={sensor.safeMax}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: `MAX ${sensor.safeMax}${sensor.unit}`,
                        position: "right",
                        style: {
                          fontSize: 8,
                          fill: "#f59e0b",
                          fontFamily: "ui-monospace, monospace",
                        },
                      }}
                    />
                    <ReferenceLine
                      y={sensor.safeMin}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: `MIN ${sensor.safeMin}${sensor.unit}`,
                        position: "right",
                        style: {
                          fontSize: 8,
                          fill: "#f59e0b",
                          fontFamily: "ui-monospace, monospace",
                        },
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={sensor.color}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{
                        r: 3,
                        fill: sensor.color,
                        stroke: "#09090b",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/50 bg-zinc-950/30">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                    SAFE_ZONE
                  </span>
                  <span className="text-[9px] font-mono text-amber-500/60">
                    ┈┈ {sensor.safeMin} – {sensor.safeMax} {sensor.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-zinc-700" />
                  <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                    WINDOW: {timeRange} // PTS: {data.length}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          SENSOR_HISTORY v2.1 // POLL 5000ms // ADC 12-BIT
        </span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          DATA_REV #{dataRevision} // IRIV_AGRIBOX_01
        </span>
      </div>
    </div>
  );
}
