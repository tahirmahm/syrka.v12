export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-campus-sm bg-campus-stone-300 dark:bg-campus-border ${className}`} aria-hidden="true" />
}
