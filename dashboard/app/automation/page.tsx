"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Power, Droplets, FlaskConical, Clock, Activity,
  CircleDot, Plus, Trash2, Wind,
  RefreshCw, User, Cpu, Zap, Lock,
} from "lucide-react";
import { automationApi, api } from "@/lib/api";

interface RelayStateInfo {
  state:      boolean;
  source:     string;
  updated_at: string | null;
}
interface Rule {
  id: number; rule_name: string; sensor_field: string; operator: string;
  threshold_value: number; relay_pin: number; is_active: boolean; last_triggered?: string;
}

const RELAY_CONFIG = [
  { num: 1, id: "RELAY_01", port: "AC_SOCKET_1", label: "Water Pump",  type: "AC", Icon: Droplets },
  { num: 2, id: "RELAY_02", port: "AC_SOCKET_2", label: "Mist Pump",   type: "AC", Icon: Wind     },
  { num: 3, id: "RELAY_03", port: "DC_PORT_A",   label: "NPK-A Pump",  type: "DC", Icon: FlaskConical },
  { num: 4, id: "RELAY_04", port: "DC_PORT_B",   label: "NPK-B Pump",  type: "DC", Icon: FlaskConical },
  { num: 5, id: "RELAY_05", port: "DC_PORT_C",   label: "NPK-C Pump",  type: "DC", Icon: FlaskConical },
];

// Simple toggle indicator — avoids lucide SSR hydration issues
function ToggleIndicator({ active }: { active: boolean }) {
  return (
    <div className={`relative w-8 h-4 rounded-full transition-colors ${active ? "bg-emerald-500/40" : "bg-zinc-700"}`}>
      <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${active ? "left-4 bg-emerald-400" : "left-0.5 bg-zinc-500"}`} />
    </div>
  );
}

export default function AutomationPanel() {
  const [relayStates, setRelayStates] = useState<Record<number, RelayStateInfo>>({
    1: { state: false, source: "unknown", updated_at: null },
    2: { state: false, source: "unknown", updated_at: null },
    3: { state: false, source: "unknown", updated_at: null },
    4: { state: false, source: "unknown", updated_at: null },
    5: { state: false, source: "unknown", updated_at: null },
  });
  const [masterAC, setMasterAC]             = useState(false);
  const [masterACSource, setMasterACSource] = useState("unknown");
  const [togglingMaster, setTogglingMaster] = useState(false);
  const [rules, setRules]                   = useState<Rule[]>([]);
  const [loading, setLoading]               = useState(true);
  const [togglingRelay, setTogglingRelay]   = useState<number | null>(null);
  const [showAddRule, setShowAddRule]       = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: "", sensor_field: "soil_moisture", operator: "<",
    threshold_value: 40, relay_pin: 1, trigger_type: "threshold",
  });

  const fetchRelayStates = useCallback(async () => {
    try {
      const res = await api.get("/automation/relay/states");
      setRelayStates(res.data);
    } catch { /* silent */ }
  }, []);

  const fetchMasterAC = useCallback(async () => {
    try {
      const res = await api.get("/automation/master-ac");
      setMasterAC(res.data.state);
      setMasterACSource(res.data.source || "unknown");
    } catch { /* silent */ }
  }, []);

  const fetchRules = useCallback(async () => {
    try {
      const res = await automationApi.getRules();
      setRules(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchRelayStates(), fetchMasterAC(), fetchRules()]);
  }, [fetchRelayStates, fetchMasterAC, fetchRules]);

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 5000);
    return () => clearInterval(i);
  }, [fetchAll]);

  const handleMasterACToggle = async () => {
    const newState = !masterAC;
    setTogglingMaster(true);
    setMasterAC(newState);
    setMasterACSource("DASHBOARD");
    try {
      await api.post("/automation/master-ac", { state: newState });
      setTimeout(fetchAll, 5500);
    } catch {
      setMasterAC(!newState);
    } finally {
      setTogglingMaster(false);
    }
  };

  const handleRelayToggle = async (relayNum: number) => {
    if (masterAC && (relayNum === 1 || relayNum === 2)) return;
    const currentState = relayStates[relayNum]?.state ?? false;
    const newState     = !currentState;
    setTogglingRelay(relayNum);
    setRelayStates(prev => ({ ...prev, [relayNum]: { ...prev[relayNum], state: newState, source: "MANUAL" } }));
    try {
      await automationApi.controlRelay(relayNum, newState);
      setTimeout(fetchRelayStates, 5500);
    } catch {
      setRelayStates(prev => ({ ...prev, [relayNum]: { ...prev[relayNum], state: currentState } }));
    } finally {
      setTogglingRelay(null);
    }
  };

  const handleRuleToggle = async (ruleId: number) => {
    try {
      await automationApi.toggleRule(ruleId);
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: !r.is_active } : r));
    } catch (e) { console.error(e); }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await automationApi.deleteRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (e) { console.error(e); }
  };

  const handleAddRule = async () => {
    try {
      await api.post("/automation/rules", newRule);
      setShowAddRule(false);
      setNewRule({ rule_name: "", sensor_field: "soil_moisture", operator: "<", threshold_value: 40, relay_pin: 1, trigger_type: "threshold" });
      fetchRules();
    } catch (e) { console.error(e); }
  };

  const armedCount   = rules.filter(r => r.is_active).length;
  const activeRelays = Object.values(relayStates).filter(s => s.state).length;

  const getSourceBadge = (source: string) => {
    if (source === "MANUAL" || source === "DASHBOARD")
      return <span className="inline-flex items-center gap-1 text-[7px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border text-sky-400 border-sky-400/30 bg-sky-400/5"><User className="w-2 h-2" /> MANUAL</span>;
    if (source === "MASTER_AC" || source === "BUTTON")
      return <span className="inline-flex items-center gap-1 text-[7px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border text-violet-400 border-violet-400/30 bg-violet-400/5"><Zap className="w-2 h-2" /> MASTER</span>;
    if (source?.startsWith("RULE:"))
      return <span className="inline-flex items-center gap-1 text-[7px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border text-amber-500 border-amber-500/30 bg-amber-500/5"><Cpu className="w-2 h-2" /> AUTO</span>;
    return <span className="text-[7px] uppercase tracking-widest text-zinc-600">STANDBY</span>;
  };

  const selectCls = "bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-[11px] text-zinc-300 font-mono focus:border-emerald-500/50 outline-none";
  const inputCls  = "bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-[11px] text-zinc-300 font-mono focus:border-emerald-500/50 outline-none";

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Power className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Relay Control Matrix</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              IRIV_AGRIBOX_01 // 5-CH // GPIO(1-2) + IOC_MODBUS_TCP(3-5)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-zinc-600">ACTIVE:</span>
            <span className={`text-[11px] font-mono font-bold ${activeRelays > 0 ? "text-emerald-400" : "text-zinc-600"}`}>{activeRelays}/5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[9px] uppercase tracking-widest text-emerald-400">POLLING 5s</span>
          </div>
        </div>
      </div>

      {/* ── 5-Relay Grid ── */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {RELAY_CONFIG.map((relay) => {
          const info             = relayStates[relay.num];
          const active           = info?.state ?? false;
          const source           = info?.source ?? "unknown";
          const isToggling       = togglingRelay === relay.num;
          const isMasterCtrl     = masterAC && (relay.num === 1 || relay.num === 2);

          return (
            <div key={relay.id} className={`bg-zinc-900 rounded-lg p-4 border transition-all duration-500 ${
              isMasterCtrl ? "border-violet-500/60 shadow-[0_0_15px_rgba(139,92,246,0.12)]"
              : active     ? "border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
              :              "border-zinc-800"
            }`}>
              {/* Card header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600">{relay.id}</span>
                <div className={`p-1.5 rounded-md ${isMasterCtrl ? "bg-violet-500/10 text-violet-400" : active ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-800 text-zinc-600"}`}>
                  <relay.Icon className="w-4 h-4" />
                </div>
              </div>

              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">{relay.port}</p>
              <p className="text-xs text-zinc-300 font-medium mb-3">{relay.label}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                <div className="bg-zinc-950 rounded px-2 py-1.5 border border-zinc-800">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">TYPE</p>
                  <p className="text-[9px] font-mono font-bold text-zinc-500">{relay.type}</p>
                </div>
                <div className="bg-zinc-950 rounded px-2 py-1.5 border border-zinc-800">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5">STATE</p>
                  <p className={`text-[9px] font-mono font-bold ${active ? (isMasterCtrl ? "text-violet-400" : "text-emerald-400") : "text-zinc-600"}`}>
                    {active ? "ON" : "OFF"}
                  </p>
                </div>
              </div>

              <div className="mb-3">{getSourceBadge(source)}</div>

              {/* Button */}
              {isMasterCtrl ? (
                <div className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-[9px] uppercase tracking-widest font-bold border border-violet-500/30 bg-violet-500/5 text-violet-400">
                  <Lock className="w-3 h-3" /> MASTER CTRL
                </div>
              ) : (
                <button
                  onClick={() => handleRelayToggle(relay.num)}
                  disabled={isToggling}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-md text-[9px] uppercase tracking-widest font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                    active ? "bg-emerald-400/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20"
                           : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800"
                  }`}>
                  {isToggling
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <ToggleIndicator active={active} />
                  }
                  <span>{isToggling ? "QUEUING..." : active ? "ENGAGED" : "STANDBY"}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Master AC Switch ── */}
      <div className={`mb-6 rounded-xl border transition-all duration-500 overflow-hidden ${masterAC ? "border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.15)]" : "border-zinc-800"}`}>
        <div className={`flex items-center justify-between px-6 py-4 bg-zinc-900 ${masterAC ? "border-t-2 border-t-violet-500" : ""}`}>
          <div className="flex items-center gap-4">
            {/* Button visual */}
            <button
              onClick={handleMasterACToggle}
              className={`relative w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 cursor-pointer ${
                masterAC ? "border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.6)] bg-violet-500/20" : "border-zinc-700 bg-zinc-800"
              }`}>
              <Zap className={`w-6 h-6 transition-all ${masterAC ? "text-violet-400" : "text-zinc-600"}`} />
              {masterAC && <div className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping" />}
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-100">Master AC Switch</p>
                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                  masterAC ? "text-violet-400 border-violet-500/40 bg-violet-500/10" : "text-zinc-600 border-zinc-700"
                }`}>
                  {masterAC ? "● ACTIVE" : "○ STANDBY"}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                Controls Relay 1 (Water Pump) + Relay 2 (Mist Pump) simultaneously
              </p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-1">
                GPIO13=BUTTON // GPIO23=LED // Source: {masterACSource}
              </p>
            </div>
          </div>

          {/* Activate button */}
          <button
            onClick={handleMasterACToggle}
            disabled={togglingMaster}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl border font-bold text-sm uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50 ${
              masterAC
                ? "bg-violet-500/10 border-violet-500/40 text-violet-400 hover:bg-violet-500/20"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
            }`}>
            {togglingMaster
              ? <RefreshCw className="w-5 h-5 animate-spin" />
              : <ToggleIndicator active={masterAC} />
            }
            <span>{togglingMaster ? "ACTIVATING..." : masterAC ? "DEACTIVATE" : "ACTIVATE"}</span>
          </button>
        </div>

        <div className="flex items-center gap-6 px-6 py-2.5 bg-zinc-950/60 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${masterAC ? "bg-violet-400 animate-pulse" : "bg-zinc-700"}`} />
            <span className="text-[9px] uppercase tracking-widest text-zinc-600">
              Physical button: GPIO13 // LED indicator: GPIO23
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-zinc-600">
            When ACTIVE: Relay 1+2 locked to MASTER_CTRL, individual toggle disabled
          </span>
        </div>
      </div>

      {/* ── Rules Table ── */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800">
          <Activity className="w-4 h-4 text-amber-500" />
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-zinc-300">Automation_Rules</h2>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 ml-auto">{armedCount}/{rules.length} ARMED</span>
          <button onClick={() => setShowAddRule(!showAddRule)}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 cursor-pointer ml-2">
            <Plus className="w-3.5 h-3.5" /> ADD_RULE
          </button>
        </div>

        {showAddRule && (
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/50 grid grid-cols-6 gap-3">
            <input placeholder="Rule name" value={newRule.rule_name}
              onChange={e => setNewRule(p => ({...p, rule_name: e.target.value}))}
              className={`col-span-2 ${inputCls}`} />
            <select value={newRule.sensor_field} onChange={e => setNewRule(p => ({...p, sensor_field: e.target.value}))} className={selectCls}>
              <option value="soil_moisture">soil_moisture</option>
              <option value="temperature">temperature</option>
              <option value="humidity">humidity</option>
              <option value="ec_level">ec_level</option>
            </select>
            <select value={newRule.operator} onChange={e => setNewRule(p => ({...p, operator: e.target.value}))} className={selectCls}>
              <option value="<">{"<"}</option>
              <option value=">">{">"}</option>
            </select>
            <input type="number" placeholder="Threshold" value={newRule.threshold_value}
              onChange={e => setNewRule(p => ({...p, threshold_value: parseFloat(e.target.value)}))}
              className={inputCls} />
            <select value={newRule.relay_pin} onChange={e => setNewRule(p => ({...p, relay_pin: parseInt(e.target.value)}))} className={selectCls}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>Relay {n}</option>)}
            </select>
            <div className="col-span-6 flex gap-2 justify-end">
              <button onClick={() => setShowAddRule(false)} className="px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 cursor-pointer">CANCEL</button>
              <button onClick={handleAddRule} className="px-4 py-2 bg-emerald-400/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20 rounded text-[10px] uppercase tracking-widest cursor-pointer">SAVE_RULE</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800/50">
                {["ID", "NAME", "CONDITION", "RELAY", "STATUS", "LAST_FIRED", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[9px] uppercase tracking-widest text-zinc-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[10px] text-zinc-600">Loading...</td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[10px] text-zinc-600">No rules — click ADD_RULE</td></tr>
              ) : rules.map(rule => (
                <tr key={rule.id} className={`border-b border-zinc-800/30 ${rule.is_active ? "hover:bg-zinc-800/30" : "opacity-40"}`}>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-600">#{rule.id}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-400 font-bold">{rule.rule_name}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-400">IF {rule.sensor_field} {rule.operator} {rule.threshold_value}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-emerald-400/80">RELAY_0{rule.relay_pin}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold ${rule.is_active ? "text-emerald-400" : "text-zinc-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      {rule.is_active ? "ARMED" : "DISARMED"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-zinc-600">
                    {rule.last_triggered ? new Date(rule.last_triggered).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRuleToggle(rule.id)}
                        className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded border cursor-pointer transition-all ${
                          rule.is_active ? "text-emerald-400 border-emerald-500/30 bg-emerald-400/5 hover:bg-emerald-400/10" : "text-zinc-600 border-zinc-700 hover:text-zinc-400"
                        }`}>
                        {rule.is_active ? "ON" : "OFF"}
                      </button>
                      <button onClick={() => handleDeleteRule(rule.id)} className="text-zinc-700 hover:text-rose-500 cursor-pointer transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 border-t border-zinc-800 bg-zinc-950/50">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-[9px] uppercase tracking-widest text-zinc-600">
            IRIV poll: 5s // manual override: 60s // Relay 1-2: GPIO // Relay 3-5: IOC Modbus TCP
          </span>
        </div>
      </div>
    </div>
  );
}