"use client";
import React from "react";
import { useLive } from "./LiveDataProvider";
import { Activity } from "lucide-react";

export function JointAnalysis() {
  const { frame } = useLive();
  const j = frame?.joints;

  const joints = [
    { label: "Left Knee Angle", val: j?.l_knee ?? 140, max: 180, unit: "°", norm: "120° - 165°" },
    { label: "Right Knee Angle", val: j?.r_knee ?? 136, max: 180, unit: "°", norm: "120° - 165°" },
    { label: "Left Hip Angle", val: j?.l_hip ?? 155, max: 180, unit: "°", norm: "135° - 175°" },
    { label: "Movement Asymmetry", val: j?.movement_asymmetry ?? 4.0, max: 30, unit: "°", norm: "< 10°" },
    { label: "Ground Reaction Force", val: j?.ground_reaction_force ?? 2000, max: 4000, unit: "N", norm: "1200 - 2800 N" },
  ];

  return (
    <div className="clinical-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Biomechanical Joint Kinematics
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-semibold">Continuous Telemetry</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {joints.map((joint) => {
          const pct = Math.min(100, Math.max(0, (joint.val / joint.max) * 100));
          return (
            <div key={joint.label} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{joint.label}</span>
                <span className="text-slate-900 font-bold">{joint.val.toFixed(1)} {joint.unit}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Nominal Range: {joint.norm}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
