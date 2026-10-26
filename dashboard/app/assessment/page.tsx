"use client";
import React, { useState } from "react";
import {
  ClipboardList, Send, CheckCircle2, AlertTriangle, Sparkles,
  HeartPulse, ShieldCheck, Activity, Calendar, ArrowRight,
  TrendingUp, BarChart2, Compass, Layers, Check
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useLive } from "@/components/LiveDataProvider";

const SYMPTOMS_LIST = [
  "Muscle soreness", "Joint stiffness", "Swelling", "Weakness",
  "Numbness / tingling", "Reduced range of motion",
  "Difficulty walking", "Difficulty running", "Difficulty changing direction"
];

const LOCATIONS = ["Knee", "Ankle", "Hip", "Hamstring", "Quadriceps", "Shoulder", "Lower Back"];

export default function SelfAssessmentPage() {
  const { athleteId } = useLive();
  const [painLevel, setPainLevel] = useState(3);
  const [fatigueLevel, setFatigueLevel] = useState(4);
  const [selectedLocations, setLocations] = useState<string[]>(["Knee"]);
  const [selectedSymptoms, setSymptoms] = useState<string[]>(["Joint stiffness"]);
  const [trainingIntensity, setIntensity] = useState(3);
  const [durationMin, setDuration] = useState(75);
  const [previousInjury, setPrevInjury] = useState(false);
  const [description, setDescription] = useState("Right knee feels stiff after sprint decelerations, with slight soreness at terminal flexion.");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const toggleLocation = (loc: string) => {
    setLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };

  const toggleSymptom = (sym: string) => {
    setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athlete_id: athleteId,
          pain_level: painLevel,
          pain_locations: selectedLocations,
          fatigue_level: fatigueLevel,
          symptoms: selectedSymptoms,
          training_intensity: trainingIntensity,
          training_duration_min: durationMin,
          previous_injury: previousInjury,
          description: description
        })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      alert("Submission error: " + err);
    } finally {
      setLoading(false);
    }
  };

  const TT = {
    contentStyle: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      fontSize: 12,
      color: "#0f172a",
      boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
    },
    labelStyle: { display: "none" as const },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      
      {/* Header Banner - Larger Font, Neat Alignment */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardList size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Athlete Self-Assessment &amp; Subjective Intake
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Daily wellness check-in, pain severity scoring, NLP symptom extraction, and recovery decision support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
          <Activity size={16} className="text-blue-600" />
          <span>Active Athlete: <strong className="text-slate-900">Athlete #{athleteId}</strong></span>
        </div>
      </div>

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="clinical-card p-8 space-y-7">
        
        {/* Sliders: Pain & Fatigue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-3 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-sm font-bold text-slate-800">
              <span className="flex items-center gap-2">
                <HeartPulse size={16} className="text-blue-600" />
                Subjective Pain Severity
              </span>
              <span className="text-blue-600 font-black text-lg bg-blue-50 px-3 py-0.5 rounded-lg border border-blue-200">
                {painLevel} / 10
              </span>
            </div>
            <input
              type="range" min={0} max={10} value={painLevel}
              onChange={(e) => setPainLevel(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>0 (Pain Free)</span>
              <span>5 (Moderate Strain)</span>
              <span>10 (Severe Pain)</span>
            </div>
          </div>

          <div className="space-y-3 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-sm font-bold text-slate-800">
              <span className="flex items-center gap-2">
                <Activity size={16} className="text-purple-600" />
                Perceived Central Fatigue
              </span>
              <span className="text-purple-600 font-black text-lg bg-purple-50 px-3 py-0.5 rounded-lg border border-purple-200">
                {fatigueLevel} / 10
              </span>
            </div>
            <input
              type="range" min={0} max={10} value={fatigueLevel}
              onChange={(e) => setFatigueLevel(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>0 (Fully Rested)</span>
              <span>5 (Moderate Fatigue)</span>
              <span>10 (Exhausted)</span>
            </div>
          </div>

        </div>

        {/* Anatomical Locations */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
            <span>Anatomical Pain &amp; Strain Locations</span>
            <span className="text-xs text-slate-400 font-normal">Select all active joint compartments</span>
          </label>
          <div className="flex flex-wrap gap-2.5">
            {LOCATIONS.map((loc) => {
              const isSelected = selectedLocations.includes(loc);
              return (
                <button
                  type="button" key={loc} onClick={() => toggleLocation(loc)}
                  className={`text-sm font-bold px-4 py-2 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  {loc} {isSelected && "✓"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Symptoms Grid */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
            <span>Reported Physical Symptoms &amp; Movement Sensations</span>
            <span className="text-xs text-slate-400 font-normal">Functional indicators</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SYMPTOMS_LIST.map((sym) => {
              const isSelected = selectedSymptoms.includes(sym);
              return (
                <button
                  type="button" key={sym} onClick={() => toggleSymptom(sym)}
                  className={`text-sm font-medium p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-purple-50 text-purple-900 border-purple-300 font-bold shadow-2xs ring-1 ring-purple-300"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        {/* Training Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-600 block">Training Intensity (RPE 1-5)</span>
            <select
              value={trainingIntensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full text-sm font-semibold p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
            >
              <option value={1}>1 - Very Light (Active Recovery)</option>
              <option value={2}>2 - Light (Skill Work)</option>
              <option value={3}>3 - Moderate (Aerobic Conditioning)</option>
              <option value={4}>4 - Hard (Match Simulation)</option>
              <option value={5}>5 - Maximal (All-Out Competition)</option>
            </select>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-600 block">Session Duration (Minutes)</span>
            <input
              type="number" min={15} max={300} value={durationMin}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              className="w-full text-sm font-semibold p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase text-slate-600 block">Prior Injury History</span>
            <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800 cursor-pointer pt-1">
              <input
                type="checkbox" checked={previousInjury}
                onChange={(e) => setPrevInjury(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span>Yes, prior injury in same region</span>
            </label>
          </div>
        </div>

        {/* Free-text NLP notes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Free-Text Subjective Note ("How does your body feel today?")
            </label>
            <span className="text-xs text-blue-600 flex items-center gap-1 font-bold bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              <Sparkles size={13} /> Real-Time NLP Keyword Extraction
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Right knee felt stiff and sharp pain during sprint decelerations..."
            className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 leading-relaxed font-normal"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit" disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={18} />
          {loading ? "Computing Subjective Risk & Generating Graphs..." : "Submit Self-Assessment & Generate Clinical Graphs"}
        </button>
      </form>

      {/* Structured Result Display with Big Explanations and Graphs */}
      {response && (
        <div className="clinical-card p-8 space-y-7 bg-white border-blue-300 shadow-md">
          
          {/* Executive Assessment Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${response.risk_color || "#2563eb"}15`,
                    borderColor: `${response.risk_color || "#2563eb"}40`,
                    color: response.risk_color || "#2563eb"
                  }}
                >
                  {response.status_label || "Assessment Processed"}
                </span>
                <span className="text-xs font-semibold text-slate-400">Intake Classification</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                SUBJECTIVE WELLNESS &amp; RECOVERY DIAGNOSTIC AUDIT
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Normalized Subjective Risk</span>
              <div className="text-3xl font-black text-slate-900">
                {(response.overall_risk_score * 100).toFixed(1)}%
              </div>
              <span className="text-xs font-semibold" style={{ color: response.risk_color || "#2563eb" }}>
                Risk Band: {response.risk_tier || "MODERATE"}
              </span>
            </div>
          </div>

          {/* Detailed Clinical Narrative */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-sm">
            <strong className="text-slate-900 text-sm font-bold flex items-center gap-1.5">
              <Compass size={16} className="text-blue-600" />
              Clinical Sports Medicine Interpretation:
            </strong>
            <p className="text-slate-800 leading-relaxed font-normal">
              {response.clinical_narrative || "Athlete reports localized discomfort with moderate fatigue. Cumulative session load should be monitored."}
            </p>
          </div>

          {/* TWO BIG GRAPHS: Graph 1 (Radar) + Graph 2 (Bar Breakdown) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Graph 1: 6-Axis Subjective Wellness Radar Chart */}
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                    Graph 1: 6-Axis Subjective Burden Vector
                  </span>
                  <span className="text-xs text-slate-500">Multivariate analysis of pain, fatigue, sRPE &amp; symptoms</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                  Polar Vector
                </span>
              </div>

              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={response.assessment_radar || []} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#334155", fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Radar name="Athlete Reported" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} />
                  <Radar name="Nominal Baseline" dataKey="norm" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Tooltip {...TT} formatter={(v) => [`${v}/100`, "Intensity"]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Graph 2: Category Scores vs Thresholds Bar Chart */}
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                    Graph 2: Sub-Scale Scores vs. Thresholds
                  </span>
                  <span className="text-xs text-slate-500">Categorical index comparisons against caution thresholds</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  Threshold Bars
                </span>
              </div>

              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={response.category_scores || []} margin={{ top: 15, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#334155", fontWeight: 600 }} axisLine={{ stroke: "#cbd5e1" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v, n, item) => [`${v}/100 (Threshold: ${item.payload.threshold})`, item.payload.category]} />
                  <Bar dataKey="score" radius={[5, 5, 0, 0]} barSize={34} fill="#2563eb"
                    label={{ position: "top", fontSize: 11, fill: "#334155", fontWeight: 700, formatter: (v: unknown) => `${Number(v ?? 0)}` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Actionable Sports Medicine Recovery Directives */}
          {response.recovery_recommendations && (
            <div className="space-y-4">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                Prescribed Sports Medicine Recovery Protocol
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
                    1. Training Load Modification
                  </span>
                  <p className="text-blue-950 font-medium leading-relaxed">
                    {response.recovery_recommendations.load_guidance}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                    2. Recommended Recovery Modalities
                  </span>
                  <ul className="space-y-1 text-emerald-950 text-xs font-medium">
                    {response.recovery_recommendations.recovery_modalities.map((m: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Clinical Escalation Banner */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-950 text-sm flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block text-amber-900 mb-0.5">Clinical Escalation Status:</strong>
                  {response.recovery_recommendations.clinical_escalation}
                </div>
              </div>
            </div>
          )}

          {/* NLP Extracted Entities */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Natural Language Processing (NLP) Entity Extraction
            </span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {(response.extracted_symptoms?.detected_symptoms || []).map((s: string) => (
                <span key={s} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-200">
                  Symptom: {s}
                </span>
              ))}
              {(response.extracted_symptoms?.body_regions || []).map((r: string) => (
                <span key={r} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                  Region: {r}
                </span>
              ))}
              {(!response.extracted_symptoms?.detected_symptoms?.length && !response.extracted_symptoms?.body_regions?.length) && (
                <span className="text-xs text-slate-400">No acute localized symptoms detected in free-text note.</span>
              )}
            </div>
          </div>

          {/* Non-Diagnostic Disclaimer */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-slate-500 text-xs leading-relaxed">
            <strong>Disclaimer:</strong> {response.disclaimer}
          </div>

        </div>
      )}

    </div>
  );
}
