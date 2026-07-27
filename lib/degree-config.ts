export type ModuleStatus = 'completed' | 'ready' | 'active' | 'blocked' | 'locked' | 'skipped'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ROILevel = 'low' | 'medium' | 'high' | 'extreme'
export type MITMatch = '⭐⭐⭐⭐⭐' | '⭐⭐⭐⭐' | '⭐⭐⭐' | 'N/A'

export interface MITEquiv {
  course_name: string
  number: string
  match: MITMatch
  url: string | null
  note?: string
}

export interface Module {
  code: string
  name: string
  credits: number
  stage: number
  status: ModuleStatus
  prerequisites: string[]
  career_contribution: number
  skills: string[]
  topics: string[]
  description: string
  mit: MITEquiv | null
  risk?: RiskLevel
  roi?: ROILevel
  blocker?: string
  failure_probability?: number
  system_directive?: boolean
  directive_reason?: string
  priority?: number
}

export interface Stage {
  stage: number
  name: string
  label: string
  credits: number
  status: 'completed' | 'active' | 'locked'
  focus: string
  modules: Module[]
}

export const OU_R88 = {
  name: 'BSc (Honours) Computer Science with Artificial Intelligence',
  code: 'R88',
  institution: 'The Open University',
  total_credits: 360,
  credits_per_stage: 120,
  duration_full_time: '3 years',
  delivery: 'Distance learning',

  stages: [
    {
      stage: 1,
      name: 'Foundation',
      label: 'FOUNDATION',
      credits: 120,
      status: 'completed' as const,
      focus: 'Computing fundamentals, essential mathematics, introductory programming, digital technologies and problem solving.',
      modules: [
        {
          code: 'TM111',
          name: 'Introduction to computing and information technology 1',
          credits: 30,
          stage: 1,
          status: 'completed' as const,
          prerequisites: [],
          career_contribution: 3,
          priority: 4,
          risk: 'low' as RiskLevel,
          roi: 'medium' as ROILevel,
          description: 'Introductory OU computing module covering digital technologies, data, web technologies, problem solving, graphical programming, networks, IoT and the social context of computing.',
          topics: ['digital systems', 'data representation', 'databases', 'web pages', 'interfaces', 'graphical programming', 'testing and debugging', 'networks', 'internet', 'IoT', 'online interaction'],
          skills: ['digital literacy', 'information literacy', 'introductory programming', 'testing', 'debugging', 'network awareness', 'IoT awareness', 'problem solving', 'study skills'],
          mit: {
            course_name: 'Introduction to CS and Programming using Python',
            number: '6.100L',
            match: '⭐⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/',
            note: 'Both target students with no prior programming experience. Direct topic overlap.',
          },
        },
        {
          code: 'TM112',
          name: 'Introduction to computing and information technology 2',
          credits: 30,
          stage: 1,
          status: 'completed' as const,
          prerequisites: ['TM111'],
          career_contribution: 4,
          priority: 4,
          risk: 'low' as RiskLevel,
          roi: 'medium' as ROILevel,
          description: 'Extends foundational programming and computing knowledge from TM111. Covers further computing concepts, introductory software development, and problem solving.',
          topics: ['further computing concepts', 'introductory software development', 'problem solving', 'foundational computer science'],
          skills: ['foundational computing', 'programming progression', 'problem solving', 'preparation for Level 2 study'],
          mit: {
            course_name: 'Introduction to Computational Thinking and Data Science',
            number: '6.0002',
            match: '⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/6-0002-introduction-to-computational-thinking-and-data-science-fall-2016/',
            note: 'Explicit continuation of 6.0001, covering computational thinking and data science foundations.',
          },
        },
        {
          code: 'MST124',
          name: 'Essential mathematics 1',
          credits: 30,
          stage: 1,
          status: 'completed' as const,
          prerequisites: [],
          career_contribution: 5,
          priority: 4,
          risk: 'low' as RiskLevel,
          roi: 'high' as ROILevel,
          description: 'Core mathematical knowledge for technical and AI-related study. Algebra, functions, calculus, mathematical methods for STEM.',
          topics: ['essential mathematics', 'algebra', 'functions', 'calculus', 'mathematical methods for STEM'],
          skills: ['algebra', 'calculus', 'mathematical methods', 'quantitative reasoning', 'symbolic manipulation'],
          mit: {
            course_name: 'Mathematics for Computer Science',
            number: '6.042J',
            match: '⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/',
            note: 'Covers discrete mathematics, probability, and logic for CS students.',
          },
        },
        {
          code: 'MU123',
          name: 'Discovering mathematics',
          credits: 30,
          stage: 1,
          status: 'skipped' as const,
          prerequisites: [],
          career_contribution: 2,
          priority: 4,
          description: 'Alternative Stage 1 mathematics option. Introductory mathematics, numeracy, algebra, graphs, problem solving.',
          topics: ['introductory mathematics', 'numeracy', 'algebra', 'graphs', 'problem solving'],
          skills: ['core numeracy', 'introductory algebra', 'graph interpretation', 'mathematical confidence', 'quantitative problem solving'],
          mit: {
            course_name: 'Single Variable Calculus',
            number: '18.01SC',
            match: '⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/',
            note: 'Gentler maths path. Less CS-specific but covers similar introductory calculus ground.',
          },
        },
      ],
    },

    {
      stage: 2,
      name: 'Algorithmic Core',
      label: 'ALGORITHMIC CORE',
      credits: 120,
      status: 'active' as const,
      focus: 'Further programming, data structures, algorithms, applied mathematics, statistical reasoning and machine learning foundations.',
      modules: [
        {
          code: 'TM129',
          name: 'Technologies in practice',
          credits: 30,
          stage: 2,
          status: 'ready' as const,
          prerequisites: ['TM111', 'TM112'],
          career_contribution: 7,
          priority: 2,
          risk: 'low' as RiskLevel,
          roi: 'high' as ROILevel,
          description: 'Practical technology and software/system development. Supports progression into advanced computing and AI study.',
          topics: ['technologies in practice', 'software development', 'applied computing', 'systems work'],
          skills: ['practical computing', 'software/system development', 'technical implementation', 'applied problem solving'],
          mit: {
            course_name: 'Software Construction',
            number: '6.005',
            match: '⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/6-005-elements-of-software-construction-fall-2011/',
            note: 'Covers testing, debugging, object-oriented design, and abstraction — mirrors TM129 practical focus.',
          },
        },
        {
          code: 'M249',
          name: 'Practical modern statistics',
          credits: 30,
          stage: 2,
          status: 'ready' as const,
          prerequisites: ['MST124'],
          career_contribution: 5,
          priority: 1,
          risk: 'low' as RiskLevel,
          roi: 'extreme' as ROILevel,
          system_directive: true,
          directive_reason: 'M249 is the critical prerequisite for TM258 (highest-ROI Stage 2 module). Without M249, statistical models project 78% failure probability on TM258 algorithmic units. Initialize M249 first.',
          description: 'Modern statistical techniques for data analysis and AI-related study. Covers probability, statistical inference, regression.',
          topics: ['modern statistics', 'probability', 'statistical inference', 'data analysis', 'regression'],
          skills: ['statistics', 'probability', 'inference', 'data interpretation', 'quantitative analysis', 'evidence-based modelling'],
          mit: {
            course_name: 'Statistics for Applications',
            number: '18.650',
            match: '⭐⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/',
            note: 'Exact match. Full course covers parametric inference, regression, and statistical methods at same level.',
          },
        },
        {
          code: 'M248',
          name: 'Analysing data',
          credits: 30,
          stage: 2,
          status: 'ready' as const,
          prerequisites: ['MST124'],
          career_contribution: 5,
          priority: 3,
          risk: 'low' as RiskLevel,
          roi: 'high' as ROILevel,
          description: 'Applied data-focused mathematics/statistics. Data analysis, mathematical modelling, applied quantitative methods.',
          topics: ['data analysis', 'mathematical modelling', 'applied quantitative methods', 'interpreting data'],
          skills: ['analytical reasoning', 'data interpretation', 'mathematical modelling', 'preparation for advanced AI/data modules'],
          mit: {
            course_name: 'Statistics for Applications (first half)',
            number: '18.650',
            match: '⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/',
            note: 'Strong match for the first half of 18.650. M248 and M249 together map to the full course.',
          },
        },
        {
          code: 'TM258',
          name: 'Machine learning and artificial intelligence',
          credits: 30,
          stage: 2,
          status: 'blocked' as const,
          prerequisites: ['TM112', 'M249', 'M248'],
          career_contribution: 12,
          priority: 1,
          risk: 'high' as RiskLevel,
          roi: 'extreme' as ROILevel,
          blocker: 'M249',
          failure_probability: 78,
          description: 'Core Stage 2 AI module. Machine learning and AI concepts: classification, regression, model building, introductory AI methods.',
          topics: ['machine learning', 'artificial intelligence', 'classification', 'regression', 'model building', 'introductory AI methods'],
          skills: ['machine learning', 'artificial intelligence', 'classification', 'regression', 'model building', 'model evaluation'],
          mit: {
            course_name: 'Introduction to Machine Learning',
            number: '6.036',
            match: '⭐⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-fall-2020/',
            note: 'Exact match. Both cover supervised/unsupervised learning, classification, regression at undergraduate level.',
          },
        },
      ],
    },

    {
      stage: 3,
      name: 'Advanced Systems',
      label: 'ADVANCED SYSTEMS',
      credits: 120,
      status: 'locked' as const,
      focus: 'Advanced AI, machine learning in practice, ethics, and an independent computing project.',
      modules: [
        {
          code: 'TM358',
          name: 'Machine learning and artificial intelligence in practice',
          credits: 30,
          stage: 3,
          status: 'locked' as const,
          prerequisites: ['TM258', 'M249', 'M248', 'TM129'],
          career_contribution: 18,
          priority: 1,
          risk: 'medium' as RiskLevel,
          roi: 'extreme' as ROILevel,
          description: 'Advanced Stage 3 AI module. Applying ML and AI methods in practical, real-world settings.',
          topics: ['advanced machine learning', 'applied artificial intelligence', 'practical AI systems', 'deployment-oriented AI work'],
          skills: ['building AI systems', 'applying ML in practice', 'evaluation of models', 'technical problem solving'],
          mit: {
            course_name: 'Artificial Intelligence + ML for Healthcare',
            number: '6.034 + 6.S897',
            match: '⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/',
            note: 'Best covered by combining 6.034 (AI reasoning/representation) and 6.S897 (applied ML). No single OCW course covers TM358\'s breadth alone.',
          },
        },
        {
          code: 'TM351',
          name: 'Data management and analysis',
          credits: 30,
          stage: 3,
          status: 'locked' as const,
          prerequisites: ['M248', 'M249', 'TM129'],
          career_contribution: 8,
          priority: 2,
          risk: 'low' as RiskLevel,
          roi: 'high' as ROILevel,
          description: 'Advanced data management and analysis in complex computing contexts.',
          topics: ['data management', 'data analysis', 'handling data', 'data systems'],
          skills: ['data management', 'analytical processing', 'working with datasets', 'data-focused technical practice'],
          mit: {
            course_name: 'Database Systems',
            number: '6.830',
            match: '⭐⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/6-830-database-systems-fall-2010/',
            note: 'Covers relational models, query optimization, transactions, and data management foundations.',
          },
        },
        {
          code: 'TM359',
          name: 'Systems thinking: managing complexity',
          credits: 30,
          stage: 3,
          status: 'locked' as const,
          prerequisites: ['TM129'],
          career_contribution: 5,
          priority: 3,
          risk: 'low' as RiskLevel,
          roi: 'medium' as ROILevel,
          description: 'Systems thinking, complexity, and management of interconnected problems. Relevant to ethical and real-world AI deployment.',
          topics: ['systems thinking', 'complexity', 'managing interconnected systems', 'real-world problem framing'],
          skills: ['systems thinking', 'complexity management', 'holistic analysis', 'decision making'],
          mit: {
            course_name: 'Systems Thinking & Modeling for a Complex World',
            number: 'RES-15-004',
            match: '⭐⭐⭐' as MITMatch,
            url: 'https://ocw.mit.edu/courses/res-15-004-system-dynamics-systems-thinking-and-modeling-for-a-complex-world-january-iap-2020/',
            note: 'Partial match. MIT coverage is lighter in depth but overlapping themes of complexity and systemic reasoning.',
          },
        },
        {
          code: 'TM470',
          name: 'The computing and IT project',
          credits: 30,
          stage: 3,
          status: 'locked' as const,
          prerequisites: ['TM129', 'TM258'],
          career_contribution: 15,
          priority: 4,
          risk: 'medium' as RiskLevel,
          roi: 'extreme' as ROILevel,
          description: 'Capstone. Students complete an independent computing and IT project drawing together knowledge from across the degree.',
          topics: ['project definition', 'independent investigation', 'design and implementation', 'evaluation', 'report writing', 'professional practice'],
          skills: ['independent research', 'project planning', 'implementation', 'testing', 'evaluation', 'technical writing', 'portfolio development'],
          mit: null,
        },
      ],
    },
  ] as Stage[],
}

export function getAllModules(): Module[] {
  return OU_R88.stages.flatMap(s => s.modules)
}

export function getModule(code: string): Module | undefined {
  return getAllModules().find(m => m.code === code)
}

export function getStageForModule(code: string): Stage | undefined {
  return OU_R88.stages.find(s => s.modules.some(m => m.code === code))
}

export function getStageModules(stage: number): Module[] {
  return OU_R88.stages.find(s => s.stage === stage)?.modules ?? []
}

export function totalCareerAlignment(statuses: ModuleStatus[]): number {
  return getAllModules()
    .filter(m => statuses.includes(m.status))
    .reduce((sum, m) => sum + m.career_contribution, 0)
}

export function getSystemDirectiveModule(): Module | undefined {
  return getAllModules().find(m => m.system_directive)
}

export function getBlockedModules(): Module[] {
  return getAllModules().filter(m => m.status === 'blocked')
}

export function getReadyModules(): Module[] {
  return getAllModules().filter(m => m.status === 'ready')
}

export const TARGET_VECTOR = {
  role: 'Machine Learning Engineer',
  alignment_pct: 41,
  eta: 'Q4 2026',
  modules_remaining: 7,
  uk_median_salary: '£62,000',
  demand: 'High',
}

export const SYSTEM_DIRECTIVE = {
  title: 'INITIALIZE M249 EXECUTION',
  module_code: 'M249',
  reasoning: 'TM258 dependency failure detected. M249 mastery is required to mitigate 78% failure probability in TM258 algorithmic units. Concurrent execution with TM129 is recommended for optimal velocity and −2 month ETA adjustment.',
  impact: {
    eta_delta: '−2 Months',
    career_alignment_delta: '+17% Total Alignment',
    risk_mitigation: 'High',
  },
  unblocks: 'TM258',
}

export const CAREER_VECTORS = [
  { role: 'ML Engineer',           alignment: 41, salary: '£62,000', demand: 'High',      primary: true  },
  { role: 'Data Scientist',        alignment: 38, salary: '£52,000', demand: 'Medium',    primary: false },
  { role: 'Software Engineer',     alignment: 52, salary: '£55,000', demand: 'Very High', primary: false },
  { role: 'AI Research Scientist', alignment: 18, salary: '£70,000+',demand: 'Low',       primary: false },
]
