import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react/dist/ssr'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 font-campus-sans text-campus-sm text-campus-muted">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <CaretRight size={12} aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-campus-text">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-campus-text">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
