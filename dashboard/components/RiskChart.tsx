"use client";
import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useLive } from "./LiveDataProvider";

export function RiskChart() {
  const { history } = useLive();

  const data = history.map((f, i) => ({
    time: i,
    overall: f.risk?.overall_risk_pct ?? 0,
    movement: (f.risk?.movement_risk ?? 0) * 100,
    sensor: (f.risk?.sensor_risk ?? 0) * 100,
  }));

  return (
    <div className="clinical-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Multi-Modal Risk Progression
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time rolling observation window (Last 60 frames)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-blue-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Overall Risk
          </span>
          <span className="flex items-center gap-1.5 text-indigo-500">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Movement
          </span>
          <span className="flex items-center gap-1.5 text-purple-500">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Sensor
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
            <Line type="monotone" dataKey="overall" stroke="#2563eb" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="movement" stroke="#6366f1" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="sensor" stroke="#a855f7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
