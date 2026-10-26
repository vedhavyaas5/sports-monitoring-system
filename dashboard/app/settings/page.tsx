"use client";
import React, { useState } from "react";
import { Settings, Sliders, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [movementWeight, setMovement] = useState(0.30);
  const [sensorWeight, setSensor] = useState(0.25);
  const [assessmentWeight, setAssessment] = useState(0.20);
  const [mriWeight, setMri] = useState(0.15);
  const [trendWeight, setTrend] = useState(0.10);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">System Configuration & Multi-Modal Weights</h1>
            <p className="text-xs text-slate-500">
              Configure engineering fusion weights, temporal smoothing factors, and simulation parameters.
            </p>
          </div>
        </div>
      </div>

      <div className="clinical-card p-6 space-y-6">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Multi-Modal Risk Fusion Weights (Sum = 1.0)
        </h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Physical Movement Model</span>
              <span className="text-blue-600">{(movementWeight * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={movementWeight} onChange={e => setMovement(parseFloat(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Physiological Sensor Model</span>
              <span className="text-purple-600">{(sensorWeight * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={sensorWeight} onChange={e => setSensor(parseFloat(e.target.value))} className="w-full accent-purple-600" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Self-Assessment Intake</span>
              <span className="text-teal-600">{(assessmentWeight * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={assessmentWeight} onChange={e => setAssessment(parseFloat(e.target.value))} className="w-full accent-teal-600" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>MRI Image Model</span>
              <span className="text-rose-600">{(mriWeight * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={mriWeight} onChange={e => setMri(parseFloat(e.target.value))} className="w-full accent-rose-600" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Temporal Trend & Baseline Deviation</span>
              <span className="text-amber-600">{(trendWeight * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={trendWeight} onChange={e => setTrend(parseFloat(e.target.value))} className="w-full accent-amber-600" />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {saved ? <Check size={14} /> : <Save size={14} />} {saved ? "Configuration Saved" : "Save Fusion Configuration"}
        </button>
      </div>
    </div>
  );
}
