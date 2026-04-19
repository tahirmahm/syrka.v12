export default function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { country: string }
}) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#ffffff',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <nav style={{
        background: '#ffffff',
        borderBottom: '0.5px solid #e5e7eb',
        padding: '14px clamp(16px, 4vw, 32px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <a href="/" style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#0A0C10',
          letterSpacing: '-0.3px',
          textDecoration: 'none',
        }}>
          Syrka
        </a>
        <a href={`/${params.country}/ministry`} style={{
          fontSize: 12,
          color: '#6b7280',
          textDecoration: 'none',
        }}>
          Ministry view &rarr;
        </a>
      </nav>
      {children}
    </div>
  )
}
