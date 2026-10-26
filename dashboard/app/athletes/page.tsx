"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ChevronRight, Activity, TrendingUp, UserPlus, KeyRound, ShieldCheck } from "lucide-react";

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/athletes`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAthletes(data); })
      .catch(() => {});

    fetch(`${API}/api/users`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, [API]);

  const userAthleteIds = new Set(users.map(u => u.athlete_id).filter(Boolean));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Athletes & Squad Roster Directory</h1>
            <p className="text-xs text-slate-500 font-medium">
              Personalized baseline kinematics, historical risk curves, and electronic medical clearances.
            </p>
          </div>
        </div>

        <Link
          href="/login?tab=register"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start md:self-auto"
        >
          <UserPlus size={16} />
          <span>+ Add New Athlete or Staff</span>
        </Link>
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {athletes.map((a) => {
          const riskPct = (a.current_risk ?? 0) * 100;
          let badge = "bg-emerald-50 text-emerald-700 border-emerald-200";
          if (riskPct >= 70) badge = "bg-red-50 text-red-700 border-red-200";
          else if (riskPct >= 40) badge = "bg-amber-50 text-amber-700 border-amber-200";

          const hasUserAccount = userAthleteIds.has(a.id);
          const baseline = a.baseline_metrics;

          return (
            <Link
              key={a.id}
              href={`/athletes/${a.id}`}
              className="clinical-card p-6 clinical-card-hover flex flex-col justify-between space-y-4 rounded-2xl"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{a.id}</span>
                      {hasUserAccount && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-0.5">
                          <KeyRound size={9} /> Portal Login Active
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">{a.name}</h2>
                    <span className="text-xs font-semibold text-slate-500">{a.position || "Forward"} · {a.sport || "Football"}</span>
                  </div>
                  <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${badge}`}>
                    {riskPct.toFixed(0)}% RISK
                  </span>
                </div>

                {/* Biometrics row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Age</div>
                    <div className="text-xs font-bold text-slate-800">{a.age || 23} yrs</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Height</div>
                    <div className="text-xs font-bold text-slate-800">{baseline?.height_cm || 180} cm</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Weight</div>
                    <div className="text-xs font-bold text-slate-800">{baseline?.weight_kg || 75} kg</div>
                  </div>
                </div>

                {baseline?.notes && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    "{baseline.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                <span>Open Full Clinical Baseline</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
