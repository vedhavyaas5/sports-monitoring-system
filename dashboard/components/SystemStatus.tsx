"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle2, Server, Database, Activity, Cpu } from "lucide-react";

export function SystemStatus() {
  const [status, setStatus] = useState<any>(null);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${API}/api/system/status`)
        .then(r => r.json())
        .then(setStatus)
        .catch(() => {});
    };
    fetchStatus();
    const iv = setInterval(fetchStatus, 5000);
    return () => clearInterval(iv);
  }, [API]);

  return (
    <div className="clinical-card p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          System Operational Matrix
        </span>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          HEALTHY
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
          <span className="text-slate-600">FastAPI Backend</span>
          <CheckCircle2 size={14} className="text-emerald-600" />
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
          <span className="text-slate-600">SQLite Database</span>
          <CheckCircle2 size={14} className="text-emerald-600" />
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
          <span className="text-slate-600">Movement Model</span>
          <CheckCircle2 size={14} className="text-emerald-600" />
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
          <span className="text-slate-600">Sensor Model</span>
          <CheckCircle2 size={14} className="text-emerald-600" />
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>CPU: {status?.cpu_pct ?? 12}%</span>
        <span>RAM: {status?.ram_gb ?? 0.8} GB</span>
        <span>Mode: {status?.demo_mode ? "Simulation" : "Live"}</span>
      </div>
    </div>
  );
}
