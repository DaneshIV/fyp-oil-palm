"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Bug, TreePine, ShieldCheck, Target, CircleDot, RefreshCw, Cpu } from "lucide-react";
import { diseaseApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface Detection {
  id: number; image_path: string; disease_label: string;
  confidence: number; severity: string; tree_id: string;
  block_id: string; timestamp: string;
}

const SEVERITY_CFG: Record<string, { color: string; border: string; bg: string; dot: string }> = {
  High:   { color: "text-rose-500",   border: "border-rose-500/30",   bg: "bg-rose-500/5",   dot: "bg-rose-500"   },
  Medium: { color: "text-amber-500",  border: "border-amber-500/30",  bg: "bg-amber-500/5",  dot: "bg-amber-500"  },
  Low:    { color: "text-sky-400",    border: "border-sky-400/30",    bg: "bg-sky-400/5",    dot: "bg-sky-400"    },
  None:   { color: "text-emerald-400",border: "border-emerald-500/30",bg: "bg-emerald-400/5",dot: "bg-emerald-400"},
};

const CLASS_COLORS: Record<string, string> = {
  healthy:   "#34d399",
  ganoderma: "#f43f5e",
  unhealthy: "#f59e0b",
  immature:  "#818cf8",
};

export default function DiseaseAIStats() {
  const [detections, setDetections]   = useState<Detection[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("ALL");
  const [refreshing, setRefreshing]   = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await diseaseApi.getHistory(100);
      setDetections(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  // Stats
  const total    = detections.length;
  const diseased = detections.filter(d => !["healthy", "immature"].includes(d.disease_label)).length;
  const healthy  = detections.filter(d => d.disease_label === "healthy").length;
  const avgConf  = total > 0 ? (detections.reduce((a, d) => a + d.confidence, 0) / total).toFixed(1) : "0.0";

  // Class breakdown for pie
  const classCounts = Object.entries(
    detections.reduce((acc, d) => ({ ...acc, [d.disease_label]: (acc[d.disease_label] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Last 7 days bar chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    const dayDets = detections.filter(det => new Date(det.timestamp).toDateString() === d.toDateString());
    return {
      date: dateStr,
      healthy:  dayDets.filter(d => d.disease_label === "healthy").length,
      diseased: dayDets.filter(d => !["healthy", "immature"].includes(d.disease_label)).length,
    };
  });

  const filtered = filter === "ALL" ? detections : detections.filter(d => d.disease_label === filter.toLowerCase());

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Disease AI Analytics</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              YOLOv8n v4 // mAP50: 74.6% // 4-CLASS DETECTION
            </p>
          </div>
        </div>
        <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 cursor-pointer">
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> REFRESH
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { id: "TOTAL",    label: "Total Scans",    value: total,    icon: <Target className="w-4 h-4" />,     color: "text-sky-400"    },
          { id: "DISEASED", label: "Diseased",       value: diseased, icon: <Bug className="w-4 h-4" />,        color: "text-rose-500"   },
          { id: "HEALTHY",  label: "Healthy",        value: healthy,  icon: <TreePine className="w-4 h-4" />,   color: "text-emerald-400"},
          { id: "AVG_CONF", label: "Avg Confidence", value: `${avgConf}%`, icon: <ShieldCheck className="w-4 h-4" />, color: "text-amber-500" },
        ].map(stat => (
          <div key={stat.id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
            <div className="flex items-start justify-between mb-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600">{stat.label}</p>
              <div className={`p-1.5 rounded-md bg-zinc-800 ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Bar chart */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Detection_History // Last 7 Days</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#52525b", fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px" }} />
                <Bar dataKey="healthy"  fill="#34d399" opacity={0.8} radius={[2,2,0,0]} name="Healthy"  />
                <Bar dataKey="diseased" fill="#f43f5e" opacity={0.8} radius={[2,2,0,0]} name="Diseased" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Class_Breakdown</p>
          </div>
          <div className="p-4 flex items-center gap-4">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={classCounts} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {classCounts.map((entry) => (
                    <Cell key={entry.name} fill={CLASS_COLORS[entry.name] || "#52525b"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {classCounts.map(entry => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CLASS_COLORS[entry.name] || "#52525b" }} />
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500">{entry.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detection list */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800">
          <Bug className="w-3.5 h-3.5 text-rose-500" />
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Detection_Log</p>
          <div className="ml-auto flex items-center gap-1">
            {["ALL", "Healthy", "Ganoderma", "Unhealthy", "Immature"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-[8px] uppercase tracking-widest cursor-pointer transition-all ${filter === f ? "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30" : "text-zinc-600 hover:text-zinc-400"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800/50">
                {["ID", "CLASS", "CONFIDENCE", "SEVERITY", "TREE", "BLOCK", "TIME"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[9px] uppercase tracking-widest text-zinc-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[10px] text-zinc-600">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[10px] text-zinc-600">No detections found</td></tr>
              ) : filtered.slice(0, 20).map(det => {
                const sev = SEVERITY_CFG[det.severity] || SEVERITY_CFG.None;
                return (
                  <tr key={det.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-2.5 text-[10px] font-mono text-zinc-600">#{det.id}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: CLASS_COLORS[det.disease_label] || "#71717a" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CLASS_COLORS[det.disease_label] || "#71717a" }} />
                        {det.disease_label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${det.confidence}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">{det.confidence.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${sev.color} ${sev.border} ${sev.bg}`}>
                        <span className={`w-1 h-1 rounded-full ${sev.dot}`} />{det.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] font-mono text-zinc-500">{det.tree_id || "—"}</td>
                    <td className="px-4 py-2.5 text-[10px] font-mono text-zinc-500">{det.block_id || "—"}</td>
                    <td className="px-4 py-2.5 text-[9px] font-mono text-zinc-600">
                      {formatDistanceToNow(new Date(det.timestamp))} ago
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}