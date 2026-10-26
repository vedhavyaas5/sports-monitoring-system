"use client";
import React, { useState } from "react";
import { Activity, ShieldAlert, Sparkles, ChevronRight, Layers, Info } from "lucide-react";

interface JointPoint {
  id: string;
  name: string;
  region: "Shoulder" | "Spine" | "Knee" | "Ankle";
  x: number;
  y: number;
  riskScore: number; // 0 - 100
  telemetryNote: string;
  mriGrade: string;
  status: "Normal" | "Elevated Risk" | "Severe Risk";
}

interface DigitalTwinProps {
  kneeAngle?: number;
  ankleAngle?: number;
  grf?: number;
  overallRisk?: number;
  mriRisk?: number;
}

export function DigitalTwinBodyMap({
  kneeAngle = 68,
  ankleAngle = 88,
  grf = 1250,
  overallRisk = 32,
  mriRisk
}: DigitalTwinProps) {
  // Compute joint risks dynamically from telemetry inputs
  const kneeRisk = Math.min(100, Math.round((mriRisk ? mriRisk * 100 * 0.6 : 30) + (kneeAngle < 60 ? 35 : 10)));
  const ankleRisk = Math.min(100, Math.round((ankleAngle > 110 || ankleAngle < 60 ? 40 : 15) + (grf > 2200 ? 30 : 10)));
  const spineRisk = Math.min(100, Math.round(overallRisk * 0.8 + (grf > 2000 ? 25 : 5)));
  const shoulderRisk = Math.min(100, Math.round(overallRisk * 0.7));

  const joints: JointPoint[] = [
    {
      id: "shoulder_right",
      name: "Right Shoulder Joint",
      region: "Shoulder",
      x: 105,
      y: 95,
      riskScore: shoulderRisk,
      telemetryNote: "Angular velocity & upper-body rotation stable",
      mriGrade: "Grade 0 / Intact",
      status: shoulderRisk >= 70 ? "Severe Risk" : shoulderRisk >= 40 ? "Elevated Risk" : "Normal"
    },
    {
      id: "shoulder_left",
      name: "Left Shoulder Joint",
      region: "Shoulder",
      x: 175,
      y: 95,
      riskScore: Math.max(15, shoulderRisk - 5),
      telemetryNote: "Arm acceleration nominal; no acute load spike",
      mriGrade: "Grade 0 / Intact",
      status: shoulderRisk >= 70 ? "Severe Risk" : shoulderRisk >= 40 ? "Elevated Risk" : "Normal"
    },
    {
      id: "spine_lumbar",
      name: "Lumbar Spine & Core",
      region: "Spine",
      x: 140,
      y: 155,
      riskScore: spineRisk,
      telemetryNote: `GRF impact: ${grf} N; axial compression nominal`,
      mriGrade: "Intact Canal & Discs",
      status: spineRisk >= 70 ? "Severe Risk" : spineRisk >= 40 ? "Elevated Risk" : "Normal"
    },
    {
      id: "knee_right",
      name: "Right Knee Joint (Patella / ACL)",
      region: "Knee",
      x: 122,
      y: 255,
      riskScore: kneeRisk,
      telemetryNote: `Flexion Angle: ${kneeAngle}° (Normal: 45°–120°)`,
      mriGrade: mriRisk && mriRisk > 0.5 ? "Grade 2 (Meniscus Tear)" : "Grade 0 (Intact)",
      status: kneeRisk >= 70 ? "Severe Risk" : kneeRisk >= 40 ? "Elevated Risk" : "Normal"
    },
    {
      id: "knee_left",
      name: "Left Knee Joint",
      region: "Knee",
      x: 158,
      y: 255,
      riskScore: Math.max(15, kneeRisk - 10),
      telemetryNote: `Flexion Angle: ${kneeAngle + 3}° (Symmetric load)`,
      mriGrade: "Grade 0 (Intact)",
      status: kneeRisk >= 70 ? "Severe Risk" : kneeRisk >= 40 ? "Elevated Risk" : "Normal"
    },
    {
      id: "ankle_right",
      name: "Right Ankle Complex",
      region: "Ankle",
      x: 120,
      y: 335,
      riskScore: ankleRisk,
      telemetryNote: `Rotation Angle: ${ankleAngle}° (Peak ground contact)`,
      mriGrade: "Normal Mortise",
      status: ankleRisk >= 70 ? "Severe Risk" : ankleRisk >= 40 ? "Elevated Risk" : "Normal"
    },
    {
      id: "ankle_left",
      name: "Left Ankle Complex",
      region: "Ankle",
      x: 160,
      y: 335,
      riskScore: Math.max(12, ankleRisk - 6),
      telemetryNote: `Rotation Angle: ${ankleAngle - 2}°`,
      mriGrade: "Normal Mortise",
      status: ankleRisk >= 70 ? "Severe Risk" : ankleRisk >= 40 ? "Elevated Risk" : "Normal"
    }
  ];

  const [activeJoint, setActiveJoint] = useState<JointPoint>(joints[3]); // Default to Right Knee

  const getColor = (score: number) => {
    if (score >= 70) return "#ef4444"; // Red
    if (score >= 40) return "#f59e0b"; // Amber
    return "#10b981"; // Emerald
  };

  return (
    <div className="clinical-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Interactive Digital Twin · Anatomical Joint Heatmap
            </h3>
            <span className="text-[10px] text-slate-400">Click any joint node to inspect regional biomechanics & imaging status</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
          Live Telemetry Bound
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* SVG Silhouette Visualizer */}
        <div className="sm:col-span-6 flex justify-center bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 relative">
          <svg viewBox="0 0 280 380" className="w-52 h-72 drop-shadow-xs select-none">
            {/* Human Silhouette Path (Clinical Medical Vector) */}
            <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5">
              {/* Head */}
              <circle cx="140" cy="40" r="22" />
              {/* Neck */}
              <path d="M 133 60 L 133 72 L 147 72 L 147 60 Z" />
              {/* Torso & Shoulders */}
              <path d="M 98 90 C 115 80, 165 80, 182 90 L 175 180 L 105 180 Z" />
              {/* Arms */}
              <path d="M 98 90 L 78 170 L 68 220 L 78 222 L 88 175 L 104 110 Z" />
              <path d="M 182 90 L 202 170 L 212 220 L 202 222 L 192 175 L 176 110 Z" />
              {/* Pelvis */}
              <path d="M 105 180 L 175 180 L 168 215 L 112 215 Z" />
              {/* Upper Legs */}
              <path d="M 112 215 L 126 260 L 118 260 L 112 215 Z" />
              <path d="M 168 215 L 154 260 L 162 260 L 168 215 Z" />
              {/* Lower Legs & Feet */}
              <path d="M 126 260 L 122 340 L 110 355 L 130 355 L 128 260 Z" />
              <path d="M 154 260 L 158 340 L 170 355 L 150 355 L 152 260 Z" />
            </g>

            {/* Interactive Joint Pulsing Rings & Nodes */}
            {joints.map((joint) => {
              const isSelected = activeJoint.id === joint.id;
              const col = getColor(joint.riskScore);
              return (
                <g
                  key={joint.id}
                  onClick={() => setActiveJoint(joint)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  {/* Outer pulse ring for elevated joints */}
                  {joint.riskScore >= 40 && (
                    <circle
                      cx={joint.x}
                      cy={joint.y}
                      r="14"
                      fill={col}
                      opacity="0.2"
                      className="animate-ping"
                    />
                  )}
                  {/* Selection halo */}
                  {isSelected && (
                    <circle
                      cx={joint.x}
                      cy={joint.y}
                      r="12"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeDasharray="3 2"
                    />
                  )}
                  {/* Core joint circle */}
                  <circle
                    cx={joint.x}
                    cy={joint.y}
                    r={isSelected ? "7" : "5.5"}
                    fill={col}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="drop-shadow-xs"
                  />
                </g>
              );
            })}
          </svg>

          {/* Quick Legend */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] text-slate-500 bg-white/90 px-2 py-1 rounded-md border border-slate-200">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;40%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 40-70%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &ge;70%</span>
          </div>
        </div>

        {/* Selected Joint Telemetry Inspector */}
        <div className="sm:col-span-6 space-y-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Selected Anatomical Node
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${getColor(activeJoint.riskScore)}15`,
                  borderColor: `${getColor(activeJoint.riskScore)}40`,
                  color: getColor(activeJoint.riskScore)
                }}
              >
                {activeJoint.status} ({activeJoint.riskScore}%)
              </span>
            </div>

            <div className="text-sm font-extrabold text-slate-900">{activeJoint.name}</div>

            {/* Dynamic Telemetry Metric Row */}
            <div className="space-y-1.5 pt-1 border-t border-slate-200/80 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Biomechanical Telemetry:</span>
                <strong className="text-slate-800">{activeJoint.telemetryNote}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Imaging / MRI Baseline:</span>
                <span className="font-semibold text-slate-800">{activeJoint.mriGrade}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Anatomical Compartment:</span>
                <span className="text-slate-700">{activeJoint.region} Joint</span>
              </div>
            </div>

            {/* Micro Risk Bar */}
            <div className="pt-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1">
                <span>Local Joint Strain Severity</span>
                <span>{activeJoint.riskScore}/100</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${activeJoint.riskScore}%`,
                    backgroundColor: getColor(activeJoint.riskScore)
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-[11px] text-blue-800 flex items-start gap-2">
            <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              Real-time biomechanical vectors and MRI pathology are fused to localize joint-specific strain.
              Alert thresholds trigger when any single joint crosses 75%.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
