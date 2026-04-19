'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Landmark, GraduationCap, Briefcase, User, Menu, X } from 'lucide-react'
import CountryBadge from './CountryBadge'
import DocumentUpload from '@/components/ministry/DocumentUpload'
import AddCountryModal from './AddCountryModal'

interface SidebarProps {
  country: string
  accentColor: string
  visionName: string
}

const navItems = [
  { key: 'ministry', label: 'Ministry', icon: Landmark },
  { key: 'university', label: 'University', icon: GraduationCap },
  { key: 'employer', label: 'Employer', icon: Briefcase },
  { key: 'student', label: 'Student', icon: User },
]

const countrySwitcher = [
  { slug: 'malta', label: 'Malta', accent: '#1B6B5A' },
  { slug: 'saudi', label: 'Saudi Arabia', accent: '#C9A84C' },
  { slug: 'uk', label: 'United Kingdom', accent: '#1a3a6b' },
]

export default function Sidebar({ country, accentColor, visionName }: SidebarProps) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddCountry, setShowAddCountry] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsAdmin(process.env.NODE_ENV === 'development' || params.get('admin') === 'true')
  }, [])

  return (
    <>
    {/* Mobile hamburger */}
    <button
      onClick={() => setMobileOpen(true)}
      className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#0A1628] text-white/70 md:hidden"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
    {/* Mobile overlay */}
    {mobileOpen && (
      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
    )}
    <aside
      className={`fixed left-0 top-0 bottom-0 flex flex-col z-50 transition-transform duration-200 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      style={{ width: 240, backgroundColor: '#0A1628' }}
    >
      {/* Mobile close button */}
      <button
        onClick={() => setMobileOpen(false)}
        className="absolute top-4 right-4 p-1 text-white/40 hover:text-white/70 md:hidden"
        aria-label="Close menu"
      >
        <X size={18} />
      </button>
      {/* Wordmark */}
      <div className="px-6 pt-8 pb-2">
        <h1 className="font-display text-2xl text-white tracking-wide">SYRKA</h1>
        <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase mt-0.5">
          Human Capital Intelligence
        </p>
      </div>

      {/* Country Badge */}
      <div className="px-6 py-4">
        <CountryBadge
          country={country}
          visionName={visionName}
          accentColor={accentColor}
        />
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-white/5" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6">
        <p className="px-3 mb-3 text-[10px] font-medium tracking-[0.15em] uppercase text-white/30">
          Dashboards
        </p>
        <ul className="space-y-1">
          {navItems.map(({ key, label, icon: Icon }) => {
            const href = `/${country}/${key}`
            const isActive = pathname === href || pathname?.startsWith(`${href}/`)

            return (
              <li key={key}>
                <Link
                  href={href}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
                    ${isActive
                      ? 'text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                    }
                  `}
                  style={isActive ? { backgroundColor: `${accentColor}15`, color: accentColor } : undefined}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className="font-medium">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Document Upload */}
      <div className="mx-6 border-t border-white/5" />
      <DocumentUpload country={country} accentColor={accentColor} />

      {/* Divider */}
      <div className="mx-6 border-t border-white/5" />

      {/* Country Switcher */}
      <div className="px-3 py-5">
        <p className="px-3 mb-3 text-[10px] font-medium tracking-[0.15em] uppercase text-white/30">
          Country
        </p>
        <ul className="space-y-1">
          {countrySwitcher.map(({ slug, label, accent }) => {
            const isActive = country === slug

            return (
              <li key={slug}>
                <Link
                  href={`/${slug}/ministry`}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150
                    ${isActive
                      ? 'text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isActive ? accent : 'rgba(255,255,255,0.15)' }}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        {isAdmin && (
          <button
            onClick={() => setShowAddCountry(true)}
            className="mt-2 mx-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors w-[calc(100%-24px)] text-left"
          >
            + Add Country
          </button>
        )}
      </div>

      {showAddCountry && <AddCountryModal onClose={() => setShowAddCountry(false)} />}
    </aside>
    </>
  )
}
