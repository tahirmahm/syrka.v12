import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in — Syrka Campus' }

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
