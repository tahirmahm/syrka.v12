'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, ChalkboardTeacher, Buildings } from '@phosphor-icons/react/dist/ssr'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const DEMO_ROLES = [
  { icon: GraduationCap, label: 'Student', href: '/student' },
  { icon: ChalkboardTeacher, label: 'Faculty', href: '/faculty' },
  { icon: Buildings, label: 'University Administrator', href: '/university' },
] as const

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('This demo does not perform real authentication. Choose a role below to continue.')
  }

  function handleDemoEntry(label: string, href: string) {
    setLoadingRole(label)
    setTimeout(() => router.push(href), 400)
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
      {/* Brand panel — dark surface, suitable for the logo asset */}
      <div className="dark flex flex-col justify-between bg-campus-bg px-8 py-10 md:px-12 md:py-14">
        <BrandMark />
        <div className="max-w-sm">
          <p className="font-campus-sans text-campus-xl font-medium text-campus-text">
            Evidence-backed capability intelligence for universities.
          </p>
          <p className="mt-3 font-campus-sans text-campus-sm text-campus-muted">
            Institutional capability infrastructure. Built for institutional deployment.
          </p>
        </div>
        <p className="font-campus-mono text-campus-xs uppercase tracking-widest text-campus-muted">Syrka Campus</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center bg-campus-bg px-8 py-10 text-campus-text md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Badge tone="neutral">Demo environment</Badge>
          <h1 className="mt-4 font-campus-sans text-campus-2xl font-semibold text-campus-text">Sign in to Syrka Campus</h1>
          <p className="mt-2 font-campus-sans text-campus-sm text-campus-muted">Meridian University</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block font-campus-sans text-campus-sm font-medium text-campus-text">
                Institutional email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
                placeholder="you@university.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block font-campus-sans text-campus-sm font-medium text-campus-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="mt-2">Sign in</Button>
            {formMessage && (
              <p role="status" className="font-campus-sans text-campus-sm text-campus-muted">
                {formMessage}
              </p>
            )}
          </form>

          <div className="mt-8 border-t border-dashed border-campus-border pt-6">
            <div className="mb-3 flex items-center gap-1.5">
              <Badge tone="purple">Demo control</Badge>
            </div>
            <p className="mb-3 font-campus-sans text-campus-xs text-campus-muted">
              Or continue as a demo role — this is a demonstration aid, not real authentication.
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_ROLES.map((role) => (
                <Button
                  key={role.label}
                  variant="secondary"
                  className="justify-start"
                  icon={<role.icon size={18} aria-hidden="true" />}
                  loading={loadingRole === role.label}
                  onClick={() => handleDemoEntry(role.label, role.href)}
                >
                  Continue as {role.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
