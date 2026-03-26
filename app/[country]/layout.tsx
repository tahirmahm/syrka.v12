import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import { notFound } from 'next/navigation'

const COUNTRY_CONFIG: Record<string, { accentColor: string; visionName: string }> = {
  malta: { accentColor: '#1B6B5A', visionName: 'Vision 2050' },
  saudi: { accentColor: '#C9A84C', visionName: 'Vision 2030' },
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

  const supabase = createClient()
  const { data: vision } = await supabase
    .from('national_visions')
    .select('*')
    .eq('slug', params.country)
    .single()

  return (
    <div className="flex min-h-screen" data-accent={params.country}>
      <Sidebar
        country={params.country}
        accentColor={config.accentColor}
        visionName={vision?.vision_name || config.visionName}
      />
      <main className="flex-1 ml-[240px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
