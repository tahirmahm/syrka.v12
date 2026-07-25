'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List, X } from '@phosphor-icons/react/dist/ssr'
import type { CampusUser } from '@/lib/campus-types'
import { NAV_ITEMS, DEPARTMENT_SCOPED_NAV_ITEMS } from '@/lib/constants/navigation'
import { Badge } from '@/components/ui/Badge'
import { BrandMark } from '@/components/ui/BrandMark'

export interface CampusShellProps {
  user: CampusUser
  institutionName?: string
  children: React.ReactNode
}

/**
 * Shared Campus application shell: role-aware sidebar + topbar.
 * The demo role switcher is a visually distinct, clearly labelled
 * demonstration control — never confused with real navigation.
 */
export function CampusShell({ user, institutionName, children }: CampusShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isDepartmentScoped = user.role === 'university_administrator' && user.administratorScope?.level === 'department'
  const navItems = isDepartmentScoped ? DEPARTMENT_SCOPED_NAV_ITEMS : NAV_ITEMS[user.role]
  const sectionLabel = isDepartmentScoped ? 'Department' : user.role === 'university_administrator' ? 'University' : user.role === 'faculty' ? 'Faculty' : 'Student'

  return (
    <div className="flex min-h-[100dvh] bg-campus-bg font-campus-sans text-campus-text">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-campus-border bg-campus-surface md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <BrandMark />
        </div>
        <div className="px-5 pb-4">
          <span className="font-campus-mono text-[10px] uppercase tracking-widest text-campus-muted">{sectionLabel}</span>
          {institutionName && <p className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{institutionName}</p>}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-campus-sm px-3 py-2 font-campus-sans text-campus-sm transition-colors duration-campus-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
                  active ? 'bg-campus-surface-raised font-medium text-campus-text' : 'text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <DemoRoleSwitcher user={user} />
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col md:ml-60">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-campus-border bg-campus-surface px-4 md:px-8">
          <button
            type="button"
            className="rounded-campus-sm p-2 text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <List size={20} />}
          </button>
          <span className="md:hidden">
            <BrandMark />
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="font-campus-sans text-campus-sm text-campus-muted">{user.name}</span>
          </div>
        </header>

        {mobileOpen && (
          <nav className="flex flex-col gap-0.5 border-b border-campus-border bg-campus-surface px-3 py-3 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-campus-sm px-3 py-2 font-campus-sans text-campus-sm text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  )
}

function DemoRoleSwitcher({ user }: { user: CampusUser }) {
  return (
    <div className="border-t border-dashed border-campus-border bg-campus-stone-100 px-4 py-3 dark:bg-campus-surface-raised">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Badge tone="purple">Demo control</Badge>
      </div>
      <p className="font-campus-sans text-campus-xs text-campus-muted">
        Viewing as <span className="font-medium text-campus-text">{user.name}</span> ({user.role.replace('_', ' ')}). Role switching is a demonstration aid, not a real permission change.
      </p>
    </div>
  )
}
