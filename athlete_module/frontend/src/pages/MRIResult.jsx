import React from 'react'
import { c, card, btn, btnOutline } from '../styles'

const GRADE_CONFIG = {
  0: { emoji: '✅', bg: '#10b981', label: 'No Injury' },
  1: { emoji: '⚠️', bg: '#f59e0b', label: 'Mild' },
  2: { emoji: '🔶', bg: '#f97316', label: 'Moderate' },
  3: { emoji: '🔴', bg: '#ef4444', label: 'Severe' },
}

function GradeBar({ grade, score, color, label, isActive }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, marginBottom: 8,
      border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.06)'}`,
      background: isActive ? `${color}18` : 'rgba(255,255,255,0.02)',
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isActive && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: color, display: 'inline-block',
            }} />
          )}
          <span style={{
            fontSize: 13, fontWeight: isActive ? 700 : 400,
            color: isActive ? '#fff' : c.muted,
          }}>
            {label}
          </span>
          {isActive && (
            <span style={{
              fontSize: 10, padding: '1px 8px', borderRadius: 10,
              background: `${color}30`, color, fontWeight: 700,
              border: `1px solid ${color}50`,
            }}>PREDICTED</span>
          )}
        </div>
        <span style={{ fontSize: 12, color: isActive ? color : c.muted,
          fontWeight: 600, fontFamily: 'monospace' }}>
          {score}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`, borderRadius: 3,
          background: color, transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

function RadiologyBar({ label, value }) {
  const color = value > 66 ? c.red : value > 33 ? c.yellow : c.green
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: c.muted }}>{label}</span>
        <span style={{ color: '#fff', fontFamily: 'monospace' }}>{value}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color,
          borderRadius: 2, transition: 'width 0.6s' }} />
      </div>
    </div>
  )
}

// SVG Gauge for injury score
function InjuryGauge({ score, grade, color }) {
  const r = 70, cx = 90, cy = 90
  const startAngle = -210
  const totalAngle = 240
  const toRad = d => d * Math.PI / 180
  const arcPath = (a1, a2) => {
    const x1 = cx + r * Math.cos(toRad(a1))
    const y1 = cy + r * Math.sin(toRad(a1))
    const x2 = cx + r * Math.cos(toRad(a2))
    const y2 = cy + r * Math.sin(toRad(a2))
    const large = Math.abs(a2 - a1) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }
  const endAngle = startAngle + (score / 100) * totalAngle

  return (
    <svg width="180" height="150" viewBox="0 0 180 150">
      {/* Track */}
      <path d={arcPath(-210, 30)} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round" />
      {/* Grade zone colors */}
      <path d={arcPath(-210, -150)} fill="none"
        stroke="#10b981" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
      <path d={arcPath(-150, -90)} fill="none"
        stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
      <path d={arcPath(-90, -20)} fill="none"
        stroke="#f97316" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
      <path d={arcPath(-20, 30)} fill="none"
        stroke="#ef4444" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
      {/* Active fill */}
      <path d={arcPath(-210, endAngle)} fill="none"
        stroke={color} strokeWidth="10" strokeLinecap="round"
        style={{ transition: 'all 1s ease' }} />
      {/* Score text */}
      <text x={cx} y={cy + 8} textAnchor="middle"
        fontSize="22" fontWeight="800" fill="white">
        {score}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle"
        fontSize="9" fill="#64748b">INJURY SCORE</text>
      {/* Grade labels */}
      <text x="20" y="130" fontSize="7" fill="#10b981">G0</text>
      <text x="50" y="148" fontSize="7" fill="#f59e0b">G1</text>
      <text x="115" y="148" fontSize="7" fill="#f97316">G2</text>
      <text x="148" y="130" fontSize="7" fill="#ef4444">G3</text>
    </svg>
  )
}

export default function MRIResult({ data, onHome, onUploadAnother }) {
  if (!data) return null

  const grade     = data.grade ?? 0
  const cfg       = GRADE_CONFIG[grade] || GRADE_CONFIG[0]
  const color     = data.severity_color || cfg.bg
  const allGrades = data.all_grades || []
  const radioFeats= data.radiological_features || {}

  return (
    <div style={{
      minHeight: '100vh', background: c.bg, padding: '24px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 620 }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: c.muted, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            SPORTS INJURY MONITOR — MRI ANALYSIS
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
            Injury Level Assessment
          </h1>
          {data.filename && (
            <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
              📄 {data.filename}
              {data.analysis_time_ms && (
                <span style={{ marginLeft: 10 }}>
                  ⚡ {data.analysis_time_ms.toFixed(0)}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Hero result card ────────────────────────────────────── */}
        <div style={{
          ...card, marginBottom: 16, textAlign: 'center',
          border: `2px solid ${color}50`,
          background: `${color}0a`,
        }}>
          {/* Emoji + grade badge */}
          <div style={{ fontSize: 44, marginBottom: 10 }}>{cfg.emoji}</div>

          <div style={{
            display: 'inline-block', padding: '8px 28px',
            borderRadius: 30, fontSize: 22, fontWeight: 900,
            color, background: `${color}20`,
            border: `2px solid ${color}60`,
            marginBottom: 8,
          }}>
            {data.grade_label}
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff',
            marginBottom: 4 }}>
            {data.severity_label}
          </div>

          {/* Gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <InjuryGauge
              score={data.injury_score_pct}
              grade={grade}
              color={color}
            />
          </div>

          {/* Confidence */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, color: c.muted, marginBottom: 4 }}>
              Model Confidence
            </div>
            <div style={{ display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10 }}>
              <div style={{
                height: 8, width: 200, borderRadius: 4,
                background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${data.confidence_pct}%`,
                  background: color, borderRadius: 4,
                  transition: 'width 0.8s',
                }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color }}>
                {data.confidence_pct}%
              </span>
            </div>
          </div>
        </div>

        {/* ── All Grades Breakdown ─────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: c.muted, marginBottom: 14 }}>
            📊 Injury Grade Breakdown
          </div>
          {allGrades.map((g, i) => (
            <GradeBar
              key={i}
              grade={g.grade}
              score={g.score_pct}
              color={g.color}
              label={`${g.grade} — ${g.severity}`}
              isActive={g.is_predicted}
            />
          ))}
        </div>

        {/* ── Description & Recommendation ────────────────────────── */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: c.muted, marginBottom: 14 }}>
            🔍 Analysis Detail
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: c.muted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Image Analysis
            </div>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
              {data.description}
            </p>
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: `${color}10`,
            border: `1px solid ${color}30`,
          }}>
            <div style={{ fontSize: 11, color, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              💡 Recommendation
            </div>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
              {data.recommendation}
            </p>
          </div>
        </div>

        {/* ── Radiological Features ───────────────────────────────── */}
        {Object.keys(radioFeats).length > 0 && (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: c.muted, marginBottom: 14 }}>
              🔬 Image Feature Analysis
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {Object.entries(radioFeats).map(([key, val]) => (
                <RadiologyBar
                  key={key}
                  label={key.replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())}
                  value={val}
                />
              ))}
            </div>
            <p style={{ fontSize: 10, color: c.muted, marginTop: 10, lineHeight: 1.5 }}>
              Features extracted from image analysis: contrast, edge density,
              texture complexity, and tissue intensity distribution.
              Higher values indicate more heterogeneous image characteristics.
            </p>
          </div>
        )}

        {/* ── Fusion Payload ──────────────────────────────────────── */}
        <div style={{
          ...card, marginBottom: 16,
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: c.blue, marginBottom: 8 }}>
            🔗 Risk Fusion Payload (for Phase 8)
          </div>
          <div style={{
            fontSize: 11, fontFamily: 'monospace',
            background: '#0a0e1a', borderRadius: 8, padding: 12,
            color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.6,
          }}>
            {JSON.stringify(data.mri_fusion_payload, null, 2)}
          </div>
        </div>

        {/* ── Disclaimer ──────────────────────────────────────────── */}
        <div style={{
          padding: '14px 16px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(245,158,11,0.85)',
            lineHeight: 1.7, margin: 0 }}>
            ⚠ <strong>Medical Disclaimer:</strong> {data.disclaimer}
          </p>
        </div>

        {/* ── Action buttons ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {onUploadAnother && (
            <button onClick={onUploadAnother} style={{
              flex: '1 1 180px', padding: '13px 20px',
              borderRadius: 10, border: 'none',
              background: color, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              🩻 Analyze Another Image
            </button>
          )}
          <button onClick={onHome} style={{
            ...btnOutline, flex: '1 1 120px', fontSize: 14,
          }}>
            🏠 Home
          </button>
        </div>

      </div>
    </div>
  )
}
