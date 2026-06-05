"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera, CircleDot, Eye, Terminal, ChevronRight,
  Cpu, Upload, RefreshCw, X, AlertTriangle,
} from "lucide-react";

const CLASS_COLORS: Record<string, string> = {
  healthy:   "#34d399",
  ganoderma: "#f43f5e",
  unhealthy: "#f59e0b",
  immature:  "#818cf8",
};

const SEVERITY_LABELS: Record<string, string> = {
  healthy:   "NONE",
  ganoderma: "HIGH",
  unhealthy: "MEDIUM",
  immature:  "LOW",
};

const API_BASE = typeof window !== "undefined"
  ? (window.location.hostname === "localhost" ? "http://localhost:8000" : "https://api.project2030.me")
  : "http://localhost:8000";

function getToken() {
  if (typeof document === "undefined") return "";
  return document.cookie.match(/auth_token=([^;]+)/)?.[1] || "";
}

interface Detection {
  label: string; confidence: number; severity: string; bbox: number[];
}

export default function DiseaseDetectPage() {
  const [mode, setMode]             = useState<"upload" | "webcam">("upload");
  const [detecting, setDetecting]   = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [resultImg, setResultImg]   = useState<string | null>(null);
  const [logs, setLogs]             = useState<string[]>([
    "[BOOT] YOLOv8n v4 model initialized",
    "[MODEL] best_v4.pt // mAP50: 74.6% // 4-class",
    "[CONFIG] conf=0.50 iou=0.45",
    "[READY] Awaiting input...",
  ]);
  const [error, setError]           = useState("");
  const [camIndex, setCamIndex]     = useState("9");
  const [liveActive, setLiveActive] = useState(false);
  const fileRef    = useRef<HTMLInputElement>(null);
  const liveRef    = useRef<NodeJS.Timeout | null>(null);
  const frameCount = useRef(0);
  const logRef     = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-49), msg]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  }, []);

  const runInference = useCallback(async (fileOrBlob: File | Blob, name = "image.jpg") => {
    setDetecting(true);
    setError("");
    setDetections([]);
    const start = Date.now();
    addLog(`[INPUT] ${name} // ${(fileOrBlob.size / 1024).toFixed(1)}KB`);
    addLog("[PREPROCESS] Resizing to 640×640...");

    try {
      const formData = new FormData();
      formData.append("file", fileOrBlob, name);

      const res = await fetch(`${API_BASE}/disease/detect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      const data = await res.json();
      const elapsed = Date.now() - start;

      if (!data.success) {
        throw new Error(data.error || "Inference failed");
      }

      const dets: Detection[] = data.detections || [];
      setDetections(dets);

      addLog(`[INFERENCE] Complete in ${elapsed}ms`);
      addLog(`[RESULT] ${dets.length} detection${dets.length !== 1 ? "s" : ""} found`);

      if (dets.length > 0) {
        dets.forEach(d => {
          const sev = SEVERITY_LABELS[d.label] || "UNKNOWN";
          addLog(`[DET] ${d.label.toUpperCase()} conf:${d.confidence.toFixed(1)}% sev:${sev}`);
        });
      } else {
        addLog("[DET] No objects above confidence threshold (0.50)");
        addLog("[HINT] Try a clearer image of oil palm leaf/trunk");
      }

      // Show annotated image from backend
      if (data.image_base64) {
        const imgSrc = `data:image/jpeg;base64,${data.image_base64}`;
        setResultImg(imgSrc);
        addLog("[IMG] Annotated frame received with bounding boxes");
      } else {
        // Fallback: show original
        const url = URL.createObjectURL(fileOrBlob);
        setResultImg(prev => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return url; });
        addLog("[IMG] Showing original (no annotation available)");
      }

    } catch (err: any) {
      const msg = err.message || "Unknown error";
      setError(msg);
      addLog(`[ERROR] ${msg}`);
    } finally {
      setDetecting(false);
    }
  }, [addLog]);

  // Live webcam — fetches frame from camera endpoint
  const captureLiveFrame = useCallback(async () => {
    frameCount.current++;
    try {
      const res = await fetch(`${API_BASE}/cameras/${camIndex}/frame`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      if (!res.ok) { addLog(`[ERROR] Camera ${camIndex} offline`); return; }
      const plantCount = res.headers.get("X-Plant-Count") || "0";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultImg(prev => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return url; });
      addLog(`[FRAME] #${frameCount.current} // ${plantCount} plants detected`);
      // Run disease inference on this frame
      await runInference(blob, `frame_${frameCount.current}.jpg`);
    } catch { addLog("[ERROR] Frame capture failed"); }
  }, [camIndex, addLog, runInference]);

  useEffect(() => {
    if (liveActive && mode === "webcam") {
      captureLiveFrame();
      liveRef.current = setInterval(captureLiveFrame, 3000);
    } else {
      if (liveRef.current) clearInterval(liveRef.current);
    }
    return () => { if (liveRef.current) clearInterval(liveRef.current); };
  }, [liveActive, mode, captureLiveFrame]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) runInference(f, f.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith("image/")) runInference(f, f.name);
  };

  const getLogColor = (line: string) => {
    if (line.includes("[ERROR]"))  return "text-rose-500";
    if (line.includes("[DET]"))    return "text-violet-400";
    if (line.includes("[RESULT]")) return "text-emerald-400";
    if (line.includes("[INFER"))   return "text-sky-400/80";
    if (line.includes("[MODEL]") || line.includes("[BOOT]") || line.includes("[READY]")) return "text-emerald-400/60";
    return "text-zinc-600";
  };

  const hasDisease = detections.some(d => d.label !== "healthy" && d.label !== "immature");

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Disease AI Detection</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              YOLOv8n v4 // mAP50: 74.6% // HEALTHY · GANODERMA · UNHEALTHY · IMMATURE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
          {(["upload", "webcam"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setLiveActive(false); setResultImg(null); setDetections([]); }}
              className={`px-4 py-1.5 rounded text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all ${mode === m ? "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30" : "text-zinc-600 hover:text-zinc-400"}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Disease alert */}
      {hasDisease && (
        <div className="mb-4 bg-rose-500/5 border border-rose-500/30 rounded-lg px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">
            DISEASE DETECTED: {detections.filter(d => d.label !== "healthy" && d.label !== "immature").map(d => d.label.toUpperCase()).join(", ")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left — input + detections */}
        <div className="space-y-4">
          {mode === "upload" ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => !detecting && fileRef.current?.click()}
              className={`bg-zinc-900 rounded-lg border-2 border-dashed transition-all cursor-pointer p-8 text-center ${detecting ? "border-emerald-500/40 cursor-wait" : "border-zinc-700 hover:border-emerald-500/40"}`}
            >
              {detecting ? (
                <><RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" /><p className="text-[10px] uppercase tracking-widest text-emerald-400">Running inference...</p></>
              ) : (
                <><Upload className="w-8 h-8 text-zinc-600 mx-auto mb-3" /><p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">DROP IMAGE HERE</p><p className="text-[9px] text-zinc-700">or click to browse</p><p className="text-[8px] text-zinc-700 mt-2">JPG · PNG · WEBP</p></>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Webcam_Config</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1.5 block">CAMERA_INDEX</label>
                  <input value={camIndex} onChange={e => setCamIndex(e.target.value)} disabled={liveActive}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300 focus:border-emerald-500/50 outline-none disabled:opacity-50" />
                  <p className="text-[8px] text-zinc-700 mt-1">Use camera DB ID (check Block Map page for ID)</p>
                </div>
                <button onClick={() => setLiveActive(!liveActive)}
                  className={`w-full py-3 rounded border font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all ${liveActive ? "bg-rose-500/10 border-rose-500/40 text-rose-500 hover:bg-rose-500/20" : "bg-emerald-400/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20"}`}>
                  {liveActive
                    ? <span className="flex items-center justify-center gap-2"><X className="w-4 h-4" /> STOP</span>
                    : <span className="flex items-center justify-center gap-2"><Eye className="w-4 h-4" /> START LIVE</span>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Detections panel */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Detections</p>
              <span className={`text-[9px] font-mono font-bold ${detections.length > 0 ? (hasDisease ? "text-rose-500" : "text-emerald-400") : "text-zinc-600"}`}>
                {detections.length > 0 ? `${detections.length} FOUND` : "NONE"}
              </span>
            </div>

            {detections.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[9px] uppercase tracking-widest text-zinc-700">No detections yet</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {detections.map((d, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CLASS_COLORS[d.label] }} />
                        <span className="text-[10px] uppercase tracking-widest text-zinc-300 font-bold">{d.label}</span>
                      </div>
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${
                        d.severity === "High"   ? "text-rose-500 border-rose-500/30 bg-rose-500/5" :
                        d.severity === "Medium" ? "text-amber-500 border-amber-500/30 bg-amber-500/5" :
                        d.severity === "Low"    ? "text-sky-400 border-sky-400/30 bg-sky-400/5" :
                        "text-emerald-400 border-emerald-500/30 bg-emerald-400/5"
                      }`}>{d.severity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${d.confidence}%`, backgroundColor: CLASS_COLORS[d.label] }} />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{d.confidence.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-[10px] text-rose-500 break-all">{error}</p>
            </div>
          )}
        </div>

        {/* Center — result */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
              {mode === "webcam" ? "Live_Feed" : "Detection_Result"}
            </span>
            {(detecting || liveActive) && (
              <div className="ml-auto flex items-center gap-1.5">
                <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span className="text-[9px] uppercase tracking-widest text-emerald-400">
                  {detecting ? "INFERENCING" : "LIVE"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 bg-zinc-950 flex items-center justify-center" style={{ minHeight: "320px" }}>
            {detecting && !resultImg ? (
              <div className="text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">Running YOLOv8n v4...</p>
              </div>
            ) : !resultImg ? (
              <div className="text-center space-y-3">
                <Camera className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                  {mode === "upload" ? "Upload an image to detect diseases" : "Start live detection"}
                </p>
              </div>
            ) : (
              <img src={resultImg} alt="Result" className="max-w-full max-h-full object-contain" />
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/50">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600">
              {detections.length > 0
                ? `${detections.length} detection${detections.length > 1 ? "s" : ""} // bounding boxes from backend`
                : "YOLOv8n v4 // conf=0.50 // iou=0.45"
              }
            </p>
          </div>
        </div>

        {/* Right — console */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Inference_Console</span>
            <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse ml-auto" />
          </div>

          <div ref={logRef} className="flex-1 overflow-y-auto p-3 bg-zinc-950/50 space-y-0.5" style={{ maxHeight: "450px" }}>
            {logs.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[8px] font-mono text-zinc-700 select-none shrink-0 w-6 text-right">{String(i + 1).padStart(2, "0")}</span>
                <span className={`text-[10px] font-mono ${getLogColor(line)} leading-relaxed`}>{line}</span>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-2">
            <ChevronRight className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-mono text-zinc-600 animate-pulse">_</span>
          </div>
        </div>
      </div>
    </div>
  );
}



