"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Lock,
  Fingerprint,
  Terminal,
  Cpu,
  Wifi,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace BOOT_LOG_LINES with live boot sequence from FastAPI backend.
// Future: useEffect → fetch('/api/system/boot-log') or static config.
// ============================================================================
const BOOT_LOG_LINES = [
  "> BIOS POST CHECK .............. OK",
  "> MEMORY TEST 512MB ............ PASS",
  "> INITIALIZING KERNEL v4.18.2 .. DONE",
  "> LOADING SECURITY MODULE ...... ACTIVE",
  "> MQTT BROKER HANDSHAKE ........ ESTABLISHED",
  "> CONNECTING TO AGRIBOX_01 ..... LINKED",
  "> TLS 1.3 CERTIFICATE VERIFY ... VALID",
  "> SENSOR ARRAY PING ............ 4/4 ONLINE",
  "> YOLOv8 MODEL WARM START ...... READY",
  "> NVR STREAM AUTH .............. GRANTED",
  "> FIREWALL RULES LOADED ........ 24 ACTIVE",
  "> SYSTEM CLOCK SYNC (NTP) ...... DRIFT <2ms",
  "> ACCESS CONTROL MODULE ........ ARMED",
  "> AWAITING OPERATOR CREDENTIALS  ___",
];

export default function IndustrialLogin() {
  const [operatorId, setOperatorId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [bootLineIdx, setBootLineIdx] = useState(0);
  const [scanPos, setScanPos] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStage, setAuthStage] = useState(0);
  const [loginError, setLoginError] = useState(false);
  const bootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bootLineIdx < BOOT_LOG_LINES.length) {
      const delay = 120 + Math.random() * 180;
      const timer = setTimeout(() => setBootLineIdx((p) => p + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [bootLineIdx]);

  useEffect(() => {
    if (bootRef.current) {
      bootRef.current.scrollTop = bootRef.current.scrollHeight;
    }
  }, [bootLineIdx]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPos((p) => (p >= 100 ? 0 : p + 0.8));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    if (!operatorId || !accessToken) return;
    setIsAuthenticating(true);
    setLoginError(false);
    setAuthStage(0);

    const stages = [1, 2, 3, 4];
    stages.forEach((s, i) => {
      setTimeout(() => {
        setAuthStage(s);
        if (s === 4) {
          setTimeout(() => {
            setIsAuthenticating(false);
            setLoginError(true);
            setAuthStage(0);
          }, 800);
        }
      }, (i + 1) * 600);
    });
  };

  const AUTH_STAGES = [
    "VALIDATING OPERATOR_ID...",
    "VERIFYING ACCESS_TOKEN...",
    "CHECKING CLEARANCE LEVEL...",
    "ACCESS DENIED — DEMO MODE",
  ];

  const inputFocusClasses = "focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(63,63,70,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.15) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Scanning line animation */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          top: `${scanPos}%`,
          background: "linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.15) 20%, rgba(52,211,153,0.3) 50%, rgba(52,211,153,0.15) 80%, transparent 100%)",
          boxShadow: "0 0 20px 2px rgba(52,211,153,0.08)",
          transition: scanPos === 0 ? "none" : "top 30ms linear",
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-zinc-700">
        <div className="w-3 h-3 border border-zinc-800 rounded-sm" />
        <span className="text-[9px] uppercase tracking-widest">IRIV_SEC_GATEWAY</span>
      </div>
      <div className="absolute top-6 right-6 flex items-center gap-2 text-zinc-700">
        <span className="text-[9px] uppercase tracking-widest tabular-nums">NODE: AGRIBOX_01</span>
        <Wifi className="w-3 h-3" />
      </div>
      <div className="absolute bottom-6 left-6 text-[9px] uppercase tracking-widest text-zinc-700 tabular-nums">
        TLS 1.3 // AES-256-GCM // ECDHE-RSA
      </div>
      <div className="absolute bottom-6 right-6 text-[9px] uppercase tracking-widest text-zinc-700 tabular-nums">
        FW v4.18.2 // BUILD 20250530
      </div>

      {/* Login terminal */}
      <div className="relative w-full max-w-lg">
        {/* Outer glow ring */}
        <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-emerald-400/20 via-transparent to-transparent" />

        <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Machined edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

          {/* Terminal header */}
          <div className="px-5 py-4 border-b border-zinc-800 relative">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400/40" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
                    System Access Terminal
                  </h1>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">
                    RESTRICTED // CLEARANCE LEVEL 3+ REQUIRED
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                  ENCRYPTED
                </span>
              </div>
            </div>
          </div>

          {/* Security status strip */}
          <div className="flex items-center justify-between px-5 py-2 bg-zinc-950 border-b border-zinc-800/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">TLS_ACTIVE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">CERT_VALID</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">HSM_READY</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 tabular-nums">
                SESSION_PENDING
              </span>
            </div>
          </div>

          {/* Login form */}
          <div className="px-5 py-6">
            {/* OPERATOR_ID */}
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <ChevronRight className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  OPERATOR_ID
                </span>
              </label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="Enter operator identification..."
                className={`w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-zinc-200 font-mono placeholder:text-zinc-700 transition-all ${inputFocusClasses}`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* ACCESS_TOKEN */}
            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2">
                <ChevronRight className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  ACCESS_TOKEN
                </span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter access token..."
                  className={`w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 pr-12 text-sm text-zinc-200 font-mono placeholder:text-zinc-700 transition-all ${inputFocusClasses}`}
                  autoComplete="off"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {showToken
                    ? <EyeOff className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                    : <Eye className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                  }
                </button>
              </div>
            </div>

            {/* Auth status / error */}
            {isAuthenticating && (
              <div className="mb-4 bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5">
                {AUTH_STAGES.slice(0, authStage).map((stage, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                    <span className={`text-[9px] font-mono ${i < authStage - 1 ? "text-emerald-400" : "text-amber-500 animate-pulse"}`}>
                      {i < authStage - 1 ? "✓" : "●"}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${
                      i === 3 ? "text-rose-500" : i < authStage - 1 ? "text-emerald-400" : "text-amber-500"
                    }`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {loginError && !isAuthenticating && (
              <div className="mb-4 bg-rose-500/5 border border-rose-500/20 rounded-md px-4 py-2.5 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">
                  AUTH_FAILED — THIS IS A DEMO TERMINAL // NO BACKEND CONNECTED
                </span>
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={!operatorId || !accessToken || isAuthenticating}
              className={`w-full py-3 rounded-md font-bold text-sm uppercase tracking-widest transition-all cursor-pointer relative overflow-hidden ${
                !operatorId || !accessToken || isAuthenticating
                  ? "bg-zinc-800 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/20 hover:border-emerald-400/50"
              }`}
            >
              {isAuthenticating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                  </svg>
                  AUTHENTICATING...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  AUTHENTICATE
                </span>
              )}
            </button>
          </div>

          {/* Boot sequence footer */}
          <div className="border-t border-zinc-800">
            <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-800/50 bg-zinc-950">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-zinc-600" />
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">
                  BOOT_SEQUENCE
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 tabular-nums">
                {bootLineIdx}/{BOOT_LOG_LINES.length} TASKS
              </span>
            </div>

            <div
              ref={bootRef}
              className="px-5 py-3 bg-zinc-950 overflow-auto"
              style={{ maxHeight: 140 }}
            >
              {BOOT_LOG_LINES.slice(0, bootLineIdx).map((line, i) => {
                const isLast = i === bootLineIdx - 1 && bootLineIdx < BOOT_LOG_LINES.length;
                const isOk = line.includes("OK") || line.includes("PASS") || line.includes("DONE")
                  || line.includes("ACTIVE") || line.includes("ESTABLISHED") || line.includes("LINKED")
                  || line.includes("VALID") || line.includes("ONLINE") || line.includes("READY")
                  || line.includes("GRANTED") || line.includes("ARMED");
                const isWaiting = line.includes("___");

                return (
                  <div key={i} className={`flex items-start gap-2 ${isLast ? "" : "mb-0.5"}`}>
                    <span className={`text-[9px] font-mono leading-relaxed whitespace-pre ${
                      isWaiting ? "text-amber-500 animate-pulse" : isOk ? "text-emerald-400/70" : "text-zinc-600"
                    }`}>
                      {line}
                    </span>
                  </div>
                );
              })}
              {bootLineIdx < BOOT_LOG_LINES.length && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-3 bg-emerald-400/60 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom system info */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="text-[9px] uppercase tracking-widest text-zinc-700">
            IRIV AGRIBOX INDUSTRIAL IoT PLATFORM
          </span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-800">|</span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-700">
            © 2025 ALL RIGHTS RESERVED
          </span>
        </div>
      </div>
    </div>
  );
}
