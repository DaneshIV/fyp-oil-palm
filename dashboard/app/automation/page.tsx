"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Power, Zap, Droplets, FlaskConical, Clock, Activity,
  CircleDot, ToggleLeft, ToggleRight, Plus, Trash2, Wind,
} from "lucide-react";
import { automationApi } from "@/lib/api";

interface Relay { id: string; num: number; port: string; label: string; icon: React.ReactNode; }
interface Rule {
  id: number; rule_name: string; sensor_field: string; operator: string;
  threshold_value: number; relay_pin: number; is_active: boolean; last_triggered?: string;
}

const RELAY_CONFIG: Relay[] = [
  { id: "RELAY_01", num: 1, port: "AC_SOCKET_1", label: "Water Pump",  icon: <Droplets className="w-4 h-4" /> },
  { id: "RELAY_02", num: 2, port: "AC_SOCKET_2", label: "Mist Pump",   icon: <Wind className="w-4 h-4" /> },
  { id: "RELAY_03", num: 3, port: "DC_PORT_A",   label: "NPK-A Pump",  icon: <FlaskConical className="w-4 h-4" /> },
  { id: "RELAY_04", num: 4, port: "DC_PORT_B",   label: "NPK-B Pump",  icon: <FlaskConical className="w-4 h-4" /> },
  { id: "RELAY_05", num: 5, port: "DC_PORT_C",   label: "NPK-C Pump",  icon: <FlaskConical className="w-4 h-4" /> },
];

export default function AutomationPanel() {
  const [activeRelays, setActiveRelays] = useState<Record<number, boolean>>({1:false,2:false,3:false,4:false,5:false});
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingRelay, setTogglingRelay] = useState<number | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({ rule_name: "", sensor_field: "soil_moisture", operator: "<", threshold_value: 40, relay_pin: 1, trigger_type: "threshold" });

  const fetchRules = useCallback(async () => {
    try {
      const res = await automationApi.getRules();
      setRules(res.data);
      // Derive relay states from active rules that were recently triggered
      const states: Record<number, boolean> = {1:false,2:false,3:false,4:false,5:false};
      res.data.forEach((r: Rule) => {
        if (r.is_active && r.last_triggered) {
          const lastT = new Date(r.last_triggered).getTime();
          const now = Date.now();
          if (now - lastT < 60000) states[r.relay_pin] = true;
        }
      });
      setActiveRelays(states);
    } catch (e) {
      console.error("Rules fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); const i = setInterval(fetchRules, 10000); return () => clearInterval(i); }, [fetchRules]);

  const handleRelayToggle = async (relayNum: number) => {
    setTogglingRelay(relayNum);
    try {
      const newState = !activeRelays[relayNum];
      await automationApi.controlRelay(relayNum, newState);
      setActiveRelays(prev => ({ ...prev, [relayNum]: newState }));
    } catch (e) {
      console.error("Relay toggle error:", e);
    } finally {
      setTogglingRelay(null);
    }
  };

  const handleRuleToggle = async (ruleId: number) => {
    try {
      await automationApi.toggleRule(ruleId);
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: !r.is_active } : r));
    } catch (e) { console.error("Rule toggle error:", e); }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await automationApi.deleteRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (e) { console.error("Delete error:", e); }
  };

  const handleAddRule = async () => {
    try {
      const { api } = await import("@/lib/api");
      await api.post("/automation/rules", newRule);
      setShowAddRule(false);
      setNewRule({ rule_name: "", sensor_field: "soil_moisture", operator: "<", threshold_value: 40, relay_pin: 1, trigger_type: "threshold" });
      fetchRules();
    } catch (e) { console.error("Add rule error:", e); }
  };

  const armedCount = rules.filter(r => r.is_active).length;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300 font-mono">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Power className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-100">Relay Control Matrix</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">IRIV_AGRIBOX_01 // HW_REV 3.2 // 5-CH RELAY MODULE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-emerald-400">LINK_ACTIVE</span>
        </div>
      </div>

      {/* 5-Relay Grid */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {RELAY_CONFIG.map((relay) => {
          const active = activeRelays[relay.num];
          const isToggling = togglingRelay === relay.num;
          return (
            <div key={relay.id} className={`relative bg-zinc-900 rounded-lg p-4 border transition-all duration-500 ${active ? "border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-zinc-800"}`}>
              <div className="absolute inset-x-0 top-0 h-px bg-white/5 rounded-t-lg" />
              {active && <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400 rounded-t-lg animate-pulse" />}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">{relay.id}</span>
                <div className={`p-1.5 rounded-md ${active ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-800 text-zinc-600"}`}>
                  {relay.icon}
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{relay.port}</p>
              <p className="text-xs text-zinc-300 font-medium mb-4">{relay.label}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-zinc-950 rounded px-2 py-1.5 border border-zinc-800">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">TYPE</p>
                  <p className="text-[10px] font-mono font-bold text-zinc-500">{relay.num <= 2 ? "AC" : "DC"}</p>
                </div>
                <div className="bg-zinc-950 rounded px-2 py-1.5 border border-zinc-800">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">STATE</p>
                  <p className={`text-[10px] font-mono font-bold ${active ? "text-emerald-400" : "text-zinc-600"}`}>{active ? "ON" : "OFF"}</p>
                </div>
              </div>
              <button
                onClick={() => handleRelayToggle(relay.num)}
                disabled={isToggling}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-md text-[10px] uppercase tracking-widest font-bold border transition-all duration-300 cursor-pointer disabled:opacity-50 ${active ? "bg-emerald-400/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400/20" : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800"}`}
              >
                {isToggling ? <span className="animate-spin">⟳</span> : active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {isToggling ? "SWITCHING..." : active ? "ENGAGED" : "STANDBY"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Rules Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800">
          <Activity className="w-4 h-4 text-amber-500" />
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-zinc-300">Active_Rules</h2>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 ml-auto">{armedCount}/{rules.length} ARMED</span>
          <button
            onClick={() => setShowAddRule(!showAddRule)}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer ml-2"
          >
            <Plus className="w-3.5 h-3.5" /> ADD_RULE
          </button>
        </div>

        {/* Add Rule Form */}
        {showAddRule && (
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/50 grid grid-cols-6 gap-3">
            <input placeholder="Rule name" value={newRule.rule_name} onChange={e => setNewRule(p => ({...p, rule_name: e.target.value}))}
              className="col-span-2 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-[11px] text-zinc-300 font-mono focus:border-emerald-500/50 outline-none" />
            <select value={newRule.sensor_field} onChange={e => setNewRule(p => ({...p, sensor_field: e.target.value}))}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-[11px] text-zinc-300 font-mono focus:border-emerald-500/50 outline-none">
              <option value="soil_moisture">soil_moisture</option>
              <option value="temperature">temperature</option>
              <option value="humidity">humidity</option>
              <option value="ec_level">ec_level</option>
            </select>
            <select value={newRule.operator} onChange={e => setNewRule(p => ({...p, operator: e.target.value}))}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-[11px] text-zinc-300 font-mono focus:border-emerald-500/50 outline-none">
              <option value="<">{"<"}</option>
              <option value=">">{">"}</option>
            </select>
            <input type="number" placeholder="Threshold" value={newRule.threshold_value} onChange={e => setNewRule(p => ({...p, threshold_value: parseFloat(e.target.value)}))}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-[11px] text-zinc-300 font-mono focus:border-emerald-500/50 outline-none" />
            <select value={newRule.relay_pin} onChange={e => setNewRule(p => ({...p, relay_pin: parseInt(e.target.value)}))}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-[11px] text-zinc-300 font-mono focus:border-emerald-500/50 outline-none">
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
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[10px] text-zinc-600">Loading rules...</td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[10px] text-zinc-600">No rules configured. Click ADD_RULE to create one.</td></tr>
              ) : rules.map((rule) => (
                <tr key={rule.id} className={`border-b border-zinc-800/30 transition-colors ${rule.is_active ? "hover:bg-zinc-800/30" : "opacity-40"}`}>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-600">#{rule.id}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-400 font-bold">{rule.rule_name}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-zinc-400">
                    IF {rule.sensor_field} {rule.operator} {rule.threshold_value}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-emerald-400/80">RELAY_0{rule.relay_pin}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${rule.is_active ? "text-emerald-400" : "text-zinc-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      {rule.is_active ? "ARMED" : "DISARMED"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-zinc-600">
                    {rule.last_triggered ? new Date(rule.last_triggered).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button onClick={() => handleRuleToggle(rule.id)} className="cursor-pointer">
                      {rule.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-zinc-600" />}
                    </button>
                    <button onClick={() => handleDeleteRule(rule.id)} className="text-zinc-700 hover:text-rose-500 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 border-t border-zinc-800 bg-zinc-950/50">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-[9px] uppercase tracking-widest text-zinc-600">Rule engine cycle: 10s // Relays 1-2: IPC GPIO // Relays 3-5: IOC Modbus TCP</span>
        </div>
      </div>
    </div>
  );
}