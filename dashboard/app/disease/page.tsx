"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Bug,
  TreePine,
  ShieldCheck,
  Target,
  TrendingUp,
  CircleDot,
  Cpu,
  Layers,
} from "lucide-react";

interface MetricCard {
  id: string;
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace METRICS with live AI detection stats from FastAPI backend.
// Future: useEffect → fetch('/api/disease/stats') for aggregated metrics,
//         WebSocket subscription to ws://<host>/ws/detections for real-time count.
// ============================================================================
const METRICS: MetricCard[] = [
  {
    id: "TOTAL_DET",
    label: "Total Detections",
    value: "1,247",
    subValue: "LAST 30 DAYS",
    icon: <Target className="w-4 h-4" />,
    color: "text-sky-400",
    trend: "+12.3%",
  },
  {
    id: "DISEASED",
    label: "Diseased Trees",
    value: "18",
    subValue: "OF 108 TOTAL",
    icon: <Bug className="w-4 h-4" />,
    color: "text-rose-500",
    trend: "+3",
  },
  {
    id: "HEALTHY",
    label: "Healthy Trees",
    value: "90",
    subValue: "83.3% FLEET",
    icon: <TreePine className="w-4 h-4" />,
    color: "text-emerald-400",
    trend: "STABLE",
  },
  {
    id: "AVG_CONF",
    label: "Avg Model Confidence",
    value: "91.4%",
    subValue: "YOLOv8n-CUSTOM",
    icon: <Cpu className="w-4 h-4" />,
    color: "text-violet-400",
    trend: "+0.8%",
  },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace DAILY_TREND with live daily scan results from FastAPI backend.
// Future: useEffect → fetch('/api/disease/trend?days=7') for chart data.
// ============================================================================
const DAILY_TREND = [
  { day: "May 24", infections: 4, healthy: 38, scans: 42 },
  { day: "May 25", infections: 7, healthy: 35, scans: 42 },
  { day: "May 26", infections: 3, healthy: 39, scans: 42 },
  { day: "May 27", infections: 5, healthy: 37, scans: 42 },
  { day: "May 28", infections: 8, healthy: 34, scans: 42 },
  { day: "May 29", infections: 6, healthy: 36, scans: 42 },
  { day: "May 30", infections: 9, healthy: 33, scans: 42 },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace DISEASE_CLASSES with live class distribution from FastAPI backend.
// Future: useEffect → fetch('/api/disease/classes') for pie chart breakdown.
// ============================================================================
const DISEASE_CLASSES = [
  { name: "Healthy", value: 90, color: "#34d399" },
  { name: "Leaf Spot", value: 8, color: "#f59e0b" },
  { name: "Ganoderma", value: 7, color: "#f43f5e" },
  { name: "Bud Rot", value: 3, color: "#a78bfa" },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace RECENT_DETECTIONS with live detection feed from FastAPI backend.
// Future: useEffect → fetch('/api/disease/detections?limit=8') or
//         WebSocket subscription to ws://<host>/ws/detections for real-time feed.
// ============================================================================
const RECENT_DETECTIONS = [
  { id: "DET_1247", zone: "BLK_C", class: "Ganoderma", confidence: 96.2, time: "15:04:22", severity: "critical" },
  { id: "DET_1246", zone: "BLK_C", class: "Leaf Spot", confidence: 88.7, time: "15:03:58", severity: "warning" },
  { id: "DET_1245", zone: "BLK_C", class: "Ganoderma", confidence: 94.1, time: "15:01:14", severity: "critical" },
  { id: "DET_1244", zone: "BLK_B", class: "Leaf Spot", confidence: 79.3, time: "14:58:42", severity: "warning" },
  { id: "DET_1243", zone: "BLK_C", class: "Ganoderma", confidence: 91.8, time: "14:55:09", severity: "critical" },
  { id: "DET_1242", zone: "BLK_C", class: "Bud Rot", confidence: 72.4, time: "14:52:33", severity: "warning" },
  { id: "DET_1241", zone: "BLK_A", class: "Healthy", confidence: 98.1, time: "14:50:01", severity: "nominal" },
  { id: "DET_1240", zone: "BLK_C", class: "Ganoderma", confidence: 93.6, time: "14:48:17", severity: "critical" },
];

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 shadow-xl">
      <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-sm"
            style={{ background: p.fill }}
          />
          <span className="text-[10px] font-mono text-zinc-400">
            {p.dataKey}: <span className="font-bold text-zinc-200">{p.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#a1a1aa"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", letterSpacing: "0.05em" }}
    >
      {name} ({value})
    </text>
  );
}

export default function DiseaseAIStats() {
  const severityColor = (s: string) =>
    s === "critical"
      ? "text-rose-500"
      : s === "warning"
        ? "text-amber-500"
        : "text-emerald-400";

  const severityDot = (s: string) =>
    s === "critical"
      ? "bg-rose-500"
      : s === "warning"
        ? "bg-amber-500"
        : "bg-emerald-400";

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Disease AI Analytics
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              YOLOv8n-CUSTOM // ganoderma_v3.pt // INFERENCE STATISTICS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <Cpu className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              MODEL_STATUS:
            </span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
              LOADED
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-400">
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {METRICS.map((m) => (
          <div
            key={m.id}
            className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

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
                className={`p-1.5 rounded-md bg-zinc-800 ${m.color}`}
              >
                {m.icon}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-2xl font-mono font-bold ${m.color}`}>
                {m.value}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                {m.subValue}
              </span>
              {m.trend && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-zinc-600" />
                  <span className="text-[9px] font-mono text-zinc-500">
                    {m.trend}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Bar Chart — 7-day trend (2 cols) */}
        <div className="col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

          <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Infection_Trend // Last 7 Days
            </span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
              DAILY SCAN RESULTS
            </span>
          </div>

          <div className="px-4 py-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={DAILY_TREND}
                margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(63,63,70,0.4)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{
                    fontSize: 9,
                    fill: "#52525b",
                    fontFamily: "ui-monospace, monospace",
                  }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: "#52525b",
                    fontFamily: "ui-monospace, monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar
                  dataKey="infections"
                  fill="#f43f5e"
                  radius={[2, 2, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="healthy"
                  fill="#34d399"
                  radius={[2, 2, 0, 0]}
                  barSize={18}
                  fillOpacity={0.4}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 px-5 py-2 border-t border-zinc-800/50 bg-zinc-950/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-2 rounded-sm bg-rose-500" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                Infections
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-2 rounded-sm bg-emerald-400/40" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                Healthy Scans
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart — disease class breakdown (1 col) */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

          <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Class_Breakdown
            </span>
          </div>

          <div className="px-2 py-2" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DISEASE_CLASSES}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={PieLabel}
                  strokeWidth={0}
                >
                  {DISEASE_CLASSES.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 py-2 border-t border-zinc-800/50 bg-zinc-950/30">
            {DISEASE_CLASSES.map((cls) => (
              <div key={cls.name} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: cls.color }}
                />
                <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                  {cls.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Detections Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800">
          <Bug className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Recent_Detections
          </span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
            {RECENT_DETECTIONS.length} LATEST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800/50">
                {["ID", "ZONE", "CLASS", "CONFIDENCE", "TIME", "SEVERITY"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[9px] uppercase tracking-widest text-zinc-600 font-medium"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {RECENT_DETECTIONS.map((det) => (
                <tr
                  key={det.id}
                  className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-4 py-2.5 text-[11px] font-mono text-zinc-400 font-bold">
                    {det.id}
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-mono text-zinc-500">
                    {det.zone}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold ${
                        det.class === "Ganoderma"
                          ? "text-rose-500"
                          : det.class === "Healthy"
                            ? "text-emerald-400"
                            : "text-amber-500"
                      }`}
                    >
                      {det.class}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            det.confidence > 90
                              ? "bg-emerald-400"
                              : det.confidence > 75
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${det.confidence}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                        {det.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-mono text-zinc-600">
                    {det.time}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold ${severityColor(det.severity)}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${severityDot(det.severity)} ${det.severity === "critical" ? "animate-pulse" : ""}`}
                      />
                      {det.severity === "critical"
                        ? "CRIT"
                        : det.severity === "warning"
                          ? "WARN"
                          : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          AI_ANALYTICS v1.3 // YOLOv8n // ONNX RUNTIME 1.17
        </span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          MODEL: ganoderma_v3.pt // mAP@0.5: 0.914 // CLASSES: 4
        </span>
      </div>
    </div>
  );
}
