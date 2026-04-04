export interface NationalVision {
  id: string
  country: string
  slug: string
  vision_name: string
  target_year: number
  description: string | null
  accent_color: string | null
  created_at: string
}

export interface Sector {
  id: string
  vision_id: string
  name: string
  current_workforce: number
  target_workforce: number
  current_year: number
  target_year: number
  priority_score: number | null
  description: string | null
  icon: string | null
  national_visions?: NationalVision
}

export interface Skill {
  id: string
  vision_id: string
  sector_id: string
  name: string
  category: string | null
  current_supply: number
  projected_demand_target_year: number
  annual_growth_rate: number | null
  gap_score: number | null
  criticality: 'critical' | 'high' | 'medium' | 'low' | null
}

export interface Institution {
  id: string
  vision_id: string
  name: string
  type: 'university' | 'polytechnic' | 'vocational' | 'online' | null
  student_count: number | null
  annual_graduate_count: number | null
  location: string | null
  established_year: number | null
  national_ranking: number | null
  national_visions?: NationalVision
}

export interface Programme {
  id: string
  institution_id: string
  name: string
  level: 'certificate' | 'diploma' | 'bachelor' | 'master' | 'phd' | null
  duration_years: number | null
  annual_intake: number | null
  annual_graduates: number | null
  overall_alignment_score: number | null
  employment_rate_6months: number | null
  avg_starting_salary: number | null
  institutions?: Institution
}

export interface ProgrammeSkill {
  programme_id: string
  skill_id: string
  proficiency_level: 'awareness' | 'working' | 'practitioner' | 'expert' | null
}

export interface Course {
  id: string
  programme_id: string
  name: string
  code: string | null
  credits: number | null
  year_of_study: number | null
  alignment_score: number | null
  last_updated: number | null
  description: string | null
}

export interface CourseSkill {
  course_id: string
  skill_id: string
  coverage_level: 'introduced' | 'developed' | 'mastered' | null
}

export interface Employer {
  id: string
  vision_id: string
  sector_id: string | null
  name: string
  size: 'sme' | 'large' | 'enterprise' | 'multinational' | null
  open_roles: number | null
  graduate_satisfaction_score: number | null
  avg_time_to_fill_days: number | null
  is_vision_partner: boolean
  sectors?: Sector
}

export interface EmployerSkill {
  employer_id: string
  skill_id: string
  demand_level: 'low' | 'medium' | 'high' | 'critical' | null
  open_positions: number | null
  urgency_months: number | null
}

export interface Student {
  id: string
  institution_id: string | null
  programme_id: string | null
  year_of_study: number | null
  vision_alignment_score: number | null
  employment_readiness_score: number | null
  nationality: string | null
  cohort_year: number | null
}

export interface StudentSkill {
  student_id: string
  skill_id: string
  proficiency: number | null
  assessed_at: string
}

export interface Scenario {
  id: string
  vision_id: string | null
  name: string
  sector_id: string | null
  intervention_type: string | null
  parameters: Record<string, unknown>
  projected_outcomes: Record<string, unknown> | null
  ai_analysis: string | null
  gap_closure_percentage: number | null
  cost_estimate_usd: number | null
  roi_5year: number | null
  created_at: string
}

export interface TrajectoryPoint {
  id: string
  vision_id: string | null
  sector_id: string | null
  year: number
  current_trajectory: number | null
  vision_target: number | null
  with_intervention: number | null
  data_type: 'historical' | 'projected' | null
}

export interface GapAnalysisResult {
  executive_summary: string
  severity_rating: 'critical' | 'high' | 'medium' | 'low'
  gap_percentage: number
  on_track: boolean
  projected_gap_at_target_year: number
  key_risks: string[]
  intervention_options: InterventionOption[]
  recommended_intervention: string
  policy_note: string
}

export interface InterventionOption {
  name: string
  type: 'education_reform' | 'bootcamp' | 'immigration' | 'reskilling' | 'incentive'
  description: string
  estimated_annual_output: number
  implementation_years: number
  cost_estimate_usd_millions: number
  gap_closure_percentage: number
  confidence: 'high' | 'medium' | 'low'
}

export interface ScenarioResult {
  trajectory: { year: number; gap_remaining: number; cumulative_workers_produced: number }[]
  gap_closure_percentage: number
  break_even_year: number | null
  roi_5year: number
  residual_gap_at_target: number
  risks: string[]
  verdict: 'closes_gap' | 'partially_closes' | 'insufficient'
  minister_summary: string
}

export interface CurriculumAnalysisResult {
  overall_assessment: string
  current_score: number
  projected_score_after_changes: number
  course_scores: {
    course_code: string
    course_name: string
    current_score: number
    issue: string | null
    recommendation: string
  }[]
  new_modules_recommended: {
    name: string
    rationale: string
    target_skills: string[]
    estimated_demand_uplift: string
    replaces: string | null
  }[]
  quick_wins: string[]
  implementation_priority: 'high' | 'medium' | 'low'
  employer_readiness_impact: string
}

// Sprint 1: International data types

export interface InternationalStat {
  id: string
  country_code: string
  source: string
  indicator_code: string
  indicator_name: string
  year: number
  value: number | null
  unit: string | null
  fetched_at: string
}

export interface CourseSkillMapping {
  id: string
  course_id: string
  esco_skill_uri: string
  esco_skill_label: string
  relevance_score: number | null
  mapped_at: string
}

export interface UniversityRanking {
  id: string
  institution_id: string | null
  institution_name: string
  ranking_system: string
  year: number
  overall_rank: string | null
  overall_score: number | null
  ar_score: number | null
  ar_rank: string | null
  er_score: number | null
  er_rank: string | null
  fsr_score: number | null
  fsr_rank: string | null
  cpf_score: number | null
  cpf_rank: string | null
  ifr_score: number | null
  ifr_rank: string | null
  isr_score: number | null
  isr_rank: string | null
  isd_score: number | null
  isd_rank: string | null
  irn_score: number | null
  irn_rank: string | null
  eo_score: number | null
  eo_rank: string | null
  sus_score: number | null
  sus_rank: string | null
  location_code: string | null
  country: string | null
}

export interface PeerGroup {
  id: string
  country_code: string
  peer_country_codes: string[]
  similarity_basis: string | null
  created_at: string
}

export type UserRole = 'ministry' | 'university' | 'employer' | 'student'

export interface CountryConfig {
  slug: string
  name: string
  visionName: string
  targetYear: number
  accentColor: string
}
