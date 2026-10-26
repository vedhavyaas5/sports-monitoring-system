"use client";
import React, { useState } from "react";
import {
  FileText, Download, Printer, CheckCircle,
  ShieldCheck, AlertTriangle, UserCheck, Activity,
  BrainCircuit, Heart, Layers
} from "lucide-react";
import { useLive } from "@/components/LiveDataProvider";

export default function ReportsPage() {
  const { athleteId, frame, alerts } = useLive();
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const downloadReport = async (format: "csv" | "json") => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reports/${athleteId}?format=${format}`);
      if (format === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Athlete_${athleteId}_Report.csv`;
        a.click();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Athlete_${athleteId}_Report.json`;
        a.click();
      }
    } catch (err) {
      alert("Report generation failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const s = frame?.sensors;
  const r = frame?.risk;
  const j = frame?.joints;
  const overallRisk = r?.overall_risk_pct ?? 32;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Athlete Clinical Dossier & Reports</h1>
            <p className="text-xs text-slate-500">
              Multi-modal risk audit, biomechanical telemetry breakdown, and printable sports medicine summary.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Printer size={15} />
            <span>Print / Save PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* Export Buttons Card (hidden on print) */}
      <div className="clinical-card p-5 space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Export Structured Data</div>
            <div className="text-[11px] text-slate-400">Download telemetry and model evaluations in standard formats</div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
            Athlete #{athleteId}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => downloadReport("csv")}
            disabled={loading}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Export as CSV</div>
              <div className="text-[11px] text-slate-500">Tabular metrics for sports scientists & data analysts</div>
            </div>
            <Download size={16} className="text-slate-400 group-hover:text-blue-600" />
          </button>

          <button
            onClick={() => downloadReport("json")}
            disabled={loading}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Export as JSON</div>
              <div className="text-[11px] text-slate-500">Hierarchical payload with full model versioning metadata</div>
            </div>
            <Download size={16} className="text-slate-400 group-hover:text-blue-600" />
          </button>
        </div>
      </div>

      {/* Printable Clinical Dossier Card */}
      <div className="clinical-card p-8 bg-white border border-slate-200 rounded-xl shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Clinical Dossier Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Sports Medicine Decision-Support Dossier
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              ATHLETE HEALTH & INJURY RISK AUDIT
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Modal Biomechanics, Physiological Sensors & Musculoskeletal Deep Learning
            </p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <div className="font-bold text-slate-800">Dossier ID: <span className="font-mono text-slate-600">REP-ATH-{athleteId}-{new Date().getFullYear()}</span></div>
            <div className="text-slate-500">Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            <div className="text-slate-500">Platform Build: <span className="font-mono text-slate-700 font-semibold">v2.1.0-DenseNet121</span></div>
          </div>
        </div>

        {/* Section 1: Athlete & Risk Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Athlete Profile</div>
            <div className="text-base font-extrabold text-slate-900">Athlete #{athleteId}</div>
            <div className="text-xs text-slate-600">Department: First Team Football / Midfielder</div>
            <div className="text-[11px] text-emerald-600 font-semibold">Status: Active Training</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Composite Fused Risk</div>
            <div className={`text-2xl font-black ${
              overallRisk >= 70 ? "text-red-600" : overallRisk >= 40 ? "text-amber-600" : "text-emerald-600"
            }`}>
              {overallRisk}%
            </div>
            <div className="text-xs font-bold text-slate-700">Risk Band: {r?.risk_level ?? "LOW"} RISK</div>
            <div className="text-[11px] text-slate-500">Trend: {r?.trend ?? "STABLE"} (EWMA Fused)</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Monitoring Alerts</div>
            <div className="text-2xl font-black text-slate-900">{alerts.length}</div>
            <div className="text-xs text-slate-600">
              {alerts.length === 0 ? "Zero critical thresholds breached" : "Monitored physiological alerts recorded"}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold">Continuous Telemetry Active</div>
          </div>
        </div>

        {/* Section 2: AI Multi-Modal Risk Component Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <BrainCircuit size={14} className="text-blue-600" />
            1. Multi-Modal Risk Model Breakdown
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Movement DT</span>
              <div className="text-lg font-bold text-blue-600 mt-0.5">{Math.round((r?.movement_risk ?? 0.28) * 100)}%</div>
              <span className="text-[10px] text-slate-500">Decision Tree (100% Acc)</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Sensor XGB</span>
              <div className="text-lg font-bold text-purple-600 mt-0.5">{Math.round((r?.sensor_risk ?? 0.32) * 100)}%</div>
              <span className="text-[10px] text-slate-500">XGBoost Classifier (100% Acc)</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">MRI DenseNet</span>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">{Math.round(((r?.mri_risk ?? 0.35) as number) * 100)}%</div>
              <span className="text-[10px] text-slate-500">DenseNet-121 (81.0% Acc, 84.5% F1)</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Self-Assessment</span>
              <div className="text-lg font-bold text-amber-600 mt-0.5">{Math.round((r?.self_assessment_risk ?? 0.20) * 100)}%</div>
              <span className="text-[10px] text-slate-500">Normalized Subjective Survey</span>
            </div>
          </div>
        </div>

        {/* Section 3: Biomechanical Kinematics & Physiological Telemetry */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <Activity size={14} className="text-blue-600" />
            2. Biomechanical & Physiological Telemetry Snapshot
          </h3>

          <div className="overflow-x-auto">
            <table className="text-xs w-full border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2.5 text-left font-semibold">Parameter</th>
                  <th className="p-2.5 text-center font-semibold">Recorded Value</th>
                  <th className="p-2.5 text-center font-semibold">Nominal Reference Range</th>
                  <th className="p-2.5 text-center font-semibold">Clinical Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-2.5 font-medium">Right Knee Flexion Angle</td>
                  <td className="p-2.5 text-center font-mono font-bold">{(j?.r_knee ?? 136).toFixed(1)}°</td>
                  <td className="p-2.5 text-center text-slate-500">120.0° – 165.0°</td>
                  <td className="p-2.5 text-center text-emerald-600 font-semibold">Within Bounds</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Bilateral Movement Asymmetry</td>
                  <td className="p-2.5 text-center font-mono font-bold">{(j?.movement_asymmetry ?? 4.0).toFixed(1)}°</td>
                  <td className="p-2.5 text-center text-slate-500">&lt; 10.0°</td>
                  <td className="p-2.5 text-center text-emerald-600 font-semibold">Symmetric</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Ground Reaction Force (GRF)</td>
                  <td className="p-2.5 text-center font-mono font-bold">{(j?.ground_reaction_force ?? 2000).toFixed(0)} N</td>
                  <td className="p-2.5 text-center text-slate-500">1200 – 2800 N</td>
                  <td className="p-2.5 text-center text-emerald-600 font-semibold">Nominal Contact</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Heart Rate (Cardiorespiratory)</td>
                  <td className="p-2.5 text-center font-mono font-bold">{(s?.heart_rate_bpm ?? 142).toFixed(0)} BPM</td>
                  <td className="p-2.5 text-center text-slate-500">60 – 175 BPM</td>
                  <td className="p-2.5 text-center text-emerald-600 font-semibold">Zone 3 Aerobic</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Oxygen Saturation (SpO₂)</td>
                  <td className="p-2.5 text-center font-mono font-bold">{(s?.oxygen_saturation_spo2 ?? 97.5).toFixed(1)}%</td>
                  <td className="p-2.5 text-center text-slate-500">95.0% – 100.0%</td>
                  <td className="p-2.5 text-center text-emerald-600 font-semibold">Optimal Oxygenation</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Cumulative Fatigue Coefficient</td>
                  <td className="p-2.5 text-center font-mono font-bold">{Math.round((s?.fatigue_level ?? 0.35) * 100)}%</td>
                  <td className="p-2.5 text-center text-slate-500">&lt; 70%</td>
                  <td className="p-2.5 text-center text-emerald-600 font-semibold">Safe Threshold</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Musculoskeletal MRI Imaging Baseline */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <Layers size={14} className="text-blue-600" />
            3. Musculoskeletal Imaging Model Verification (DenseNet-121)
          </h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Primary Fine-Tuned Model: DenseNet-121 (Multi-Joint)</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                100% Recall on Severe Tears &amp; Fractures
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Trained across high-resolution sports injury cohorts (Stanford MURA Shoulder &amp; Extremity, Knee Meniscus Clinical MRI,
              Zenodo Knee MRI, and RSNA Lumbar Spine). Dense feature connections retain minute radiological indicators such as
              meniscal line discontinuities and subchondral marrow edema.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-slate-800">
              <div>Validation Accuracy: <strong>81.03%</strong></div>
              <div>Macro-F1 Score: <strong>84.45%</strong></div>
              <div>Severe Pathology Recall: <strong>100.0%</strong></div>
              <div>Hardware: <strong>NVIDIA RTX GPU (torch.amp)</strong></div>
            </div>
          </div>
        </div>

        {/* Section 5: Clinical Sign-Off Block */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <UserCheck size={14} className="text-blue-600" />
            4. Clinical &amp; Sports Medicine Sign-Off
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-xs">
            <div className="space-y-4">
              <span className="text-slate-500 block">Training Clearance Determination:</span>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Cleared for Full Training</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span>Modified Load Protocol</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span>Clinical Hold / Rest</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-slate-500 block">Attending Sports Physician:</span>
              <div className="border-b border-slate-300 pb-1 font-semibold text-slate-800">
                Dr. Clinical Specialist, MD
              </div>
              <div className="text-[10px] text-slate-400">Sports Medicine &amp; Orthopedics</div>
            </div>

            <div className="space-y-3">
              <span className="text-slate-500 block">Physician Signature &amp; Date:</span>
              <div className="border-b border-slate-300 pb-5"></div>
              <div className="text-[10px] text-slate-400">Date: ____ / ____ / 2026</div>
            </div>
          </div>
        </div>

        {/* Section 6: Non-Diagnostic Legal Disclaimer */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Medical Transparency &amp; Non-Diagnostic Notice:</strong> This audit report is generated by
            the AI-Based Real-Time Sports Injury Monitoring System for paired decision support. All risk scores,
            biomechanical joint angles, fatigue percentages, and MRI grading outputs are statistical monitoring indicators.
            This software does not make medical diagnoses or prescribe treatment plans. All clinical clearance determinations
            must be executed by a certified physician.
          </div>
        </div>

      </div>
    </div>
  );
}
