## Remove Domain Configuration Page Specification

**Status**: 🔴 TO_DO

**Feature**: Remove domain configuration page and provide domain info post-deployment

**Source**: Co-founder decision - More realistic deployment flow

**Priority**: HIGH (simplifies deployment flow, removes unrealistic pre-deployment domain config)

**Related**: 
- Impacts: Review page (remove domain card)
- Impacts: Navigation flow (questionnaire → resources → review → deploying)
- Impacts: Dashboard page (add domain display for public apps)

---

### Overview

Remove the domain configuration page from the deployment flow. It's unrealistic to configure domains before deployment, and we are not DNS providers. Instead, we'll provide the domain/endpoint information post-deployment in the dashboard for applications with public visibility.

---

### Current Problems

1. **Unrealistic flow**: Asking users to configure domains before deployment doesn't match real-world deployment patterns
2. **Wrong business model**: We're not DNS providers - domain configuration should happen after deployment
3. **Adds complexity**: Extra step in the flow that provides little value at this stage
4. **User confusion**: Users don't know what domain to configure before the app is deployed

---

### Proposed Solution

**Remove domain page and update flow:**

1. **Delete domain page** (`app/domain/page.tsx`)
2. **Update navigation flow**: 
   - Questionnaire → Resources → Review → Deploying (skip domain page)
3. **Remove domain card from review page**
4. **Add informative text in review page** for public containers
5. **Add domain display in dashboard** for deployed public applications

---

### Navigation Flow Changes

#### Current Flow (BEFORE)
```
Questionnaire → Resources → Review → Domain → Deploying → Dashboard
```

#### New Flow (AFTER)
```
Questionnaire → Resources → Review → Deploying → Dashboard
                                                    ↓
                                          (Domain shown here for public apps)
```

---

### Review Page Changes

#### Remove
- ❌ **Domain Configuration Card** (entire section)
- ❌ Domain-related state management
- ❌ Domain validation logic

#### Add
- ✅ **Informative badge/text** in public container cards:

```
┌─────────────────────────────────────┐
│ 🚀 Container 1: my-app              │
│ [Edit Resources]                    │
│                                     │
│ ℹ️ Public Endpoint                  │
│ A secure domain will be provided    │
│ after deployment                    │
│                                     │
│ CPU: 2 vCPU [▼]                    │
│ Memory: 4 GB [▼]                   │
│ ...                                 │
└─────────────────────────────────────┘
```

---

### Dashboard Page Changes

#### Add Domain Display Section

**For applications with public containers:**

```
┌─────────────────────────────────────────────────┐
│ OVERVIEW TAB                                    │
│                                                 │
│ Application: my-app                             │
│ Status: Running ✅                              │
│ Region: eu-west-1                               │
│                                                 │
│ 🌐 Public Endpoints                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ Container: my-app                           │ │
│ │ https://my-app-a8f3k2.unhazzle.app         │ │
│ │ [Copy URL] 📋                               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Container: api-service                      │ │
│ │ https://api-service-x9m2p1.unhazzle.app    │ │
│ │ [Copy URL] 📋                               │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**For applications with only private containers:**
- No endpoint section shown
- Just standard overview information

---

### Implementation Tasks

#### 1. Remove Domain Page
- [ ] Delete `app/domain/page.tsx`
- [ ] Remove domain route from Next.js routing
- [ ] Clean up any domain-related imports

#### 2. Update DeploymentContext
- [ ] Remove domain state (if any)
- [ ] Remove domain update functions
- [ ] Clean up domain-related types

#### 3. Update Review Page
- [ ] Remove domain configuration card
- [ ] Add informative badge to public container cards
- [ ] Update "Back" button navigation (should go to resources page)
- [ ] Remove domain validation logic

#### 4. Update Resources Page
- [ ] Update "Continue" button to navigate to `/review` (skip domain)
- [ ] Remove any domain-related preflight checks

#### 5. Update Dashboard Page
- [ ] Add "Public Endpoints" section in Overview tab
- [ ] Only show for applications with `exposure: 'public'` containers
- [ ] Generate mock domain format: `{container-name}-{random-id}.unhazzle.app`
- [ ] Add copy-to-clipboard functionality
- [ ] Style as card with gradient border

#### 6. Update Navigation Components
- [ ] Remove domain step from any progress indicators
- [ ] Update breadcrumbs if present
- [ ] Update step counters (now 4 steps instead of 5)

---

### User Experience Flow

#### During Deployment Setup (Review Page)
**For public containers:**
```
User sees: "ℹ️ A secure public endpoint will be provided after deployment"
User understands: Domain comes later, not now
User continues: Clicks "Deploy Application"
```

#### After Deployment (Dashboard)
**For public apps:**
```
User navigates to: Dashboard → Overview tab
User sees: Public Endpoints section with generated domains
User can: Copy domain URL to clipboard
User can: Click domain to open in new tab
```

---

### Domain Generation Format

**Pattern**: `{container-name}-{random-id}.unhazzle.app`

**Examples:**
- `my-app-a8f3k2.unhazzle.app`
- `api-service-x9m2p1.unhazzle.app`
- `frontend-k3p8x7.unhazzle.app`

**Random ID:**
- 6 characters
- Alphanumeric lowercase
- Unique per deployment

---

### Edge Cases

1. **Multiple public containers**: Show all endpoints in separate cards
2. **All private containers**: Don't show endpoints section
3. **Mixed public/private**: Only show public container endpoints
4. **Re-deployments**: Generate new random ID, update domain

---

### Success Criteria

- ✅ Domain page completely removed from codebase
- ✅ Navigation flows directly from Resources → Review → Deploying
- ✅ Public container cards show informative endpoint message
- ✅ Dashboard displays generated domains for public containers
- ✅ Copy-to-clipboard works for domain URLs
- ✅ No broken links or navigation issues
- ✅ No domain-related state in context

---

### Testing Checklist

- [ ] Complete flow without domain page works
- [ ] Back button from review page goes to resources
- [ ] Public container shows endpoint info message
- [ ] Private container doesn't show endpoint info
- [ ] Dashboard shows endpoints only for public apps
- [ ] Copy button copies domain correctly
- [ ] Multiple public containers all show domains
- [ ] Mobile layout looks good

---

### Migration Notes

**Breaking Changes:**
- Domain configuration removed from deployment flow
- Any existing domain state will be ignored
- Dashboard now shows auto-generated domains

**Backward Compatibility:**
- Existing applications in context will work (domain field ignored)
- No database changes needed (mock data)

---

### Future Enhancements

**Phase 2 (Post-MVP):**
- Custom domain support (user brings their own domain)
- SSL certificate management
- DNS configuration guidance
- Domain transfer tools

**Phase 3 (Enterprise):**
- White-label domains
- Subdomain management
- Domain marketplace

---

### Files to Modify

```
DELETE:
- app/domain/page.tsx

MODIFY:
- app/resources/page.tsx (update navigation)
- app/review/page.tsx (remove domain card, add info badge)
- app/dashboard/page.tsx (add endpoints section)
- lib/context/DeploymentContext.tsx (remove domain state)

VERIFY:
- Navigation flow works end-to-end
- No broken imports/references
- TypeScript compilation succeeds
```

---

### Design Mockups

#### Review Page - Public Container Card
```
┌─────────────────────────────────────────┐
│ 🚀 Container 1: frontend                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ℹ️ Public Endpoint Available         │ │
│ │ A secure domain will be provided    │ │
│ │ after deployment                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Edit Resources]                        │
│ CPU: 2 vCPU [▼]                        │
│ Memory: 4 GB [▼]                       │
│ Replicas: 2 [▼]                        │
│                                         │
│ Exposure: Public 🌐                     │
│ Port: 3000                              │
│                                         │
│ Container Cost: €38.50/mo              │
└─────────────────────────────────────────┘
```

#### Dashboard - Public Endpoints Section
```
┌────────────────────────────────────────────┐
│ 🌐 Public Endpoints                        │
│                                            │
│ Your application is accessible at:        │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ 🚀 frontend                            │ │
│ │ https://frontend-a8f3k2.unhazzle.app  │ │
│ │ [Copy URL] 📋  [Open] 🔗              │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ 🚀 api-service                         │ │
│ │ https://api-a8f3k2.unhazzle.app       │ │
│ │ [Copy URL] 📋  [Open] 🔗              │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

**Timeline**: 2-3 hours
**Dependencies**: None
**Risk**: Low (simplifies rather than complicates)