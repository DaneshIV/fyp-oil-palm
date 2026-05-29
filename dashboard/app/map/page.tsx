"use client";

import React, { useState } from "react";
import {
  TreePine,
  X,
  MapPin,
  Droplets,
  FlaskConical,
  Bug,
  Thermometer,
  Layers,
  Satellite,
} from "lucide-react";

type ZoneStatus = "optimal" | "warning" | "infected";

interface Block {
  id: string;
  label: string;
  status: ZoneStatus;
  trees: number;
  gridCol: string;
  gridRow: string;
  telemetry: {
    soilMoisture: number;
    npkN: number;
    npkP: number;
    npkK: number;
    temperature: number;
    humidity: number;
    ec: number;
    lat: string;
    lng: string;
    lastScan: string;
    detections: number;
    confidence: number;
  };
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace BLOCKS with live zone/block data from FastAPI backend.
// Future: useEffect → fetch('/api/zones') for initial load,
//         WebSocket subscription to ws://<host>/ws/zones for real-time updates.
// ============================================================================
const BLOCKS: Block[] = [
  {
    id: "BLK_A",
    label: "Block-A",
    status: "optimal",
    trees: 48,
    gridCol: "1 / 3",
    gridRow: "1 / 3",
    telemetry: {
      soilMoisture: 72,
      npkN: 42,
      npkP: 18,
      npkK: 31,
      temperature: 28.4,
      humidity: 78,
      ec: 1.8,
      lat: "3.1390°N",
      lng: "101.6869°E",
      lastScan: "2026-05-30T14:20:00Z",
      detections: 0,
      confidence: 0,
    },
  },
  {
    id: "BLK_B",
    label: "Block-B",
    status: "warning",
    trees: 36,
    gridCol: "3 / 5",
    gridRow: "1 / 2",
    telemetry: {
      soilMoisture: 38,
      npkN: 21,
      npkP: 12,
      npkK: 15,
      temperature: 34.1,
      humidity: 52,
      ec: 0.9,
      lat: "3.1395°N",
      lng: "101.6882°E",
      lastScan: "2026-05-30T14:18:00Z",
      detections: 0,
      confidence: 0,
    },
  },
  {
    id: "BLK_C",
    label: "Block-C",
    status: "infected",
    trees: 24,
    gridCol: "3 / 5",
    gridRow: "2 / 3",
    telemetry: {
      soilMoisture: 55,
      npkN: 35,
      npkP: 16,
      npkK: 22,
      temperature: 30.2,
      humidity: 68,
      ec: 1.4,
      lat: "3.1402°N",
      lng: "101.6891°E",
      lastScan: "2026-05-30T14:22:00Z",
      detections: 7,
      confidence: 94.2,
    },
  },
];

const statusConfig: Record<ZoneStatus, { border: string; bg: string; text: string; glow: string; label: string; dot: string }> = {
  optimal: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-400/5",
    text: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.12)]",
    label: "OPTIMAL",
    dot: "bg-emerald-400",
  },
  warning: {
    border: "border-amber-500/50",
    bg: "bg-amber-400/5",
    text: "text-amber-500",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.12)]",
    label: "LOW_MOISTURE",
    dot: "bg-amber-500",
  },
  infected: {
    border: "border-rose-500/50",
    bg: "bg-rose-400/5",
    text: "text-rose-500",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    label: "GANODERMA_DETECTED",
    dot: "bg-rose-500",
  },
};

function TreeGrid({ count, status }: { count: number; status: ZoneStatus }) {
  const rows = Math.ceil(count / 6);
  const color =
    status === "optimal"
      ? "text-emerald-700"
      : status === "warning"
        ? "text-amber-700"
        : "text-rose-700";

  return (
    <div className="flex flex-wrap gap-[3px] justify-center my-2">
      {Array.from({ length: Math.min(count, rows * 6) }).map((_, i) => (
        <TreePine
          key={i}
          className={`w-[10px] h-[10px] ${color} ${status === "infected" && i % 4 === 0 ? "text-rose-500 animate-pulse" : ""}`}
        />
      ))}
    </div>
  );
}

function TelemetryOverlay({
  block,
  onClose,
}: {
  block: Block;
  onClose: () => void;
}) {
  const cfg = statusConfig[block.status];
  const t = block.telemetry;

  const rows: { label: string; value: string; color?: string }[] = [
    { label: "SOIL_MOIST", value: `${t.soilMoisture}%`, color: t.soilMoisture < 40 ? "text-amber-500" : "text-emerald-400" },
    { label: "NPK_N", value: `${t.npkN} mg/kg` },
    { label: "NPK_P", value: `${t.npkP} mg/kg` },
    { label: "NPK_K", value: `${t.npkK} mg/kg` },
    { label: "TEMP", value: `${t.temperature}°C`, color: t.temperature > 33 ? "text-amber-500" : undefined },
    { label: "HUMIDITY", value: `${t.humidity}%` },
    { label: "EC", value: `${t.ec} mS/cm`, color: t.ec < 1.0 ? "text-amber-500" : undefined },
    { label: "LAT", value: t.lat },
    { label: "LNG", value: t.lng },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-zinc-500" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            Telemetry_Data
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Block ID */}
      <div className="px-5 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${block.status === "infected" ? "animate-pulse" : ""}`} />
          <div>
            <p className="text-sm font-mono font-bold text-zinc-200">
              {block.id}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
              {block.label} // {block.trees} PALMS // STATUS: {cfg.label}
            </p>
          </div>
        </div>
      </div>

      {/* Telemetry rows */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-3">
            Sensor Readout
          </p>
          <div className="space-y-1">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between py-2 px-3 rounded bg-zinc-950 border border-zinc-800"
              >
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {r.label}
                </span>
                <span
                  className={`text-sm font-mono font-bold ${r.color || "text-zinc-300"}`}
                >
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detection panel (infected only) */}
        {block.status === "infected" && (
          <div className="px-5 py-3 border-t border-zinc-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="w-3.5 h-3.5 text-rose-500" />
              <p className="text-[9px] uppercase tracking-widest text-rose-500 font-bold">
                YOLOv8 Detection Alert
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2 px-3 rounded bg-rose-500/5 border border-rose-500/20">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  DETECTIONS
                </span>
                <span className="text-sm font-mono font-bold text-rose-500">
                  {t.detections}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded bg-rose-500/5 border border-rose-500/20">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  AVG_CONF
                </span>
                <span className="text-sm font-mono font-bold text-rose-500">
                  {t.confidence}%
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded bg-rose-500/5 border border-rose-500/20">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  MODEL
                </span>
                <span className="text-[11px] font-mono text-rose-400">
                  ganoderma_v3.pt
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scan timestamp */}
        <div className="px-5 py-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-600">
            <Layers className="w-3 h-3" />
            <span>
              Last scan:{" "}
              {new Date(t.lastScan).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IsometricMap() {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Plantation Spatial Overview
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              3-BLOCK ISOMETRIC GRID // GPS-REGISTERED ZONES
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5">
          {(["optimal", "warning", "infected"] as ZoneStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusConfig[s].dot} ${s === "infected" ? "animate-pulse" : ""}`} />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">
                {statusConfig[s].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Isometric Container */}
      <div className="flex justify-center items-center py-12">
        <div
          className="relative"
          style={{
            perspective: "1200px",
          }}
        >
          <div
            className="grid grid-cols-4 grid-rows-2 gap-3"
            style={{
              transform: "rotateX(55deg) rotateZ(-45deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {BLOCKS.map((block) => {
              const cfg = statusConfig[block.status];
              return (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlock(block)}
                  className={`
                    relative cursor-pointer transition-all duration-500
                    ${cfg.bg} ${cfg.border} ${cfg.glow}
                    border rounded-sm
                    hover:scale-105
                  `}
                  style={{
                    gridColumn: block.gridCol,
                    gridRow: block.gridRow,
                    width: block.gridCol === "1 / 3" ? "280px" : "145px",
                    height: block.gridRow === "1 / 3" ? "280px" : "145px",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Elevated surface */}
                  <div
                    className={`
                      absolute inset-0 rounded-sm border ${cfg.border}
                      ${cfg.bg} backdrop-blur-sm
                    `}
                    style={{
                      transform: "translateZ(20px)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Top machined edge */}
                    <div className="absolute inset-x-0 top-0 h-px bg-white/5 rounded-t-sm" />

                    {/* Block label */}
                    <div className="absolute top-3 left-3">
                      <p className={`text-[10px] uppercase tracking-widest font-bold ${cfg.text}`}>
                        {block.id}
                      </p>
                      <p className="text-[8px] uppercase tracking-widest text-zinc-600 mt-0.5">
                        {block.trees} PALMS
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 text-[8px] uppercase tracking-widest font-bold ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${block.status === "infected" ? "animate-pulse" : ""}`} />
                        {cfg.label.split("_")[0]}
                      </span>
                    </div>

                    {/* Tree cluster */}
                    <div className="absolute inset-0 flex items-center justify-center pt-6">
                      <TreeGrid count={block.trees} status={block.status} />
                    </div>

                    {/* Quick stats */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-zinc-600" />
                        <span className={`text-[9px] font-mono ${block.telemetry.soilMoisture < 40 ? "text-amber-500" : "text-zinc-500"}`}>
                          {block.telemetry.soilMoisture}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-zinc-600" />
                        <span className="text-[9px] font-mono text-zinc-500">
                          {block.telemetry.temperature}°C
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FlaskConical className="w-3 h-3 text-zinc-600" />
                        <span className={`text-[9px] font-mono ${block.telemetry.ec < 1.0 ? "text-amber-500" : "text-zinc-500"}`}>
                          {block.telemetry.ec}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Side walls for 3D depth */}
                  {/* Right wall */}
                  <div
                    className={`absolute top-0 rounded-sm ${block.status === "optimal" ? "bg-emerald-900/30" : block.status === "warning" ? "bg-amber-900/30" : "bg-rose-900/30"} border-r ${cfg.border}`}
                    style={{
                      right: "-1px",
                      width: "20px",
                      height: "100%",
                      transform: "rotateY(90deg)",
                      transformOrigin: "right",
                    }}
                  />
                  {/* Bottom wall */}
                  <div
                    className={`absolute left-0 rounded-sm ${block.status === "optimal" ? "bg-emerald-900/20" : block.status === "warning" ? "bg-amber-900/20" : "bg-rose-900/20"} border-b ${cfg.border}`}
                    style={{
                      bottom: "-1px",
                      width: "100%",
                      height: "20px",
                      transform: "rotateX(-90deg)",
                      transformOrigin: "bottom",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Grid floor pattern */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              transform: "rotateX(55deg) rotateZ(-45deg) translateZ(-5px)",
              backgroundImage:
                "linear-gradient(rgba(63,63,70,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.15) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              width: "600px",
              height: "400px",
              marginLeft: "-20px",
              marginTop: "-20px",
            }}
          />
        </div>
      </div>

      {/* Click instruction */}
      <div className="text-center mt-4">
        <p className="text-[9px] uppercase tracking-widest text-zinc-600">
          Click a zone block to inspect telemetry data
        </p>
      </div>

      {/* Telemetry Overlay */}
      {selectedBlock && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedBlock(null)}
          />
          <TelemetryOverlay
            block={selectedBlock}
            onClose={() => setSelectedBlock(null)}
          />
        </>
      )}
    </div>
  );
}
