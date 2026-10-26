"use client";
import React, { useEffect, useState, use } from "react";
import { Users, ShieldAlert, Activity, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RiskGauge } from "@/components/RiskGauge";

export default function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [athlete, setAthlete] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/athletes/${id}`).then(r => r.json()).then(setAthlete).catch(() => {});
    fetch(`${API}/api/athletes/${id}/history`).then(r => r.json()).then(setHistory).catch(() => {});
  }, [id, API]);

  if (!athlete) return <div className="p-8 text-center text-slate-400">Loading Athlete #{id}...</div>;

  const riskPct = (athlete.current_risk ?? 0) * 100;
  const level = riskPct >= 70 ? "HIGH" : riskPct >= 40 ? "MODERATE" : "LOW";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/athletes" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800">
        <ArrowLeft size={14} /> Back to Athletes Directory
      </Link>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Athlete Profile</span>
          <h1 className="text-2xl font-extrabold text-slate-900">{athlete.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Age: {athlete.age} · Position: {athlete.position} · Sport: {athlete.sport}
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
          Status: {athlete.status?.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <RiskGauge
            score={riskPct}
            level={level}
            movementRisk={athlete.current_risk * 0.9}
            sensorRisk={athlete.current_risk * 1.1}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="clinical-card p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Personalized Biomechanical Baseline
            </h2>
            {athlete.computed_baseline ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(athlete.computed_baseline.metrics || {}).map(([k, v]: [string, any]) => (
                  <div key={k} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 capitalize">{k.replace(/_/g, " ")}</span>
                    <div className="text-slate-900 font-extrabold mt-0.5">{v.mean} (±{v.std})</div>
                    <div className="text-[10px] text-slate-400">Normal: {v.normal_min} - {v.normal_max}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 text-slate-500 rounded text-xs">
                Sufficient historical samples are being aggregated to calculate baseline normal range.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
