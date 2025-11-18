# Copilot Instructions for Unhazzle.io

## Project Overview
Unhazzle.io is a spec-driven, demo-mode Infrastructure-as-a-Service prototype. It validates deployment UX, resource config, and pricing transparency before building real infrastructure. All data and flows are simulated—no production backend or external API calls.

## Architecture & Key Files
- **Prototype app**: `/prototype-app/` (Next.js 15, TypeScript, Tailwind)
  - Pages: `/app/` (questionnaire, application, resources, review, deploying, dashboard)
  - State: `/lib/context/DeploymentContext.tsx` (global deployment config)
  - Pricing: `/lib/utils/costCalculator.ts`
- **Specs**: `/mvp/features` and `/journey/feedback-docs/first-round/features-spec/`
- **Glossary**: `/mvp/GLOSSARY.md` (standard terminology)

## Development Workflow
1. **Read the spec** before coding (see feature .md files above).
2. **Follow existing UI/component patterns**—study similar pages/components.
3. **Use smart defaults**: Pre-fill forms with realistic data, base on questionnaire answers.
4. **Type safety**: Strict TypeScript, define interfaces, avoid `any`.
5. **Build validation**: Run `npm run build` to catch TypeScript errors.
6. **Manual testing**: Run `npm run dev`, click through flows, verify with different data, check responsive design.
7. **Update /mvp/flow.md** with new user flows or changes.

## Demo Mode Principles
- All data is mock/simulated; outcomes are predetermined.
- Show realistic progress and delays (see deploying page logic).
- Use generic terms in logs (no brand names).
- Always show cost breakdowns transparently.

## UI/UX Patterns
- Tailwind for styling; use default palette and spacing.
- Mobile-first, responsive design.
- Smart defaults, progressive disclosure, and inline validation.
- Cost impact always visible.
- Editable auto-generated env var names (e.g., `UNHAZZLE_POSTGRES_URL`).

## State Management
- Use `useDeployment()` hook and `updateState()` method.
- State persists across navigation (in-memory only).
- Cost recalculation is automatic on state changes.
 - Removal helpers: `removeContainer(id)`, `removeDatabase()`, `removeCache()` clean service access + env vars.

## Validation & Business Rules
- Container names: lowercase alphanumeric + hyphens, 3-63 chars.
- CPU: 0.1–32 cores; Memory: 128MB–64GB; Replicas: 1–100.
- Public containers require domain; private = internal DNS only.
 - Cannot remove database/cache if any container still has serviceAccess flag for it (UI blocks with message).

## Common Mistakes to Avoid
- Don't build real infrastructure or add external API calls.
- Don't skip cost calculations or ignore specs.
- Don't use brand names in logs.
- Don't over-engineer; keep code simple and straightforward.
- Don't break existing flows—test the full journey.

## Resources
- Specs: `/mvp/`
- Glossary: `/mvp/GLOSSARY.md`
- State: `/prototype-app/lib/context/DeploymentContext.tsx`
- Cost: `/prototype-app/lib/utils/costCalculator.ts`

## Example Commands
- `npm run dev` – Start development server
- `npm run build` – Production build (TypeScript check)
- `npm start` – Run production server

---
**Goal:** Validate UX flows and gather feedback. Keep it simple, follow specs, and focus on user experience.
