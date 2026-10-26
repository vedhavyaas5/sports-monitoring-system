"use client";
import React from "react";
import { useLive } from "@/components/LiveDataProvider";
import { MetricCard } from "@/components/MetricCard";
import { RiskGauge } from "@/components/RiskGauge";
import { RiskChart } from "@/components/RiskChart";
import { JointAnalysis } from "@/components/JointAnalysis";
import { DigitalTwinBodyMap } from "@/components/DigitalTwinBodyMap";
import { SystemStatus } from "@/components/SystemStatus";
import { AlertCard } from "@/components/AlertCard";
import {
  Heart, Thermometer, Zap, Activity,
  TrendingUp, Droplets, Brain, AlertTriangle
} from "lucide-react";

function levelStatus(pct: number): "low" | "moderate" | "high" {
  if (pct >= 70) return "high";
  if (pct >= 40) return "moderate";
  return "low";
}

export default function Dashboard() {
  const { frame, demo, alerts, athleteId } = useLive();
  const s = frame?.sensors;
  const r = frame?.risk;
  const j = frame?.joints;

  const overallPct = r?.overall_risk_pct ?? 0;
  const movementPct = (r?.movement_risk ?? 0) * 100;
  const sensorPct = (r?.sensor_risk ?? 0) * 100;

  return (
    <div className="space-y-5 max-w-screen-2xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Sports Injury Monitoring Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-Time AI Multi-Modal Injury Risk & Decision Support &nbsp;·&nbsp; Athlete #{athleteId} &nbsp;·&nbsp;
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {demo && <span className="demo-badge">DEMO SIMULATION</span>}
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider
            ${overallPct >= 70
              ? "bg-red-50 border-red-200 text-red-700"
              : overallPct >= 40
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            Status: {r?.risk_level ?? "LOW"} RISK
          </div>
        </div>
      </div>

      {/* Row 1 — Physiological Sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="Heart Rate" icon={<Heart size={15} />}
          value={s?.heart_rate_bpm?.toFixed(0) ?? "140"} unit="BPM"
          status={s?.heart_rate_bpm && s.heart_rate_bpm > 170 ? "high" : s?.heart_rate_bpm && s.heart_rate_bpm > 145 ? "moderate" : "ok"}
          statusLabel={s?.heart_rate_bpm && s.heart_rate_bpm > 170 ? "Elevated" : "Optimal"} />

        <MetricCard title="SpO₂ Oxygen" icon={<Droplets size={15} />}
          value={s?.oxygen_saturation_spo2?.toFixed(1) ?? "97.5"} unit="%"
          status={s?.oxygen_saturation_spo2 && s.oxygen_saturation_spo2 < 93 ? "high" : "ok"}
          statusLabel={s?.oxygen_saturation_spo2 && s.oxygen_saturation_spo2 < 93 ? "Hypoxic" : "Normal"} />

        <MetricCard title="Fatigue Level" icon={<Brain size={15} />}
          value={s?.fatigue_level !== undefined ? `${(s.fatigue_level * 100).toFixed(0)}` : "35"} unit="%"
          status={levelStatus((s?.fatigue_level ?? 0.35) * 100)}
          statusLabel={levelStatus((s?.fatigue_level ?? 0.35) * 100).toUpperCase()} />

        <MetricCard title="Training Load" icon={<Activity size={15} />}
          value={s?.training_load?.toFixed(0) ?? "240"}
          status={s?.training_load && s.training_load > 380 ? "high" : s?.training_load && s.training_load > 260 ? "moderate" : "ok"}
          statusLabel={s?.training_load && s.training_load > 380 ? "High Load" : "Moderate"} />

        <MetricCard title="Skin Temp" icon={<Thermometer size={15} />}
          value={s?.skin_temperature_celsius?.toFixed(1) ?? "35.8"} unit="°C"
          status="normal" statusLabel="Baseline" />

        <MetricCard title="Hydration" icon={<Droplets size={15} />}
          value={s?.hydration_level !== undefined ? `${(s.hydration_level * 100).toFixed(0)}` : "68"} unit="%"
          status={s?.hydration_level && s.hydration_level < 0.4 ? "high" : "ok"}
          statusLabel={s?.hydration_level && s.hydration_level < 0.4 ? "Dehydrated" : "Good"} />
      </div>

      {/* Main Grid: Col 1 (Gauge + Alerts), Col 2 (Chart + Biomechanics), Col 3 (Contributing Factors & System) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-4">
          <RiskGauge
            score={overallPct}
            level={r?.risk_level ?? "LOW"}
            movementRisk={r?.movement_risk ?? 0.28}
            sensorRisk={r?.sensor_risk ?? 0.32}
            selfAssessmentRisk={r?.self_assessment_risk ?? 0.20}
            mriRisk={r?.mri_risk}
            trend={r?.trend ?? "STABLE"}
          />

          {alerts.length > 0 && (
            <div className="clinical-card p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Active Monitoring Alerts ({alerts.length})
              </span>
              <div className="space-y-2">
                {alerts.slice(0, 2).map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Column */}
        <div className="space-y-4">
          <RiskChart />
          <DigitalTwinBodyMap
            kneeAngle={j?.r_knee ?? 136}
            ankleAngle={j?.r_ankle ?? 88}
            grf={j?.ground_reaction_force ?? 2000}
            overallRisk={overallPct}
            mriRisk={r?.mri_risk ?? undefined}
          />
          <JointAnalysis />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <SystemStatus />

          {/* Contributing Indicators Card */}
          <div className="clinical-card p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Contributing Risk Indicators
            </h2>
            <div className="space-y-2">
              {(r?.contributing_indicators || [
                "Biomechanical movement deviation within standard baseline",
                "Physiological telemetry within nominal training range",
                "No elevated self-reported symptoms"
              ]).map((factor: string, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Transparency Disclaimer */}
          <div className="clinical-card p-4 bg-amber-50/60 border border-amber-200 text-amber-900">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800 uppercase tracking-wider mb-1">
              <AlertTriangle size={14} /> Decision Support Disclaimer
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              This system provides AI-based risk indicators for monitoring and decision support.
              It does not provide a medical diagnosis or replace professional clinical assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
