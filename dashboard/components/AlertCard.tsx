"use client";
import React, { useState } from "react";
import { AlertCircle, Check, ShieldAlert } from "lucide-react";

interface AlertCardProps {
  alert: {
    id: string;
    athlete_id: string;
    level: string;
    severity?: string;
    risk_score: number;
    reasons: string[];
    timestamp: number;
    acknowledged: boolean;
  };
  onAck?: (id: string) => void;
}

export function AlertCard({ alert, onAck }: AlertCardProps) {
  const [acked, setAcked] = useState(alert.acknowledged);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const handleAcknowledge = async () => {
    try {
      await fetch(`${API}/api/alerts/${alert.id}/acknowledge`, { method: "POST" });
      setAcked(true);
      if (onAck) onAck(alert.id);
    } catch {}
  };

  const isHigh = alert.level === "HIGH" || alert.level === "HIGH PRIORITY" || alert.severity === "HIGH PRIORITY";

  return (
    <div className={`p-3.5 rounded-lg border transition-all ${
      isHigh ? "bg-red-50/70 border-red-200 text-red-900" : "bg-amber-50/70 border-amber-200 text-amber-900"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <ShieldAlert size={16} className={isHigh ? "text-red-600 mt-0.5" : "text-amber-600 mt-0.5"} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {alert.level || alert.severity || "WARNING"}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Athlete #{alert.athlete_id}
              </span>
            </div>
            <p className="text-xs font-medium mt-1 leading-snug">
              {Array.isArray(alert.reasons) ? alert.reasons.join(" · ") : "Elevated monitoring indicator detected"}
            </p>
          </div>
        </div>

        {!acked ? (
          <button
            onClick={handleAcknowledge}
            className="text-[11px] font-bold px-2.5 py-1 bg-white border border-slate-300 rounded shadow-xs hover:bg-slate-50 text-slate-700 shrink-0"
          >
            Acknowledge
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 shrink-0">
            <Check size={12} /> Acked
          </span>
        )}
      </div>
    </div>
  );
}
