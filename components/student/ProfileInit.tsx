'use client'

import { useState } from 'react'

export default function ProfileInit({ country }: { country: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null)
  const [notes, setNotes] = useState('')
  const [notesFocused, setNotesFocused] = useState(false)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('country', country)

      const res = await fetch('/api/students/parse-resume', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.profile) {
        setParsed(data.profile)
      } else if (data.error) {
        setParsed(null)
      }
    } catch { /* silent */ }
    setUploading(false)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700, margin: '0 auto' }}>
      {/* Secondary notice banner */}
      <div
        className="mb-8"
        style={{
          background: '#121316',
          borderLeft: '3px solid rgba(255,255,255,0.15)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#73757c' }}>info</span>
        <span style={{ fontSize: 12, color: '#939eb4' }}>
          This section is onboarding only. Your primary workspace is Degree Execution.
        </span>
      </div>

      <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 800, color: '#e3e5ed', letterSpacing: '-0.02em', marginBottom: 4 }}>
        Career Profile Initialization
      </h2>
      <p style={{ fontSize: 13, color: '#73757c', marginBottom: 32 }}>
        One-time setup · Used to calibrate career vector and skill baseline
      </p>

      {/* Profile status card */}
      <div
        className="mb-6"
        style={{ background: '#191C1F', padding: 16 }}
      >
        <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
          Profile Status
        </span>
        <div className="flex items-center gap-2">
          <span
            className="font-label uppercase"
            style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace',
              background: parsed ? 'rgba(103,156,255,0.1)' : 'rgba(69,72,78,0.3)',
              color: parsed ? '#679cff' : '#45484e',
              border: `1px solid ${parsed ? 'rgba(103,156,255,0.2)' : 'rgba(69,72,78,0.4)'}`,
            }}
          >
            {parsed ? 'Initialized' : 'Not Initialized'}
          </span>
        </div>
      </div>

      {/* CV Upload drop zone */}
      <div
        className="mb-6"
        style={{
          border: '1px dashed rgba(255,255,255,0.15)',
          padding: 40,
          textAlign: 'center',
        }}
      >
        <span className="material-symbols-outlined block mb-3" style={{ fontSize: 32, color: '#73757c' }}>upload_file</span>
        <p style={{ fontSize: 14, color: '#e3e5ed', marginBottom: 4 }}>Drop CV here or click to browse</p>
        <p style={{ fontSize: 11, color: '#73757c', marginBottom: 16 }}>PDF · DOCX · Max 5MB</p>

        {file && (
          <p style={{ fontSize: 12, color: '#679cff', marginBottom: 12 }}>
            Selected: {file.name}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <label
            className="btn-ghost inline-flex items-center gap-2"
            style={{ cursor: 'pointer' }}
          >
            Select File
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && f.size <= 5 * 1024 * 1024) setFile(f)
              }}
            />
          </label>
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary inline-flex items-center gap-2"
              style={{ opacity: uploading ? 0.5 : 1 }}
            >
              {uploading ? 'Processing...' : 'Upload & Parse'}
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* Extraction preview */}
      {parsed && (
        <div className="mb-6">
          <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-3">
            What Gets Extracted
          </span>
          <div className="grid grid-cols-2" style={{ gap: 1 }}>
            {[
              { icon: 'work', label: 'Work Experience', value: Array.isArray(parsed.work_experience) ? `${parsed.work_experience.length} entries` : 'None detected' },
              { icon: 'psychology', label: 'Skills Detected', value: Array.isArray(parsed.explicit_skills || parsed.skills) ? `${((parsed.explicit_skills || parsed.skills) as string[]).length} skills` : 'None detected' },
              { icon: 'school', label: 'Prior Education', value: Array.isArray(parsed.education) ? `${parsed.education.length} entries` : parsed.education_level as string || 'None detected' },
              { icon: 'target', label: 'Career Intent', value: (parsed.career_intent || parsed.career_trajectory || 'Not specified') as string },
            ].map(cell => (
              <div key={cell.label} style={{ background: '#191C1F', padding: 16 }}>
                <span className="material-symbols-outlined block mb-2" style={{ fontSize: 20, color: '#679cff' }}>{cell.icon}</span>
                <div className="font-headline font-bold" style={{ fontSize: 12, color: '#e3e5ed', marginBottom: 2 }}>{cell.label}</div>
                <span style={{ fontSize: 11, color: '#73757c' }}>{cell.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes textarea */}
      <div className="mb-6">
        <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-2">
          Optional Notes (Career Intent)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
          placeholder="Describe your career goals, target roles, or any context..."
          style={{
            width: '100%',
            background: '#23262b',
            border: 'none',
            borderBottom: `2px solid ${notesFocused ? '#679cff' : 'rgba(255,255,255,0.1)'}`,
            color: '#e3e5ed',
            padding: 12,
            minHeight: 80,
            resize: 'vertical',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            transition: 'border-color 0.15s',
          }}
        />
      </div>

      {/* Initialize button */}
      <button
        className="btn-primary w-full inline-flex items-center justify-center gap-2"
        style={{ opacity: parsed ? 1 : 0.5 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
        Initialize Profile
      </button>
    </div>
  )
}
