'use client'

interface RoleSelectorProps {
  role: string
  accentColor: string
}

const roleLabels: Record<string, string> = {
  ministry: 'Ministry Dashboard',
  university: 'University Dashboard',
  employer: 'Employer Dashboard',
  student: 'Student Dashboard',
}

export default function RoleSelector({ role, accentColor }: RoleSelectorProps) {
  const label = roleLabels[role] || role

  return (
    <div className="relative flex items-center h-14 bg-[#0A1628]/50 border-b border-white/5">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="pl-6 pr-4 flex items-center gap-3">
        <h2
          className="font-display text-lg tracking-wide"
          style={{ color: accentColor }}
        >
          {label}
        </h2>
      </div>
    </div>
  )
}
