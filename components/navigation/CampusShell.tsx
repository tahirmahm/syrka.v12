'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CaretRight, List } from '@phosphor-icons/react/dist/ssr'
import type { CampusUser } from '@/lib/campus-types'
import { NAV_ITEMS, DEPARTMENT_SCOPED_NAV_ITEMS, type NavItem } from '@/lib/constants/navigation'
import { Badge } from '@/components/ui/Badge'
import { BrandMark } from '@/components/ui/BrandMark'
import { Drawer } from '@/components/campus/Drawer'
import { FloatingCommandSurface, type CommandItem } from '@/components/campus/FloatingCommandSurface'

export interface CampusShellProps {
  user: CampusUser
  institutionName?: string
  children: React.ReactNode
}

const RAIL_COLLAPSED = 'w-[70px]'
const RAIL_EXPANDED = 'w-[240px]'

/**
 * Shared Campus application shell v2: a collapsed-by-default institutional
 * rail (68-72px) that expands as a keyboard-accessible overlay (~232-248px)
 * without reflowing the content canvas, a mobile Drawer in place of the
 * rail, and a global command surface. The demo role context lives in the
 * rail footer, never the page header, so ordinary page headers stay free
 * of persistent identity chrome.
 */
export function CampusShell({ user, institutionName, children }: CampusShellProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isDepartmentScoped = user.role === 'university_administrator' && user.administratorScope?.level === 'department'
  const navItems = isDepartmentScoped ? DEPARTMENT_SCOPED_NAV_ITEMS : NAV_ITEMS[user.role]
  const sectionLabel = isDepartmentScoped ? 'Department' : user.role === 'university_administrator' ? 'University' : user.role === 'faculty' ? 'Faculty' : 'Student'

  // Longest-matching href wins, so a nested route (e.g. /student/evidence/ev-1)
  // highlights "Evidence", not "Dashboard", even though both are prefixes.
  const activeHref = navItems.reduce<string | undefined>((best, item) => {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`)
    if (!matches) return best
    if (!best || item.href.length > best.length) return item.href
    return best
  }, undefined)

  const commandItems = useMemo<CommandItem[]>(
    () => navItems.map((item) => ({ id: item.href, label: item.label, href: item.href, group: sectionLabel })),
    [navItems, sectionLabel]
  )

  return (
    <div className="flex min-h-[100dvh] bg-campus-bg font-campus-sans text-campus-text">
      {expanded && (
        <div
          className="fixed inset-0 z-40 hidden md:block"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop institutional rail — collapsed by default, expands as an overlay (content canvas never reflows). */}
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-campus-border bg-campus-surface shadow-campus-panel transition-[width] duration-campus-base ease-campus-standard md:flex print:hidden ${
          expanded ? RAIL_EXPANDED : RAIL_COLLAPSED
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-5">
          {expanded ? (
            <BrandMark />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-campus-sm bg-campus-ink-950 font-campus-sans text-campus-sm font-semibold text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950"
              aria-hidden="true"
            >
              S
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-campus-sm border border-campus-border py-1.5 text-campus-muted transition-colors duration-campus-fast hover:bg-campus-surface-raised hover:text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          <CaretRight size={13} aria-hidden="true" className={`transition-transform duration-campus-base ${expanded ? 'rotate-180' : ''}`} />
          {expanded && <span className="font-campus-mono text-[10px] uppercase tracking-wide">Collapse</span>}
        </button>

        {expanded && (
          <div className="px-5 pb-3">
            <span className="font-campus-mono text-[10px] uppercase tracking-widest text-campus-muted">{sectionLabel}</span>
            {institutionName && <p className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{institutionName}</p>}
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label={`${sectionLabel} navigation`}>
          {navItems.map((item) => (
            <RailNavLink key={item.href} item={item} active={activeHref === item.href} expanded={expanded} />
          ))}
        </nav>

        <RailIdentityFooter user={user} expanded={expanded} />
      </aside>

      {/* Mobile navigation drawer */}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} ariaLabel={`${sectionLabel} navigation`} side="left">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 px-3 pb-3">
            <BrandMark />
          </div>
          <div className="px-5 pb-3">
            <span className="font-campus-mono text-[10px] uppercase tracking-widest text-campus-muted">{sectionLabel}</span>
            {institutionName && <p className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{institutionName}</p>}
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label={`${sectionLabel} navigation`}>
            {navItems.map((item) => (
              <RailNavLink key={item.href} item={item} active={activeHref === item.href} expanded onNavigate={() => setMobileOpen(false)} />
            ))}
          </nav>
          <RailIdentityFooter user={user} expanded />
        </div>
      </Drawer>

      {/* Main column — offset always matches the rail's collapsed width, regardless of expansion state. */}
      <div className="flex flex-1 flex-col md:ml-[70px] print:ml-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-campus-border bg-campus-surface px-4 md:px-8 print:hidden">
          <button
            type="button"
            className="rounded-campus-sm p-2 text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <List size={20} aria-hidden="true" />
          </button>
          <span className="md:hidden">
            <BrandMark />
          </span>
          <div className="ml-auto flex items-center gap-3">
            <FloatingCommandSurface items={commandItems} />
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  )
}

function RailNavLink({ item, active, expanded, onNavigate }: { item: NavItem; active: boolean; expanded: boolean; onNavigate?: () => void }) {
  const Icon = item.icon

  return (
    <div className="group relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        title={expanded ? undefined : item.label}
        className={`flex items-center gap-3 rounded-campus-sm border-l-2 px-2.5 py-2 font-campus-sans text-campus-sm transition-colors duration-campus-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
          active
            ? 'border-campus-ink-950 bg-campus-surface-raised font-medium text-campus-text dark:border-campus-stone-100'
            : 'border-transparent text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
        } ${expanded ? '' : 'justify-center'}`}
      >
        <Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden="true" className="shrink-0" />
        {expanded && <span className="truncate">{item.label}</span>}
      </Link>
      {!expanded && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-campus-sm border border-campus-border bg-campus-surface px-2 py-1 font-campus-sans text-campus-xs text-campus-text opacity-0 shadow-campus-subtle transition-opacity duration-campus-fast group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {item.label}
        </span>
      )}
    </div>
  )
}

function RailIdentityFooter({ user, expanded }: { user: CampusUser; expanded: boolean }) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (!expanded) {
    return (
      <div className="group relative flex justify-center border-t border-dashed border-campus-border py-3">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-campus-stone-100 font-campus-mono text-[10px] font-medium text-campus-ink-700 dark:bg-campus-surface-raised dark:text-campus-muted"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-campus-sm border border-campus-border bg-campus-surface px-2 py-1 font-campus-sans text-campus-xs text-campus-text opacity-0 shadow-campus-subtle transition-opacity duration-campus-fast group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {user.name} · {user.role.replace('_', ' ')} · demo
        </span>
      </div>
    )
  }

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
