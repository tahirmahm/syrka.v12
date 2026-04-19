'use client'

interface RoleSelectorProps {
  role: string
  accentColor: string
}

export default function RoleSelector({ role, accentColor }: RoleSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 44,
      background: 'var(--bg-elevated)',
      borderBottom: '0.5px solid var(--border-subtle)',
      borderLeft: `2px solid ${accentColor}`,
      paddingLeft: 16,
      paddingRight: 12,
    }}>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: accentColor,
        letterSpacing: '0.2px',
      }}>
        {role} Dashboard
      </span>
    </div>
  )
}
