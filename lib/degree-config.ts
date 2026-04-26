export type ModuleStatus = 'completed' | 'ready' | 'active' | 'blocked' | 'locked'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ROILevel = 'low' | 'medium' | 'high' | 'extreme'

export interface Module {
  code: string
  name: string
  credits: number
  status: ModuleStatus
  prerequisites: string[]
  career_contribution: number
  mit_equiv: string | null
  risk?: RiskLevel
  roi?: ROILevel
  blocker?: string
  failure_probability?: number
  system_directive?: boolean
  directive_reason?: string
}

export interface Stage {
  stage: number
  name: string
  credits: number
  status: 'completed' | 'active' | 'locked'
  modules: Module[]
}

export const OU_R88: { name: string; institution: string; total_credits: number; stages: Stage[] } = {
  name: 'BSc (Honours) Computer Science with Artificial Intelligence',
  institution: 'The Open University',
  total_credits: 360,
  stages: [
    {
      stage: 1,
      name: 'Foundation',
      credits: 120,
      status: 'completed',
      modules: [
        { code: 'TM111', name: 'Introduction to Computing & IT 1', credits: 30, status: 'completed', prerequisites: [], career_contribution: 3, mit_equiv: '6.100L' },
        { code: 'TM112', name: 'Introduction to Computing & IT 2', credits: 30, status: 'completed', prerequisites: ['TM111'], career_contribution: 4, mit_equiv: '6.0002' },
        { code: 'MST124', name: 'Essential Mathematics 1', credits: 30, status: 'completed', prerequisites: [], career_contribution: 5, mit_equiv: '6.042J' },
        { code: 'MU123', name: 'Discovering Mathematics', credits: 30, status: 'completed', prerequisites: [], career_contribution: 2, mit_equiv: '18.01SC' },
      ],
    },
    {
      stage: 2,
      name: 'Algorithmic Core',
      credits: 120,
      status: 'active',
      modules: [
        {
          code: 'TM129', name: 'Technologies in Practice',
          credits: 30, status: 'ready', prerequisites: ['TM111', 'TM112'],
          career_contribution: 7, mit_equiv: '6.005', risk: 'low', roi: 'high',
        },
        {
          code: 'M249', name: 'Practical Modern Statistics',
          credits: 30, status: 'ready', prerequisites: ['MST124'],
          career_contribution: 5, mit_equiv: '18.650', risk: 'low', roi: 'extreme',
          system_directive: true,
          directive_reason: 'M249 completion unblocks TM258 — the highest-ROI Stage 2 module. Without it, statistical models project 78% failure probability in TM258 algorithmic units.',
        },
        {
          code: 'M248', name: 'Analysing Data',
          credits: 30, status: 'ready', prerequisites: ['MST124'],
          career_contribution: 5, mit_equiv: '18.650', risk: 'low', roi: 'high',
        },
        {
          code: 'TM258', name: 'Machine Learning & Artificial Intelligence',
          credits: 30, status: 'blocked', prerequisites: ['TM112', 'M249', 'M248'],
          career_contribution: 12, mit_equiv: '6.036', risk: 'high', roi: 'extreme',
          blocker: 'M249', failure_probability: 78,
        },
      ],
    },
    {
      stage: 3,
      name: 'Advanced Systems',
      credits: 120,
      status: 'locked',
      modules: [
        { code: 'TM358', name: 'ML & AI in Practice', credits: 30, status: 'locked', prerequisites: ['TM258', 'M249', 'M248', 'TM129'], career_contribution: 18, mit_equiv: '6.034', risk: 'medium', roi: 'extreme' },
        { code: 'TM351', name: 'Data Management & Analysis', credits: 30, status: 'locked', prerequisites: ['M248', 'M249', 'TM129'], career_contribution: 8, mit_equiv: '6.830' },
        { code: 'TM359', name: 'Systems Thinking: Managing Complexity', credits: 30, status: 'locked', prerequisites: ['TM129'], career_contribution: 5, mit_equiv: 'RES-15-004' },
        { code: 'TM470', name: 'The Computing & IT Project', credits: 30, status: 'locked', prerequisites: ['TM129', 'TM258'], career_contribution: 15, mit_equiv: null },
      ],
    },
  ],
}

export function getModule(code: string): Module | undefined {
  for (const stage of OU_R88.stages) {
    const m = stage.modules.find(mod => mod.code === code)
    if (m) return m
  }
}

export function getStageForModule(code: string): Stage | undefined {
  return OU_R88.stages.find(s => s.modules.some(m => m.code === code))
}

export function totalCareerContribution(statuses: ModuleStatus[]): number {
  return OU_R88.stages
    .flatMap(s => s.modules)
    .filter(m => statuses.includes(m.status))
    .reduce((sum, m) => sum + m.career_contribution, 0)
}

export const TOTAL_POSSIBLE_CONTRIBUTION = OU_R88.stages
  .flatMap(s => s.modules)
  .reduce((sum, m) => sum + m.career_contribution, 0)

export const TARGET_VECTOR = {
  role: 'Machine Learning Engineer',
  alignment: 41,
  eta: 'Q4 2026',
  modules_remaining: 4,
}

export const SYSTEM_DIRECTIVE = {
  title: 'INITIALIZE M249 EXECUTION',
  reasoning: 'TM258 dependency failure detected. M249 mastery is required to mitigate 78% failure probability in algorithmic units. Concurrent execution with TM129 recommended for optimal velocity.',
  blocker_module: 'M249',
  unblocks: 'TM258',
}

export const ACQUIRED_SKILLS = [
  { name: 'Digital Literacy', module: 'TM111', mastery: 85 },
  { name: 'Introductory Programming', module: 'TM111', mastery: 70 },
  { name: 'Computational Thinking', module: 'TM112', mastery: 72 },
  { name: 'Mathematical Foundations', module: 'MST124', mastery: 80 },
  { name: 'Algebra & Calculus', module: 'MST124', mastery: 75 },
]

export const CAREER_PATHS = [
  { role: 'ML Engineer', alignment: 41, salary: '£45,000–£85,000', active: true },
  { role: 'Data Scientist', alignment: 38, salary: '£40,000–£75,000', active: false },
  { role: 'Software Engineer', alignment: 52, salary: '£35,000–£70,000', active: false },
  { role: 'AI Research Scientist', alignment: 18, salary: '£50,000–£95,000', active: false },
]
