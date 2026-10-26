"use client";
import React from "react";
import { ShieldAlert, TrendingUp } from "lucide-react";

export interface RiskGaugeProps {
  score: number;
  level: string;
  movementRisk: number;
  sensorRisk: number;
  visionRisk?: number;
  selfAssessmentRisk?: number;
  mriRisk?: number | null;
  trend?: string;
}

export function RiskGauge({ score, level, movementRisk, sensorRisk, visionRisk, selfAssessmentRisk = 0, mriRisk, trend = "STABLE" }: RiskGaugeProps) {
  const normalized = Math.min(Math.max(score, 0), 100);
  
  let color = "#10b981";
  let bgTint = "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (level === "HIGH" || normalized >= 70) {
    color = "#ef4444";
    bgTint = "bg-red-50 text-red-800 border-red-200";
  } else if (level === "MODERATE" || normalized >= 40) {
    color = "#f59e0b";
    bgTint = "bg-amber-50 text-amber-800 border-amber-200";
  }

  return (
    <div className="clinical-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Athlete Risk Status
          </h2>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${bgTint}`}>
          {level} RISK
        </span>
      </div>

      <div className="flex items-center justify-center py-2">
        <div className="relative flex flex-col items-center justify-center">
          <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="48" fill="none"
              stroke={color} strokeWidth="10"
              strokeDasharray={301.6}
              strokeDashoffset={301.6 - (301.6 * normalized) / 100}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {normalized.toFixed(1)}%
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Composite Risk
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600">Movement Model</span>
            <span className="text-slate-900 font-bold">{(movementRisk * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${movementRisk * 100}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600">Physiological Sensor</span>
            <span className="text-slate-900 font-bold">{(sensorRisk * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-purple-600" style={{ width: `${sensorRisk * 100}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600">Self-Assessment Intake</span>
            <span className="text-slate-900 font-bold">{(selfAssessmentRisk * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${selfAssessmentRisk * 100}%` }} />
          </div>
        </div>

        {mriRisk !== null && mriRisk !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-600">MRI Structural Signal</span>
              <span className="text-slate-900 font-bold">{(mriRisk * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-rose-600" style={{ width: `${mriRisk * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <TrendingUp size={14} className="text-slate-400" />
          Trend Trajectory:
        </span>
        <span className="font-bold text-slate-800">{trend}</span>
      </div>
    </div>
  );
}
