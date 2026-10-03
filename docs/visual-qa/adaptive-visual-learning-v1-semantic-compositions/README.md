# Visual QA — semantic visual quality correction

Captured against the deployed build of `claude/adaptive-visual-learning-v1` (local `next start`, verified deployed-Preview state separately via Vercel runtime logs after push). Route: `/student/learning/ncert-space-polisci/ncert-chapter-pol-1/ncert-concept-pol-1-1` (Horizontal and vertical power-sharing) and `/student/learning/ncert-space-economics/ncert-chapter-eco-3/ncert-concept-eco-3-1` (Functions of money).

## Root defect corrected

The generic fallback (`buildGenericSemanticModel` + `causal_chain` template) reduced "Horizontal and vertical power-sharing" to one Context text card, one Outcome text card and a downward arrow — prose reformatted into boxes, not a visual. Root cause: every non-hand-authored concept was forced through the same plain-sequence template regardless of its actual shape.

Fix: a `ConceptVisualGrammarClassifier` (`lib/services/learning/concept-visual-grammar-classifier.ts`) now classifies each concept's real structure (comparison, institutional system, timeline, classification, exchange, process, …) from its own title/description/explanation before a template is chosen. A quality gate (`lib/services/learning/visual-quality-gate.ts`, `evaluateVisualInstructionalValue()`) rejects any composition that reduces to a bare two-card sequence with no relational, comparative, or spatial encoding. Horizontal/vertical power-sharing now gets a dedicated bespoke composition (`HorizontalVerticalPowerSharingVisual`) rather than the generic fallback at all.

## Horizontal and vertical power-sharing

| # | State | File |
|---|---|---|
| 1 | Initial view — central distinction panel + horizontal institutions | `01-initial-comparison-horizontal-focus.png` |
| 2 | Legislature selected — role + relationship shown | `02-legislature-selected.png` |
| 3 | Executive selected | `03-executive-selected.png` |
| 4 | Judiciary selected | `04-judiciary-selected.png` |
| 5 | Vertical focus — Union/State/Local stacked | `05-vertical-focus.png` |
| 6 | Union selected | `06-union-selected.png` |
| 7 | State selected | `07-state-selected.png` |
| 8 | Local selected | `08-local-selected.png` |
| 9 | Animated sequence — "Checks and balances" stage, judiciary highlighted | `09-checks-and-balances-stage.png` |
| 10 | Scenario classification — initial example | `10-scenario-classification-initial.png` |
| 11 | Scenario feedback (first click) | `11-scenario-feedback.png` |
| 12 | Scenario — correct answer feedback | `12-scenario-correct-feedback.png` |
| 13 | Scenario — incorrect answer feedback, grounded explanation | `13-scenario-incorrect-feedback.png` |
| 14 | Combined final sequence stage — both systems together | `14-combined-final-stage.png` |
| 15 | Structured text equivalent expanded (accessibility) | `15-structured-text-equivalent.png` |
| 16 | Reduced-motion — static ordered stage list, no animation | `16-reduced-motion-static-sequence.png` |
| 17 | Mobile viewport (390px) | `17-mobile-view.png` |

## Functions of money (baseline improvement)

| # | State | File |
|---|---|---|
| 18 | Recommended before/after composition (unchanged baseline) | `18-money-recommended-before-after.png` |
| 19 | New third candidate — actor exchange (farmer / cloth seller / wheat buyer, real relationships) | `19-money-actor-exchange-alternative.png` |
| 20 | Mobile viewport | `20-money-mobile-view.png` |

Deeper animated barter-failure/success sequences remain deferred, consistent with the founder's framing of the current composition as an accepted functional baseline, not the final quality ceiling.

## Validation performed

- `npm run typecheck` — clean.
- `npm run build` — all 52 concept routes build; no errors.
- `node scripts/validate-no-mermaid.mjs` — passes, including three new checks: power-sharing routes to `custom_interactive`, the quality gate structurally rejects the exact bare-two-card shape, the classifier exposes `comparison`/`institutional_system` grammars.
- `npx tsx scripts/validate-learning-security.ts` — unaffected, passes.
- `node scripts/validate-architecture.mjs` — unaffected, passes (no runtime import of `lib/validation/`).
