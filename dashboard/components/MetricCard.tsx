"use client";
import React from "react";

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  unit?: string;
  sub?: string;
  status?: "ok" | "normal" | "low" | "moderate" | "high";
  statusLabel?: string;
}

export function MetricCard({ title, icon, value, unit, sub, status = "ok", statusLabel }: MetricCardProps) {
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "high") badgeColor = "bg-red-50 text-red-700 border-red-200";
  else if (status === "moderate") badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
  else if (status === "ok" || status === "normal" || status === "low") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="clinical-card p-4 flex flex-col justify-between clinical-card-hover">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        {statusLabel ? (
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}>
            {statusLabel}
          </span>
        ) : <span />}
        {sub && <span className="text-slate-400 text-[11px]">{sub}</span>}
      </div>
    </div>
  );
}
