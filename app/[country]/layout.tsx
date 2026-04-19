import { notFound } from 'next/navigation'

const COUNTRY_CONFIG: Record<string, { accentColor: string; visionName: string }> = {
  malta: { accentColor: '#1D9E75', visionName: 'Vision 2050' },
  saudi: { accentColor: '#C9A84C', visionName: 'Vision 2030' },
  uk:    { accentColor: '#3B8BD4', visionName: 'AI Opportunities Action Plan' },
}

export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { country: string }
}) {
  const config = COUNTRY_CONFIG[params.country]
  if (!config) notFound()

  return <>{children}</>
}
