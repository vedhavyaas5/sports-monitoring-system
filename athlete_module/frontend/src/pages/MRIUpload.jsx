import React, { useState, useRef } from 'react'
import { c, card, btn, btnOutline } from '../styles'

// Use the Vite proxy — /api routes to localhost:8001
const API    = '/api/mri'
const MAX_MB = 10

// All accepted extensions (input accept attribute)
const ACCEPTED_INPUT = '.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,.dcm'
const ACCEPTED_EXTS  = ['jpg','jpeg','png','webp','bmp','tiff','tif','dcm']

export default function MRIUpload({ onBack, onDone }) {
  const [file,      setFile]     = useState(null)
  const [preview,   setPreview]  = useState(null)
  const [athleteId, setAthleteId]= useState('')
  const [drag,      setDrag]     = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState('')
  const inputRef = useRef()

  // ── Client-side validation ─────────────────────────────────────
  const validate = (f) => {
    if (!f) return 'No file selected.'
    if (f.size === 0) return 'File is empty — please select a valid image.'
    if (f.size > MAX_MB * 1024 * 1024)
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_MB} MB.`
    const ext = f.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTS.includes(ext))
      return `Format ".${ext}" not supported. Accepted: JPG, JPEG, PNG, WEBP, BMP, TIFF.`
    return null
  }

  const pickFile = (f) => {
    const err = validate(f)
    if (err) { setError(err); setFile(null); setPreview(null); return }
    setError('')
    setFile(f)
    // Show preview for image types (not DCM)
    const ext = f.name.split('.').pop().toLowerCase()
    if (ext !== 'dcm') {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const analyze = async () => {
    if (!file) { setError('Please select an MRI image first.'); return }
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file, file.name)
      form.append('athlete_id', athleteId.trim() || 'unknown')

      const res = await fetch(`${API}/analyze`, {
        method: 'POST',
        body: form,
        // Do NOT set Content-Type manually — browser sets it with boundary
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || `Server error ${res.status}`)
      }
      onDone(data)
    } catch (e) {
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setError('Cannot reach the server. Make sure the backend is running on port 8001.')
      } else {
        setError(e.message || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const borderColor = drag ? c.purple : error ? c.red : file ? c.green : c.border

  return (
    <div style={{
      minHeight: '100vh', background: c.bg, padding: '24px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{ ...btnOutline, padding: '8px 14px', fontSize: 13 }}>
            ← Back
          </button>
          <div>
            <div style={{ fontSize: 11, color: c.muted, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              SPORTS INJURY MONITOR
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>MRI Analysis</h1>
          </div>
        </div>

        <div style={{ ...card }}>

          {/* ── Athlete ID ───────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: c.muted, display: 'block', marginBottom: 6 }}>
              Athlete ID (optional)
            </label>
            <input
              placeholder="e.g. 07"
              value={athleteId}
              onChange={e => setAthleteId(e.target.value)}
              style={{
                background: '#0d1624', border: `1px solid ${c.border}`,
                borderRadius: 10, padding: '10px 14px', color: '#fff',
                fontSize: 14, width: '100%', outline: 'none',
              }}
            />
          </div>

          {/* ── Drop zone ─────────────────────────────────────────── */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}
            style={{
              border: `2px dashed ${borderColor}`,
              borderRadius: 14, padding: '36px 20px',
              textAlign: 'center', cursor: 'pointer',
              background: drag ? `${c.purple}10` : '#0d1624',
              transition: 'all .2s',
              minHeight: 200,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {preview ? (
              /* Image preview */
              <div style={{ width: '100%' }}>
                <img
                  src={preview} alt="MRI preview"
                  style={{ maxHeight: 240, maxWidth: '100%',
                    borderRadius: 10, marginBottom: 12, objectFit: 'contain' }}
                />
                <div style={{ fontSize: 13, color: c.green, fontWeight: 600 }}>
                  ✓ {file.name}
                </div>
                <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
                  {(file.size / 1024).toFixed(0)} KB — Click to change
                </div>
              </div>
            ) : file ? (
              /* File selected but no preview (e.g. DICOM) */
              <div>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14, color: c.green, fontWeight: 600 }}>
                  ✓ {file.name}
                </div>
                <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
                  {(file.size / 1024).toFixed(0)} KB — Click to change
                </div>
              </div>
            ) : (
              /* Empty state */
              <>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🩻</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                  Drag & Drop MRI Image
                </div>
                <div style={{ fontSize: 13, color: c.muted, marginBottom: 14 }}>
                  or click to browse your files
                </div>
                <div style={{
                  fontSize: 11, color: c.muted, padding: '6px 16px',
                  border: `1px solid ${c.border}`, borderRadius: 20,
                }}>
                  JPG · JPEG · PNG · WEBP · BMP · TIFF
                </div>
              </>
            )}
          </div>

          {/* Hidden file input — no content-type filter to avoid browser quirks */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_INPUT}
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files[0]
              if (f) pickFile(f)
              // Reset so same file can be re-selected
              e.target.value = ''
            }}
          />

          <p style={{ fontSize: 11, color: c.muted, marginTop: 8, textAlign: 'center' }}>
            Max {MAX_MB} MB · JPG, JPEG, PNG, WEBP, BMP, TIFF
          </p>

          {/* ── Error message ─────────────────────────────────────── */}
          {error && (
            <div style={{
              marginTop: 14, padding: '12px 16px', borderRadius: 10,
              background: `${c.red}15`, border: `1px solid ${c.red}50`,
              color: c.red, fontSize: 13, lineHeight: 1.5,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Analyze button ────────────────────────────────────── */}
          <button
            onClick={analyze}
            disabled={loading || !file}
            style={{
              ...btn(c.purple),
              width: '100%', fontSize: 15, marginTop: 20,
              opacity: loading || !file ? 0.45 : 1,
              cursor: loading || !file ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span>⏳ Analysing image…</span>
            ) : (
              <span>🔍 Analyze MRI</span>
            )}
          </button>

          {/* ── Loading bar ───────────────────────────────────────── */}
          {loading && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                height: 4, borderRadius: 2, background: '#1e2d45', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: '60%', background: c.purple,
                  borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </div>
              <p style={{ fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 6 }}>
                Running AI model inference…
              </p>
            </div>
          )}
        </div>

        {/* ── Disclaimer ────────────────────────────────────────── */}
        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: `${c.yellow}10`, border: `1px solid ${c.yellow}30`,
          borderRadius: 12,
        }}>
          <p style={{ fontSize: 11, color: `${c.yellow}cc`, lineHeight: 1.7, margin: 0 }}>
            ⚠ <strong>Important:</strong> The MRI analysis module provides
            AI-based image classification output only. It is <strong>NOT</strong> a
            medical diagnosis. Results must be reviewed by a qualified medical
            professional before any clinical decision is made.
          </p>
        </div>

      </div>
    </div>
  )
}
