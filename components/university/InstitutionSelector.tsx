'use client'

import { ChevronDown, MapPin, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface InstitutionOption {
  id: string
  name: string
  type: string | null
  student_count: number | null
  location: string | null
}

interface InstitutionSelectorProps {
  institutions: InstitutionOption[]
  selectedId: string
  onSelect: (id: string) => void
}

const typeLabels: Record<string, string> = {
  university: 'University',
  polytechnic: 'Polytechnic',
  vocational: 'Vocational',
  online: 'Online',
}

export default function InstitutionSelector({
  institutions,
  selectedId,
  onSelect,
}: InstitutionSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = institutions.find((i) => i.id === selectedId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-gray-500 mb-1.5">
        Institution
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-full flex items-center justify-between gap-3
          px-4 py-3 bg-white rounded-lg
          border border-[#E2E5EB] hover:border-gray-300
          text-left transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-gray-200
        "
      >
        <div className="min-w-0">
          <p className="font-display text-[15px] text-gray-900 truncate">
            {selected?.name || 'Select an institution'}
          </p>
          {selected && (
            <div className="flex items-center gap-3 mt-0.5">
              {selected.type && (
                <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {typeLabels[selected.type] || selected.type}
                </span>
              )}
              {selected.location && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <MapPin size={10} />
                  {selected.location}
                </span>
              )}
              {selected.student_count != null && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Users size={10} />
                  {selected.student_count.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-[#E2E5EB] shadow-lg max-h-72 overflow-y-auto">
          {institutions.map((inst) => {
            const isSelected = inst.id === selectedId
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => {
                  onSelect(inst.id)
                  setOpen(false)
                }}
                className={`
                  w-full text-left px-4 py-3 transition-colors duration-100
                  hover:bg-gray-50 border-b border-[#E2E5EB] last:border-b-0
                  ${isSelected ? 'bg-gray-50' : ''}
                `}
              >
                <p className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {inst.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {inst.type && (
                    <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                      {typeLabels[inst.type] || inst.type}
                    </span>
                  )}
                  {inst.location && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <MapPin size={10} />
                      {inst.location}
                    </span>
                  )}
                  {inst.student_count != null && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Users size={10} />
                      {inst.student_count.toLocaleString()}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
