import Link from 'next/link'

export const metadata = {
  title: 'SYRKA — Sovereign AI Positioning',
}

export default function SovereignPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Accent bar */}
      <div className="h-1 bg-[#1a3a6b]" />

      <div className="max-w-2xl mx-auto px-8 py-16">
        {/* Header */}
        <Link href="/" className="inline-block mb-16">
          <h1 className="font-display text-3xl text-[#0A1628] tracking-wide">SYRKA</h1>
          <p className="text-[#8B95A8] text-xs tracking-[0.2em] uppercase mt-0.5">
            Built in Britain. Deployed globally.
          </p>
        </Link>

        {/* Section 1 */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-[#0A1628] mb-6 uppercase tracking-wide" style={{ letterSpacing: '0.3px' }}>
            Why Britain Needs Syrka
          </h2>
          <div className="space-y-4 text-[15px] text-[#5A6478] leading-[1.65]">
            <p>
              The UK AI Opportunities Action Plan sets a target of 10 million workers upskilled by 2030.
              97% of UK organisations already report AI skills gaps. £140B in economic output depends on
              closing that gap.
            </p>
            <p>
              Britain has no platform to measure whether it is actually doing so — until now.
            </p>
          </div>
        </section>

        <div className="border-t border-[#E2E5EB] mb-16" />

        {/* Section 2 */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-[#0A1628] mb-6 uppercase tracking-wide" style={{ letterSpacing: '0.3px' }}>
            What Syrka Does
          </h2>
          <div className="space-y-4 text-[15px] text-[#5A6478] leading-[1.65]">
            <p>
              Syrka connects government Vision targets to workforce reality across four tracks:
              Ministry, University, Employer, Student.
            </p>
            <p>
              Live pilots: Saudi Vision 2030, Malta Vision 2050, UK AI Opportunities Action Plan.
            </p>
          </div>
        </section>

        <div className="border-t border-[#E2E5EB] mb-16" />

        {/* Section 3 */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-[#0A1628] mb-6 uppercase tracking-wide" style={{ letterSpacing: '0.3px' }}>
            Why the Sovereign AI Fund
          </h2>
          <div className="space-y-4 text-[15px] text-[#5A6478] leading-[1.65]">
            <p>
              We are not asking for capital yet. We are asking for two things:
            </p>
            <ol className="list-decimal pl-6 space-y-4">
              <li>
                <strong className="text-[#0A1628]">Sovereign compute</strong> — to replace our current
                Hugging Face CPU deployment for the MiroFish national human capital simulation engine
                with UK sovereign GPU access.
              </li>
              <li>
                <strong className="text-[#0A1628]">A conversation</strong> — about whether Syrka fits
                the strategic assets programme given the UK government&apos;s own interest in measuring
                AI skills adoption nationally.
              </li>
            </ol>
          </div>
        </section>

        <div className="border-t border-[#E2E5EB] mb-16" />

        {/* Section 4 */}
        <section className="mb-16">
          <h2 className="font-display text-2xl text-[#0A1628] mb-6 uppercase tracking-wide" style={{ letterSpacing: '0.3px' }}>
            The Ask
          </h2>
          <div className="space-y-4 text-[15px] text-[#5A6478] leading-[1.65]">
            <p>
              <strong className="text-[#0A1628]">Compute agreement</strong> — GPU hours to run
              real-time multi-agent simulation of policy intervention dynamics at national scale.
            </p>
            <p>
              <strong className="text-[#0A1628]">Cheque:</strong> Not yet. The right conversation first.
            </p>
          </div>
        </section>

        <div className="border-t border-[#E2E5EB] mb-16" />

        {/* Contact */}
        <section>
          <h2 className="font-display text-2xl text-[#0A1628] mb-6 uppercase tracking-wide" style={{ letterSpacing: '0.3px' }}>
            Contact
          </h2>
          <div className="text-[15px] text-[#5A6478] leading-[1.65]">
            <p className="font-medium text-[#0A1628]">Tahir Mahmood Khan</p>
            <p>Founder, Syrka</p>
            <p className="mt-2">
              <a href="mailto:tahirmahmood439wel@gmail.com" className="text-[#1a3a6b] hover:underline">
                tahirmahmood439wel@gmail.com
              </a>
            </p>
            <p className="mt-1">
              <a href="https://syrka.co" className="text-[#1a3a6b] hover:underline">syrka.co</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
