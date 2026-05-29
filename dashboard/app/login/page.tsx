"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield, Lock, Terminal, Cpu, Wifi,
  AlertTriangle, ChevronRight, Eye, EyeOff,
} from "lucide-react";
import Cookies from "js-cookie";

const BOOT_LOG_LINES = [
  "> BIOS POST CHECK .............. OK",
  "> MEMORY TEST 4GB LPDDR4 ....... PASS",
  "> INITIALIZING KERNEL v5.15.2 .. DONE",
  "> RS485 BUS INIT ............... ACTIVE",
  "> SOIL_SENSOR SLAVE_5 .......... LINKED",
  "> AIR_SENSOR SLAVE_1 ........... LINKED",
  "> IOC MODBUS_TCP 10.0.0.10 ..... ESTABLISHED",
  "> TLS 1.3 CERTIFICATE VERIFY ... VALID",
  "> YOLOv8n_v4 MODEL LOAD ........ READY",
  "> RELAY MODULE 5CH ............. ARMED",
  "> CLOUDFLARE TUNNEL ............ ONLINE",
  "> FASTAPI BACKEND .............. READY",
  "> ACCESS CONTROL MODULE ........ ARMED",
  "> AWAITING OPERATOR CREDENTIALS  ___",
];

export default function IndustrialLogin() {
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bootLineIdx, setBootLineIdx]   = useState(0);
  const [scanPos, setScanPos]           = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep]         = useState(0);
  const [loginError, setLoginError]     = useState("");
  const bootRef = useRef<HTMLDivElement>(null);

  // Boot sequence animation
  useEffect(() => {
    if (bootLineIdx < BOOT_LOG_LINES.length) {
      const t = setTimeout(() => setBootLineIdx(p => p + 1), 120 + Math.random() * 180);
      return () => clearTimeout(t);
    }
  }, [bootLineIdx]);

  useEffect(() => {
    if (bootRef.current) bootRef.current.scrollTop = bootRef.current.scrollHeight;
  }, [bootLineIdx]);

  // Scan line animation
  useEffect(() => {
    const i = setInterval(() => setScanPos(p => p >= 100 ? 0 : p + 0.8), 30);
    return () => clearInterval(i);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) return;
    setIsAuthenticating(true);
    setLoginError("");
    setAuthStep(1);

    try {
      // Step 1 — call FastAPI login
      const apiUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "https://api.project2030.me";

      setAuthStep(2);
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      setAuthStep(3);

      if (!res.ok) {
        setLoginError("AUTH_FAILED — INVALID CREDENTIALS");
        setIsAuthenticating(false);
        setAuthStep(0);
        return;
      }

      const data = await res.json();
      const token = data.access_token;

      if (!token) {
        setLoginError("AUTH_FAILED — NO TOKEN RECEIVED");
        setIsAuthenticating(false);
        setAuthStep(0);
        return;
      }

      // Step 4 — store token + redirect
      setAuthStep(4);
      Cookies.set("auth_token", token, { expires: 1 });
      Cookies.set("username", username, { expires: 1 });

      // Redirect to dashboard
      window.location.href = "/";

    } catch (err) {
      setLoginError("AUTH_FAILED — BACKEND UNREACHABLE");
      setIsAuthenticating(false);
      setAuthStep(0);
    }
  };

  const AUTH_STAGES = [
    "VALIDATING CREDENTIALS...",
    "CONNECTING TO BACKEND...",
    "VERIFYING JWT TOKEN...",
    "ACCESS GRANTED // REDIRECTING...",
  ];

  const inputClasses = "w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-zinc-200 font-mono placeholder:text-zinc-700 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 focus:outline-none transition-all";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(63,63,70,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.15) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px pointer-events-none" style={{
        top: `${scanPos}%`,
        background: "linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.15) 20%, rgba(52,211,153,0.3) 50%, rgba(52,211,153,0.15) 80%, transparent 100%)",
        transition: scanPos === 0 ? "none" : "top 30ms linear",
      }} />

      {/* Corner labels */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-zinc-700">
        <div className="w-3 h-3 border border-zinc-800 rounded-sm" />
        <span className="text-[9px] uppercase tracking-widest">IRIV_SEC_GATEWAY</span>
      </div>
      <div className="absolute top-6 right-6 flex items-center gap-2 text-zinc-700">
        <span className="text-[9px] uppercase tracking-widest">NODE: AGRIBOX_01</span>
        <Wifi className="w-3 h-3" />
      </div>
      <div className="absolute bottom-6 left-6 text-[9px] uppercase tracking-widest text-zinc-700">
        TLS 1.3 // AES-256-GCM
      </div>
      <div className="absolute bottom-6 right-6 text-[9px] uppercase tracking-widest text-zinc-700">
        FW v4.0 // YOLOv8n v4 74.6% mAP
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-lg">
        <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-emerald-400/20 via-transparent to-transparent" />

        <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 relative">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400/40" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">System Access Terminal</h1>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">
                    FYP OIL PALM IoT // RESTRICTED ACCESS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">ENCRYPTED</span>
              </div>
            </div>
          </div>

          {/* Security strip */}
          <div className="flex items-center justify-between px-5 py-2 bg-zinc-950 border-b border-zinc-800/50">
            <div className="flex items-center gap-4">
              {[
                { icon: <Lock className="w-2.5 h-2.5" />, label: "TLS_ACTIVE" },
                { icon: <Cpu className="w-2.5 h-2.5" />, label: "JWT_READY" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 text-emerald-400">
                  {item.icon}
                  <span className="text-[8px] uppercase tracking-widest font-bold">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest text-zinc-500">SESSION_PENDING</span>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-6">
            {/* Username */}
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <ChevronRight className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">OPERATOR_ID</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="admin"
                className={inputClasses}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2">
                <ChevronRight className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">ACCESS_TOKEN</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className={`${inputClasses} pr-12`}
                  autoComplete="off"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                    : <Eye className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                  }
                </button>
              </div>
              <p className="text-[9px] text-zinc-700 mt-1.5 ml-1">
                Default: admin / fyp2024 &nbsp;|&nbsp; danesh / oilpalm2024
              </p>
            </div>

            {/* Auth progress */}
            {isAuthenticating && (
              <div className="mb-4 bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5">
                {AUTH_STAGES.slice(0, authStep).map((stage, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                    <span className={`text-[9px] font-mono ${i < authStep - 1 ? "text-emerald-400" : "text-amber-500 animate-pulse"}`}>
                      {i < authStep - 1 ? "✓" : "●"}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${i === 3 ? "text-emerald-400" : i < authStep - 1 ? "text-emerald-400" : "text-amber-500"}`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {loginError && !isAuthenticating && (
              <div className="mb-4 bg-rose-500/5 border border-rose-500/20 rounded-md px-4 py-2.5 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">{loginError}</span>
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={!username || !password || isAuthenticating}
              className={`w-full py-3 rounded-md font-bold text-sm uppercase tracking-widest transition-all cursor-pointer ${
                !username || !password || isAuthenticating
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
                  <Lock className="w-4 h-4" /> AUTHENTICATE
                </span>
              )}
            </button>
          </div>

          {/* Boot sequence */}
          <div className="border-t border-zinc-800">
            <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-800/50 bg-zinc-950">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-zinc-600" />
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">BOOT_SEQUENCE</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 tabular-nums">
                {bootLineIdx}/{BOOT_LOG_LINES.length} TASKS
              </span>
            </div>
            <div ref={bootRef} className="px-5 py-3 bg-zinc-950 overflow-auto" style={{ maxHeight: 140 }}>
              {BOOT_LOG_LINES.slice(0, bootLineIdx).map((line, i) => {
                const isOk = line.includes("OK") || line.includes("PASS") || line.includes("DONE") || line.includes("ACTIVE") || line.includes("ESTABLISHED") || line.includes("LINKED") || line.includes("VALID") || line.includes("ONLINE") || line.includes("READY") || line.includes("GRANTED") || line.includes("ARMED");
                const isWaiting = line.includes("___");
                return (
                  <div key={i} className="mb-0.5">
                    <span className={`text-[9px] font-mono leading-relaxed whitespace-pre ${isWaiting ? "text-amber-500 animate-pulse" : isOk ? "text-emerald-400/70" : "text-zinc-600"}`}>
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

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="text-[9px] uppercase tracking-widest text-zinc-700">IRIV AGRIBOX INDUSTRIAL IoT PLATFORM</span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-800">|</span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-700">© 2026 DANESH MUTHU KRISNAN</span>
        </div>
      </div>
    </div>
  );
}