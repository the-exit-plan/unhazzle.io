# Unhazzle.io MVP Feature Tracking

**Living Document for AI Agent Updates**

**Last Updated**: 2025-11-09  
**Current Phase**: Alpha Development  
**Total Features**: 48

---

## Status Legend

| Status | Symbol | Description |
|--------|--------|-------------|
| TODO | ⬜ | Feature not started |
| IN_PROGRESS | 🟨 | Currently being implemented |
| DONE | ✅ | Implementation complete |
| BLOCKED | 🔴 | Blocked by dependencies or issues |
| DEFERRED | ⏸️ | Intentionally postponed |

## Priority Legend

| Priority | Description | Timeline |
|----------|-------------|----------|
| Alpha | Must have for initial prototype testing | Immediate |
| Beta | Required for MVP launch | Pre-launch |
| Gamma | Post-MVP enhancements | Post-launch |

---

## Update Instructions for AI Agents

### Format
Each feature entry must follow this structure:
```
| Feature Title | Description | Type | Status | Priority | Owner | Spec Path | Dependencies | Blockers | Notes |
```

### Rules for AI Updates
1. **Status Changes**: Update status symbol when implementation state changes
2. **Dependencies**: Use format `F-XXX` to reference other features by ID
3. **Blockers**: Describe technical or business blockers preventing progress
4. **Spec Path**: Relative path from repo root (e.g., `journey/feedback-docs/first-round/features-spec/feature-name.md`)
5. **Notes**: Keep concise, append new notes with date prefix `[YYYY-MM-DD]`
6. **Preserve IDs**: Never change Feature IDs (F-XXX format)
7. **Add Features**: Append new features to end of table, assign next sequential ID

### Querying Features
**Basic Queries**:
- Filter by Status: `grep "DONE" MVP-FEATURES.md`
- Filter by Priority: `grep "Alpha" MVP-FEATURES.md`
- Find by ID: `grep "F-001" MVP-FEATURES.md`

**Advanced Query Examples**:
```bash
# Find all Alpha priority features that are TODO
grep "^| F-" MVP-FEATURES.md | grep "⬜ TODO" | grep " Alpha "

# Find all features with blockers
grep "^| F-" MVP-FEATURES.md | grep "🔴"

# Find features that depend on a specific feature (e.g., F-014)
grep "^| F-" MVP-FEATURES.md | grep "F-014"

# List all DONE features with their titles
grep "^| F-" MVP-FEATURES.md | grep "✅ DONE" | awk -F'|' '{print $2 " - " $3}'
```

---

## Current Phase Status

**Phase**: Alpha Development  
**Focus**: Core deployment flow validation and UI polish  
**Active Features**: 5 (IN_PROGRESS)  
**Completed**: 9 (DONE)  
**Blocked**: 5 (with blockers)  

**Key Milestones**:
- ✅ Multi-container support implemented
- ✅ Resource removal capability added
- ✅ Volume/stateful storage complete
- ✅ Edit on pricing page complete
- ⬜ Demo mode banner pending
- ⬜ Form state persistence pending

---

## MVP Features

| ID | Feature Title | Description | Type | Status | Priority | Owner | Spec Path | Dependencies | Blockers | Notes |
|----|--------------|-------------|------|--------|----------|-------|-----------|--------------|----------|-------|
| F-001 | View Current Deployment Config | Display and edit complete resource configuration in Overview tab with visual consistency | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/view-current-deployment-config.md` | - | - | Source: Mahya. Includes inline editing of replicas/resources. |
| F-002 | Edit Resources Inline | Allow editing replicas, CPU, RAM in place in Overview tab | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/view-current-deployment-config.md` | F-001 | - | Covered by F-001 specification. |
| F-003 | Editable Auto-Generated Env Vars | Users can customize auto-generated env var names (e.g., UNHAZZLE_POSTGRES_URL → DATABASE_URL) | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/view-current-deployment-config.md` | F-001 | - | Source: Jeroen/Eveline. Allow customization while maintaining auto-injection. |
| F-004 | Edit Selections on Pricing Page | Allow editing configuration choices on review/pricing page with real-time cost updates | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/edit-selections-on-pricing-page.md` | - | - | Source: Viviana. Inline editing for CPU, RAM, storage, replicas. |
| F-005 | Multi-Container Support | Support multiple containers per application (frontend/backend separation) with service access | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/multi-container-support.md` | - | - | Source: Jeroen/Eveline. Includes granular service access control. |
| F-006 | Volume/Stateful Storage | Ability to attach persistent volumes for stateful applications and databases | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/volume-stateful-storage.md` | - | - | Source: Inaki, Jeroen/Eveline. Smart size limits (500GB app, 10TB DB). |
| F-007 | Remove Resource Capability | Enable users to remove applications, databases, or caches from deployment configuration | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/remove-resource.md` | - | - | Completed 2025-11-08. Validates dependencies before removal. |
| F-008 | Demo Mode Banner | Visual indicator that platform is in demo/prototype mode with simulated deployment | Non-Functional | ⬜ TODO | Alpha | - | - | - | - | Clear communication to prevent confusion about real infrastructure. |
| F-009 | Mock Deployment Progress | Realistic deployment progress simulation with generic resource logs | Functional | ✅ DONE | Alpha | - | `journey/feedback-docs/first-round/features-spec/fix-deploying-page-generic-logs.md` | - | - | Source: Inaki (bug fix). Generic terms instead of brand names. |
| F-010 | Form State Persistence | Save deployment configuration to localStorage for page refresh recovery | Functional | ⬜ TODO | Alpha | - | - | - | - | Prevent data loss during configuration process. |
| F-011 | Review Page Simplification | Streamlined review page with clear resource grouping and cost breakdown | Functional | 🟨 IN_PROGRESS | Alpha | - | `journey/feedback-docs/first-round/features-spec/review-page-simplification.md` | F-004 | - | Optimize for quick review and deploy confidence. |
| F-012 | Dashboard Architecture View | Visual diagram of container architecture and service connections | Functional | ⬜ TODO | Beta | - | `journey/feedback-docs/first-round/features-spec/dashboard-architecture-view.md` | F-005 | - | Help users understand their deployment topology. |
| F-013 | Required Field Indicators | Mark required fields with asterisk (*) in forms | Non-Functional | ⬜ TODO | Gamma | - | - | - | - | Source: Viviana. UX polish for clarity. |
| F-014 | Project and Environments | Complete project and environment model with PR environment support | Functional | 🟨 IN_PROGRESS | Alpha | - | `journey/feedback-docs/first-round/features-spec/project-and-environments.md` | - | - | Foundation for multi-environment workflows. MVP definition phase. |
| F-015 | Dashboard Project/Environment Navigation | Enhanced navigation between projects and environments in dashboard | Functional | 🟨 IN_PROGRESS | Beta | - | `journey/feedback-docs/first-round/features-spec/dashboard-project-environment-navigation.md` | F-014 | - | Depends on project model completion. |
| F-016 | Environment Visualization | Visualize project + environment relationship in dashboard | Functional | ⬜ TODO | Beta | - | - | F-014 | - | Source: Jeroen/Eveline. Clear context for dev/staging/prod. |
| F-017 | PR/Ephemeral Environments | Short-lived environments for pull requests with auto-expire and minimal resources | Functional | ⬜ TODO | Beta | - | `journey/feedback-docs/first-round/features-spec/project-and-environments.md` | F-014 | - | Source: Jeroen/Eveline. Cost-controlled preview environments. |
| F-018 | Max PR Environments Cap | Limit number of PR environments per project to control costs | Functional | ⬜ TODO | Beta | - | `journey/feedback-docs/first-round/features-spec/project-and-environments.md` | F-017 | - | Default: 3 max per project. Configurable 1-20. |
| F-019 | Team Permissions & RBAC | Define different permission levels for team members and platform access | Functional | ⬜ TODO | Alpha | - | - | - | 🔴 Auth system | Source: Mahya. Critical for multi-user teams. Blocked by auth implementation. |
| F-020 | IP Whitelist | Restrict access by IP address for security | Functional | ⬜ TODO | Beta | - | - | - | - | Source: Jeroen/Eveline. Network security feature. |
| F-021 | Geo-Based Firewalling | Block traffic based on geographic location | Functional | ⏸️ DEFERRED | Gamma | - | - | F-020 | - | Deferred to post-MVP. Lower priority than IP whitelist. |
| F-022 | Do-It-Yourself Services | Documentation and enablement for self-managed database setup with custom parameters | Non-Functional | ⬜ TODO | Alpha | - | - | - | - | Source: Inaki, Jeroen/Eveline. Exercise and document DIY approach. |
| F-023 | NoSQL Database Support | Add MongoDB, Cassandra, or other NoSQL options to platform | Functional | ⬜ TODO | Beta | - | - | - | - | Source: Matija, Inaki. Requires configuration investigation. |
| F-024 | Message Queue Service | Event-driven apps need message queues (RabbitMQ, Kafka, SQS) | Functional | ⬜ TODO | Beta | - | - | - | - | Source: Jeroen/Eveline. Modern app requirement. |
| F-025 | In-Memory Cache Service | Redis, Valkey, OSS cache options | Functional | ✅ DONE | Alpha | - | - | - | - | Basic cache support implemented. |
| F-026 | FaaS/Serverless Functions | Support for short-lived jobs and serverless functions | Functional | ⬜ TODO | Beta | - | - | - | - | Source: Jeroen/Eveline. Complement container workloads. |
| F-027 | Static Content Hosting | Solution for hosting static assets (CDN, object storage) | Functional | ⬜ TODO | Beta | - | - | 🔴 Research | Requires more investigation. Source: Matija, Jeroen/Eveline. |
| F-028 | Infrastructure Alerting | Alerts when infrastructure components fail or degrade | Functional | ⬜ TODO | Beta | - | - | - | 🔴 Backend | Requires real backend infrastructure. Not applicable to prototype. |
| F-029 | Third-Party Monitoring Integration | Support Datadog, Dynatrace, Prometheus, Grafana, OpenTelemetry configuration | Functional | ⬜ TODO | Beta | - | - | F-005 | - | Source: Inaki, Jeroen/Eveline. Container-level checkbox integration. |
| F-030 | Monitoring Stack Template | Offer pre-configured monitoring stack (Grafana LGTM, ELK) for multiple projects | Functional | ⬜ TODO | Beta | - | - | F-029 | - | Source: Jeroen/Eveline. Shared monitoring deployment. |
| F-031 | Cost Alerts | Alerts when costs exceed thresholds | Functional | ⬜ TODO | Beta | - | - | - | 🔴 Backend | Requires real cost tracking system. |
| F-032 | Show Max Cost on Scale-Up | Display maximum potential cost if scaling reaches upper limits | Functional | ⬜ TODO | Alpha | - | - | - | - | Source: Andre. Risk transparency for autoscaling. |
| F-033 | Risk Disclosure | Clearly communicate risks associated with configuration choices | Non-Functional | ⬜ TODO | Beta | - | - | - | - | Source: Andre. Legal and transparency requirement. |
| F-034 | Cost Telemetry Service | Track compute, storage, bandwidth per app/config to maintain predictable margins | Functional | ⬜ TODO | Beta | - | - | - | 🔴 Backend | Source: Andre (P&G). Post-launch governance. |
| F-035 | Remove Domain Configuration | Simplify public/private container configuration without mandatory domains | Functional | 🟨 IN_PROGRESS | Alpha | - | `journey/feedback-docs/first-round/features-spec/remove-domain-configuration.md` | - | - | Streamline exposure settings. |
| F-036 | Remove Environment Page | Consolidate environment selection into project creation flow | Functional | 🟨 IN_PROGRESS | Alpha | - | `journey/feedback-docs/first-round/features-spec/remove-environment-page.md` | F-014 | - | Simplify onboarding flow. |
| F-037 | Configuration Guardrails | Prevent junior devs from provisioning unnecessary resources with warnings | Functional | ⬜ TODO | Beta | - | - | - | - | Source: Mahya. Guidance and validation. |
| F-038 | Shorten CLI Binary Name | "unhazzle" is too long for frequent typing; consider shorter alternative | Non-Functional | ⬜ TODO | Beta | - | - | - | - | Source: Matija. UX improvement for power users. |
| F-039 | Interactive CLI Mode | Support both flags and interactive prompts (e.g., `unhazzle init` asks questions) | Functional | ⬜ TODO | Beta | - | - | - | - | Source: Matija. Modern CLI UX pattern. |
| F-040 | In-Terminal Help/Guidance | Modern CLI with built-in guidance, less need for external docs | Non-Functional | ⬜ TODO | Beta | - | - | - | - | Source: Matija. Reduce friction for CLI users. |
| F-041 | Better GH Actions Setup Docs | Clearer instructions on what users need to do to set up GitHub Actions | Non-Functional | ⬜ TODO | Alpha | - | - | - | - | Source: Matija. Critical for deployment automation. |
| F-042 | EU Compliance Framework | Legal/data-protection/governance standards (GDPR, etc.) | Non-Functional | ⬜ TODO | Beta | - | - | - | - | Source: Andre. Internal framework, not customer-facing T&C. |
| F-043 | SLA and DPA Documentation | Service Level Agreement and Data Processing Agreement | Non-Functional | ⬜ TODO | Beta | - | - | - | - | Source: Andre. Must be reviewed by legal expert. |
| F-044 | Sustainability/Green Hosting | EU data centers with renewable energy, efficiency transparency | Non-Functional | ⏸️ DEFERRED | Gamma | - | - | - | - | Source: Andre. Differentiator but post-MVP priority. |
| F-045 | Migration Tools | Help users migrate from existing platforms with running pipelines | Functional | ⬜ TODO | Beta | - | - | - | - | Source: Mahya. Competitive necessity for adoption. |
| F-046 | Onboarding Video | Short video for beginners and power users | Non-Functional | ⏸️ DEFERRED | Gamma | - | - | - | - | Source: Andre. Nice-to-have for user education. |
| F-047 | FAQ or Chatbot Support | Built-in help for common questions during configuration | Functional | ⏸️ DEFERRED | Gamma | - | - | - | - | Source: Viviana, Andre. Reduce support burden. |
| F-048 | EU Language Selector | Support multiple European languages in UI | Non-Functional | ⏸️ DEFERRED | Gamma | - | - | - | - | Source: Andre. i18n for broader market. |

---

## Summary Statistics

**By Status**:
- ⬜ TODO: 29 features (5 with blockers)
- 🟨 IN_PROGRESS: 5 features
- ✅ DONE: 9 features
- ⏸️ DEFERRED: 5 features

**By Priority**:
- Alpha: 19 features (must-have for prototype)
- Beta: 23 features (required for MVP launch)
- Gamma: 6 features (post-MVP enhancements)

**By Type**:
- Functional: 36 features
- Non-Functional: 12 features

**Critical Path Items** (Alpha Priority, Not Done):
1. F-008: Demo Mode Banner
2. F-010: Form State Persistence
3. F-019: Team Permissions & RBAC (blocked)
4. F-022: Do-It-Yourself Services
5. F-032: Show Max Cost on Scale-Up
6. F-041: Better GH Actions Setup Docs

**Active Blockers**:
1. F-019: Team Permissions & RBAC - Blocked by auth system implementation
2. F-027: Static Content Hosting - Requires research and investigation
3. F-028: Infrastructure Alerting - Requires real backend infrastructure
4. F-031: Cost Alerts - Requires real cost tracking system
5. F-034: Cost Telemetry Service - Requires backend infrastructure

---

## Dependencies Graph

### Core Platform Dependencies
```
F-014 (Project/Environments) ──┬──> F-015 (Dashboard Navigation)
                               ├──> F-016 (Environment Visualization)
                               ├──> F-017 (PR Environments)
                               └──> F-036 (Remove Environment Page)

F-017 (PR Environments) ──────────> F-018 (Max PR Env Cap)

F-001 (View Current Config) ───┬──> F-002 (Edit Resources Inline)
                               └──> F-003 (Editable Env Vars)

F-005 (Multi-Container) ───────────> F-029 (3rd Party Monitoring)

F-020 (IP Whitelist) ──────────────> F-021 (Geo Firewalling)

F-029 (3rd Party Monitoring) ──────> F-030 (Monitoring Stack)

F-004 (Edit on Pricing) ───────────> F-011 (Review Page Simplification)
```

### Authentication Blocker
```
🔴 Auth System ────────────────────> F-019 (Team Permissions & RBAC)
```

### Backend Infrastructure Blockers
```
🔴 Backend Infrastructure ─────┬──> F-028 (Infrastructure Alerting)
                               ├──> F-031 (Cost Alerts)
                               └──> F-034 (Cost Telemetry)
```

---

## Notes for AI Agents

### When Adding New Features
1. Assign next sequential ID (F-XXX)
2. Append to end of main features table
3. Set realistic priority (Alpha/Beta/Gamma)
4. Document dependencies using existing feature IDs
5. Add spec path if specification document exists
6. Note source from feedback if applicable

### When Updating Status
1. Change status symbol in table
2. Update summary statistics section
3. If completing Alpha feature, update "Current Phase Status"
4. If blocking/unblocking, update "Active Blockers" section
5. Add dated note in Notes column for significant changes

### When Identifying Blockers
1. Mark blocker in Blockers column with 🔴 symbol
2. Document blocker description
3. Add to "Active Blockers" section with explanation
4. Update dependencies graph if blocker affects other features

### Validation Checklist
- [ ] All feature IDs are unique
- [ ] All dependency references (F-XXX) point to existing features
- [ ] Summary statistics match table counts
- [ ] All blocked features listed in "Active Blockers"
- [ ] Spec paths are valid relative paths from repo root
- [ ] Status legend symbols used consistently

---

## Related Documentation

- **Feedback Analysis**: `journey/feedback-docs/first-round/mvp.md`
- **Feature Specifications**: `journey/feedback-docs/first-round/features-spec/`
- **Glossary**: `journey/GLOSSARY.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

**Document Version**: 1.1  
**Generated**: 2025-11-10  
**Format**: Markdown with single unified table for easy parsing  
**Maintainer**: AI Agents + Human Review
