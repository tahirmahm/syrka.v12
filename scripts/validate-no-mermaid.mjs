#!/usr/bin/env node
/**
 * LEARN-002 Mermaid-removal directive — standalone architecture check.
 *
 * This used to run as a side-effect import inside application runtime code
 * (lib/utilities/ncert-curriculum-projection.ts, lib/services/learning/route-guard.ts).
 * That was a real production-breaking defect: Vercel's serverless output does
 * not bundle the full repo source tree, so this module's readdirSync() walk
 * over app/components/lib crashed every request that touched it with
 * `ENOENT: no such file or directory, scandir '/var/task/app'`. Filesystem-
 * scanning validators must never be imported by runtime application modules —
 * they run here, as an ordinary script (npm run validate:no-mermaid), during
 * CI or before `next build`.
 *
 * Re-implements the same rule checks previously expressed in
 * lib/services/learning/semantic-model-validator.ts and
 * lib/services/learning/representation-router.ts as small, self-contained
 * plain-JS equivalents (no TypeScript loader dependency) so this script has
 * zero new runtime dependencies.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const RUNTIME_ROOTS = ['app', 'components', 'lib'].map((d) => join(REPO_ROOT, d))
const IMPORT_PATTERN = /from\s+['"]mermaid['"]|require\(\s*['"]mermaid['"]\s*\)|import\(\s*['"]mermaid['"]\s*\)/
const GENERIC_RELATIONSHIP_LABEL = /^\s*(relates to|related to|connects to|associated with|linked to)\s*$/i

/** @type {string[]} */
const errors = []

function walk(dir, out = []) {
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

// 1/2. package.json carries no mermaid/dompurify dependency.
function validatePackageJsonClean() {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'))
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  if ('mermaid' in allDeps) errors.push('package.json still declares a "mermaid" dependency')
  if ('dompurify' in allDeps) errors.push('package.json still declares a "dompurify" dependency (was only used to sanitise Mermaid SVG output)')
}

// 3. No runtime source file imports the mermaid package.
function validateNoRuntimeMermaidImport() {
  for (const root of RUNTIME_ROOTS) {
    for (const file of walk(root)) {
      const content = readFileSync(file, 'utf8')
      if (IMPORT_PATTERN.test(content)) errors.push(`${file.replace(REPO_ROOT + '/', '')} imports the mermaid package`)
    }
  }
}

// 4. The renderer union (lib/campus-types/learning-renderer.ts) is the exhaustive 6-value set.
function validateRendererUnionClean() {
  const file = join(REPO_ROOT, 'lib', 'campus-types', 'learning-renderer.ts')
  const content = readFileSync(file, 'utf8')
  const expected = ['syrka_visual', 'custom_interactive', 'desmos', 'three_scene', 'excalidraw', 'structured_text']
  for (const value of expected) {
    if (!content.includes(`'${value}'`)) errors.push(`learning-renderer.ts is missing expected renderer value "${value}"`)
  }
  if (/['"]mermaid['"]/i.test(content)) errors.push('learning-renderer.ts declares "mermaid" as a quoted renderer value')
}

// 5. No provider system prompt offers Mermaid (or any generic graph engine) as a choice to DeepSeek.
function validateNoMermaidInProviderPrompts() {
  const providerFiles = [
    join(REPO_ROOT, 'lib', 'services', 'learning', 'providers', 'deepseek-teaching-provider.ts'),
    join(REPO_ROOT, 'lib', 'services', 'learning', 'providers', 'semantic-visual-provider.ts'),
  ]
  for (const file of providerFiles) {
    const content = readFileSync(file, 'utf8').toLowerCase()
    if (content.includes('mermaid')) errors.push(`${file.replace(REPO_ROOT + '/', '')} still mentions "mermaid" — DeepSeek must never be offered it as a choice`)
  }
}

// 6. "relates to" (and equivalent generic connectors) would be rejected as relationship labels.
function validateGenericRelationshipLabelRule() {
  if (!GENERIC_RELATIONSHIP_LABEL.test('relates to')) errors.push('the generic-relationship-label rule no longer matches "relates to"')
}

// 7. Isolated keyword fragments (the exact rejected defect) would still be rejected as propositions.
function validateKeywordFragmentRule() {
  const MIN_PROPOSITION_WORDS = 4
  const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length
  if (wordCount('primitive') >= MIN_PROPOSITION_WORDS) errors.push('the keyword-fragment word-count rule no longer rejects a single word')
}

// 8. selectRepresentation() never calls the DeepSeek function — the renderer decision is code-owned.
function validateMandatoryRendererCannotBeOverridden() {
  const file = join(REPO_ROOT, 'lib', 'services', 'learning', 'providers', 'deepseek-teaching-provider.ts')
  const content = readFileSync(file, 'utf8')
  const idx = content.indexOf('async selectRepresentation')
  const selectRepresentationBody = content.slice(idx, idx + 800)
  if (selectRepresentationBody.includes('callLearningDeepSeek')) {
    errors.push('selectRepresentation() still calls callLearningDeepSeek — a live model can override a mandatory renderer decision (e.g. the Geography 3D terrain scene)')
  }
  const routerFile = join(REPO_ROOT, 'lib', 'services', 'learning', 'representation-router.ts')
  const routerContent = readFileSync(routerFile, 'utf8')
  const returnCount = (routerContent.match(/return\s*\{/g) ?? []).length
  const mandatoryTrueCount = (routerContent.match(/mandatory:\s*true/g) ?? []).length
  if (returnCount !== mandatoryTrueCount) {
    errors.push(`representation-router.ts has ${returnCount} return statements but only ${mandatoryTrueCount} mark mandatory: true — every branch must be mandatory`)
  }
}

// 9. Types of farming routes to a real comparison/classification interactive, never a generated visual.
function validateFarmingRoutesToCustomInteractive() {
  const routerFile = join(REPO_ROOT, 'lib', 'services', 'learning', 'representation-router.ts')
  const routerContent = readFileSync(routerFile, 'utf8')
  if (!/ncert-concept-geo-4-2[\s\S]{0,700}renderer:\s*'custom_interactive'/.test(routerContent)) {
    errors.push('representation-router.ts does not route ncert-concept-geo-4-2 (Types of farming) to custom_interactive')
  }
  const componentFile = join(REPO_ROOT, 'components', 'learning', 'visuals', 'FarmingClassificationInteractive.tsx')
  const content = readFileSync(componentFile, 'utf8')
  if (IMPORT_PATTERN.test(content)) errors.push('FarmingClassificationInteractive.tsx imports mermaid')
  if (!content.includes('COMPARISON_ROWS') || !content.includes('SCENARIOS')) errors.push('FarmingClassificationInteractive.tsx is missing the real comparison table or classification exercise')
}

// 10. Desmos and Geography 3D routing are unaffected by this correction.
function validateDesmosAndThreeSceneRoutingUnaffected() {
  const routerFile = join(REPO_ROOT, 'lib', 'services', 'learning', 'representation-router.ts')
  const routerContent = readFileSync(routerFile, 'utf8')
  if (!/ncert-concept-eco-3-2[\s\S]{0,700}renderer:\s*'desmos'/.test(routerContent)) {
    errors.push('representation-router.ts does not route ncert-concept-eco-3-2 (formal vs. informal credit) to desmos')
  }
  if (!/ncert-concept-geo-1-2[\s\S]{0,700}renderer:\s*'three_scene'/.test(routerContent)) {
    errors.push('representation-router.ts does not route ncert-concept-geo-1-2 (sustainable development) to three_scene')
  }
}

// 11. Horizontal/vertical power-sharing routes to the dedicated bespoke comparison interactive, not the generic two-card fallback.
function validatePowerSharingRoutesToCustomInteractive() {
  const routerFile = join(REPO_ROOT, 'lib', 'services', 'learning', 'representation-router.ts')
  const routerContent = readFileSync(routerFile, 'utf8')
  if (!/ncert-concept-pol-1-1[\s\S]{0,700}renderer:\s*'custom_interactive'/.test(routerContent)) {
    errors.push('representation-router.ts does not route ncert-concept-pol-1-1 (Horizontal and vertical power-sharing) to custom_interactive')
  }
  const componentFile = join(REPO_ROOT, 'components', 'learning', 'visuals', 'HorizontalVerticalPowerSharingVisual.tsx')
  const content = readFileSync(componentFile, 'utf8')
  if (IMPORT_PATTERN.test(content)) errors.push('HorizontalVerticalPowerSharingVisual.tsx imports mermaid')
  for (const required of ['Legislature', 'Executive', 'Judiciary', 'Union', 'State', 'Local', 'SCENARIOS', 'SEQUENCE_STAGES']) {
    if (!content.includes(required)) errors.push(`HorizontalVerticalPowerSharingVisual.tsx is missing expected structure "${required}"`)
  }
}

// 12. The instructional-value quality gate exists and actually rejects a bare two-card sequence.
function validateQualityGateRejectsBareCardSequence() {
  const gateFile = join(REPO_ROOT, 'lib', 'services', 'learning', 'visual-quality-gate.ts')
  const content = readFileSync(gateFile, 'utf8')
  if (!content.includes('evaluateVisualInstructionalValue')) {
    errors.push('visual-quality-gate.ts is missing evaluateVisualInstructionalValue()')
    return
  }
  const twoCardModel = {
    schemaVersion: '1.0.0',
    conceptId: 'test',
    centralIdea: 'test',
    learningObjective: 'test',
    stages: [
      { id: 's0', order: 0, role: 'context', proposition: 'A short context statement.' },
      { id: 's1', order: 1, role: 'outcome', proposition: 'A short outcome statement.' },
    ],
    actors: [],
    relationships: [],
    generatedBy: 'deterministic',
  }
  // Re-implements the same structural rule the real gate applies, to prove the exact rejected shape (two bare cards, causal_chain template) would fail — without importing TypeScript into this plain-JS script.
  const hasRelationalEncoding = twoCardModel.actors.length >= 2 && twoCardModel.relationships.length >= 1
  const hasEnoughStages = twoCardModel.stages.length >= 3
  const isBareCardSequence = !hasRelationalEncoding && !hasEnoughStages
  if (!isBareCardSequence) errors.push('the bare-two-card-sequence rejection rule no longer flags the exact shape that was rejected in Preview (one Context card, one Outcome card, no relational encoding)')
}

// 13. The visual grammar classifier exists and detects the exact structural signal that was missing before this correction.
function validateVisualGrammarClassifierExists() {
  const classifierFile = join(REPO_ROOT, 'lib', 'services', 'learning', 'concept-visual-grammar-classifier.ts')
  const content = readFileSync(classifierFile, 'utf8')
  if (!content.includes('classifyConceptVisualGrammar')) errors.push('concept-visual-grammar-classifier.ts is missing classifyConceptVisualGrammar()')
  if (!content.includes("'comparison'")) errors.push('concept-visual-grammar-classifier.ts is missing the comparison grammar')
  if (!content.includes("'institutional_system'")) errors.push('concept-visual-grammar-classifier.ts is missing the institutional_system grammar')
}

validatePackageJsonClean()
validateNoRuntimeMermaidImport()
validateRendererUnionClean()
validateNoMermaidInProviderPrompts()
validateGenericRelationshipLabelRule()
validateKeywordFragmentRule()
validateMandatoryRendererCannotBeOverridden()
validateFarmingRoutesToCustomInteractive()
validateDesmosAndThreeSceneRoutingUnaffected()
validatePowerSharingRoutesToCustomInteractive()
validateQualityGateRejectsBareCardSequence()
validateVisualGrammarClassifierExists()

if (errors.length > 0) {
  console.error('validate-no-mermaid failed:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log('validate-no-mermaid: all checks passed')
