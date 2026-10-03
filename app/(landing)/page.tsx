import type { Metadata } from 'next'
import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { type GlobeFit } from '@/components/landing/AsciiGlobe'
import MorphField from '@/components/landing/MorphField'
import AsciiWordmark from '@/components/landing/AsciiWordmark'
import SiteLoader from '@/components/landing/SiteLoader'
import SiteNav from '@/components/landing/SiteNav'
import { DEPLOY_STYLE, GHOST_STYLE, SyrkaLogo } from '@/components/landing/brand'
import Topo from '@/components/landing/Topo'
import { CapabilityScroller } from '@/components/landing/Story'
import { ScrollMarquee } from '@/components/landing/Marquee'
import { SpecStats, SpecTable } from '@/components/landing/SpecSheet'
import { AudienceSlides, type AudiencePanel, type StageSlide } from '@/components/landing/Sections'
import { GraphStage } from '@/components/landing/GraphStage'
import PassportCard from '@/components/landing/PassportCard'
import PixelVideo from '@/components/landing/PixelVideo'
import '@/components/landing/landing.css'
import SpecularButton from '@/components/ui/SpecularButton'

// Geist (sans and mono) comes from the root layout's `geist` package (--font-geist-sans / --font-geist-mono);
// landing.css reads those variables.
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-lx-serif' })

export const metadata: Metadata = {
  title: 'Syrka — The Operating System for Human Capability',
  description: 'Syrka connects how capability is developed, directed, proven, put to work, and coordinated — across individuals, institutions, employers, and nations.',
}

// Campus and sign-in are served by this app, so link to them directly.
const SYRKA_SITE = ''
const CAMPUS_HREF = `${SYRKA_SITE}/campus`
const SIGN_IN_HREF = `${SYRKA_SITE}/sign-in`

/* Copy is syrka.co's. Sentences in `more`, `detail` and the extra paragraphs expand on it in the same voice. */

// Hero globe: right of the headline on desktop, its cradle reaching near the bottom of the screen; above it on phones.
const HERO_GLOBE: GlobeFit = { cx: 0.71, cy: 0.475, r: 0.33 }
const HERO_GLOBE_MOBILE: GlobeFit = { cx: 0.5, cy: 0.24, r: 0.36 }

// Background videos, shown pixelated (components/landing/PixelVideo.tsx). Files live in public/media/ and were
// cropped to 16:9, cut to 10s, stripped of audio and compressed to 960×540 H.264 (work and government also
// brightened, and work de-letterboxed). Empty = no video.
// `graph` has one entry per capability-graph step. The Passport step shows the Syrka ID background instead, so
// its slot is empty and each clip appears exactly once. Bump ?v= when re-encoding a file in place, or browsers
// that cached the old file's byte ranges will stall on the new one.
const VIDEOS = {
  capability: '',
  graph: ['/media/evidence.mp4', '/media/capability.mp4', '/media/review.mp4', '', '/media/work.mp4?v=2', '/media/government.mp4?v=2'],
  audience: '',
  closing: '',
}

/** Graph label for how far capability reaches at each stage, in the flow words used on the domain panels. */
const REACH: Record<string, string> = { campus: 'INDIVIDUAL', odyssey: 'COHORT', passport: 'UNIVERSITY', praxis: 'WORKFORCE', maxima: 'NATIONAL GRAPH' }
const SHORT: Record<string, string> = { campus: 'CAMPUS', odyssey: 'ODYSSEY', passport: 'PASSPORT', praxis: 'PRAXIS', maxima: 'MAXIMA' }

type Tone = 'ink' | 'graphite' | 'paper'
const TONE: Record<Tone, string> = { ink: 'bg-[var(--lx-bg)]', graphite: 'lx-tone-graphite', paper: 'lx-tone-paper' }

interface System {
  id: string
  short: string
  audience: string
  line: string
  subtitle: string
  name: string
  description: string
  link?: { label: string; href: string }
}

const SYSTEMS: System[] = [
  {
    id: 'campus', short: 'CAMPUS', audience: 'ACADEMIA',
    line: 'Capability developed.', subtitle: 'Every piece of work counts.',
    name: 'Syrka Campus',
    description: 'Each essay, project and lab becomes evidence of what a student can do, so teachers can see real growth long before the final grade.',
    link: { label: 'Explore Campus →', href: CAMPUS_HREF },
  },
  {
    id: 'odyssey', short: 'ODYSSEY', audience: 'INDIVIDUALS AND INSTITUTIONS',
    line: 'Capability directed.', subtitle: 'Always know the next step.',
    name: 'Syrka Odyssey',
    description: 'A personal route from where you are to where you want to be. It redraws itself every time you prove something new.',
    link: { label: 'Part of Syrka Campus →', href: CAMPUS_HREF },
  },
  {
    id: 'passport', short: 'CAREER PASSPORT', audience: 'INDIVIDUALS, INSTITUTIONS, AND EMPLOYERS',
    line: 'Capability proven and carried.', subtitle: 'Proof that travels with you.',
    name: 'Syrka Career Passport',
    description: 'A record of what you can do, confirmed by the people who taught you. You decide who sees it, and it keeps growing for the rest of your career.',
    link: { label: 'See the Syrka Career Passport →', href: CAMPUS_HREF },
  },
  {
    id: 'praxis', short: 'PRAXIS', audience: 'EMPLOYERS',
    line: 'Capability put to work.', subtitle: 'Hire for what people can do.',
    name: 'Syrka Praxis',
    description: 'Match roles, projects and teams to skills that have already been shown and checked, so the right people find the right work.',
  },
  {
    id: 'maxima', short: 'MAXIMA', audience: 'GOVERNMENT',
    line: 'Capability coordinated nationally.', subtitle: 'See a nation’s talent clearly.',
    name: 'Syrka Maxima',
    description: 'A live picture of the skills a country has and the skills it will need, built from anonymised data that never exposes a single person.',
  },
]

/** Spec sheet rows: what each system takes in and gives back. */
const SPEC: Record<string, { forWho: string; takes: string; gives: string; live: boolean; via?: string }> = {
  campus: { forWho: 'Universities and faculty', takes: 'Coursework, projects, assessments', gives: 'Reviewed capability claims', live: true },
  odyssey: { forWho: 'Students and institutions', takes: 'Goals, constraints, verified evidence', gives: 'A personal route with milestones', live: true, via: 'Inside Campus' },
  passport: { forWho: 'Individuals and employers', takes: 'Reviewed claims with their source', gives: 'A portable record the owner controls', live: true, via: 'Inside Campus' },
  praxis: { forWho: 'Employers', takes: 'Role and project requirements', gives: 'Matches on verified capability', live: false },
  maxima: { forWho: 'Ministries and agencies', takes: 'Aggregated, permissioned data', gives: 'A national picture of skills', live: false },
}

const GRAPH_NODES = ['EVIDENCE', 'CAPABILITY', 'ODYSSEY', 'PASSPORT', 'PRAXIS', 'MAXIMA']

const GRAPH_SLIDES: StageSlide[] = [
  { word: 'EVIDENCE', top: 'Individual record', label: ['Step 01', 'Source'], subtitle: 'Real work, not self-report.',
    body: 'Essays, projects, lab results and assessments arrive with a timestamp and a named source, so every claim can be traced back to the work behind it.',
    heading: 'It starts with real work.' },
  { word: 'CAPABILITY', top: 'Individual record', label: ['Step 02', 'Review'], subtitle: 'Evidence adds up to skill.',
    body: 'As evidence builds, Syrka forms a capability claim with a level and a confidence range. Faculty review it before it counts.',
    heading: 'Work becomes capability.' },
  { word: 'ODYSSEY', top: 'Individual record', label: ['Step 03', 'Direction'], subtitle: 'A route, not a guess.',
    body: 'Confirmed capability, personal goals and what the institution offers combine into a sequence of next steps, each with the evidence it will need.',
    heading: 'Capability sets direction.' },
  { word: 'PASSPORT', top: 'Individual record', label: ['Step 04', 'Ownership'], subtitle: 'Owned by the person.',
    body: 'Reviewed claims become a portable record. The owner decides what is shared and with whom, and every change is kept in its history.',
    heading: 'Direction becomes proof.' },
  { word: 'PRAXIS', top: 'Across the governed boundary', label: ['Step 05', 'Matching'], subtitle: 'Matched on evidence.',
    body: 'Shared records are matched to roles, projects and teams against real demand, using skills that were shown and checked rather than claimed.',
    heading: 'Proof meets real work.' },
  { word: 'MAXIMA', top: 'Aggregate only', label: ['Step 06', 'Coordination'], subtitle: 'Aggregated, never exposed.',
    body: 'Permissioned, anonymised signals roll up into a national picture of skills supply and demand. No individual record is visible without explicit governance.',
    heading: 'Work informs a nation.' },
]

const AUDIENCE_SLIDES: StageSlide[] = [
  { word: 'ACADEMIA', top: 'Individual → cohort → university', label: ['For universities', 'Campus, Odyssey, Passport'], subtitle: 'See growth as it happens.',
    body: 'Faculty see what each learner and cohort can actually do, with the evidence behind it, and where support is needed long before the final grade.',
    heading: 'Develop capability with evidence.' },
  { word: 'EMPLOYERS', top: 'University → workforce', label: ['For employers', 'Praxis'], subtitle: 'Hire on proof.',
    body: 'Find people for roles, projects and teams using skills that have been shown and reviewed, then watch how your workforce grows over time.',
    heading: 'Put proven capability to work.' },
  { word: 'GOVERNMENT', top: 'Workforce → national graph', label: ['For ministries', 'Maxima'], subtitle: 'Plan with real signals.',
    body: 'Track how skills move from education into work, spot gaps early, and coordinate strategy on aggregated data that never exposes an individual.',
    heading: 'Coordinate national capability.' },
]

const AUDIENCE_PANELS: AudiencePanel[] = [
  {
    title: 'Cohort capability', context: 'BSc Computer Science · Year 2',
    stats: [{ value: '1,284', label: 'Evidence items' }, { value: '91%', label: 'Reviewed' }, { value: '146', label: 'Learners' }],
    kind: 'bars',
    rows: [
      { label: 'Programming', value: 78 }, { label: 'Teamwork', value: 83 }, { label: 'Communication', value: 71 },
      { label: 'Data analysis', value: 64 }, { label: 'Systems design', value: 52 },
    ],
    footer: '23 learners ready for Systems Design II · 9 need support in data analysis',
    chips: ['✓ Lab 4 reviewed · 2 min ago', '23 ready for Systems Design II'],
  },
  {
    title: 'Role match', context: 'Junior data engineer · Valletta',
    stats: [{ value: '312', label: 'Records shared' }, { value: '4/4', label: 'Skills verified' }, { value: '6 days', label: 'To shortlist' }],
    kind: 'match',
    rows: [
      { label: 'Candidate A', value: 94, tags: ['SQL', 'Python', 'Data modelling'] },
      { label: 'Candidate B', value: 89, tags: ['SQL', 'Python', 'Communication'] },
      { label: 'Candidate C', value: 83, tags: ['Python', 'Data modelling'] },
      { label: 'Candidate D', value: 76, tags: ['SQL', 'Communication'] },
    ],
    footer: 'Matched on reviewed evidence only · candidates chose to share their records',
    chips: ['Match found · 94%', '✓ 4/4 skills verified'],
  },
  {
    title: 'Skills supply vs demand', context: 'National view · 2030 horizon',
    stats: [{ value: '14', label: 'Institutions' }, { value: '−38k', label: 'Largest gap' }, { value: '0', label: 'Records exposed' }],
    kind: 'versus', legend: ['Supply', 'Projected demand'],
    rows: [
      { label: 'Digital and AI', value: 58, second: 88, note: '−38k' },
      { label: 'Renewable energy', value: 44, second: 70, note: '−21k' },
      { label: 'Advanced manufacturing', value: 39, second: 61, note: '−17k' },
      { label: 'Healthcare', value: 72, second: 84, note: '−9k' },
      { label: 'Tourism and culture', value: 81, second: 74, note: '+6k' },
    ],
    footer: 'Aggregated from permissioned institutional data · no individual records',
    chips: ['Gap alert · Digital and AI −38k', 'Updated · 14 institutions'],
  },
]

const TRUST = [
  'Every piece of evidence can be traced to its source.',
  'Institutions review evidence before it strengthens a claim.',
  'Every capability claim can be explained. No black-box scores.',
  'Records are versioned, so history is never overwritten.',
  'Access is limited to a stated purpose and explicit permission.',
  'The owner of a record decides what is disclosed.',
  'Praxis and Maxima work on governed, aggregated data only.',
  'AI suggests and drafts. People and institutions decide.',
]

/** Topographic contour lines behind a section: white on dark tones, black on paper. */
function Backdrop({ seed, tone = 'ink' }: { seed: number; tone?: Tone }) {
  return <Topo seed={seed} className={tone === 'paper' ? 'text-black/[0.08]' : 'text-white/[0.06]'} />
}

function Eyebrow({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`lx-mono flex items-center gap-4 ${accent ? 'text-[var(--lx-accent-ink)]' : 'text-[var(--lx-dim)]'}`}>
      <span className={`h-px w-8 ${accent ? 'bg-[var(--lx-accent-ink)]' : 'bg-[var(--lx-ink)]'}`} />
      {children}
    </div>
  )
}

const footerLink = 'w-max text-[var(--lx-ink)] no-underline hover:text-[var(--lx-accent-ink)]'

export default function LandingPage() {
  return (
    <div id="top" className={`lx ${serif.variable} min-h-[100dvh]`}>
      <SiteLoader />
      <noscript><style>{'#lx-loader{display:none}'}</style></noscript>
      <SiteNav systems={SYSTEMS.map(s => ({ id: s.id, name: s.name, tagline: s.line }))} signInHref={SIGN_IN_HREF} />

      <main>
        {/* Hero + capability scroller share one sticky 3D layer: the globe travels down and re-forms per stage.
            Both sections skip `isolate` so their text (z-[6]) can sit above the layer (z-[5]) while their backgrounds stay below it. */}
        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none sticky top-0 z-[5] -mb-[100dvh] h-[100dvh]">
            <MorphField fit={HERO_GLOBE} fitMobile={HERO_GLOBE_MOBILE} scrollerId="lx-capability" coordsId="lx-coords" />
          </div>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <section className="lx-dots relative flex min-h-[100dvh] flex-col justify-end overflow-hidden px-4 pb-10 pt-[50vh] md:px-8 md:pt-28">
            {/* What the name stands for, set just under the globe and its Syrka symbol (see .lx-name). */}
            <div className="lx-mono lx-name pointer-events-none absolute z-[6] whitespace-nowrap text-[#3a42c4]">
              Systematic · Relational · Knowledge · Architecture
            </div>
            <div className="lx-mono pointer-events-none absolute left-4 top-24 z-[6] md:left-8">
              <div id="lx-coords" className="text-[#bdbdc2]">22°00&apos;N, 20°00&apos;E</div>
            </div>

            <div className="pointer-events-none relative z-[6] max-w-3xl">
              <h1 className="font-headline text-[clamp(44px,7vw,104px)] font-medium leading-[0.95] tracking-[-0.04em] text-[#d4d4d8]">
                The Operating System for <span className="lx-serif font-normal text-[var(--lx-accent-ink)]">Human Capability.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[clamp(16px,1.4vw,19px)] leading-relaxed text-[#a1a1a8]">
                Talent is everywhere. Proof of it rarely is. Syrka turns the work people do into evidence the world can trust, from a first assignment to a nation&apos;s plan for its future.
              </p>
              <p className="mt-3 max-w-xl text-[clamp(14px,1.1vw,16px)] leading-relaxed text-[#6f6f76]">
                One record of capability for students, universities, employers and governments.
              </p>
              <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
                <SpecularButton href="#software" size="md" radius={14} blur={14} textColor="#ece8ff" lineColor="#d9d0ff" baseColor="#3a3366" style={GHOST_STYLE}>Explore our software</SpecularButton>
                <SpecularButton href="#closing" size="md" radius={14} textColor="#ffffff" lineColor="#e2dcff" baseColor="#2a1f99" style={DEPLOY_STYLE}>Deploy Syrka →</SpecularButton>
              </div>
            </div>

            <div className="lx-mono pointer-events-none relative z-[6] mt-16 flex justify-between gap-4 text-[var(--lx-dim)]">
              <span>/ Institutional capability infrastructure</span>
              <span className="lx-cursor shrink-0">Scroll to explore</span>
            </div>
          </section>

          {/* ── Capability developed. / directed. / … ────────────── */}
          <section aria-label="What Syrka does" className={`relative ${TONE.graphite}`}>
            <CapabilityScroller
              id="lx-capability"
              intro={
                <>
                  <Eyebrow accent>How Syrka works</Eyebrow>
                  <h2 className="mt-7 font-headline text-[clamp(40px,5.2vw,88px)] font-medium leading-[0.95] tracking-[-0.04em]">
                    Follow what people can do, <span className="lx-serif font-normal text-[var(--lx-accent-ink)]">wherever it goes.</span>
                  </h2>
                  <p className="mt-7 max-w-2xl text-[clamp(18px,1.5vw,23px)] leading-relaxed text-[#b4b4bb]">
                    Most of what a person learns never makes it onto a transcript. Syrka captures it where it happens, has it confirmed by the people who saw it, and lets it travel with them for life.
                  </p>
                  <p className="mt-4 max-w-2xl text-[clamp(15px,1.2vw,18px)] leading-relaxed text-[var(--lx-dim)]">
                    Five connected systems share that one record. A single student project can shape their next course, prove a skill to an employer, and help a ministry see where the country&apos;s talent is heading.
                  </p>
                  <ol className="mt-8 flex flex-wrap gap-2">
                    {SYSTEMS.map((s, i) => (
                      <li key={s.id} className="lx-mono rounded-full border border-[#7a5cff]/30 bg-[#7a5cff]/[0.07] px-4 py-2 text-[#c9bcff]">
                        <span className="mr-2 text-[#7a5cff]">{String(i + 1).padStart(2, '0')}</span>{s.short}
                      </li>
                    ))}
                  </ol>
                </>
              }
              backdrop={<Backdrop seed={5} tone="graphite" />}
              videoSrc={VIDEOS.capability || undefined}
              items={SYSTEMS.map(s => ({ line: s.line, product: s.name.toUpperCase(), short: SHORT[s.id], subtitle: s.subtitle, audience: s.audience, reach: REACH[s.id], description: s.description }))}
            />
          </section>
        </div>

        {/* ── The five systems: spec sheet, on paper for contrast ── */}
        <section id="software" className="lx-tone-paper relative isolate scroll-mt-20 pt-28 md:pt-36">
          <Backdrop seed={3} tone="paper" />
          <div className="relative px-4 md:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
              <div>
                <Eyebrow accent>The five systems</Eyebrow>
                <h2 className="mt-7 font-headline text-[clamp(44px,6vw,104px)] font-medium leading-[0.95] tracking-[-0.04em]">
                  Five systems, <span className="lx-serif font-normal text-[#4b3bd6]">one record.</span>
                </h2>
                <p className="mt-6 max-w-xl text-[clamp(17px,1.4vw,21px)] leading-relaxed text-[var(--lx-dim)]">
                  Each system does one job. All of them read from and write to the same capability record.
                </p>
              </div>
              <SpecStats
                stats={[
                  { value: SYSTEMS.filter(s => SPEC[s.id].live).length, label: 'Live today' },
                  { value: SYSTEMS.filter(s => !SPEC[s.id].live).length, label: 'In development' },
                  { value: 1, label: 'Shared record' },
                ]}
              />
            </div>

            <div className="mt-16">
              <SpecTable rows={SYSTEMS.map(s => ({ id: s.id, name: s.name, subtitle: s.subtitle, link: s.link, ...SPEC[s.id] }))} />
            </div>
          </div>

          <div className="relative mt-24 pb-16">
            <ScrollMarquee
              rows={[
                { direction: -1, className: 'lx-serif text-[14vw] leading-[0.95] text-[#4b3bd6] md:text-[9vw]', content: <>Evidence · Capability · Odyssey ·</> },
                { direction: 1, className: 'lx-giant text-[14vw] md:text-[9vw]', content: <>Career Passport · Praxis · Maxima ·</> },
              ]}
            />
          </div>
        </section>

        {/* ── The capability graph: centred, one pinned screen per step ── */}
        <section id="architecture" aria-label="The capability graph" className="relative bg-[var(--lx-bg)]">
          <GraphStage slides={GRAPH_SLIDES} nodes={GRAPH_NODES} boundaryAfter={3} backdrop={<Backdrop seed={7} />} videos={VIDEOS.graph} stepBackgrounds={{ PASSPORT: <PassportCard burst={false} /> }} />
        </section>

        {/* ── Marquee band: the record's journey (dark, textured like the sections around it) ── */}
        <section aria-hidden="true" className="relative isolate overflow-hidden bg-[var(--lx-bg)] py-16 md:py-24">
          <Backdrop seed={21} />
          <ScrollMarquee
            className="relative"
            rows={[
              { direction: -1, speed: 1.4, className: 'lx-giant lx-outline text-[16vw] leading-[0.9] md:text-[11vw]', content: <>Proof, not promises ·</> },
              { direction: 1, speed: 1.1, className: 'lx-giant lx-grad-text text-[16vw] leading-[0.9] md:text-[11vw]', content: <>Evidence → Capability → Direction → Work → Nation →</> },
              { direction: -1, speed: 0.8, className: 'lx-serif text-[9vw] leading-[1.05] text-[#6f6890] md:text-[5vw]', content: <>one record for life · owned by the person · reviewed by the people who taught them ·</> },
            ]}
          />
        </section>

        {/* ── Who it is for: one pinned screen per audience ───── */}
        <section id="domains" aria-label="Who Syrka is for" className="relative" style={{ background: 'linear-gradient(180deg, var(--lx-bg) 0%, #0b0a12 100%)' }}>
          <AudienceSlides slides={AUDIENCE_SLIDES} panels={AUDIENCE_PANELS} backdrop={<Backdrop seed={70} />} videoSrc={VIDEOS.audience || undefined} />
        </section>

        {/* ── Trust & governance, on paper ────────────────────── */}
        <section id="trust" className="lx-tone-paper relative isolate scroll-mt-20 px-4 py-28 md:px-8 md:py-36">
          <Backdrop seed={9} tone="paper" />
          <div className="relative grid gap-14 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <Eyebrow accent>Trust &amp; governance</Eyebrow>
              <h2 className="mt-7 font-headline text-[clamp(40px,5.2vw,88px)] font-medium leading-[0.95] tracking-[-0.04em]">
                Built to be <span className="lx-serif font-normal text-[#4b3bd6]">trusted.</span>
              </h2>
              <p className="mt-6 max-w-lg text-[clamp(17px,1.4vw,21px)] leading-relaxed text-[var(--lx-dim)]">
                Syrka holds records that shape people&apos;s education and careers. These rules are part of how it is built, not a policy added afterwards.
              </p>
            </div>
            <ol className="grid gap-2 sm:grid-cols-2">
              {TRUST.map((t, i) => (
                <li key={t} className="rounded-2xl border border-black/[0.08] bg-white/60 p-5 transition-colors hover:border-[#5b4bd6]/40">
                  <span className="lx-mono text-[#5b4bd6]">{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-3 text-[16px] leading-snug text-[#1d1b26]">{t}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Marquee band: who it is for (paper, closing out the Trust section above) ── */}
        <section aria-hidden="true" className="lx-tone-paper relative isolate overflow-hidden pb-20 pt-4 md:pb-28">
          <Backdrop seed={9} tone="paper" />
          <ScrollMarquee
            className="relative"
            rows={[
              { direction: 1, speed: 1.3, className: 'lx-serif text-[14vw] leading-[1] text-[#4b3bd6] md:text-[8vw]', content: <>Universities · Employers · Ministries · Learners ·</> },
              { direction: -1, speed: 1.6, className: 'lx-giant lx-outline-dark text-[14vw] leading-[0.95] md:text-[8vw]', content: <>Built to be trusted ·</> },
            ]}
          />
        </section>

        {/* ── Closing ──────────────────────────────────────────── */}
        <section id="closing" className="relative isolate scroll-mt-20 overflow-hidden bg-[var(--lx-bg)] px-4 pb-20 pt-28 md:px-8 md:pt-40">
          <Backdrop seed={11} />
          {VIDEOS.closing && (
            <>
              <PixelVideo src={VIDEOS.closing} className="opacity-25" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[var(--lx-bg)] via-transparent to-[var(--lx-bg)]" />
            </>
          )}
          <div className="relative">
            <div className="lx-mono flex flex-wrap gap-x-8 gap-y-2">
              {SYSTEMS.map(s => <a key={s.id} href={`#${s.id}`} className="text-[#8f84c9] no-underline hover:text-[var(--lx-ink)]">{s.short}</a>)}
            </div>
            <h2 className="lx-giant mt-10 text-[clamp(52px,10vw,176px)]">
              Build the capability your future <span className="lx-serif normal-case text-[var(--lx-accent-ink)]">requires.</span>
            </h2>
            <p className="mt-8 max-w-xl text-[clamp(17px,1.4vw,21px)] leading-relaxed text-[var(--lx-dim)]">
              Bring Syrka to your university, company or ministry, and start building one record of what your people can do.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <SpecularButton href={SIGN_IN_HREF} size="md" radius={14} textColor="#ffffff" lineColor="#e2dcff" baseColor="#2a1f99" style={DEPLOY_STYLE}>Deploy Syrka →</SpecularButton>
              <SpecularButton href={CAMPUS_HREF} size="md" radius={14} blur={14} textColor="#ece8ff" lineColor="#d9d0ff" baseColor="#3a3366" style={GHOST_STYLE}>Enter Syrka Campus</SpecularButton>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="relative isolate bg-[var(--lx-bg)] px-4 pb-6 pt-10 md:px-8">
          <Backdrop seed={13} />
          <div className="relative">
            <AsciiWordmark text="SYRKA" />
            <div className="mt-12 grid gap-10 border-t border-[var(--lx-line)] pt-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div>
                <SyrkaLogo className="h-6 w-auto" />
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[var(--lx-dim)]">
                  The operating system for human capability, from a first assignment to national strategy.
                </p>
              </div>
              <nav aria-label="Software" className="lx-mono flex flex-col gap-1">
                <span className="mb-2 text-[var(--lx-dim)]"><span className="text-[var(--lx-accent-ink)]">●</span> Software</span>
                {SYSTEMS.map(s => <a key={s.id} href={`#${s.id}`} className={footerLink}>&gt; {s.name}</a>)}
              </nav>
              <nav aria-label="Company" className="lx-mono flex flex-col gap-1">
                <span className="mb-2 text-[var(--lx-dim)]"><span className="text-[var(--lx-accent-ink)]">●</span> Company</span>
                <a href="#trust" className={footerLink}>&gt; Trust &amp; governance</a>
                <a href={SIGN_IN_HREF} className={footerLink}>&gt; Sign in</a>
              </nav>
              <nav aria-label="Platform" className="lx-mono flex flex-col gap-1">
                <span className="mb-2 text-[var(--lx-dim)]"><span className="text-[var(--lx-accent-ink)]">●</span> Platform</span>
                <Link href="/saudi/ministry" className={footerLink}>&gt; Intelligence dashboards</Link>
                <Link href="/intelligence" className={footerLink}>&gt; Intelligence feed</Link>
                <Link href="/model-cards" className={footerLink}>&gt; Model governance</Link>
              </nav>
            </div>
            <div className="lx-mono mt-12 flex justify-between gap-4 border-t border-[var(--lx-line)] pt-4 text-[var(--lx-dim)]">
              <span>Syrka. Institutional capability infrastructure.</span>
              <a href="#top" className="shrink-0 text-[var(--lx-dim)] no-underline hover:text-[var(--lx-ink)]">:/ Back to top</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
