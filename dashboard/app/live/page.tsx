"use client";
import React from "react";
import { useLive } from "@/components/LiveDataProvider";
import { RiskGauge } from "@/components/RiskGauge";
import { RiskChart } from "@/components/RiskChart";
import { JointAnalysis } from "@/components/JointAnalysis";
import { MetricCard } from "@/components/MetricCard";
import { Heart, Droplets, Activity, Zap } from "lucide-react";

export default function LiveMonitorPage() {
  const { frame, athleteId, demo } = useLive();
  const s = frame?.sensors;
  const r = frame?.risk;

  return (
    <div className="max-w-screen-2xl mx-auto space-y-5">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Real-Time Live Telemetry Monitor</h1>
          <p className="text-xs text-slate-500">Live 1Hz WebSocket streaming stream for Athlete #{athleteId}</p>
        </div>
        {demo && <span className="demo-badge">LIVE SIMULATION</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title="Heart Rate" icon={<Heart size={14}/>} value={s?.heart_rate_bpm?.toFixed(0) ?? "140"} unit="BPM" />
        <MetricCard title="SpO₂ Oxygen" icon={<Droplets size={14}/>} value={s?.oxygen_saturation_spo2?.toFixed(1) ?? "97.5"} unit="%" />
        <MetricCard title="Workload" icon={<Activity size={14}/>} value={s?.training_load?.toFixed(0) ?? "250"} />
        <MetricCard title="Latency" icon={<Zap size={14}/>} value={frame?.performance?.e2e_latency_ms?.toFixed(0) ?? "18"} unit="ms" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          <RiskGauge
            score={r?.overall_risk_pct ?? 25}
            level={r?.risk_level ?? "LOW"}
            movementRisk={r?.movement_risk ?? 0.2}
            sensorRisk={r?.sensor_risk ?? 0.3}
          />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <RiskChart />
          <JointAnalysis />
        </div>
      </div>
    </div>
  );
}
