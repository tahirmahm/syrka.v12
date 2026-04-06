'use client'

import { useState, useCallback } from 'react'

interface PolicyBriefExportProps {
  country: string
  accentColor: string
  hasPrescriptions: boolean
}

export default function PolicyBriefExport({ country, accentColor, hasPrescriptions }: PolicyBriefExportProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export/policy-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      })
      const data = await res.json()

      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const accent: [number, number, number] = country === 'saudi' ? [201, 168, 76] : [27, 107, 90]
      const W = 210, M = 20

      // Page 1 — Executive Summary
      doc.setFillColor(...accent)
      doc.rect(0, 0, W, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text('SYRKA', M, 25)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text('National Human Capital Intelligence', M, 32)
      doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 32, { align: 'right' })

      doc.setDrawColor(...accent)
      doc.line(M, 36, W - M, 36)

      const countryName = country === 'saudi' ? 'Kingdom of Saudi Arabia' : 'Republic of Malta'
      const visionName = country === 'saudi' ? 'Vision 2030' : 'Vision 2050'

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text(`${countryName} — Human Capital Policy Brief`, M, 46)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(100)
      doc.text(visionName, M, 53)

      // Syrka Score box
      doc.setFillColor(248, 248, 248)
      doc.roundedRect(M, 60, W - 2 * M, 28, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(40)
      doc.text('SYRKA SCORE', M + 8, 70)
      doc.setFontSize(24)
      doc.setTextColor(...accent)
      doc.text(`${data.syrka_score?.score || 0}/100`, M + 8, 82)
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(data.syrka_score?.grade || 'N/A', M + 50, 82)

      // Current status
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(40)
      doc.text('CURRENT STATUS', M, 100)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60)
      const sectors = data.sectors || []
      const totalGap = sectors.reduce((s: number, sec: { target_workforce?: number; current_workforce?: number }) => s + ((sec.target_workforce || 0) - (sec.current_workforce || 0)), 0)
      doc.text(`Total workforce gap: ${totalGap.toLocaleString()} workers`, M, 108)
      doc.text(`Sectors tracked: ${sectors.length}`, M, 115)

      // Page 2 — Prescriptions
      const prescriptions = data.prescriptions || []
      if (prescriptions.length > 0) {
        doc.addPage()
        doc.setFillColor(...accent)
        doc.rect(0, 0, W, 8, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(40)
        doc.text('Recommended Policy Interventions', M, 22)

        let y = 32
        prescriptions.slice(0, 5).forEach((p: { title?: string; what_to_do?: string; gap_closure_percent?: number; cost_estimate?: string; timeline?: string }, i: number) => {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(...accent)
          doc.text(`${i + 1}. ${p.title || 'Untitled'}`, M, y)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.setTextColor(60)
          if (p.what_to_do) {
            const lines = doc.splitTextToSize(p.what_to_do, W - 2 * M)
            doc.text(lines, M, y + 6)
            const meta = `Gap closure: ~${p.gap_closure_percent || 0}%  |  Cost: ${p.cost_estimate || 'TBD'}  |  Timeline: ${p.timeline || 'TBD'}`
            doc.text(meta, M, y + 6 + lines.length * 5)
            y += 6 + lines.length * 5 + 14
          } else {
            y += 14
          }
          if (y > 260) { doc.addPage(); y = 22 }
        })
      }

      // Data sources page
      doc.addPage()
      doc.setFillColor(...accent)
      doc.rect(0, 0, W, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(40)
      doc.text('Data Sources and Methodology', M, 22)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60)
      const sources = [
        'Gap analysis: World Bank Human Capital Index, ILO ILOSTAT',
        'Curriculum alignment: EU ESCO Skills Taxonomy (13,890 occupations)',
        'Ranking intelligence: QS World University Rankings, THE World University Rankings',
        'Skill demand: WEF Future of Jobs 2025',
        'International benchmarking: OECD Education at a Glance, UNESCO UIS',
        'Scenario simulation: MiroFish multi-agent simulation engine',
      ]
      sources.forEach((s, i) => doc.text(`• ${s}`, M, 32 + i * 8))

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(120)
      doc.text('No conflict of interest. Syrka does not run the rankings it helps you improve.', M, 90)
      doc.text('All data sourced from public international institutions. Generated by Syrka — syrka.co', M, 97)

      doc.save(`Syrka_Policy_Brief_${countryName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [country])

  if (!hasPrescriptions) return null

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50"
      style={{ borderColor: accentColor, color: accentColor }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {exporting ? 'Exporting...' : 'Export Policy Brief'}
    </button>
  )
}
