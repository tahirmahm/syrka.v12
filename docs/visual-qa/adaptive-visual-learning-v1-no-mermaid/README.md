# Visual QA — Mermaid removal + mandatory-renderer correction

Two founder directives landed together in this pass, because the second one
(a live model overriding the authored Geography 3D scene) was found to share
the exact root cause as the first (Mermaid keyword graphs still reaching
students): renderer eligibility was partly decided by a model prompt instead
of by code.

## What was rejected

The founder reviewed the deployed Preview and rejected two things:

1. Economics "Functions of money" and Geography "Types of farming" both still
   rendering as Mermaid-style graphs: a single "distinction" (or similar)
   node fanned out to isolated keyword rectangles ("primitive", "subsistence",
   "intensive", "commercial"), connected by generic "relates to" edges.
2. Geography "Sustainable development" (the authored 3D terrain scene,
   `ncert-concept-geo-1-2`) also rendering as a Mermaid graph instead of the
   3D scene, even though the deterministic router correctly chose
   `three_scene`. Root cause: `DeepSeekV4ProTeachingProvider.selectRepresentation()`
   made its own live model call with a renderer-choice prompt that still
   offered Mermaid/custom_react alongside three_scene — a live, successful
   DeepSeek call could (and did) override the deterministic decision.

## What changed

- **Removed Mermaid entirely**: uninstalled the `mermaid` and `dompurify`
  packages, deleted `MermaidDiagram.tsx`, `mermaid-definition-builder.ts`,
  `visual-spec-validator.ts`, and the `LearningVisualSpec` node/edge type
  (the whole generic-graph substrate, not just its Mermaid renderer).
  Replaced the renderer union with an exhaustive `LearningRenderer` type
  (`syrka_visual | custom_interactive | desmos | three_scene | excalidraw |
  structured_text`) with no generic-graph member at all.
- **Renderer selection is now 100% code-owned**: every branch of
  `selectRepresentationDeterministic()` returns `mandatory: true`.
  `DeepSeekV4ProTeachingProvider.selectRepresentation()` no longer calls the
  model for the renderer field — it returns the deterministic decision
  unmodified, full stop. An authored 3D scene, a graphable relationship, or a
  real classification interactive can no longer be silently replaced,
  whether the model call would have succeeded, timed out, or returned
  malformed JSON — because it is never invoked for this decision.
- **"Types of farming" (`ncert-concept-geo-4-2`) is a real interactive**:
  `FarmingClassificationInteractive.tsx` — a 6-criterion comparison table
  (purpose, technology, labour intensity, scale, market orientation, typical
  production pattern) across the three farming types, plus a
  classify-the-scenario exercise with grounded, specific feedback. Routed as
  `mandatory: true` custom_interactive, never a generated visual of any kind.
- **Restrained Student-facing labels**: the "Visualise this" badge, the
  Tutor's "Diagnose my response" badge, and the personalised-plan badge now
  show only `Generated with DeepSeek V4-Pro` / `... · cached` / `Syrka
  fallback used` — no trace ids, no "attempted and failed (timeout)" wording,
  in the ordinary Student lesson. Full diagnostic detail (resultCategory,
  keyConfigured, requestId) stays in server logs and the Preview-only
  `/api/learning/diagnostics/deepseek` route.
- **Validator extensions**: `validateSemanticModel` now rejects generic
  relationship labels ("relates to" and equivalents) and hub-and-spoke
  relationship shapes (every relationship from the same origin actor). The
  DeepSeek semantic-visual prompt now asks for actors, mechanisms, and
  comparisons in addition to stages — never renderer names, nodes/edges, or
  code.
- **New repository validator**: `lib/validation/validate-no-mermaid.ts`,
  loaded on every Learning concept lookup, proves (among other things) that
  `selectRepresentation()`'s own source never calls the DeepSeek function —
  a structural guarantee, not just an observed result.

## Deletion audit

| Removed | Replacement |
|---|---|
| `mermaid`, `dompurify`, `@types/dompurify` npm packages | none needed |
| `components/learning/visuals/MermaidDiagram.tsx` | `components/learning/visuals/syrka/SyrkaLearningVisual.tsx` (already existed) |
| `lib/services/learning/mermaid-definition-builder.ts` | deleted, no replacement needed |
| `lib/services/learning/visual-spec-validator.ts` | `lib/services/learning/semantic-model-validator.ts` (already existed, extended) |
| `lib/campus-types/learning-visual-spec.ts` (`LearningVisualSpec`, node/edge/stage graph) | `lib/campus-types/semantic-concept-model.ts` (already existed) |
| `LearningVisualRenderer` (9 values incl. `mermaid`, `custom_canvas`, `static_accessible_fallback`) | `LearningRenderer` (6 values, `lib/campus-types/learning-renderer.ts`) |
| `VisualPlanningProvider` / `proposeVisualSpec` (dead code, never reachable as Student default) | fully removed — `RepresentationSelectionProvider` + `proposeSemanticVisual` cover this |
| `/api/learning/visualize`'s Mermaid fallback branch | unrecognised/unhandled renderers resolve to `syrka_visual` |
| DeepSeek renderer-choice prompt in `selectRepresentation()` | no model call at all for this field |

## Screenshots

1. `01-geography-3d-terrain-scene.png` — Sustainable development
   (`ncert-concept-geo-1-2`) after clicking "Visualise this": the real
   rotatable 3D terrain (Forest reserve, Agricultural land, Mining zone,
   Water catchment), region selection list, the one manipulable variable
   (apply conservation at Year 5 / no conservation), play/pause/step/reset,
   compare-with-Year-0, and the structured text equivalent. No keyword graph.
2. `02-geography-3d-reduced-motion.png` — the same scene under
   `prefers-reduced-motion: reduce`. Pixel-identical to (1): this is expected
   and correct — reduced-motion parity means the same accessible end-state,
   not a different final render; a static screenshot cannot show the absence
   of an animation that has already settled.
3. `03-types-of-farming-comparison-table.png` — the real 6-criterion,
   3-column comparison table, no keyword graph, no "relates to" edges.
4. `04-types-of-farming-classify-feedback.png` — after selecting an answer to
   the classify-the-scenario exercise: specific, grounded feedback and the
   Evidence-boundary disclosure ("not connected to the concept's own Evidence
   chain").
5. `05-types-of-farming-mobile.png` — 390×844.
6. `06-thinking-orb-loading-state.png` — the prominent (~64px) Thinking Orb
   with a real staged label ("Identifying the idea, actors and
   relationships"), not a 20px dot.
7. `07-functions-of-money-fallback-before-after.png` — the recommended
   before/after composition with real grounded propositions (farmer/wheat/
   cloth-seller/money), the Recommended/Alternative 1 chooser, and the
   restrained `Syrka fallback used` badge (this sandbox cannot reach
   `api.deepseek.com`, so this is honestly the deterministic fallback path,
   not a live result — see "What this pass did not verify" below).
8. `08-functions-of-money-mobile.png` — 390×844.
9. `09-english-narrative-irony-fallback.png` — a non-hand-authored concept
   (English, "Narrative irony") through the generic sentence-derived
   semantic model: a real 2-stage causal sequence from the chapter's own
   explanation, not a keyword graph, confirming the removal didn't regress
   subjects without a bespoke composition.
10. `10-polisci-concept-fallback.png` — same confirmation for Political
    Science.

## Regression checks

- `GET /api/learning/visualize` for `ncert-concept-eco-3-2` (Formal vs.
  informal credit) still returns `renderer: "desmos"`.
- `ncert-concept-geo-1-2` always returns `renderer: "three_scene"` —
  confirmed via direct API call in this sandbox, where DeepSeek is
  genuinely unreachable (a real, not simulated, provider-failure
  condition), proving the mandatory decision survives provider
  unavailability.
- `npx tsc --noEmit`, `eslint` on all changed files, and a full
  `npm run build` (all 52 concept routes + 26 chapter routes present) all
  pass clean.

## What this pass did not verify

- **A live DeepSeek-generated visual for Functions of Money or any other
  concept.** This sandbox's network policy blocks `api.deepseek.com`, so
  every screenshot here shows the deterministic fallback path, honestly
  labelled `Syrka fallback used`. The founder's own Preview session (where
  DeepSeek has been reachable) is the only environment that can produce a
  genuine `Generated with DeepSeek V4-Pro` screenshot.
- **The Excalidraw or true WebGL-failure structured-text fallback path**
  were not captured this pass (WebGL is available in the headless browser
  used here, so the failure branch was not naturally triggered).
