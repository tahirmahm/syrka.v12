import Link from 'next/link'

export interface FilterOption {
  label: string
  href: string
  active: boolean
}

export interface FilterBarProps {
  label: string
  options: FilterOption[]
}

/** Server-rendered filter chips backed by plain links, so state is URL-driven, linkable, and refresh-safe. */
export function FilterBar({ label, options }: FilterBarProps) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? 'true' : undefined}
          className={`rounded-campus-sm px-3 py-1.5 font-campus-sans text-campus-sm transition-colors duration-campus-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
            option.active
              ? 'bg-campus-ink-950 text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950'
              : 'border border-campus-border text-campus-muted hover:text-campus-text'
          }`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  )
}
