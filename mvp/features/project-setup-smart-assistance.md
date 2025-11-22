# Feature Spec: Project Setup & Smart Assistance Questionnaire

## Goal
Revamp the initial project creation step to capture basic project metadata (name, region) and optionally apply "Unhazzle Smart Assistance" recommendations derived from five targeted workload questions. Recommendations optimize for performance + cost and transparently show resource sizing and scaling rationale before the user proceeds.

## Status
DONE

## Scope
In-scope:
- Extend global deployment state with project basics and recommendations.
- Replace existing questionnaire page with Project Setup + optional collapsed assistance panel.
- Compute recommendations: replicas base, per-replica CPU & memory, HPA min/max/threshold/cooldown.
- Derive cost range (min/max replicas) using existing cost calculator.
- Propagate project name and region to dashboard, review page, and initial environment slug.

Out of scope:
- Non-European regions (future expansion only scaffolding).
- Actual infrastructure provisioning or external API calls.
- Persisting beyond in-memory demo state.

## Data Model Additions (DeploymentState)
```ts
projectName?: string; // validated: 3-63 chars, lowercase alphanumeric + hyphen
region?: {
  code: string;      // fsn1 | nbg1 | hel1
  label: string;     // Falkenstein (fsn1)
  country: string;   // Germany | Finland
  flag: string;      // 🇩🇪 | 🇫🇮
};
questionnaire?: {
  traffic?: string;   // option key
  latency?: string;
  workload?: string;
  startup?: string;
  spikiness?: string;
};
recommendations?: {
  replicasBase: number; // suggested starting replicas
  cpuPerReplica: string; // e.g. "2 vCPU"
  memoryPerReplica: string; // e.g. "4GB"
  hpaMin: number;
  hpaMax: number;
  hpaThreshold: number; // percent CPU or metric threshold
  hpaCooldown: number; // minutes
  rationale: string; // short sentence summarizing mapping
};
```
All fields optional; existing flows must not break if absent.

## Questionnaire Inputs (5)
1. Traffic Volume (requests/hour)
2. Latency Sensitivity (acceptable response time)
3. Workload Type (CPU / Memory / I/O / Balanced)
4. Startup Time (seconds)
5. Traffic Spikiness (pattern)

Each stored as string keys matching mapping tables.

## Recommendation Mapping Rules (Summary)
- Base replicas derived from Traffic Volume bucket.
- CPU & Memory per replica from Latency + Workload combination (choose stricter of latency & workload suggestions).
- HPA min from Spikiness + Startup (conservative if slow startup or unpredictable traffic).
- HPA max = hpaMin * multiplier(spikiness): steady=2, daily=3, weekly=5, unpredictable=10.
- HPA threshold: latency bucket (<50ms=50, 50-200ms=70, 200-500ms=80, >500ms=85).
- HPA cooldown (minutes) from startup bucket (<5=2, 5-15=5, 15-30=10, >30=15).

## UI Changes (`app/questionnaire/page.tsx`)
Layout:
1. Project Basics Card
   - Project Name input (live validation)
   - Region selector grouped by country:
     - Germany 🇩🇪: Falkenstein (fsn1), Nuremberg (nbg1)
     - Finland 🇫🇮: Helsinki (hel1)
2. Smart Assistance (collapsed by default)
   - Header bar with CTA copy: "Unhazzle’s Smart Assistance optimizes for performance and cost—unlock tailored replica, scaling, and resource sizing in seconds."
   - Expand reveals five multiple-choice sections.
   - Actions:
     - Apply Recommendations (disabled until all answered)
     - Reset (clears answers + recommendations only)
3. Recommendation Preview (shown after apply)
   - Summary line: "2 replicas start · HPA 1–6 · Scale at 70% CPU · 5m cooldown"
   - Cost range: "Estimated monthly €X–€Y (resources + scaling range)" with tooltip breakdown.
4. Continue Button
   - Enabled if projectName + region set (questionnaire optional).

Accessibility: flag emojis carry `aria-label` with country name.

## State & Actions
- `updateState(partial)` extended to handle new fields.
- Reset clears `questionnaire` + `recommendations` keys only.
- Apply sets both based on current answers.
- Continue navigates to existing application flow unchanged.

## Utility: `lib/utils/recommendations.ts`
Export:
```ts
export interface QuestionnaireAnswers { traffic: string; latency: string; workload: string; startup: string; spikiness: string; }
export interface Recommendations { replicasBase: number; cpuPerReplica: string; memoryPerReplica: string; hpaMin: number; hpaMax: number; hpaThreshold: number; hpaCooldown: number; rationale: string; }
export function generateRecommendations(a: QuestionnaireAnswers): Recommendations { /* implement mapping */ }
```

## Integration Points
- On apply: call `generateRecommendations`, update state, compute cost range by running cost calc for hpaMin and hpaMax scenarios.
- Environment creation: use `projectName` for slug instead of auto-generated when present.
- Dashboard & Review pages: display project name and region badge (flag + label).

## Validation Rules
Project Name:
- Regex: `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$` (3–63 chars)
- Error inline; disable Continue until valid.
Region: must select before Continue.
Questionnaire: all five required only for Apply; optional overall.

## Reset Behavior
- Clears `questionnaire` and `recommendations`.
- Retains `projectName` & `region`.
- Hides Recommendation Preview until re-applied.

## Demo Mode Notes
- No external calls; region selection is cosmetic + future-ready.
- Cost transparency preserved: show min–max range reasons.
- Rationale field provides single concise sentence (e.g., "Daily traffic + moderate latency ⇒ balanced 2 vCPU / 4GB with 1–6 HPA range.").

## Acceptance Criteria
1. Loading questionnaire page with no prior state shows empty name, no region, assistance collapsed.
2. Invalid project name shows inline error, disables Continue.
3. Expanding Smart Assistance and answering all questions enables Apply.
4. Applying immediately shows recommendation summary + cost range.
5. Reset clears answers and summary; project basics untouched.
6. Continuing sets state and navigates; downstream pages can access `projectName` & `region`.
7. Dashboard and Review display project name + region badge if set.
8. Build passes TypeScript with new fields.

## Non-Functional
- No performance regression (simple mapping only).
- Code stays within existing styling and patterns (Tailwind + simple components).

## Future Extension Hooks
- Add more regions by appending to country-locations array.
- Introduce metric-specific HPA strategies (memory vs CPU) later using workload type.
- Internationalization using labels array (not in current scope).

---
End of spec.