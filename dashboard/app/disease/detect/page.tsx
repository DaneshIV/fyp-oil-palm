"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CircleDot,
  Crosshair,
  Eye,
  Terminal,
  ChevronRight,
  Cpu,
  Zap,
  Radio,
  AlertTriangle,
} from "lucide-react";

interface Detection {
  id: string;
  class: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  color: string;
  timestamp: string;
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace MOCK_DETECTIONS with live YOLOv8 detection results from FastAPI backend.
// Future: WebSocket subscription to ws://<host>/ws/inference for real-time
//         bounding box + class + confidence data per frame.
// ============================================================================
const MOCK_DETECTIONS: Detection[] = [
  { id: "OBJ_001", class: "Leaf_Spot", confidence: 92.4, bbox: { x: 120, y: 80, w: 95, h: 75 }, color: "#f59e0b", timestamp: "15:04:22.142" },
  { id: "OBJ_002", class: "Ganoderma", confidence: 96.1, bbox: { x: 340, y: 190, w: 110, h: 90 }, color: "#f43f5e", timestamp: "15:04:22.142" },
  { id: "OBJ_003", class: "Leaf_Spot", confidence: 87.3, bbox: { x: 480, y: 60, w: 80, h: 65 }, color: "#f59e0b", timestamp: "15:04:22.142" },
  { id: "OBJ_004", class: "Ganoderma", confidence: 94.8, bbox: { x: 200, y: 280, w: 100, h: 85 }, color: "#f43f5e", timestamp: "15:04:22.142" },
  { id: "OBJ_005", class: "Bud_Rot", confidence: 78.2, bbox: { x: 440, y: 310, w: 70, h: 60 }, color: "#a78bfa", timestamp: "15:04:22.142" },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace INFERENCE_LOG with live inference console output from FastAPI backend.
// Future: WebSocket subscription to ws://<host>/ws/inference/logs for streaming.
// ============================================================================
const INFERENCE_LOG: string[] = [
  "[YOLO] MODEL_LOAD ganoderma_v3.pt // DEVICE CPU // WARMUP 2.3s",
  "[YOLO] INPUT_SHAPE [1, 3, 640, 480] // FP32 // NCHW",
  "[CAM] STREAM_INIT /dev/video0 // RES 640x480 // FPS 15",
  "[YOLO] FRAME_001 → PRE_PROCESS 3.2ms // INFER 14.1ms // POST 1.2ms",
  "[YOLO] DETECTIONS: 5 // NMS_THRESH 0.45 // CONF_THRESH 0.25",
  "[YOLO] OBJ_001 cls:Leaf_Spot conf:0.924 bbox:[120,80,215,155]",
  "[YOLO] OBJ_002 cls:Ganoderma conf:0.961 bbox:[340,190,450,280]",
  "[YOLO] OBJ_003 cls:Leaf_Spot conf:0.873 bbox:[480,60,560,125]",
  "[YOLO] OBJ_004 cls:Ganoderma conf:0.948 bbox:[200,280,300,365]",
  "[YOLO] OBJ_005 cls:Bud_Rot conf:0.782 bbox:[440,310,510,370]",
  "[YOLO] FRAME_002 → PRE_PROCESS 2.8ms // INFER 15.4ms // POST 1.1ms",
  "[YOLO] DETECTIONS: 5 // TRACK_IDS [1,2,3,4,5]",
  "[PERF] AVG_INFER 14.8ms // FPS_EFFECTIVE 12.4 // GPU_MEM N/A",
  "[YOLO] FRAME_003 → PRE_PROCESS 3.1ms // INFER 13.9ms // POST 1.3ms",
  "[YOLO] DETECTIONS: 4 // OBJ_005 DROPPED (conf < 0.25 after track)",
  "[YOLO] FRAME_004 → PRE_PROCESS 2.9ms // INFER 14.2ms // POST 1.0ms",
  "[YOLO] OBJ_005 RE-ACQUIRED conf:0.812 bbox:[442,308,514,372]",
  "[TRACK] KALMAN_UPDATE 5 objects // AVG_IoU 0.87",
  "[YOLO] FRAME_005 → PRE_PROCESS 3.0ms // INFER 15.1ms // POST 1.2ms",
  "[YOLO] DETECTIONS: 5 // ALL TRACKS STABLE",
  "[PERF] HEAP_USED 234MB // TENSOR_ALLOC 89MB // GC_PAUSE 0.4ms",
  "[YOLO] FRAME_006 → PRE_PROCESS 2.7ms // INFER 14.6ms // POST 1.1ms",
  "[ALERT] HIGH_CONF_GANODERMA OBJ_002 conf:0.961 → FLAGGED",
  "[MQTT] PUB topic/alert/disease {zone:'BLK_C',class:'Ganoderma',conf:0.96}",
  "[YOLO] FRAME_007 → PRE_PROCESS 3.3ms // INFER 13.8ms // POST 1.4ms",
];

export default function DiseaseDetectPage() {
  const [inferenceActive, setInferenceActive] = useState(true);
  const [cycleCount, setCycleCount] = useState(882);
  const [inferenceTime, setInferenceTime] = useState(18);
  // ============================================================================
  // MOCK DATA — INTEGRATION POINT
  // Replace logLines local state with live inference log stream from FastAPI.
  // Future: WebSocket subscription to ws://<host>/ws/inference/logs.
  // ============================================================================
  const [logLines, setLogLines] = useState<string[]>(INFERENCE_LOG.slice(0, 10));
  const logRef = useRef<HTMLDivElement>(null);
  const logIndexRef = useRef(10);
  const [activeBBoxIndex, setActiveBBoxIndex] = useState(0);

  useEffect(() => {
    if (!inferenceActive) return;

    const cycleInterval = setInterval(() => {
      setCycleCount((c) => c + 1);
      setInferenceTime(Math.floor(14 + Math.random() * 8));
      setActiveBBoxIndex((i) => (i + 1) % MOCK_DETECTIONS.length);
    }, 1500);

    return () => clearInterval(cycleInterval);
  }, [inferenceActive]);

  useEffect(() => {
    if (!inferenceActive) return;

    const logInterval = setInterval(() => {
      const nextIdx = logIndexRef.current % INFERENCE_LOG.length;
      setLogLines((prev) => [...prev.slice(-60), INFERENCE_LOG[nextIdx]]);
      logIndexRef.current++;
    }, 800);

    return () => clearInterval(logInterval);
  }, [inferenceActive]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  const colorize = (line: string) => {
    if (line.startsWith("[ALERT]")) return "text-rose-500";
    if (line.startsWith("[YOLO]") && line.includes("DETECTIONS"))
      return "text-emerald-400";
    if (line.startsWith("[YOLO]") && line.includes("OBJ_"))
      return "text-amber-400/80";
    if (line.startsWith("[YOLO]")) return "text-violet-400/80";
    if (line.startsWith("[PERF]")) return "text-sky-400/60";
    if (line.startsWith("[TRACK]")) return "text-cyan-400/60";
    if (line.startsWith("[CAM]")) return "text-emerald-400/60";
    if (line.startsWith("[MQTT]")) return "text-cyan-400/60";
    return "text-zinc-500";
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-rose-500" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Disease Detection — Live Inference
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              YOLOv8n // ganoderma_v3.pt // REAL-TIME FIELD TESTING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Inference time badge */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <Zap className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              INFERENCE_TIME:
            </span>
            <span className="text-[10px] font-mono font-bold text-violet-400 tabular-nums">
              {inferenceTime}ms
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
            <Camera className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              FRAME:
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums">
              #{cycleCount}
            </span>
          </div>

          <button
            onClick={() => setInferenceActive(!inferenceActive)}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-bold
              border transition-all duration-300 cursor-pointer
              ${
                inferenceActive
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-500 hover:bg-rose-500/20"
                  : "bg-emerald-400/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20"
              }
            `}
          >
            {inferenceActive ? (
              <>
                <CircleDot className="w-3 h-3 animate-pulse" />
                STOP
              </>
            ) : (
              <>
                <Radio className="w-3 h-3" />
                START
              </>
            )}
          </button>
        </div>
      </div>

      {/* Split Screen */}
      <div className="grid grid-cols-2 gap-3" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* LEFT — Mock Webcam Viewport */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden flex flex-col">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

          {/* Viewport header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 shrink-0">
            <Camera className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Webcam_Feed
            </span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
              /dev/video0 // 640×480 // 15FPS
            </span>
            <CircleDot className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
          </div>

          {/* Mock viewport canvas */}
          <div className="flex-1 relative bg-zinc-950 m-3 rounded border border-zinc-800 overflow-hidden">
            {/* Simulated field background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 40%, rgba(22,101,52,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(22,101,52,0.1) 0%, transparent 50%), linear-gradient(180deg, rgba(9,9,11,0.3) 0%, rgba(9,9,11,0.6) 100%)",
              }}
            />

            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(63,63,70,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.3) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Crosshair center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Crosshair className="w-8 h-8 text-zinc-700/40" />
            </div>

            {/* YOLO Bounding Boxes */}
            {MOCK_DETECTIONS.map((det, idx) => {
              const isActive = idx === activeBBoxIndex;
              const scaleX = 100 / 640;
              const scaleY = 100 / 480;
              return (
                <div
                  key={det.id}
                  className="absolute transition-all duration-300"
                  style={{
                    left: `${det.bbox.x * scaleX}%`,
                    top: `${det.bbox.y * scaleY}%`,
                    width: `${det.bbox.w * scaleX}%`,
                    height: `${det.bbox.h * scaleY}%`,
                  }}
                >
                  {/* Bounding box */}
                  <div
                    className={`absolute inset-0 border-2 rounded-sm transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}
                    style={{
                      borderColor: det.color,
                      boxShadow: isActive
                        ? `0 0 12px ${det.color}40, inset 0 0 8px ${det.color}10`
                        : "none",
                    }}
                  />

                  {/* Corner brackets */}
                  <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: det.color }} />
                  <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: det.color }} />
                  <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: det.color }} />
                  <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: det.color }} />

                  {/* Label */}
                  <div
                    className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-sm text-[8px] font-mono font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{
                      backgroundColor: `${det.color}cc`,
                      color: "#fff",
                    }}
                  >
                    {det.class} {det.confidence.toFixed(1)}%
                  </div>
                </div>
              );
            })}

            {/* Viewport HUD overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="text-[9px] font-mono text-rose-500 font-bold bg-zinc-950/80 px-2 py-0.5 rounded">
                ● REC
              </span>
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded">
                640×480
              </span>
            </div>

            <div className="absolute top-3 right-3">
              <span className="text-[9px] font-mono text-emerald-400 bg-zinc-950/80 px-2 py-0.5 rounded tabular-nums">
                FRM #{cycleCount}
              </span>
            </div>

            <div className="absolute bottom-3 left-3">
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded">
                BLK_C // SECTOR 4
              </span>
            </div>

            <div className="absolute bottom-3 right-3">
              <span className="text-[9px] font-mono text-violet-400 bg-zinc-950/80 px-2 py-0.5 rounded tabular-nums">
                INFER {inferenceTime}ms
              </span>
            </div>
          </div>

          {/* Viewport footer */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-zinc-800 shrink-0 bg-zinc-950/30">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold">
                {MOCK_DETECTIONS.length} DETECTIONS
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
              NMS: 0.45 // CONF_THRESH: 0.25
            </span>
          </div>
        </div>

        {/* RIGHT — Detection List + Raw Coordinates */}
        <div className="flex flex-col gap-3">
          {/* Detection List */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden flex-1">
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800">
              <Crosshair className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Detection_List
              </span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
                LIVE TRACKING
              </span>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 320 }}>
              {MOCK_DETECTIONS.map((det, idx) => {
                const isActive = idx === activeBBoxIndex;
                return (
                  <div
                    key={det.id}
                    className={`
                      bg-zinc-950 rounded border p-3 transition-all duration-300
                      ${isActive ? "border-zinc-600 shadow-lg" : "border-zinc-800"}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: det.color }}
                        />
                        <span className="text-[10px] font-mono font-bold text-zinc-300">
                          {det.id}
                        </span>
                      </div>
                      <span
                        className="text-[9px] font-mono font-bold uppercase tracking-widest"
                        style={{ color: det.color }}
                      >
                        {det.class}
                      </span>
                    </div>

                    {/* Confidence bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-600 w-8">
                        CONF
                      </span>
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${det.confidence}%`,
                            background: det.color,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-mono tabular-nums text-zinc-400 w-10 text-right">
                        {det.confidence}%
                      </span>
                    </div>

                    {/* Bbox coordinates */}
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-600">
                        BBOX
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600">
                        [{det.bbox.x}, {det.bbox.y}, {det.bbox.x + det.bbox.w},{" "}
                        {det.bbox.y + det.bbox.h}]
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw Coordinates Terminal */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden" style={{ minHeight: 240 }}>
            <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Inference_Console
              </span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 ml-auto">
                STDOUT
              </span>
              <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            </div>

            <div
              ref={logRef}
              className="overflow-y-auto p-3 space-y-0.5 bg-zinc-950/50"
              style={{ maxHeight: 200 }}
            >
              {logLines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[8px] font-mono text-zinc-700 select-none shrink-0 w-6 text-right tabular-nums">
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span
                    className={`text-[10px] font-mono leading-relaxed ${colorize(line)}`}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 py-1.5 border-t border-zinc-800 flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-mono text-zinc-600 animate-pulse">
                _
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          DETECT_ENGINE v2.0 // ONNX 1.17 // OPENCV 4.9
        </span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-700">
          CYCLE: 1.5s // TOTAL_FRAMES: {cycleCount} // IRIV_AGRIBOX_01
        </span>
      </div>
    </div>
  );
}
