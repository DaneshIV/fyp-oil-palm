"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  Download,
  Calendar,
  Thermometer,
  Droplets,
  Waves,
  Zap,
  CircleDot,
  Database,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  ChevronUp,
  Table2,
} from "lucide-react";

interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  trend: "up" | "down" | "stable";
  trendValue: string;
  status: "nominal" | "warning" | "critical";
}

interface LogEntry {
  id: string;
  timestamp: string;
  date: string;
  temp: number;
  humidity: number;
  soilMoisture: number;
  ec: number;
  status: "OK" | "WARN" | "CRIT";
}

function generateTrendData(days: number) {
  const data: { label: string; temp: number; humidity: number; soil: number; ec: number }[] = [];
  let t = 30.2, h = 66, s = 52, e = 1.8;

  for (let i = 0; i < days * 4; i++) {
    t += (Math.random() - 0.48) * 0.6;
    h += (Math.random() - 0.5) * 2.5;
    s += (Math.random() - 0.52) * 1.8;
    e += (Math.random() - 0.48) * 0.06;
    t = Math.max(24, Math.min(38, t));
    h = Math.max(40, Math.min(95, h));
    s = Math.max(25, Math.min(85, s));
    e = Math.max(0.4, Math.min(3.5, e));

    const dayNum = Math.floor(i / 4);
    const period = ["00:00", "06:00", "12:00", "18:00"][i % 4];
    data.push({
      label: days <= 1 ? period : `D${dayNum + 1} ${period}`,
      temp: parseFloat(t.toFixed(1)),
      humidity: parseFloat(h.toFixed(1)),
      soil: parseFloat(s.toFixed(1)),
      ec: parseFloat(e.toFixed(2)),
    });
  }
  return data;
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace generateLogEntries with live sensor log data from FastAPI backend.
// Future: useEffect → fetch('/api/reports/logs?limit=40') for table data,
//         or fetch('/api/reports/export?format=csv') for CSV download.
// ============================================================================
function generateLogEntries(count: number): LogEntry[] {
  const entries: LogEntry[] = [];
  const baseDate = new Date(2025, 4, 30, 15, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate.getTime() - i * 300000);
    const temp = parseFloat((28 + Math.random() * 6).toFixed(1));
    const hum = parseFloat((55 + Math.random() * 30).toFixed(1));
    const soil = parseFloat((35 + Math.random() * 40).toFixed(1));
    const ec = parseFloat((0.6 + Math.random() * 2.2).toFixed(2));

    let status: LogEntry["status"] = "OK";
    if (temp > 35 || temp < 22 || soil < 40 || ec < 1.0 || ec > 3.0) status = "CRIT";
    else if (hum > 85 || hum < 55 || soil < 45) status = "WARN";

    entries.push({
      id: `LOG_${String(4200 - i).padStart(4, "0")}`,
      timestamp: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      date: d.toISOString().split("T")[0],
      temp,
      humidity: hum,
      soilMoisture: soil,
      ec,
      status,
    });
  }
  return entries;
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace SUMMARY_METRICS with live aggregated stats from FastAPI backend.
// Future: useEffect → fetch('/api/reports/summary?range=7d') for metric cards.
// ============================================================================
const SUMMARY_METRICS: SummaryMetric[] = [
  {
    id: "AVG_TEMP",
    label: "Avg Temperature",
    value: "31.2",
    unit: "°C",
    icon: <Thermometer className="w-4 h-4" />,
    color: "text-amber-500",
    trend: "up",
    trendValue: "+0.8°C",
    status: "nominal",
  },
  {
    id: "AVG_HUMID",
    label: "Avg Humidity",
    value: "67.4",
    unit: "%",
    icon: <Droplets className="w-4 h-4" />,
    color: "text-sky-400",
    trend: "down",
    trendValue: "-2.1%",
    status: "nominal",
  },
  {
    id: "AVG_SOIL",
    label: "Avg Soil Moisture",
    value: "48.6",
    unit: "%",
    icon: <Waves className="w-4 h-4" />,
    color: "text-emerald-400",
    trend: "down",
    trendValue: "-4.2%",
    status: "warning",
  },
  {
    id: "AVG_EC",
    label: "Avg EC",
    value: "1.74",
    unit: "mS/cm",
    icon: <Zap className="w-4 h-4" />,
    color: "text-violet-400",
    trend: "stable",
    trendValue: "±0.02",
    status: "nominal",
  },
];

const statusColor = (s: SummaryMetric["status"]) =>
  s === "nominal" ? "text-emerald-400" : s === "warning" ? "text-amber-500" : "text-rose-500";

const statusBorder = (s: SummaryMetric["status"]) =>
  s === "nominal" ? "border-zinc-800" : s === "warning" ? "border-amber-500/30" : "border-rose-500/30";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 shadow-xl">
      <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[10px] font-mono font-bold text-zinc-300">
          <span style={{ color: p.color }} className="mr-2">●</span>
          {p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("7");
  const [sortCol, setSortCol] = useState<string>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tableExpanded, setTableExpanded] = useState(true);

  const DATE_OPTIONS = [
    { label: "1D", value: "1" },
    { label: "7D", value: "7" },
    { label: "14D", value: "14" },
    { label: "30D", value: "30" },
  ];

  // ============================================================================
  // MOCK DATA — INTEGRATION POINT
  // Replace trendData with live sensor trend data from FastAPI backend.
  // Future: useEffect → fetch(`/api/reports/trend?days=${dateRange}`) for chart.
  // ============================================================================
  const trendData = useMemo(() => generateTrendData(parseInt(dateRange)), [dateRange]);
  // ============================================================================
  // MOCK DATA — INTEGRATION POINT
  // Replace logEntries with live sensor log records from FastAPI backend.
  // Future: useEffect → fetch('/api/reports/logs?limit=40') for table data.
  // ============================================================================
  const logEntries = useMemo(() => generateLogEntries(40), []);

  const sortedEntries = useMemo(() => {
    const sorted = [...logEntries];
    sorted.sort((a, b) => {
      const key = sortCol as keyof LogEntry;
      const va = a[key];
      const vb = b[key];
      if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return sorted;
  }, [logEntries, sortCol, sortDir]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) =>
    trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : trend === "down" ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />;

  const logStatusColor = (s: LogEntry["status"]) =>
    s === "OK" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" : s === "WARN" ? "text-amber-500 bg-amber-500/10 border-amber-500/30" : "text-rose-500 bg-rose-500/10 border-rose-500/30";

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Data Reports & Export
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // HISTORICAL DATA AUDIT // SENSOR TREND ANALYSIS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              PERIOD:
            </span>
          </div>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
            {DATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer border-r border-zinc-800 last:border-r-0 ${
                  dateRange === opt.value
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button className="flex items-center gap-2 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 px-4 py-1.5 rounded-md transition-all cursor-pointer group">
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
              EXPORT_CSV_RAW
            </span>
          </button>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-400">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {SUMMARY_METRICS.map((metric) => (
          <div
            key={metric.id}
            className={`bg-zinc-900 rounded-lg border ${statusBorder(metric.status)} relative overflow-hidden`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            {metric.status !== "nominal" && (
              <div className={`absolute inset-x-0 top-0 h-0.5 ${metric.status === "warning" ? "bg-amber-500" : "bg-rose-500"} animate-pulse`} />
            )}

            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${metric.status === "nominal" ? "bg-zinc-800 text-zinc-500" : "bg-amber-500/10 text-amber-500"}`}>
                    {metric.icon}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    {metric.label}
                  </p>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600">{metric.id}</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <span className={`text-2xl font-mono font-bold ${metric.color}`}>
                    {metric.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 ml-1">
                    {metric.unit}
                  </span>
                </div>
                <div className={`flex items-center gap-1 ${
                  metric.trend === "up" ? "text-amber-500" : metric.trend === "down" ? "text-sky-400" : "text-zinc-500"
                }`}>
                  <TrendIcon trend={metric.trend} />
                  <span className="text-[10px] font-bold tabular-nums">{metric.trendValue}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sensor trend chart */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden mb-4">
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                Sensor Trend Summary
              </p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                MULTI_CHANNEL STABILITY VIEW // {dateRange}-DAY WINDOW
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">TEMP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">HUMID</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">SOIL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">EC</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradHumid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSoil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.5)" />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={{ stroke: "#3f3f46" }} interval={Math.max(1, Math.floor(trendData.length / 8))} />
              <YAxis tick={{ fill: "#71717a", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#gradTemp)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="humidity" stroke="#38bdf8" fill="url(#gradHumid)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="soil" stroke="#34d399" fill="url(#gradSoil)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="ec" stroke="#a78bfa" fill="url(#gradEC)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                Data Table
              </p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600">
                RAW_SENSOR_LOG // {sortedEntries.length} RECORDS // SORT: {sortCol.toUpperCase()} {sortDir.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 tabular-nums">
              {sortedEntries.length} ROWS
            </span>
            <button
              onClick={() => setTableExpanded(!tableExpanded)}
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {tableExpanded ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
            </button>
          </div>
        </div>

        {tableExpanded && (
          <div className="overflow-auto" style={{ maxHeight: 360 }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  {[
                    { key: "id", label: "LOG_ID" },
                    { key: "timestamp", label: "TIMESTAMP" },
                    { key: "temp", label: "TEMP (°C)" },
                    { key: "humidity", label: "HUMID (%)" },
                    { key: "soilMoisture", label: "SOIL (%)" },
                    { key: "ec", label: "EC (mS/cm)" },
                    { key: "status", label: "STATUS" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left text-[9px] uppercase tracking-widest text-zinc-500 font-bold px-3 py-2.5 cursor-pointer hover:text-zinc-300 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortCol === col.key && (
                          sortDir === "asc" ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-3 py-1.5 text-[10px] text-zinc-500 tabular-nums">{entry.id}</td>
                    <td className="px-3 py-1.5 text-[10px] text-zinc-400 tabular-nums">{entry.date} {entry.timestamp}</td>
                    <td className={`px-3 py-1.5 text-[10px] font-bold tabular-nums ${entry.temp > 35 || entry.temp < 22 ? "text-rose-500" : "text-amber-500"}`}>{entry.temp}</td>
                    <td className={`px-3 py-1.5 text-[10px] font-bold tabular-nums ${entry.humidity > 85 || entry.humidity < 55 ? "text-amber-500" : "text-sky-400"}`}>{entry.humidity}</td>
                    <td className={`px-3 py-1.5 text-[10px] font-bold tabular-nums ${entry.soilMoisture < 40 ? "text-rose-500" : "text-emerald-400"}`}>{entry.soilMoisture}</td>
                    <td className={`px-3 py-1.5 text-[10px] font-bold tabular-nums ${entry.ec < 1.0 || entry.ec > 3.0 ? "text-rose-500" : "text-violet-400"}`}>{entry.ec}</td>
                    <td className="px-3 py-1.5">
                      <span className={`text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${logStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
