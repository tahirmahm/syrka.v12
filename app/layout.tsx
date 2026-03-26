import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SYRKA — National Human Capital Intelligence System',
  description: 'Ministerial-grade national workforce intelligence platform for policy decision support.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F5F7]">
        {children}
      </body>
    </html>
  )
}
