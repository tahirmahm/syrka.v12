'use client'

import { useState } from 'react'
import Sidebar from './layout/Sidebar'
import BottomNav from './BottomNav'
import SyrkaWordmark from './SyrkaWordmark'

interface ShellProps {
  children: React.ReactNode
  country: string
  activeTrack: string
}

export default function Shell({ children, country, activeTrack }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar country={country} activeTrack={activeTrack} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            style={{ width: 240, height: '100%', background: 'var(--bg-surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <Sidebar country={country} activeTrack={activeTrack} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Mobile top bar */}
        <div
          className="flex md:hidden items-center justify-between px-4 py-3"
          style={{ background: 'var(--bg-surface)', borderBottom: '0.5px solid var(--border-subtle)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              color: 'var(--text-muted)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 4, fontSize: 18, minWidth: 44, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            &#9776;
          </button>
          <SyrkaWordmark country={country} size="sm" />
          <div style={{ width: 44 }} />
        </div>

        {children}

        {/* Mobile bottom nav */}
        <div className="flex md:hidden">
          <BottomNav country={country} activeTrack={activeTrack} />
        </div>
      </main>
    </div>
  )
}
