'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface WikidataInstitution {
  name: string
  students: number | null
  wikidata_id: string
}

export default function AddCountryModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [visionName, setVisionName] = useState('')
  const [visionYear, setVisionYear] = useState(2031)
  const [gapNumber, setGapNumber] = useState(10000)
  const [sector, setSector] = useState('Technology')
  const [accentColour, setAccentColour] = useState('#1B6B5A')
  const [institutions, setInstitutions] = useState<WikidataInstitution[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manualInst, setManualInst] = useState('')

  const searchWikidata = useCallback(async () => {
    if (!name) return
    setSearching(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/countries/wikidata/${encodeURIComponent(name)}`)
      const data = await res.json()
      setInstitutions(data.institutions || [])
      setSelected(new Set((data.institutions || []).map((_: unknown, i: number) => i)))
    } catch {
      setInstitutions([])
    }
    setSearching(false)
  }, [name])

  const handleSubmit = useCallback(async () => {
    setSaving(true)
    try {
      const selectedInsts = institutions
        .filter((_, i) => selected.has(i))
        .map((inst) => ({ name: inst.name, students: inst.students, wikidata_id: inst.wikidata_id }))

      // Add manual institution if provided and no Wikidata results
      if (manualInst && selectedInsts.length === 0) {
        selectedInsts.push({ name: manualInst, students: null, wikidata_id: '' })
      }

      const res = await fetch('/api/countries/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, vision_name: visionName || `${name} Vision ${visionYear}`,
          vision_year: visionYear, gap_number: gapNumber, sector,
          accent_colour: accentColour, institutions: selectedInsts,
        }),
      })
      const data = await res.json()
      if (data.slug) {
        router.push(`/${data.slug}/ministry`)
        onClose()
      }
    } catch (err) {
      console.error('Failed to add country:', err)
    }
    setSaving(false)
  }, [name, visionName, visionYear, gapNumber, sector, accentColour, institutions, selected, manualInst, router, onClose])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D1117] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-[#E6EDF3]">Add New Country</h2>
          <button onClick={onClose} className="text-[#484F58] hover:text-[#C9D1D9] text-lg">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#8B949E] mb-1">Country name</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#21262D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#484F58]"
              placeholder="e.g. United Arab Emirates"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B949E] mb-1">National vision name</label>
            <input
              value={visionName} onChange={(e) => setVisionName(e.target.value)}
              className="w-full border border-[#21262D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#484F58]"
              placeholder="e.g. UAE Vision 2031"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8B949E] mb-1">Vision year</label>
              <input
                type="number" value={visionYear} onChange={(e) => setVisionYear(Number(e.target.value))}
                className="w-full border border-[#21262D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#484F58]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B949E] mb-1">Target workforce gap</label>
              <input
                type="number" value={gapNumber} onChange={(e) => setGapNumber(Number(e.target.value))}
                className="w-full border border-[#21262D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#484F58]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8B949E] mb-1">Primary sector</label>
              <select
                value={sector} onChange={(e) => setSector(e.target.value)}
                className="w-full border border-[#21262D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#484F58]"
              >
                {['Technology', 'Finance', 'Energy', 'Tourism', 'Health', 'Manufacturing'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8B949E] mb-1">Accent colour</label>
              <input
                type="color" value={accentColour} onChange={(e) => setAccentColour(e.target.value)}
                className="w-full h-[38px] border border-[#21262D] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Wikidata search */}
          <div className="pt-2 border-t border-[#21262D]">
            <label className="block text-xs text-[#8B949E] mb-2">Search universities via Wikidata</label>
            <div className="flex gap-2">
              <input
                value={name}
                readOnly
                className="flex-1 border border-[#21262D] rounded-lg px-3 py-2 text-sm bg-[#0D1117] text-[#8B949E]"
              />
              <button
                onClick={searchWikidata}
                disabled={!name || searching}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {institutions.length > 0 && (
              <div className="mt-3 space-y-2">
                {institutions.map((inst, i) => (
                  <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0D1117] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => {
                        setSelected((prev) => {
                          const next = new Set(prev)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm text-[#E6EDF3]">{inst.name}</span>
                      {inst.students && (
                        <span className="text-xs text-[#484F58] ml-2">— {inst.students.toLocaleString()} students</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {searched && institutions.length === 0 && !searching && (
              <div className="mt-3">
                <p className="text-xs text-[#484F58] mb-2">No results from Wikidata. Add an institution manually:</p>
                <input
                  value={manualInst}
                  onChange={(e) => setManualInst(e.target.value)}
                  placeholder="Institution name"
                  className="w-full border border-[#21262D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#484F58]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-[#21262D]">
          <button
            onClick={handleSubmit}
            disabled={!name || saving}
            className="flex-1 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40"
          >
            {saving ? 'Adding...' : 'Add Country'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-[#21262D] text-sm text-[#8B949E] hover:border-[#484F58]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
