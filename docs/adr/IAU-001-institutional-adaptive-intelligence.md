# IAU-001 — Institutional Adaptive Intelligence

Status: Accepted (bounded vertical slice)
Date: 2026-07-27
Builds on: ADR-002 (Syrka Domain Architecture), CEA-001 (Canonical Event Architecture), REASON-001 (Evidence Reasoning Constitution), INF-001 (Capability Inference Constitution), and the Stage A/B/C Learning work already in this repo (`lib/campus-types/learning-*.ts`, `lib/mock-data/learning-seed.ts`, `lib/mock-data/ncert-class-10-seed.ts`).
Decision owners: Learning Engineering, AI Engineering, Faculty Product
Scope: the first bounded, working connection between a Tutor that adapts to one learner over time and an institution that governs and learns from that adaptation.

## 1. What this ADR is, and is not

This is not a claim that Syrka is a proven AI-native university, nor that fixture data demonstrates longitudinal efficacy, nor that any Tutor response here is produced by a live model. Every Tutor decision in this system remains deterministic and is labelled as such everywhere it appears, exactly as `SyrkaIntelligenceState` and `DeterministicTutorPanel`/`NcertChapterTutorPanel` already do.

The correct claim after this pass is: **Syrka now demonstrates the connected learner and institutional feedback loops through which a school or university can become AI-native** — not that it has become one.

This ADR documents a **bounded vertical slice**: four representative chapters (already canonical, from PR #16) carry the full depth described below; the remaining 22 chapters keep their existing curriculum structure and chapter-aware Tutor, and gain the reusable adaptive-session *engine*, but do not receive fabricated multi-session histories.

## 2. The two loops

### 2.1 The learner loop

```
Learner state
→ next teaching action (PedagogicalPolicyEngine)
→ activity
→ attempt
→ Tutor intervention
→ changed strategy (if the learner model warrants it)
→ transfer
→ delayed retrieval
→ Learning Observation
→ Evidence candidate
→ Faculty review
→ Capability support
→ Odyssey response
→ Career Passport eligibility
→ revised learner state
```

This is the same attempt→observation→Evidence→Capability chain already established by the Chapter 1 Chemistry fixture and `buildStudentLearningProjection()` — extended with two new things: (a) a persistent, structured **learner model** that survives across sessions rather than being read fresh from one lesson's fixtures each time, and (b) a **policy engine** that consults that model to decide *how* to teach next, not just *what* content exists.

### 2.2 The institutional loop

```
Aggregated, de-identified learning signals
→ curriculum condition detected
→ change proposal created
→ Faculty inspects supporting evidence
→ Faculty approves, edits, or rejects
→ new Learning Space version proposed (never auto-published)
```

Faculty retain authority throughout. The system recommends; it never silently rewrites published curriculum, and no Evidence becomes Capability-supporting or Passport-eligible without a human review step.

### 2.3 Shared data, not shared access

Both loops read the same canonical entities (`LearningObservation`, `EvidenceCandidate`, `CapabilityInference`, the new `AdaptiveSessionPlan`/`LearnerModelProjection`), but institutional views never receive the student loop's raw material directly — see §5 (privacy) and §6 (projections).

## 3. Canonical entity ownership

| Concern | Owning file(s) | New in this pass? |
| --- | --- | --- |
| Curriculum content (chapters, concepts, activities) | `lib/campus-types/learning-content.ts`, `lib/mock-data/ncert-class-10-seed.ts` | No — reused from PR #16 |
| Within-session Tutor state machine, hint ladder | `lib/campus-types/learning-interaction.ts`, `lib/services/learning/tutor-state-machine.ts` | No — reused as-is |
| Raw session/attempt/observation | `lib/campus-types/learning-interaction.ts`, `lib/campus-types/learning-observation.ts` | No — reused as-is |
| Evidence/Capability/Passport pipeline | `lib/campus-types/evidence.ts`, `lib/campus-types/capability.ts`, `lib/campus-types/passport.ts`, `learning-seed.ts`'s `EvidenceCandidate`/`CapabilityInference`/`DisclosurePermission` pattern | No — reused as-is |
| **Longitudinal learner model** (cross-session memory, teaching-strategy history) | `lib/campus-types/learning-adaptive.ts` (new) | **Yes** |
| **Cross-session teaching-strategy selection** | `lib/services/learning/pedagogical-policy-engine.ts` (new) | **Yes** |
| **AI-aware assessment** | `lib/campus-types/learning-ai-assessment.ts` (new) | **Yes** |
| Faculty read-only curriculum/intervention views | `app/faculty/curriculum/*`, `app/faculty/interventions/*` (new) | **Yes** (UI only — no new domain types) |

No parallel `Person`, `Student`, `Capability`, `Evidence`, or `LearningObservation` system is created. `MisconceptionRecord` (already in `learning-interaction.ts`) is reused directly rather than redefined.

## 4. The learner model

`LearnerModelProjection` is a **projection**, in CEA-001's sense: derived, rebuildable state, not a new source of truth. It is built once, deterministically, from the same underlying attempt/observation/misconception fixtures a Faculty reviewer or the Tutor panel would otherwise have to re-read individually every time.

It separates, per CEA-001 §2.10's event/observation/fact distinction and the brief's own requirement:

- **direct observation** — `ConceptLearningState.observedFrom` points at real `LearningObservation`/`LearningAttempt` ids;
- **deterministic system inference** — `AdaptationDecision.reason` and `PedagogicalPolicyEngine`'s output are visibly derived, never asserted as fact;
- **Faculty judgment** — a `PedagogicalMemoryEntry` may carry a `facultyConfirmed` flag distinct from system-inferred entries;
- **student self-report** — reserved via `LearnerGoalContext.source: 'self_reported'`, distinguished from everything else.

It explicitly does **not** carry an intelligence score, a wisdom score, a morality score, a personality diagnosis, an employability score, a future-success probability, or an unrestricted psychological profile. Every field maps to a concrete, falsifiable pedagogical fact ("used 3 hints on the last attempt at this concept"), never a composite judgement about the learner as a person.

Raw Tutor conversation text is never promoted to `PedagogicalMemoryEntry` — only a structured summary plus a reference to the originating session/attempt id. The student-facing "What Syrka remembers" panel (§10) renders exactly these structured entries, each showing what is remembered, why, which observation produced it, and when it was last updated — nothing else exists to leak.

Because durable persistence remains explicitly out of scope for this pass (per the brief's own constraint), every `LearnerModelProjection` in this repo is a **deterministic fixture-backed projection**, built once from the fixed demonstration session history in `lib/mock-data/adaptive-learning-seed.ts` and clearly labelled as demonstration data everywhere it renders — the same posture the rest of this Learning system already takes toward `LEARNING_NOW` and the single demo student.

## 5. Privacy boundaries

| Data | Visible to Student | Visible to Faculty | Visible to Department/University |
| --- | --- | --- | --- |
| Raw Tutor transcript text | No (never stored) | No (never stored) | No |
| Structured `PedagogicalMemoryEntry` (this student) | Yes, own only | Yes, own students only | No |
| `AdaptationDecision` reason (this student) | Yes, own only | Yes, own students only | No |
| Aggregated concept-difficulty / scaffolding-dependence counts | No | Course-level, de-identified where required | Yes, de-identified |
| Individual misconception detail | No cross-student visibility | Own students only | Never |

This mirrors the existing `ObservationVisibilityPolicy`/`InstructionalDisclosureRule` machinery in `learning-visibility.ts` exactly — no new privacy primitive is invented; the new projections are simply additional data that machinery governs.

## 6. Projection boundaries

Each of the following is a distinct, one-directional projection builder (`lib/utilities/adaptive-learning-projection.ts`), never a shared object mutated in place:

- Student adaptive-learning view — reads the learner model for **one** student, one chapter.
- Faculty curriculum/intervention view — reads across students in one Faculty member's own courses, with per-student detail but never another Faculty member's students.
- Career Passport view — reads only reviewed, disclosure-permitted `EvidenceCandidate`s, exactly as the existing Passport pipeline already enforces.

A test in `lib/validation/validate-adaptive-learning-data.ts` asserts that the Faculty/institutional-shaped projections contain no raw session-transcript field and no per-student misconception detail beyond what that role is authorised to see (§20 of the brief; §23 checklist items 20-21 below).

## 7. Deterministic policy-engine design

`PedagogicalPolicyEngine.selectNextAction(input)` is a **pure function**: identical `PedagogicalDecisionInput` in, identical `AdaptationDecision` out, every time — no clock reads, no randomness, no hidden state. This is what makes "the same learner state produces the same deterministic decision" (checklist item 7) a property that can actually be unit-tested, not just asserted.

Inputs: current curriculum concept, the learner model's relevant `ConceptLearningState` and `AssistanceHistory`, the current attempt's correctness/hint level, prior `AdaptationDecision`s for this concept, time available, and the chapter's subject (English/Geography/Economics/Political Science each register a different, real strategy-selection table — see `lib/services/learning/pedagogical-strategies.ts`).

Output: `{ strategy, reason, supportingObservationIds, rejectedAlternatives, uncertainty, expectedNextSignal }`. Every field is rendered directly in the "Why Syrka adapted" panel — there is no strategy the UI cannot explain, because the UI's explanation *is* this object, not a separate narrative layer.

No opaque universal learner score feeds the decision. The engine reasons over the same small set of typed, named signals a human tutor would notice (repeated same misconception, heavy hint dependence, successful transfer, etc.), not a collapsed 0-100 number.

## 8. Faculty authority

Every state transition that matters institutionally — Evidence acceptance, curriculum-change approval, AI-aware-assessment review — has exactly one human decision point, matching the existing `CurriculumReview`/`EvidenceReview` pattern: the system proposes (`decision`, `recommendation`, `changeProposal`), a named Faculty actor accepts/rejects/requests changes, and only the accepted outcome propagates downstream (to Capability, to Passport, to a new Learning Space version). Nothing in this pass adds a code path that lets an AI-authored decision become institutionally binding without that human step.

## 9. AI-aware assessment

The institutional question this system asks is not "did the student use AI" but "how did the student use it, what remained their own, what did they verify, and can they defend and transfer the result independently." `AIAwareAssessmentRubric` records tool/Tutor used, declared purpose, which output was accepted vs. changed, sources checked, errors the student caught, their own supplied reasoning, an independent explain-back, and a transfer result — never a single "AI usage score." Copied-output and verified-orchestration are structurally distinguishable (the latter requires a non-empty `detectedModelErrors` or `studentVerificationActions` array plus an `independentDefence` record; the former has neither).

## 10. Curriculum-evolution workflow (demonstration only)

One representative proposal is implemented end-to-end as a fixture: a recurring misconception in one subject is shown as the trigger, the affected concept and aggregate (de-identified) signal are shown, a proposed change is drafted, and a named Faculty reviewer's decision (approve/edit/reject) is recorded. No live research monitoring, no internet access, no automatic rewriting of published curriculum — this is explicitly a single deterministic demonstration of the shape of the workflow, not a working curriculum-research pipeline.

## 11. Event flow

New events are modelled using CEA-001's existing envelope shape (actor, subject, tenant, timestamp, source, provenance, schema version) as plain, typed, in-memory records — there is no event bus, event store, or Kafka-style infrastructure anywhere in this repository, and this pass does not add one. "Reuse the existing Canonical Event Architecture" is honoured at the level CEA-001 actually exists in this codebase today: a shared conceptual envelope and taxonomy, not a running system. Building a literal event bus was out of scope for this pass and remains a gap, noted honestly in §12.

## 12. Known limitations of this fixture-based implementation

- No durable persistence — every learner-model projection is rebuilt from a fixed, deterministic fixture history each time, exactly like the rest of this Learning system.
- No literal canonical event bus/store — events are typed in-memory records following CEA-001's envelope, not a running system.
- Full three-session adaptive depth is built for four representative chapters only; the remaining 22 chapters share the reusable engine but have no session history to run it against yet.
- Department and University institutional-intelligence views, if not completed in this same pass, are explicitly out of scope for this increment and are called out as such in the pass's own completion report rather than silently omitted.
- No live model call anywhere — every Tutor response, strategy selection, and AI-aware-assessment judgement is deterministic and clearly labelled as such.
