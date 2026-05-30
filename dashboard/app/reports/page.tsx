"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileText, Download, Calendar, Thermometer, Droplets,
  Waves, Zap, CircleDot, Database, RefreshCw,
} from "lucide-react";
import { sensorApi, diseaseApi } from "@/lib/api";

const RANGES = [
  { label: "24H", hours: 24 },
  { label: "7D",  hours: 168 },
  { label: "14D", hours: 336 },
  { label: "30D", hours: 720 },
];

export default function ReportsPage() {
  const [range, setRange]       = useState(RANGES[1]);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [diseaseData, setDiseaseData] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, dRes] = await Promise.all([
        sensorApi.getHistory(range.hours),
        diseaseApi.getHistory(200),
      ]);
      setSensorData(sRes.data);
      setDiseaseData(dRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Averages
  const avg = (key: string) => sensorData.length
    ? (sensorData.reduce((a, d) => a + (d[key] || 0), 0) / sensorData.length).toFixed(1)
    : "—";

  // Chart data — sample every N points for performance
  const step = Math.max(1, Math.floor(sensorData.length / 60));
  const chartData = sensorData.filter((_, i) => i % step === 0).map(d => ({
    time:     new Date(d.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    temp:     d.temperature,
    humidity: d.humidity,
    soil:     d.soil_moisture,
    ec:       d.ec_level,
  }));

  // Disease breakdown
  const diseaseBreakdown = diseaseData.reduce((acc, d) => {
    acc[d.disease_label] = (acc[d.disease_label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // CSV export
  const exportCSV = (type: "sensors" | "disease") => {
    if (type === "sensors") {
      const headers = "timestamp,temperature,humidity,soil_moisture,ec_level\n";
      const rows = sensorData.map(d =>
        `${d.timestamp},${d.temperature},${d.humidity},${d.soil_moisture},${d.ec_level}`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url;
      a.download = `sensors_${range.label}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const headers = "id,timestamp,disease_label,confidence,severity,tree_id,block_id\n";
      const rows = diseaseData.map(d =>
        `${d.id},${d.timestamp},${d.disease_label},${d.confidence},${d.severity},${d.tree_id || ""},${d.block_id || ""}`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url;
      a.download = `disease_${new Date().toISOString().split("T")[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const SUMMARIES = [
    { label: "AVG_TEMP",  value: `${avg("temperature")}°C`,    icon: <Thermometer className="w-4 h-4" />, color: "text-amber-500"  },
    { label: "AVG_HUMID", value: `${avg("humidity")}%`,         icon: <Droplets className="w-4 h-4" />,    color: "text-sky-400"    },
    { label: "AVG_SOIL",  value: `${avg("soil_moisture")}%`,    icon: <Waves className="w-4 h-4" />,       color: "text-emerald-400"},
    { label: "AVG_EC",    value: `${avg("ec_level")} mS/cm`,    icon: <Zap className="w-4 h-4" />,         color: "text-violet-400" },
    { label: "READINGS",  value: sensorData.length.toString(),  icon: <Database className="w-4 h-4" />,    color: "text-zinc-400"   },
    { label: "DETECTIONS",value: diseaseData.length.toString(), icon: <CircleDot className="w-4 h-4" />,   color: "text-zinc-400"   },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Data Reports</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              HISTORICAL ANALYSIS // {sensorData.length} READINGS // {diseaseData.length} DETECTIONS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
            {RANGES.map(r => (
              <button key={r.label} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all ${range.label === r.label ? "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30" : "text-zinc-600 hover:text-zinc-400"}`}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {SUMMARIES.map(s => (
          <div key={s.label} className="bg-zinc-900 rounded-lg border border-zinc-800 p-3 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className={`p-1.5 rounded-md bg-zinc-800 ${s.color} mb-2 w-fit`}>{s.icon}</div>
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1">{s.label}</p>
            <p className={`text-sm font-mono font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-4 mb-6">
        {[
          { key: "temp",     label: "Temperature",  unit: "°C",    color: "#f59e0b" },
          { key: "humidity", label: "Humidity",     unit: "%",     color: "#38bdf8" },
          { key: "soil",     label: "Soil Moisture",unit: "%",     color: "#34d399" },
          { key: "ec",       label: "EC Level",     unit: "mS/cm", color: "#a78bfa" },
        ].map(chart => (
          <div key={chart.key} className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">{chart.label}_Trend // {range.label}</p>
              <span className="text-[9px] font-mono text-zinc-600">{chart.unit}</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`grad-${chart.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chart.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={chart.color} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                  <XAxis dataKey="time" tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 6)} />
                  <YAxis tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px" }} />
                  <Area type="monotone" dataKey={chart.key} stroke={chart.color} fill={`url(#grad-${chart.key})`} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Disease breakdown + export */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Disease_Breakdown</p>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(diseaseBreakdown).map(([label, count]) => {
              const pct = diseaseData.length ? Math.round((count as number / diseaseData.length) * 100) : 0;
              const colors: Record<string, string> = { healthy: "#34d399", ganoderma: "#f43f5e", unhealthy: "#f59e0b", immature: "#818cf8" };
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500">{label}</span>
                    <span className="text-[10px] font-mono text-zinc-400">{count as number} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[label] || "#71717a" }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(diseaseBreakdown).length === 0 && (
              <p className="text-[10px] text-zinc-600 text-center py-4">No detections yet</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Export_Data</p>
          </div>
          <div className="p-5 space-y-3">
            <button onClick={() => exportCSV("sensors")}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 rounded-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400">Sensor Data CSV</p>
                  <p className="text-[9px] text-zinc-600">{sensorData.length} readings // {range.label}</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
            </button>
            <button onClick={() => exportCSV("disease")}
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 rounded-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400">Disease Data CSV</p>
                  <p className="text-[9px] text-zinc-600">{diseaseData.length} detections // all time</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}