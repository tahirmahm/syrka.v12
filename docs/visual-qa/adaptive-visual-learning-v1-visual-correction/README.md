# Visual-quality correction — QA notes

## The defect (before)

The founder rejected the deterministic "Visualise this" output for Economics
"Functions of money", generated as a Mermaid hub-and-spoke diagram whose
nodes were the first 5 non-stopword words ≥6 characters extracted from the
concept's own description string (`extractKeyTerms()` in
`lib/utilities/ncert-curriculum-projection.ts`, unchanged and still used
elsewhere for the Tutor's hint vocabulary — only its use as *visual* input
was the defect):

> solves → double → coincidence → problem → inherent

connected only by generic "relates to" edges — a real, reproducible artifact
of `deterministicVisualPlanningProvider.proposeVisualSpec()`
(`lib/services/learning/providers/deterministic-fallbacks.ts`), not a
one-off rendering glitch. A live re-screenshot of the exact rejected state
was not retaken (the code path that produced it is superseded, not merely
hidden), so this note documents it precisely instead: the five words above,
laid out as a Mermaid flowchart, are exactly what the old path would
produce for this concept today if invoked directly.

## The fix (after)

- `lib/campus-types/semantic-concept-model.ts` — a `SemanticConceptModel`
  of full grounded propositions (never isolated keywords), with a
  `role` (`context`/`problem`/`cause`/`mechanism`/`intervention`/`outcome`)
  per stage and an allowlisted `illustrationId`.
- `lib/services/learning/semantic-model-builder.ts` — a hand-authored,
  five-stage causal model for "Functions of money"
  (`getFunctionsOfMoneySemanticModel`), and a generic fallback
  (`buildGenericSemanticModel`) that splits the curriculum's own
  explanation into real sentences for the other 51 concepts — lower depth
  than the hand-authored case, but never a bare keyword.
- `components/learning/visuals/syrka/` — `SyrkaLearningVisual` (three
  templates: `before_after`, `problem_solution_outcome`, `causal_chain`)
  and `SyrkaVisualComposer` (the Recommended/Alternative chooser), built
  from Syrka's own tokens and Phosphor icons — no Mermaid, no generic
  node/edge graph.
- `lib/services/learning/representation-router.ts` — the deterministic
  default renderer is now `syrka_visual`, not `mermaid`; Mermaid is
  reachable only as an explicit internal/technical alternative (the code
  path still exists for Faculty/debug use, per the correction brief, but
  is never the Student default). The Economics eco-3 branch was also
  narrowed: only "Formal vs. informal credit" (a genuinely graphable
  relationship) routes to Desmos — "Functions of money" (a conceptual
  explanation, not a quantity) now correctly routes to `syrka_visual`,
  which was itself a pre-existing routing defect distinct from the
  Mermaid one.
- `components/learning/visuals/VisualGenerationState.tsx` — replaces the
  old 20px `size="sm"` orb with a genuinely prominent 64px `size="md"`
  orb, real request-lifecycle phases (`requesting` → `awaiting` →
  `composing`, tied to the actual fetch, not a fixed fake timer).

## Screenshots

1. `01-loading-state-prominent-orb.png` — the new `VisualGenerationState`
   mid-request.
2. `02-functions-of-money-option-a-before-after.png` — the Recommended
   composition (Option A from the brief).
3. `03-functions-of-money-option-b-problem-intervention-outcome.png` —
   Alternative 1 (Option B from the brief), switched without re-running
   the semantic model.
4. `04-generic-concept-causal-chain-real-sentences.png` — a non-hand-authored
   concept (Geography "Resource classification") proving the fix is not
   limited to the one rejected example.
5. `05-mobile-390x844-before-after.png` — 390×844.
6. `06-reduced-motion-parity.png` — `prefers-reduced-motion: reduce`
   (the composition is static React/SVG regardless, so parity is
   structural, not a separate code path).

## Regressions checked

- Desmos (`ncert-concept-eco-3-2`) — still routes to `desmos`, confirmed via
  a direct API call, `renderer: "desmos"`.
- Geography 3D scene (`ncert-concept-geo-1-2`) — still routes to
  `three_scene`, confirmed via a direct API call.
- `npx tsc --noEmit`, `npx eslint . --ext .ts,.tsx` (the only errors present
  are two pre-existing `require()` warnings in `tailwind.config.ts`,
  predating this pass), and `npm run build` all clean; all 52 concept
  routes present in the build output.

## What this pass did not build (disclosed, not silently dropped)

- Option C (GSAP actor-exchange animation with play/pause/step/select-actor)
  from the correction brief — the `SemanticActor`/`SemanticRelationship`
  types exist and are populated for the hand-authored model, but no
  animated actor-exchange template was built this pass.
- The remaining 12 of 15 named templates
  (`process_sequence`, `comparison_columns`, `cycle`, `hierarchy`,
  `argument_evidence`, `stakeholder_system`, `timeline`,
  `classification_board`, `spatial_system`, `data_story`,
  `actor_exchange`) — only `before_after`, `problem_solution_outcome`, and
  `causal_chain` are implemented.
- `performance.mark()`/`performance.measure()` instrumentation, response
  caching by concept+schema version, and build-time precomputation for the
  52 concept routes — not implemented; the current path re-runs the
  deterministic builder (cheap, synchronous, no network call) on every
  request instead.
- DeepSeek's `proposeVisualSpec` prompt has not been rewritten to emit a
  `SemanticConceptModel` — it still emits the old flat node/edge shape.
  Since a real DeepSeek call cannot be verified from this sandbox (network
  to `api.deepseek.com` is blocked; see the LEARN-002-completion trace
  work), rewriting an unverifiable prompt was deprioritised in favour of
  the deterministic path that every Student actually sees today.
