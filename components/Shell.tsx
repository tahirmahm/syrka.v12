'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import DocumentUpload from '@/components/ministry/DocumentUpload'
import AddCountryModal from '@/components/layout/AddCountryModal'

const COUNTRY_CONFIG: Record<string, { name: string; vision: string }> = {
  saudi: { name: 'KINGDOM OF SAUDI ARABIA', vision: 'Saudi Vision 2030' },
  malta: { name: 'REPUBLIC OF MALTA', vision: 'Malta Vision 2050' },
  uk:    { name: 'UNITED KINGDOM', vision: 'AI Opportunities Action Plan' },
}

interface ShellProps {
  children: React.ReactNode
  country: string
  activeTrack: string
}

export default function Shell({ children, country, activeTrack }: ShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddCountry, setShowAddCountry] = useState(false)
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.saudi

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsAdmin(process.env.NODE_ENV === 'development' || params.get('admin') === 'true')
  }, [])

  return (
    <div className="flex min-h-[100dvh] bg-background text-on-background">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest z-40 overflow-y-auto">
        {/* Wordmark */}
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-surface-container-highest ghost-border flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
            <span className="text-xl font-headline font-bold tracking-tighter text-primary">Syrka</span>
          </div>
          <span className="text-[9px] font-label text-secondary-fixed-dim tracking-widest uppercase pl-11">
            Human Capital Intelligence
          </span>
        </div>

        {/* Country indicator */}
        <div className="px-6 mb-6">
          <div className="bg-surface-container p-3 ghost-border">
            <div className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-1">Active Region</div>
            <div className="text-sm font-headline font-bold text-primary">{config.name}</div>
            <div className="text-xs font-body text-on-surface-variant mt-1">{config.vision}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0">
          <SidebarItem href={`/${country}/ministry`} label="Ministry" icon="analytics" active={activeTrack === 'ministry'} />
          <SidebarItem href={`/${country}/university`} label="University" icon="school" active={activeTrack === 'university'} />
          <SidebarItem href={`/${country}/employer`} label="Employer" icon="query_stats" active={activeTrack === 'employer'} />
          <SidebarItem href={`/${country}/student`} label="Student" icon="person" active={activeTrack === 'student'} />
        </nav>

        {/* Upload */}
        <div className="border-t border-surface-container">
          <DocumentUpload country={country} accentColor="#FFFFFF" />
        </div>

        {/* Country switcher */}
        <div className="border-t border-surface-container px-6 py-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest mb-3">Countries</div>
          {(['saudi', 'malta', 'uk'] as const).map(c => (
            <a key={c} href={`/${c}/ministry`}
               className={`flex items-center gap-3 py-2 text-xs font-body transition-colors ${country === c ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
               style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}>
              <span className={`w-1.5 h-1.5 ${country === c ? 'bg-primary' : 'bg-outline-variant'}`} />
              {COUNTRY_CONFIG[c]?.name || c}
            </a>
          ))}
          {isAdmin && (
            <button onClick={() => setShowAddCountry(true)}
                    className="flex items-center gap-3 py-2 text-[10px] font-body text-outline-variant hover:text-on-surface-variant transition-colors"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              + Add country
            </button>
          )}
        </div>

        {/* Bottom nav */}
        <div className="border-t border-surface-container">
          <SidebarItem href="#" label="Settings" icon="settings" active={false} />
          <SidebarItem href="#" label="Support" icon="help_outline" active={false} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-[100dvh]">

        {/* Top navbar — glassmorphism */}
        <header className="nav-glass fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 z-50 flex items-center justify-between px-6 md:px-12 ghost-border">
          <div className="flex items-center gap-8">
            <button className="md:hidden text-on-surface-variant hover:text-primary" style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44 }}
                    onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="text-lg font-headline font-black text-primary tracking-tighter">Sector Dashboard</span>
            <nav className="hidden lg:flex items-center gap-6">
              {(['ministry', 'university', 'employer', 'student'] as const).map(track => (
                <a key={track} href={`/${country}/${track}`}
                   className={`font-body text-sm transition-opacity duration-150 pb-1 ${activeTrack === track ? 'text-primary border-b border-primary' : 'text-on-surface-variant hover:text-primary'}`}
                   style={{ textDecoration: 'none' }}>
                  {track.charAt(0).toUpperCase() + track.slice(1)}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '1rem' }}>search</span>
              <input type="text" placeholder="Search parameters..."
                     className="bg-surface-container-high text-on-surface font-body text-sm pl-9 pr-4 py-1.5 w-56 placeholder-on-surface-variant focus:ring-0 transition-all"
                     style={{ border: 'none', borderBottom: '1px solid transparent', outline: 'none' }} />
            </div>
            {['language', 'notifications'].map(icon => (
              <button key={icon} className="text-on-surface-variant hover:text-primary transition-colors p-1" style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44 }}>
                <span className="material-symbols-outlined">{icon}</span>
              </button>
            ))}
            <div className="w-8 h-8 bg-surface-container-highest ghost-border flex items-center justify-center ml-2">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1.2rem' }}>person</span>
            </div>
          </div>
        </header>

        {/* Mobile overlay sidebar */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-surface-container-lowest flex flex-col">
              <div className="flex items-center justify-between px-6 py-6">
                <span className="text-xl font-headline font-bold text-primary tracking-tighter">Syrka</span>
                <button onClick={() => setMobileNavOpen(false)} className="text-on-surface-variant" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <nav className="flex-1 flex flex-col">
                {(['ministry', 'university', 'employer', 'student'] as const).map(track => (
                  <SidebarItem key={track} href={`/${country}/${track}`}
                               label={track.charAt(0).toUpperCase() + track.slice(1)}
                               icon={track === 'ministry' ? 'analytics' : track === 'university' ? 'school' : track === 'employer' ? 'query_stats' : 'person'}
                               active={activeTrack === track}
                               onClick={() => setMobileNavOpen(false)} />
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 pt-16 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest ghost-border flex z-40"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {[
            { id: 'ministry', label: 'Ministry', icon: 'analytics' },
            { id: 'university', label: 'University', icon: 'school' },
            { id: 'employer', label: 'Employer', icon: 'query_stats' },
            { id: 'student', label: 'Student', icon: 'person' },
          ].map(item => (
            <a key={item.id} href={`/${country}/${item.id}`}
               className={`flex-1 flex flex-col items-center gap-1 py-3 text-[9px] font-label uppercase tracking-widest transition-colors ${activeTrack === item.id ? 'text-primary' : 'text-on-surface-variant'}`}
               style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent', minHeight: 44 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {showAddCountry && <AddCountryModal onClose={() => setShowAddCountry(false)} />}
    </div>
  )
}

function SidebarItem({ href, label, icon, active, onClick }: {
  href: string; label: string; icon: string; active: boolean; onClick?: () => void
}) {
  return (
    <a href={href} onClick={onClick}
       className={`flex items-center gap-4 px-6 py-4 text-sm font-label uppercase tracking-wider transition-all duration-150 ${
         active ? 'text-primary bg-surface-container-highest border-l-2 border-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
       }`}
       style={{ textDecoration: 'none', minHeight: 44, WebkitTapHighlightColor: 'transparent' }}>
      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
      {label}
    </a>
  )
}
