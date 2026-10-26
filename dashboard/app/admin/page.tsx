"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck, Users, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  const [summary, setSummary] = useState<any>(null);
  const [quality, setQuality] = useState<any>(null);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/dashboard`).then(r => r.json()).then(setSummary).catch(() => {});
    fetch(`${API}/api/dataset/quality-report`).then(r => r.json()).then(setQuality).catch(() => {});
  }, [API]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Admin & Coaching Overview</h1>
            <p className="text-xs text-slate-500">
              Team-level risk distributions, active monitoring sessions, and dataset audit reports.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clinical-card p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Monitored Athletes</span>
          <div className="text-3xl font-extrabold text-slate-900">{summary?.total_athletes ?? 5}</div>
        </div>
        <div className="clinical-card p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Sessions</span>
          <div className="text-3xl font-extrabold text-blue-600">{summary?.active_monitoring_sessions ?? 3}</div>
        </div>
        <div className="clinical-card p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">Elevated Risk Cases</span>
          <div className="text-3xl font-extrabold text-amber-600">{summary?.athletes_at_elevated_risk ?? 1}</div>
        </div>
      </div>

      {/* Dataset Audit Report */}
      <div className="clinical-card p-6 space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Dataset Quality & Ingestion Audits
        </h2>
        {quality?.reports?.map((rep: any) => (
          <div key={rep.filename} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">{rep.filename} ({rep.total_samples} samples)</div>
              <div className="text-[11px] text-slate-500">Missing values: {Object.keys(rep.missing_values).length} · Duplicates: {rep.duplicate_rows}</div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} /> {rep.status} ({rep.quality_score_pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
