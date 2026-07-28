/**
 * LEARN-002 Mermaid-removal directive — deterministic checks proving
 * Mermaid and generic node-edge graphs are gone from Syrka's application
 * code, not merely demoted. Runs unconditionally at import time and
 * throws on any error, mirroring the existing validate-*.ts pattern.
 * Historical documentation (ADRs, the visual-correction README) may
 * still mention Mermaid as a rejected/removed choice — this validator
 * only inspects runtime source under app/, components/, and lib/.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isLearningRenderer, VALID_LEARNING_RENDERERS } from '@/lib/campus-types/learning-renderer'
import { validateSemanticModel } from '@/lib/services/learning/semantic-model-validator'
import { selectRepresentationDeterministic } from '@/lib/services/learning/representation-router'
import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'

const REPO_ROOT = process.cwd()
const RUNTIME_ROOTS = ['app', 'components', 'lib'].map((d) => join(REPO_ROOT, d))
const IMPORT_PATTERN = /from\s+['"]mermaid['"]|require\(\s*['"]mermaid['"]\s*\)|import\(\s*['"]mermaid['"]\s*\)/

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

/** 1/2. package.json carries no mermaid/dompurify dependency. */
function validatePackageJsonClean(): string[] {
  const errors: string[] = []
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  if ('mermaid' in allDeps) errors.push('package.json still declares a "mermaid" dependency')
  if ('dompurify' in allDeps) errors.push('package.json still declares a "dompurify" dependency (was only used to sanitise Mermaid SVG output)')
  return errors
}

/** 3. No runtime source file imports the mermaid package. */
function validateNoRuntimeMermaidImport(): string[] {
  const errors: string[] = []
  for (const root of RUNTIME_ROOTS) {
    for (const file of walk(root)) {
      const content = readFileSync(file, 'utf8')
      if (IMPORT_PATTERN.test(content)) errors.push(`${file.replace(REPO_ROOT + '/', '')} imports the mermaid package`)
    }
  }
  return errors
}

/** 4. The renderer union is exhaustive and contains no mermaid or other generic-graph value. */
function validateRendererUnionClean(): string[] {
  const errors: string[] = []
  if (isLearningRenderer('mermaid')) errors.push('isLearningRenderer accepts "mermaid"')
  const expected = new Set(['syrka_visual', 'custom_interactive', 'desmos', 'three_scene', 'excalidraw', 'structured_text'])
  if (VALID_LEARNING_RENDERERS.length !== expected.size || !VALID_LEARNING_RENDERERS.every((r) => expected.has(r))) {
    errors.push(`LearningRenderer set does not match the exhaustive 6-value set: got [${VALID_LEARNING_RENDERERS.join(', ')}]`)
  }
  return errors
}

/** 5. No provider system prompt offers Mermaid (or any generic graph engine) as a choice to DeepSeek. */
function validateNoMermaidInProviderPrompts(): string[] {
  const errors: string[] = []
  const providerFiles = [
    join(REPO_ROOT, 'lib', 'services', 'learning', 'providers', 'deepseek-teaching-provider.ts'),
    join(REPO_ROOT, 'lib', 'services', 'learning', 'providers', 'semantic-visual-provider.ts'),
  ]
  for (const file of providerFiles) {
    const content = readFileSync(file, 'utf8').toLowerCase()
    if (content.includes('mermaid')) errors.push(`${file.replace(REPO_ROOT + '/', '')} still mentions "mermaid" — DeepSeek must never be offered it as a choice`)
  }
  return errors
}

/** 6. "relates to" (and equivalent generic connectors) are rejected as relationship labels, not accepted as a default. */
function validateGenericRelationshipLabelRejected(): string[] {
  const errors: string[] = []
  const withGenericLabel = {
    schemaVersion: '1.0.0',
    conceptId: 'test-concept',
    centralIdea: 'A test concept for validation only.',
    learningObjective: 'n/a',
    stages: [
      { id: 's0', order: 0, role: 'context', proposition: 'This is a real full sentence proposition for testing.' },
      { id: 's1', order: 1, role: 'outcome', proposition: 'This is a second real full sentence proposition for testing.' },
    ],
    actors: [{ id: 'a0', label: 'Actor A' }, { id: 'a1', label: 'Actor B' }],
    relationships: [{ id: 'r0', fromActorId: 'a0', toActorId: 'a1', kind: 'causes', label: 'relates to' }],
    generatedBy: 'deterministic',
  }
  const result = validateSemanticModel(withGenericLabel)
  if (result.valid) errors.push('validateSemanticModel accepted a "relates to" relationship label')
  return errors
}

/** 7. Isolated keyword fragments (the exact rejected defect) are still rejected as propositions. */
function validateKeywordFragmentRejected(): string[] {
  const errors: string[] = []
  const keywordFragmentModel = {
    schemaVersion: '1.0.0',
    conceptId: 'test-concept',
    centralIdea: 'distinction',
    learningObjective: 'n/a',
    stages: [
      { id: 's0', order: 0, role: 'context', proposition: 'primitive' },
      { id: 's1', order: 1, role: 'outcome', proposition: 'commercial' },
    ],
    actors: [],
    relationships: [],
    generatedBy: 'deterministic',
  }
  const result = validateSemanticModel(keywordFragmentModel)
  if (result.valid) errors.push('validateSemanticModel accepted single-word keyword-fragment propositions')
  return errors
}

/** 8. A hub-and-spoke shape (every relationship from the same actor) is rejected regardless of renderer. */
function validateHubAndSpokeRejected(): string[] {
  const errors: string[] = []
  const hubAndSpoke = {
    schemaVersion: '1.0.0',
    conceptId: 'test-concept',
    centralIdea: 'A test concept for validation only.',
    learningObjective: 'n/a',
    stages: [
      { id: 's0', order: 0, role: 'context', proposition: 'This is a real full sentence proposition for testing.' },
      { id: 's1', order: 1, role: 'outcome', proposition: 'This is a second real full sentence proposition for testing.' },
    ],
    actors: [{ id: 'a0', label: 'Hub' }, { id: 'a1', label: 'Spoke one' }, { id: 'a2', label: 'Spoke two' }, { id: 'a3', label: 'Spoke three' }],
    relationships: [
      { id: 'r0', fromActorId: 'a0', toActorId: 'a1', kind: 'causes', label: 'A genuine grounded relationship statement, not a placeholder.' },
      { id: 'r1', fromActorId: 'a0', toActorId: 'a2', kind: 'causes', label: 'A genuine grounded relationship statement, not a placeholder.' },
      { id: 'r2', fromActorId: 'a0', toActorId: 'a3', kind: 'causes', label: 'A genuine grounded relationship statement, not a placeholder.' },
    ],
    generatedBy: 'deterministic',
  }
  const result = validateSemanticModel(hubAndSpoke)
  if (result.valid) errors.push('validateSemanticModel accepted a hub-and-spoke relationship shape (every relationship from the same origin actor)')
  return errors
}

/** 9. Types of farming routes to a real comparison/classification interactive, never a generated visual. */
function validateFarmingRoutesToCustomInteractive(): string[] {
  const errors: string[] = []
  const view = { subject: 'Geography', chapterId: 'ncert-chapter-geo-4', conceptId: 'ncert-concept-geo-4-2' } as NcertConceptWorkbenchView
  const decision = selectRepresentationDeterministic({
    view,
    sessionState: { hintsUsedCount: 0, attemptsCount: 0, transferAttempted: false, transferSucceeded: false, explainBackGiven: false, missingKeyTerms: [] },
    device: 'desktop',
    scaffoldLevel: 'full_support',
  })
  if (decision.renderer !== 'custom_interactive') errors.push(`Expected "Types of farming" to route to custom_interactive, got "${decision.renderer}"`)
  const componentFile = join(REPO_ROOT, 'components', 'learning', 'visuals', 'FarmingClassificationInteractive.tsx')
  const content = readFileSync(componentFile, 'utf8')
  if (IMPORT_PATTERN.test(content)) errors.push('FarmingClassificationInteractive.tsx imports mermaid')
  if (!content.includes('COMPARISON_ROWS') || !content.includes('SCENARIOS')) errors.push('FarmingClassificationInteractive.tsx is missing the real comparison table or classification exercise')
  return errors
}

/**
 * 10. The renderer decision for a mandatory route can never be overridden by
 * a model call — proven structurally (selectRepresentation's own source
 * never invokes the DeepSeek call function at all), not merely by
 * observing today's output. This is the fix for the confirmed defect
 * where DeepSeek's renderer-choice prompt could replace the authored
 * Geography 3D terrain scene.
 */
function validateMandatoryRendererCannotBeOverridden(): string[] {
  const errors: string[] = []
  const file = join(REPO_ROOT, 'lib', 'services', 'learning', 'providers', 'deepseek-teaching-provider.ts')
  const content = readFileSync(file, 'utf8')
  const selectRepresentationBody = content.slice(content.indexOf('async selectRepresentation'), content.indexOf('async selectRepresentation') + 800)
  if (selectRepresentationBody.includes('callLearningDeepSeek')) {
    errors.push('selectRepresentation() still calls callLearningDeepSeek — a live model can override a mandatory renderer decision (e.g. the Geography 3D terrain scene)')
  }
  // Every branch of the deterministic router must mark its decision mandatory —
  // a decision the router itself considers non-mandatory would be legal to hand
  // to a model, which is exactly the surface this fix closes.
  const routerFile = join(REPO_ROOT, 'lib', 'services', 'learning', 'representation-router.ts')
  const routerContent = readFileSync(routerFile, 'utf8')
  const returnCount = (routerContent.match(/return\s*\{/g) ?? []).length
  const mandatoryTrueCount = (routerContent.match(/mandatory:\s*true/g) ?? []).length
  if (returnCount !== mandatoryTrueCount) {
    errors.push(`representation-router.ts has ${returnCount} return statements but only ${mandatoryTrueCount} mark mandatory: true — every branch must be mandatory`)
  }
  return errors
}

/** 10a. Desmos and Geography 3D routing are unaffected by this correction. */
function validateDesmosAndThreeSceneRoutingUnaffected(): string[] {
  const errors: string[] = []
  const creditView = { subject: 'Economics', chapterId: 'ncert-chapter-eco-3', conceptId: 'ncert-concept-eco-3-2' } as NcertConceptWorkbenchView
  const creditDecision = selectRepresentationDeterministic({
    view: creditView,
    sessionState: { hintsUsedCount: 0, attemptsCount: 0, transferAttempted: false, transferSucceeded: false, explainBackGiven: false, missingKeyTerms: [] },
    device: 'desktop',
    scaffoldLevel: 'full_support',
  })
  if (creditDecision.renderer !== 'desmos') errors.push(`Expected formal-vs-informal credit to route to desmos, got "${creditDecision.renderer}"`)

  const terrainView = { subject: 'Geography', chapterId: 'ncert-chapter-geo-1', conceptId: 'ncert-concept-geo-1-2' } as NcertConceptWorkbenchView
  const terrainDecision = selectRepresentationDeterministic({
    view: terrainView,
    sessionState: { hintsUsedCount: 0, attemptsCount: 0, transferAttempted: false, transferSucceeded: false, explainBackGiven: false, missingKeyTerms: [] },
    device: 'desktop',
    scaffoldLevel: 'full_support',
  })
  if (terrainDecision.renderer !== 'three_scene') errors.push(`Expected land-degradation terrain to route to three_scene, got "${terrainDecision.renderer}"`)
  return errors
}

const allErrors = [
  ...validatePackageJsonClean(),
  ...validateNoRuntimeMermaidImport(),
  ...validateRendererUnionClean(),
  ...validateNoMermaidInProviderPrompts(),
  ...validateGenericRelationshipLabelRejected(),
  ...validateKeywordFragmentRejected(),
  ...validateHubAndSpokeRejected(),
  ...validateFarmingRoutesToCustomInteractive(),
  ...validateMandatoryRendererCannotBeOverridden(),
  ...validateDesmosAndThreeSceneRoutingUnaffected(),
]

if (allErrors.length > 0) {
  throw new Error(`validate-no-mermaid failed:\n${allErrors.map((e) => `  - ${e}`).join('\n')}`)
}

export const NO_MERMAID_VALIDATION_PASSED = true
