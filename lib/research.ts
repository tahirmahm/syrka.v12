import { getAllModules } from './degree-config'
import type { Module } from './degree-config'

export interface ResearchPaper {
  title: string
  abstract?: string
  authors: string[]
  published_date: string
  doi?: string
  arxiv_id?: string
  semantic_scholar_id?: string
  citation_count: number
  influence_score?: number
  source: 'arxiv' | 'semantic_scholar' | 'openalex'
  url: string
}

export interface PaperWithRelevance extends ResearchPaper {
  relevance_score: number
  matched_skills: string[]
  module_code: string
}

export function buildQueryForModule(mod: Module): string {
  const keyTerms = mod.skills
    .slice(0, 5)
    .map(s => s.replace(/\//g, ' '))
    .join(' OR ')
  return keyTerms
}

export function buildArxivQuery(mod: Module): string {
  const terms = mod.topics.slice(0, 3).map(t => `ti:"${t}"`).join('+OR+')
  return terms || `ti:"${mod.name}"`
}

export function getActiveModules(): Module[] {
  return getAllModules().filter(m =>
    m.status !== 'skipped' && m.status !== 'completed'
  )
}

export function getAllTrackableModules(): Module[] {
  return getAllModules().filter(m => m.status !== 'skipped')
}
