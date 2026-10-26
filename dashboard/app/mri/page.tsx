"use client";
import React, { useState, useEffect } from "react";
import {
  ScanLine, UploadCloud, CheckCircle2, AlertTriangle, Eye,
  ShieldAlert, Sparkles, Activity, FileText, Check, Layers,
  Compass, Clock, ShieldCheck, HeartPulse, ChevronRight, BarChart2,
  TrendingUp, PieChart, Info, Calendar, ArrowRight, Zap, Target
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useLive } from "@/components/LiveDataProvider";

interface SampleScan {
  id: string;
  title: string;
  joint: string;
  expected_severity: string;
  description: string;
  thumbnail_b64: string | null;
}

export default function MRIPage() {
  const { athleteId } = useLive();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleScan[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"raw" | "gradcam" | "contour">("gradcam");

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Fetch clinical test samples on mount
  useEffect(() => {
    fetch(`${API}/api/mri/samples`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.log("Samples fetch error:", err));
  }, [API]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setSelectedSampleId(null);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("athlete_id", athleteId);

      const res = await fetch(`${API}/api/mri/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload validation failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = async (sample: SampleScan) => {
    setSelectedSampleId(sample.id);
    setFile(null);
    setPreview(sample.thumbnail_b64);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("athlete_id", athleteId);
      const res = await fetch(`${API}/api/mri/analyze-sample/${sample.id}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to analyze curated sample scan.");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayImage = () => {
    if (!result) return preview;
    if (activeViewMode === "contour" && result.contour_base64) return result.contour_base64;
    if (activeViewMode === "gradcam" && result.heatmap_base64) return result.heatmap_base64;
    return preview;
  };

  const TT = {
    contentStyle: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      fontSize: 12,
      color: "#0f172a",
      boxShadow: "0 6px 16px rgba(0,0,0,0.08)"
    },
    labelStyle: { display: "none" as const },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ScanLine size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Musculoskeletal MRI &amp; Diagnostic Intelligence Suite
              </h1>
              <span className="px-3 py-1 text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                DenseNet-121 Fine-Tuned (GPU CUDA)
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Multi-joint deep feature inference, quantitative radiomic graphs, and sports medicine return-to-play protocols.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 shrink-0">
          <Activity size={16} className="text-blue-600" />
          <span>Active Athlete: <strong className="text-slate-900">Athlete #{athleteId}</strong></span>
        </div>
      </div>

      {/* 2. Interactive Quick-Test Clinical Library */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Clinical Multi-Joint Test Gallery (1-Click Verification)
            </h2>
          </div>
          <span className="text-xs text-slate-500">Click any curated scan to test trained model with full diagnostic depth</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {samples.map((s) => {
            const isSelected = selectedSampleId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => handleSelectSample(s)}
                className={`group p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500"
                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                }`}
              >
                {s.thumbnail_b64 ? (
                  <img
                    src={s.thumbnail_b64}
                    alt={s.title}
                    className="w-full h-28 object-cover rounded-lg mb-2.5 border border-slate-200 group-hover:scale-102 transition-transform"
                  />
                ) : (
                  <div className="w-full h-28 bg-slate-100 rounded-lg mb-2.5 flex items-center justify-center text-slate-400 text-xs">
                    Scan Preview
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wide">{s.joint}</span>
                  {isSelected && <Check size={14} className="text-blue-600" />}
                </div>
                <div className="text-sm font-bold text-slate-900 truncate mt-1">{s.title}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{s.expected_severity}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Scan Ingestion & Multi-Layer Visual Inspector (Balanced Top Workstation) */}
      <div className="clinical-card p-7 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Scan Ingestion &amp; Diagnostic Visual Layer Inspector
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Upload custom imaging files or inspect gallery scan with multi-modal layer switching
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Upload Dropzone */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-7 text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/60">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="mri-upload" />
              <label htmlFor="mri-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <UploadCloud size={36} className="text-blue-600" />
                <span className="text-sm font-bold text-slate-800">Upload scan file or drag &amp; drop</span>
                <span className="text-xs text-slate-400">Validated against minimum resolution (64x64) and contrast bounds</span>
              </label>
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Activity size={18} />
                {loading ? "Running GPU Inference..." : "Run AI Severity Grading & Quantitative Analysis"}
              </button>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                <strong className="font-bold">Image Validation Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Visual Layer Viewer */}
          <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Layer Switcher:</span>
              {selectedSampleId && (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  Active Sample: {selectedSampleId}
                </span>
              )}
            </div>

            {/* Layer Toggle Switcher */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-600 gap-1.5">
              <button
                onClick={() => setActiveViewMode("raw")}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  activeViewMode === "raw" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Raw Scan
              </button>
              <button
                onClick={() => setActiveViewMode("gradcam")}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  activeViewMode === "gradcam" ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Grad-CAM Heatmap
              </button>
              <button
                onClick={() => setActiveViewMode("contour")}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  activeViewMode === "contour" ? "bg-white text-purple-700 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Tissue Margins
              </button>
            </div>

            {/* Image Preview Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner flex items-center justify-center min-h-[220px]">
              {preview ? (
                <img
                  src={currentDisplayImage() || preview}
                  alt="MRI Slice"
                  className="w-full h-56 object-contain mx-auto"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs">
                  <ScanLine size={36} className="mx-auto mb-2 text-slate-500" />
                  <span>Select a scan from gallery above or upload a file</span>
                </div>
              )}
              {result && (
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs text-xs text-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                  <span>Layer: <strong className="uppercase text-white font-bold">{activeViewMode}</strong></span>
                  <span className="font-mono text-emerald-400 font-bold">{result.confidence_pct}% Confidence</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. ALIGNED LOWER: FULL-WIDTH QUANTITATIVE RADIOLOGICAL ANALYSIS & DIAGNOSTIC GRAPHS (MATCHING SCREENSHOT LAYOUT) */}
      {result ? (
        <div className="clinical-card p-8 space-y-7 bg-white border-blue-300 shadow-md">
          
          {/* Executive Diagnostic Header - Matching Screenshot Layout */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${result.severity_color || "#2563eb"}15`,
                    borderColor: `${result.severity_color || "#2563eb"}40`,
                    color: result.severity_color || "#2563eb"
                  }}
                >
                  {result.grade_label} · {result.severity}
                </span>
                <span className="text-xs font-semibold text-slate-400">Radiological Classification</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                QUANTITATIVE RADIOLOGICAL ANALYSIS &amp; DIAGNOSTIC GRAPHS
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Model Diagnostic Confidence
              </span>
              <div className="text-3xl font-black text-slate-900">
                {result.confidence_pct}%
              </div>
              <span className="text-xs font-semibold" style={{ color: result.severity_color || "#2563eb" }}>
                Severity: {result.severity_label}
              </span>
            </div>
          </div>

          {/* Clinical Diagnostic Narrative Box - Matching Screenshot */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-sm">
            <strong className="text-slate-900 text-sm font-bold flex items-center gap-1.5">
              <Compass size={16} className="text-blue-600" />
              Clinical Radiological Diagnostic Impression:
            </strong>
            <p className="text-slate-800 leading-relaxed font-normal">
              {result.description}
            </p>
          </div>

          {/* ROW 1 GRAPHS: Graph 1 (Radar Vector) + Graph 2 (Tissue Density Area Curve) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Graph 1: 6-Axis Radiomic Biomarker Vector */}
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                    Graph 1: 6-Axis Radiomic Biomarker Vector
                  </span>
                  <span className="text-xs text-slate-500">Multivariate analysis of edema, edge sharpness &amp; SNR</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                  Polar Vector
                </span>
              </div>

              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={result.radar_biomarkers || []} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#334155", fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Radar name="Scan Measured" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} />
                  <Radar name="Nominal Baseline" dataKey="norm" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Tooltip {...TT} formatter={(v) => [`${v}/100`, "Score"]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Graph 2: Tissue Density & Grayscale Area Curve */}
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                    Graph 2: Tissue Density &amp; Grayscale Area Curve
                  </span>
                  <span className="text-xs text-slate-500">Pixel frequency across bone, cartilage, marrow &amp; edema</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  224x224 Matrix
                </span>
              </div>

              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={result.intensity_histogram || []} margin={{ top: 15, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="intensityGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#475569", fontWeight: 600 }} axisLine={{ stroke: "#cbd5e1" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v, n, item) => [`${v} pixels (${item.payload.pct}%)`, item.payload.label]} />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#intensityGrad2)" name="Pixel Count" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* ROW 2 GRAPHS: Graph 3 (Grad-CAM Saliency Curve) + Graph 4 (Softmax Differential Bars) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Graph 3: Saliency Cross-Section Curve */}
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                    Graph 3: Grad-CAM Saliency Cross-Section
                  </span>
                  <span className="text-xs text-slate-500">Spatial gradient curve across anatomical joint plane</span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Saliency Peak
                </span>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={result.spatial_attention_profile || []} margin={{ top: 15, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="axis_pos" tick={{ fontSize: 10, fill: "#475569", fontWeight: 600 }} axisLine={{ stroke: "#cbd5e1" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v, n) => [`${v}%`, n === "attention_score" ? "Model Saliency" : "Baseline"]} />
                  <Line type="monotone" dataKey="attention_score" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, fill: "#ea580c" }} name="Saliency Gradient" />
                  <Line type="monotone" dataKey="baseline_threshold" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Baseline" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Graph 4: Softmax Probability Distribution Bars */}
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                    Graph 4: 4-Grade Softmax Probability Differential
                  </span>
                  <span className="text-xs text-slate-500">Multi-class probability distribution across severity tiers</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  Severity Bars
                </span>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={result.probabilities ? Object.entries(result.probabilities).map(([g, p]: [string, any]) => ({
                    grade: g,
                    probability: Math.round(p * 100),
                    fill: g.includes("3") ? "#ef4444" : g.includes("2") ? "#f97316" : g.includes("1") ? "#f59e0b" : "#10b981"
                  })) : []}
                  margin={{ top: 15, right: 10, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: "#334155", fontWeight: 600 }} axisLine={{ stroke: "#cbd5e1" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v) => [`${v}% Probability`, "Score"]} />
                  <Bar dataKey="probability" radius={[5, 5, 0, 0]} barSize={36} fill="#2563eb"
                    label={{ position: "top", fontSize: 11, fill: "#334155", fontWeight: 700, formatter: (v: unknown) => `${Number(v ?? 0)}%` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Tissue Pathology & Morphology Section */}
          <div className="space-y-4">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Layers size={16} className="text-blue-600" />
              Detailed Tissue Pathology &amp; Structural Morphology
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  1. Anatomical Joint Architecture
                </span>
                <p className="text-slate-800 leading-relaxed font-normal">
                  {result.anatomical_status}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  2. Pathology Findings &amp; Edema Extent
                </span>
                <p className="text-slate-800 leading-relaxed font-normal">
                  {result.pathology_findings}
                </p>
              </div>
            </div>

            {/* Structural Integrity Progress Meter */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Estimated Structural Tissue Integrity Meter
                </span>
                <strong className="text-base font-black text-slate-900">
                  {result.tissue_integrity_pct ?? 88}% Intact Fiber Continuity
                </strong>
              </div>
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${result.tissue_integrity_pct ?? 88}%`,
                    backgroundColor: (result.tissue_integrity_pct ?? 88) > 75 ? "#10b981" : (result.tissue_integrity_pct ?? 88) > 40 ? "#f59e0b" : "#ef4444"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Phased Rehabilitation Roadmap with GRF Limits */}
          <div className="space-y-4">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Calendar size={16} className="text-blue-600" />
              Prescribed Sports Medicine Rehabilitation &amp; Return-to-Play Milestones
            </span>

            <div className="overflow-x-auto">
              <table className="text-sm w-full border border-slate-200 rounded-xl">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-3 text-left font-bold">Stage &amp; Timeline</th>
                    <th className="p-3 text-left font-bold">Clinical Focus</th>
                    <th className="p-3 text-center font-bold">GRF Safety Ceiling</th>
                    <th className="p-3 text-center font-bold">Phase Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(result.rehab_phases || []).map((rp: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-slate-900">{rp.phase} <span className="text-xs font-normal text-slate-400 block">{rp.timeline}</span></td>
                      <td className="p-3 font-medium">{rp.focus}</td>
                      <td className="p-3 text-center font-mono font-bold text-blue-600">{rp.grf_limit}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          rp.status === "Active" ? "bg-blue-100 text-blue-800" :
                          rp.status === "Cleared" ? "bg-emerald-100 text-emerald-800" :
                          rp.status === "Urgent" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {rp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
                  Clinical Action Protocol
                </span>
                <p className="text-blue-950 font-medium leading-relaxed">
                  {result.clinical_action}
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                  Kinematic Precautions
                </span>
                <p className="text-amber-950 font-medium leading-relaxed">
                  {result.biomechanical_risk_implication}
                </p>
              </div>
            </div>
          </div>

          {/* Non-Diagnostic Disclaimer */}
          <div className="p-4 bg-slate-100 rounded-xl text-slate-500 text-xs leading-relaxed">
            <strong>Medical Transparency Notice:</strong> {result.disclaimer}
          </div>

        </div>
      ) : (
        /* Empty State Waiting for Scan */
        <div className="clinical-card p-10 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
            <ScanLine size={32} />
          </div>
          <h3 className="font-black text-slate-900 text-lg">Quantitative Radiological Analysis Standing By</h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-lg leading-relaxed font-normal">
            Select any scan from the <strong>Clinical Multi-Joint Test Gallery</strong> above or upload an MRI image to generate real-time tissue density curves, radiomic biomarker vectors, and Grad-CAM saliency heatmaps.
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-blue-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <Sparkles size={15} className="text-amber-500" />
            <span>DenseNet-121 NVIDIA CUDA Accelerated</span>
          </div>
        </div>
      )}

    </div>
  );
}
