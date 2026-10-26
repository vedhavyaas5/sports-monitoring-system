"use client";
import React, { useEffect, useState } from "react";
import { Bell, ShieldAlert, Check, Filter } from "lucide-react";
import { AlertCard } from "@/components/AlertCard";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const fetchAlerts = () => {
    fetch(`${API}/api/alerts?level=${filterLevel}&last_n=100`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAlerts(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 4000);
    return () => clearInterval(iv);
  }, [filterLevel, API]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Alert Center & Notifications</h1>
            <p className="text-xs text-slate-500">
              Multi-level monitoring alerts (High Priority, Warning, Informational).
            </p>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          {["ALL", "HIGH PRIORITY", "WARNING", "INFO"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1 rounded transition-all ${
                filterLevel === lvl ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((a) => (
            <AlertCard key={a.id} alert={a} onAck={fetchAlerts} />
          ))
        ) : (
          <div className="clinical-card p-12 text-center text-slate-400 text-xs">
            <ShieldAlert size={32} className="mx-auto mb-2 text-slate-300" />
            <span>No active alerts under the selected filter criteria.</span>
          </div>
        )}
      </div>
    </div>
  );
}
