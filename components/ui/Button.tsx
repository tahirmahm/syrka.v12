import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-campus-ink-950 text-campus-white hover:bg-campus-ink-700 dark:bg-campus-stone-100 dark:text-campus-ink-950 dark:hover:bg-campus-white',
  secondary: 'bg-transparent border border-campus-border text-campus-text hover:bg-campus-surface-raised',
  ghost: 'bg-transparent text-campus-text hover:bg-campus-surface-raised',
  danger: 'bg-campus-red-600 text-campus-white hover:opacity-90',
  link: 'bg-transparent text-campus-blue-600 dark:text-campus-blue-dark underline-offset-4 hover:underline p-0',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-campus-sm font-sans font-medium transition-colors duration-campus-fast ease-campus-standard disabled:opacity-campus-disabled disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${variant !== 'link' ? sizeClasses[size] : ''} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
