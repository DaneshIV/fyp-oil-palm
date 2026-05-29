"use client";

import React, { useState } from "react";
import {
  Power,
  Zap,
  Droplets,
  FlaskConical,
  Clock,
  Activity,
  CircleDot,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Relay {
  id: string;
  port: string;
  label: string;
  voltage: string;
  current: string;
  icon: React.ReactNode;
}

interface Rule {
  id: string;
  condition: string;
  action: string;
  status: "ARMED" | "DISARMED" | "TRIGGERED";
  lastFired: string;
  priority: "HIGH" | "MED" | "LOW";
}

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace RELAYS with live relay state from FastAPI backend.
// Future: useEffect → fetch('/api/relays') or
//         WebSocket subscription to ws://<host>/ws/relays for real-time state.
// ============================================================================
const RELAYS: Relay[] = [
  { id: "RELAY_01", port: "AC_SOCKET_1", label: "Water Pump", voltage: "238.1V", current: "4.2A", icon: <Droplets className="w-4 h-4" /> },
  { id: "RELAY_02", port: "AC_SOCKET_2", label: "Mist Pump", voltage: "236.7V", current: "1.8A", icon: <Droplets className="w-4 h-4" /> },
  { id: "RELAY_03", port: "DC_PORT_A", label: "NPK-A", voltage: "12.4V", current: "1.1A", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "RELAY_04", port: "DC_PORT_B", label: "NPK-B", voltage: "12.2V", current: "0.9A", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "RELAY_05", port: "DC_PORT_C", label: "NPK-C", voltage: "12.6V", current: "1.3A", icon: <FlaskConical className="w-4 h-4" /> },
];

// ============================================================================
// MOCK DATA — INTEGRATION POINT
// Replace RULES with live automation rules from FastAPI backend.
// Future: useEffect → fetch('/api/automation/rules') for initial load,
//         POST /api/automation/rules/:id/toggle for arming/disarming.
// ============================================================================
const RULES: Rule[] = [
  {
    id: "RULE_001",
    condition: "IF soil_moisture < 40% AND time_window(06:00-18:00)",
    action: "ENGAGE RELAY_01 FOR 300s",
    status: "ARMED",
    lastFired: "2026-05-30T14:32:11Z",
    priority: "HIGH",
  },
  {
    id: "RULE_002",
    condition: "IF ambient_temp > 35°C AND humidity < 60%",
    action: "ENGAGE RELAY_02 CYCLE(60s ON / 120s OFF)",
    status: "TRIGGERED",
    lastFired: "2026-05-30T15:01:44Z",
    priority: "HIGH",
  },
  {
    id: "RULE_003",
    condition: "IF ec_reading < 1.2mS/cm AND days_since_dose > 3",
    action: "ENGAGE RELAY_03, RELAY_04, RELAY_05 SEQ(45s EACH)",
    status: "ARMED",
    lastFired: "2026-05-28T08:15:00Z",
    priority: "MED",
  },
  {
    id: "RULE_004",
    condition: "IF rain_sensor == TRUE",
    action: "DISENGAGE RELAY_01, RELAY_02 IMMEDIATE",
    status: "ARMED",
    lastFired: "2026-05-27T21:44:33Z",
    priority: "HIGH",
  },
  {
    id: "RULE_005",
    condition: "IF voltage_dc < 11.0V ON ANY DC_PORT",
    action: "ALERT + DISENGAGE ALL DC_RELAYS",
    status: "DISARMED",
    lastFired: "—",
    priority: "LOW",
  },
];

export default function AutomationPanel() {
  // ============================================================================
  // MOCK DATA — INTEGRATION POINT
  // Replace activeRelays initial state with live data from FastAPI backend.
  // Future: useEffect → fetch('/api/relays/state') for initial load,
  //         POST /api/relays/:id/toggle for toggling,
  //         WebSocket subscription to ws://<host>/ws/relays for real-time updates.
  // ============================================================================
  const [activeRelays, setActiveRelays] = useState<Record<string, boolean>>({
    RELAY_01: true,
    RELAY_02: false,
    RELAY_03: true,
    RELAY_04: false,
    RELAY_05: true,
  });

  // ============================================================================
  // MOCK DATA — INTEGRATION POINT
  // Replace ruleToggles initial state with live data from FastAPI backend.
  // Future: useEffect → fetch('/api/automation/rules') for initial load,
  //         POST /api/automation/rules/:id/toggle for arming/disarming.
  // ============================================================================
  const [ruleToggles, setRuleToggles] = useState<Record<string, boolean>>({
    RULE_001: true,
    RULE_002: true,
    RULE_003: true,
    RULE_004: true,
    RULE_005: false,
  });

  const toggleRelay = (id: string) => {
    setActiveRelays((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRule = (id: string) => {
    setRuleToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const statusColor = (s: Rule["status"]) =>
    s === "ARMED"
      ? "text-emerald-400"
      : s === "TRIGGERED"
        ? "text-amber-500"
        : "text-zinc-600";

  const priorityColor = (p: Rule["priority"]) =>
    p === "HIGH"
      ? "text-rose-500"
      : p === "MED"
        ? "text-amber-500"
        : "text-zinc-500";

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Power className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">
              Relay Control Matrix
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // HW_REV 3.2 // 5-CH RELAY MODULE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-emerald-400">
            LINK_ACTIVE
          </span>
        </div>
      </div>

      {/* Relay Grid */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {RELAYS.map((relay) => {
          const active = activeRelays[relay.id];
          return (
            <div
              key={relay.id}
              className={`
                relative bg-zinc-900 rounded-lg p-4
                border transition-all duration-500
                ${
                  active
                    ? "border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "border-zinc-800"
                }
              `}
            >
              {/* Machined-metal top edge */}
              <div className="absolute inset-x-0 top-0 h-px bg-white/5 rounded-t-lg" />

              {/* Glow bar */}
              {active && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400 rounded-t-lg animate-pulse" />
              )}

              {/* ID & Port */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {relay.id}
                </span>
                <div
                  className={`p-1.5 rounded-md ${active ? "bg-emerald-400/10 text-emerald-400 animate-pulse" : "bg-zinc-800 text-zinc-600"}`}
                >
                  {relay.icon}
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                {relay.port}
              </p>
              <p className="text-xs text-zinc-300 font-medium mb-4">
                {relay.label}
              </p>

              {/* Telemetry */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-zinc-950 rounded px-2 py-1.5 border border-zinc-800">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">
                    V_OUT
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${active ? "text-emerald-400" : "text-zinc-600"}`}
                  >
                    {active ? relay.voltage : "0.0V"}
                  </p>
                </div>
                <div className="bg-zinc-950 rounded px-2 py-1.5 border border-zinc-800">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">
                    I_DRAW
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${active ? "text-amber-500" : "text-zinc-600"}`}
                  >
                    {active ? relay.current : "0.0A"}
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleRelay(relay.id)}
                className={`
                  w-full flex items-center justify-center gap-2 py-2 rounded-md
                  text-[10px] uppercase tracking-widest font-bold
                  border transition-all duration-300 cursor-pointer
                  ${
                    active
                      ? "bg-emerald-400/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800"
                  }
                `}
              >
                {active ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {active ? "ENGAGED" : "STANDBY"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Rules Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800">
          <Activity className="w-4 h-4 text-amber-500" />
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-zinc-300">
            Active_Rules
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 ml-auto">
            {RULES.filter((_, i) => ruleToggles[`RULE_00${i + 1}`]).length} /{" "}
            {RULES.length} ARMED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800/50">
                {["ID", "CONDITION", "ACTION", "PRI", "STATUS", "LAST_FIRED", ""].map(
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
              {RULES.map((rule) => {
                const enabled = ruleToggles[rule.id];
                return (
                  <tr
                    key={rule.id}
                    className={`border-b border-zinc-800/30 transition-colors ${enabled ? "hover:bg-zinc-800/30" : "opacity-40"}`}
                  >
                    <td className="px-4 py-3 text-[11px] font-mono text-zinc-400 font-bold">
                      {rule.id}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-zinc-400 max-w-xs">
                      {rule.condition}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-emerald-400/80">
                      {rule.action}
                    </td>
                    <td className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${priorityColor(rule.priority)}`}>
                      {rule.priority}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${statusColor(rule.status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            rule.status === "ARMED"
                              ? "bg-emerald-400"
                              : rule.status === "TRIGGERED"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-zinc-600"
                          }`}
                        />
                        {rule.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-zinc-600">
                      {rule.lastFired === "—"
                        ? "—"
                        : new Date(rule.lastFired).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className="cursor-pointer"
                      >
                        {enabled ? (
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-zinc-600" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 border-t border-zinc-800 bg-zinc-950/50">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-[9px] uppercase tracking-widest text-zinc-600">
            Rule engine cycle: 250ms // Last eval: 2026-05-30T15:05:22Z
          </span>
        </div>
      </div>
    </div>
  );
}
