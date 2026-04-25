'use client'

const MODEL_CARDS = [
  {
    endpoint: '/api/students/job-recommendations',
    model: 'deepseek-chat',
    purpose: 'Recommend 6 real job roles based on student skills, sector-agnostic',
    inputs: ['Student skills array', 'Country'],
    outputs: ['Job title', 'Match %', 'Salary range', 'Search URLs'],
    temperature: 0.5,
    maxTokens: 2000,
    limitations: 'May hallucinate salary ranges in smaller markets. Does not verify employer existence.',
    biasControls: 'Sector-agnostic prompt — no national vision weighting. Pure skill-match scoring.',
    humanInLoop: 'None — recommendations shown directly to student.',
    dataRetention: 'Request/response metadata logged to ai_audit_log. No PII stored.',
  },
  {
    endpoint: '/api/students/evaluate-offer',
    model: 'deepseek-chat',
    purpose: '10-dimension weighted evaluation of a job offer',
    inputs: ['Job title', 'Company', 'Salary offered', 'Student skills', 'Country'],
    outputs: ['Dimension scores', 'Overall weighted score', 'Grade', 'Negotiation points'],
    temperature: 0.4,
    maxTokens: 1500,
    limitations: 'Salary benchmarks may lag behind real-time market. Company reputation scoring is approximate.',
    biasControls: 'Weighted scoring with transparent dimension weights shown to student.',
    humanInLoop: 'Student decides — evaluation is advisory only.',
    dataRetention: 'Overall score and grade logged. Full evaluation not persisted.',
  },
  {
    endpoint: '/api/students/generate-cv-brief',
    model: 'deepseek-chat',
    purpose: 'Generate tailored CV brief with headline, ATS keywords, and cover letter opening',
    inputs: ['Job title', 'Company', 'Description', 'Student skills', 'Country'],
    outputs: ['Headline', 'Skills to highlight/downplay', 'ATS keywords', 'Cover letter opening'],
    temperature: 0.5,
    maxTokens: 1200,
    limitations: 'Cover letter tone may not match all cultures. ATS keyword relevance is model-inferred.',
    biasControls: 'Vision alignment statement contextualised to student country.',
    humanInLoop: 'Student edits CV before submitting — brief is a starting point.',
    dataRetention: 'Headline logged for audit. Full brief not persisted.',
  },
  {
    endpoint: '/api/students/assess-ai-usage',
    model: 'deepseek-chat',
    purpose: 'Evaluate student submissions for AI collaboration sophistication',
    inputs: ['Submission text (max 3000 chars)', 'Assignment brief', 'Student skills'],
    outputs: ['5 dimension scores', 'Overall AI literacy score', 'Grade', 'Feedback'],
    temperature: 0.4,
    maxTokens: 1500,
    limitations: 'Cannot verify claimed AI usage. Assessment is inference-based from text patterns.',
    biasControls: 'Measures AI collaboration skill, NOT penalises AI use. Epistemic transparency is scored.',
    humanInLoop: 'Faculty reviews assessment before it affects grades.',
    dataRetention: 'Overall score and grade logged. Submission text not stored.',
  },
  {
    endpoint: '/api/students/adaptive-path',
    model: 'deepseek-chat',
    purpose: 'Generate personalised 90-day learning path aligned with national vision',
    inputs: ['Skills', 'Completed modules', 'Time available', 'Target role', 'Country'],
    outputs: ['Week ranges with actions', 'Velocity assessment', 'Bottleneck', 'Shortcut'],
    temperature: 0.5,
    maxTokens: 2000,
    limitations: 'Resource links may be stale. Time estimates are approximate.',
    biasControls: 'Velocity assessment uses neutral ahead/on_track/behind framework.',
    humanInLoop: 'Student chooses whether to follow recommendations.',
    dataRetention: 'Velocity and bottleneck logged. Full path not persisted.',
  },
  {
    endpoint: '/api/students/outcomes',
    model: 'deepseek-chat',
    purpose: 'Generate learning signal from application outcome data',
    inputs: ['Job title', 'Company', 'Status', 'Rejection details', 'Skills gaps'],
    outputs: ['Priority skill to learn', 'Resource recommendation', 'Trajectory adjustment'],
    temperature: 0.4,
    maxTokens: 800,
    limitations: 'Learning signal quality depends on student-reported rejection details.',
    biasControls: 'Focuses on actionable skill gaps, not employer blame.',
    humanInLoop: 'Student logs outcomes voluntarily.',
    dataRetention: 'Priority skill logged. Full signal stored with outcome.',
  },
  {
    endpoint: '/api/university/evolve-curriculum',
    model: 'deepseek-chat',
    purpose: 'Generate updated reading recommendations with provenance data',
    inputs: ['Course name', 'Course code', 'Description'],
    outputs: ['3 recommendations with sources', 'Freshness score', 'ESCO skill codes'],
    temperature: 0.6,
    maxTokens: 1000,
    limitations: 'Sources are model-generated — may contain hallucinated DOIs. Faculty verification required.',
    biasControls: 'Freshness scoring penalises stale sources. Provenance verification flag defaults to false.',
    humanInLoop: 'Faculty must approve before recommendations go live.',
    dataRetention: 'Full recommendations and sources stored in curriculum_evolution_log.',
  },
  {
    endpoint: '/api/students/orchestration-score',
    model: 'local-calculation',
    purpose: 'Calculate AI orchestration readiness score from skills portfolio',
    inputs: ['Skills array', 'AI assessment score'],
    outputs: ['Weighted score', 'Breakdown by 4 dimensions', 'Level', 'Next milestone'],
    temperature: null,
    maxTokens: null,
    limitations: 'Static skill lists may miss emerging AI tools. Score is formulaic, not adaptive.',
    biasControls: 'Transparent weight breakdown (30% AI skills, 25% breadth, 30% assessment, 15% vision).',
    humanInLoop: 'None — deterministic calculation.',
    dataRetention: 'Score and level logged to audit.',
  },
]

export default function ModelCardsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <nav className="nav-glass fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-5 ghost-border">
        <a href="/" className="text-xl font-headline font-bold text-primary" style={{ letterSpacing: '0.35em', textDecoration: 'none' }}>SYRKA</a>
        <span className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">Model Governance</span>
      </nav>

      <main className="pt-32 px-8 md:px-16 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <span className="w-8 h-px bg-primary block" />
          <span className="font-label text-[10px] tracking-ultra uppercase text-on-surface-variant">
            AI Transparency
          </span>
        </div>
        <h1 className="text-display-sm font-headline font-bold mb-4">Model Cards</h1>
        <p className="font-body text-on-surface-variant text-lg mb-12 max-w-2xl">
          Every AI model Syrka uses is documented here. We show what each model does, its limitations, and how we guard against bias.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MODEL_CARDS.map((card) => (
            <div key={card.endpoint} className="bg-surface-container-low ghost-border p-6">
              <div className="flex items-center justify-between mb-3">
                <code className="font-mono text-xs text-primary bg-surface-container px-2 py-1">{card.endpoint}</code>
                <span className="font-label text-[9px] uppercase tracking-widest px-2 py-0.5"
                  style={{
                    background: card.model === 'local-calculation' ? 'rgba(76,175,80,0.15)' : 'rgba(33,150,243,0.15)',
                    color: card.model === 'local-calculation' ? '#4CAF50' : '#2196F3',
                  }}>
                  {card.model}
                </span>
              </div>

              <p className="font-body text-sm text-on-surface mb-4">{card.purpose}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Inputs</div>
                  <ul className="space-y-0.5">
                    {card.inputs.map((i) => (
                      <li key={i} className="font-body text-[11px] text-on-surface-variant">{i}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-label text-[9px] uppercase tracking-widest text-outline mb-1">Outputs</div>
                  <ul className="space-y-0.5">
                    {card.outputs.map((o) => (
                      <li key={o} className="font-body text-[11px] text-on-surface-variant">{o}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {card.temperature !== null && (
                <div className="flex gap-4 mb-4">
                  <span className="font-body text-[10px] text-outline">temp: {card.temperature}</span>
                  <span className="font-body text-[10px] text-outline">max_tokens: {card.maxTokens}</span>
                </div>
              )}

              <div className="space-y-2 pt-3" style={{ borderTop: '1px solid rgba(71,71,71,0.15)' }}>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-widest text-outline">Limitations: </span>
                  <span className="font-body text-[11px] text-on-surface-variant">{card.limitations}</span>
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-widest text-outline">Bias Controls: </span>
                  <span className="font-body text-[11px] text-on-surface-variant">{card.biasControls}</span>
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-widest text-outline">Human-in-Loop: </span>
                  <span className="font-body text-[11px] text-on-surface-variant">{card.humanInLoop}</span>
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-widest text-outline">Data Retention: </span>
                  <span className="font-body text-[11px] text-on-surface-variant">{card.dataRetention}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(71,71,71,0.15)' }}>
          <a href="/model-cards/audit" className="btn-primary inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
            View Audit Trail
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
          </a>
        </div>
      </main>
    </div>
  )
}
