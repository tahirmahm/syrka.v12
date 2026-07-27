import { MotionReveal } from '@/components/motion/MotionReveal'

export interface DomainChapterProps {
  id: string
  eyebrow: string
  headline: string
  leadProduct: string
  supportingSystems: string[]
}

export function DomainChapter({ id, eyebrow, headline, leadProduct, supportingSystems }: DomainChapterProps) {
  return (
    <div id={id} className="border-t border-syrka-hairline px-6 py-14 md:px-10">
      <MotionReveal>
        <p className="font-campus-mono text-[11px] uppercase tracking-widest text-syrka-steel">{eyebrow}</p>
      </MotionReveal>
      <MotionReveal delay={0.05}>
        <h3 className="mt-3 font-campus-sans text-campus-2xl font-semibold text-syrka-offwhite">{headline}</h3>
      </MotionReveal>
      <MotionReveal delay={0.1} className="mt-5 flex flex-col gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">Lead product</p>
        <p className="font-campus-sans text-campus-base text-syrka-offwhite">{leadProduct}</p>
        {supportingSystems.length > 0 && (
          <>
            <p className="mt-3 font-campus-mono text-[10px] uppercase tracking-widest text-syrka-steel">Supporting systems</p>
            <p className="font-campus-sans text-campus-sm text-syrka-steel">{supportingSystems.join(' · ')}</p>
          </>
        )}
      </MotionReveal>
    </div>
  )
}
