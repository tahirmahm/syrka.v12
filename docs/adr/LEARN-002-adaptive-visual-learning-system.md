# LEARN-002 — Syrka Adaptive Visual Learning System

Status: accepted, partially implemented (see §12 "Scope actually delivered in this pass").
Builds on: IAU-001, CLASSX-001 (`claude/class10-student-domain-unification-v1`, PR #18, accepted).
Branch: `claude/adaptive-visual-learning-v1`. Base: `claude/class10-student-domain-unification-v1`.

## 1. Problem

CLASSX-001 gave every Class X concept a real Learn/Try/Test/Explain-back workbench and one
shared Tutor. But the workbench is still `explanation + form + Tutor buttons` — text in, text
out. The founder's brief for this pass asks for a Tutor that behaves like "a dedicated private
teacher": one that diagnoses, plans, chooses how to teach a concept, renders something the
student can manipulate, watches what they do with it, and only then decides whether independent
performance has actually been demonstrated.

The canonical loop this ADR commits to:

```
Learner model → personalised plan → diagnostic task → teaching strategy →
representation selection → interactive teaching → attempt → feedback →
changed representation → independent assessment → transfer → delayed retrieval →
Learning Observation → Evidence eligibility → Capability → Odyssey
```

This is not a diagram generator. It is a decision system (what to teach, how, and whether it
worked) that happens to produce visuals as one of its outputs.

## 2. Non-negotiable boundaries (carried into every section below)

- **DeepSeek does not own curriculum state.** The NCERT curriculum projection
  (`lib/utilities/ncert-curriculum-projection.ts`) remains the single source of concept
  content. DeepSeek is shown a bounded brief (concept title, learning objective, misconception,
  key terms, prior session state) — never the full curriculum corpus, never another student's
  data.
- **DeepSeek does not own learner state.** `ConceptTutorSessionState` (hints used, attempts,
  transfer/explain-back status) is computed locally and passed in; DeepSeek never persists or
  independently derives it.
- **DeepSeek does not directly emit trusted executable code.** Every DeepSeek response in this
  system is JSON matched against a strict schema (`LearningVisualSpec`, plan-step shape,
  assessment-plan shape). A response that fails validation is discarded and the deterministic
  fallback runs instead — it is never partially trusted.
- **Generated outputs are proposals requiring validation.** `VisualSpecValidator` and the
  representation router are the actual authorities on what renders and how; DeepSeek proposes,
  Syrka's own validators dispose.
- **Watching an animation does not demonstrate Capability.** A visual-shown event is a
  `LearningObservation` at most, never Evidence.
- **Completing a heavily scaffolded visual is not independent Evidence.** The existing
  independence-gating rule from CLASSX-001 (`evidenceEligible = transferSucceeded &&
  independent && explainBackGiven`) is unchanged and extends to visual interactions: a visual
  left on screen during assessment marks that attempt as assisted, full stop.

## 3. DeepSeek provider architecture

Five server-only interfaces, one per decision the Tutor needs to make:

- `TutorReasoningProvider` — diagnose a response, decide next pedagogical move.
- `LearningPlanProvider` — produce a personalised multi-step plan from learner state.
- `AssessmentPlanningProvider` — design a near-neighbour/transfer question, evaluate a
  structured or argumentative response.
- `VisualPlanningProvider` — produce a `LearningVisualSpec` proposal for a concept.
- `RepresentationSelectionProvider` — given a concept + student context, recommend a renderer
  and explain the trade-off against alternatives.

Each interface has a `DeepSeekV4Pro*` implementation (thinking mode, used for diagnosis,
planning, pedagogy selection, VisualSpec generation, representation comparison, assessment
evaluation, strategy-change explanation) and a `DeepSeekV4Flash*` implementation
(non-thinking, used for simplification, vocabulary/reading-level changes, nearby examples from
an approved template, shortening, alt-text regeneration). Every interface additionally has a
**deterministic fallback** — a plain function using the same rule-based logic already proven in
`concept-tutor-engine.ts` and `PedagogicalPolicyEngine` — so the system degrades to "good,
honest, rule-based" rather than "broken" when DeepSeek is unavailable, rate-limited, or returns
invalid JSON.

This mirrors the existing `lib/services/odyssey/deepseek-provider.ts` pattern exactly: a
`createDeepSeekClient()` call through `lib/deepseek.ts`'s `resolveDeepSeekModel()` (which already
rejects the retired `deepseek-chat`/`deepseek-reasoner` aliases), an `AbortController` timeout, a
typed provider-error union, `response_format: { type: 'json_object' }`, and strict JSON parsing
before anything touches the schema validator. No new call pattern is invented.

Every user-visible result carries a `generationSource: 'deepseek_v4_pro' | 'deepseek_v4_flash' |
'deterministic_fallback'` tag, rendered honestly in the UI — the same discipline the Odyssey
Tutor already established with its provenance labelling. No call site is permitted to claim a
model call happened when the fallback path actually ran.

Server-side controls: request timeout, one retry on transient failure, a token budget per call,
a per-session rate limit, tenant context carried in the request (not sent to DeepSeek), and a
structured error type distinguishing `timeout` / `rate_limited` / `unavailable` /
`malformed_response`. No raw NCERT PDF text is ever placed in a prompt — only the already-
extracted `explanation`/`description`/key-terms strings the curriculum projection already
computes. No raw Tutor transcript is persisted; only structured summaries (mirroring the
existing "What Syrka remembers" pattern from the adaptive-learning fixtures).

## 4. Raster-image boundary

DeepSeek V4-Pro/Flash are text/JSON models — they do not emit pixels. An
`IllustrationGenerationProvider` interface is declared for future use but **is not
implemented** in this pass, because no real image-generation endpoint is configured (per the
brief: do not implement one unless a real endpoint exists). Janus-Pro is documented here as a
possible future self-hosted option; no GPU infrastructure is added. Every Learning visual in
this pass is interactive/inspectable/accessible and generated from `LearningVisualSpec` — never
a generated bitmap.

## 5. Canonical `LearningVisualSpec`

A new, versioned type (`lib/campus-types/learning-visual-spec.ts`), distinct from the unused
Stage-A `learning-visual.ts` scaffold (which modelled deterministic-vs-generated-image
classification for a raster pipeline that was never bound to a provider — left untouched, still
exported, superseded for actual rendering by this schema). `LearningVisualSpec` never stores
executable script, HTML, or arbitrary SVG markup — only a structured node/edge/stage/annotation
graph that a renderer interprets. Hard limits are enforced by `validateVisualSpec()`: node count,
edge count, nesting depth, label length, animation-stage count, and generated-prose length,
matching the brief's schema-limits list. A spec that exceeds any limit or contains a
disallowed field is rejected before it ever reaches a renderer.

## 6. `LearningRepresentationRouter`

A pure function, not a DeepSeek call by default: given subject, concept, learning objective,
misconception, prior representation, scaffold level, device, and assessment purpose, it returns
`{ renderer, reason, alternativesConsidered: {renderer, rejectedBecause}[] }`. The
`RepresentationSelectionProvider` DeepSeek path is an optional upgrade for ambiguous cases; the
deterministic router covers every renderer decision this pass actually ships (Mermaid, Desmos,
custom Economics interactive, structured text) without depending on a live model call to
function at all.

## 7. Renderer decisions actually shipped in this pass

- **Mermaid** — concept maps, cause-and-effect chains, process/timeline diagrams. Lazy-loaded,
  `mermaid.parse()` called before render, `securityLevel: 'strict'`, click directives and
  scripts stripped, output SVG sanitized, Syrka typography tokens applied, `<title>`/alt text/
  structured-text equivalent always rendered alongside the diagram, reduced-motion respected
  (Mermaid diagrams are static once rendered, so this mainly governs the reveal transition).
- **Desmos** (`DesmosLearningGraph`) — genuine graphable relationships only. Script loaded
  dynamically from `NEXT_PUBLIC_DESMOS_API_KEY` (never hard-coded, never committed), feature-
  flagged off entirely when the env var is absent (explicit "unavailable" state, not a broken
  widget), lazy-loaded only when the student opens it. Used for the Economics repayment-burden
  demonstration (§8).
- **Custom React interactive** — one bespoke component this pass: the Economics credit-flow /
  household-borrowing simulator. English, Geography, and Political Science interactives from
  the brief's §13 are **not built in this pass** — see §12 for why and what that means for the
  Tutor's representation choices in those subjects (falls back to Mermaid/structured text).
- **Excalidraw** — not integrated in this pass (§12).
- **Structured text / static accessible fallback** — always available as the last resort
  renderer, and the only renderer used when `prefers-reduced-motion` plus a scaffold-level check
  indicate a visual would not currently be appropriate.

## 8. Desmos demonstration content

One representative graph: repayment burden (total amount owed) as principal, term, and interest
rate vary, attached to the Economics "Money and Credit" chapter. This is a real, honestly-
labelled instructional graph, not a forced fit — Political Science/English content is never
routed to Desmos.

## 9. Tutor tool contract

`concept-tutor-engine.ts`'s existing 16 actions are extended with visual-aware actions:
`create_visual`, `simplify_visual`, `change_representation`, `open_interactive`, in addition to
the existing hint/diagnose/transfer actions. Each tool call is a deterministic function by
default; `create_visual` and `change_representation` may consult
`VisualPlanningProvider`/`RepresentationSelectionProvider` when configured, always falling back
to the deterministic router. The Tutor still asks before telling, still uses the smallest useful
hint, and a full-answer reveal still blocks independent classification for that attempt — no
existing CLASSX-001 guarantee is loosened by adding visuals.

## 10. Motion discipline

Framer Motion (already installed, already governed by `lib/motion/campus-motion.ts`) is used
throughout for interface-level transitions (Mermaid reveal, Desmos panel open, simplify/expand
toggles). **GSAP, Lenis, React Bits, and Vanta are not installed or integrated in this pass** —
see §12. This keeps exactly one motion system driving Learning surfaces, avoiding the
"GSAP and Motion competing on the same node" failure mode the brief explicitly warns against, by
construction rather than by discipline.

## 11. Evidence and assessment boundary

New visual-learning canonical-event-shaped records (reusing the existing
`LearningObservation`/`EvidenceCandidate` types, not a parallel system): `visual_shown`,
`visual_manipulated`, `visual_removed_for_assessment`. A concept attempt's
`evidenceEligible` computation (already in `ConceptWorkbench.tsx`) is extended with one more
condition: if a visual was present and not explicitly removed before the Test step, the attempt
is `guided`, not `independent`, regardless of transfer success. This is the one behavioral change
to the existing Evidence gate, and it tightens the bar rather than loosening it.

## 12. Scope actually delivered in this pass — stated honestly, upfront

Given the size of this brief (27 sections) against a single implementation pass, the following
were built with real depth:

- DeepSeek provider architecture (§3) with deterministic fallbacks proven working.
- `LearningVisualSpec` schema + validator (§5).
- `LearningRepresentationRouter` (§6).
- Mermaid renderer, fully governed per §7.
- Desmos adapter for one Economics demonstration (§8).
- One bespoke subject interactive (Economics credit-flow simulator).
- The multi-horizon personalised plan page (`/student/learning/plan`).
- Tutor tool-contract extension for visuals (§9), Evidence-boundary tightening (§11).

The following are **explicitly not built** in this pass, are documented here rather than
silently dropped, and should be scoped as follow-up work:

- English/Geography/Political Science bespoke interactives (§13) — these subjects currently
  route to Mermaid or structured text via the representation router, which is a legitimate
  router outcome, not a placeholder, but is not the dedicated claim-builder/resource-board/
  stakeholder-map the brief describes.
- Excalidraw canvas integration (§12 of the brief).
- GSAP + Lenis governed motion layer (§14 of the brief) — Framer Motion covers this pass's
  needs; GSAP's staged-sequence/MorphSVG/Flip capabilities are not exercised.
- React Bits pattern adoption (§15 of the brief).
- Vanta `AmbientLearningField` (§17 of the brief).
- Faculty Visual Learning Studio (§19 of the brief) — `/faculty/curriculum/[spaceId]/
  [chapterId]/visuals` is not built; VisualSpec inspection/approval remains a manual,
  code-level activity in this pass.
- Capability graph cross-subject-relationships and pathway-impact modes, and a true mobile
  textual tree for Capability (both were already-disclosed CLASSX-001 gaps; still not closed
  here since this pass's time went to the DeepSeek/VisualSpec/Mermaid/Desmos foundation
  instead).

None of these were silently substituted with something that merely looks similar — each is a
named gap the founder can decide to prioritize next.
