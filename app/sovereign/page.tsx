import Link from 'next/link'

export const metadata = {
  title: 'Syrka — Sovereign AI Positioning',
}

export default function SovereignPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Accent bar */}
      <div style={{ height: 2, background: '#3B8BD4' }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(32px, 6vw, 64px) clamp(16px, 4vw, 32px)' }}>
        {/* Header */}
        <Link href="/" style={{ display: 'inline-block', marginBottom: 48, textDecoration: 'none' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
          }}>
            Syrka
          </span>
          <p style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: 3 }}>
            Built in Britain. Deployed globally.
          </p>
        </Link>

        {/* Section 1 */}
        <section style={{ marginBottom: 48 }}>
          <h2 className="label-caps" style={{ fontSize: 11, marginBottom: 16, color: 'var(--text-muted)' }}>
            Why Britain Needs Syrka
          </h2>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            <p style={{ marginBottom: 16 }}>
              The UK AI Opportunities Action Plan sets a target of 10 million workers upskilled by 2030.
              97% of UK organisations already report AI skills gaps. &pound;140B in economic output depends on
              closing that gap.
            </p>
            <p>
              Britain has no platform to measure whether it is actually doing so &mdash; until now.
            </p>
          </div>
        </section>

        <div style={{ borderTop: '0.5px solid var(--border-subtle)', marginBottom: 48 }} />

        {/* Section 2 */}
        <section style={{ marginBottom: 48 }}>
          <h2 className="label-caps" style={{ fontSize: 11, marginBottom: 16, color: 'var(--text-muted)' }}>
            What Syrka Does
          </h2>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            <p style={{ marginBottom: 16 }}>
              Syrka connects government Vision targets to workforce reality across four tracks:
              Ministry, University, Employer, Student.
            </p>
            <p>
              Live pilots: Saudi Vision 2030, Malta Vision 2050, UK AI Opportunities Action Plan.
            </p>
          </div>
        </section>

        <div style={{ borderTop: '0.5px solid var(--border-subtle)', marginBottom: 48 }} />

        {/* Section 3 */}
        <section style={{ marginBottom: 48 }}>
          <h2 className="label-caps" style={{ fontSize: 11, marginBottom: 16, color: 'var(--text-muted)' }}>
            Why the Sovereign AI Fund
          </h2>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            <p style={{ marginBottom: 16 }}>
              We are not asking for capital yet. We are asking for two things:
            </p>
            <ol style={{ listStyleType: 'decimal', paddingLeft: 24 }}>
              <li style={{ marginBottom: 16 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Sovereign compute</strong> &mdash; to replace our current
                Hugging Face CPU deployment for the MiroFish national human capital simulation engine
                with UK sovereign GPU access.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>A conversation</strong> &mdash; about whether Syrka fits
                the strategic assets programme given the UK government&apos;s own interest in measuring
                AI skills adoption nationally.
              </li>
            </ol>
          </div>
        </section>

        <div style={{ borderTop: '0.5px solid var(--border-subtle)', marginBottom: 48 }} />

        {/* Section 4 */}
        <section style={{ marginBottom: 48 }}>
          <h2 className="label-caps" style={{ fontSize: 11, marginBottom: 16, color: 'var(--text-muted)' }}>
            The Ask
          </h2>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            <p style={{ marginBottom: 16 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Compute agreement</strong> &mdash; GPU hours to run
              real-time multi-agent simulation of policy intervention dynamics at national scale.
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Cheque:</strong> Not yet. The right conversation first.
            </p>
          </div>
        </section>

        <div style={{ borderTop: '0.5px solid var(--border-subtle)', marginBottom: 48 }} />

        {/* Contact */}
        <section>
          <h2 className="label-caps" style={{ fontSize: 11, marginBottom: 16, color: 'var(--text-muted)' }}>
            Contact
          </h2>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tahir Mahmood Khan</p>
            <p>Founder, Syrka</p>
            <p style={{ marginTop: 8 }}>
              <a href="mailto:tahirmahmood439wel@gmail.com" style={{ color: '#3B8BD4', textDecoration: 'none' }}>
                tahirmahmood439wel@gmail.com
              </a>
            </p>
            <p style={{ marginTop: 4 }}>
              <a href="https://syrka.co" style={{ color: '#3B8BD4', textDecoration: 'none' }}>syrka.co</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
