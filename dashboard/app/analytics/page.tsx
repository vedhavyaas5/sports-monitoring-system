"use client";
import React from "react";
import { useLive } from "@/components/LiveDataProvider";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Activity, AlertTriangle,
  Heart, Zap, ShieldCheck, BarChart3
} from "lucide-react";

export default function AnalyticsPage() {
  const { history, athleteId } = useLive();

  const data = history.map((f, i) => ({
    t: i,
    overall:  Math.round((f.risk?.smoothed_risk ?? 0) * 100),
    movement: Math.round((f.risk?.movement_risk ?? 0) * 100),
    sensor:   Math.round((f.risk?.sensor_risk   ?? 0) * 100),
    vision:   Math.round((f.risk?.vision_risk   ?? 0) * 100),
    mri:      Math.round(((f.risk?.mri_risk ?? 0.35) as number) * 100),
    fatigue:  Math.round((f.sensors?.fatigue_level ?? 0) * 100),
    load:     Math.round(f.sensors?.training_load ?? 0),
    hr:       Math.round(f.sensors?.heart_rate_bpm ?? 0),
    asymm:    +(f.joints?.movement_asymmetry ?? 0).toFixed(1),
  }));

  const lastFrame = history[history.length - 1];
  const avgRisk = data.length > 0 ? Math.round(data.reduce((a, b) => a + b.overall, 0) / data.length) : 28;
  const peakLoad = data.length > 0 ? Math.max(...data.map(d => d.load)) : 320;
  const peakAsymm = data.length > 0 ? Math.max(...data.map(d => d.asymm)) : 6.2;
  const avgHR = data.length > 0 ? Math.round(data.reduce((a, b) => a + b.hr, 0) / data.length) : 142;

  const ChartCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="clinical-card p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {title}
          </h2>
        </div>
        <span className="text-[10px] font-semibold text-slate-400">Live Window</span>
      </div>
      {children}
    </div>
  );

  const TT = {
    contentStyle: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 11,
      color: "#0f172a",
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
    },
    labelStyle: { display: "none" as const },
  };

  return (
    <div className="space-y-5 max-w-screen-2xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Session Analytics & Multi-Modal Trends
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Temporal biomechanical analysis, physiological telemetry, and AI fusion tracking for Athlete #{athleteId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
            Active Stream: {history.length} Data Points
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="clinical-card p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Session Risk</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{avgRisk}%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Nominal Baseline</div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Training Load</div>
          <div className="text-xl font-extrabold text-blue-600 mt-1">{peakLoad} <span className="text-xs font-normal text-slate-500">AU</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">Target: &lt; 400 AU</div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Joint Asymmetry</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">{peakAsymm}°</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Threshold: &lt; 10°</div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mean Heart Rate</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{avgHR} <span className="text-xs font-normal text-slate-500">BPM</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cardiorespiratory Zone 3</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="Multi-Modal Risk Progression Over Time" icon={<TrendingUp size={15} className="text-amber-500" />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v, n) => [`${Number(v ?? 0)}%`, String(n)]} />
              <Line type="monotone" dataKey="overall" stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Fused Overall" />
              <Line type="monotone" dataKey="movement" stroke="#2563eb" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Movement DT" />
              <Line type="monotone" dataKey="sensor" stroke="#7c3aed" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Sensor XGB" />
              <Line type="monotone" dataKey="mri" stroke="#059669" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} name="MRI DenseNet" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fatigue Index Dynamic Trajectory" icon={<Zap size={15} className="text-red-500" />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v) => [`${Number(v ?? 0)}%`, "Fatigue"]} />
              <Line type="monotone" dataKey="fatigue" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cumulative Training Load (Last 30 Windows)" icon={<Activity size={15} className="text-blue-500" />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.slice(-30)} margin={{ top: 10, right: 10, bottom: 0, left: -20 }} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v) => [`${Number(v ?? 0)}`, "Load"]} />
              <Bar dataKey="load" fill="#2563eb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bilateral Movement Asymmetry (° Deviation)" icon={<TrendingUp size={15} className="text-amber-600" />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v) => [`${Number(v ?? 0)}°`, "Asymmetry"]} />
              <Line type="monotone" dataKey="asymm" stroke="#d97706" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cardiorespiratory Response (Heart Rate BPM)" icon={<Heart size={15} className="text-rose-500" />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis domain={[50, 200]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v) => [`${Number(v ?? 0)} bpm`, "Heart Rate"]} />
              <Line type="monotone" dataKey="hr" stroke="#e11d48" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Model Architecture Comparison (Current Telemetry Frame)" icon={<BarChart3 size={15} className="text-indigo-600" />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { model: "Movement DT", risk: Math.round((lastFrame?.risk?.movement_risk ?? 0.28) * 100), fill: "#2563eb" },
                { model: "Sensor XGB",   risk: Math.round((lastFrame?.risk?.sensor_risk ?? 0.32) * 100), fill: "#7c3aed" },
                { model: "MRI DenseNet", risk: Math.round(((lastFrame?.risk?.mri_risk ?? 0.35) as number) * 100), fill: "#059669" },
                { model: "Fused Risk",   risk: Math.round((lastFrame?.risk?.overall_risk_pct ?? 32)), fill: "#d97706" },
              ]}
              margin={{ top: 15, right: 10, bottom: 0, left: -20 }} barSize={38}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="model" tick={{ fontSize: 10, fill: "#334155", fontWeight: 600 }} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={(v) => [`${Number(v ?? 0)}%`, "Risk Output"]} />
              <Bar dataKey="risk" radius={[4, 4, 0, 0]}
                fill="#2563eb"
                label={{ position: "top", fontSize: 10, fill: "#334155", fontWeight: 700,
                  formatter: (v: unknown) => `${Number(v ?? 0)}%` }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Decision Support Disclaimer Footer */}
      <div className="clinical-card p-4 bg-amber-50/60 border border-amber-200 text-amber-900 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800/90 leading-relaxed">
          <strong>Decision Support Transparency Notice:</strong> All predictive trajectories, fatigue coefficients,
          and model comparisons are non-diagnostic statistical indicators designed for clinical pair-monitoring.
          Final training clearance and medical decisions remain solely with licensed medical professionals.
        </div>
      </div>
    </div>
  );
}
