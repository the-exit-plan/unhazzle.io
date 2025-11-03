## Remove Environment Page Specification

# Feature: Remove Environment Page

**Status**: 🟢 DONE

**Feature**: Deprecate standalone environment variables page and migrate functionality to container-level configuration

**Source**: Internal decision (related to multi-container support)

**Priority**: MVP

**Related Items**: 
- **Depends on**: Multi-container support (per-container env vars)
- **Depends on**: View current deployment config (Overview tab editing)

---

### Overview

With the introduction of multi-container support, environment variables are now configured at the container level rather than project level. The standalone environment variables page (`/environment`) becomes redundant and should be removed to avoid confusion and maintain a single source of truth.

**Current State**:
- Dedicated environment variables page at `/environment`
- Project-level env var configuration
- Accessed via navigation or during deployment flow

**Target State**:
- No standalone environment page
- All env var configuration happens at container level (during setup or in Overview tab)
- Existing flow transitions updated to skip environment page

---

### Step 1: Identify Current Usage
**Analysis: Where is the environment page used?**

**Current references**:
1. **Initial deployment flow** (Step 5 in flow.md)
   - After resource configuration
   - Before domain setup
   - Route: `/questionnaire` → `/environment` → `/domain`

2. **Dashboard navigation**
   - Link in sidebar or settings menu
   - Direct access to `/environment` page

3. **Deployment context/state**
   - May store environment variables in deployment state
   - Needs migration to container-level storage

**Action Items**:
- ✅ Audit all navigation links to `/environment`
- ✅ Identify deployment flow transitions
- ✅ Check DeploymentContext for env var storage structure

**Why**: Understanding current usage prevents breaking the deployment flow and ensures smooth migration.

---

### Step 2: Update Deployment Flow Transitions
**Page: Questionnaire Flow (Resource Configuration)**

**Current flow**:
```
/questionnaire (resources) 
  → /environment (env vars) 
  → /domain (custom domain) 
  → /review (pricing & review)
```

**New flow**:
```
/questionnaire (resources + container config including env vars)
  → /domain (custom domain)
  → /review (pricing & review)
```

**Implementation**:

**File**: `prototype-app/app/questionnaire/page.tsx`

**Current "Next" button behavior**:
```typescript
// Current
const handleNext = () => {
  router.push('/environment');
};
```

**Updated "Next" button behavior**:
```typescript
// Updated - skip environment page
const handleNext = () => {
  router.push('/domain');
};
```

**Why**: Remove the environment page from the deployment flow by updating navigation transitions.

---

### Step 3: Move Environment Variables to Container Configuration
**Page: Questionnaire (Enhanced with Env Vars)**

**Current behavior**: 
- Resource configuration page shows containers, resources, service access
- Separate environment page for env vars

**New behavior**: 
- Resource configuration page includes per-container env var section
- No separate environment page needed

**UI Enhancement in Questionnaire**:

**For each container, add expandable "Environment Variables" section**:

```
Container: frontend
├─ Resources (CPU, RAM, Replicas)
├─ Exposure (Public/Private, Domain)
├─ Health Check
├─ Service Access
└─ Environment Variables [+ Add]    ← NEW SECTION
    User-defined:
    • KEY = value [Edit] [Delete]
    
    Auto-generated (from service access):
    • UNHAZZLE_POSTGRES_URL = postgresql://... [Edit name]
```

**Why**: Consolidate all container configuration in one place, matching the pattern established in Overview tab.

---

### Step 4: Update Navigation & Remove Route
**Files to modify**:

#### **1. Remove route file**
**File**: `prototype-app/app/environment/page.tsx`
**Action**: Delete file (or move to archived directory)

#### **2. Update navigation links**
**File**: `prototype-app/components/Navigation.tsx` (or equivalent)

**Current**:
```tsx
<NavLink href="/environment">Environment Variables</NavLink>
```

**Updated**: Remove this link entirely

**Why**: Environment configuration is now accessible via Overview tab, not as standalone page.

#### **3. Update any breadcrumb/stepper components**
**File**: `prototype-app/components/DeploymentStepper.tsx` (if exists)

**Current steps**:
```typescript
const steps = [
  { label: 'Resources', path: '/questionnaire' },
  { label: 'Environment', path: '/environment' },  // Remove
  { label: 'Domain', path: '/domain' },
  { label: 'Review', path: '/review' },
];
```

**Updated steps**:
```typescript
const steps = [
  { label: 'Resources', path: '/questionnaire' },
  { label: 'Domain', path: '/domain' },
  { label: 'Review', path: '/review' },
];
```

**Why**: Update visual indicators of deployment progress to reflect new flow.

---

### Step 5: Migrate DeploymentContext Structure
**File**: `prototype-app/lib/context/DeploymentContext.tsx`

> **⚠️ IMPLEMENTATION NOTE**: Before implementing this step, verify if the DeploymentContext structure has already been updated during the **multi-container support** implementation. If containers already have `environmentVariables` and `autoGeneratedVariables` fields, this migration may already be complete. Only implement the migration logic if the old project-level structure still exists.

**Current structure** (assumed - may already be updated):
```typescript
interface DeploymentState {
  // ... other fields
  environmentVariables: {
    key: string;
    value: string;
  }[];
}
```

**New structure** (container-level):
```typescript
interface DeploymentState {
  // ... other fields
  containers: {
    name: string;
    image: string;
    environmentVariables: {
      key: string;
      value: string;
      isSecret: boolean;
    }[];
    autoGeneratedVariables: {
      serviceName: string;  // e.g., "PostgreSQL"
      variableName: string; // e.g., "UNHAZZLE_POSTGRES_URL" (editable)
      value: string;        // e.g., "postgresql://..." (read-only)
    }[];
    // ... other container fields
  }[];
}
```

**Migration function** (for existing deployments - only if needed):
```typescript
function migrateEnvironmentVariables(oldState: OldDeploymentState): DeploymentState {
  // Check if migration already happened during multi-container support implementation
  if (oldState.containers && oldState.containers[0]?.environmentVariables) {
    // Already migrated, return as-is
    return oldState as DeploymentState;
  }
  
  // Move project-level env vars to each container
  // Or assign to a default container
  // Preserve in localStorage for backward compatibility
}
```

**Why**: Align data structure with new container-centric architecture while maintaining backward compatibility. Avoid duplicate work if multi-container support already updated the structure.

---

### Step 6: Update Review & Pricing Page
**Page**: `/review` (Deployment Review)

**Current display**:
```
Environment Variables:
• API_KEY = ***
• DATABASE_URL = ***
(Project-level display)
```

**New display**:
```
Container: frontend
  Environment Variables:
  • NEXT_PUBLIC_API_URL = https://api.acme.com
  • STRIPE_PUBLIC_KEY = *** (hidden)

Container: backend
  Environment Variables:
  • STRIPE_SECRET_KEY = *** (hidden)
  • JWT_SECRET = *** (hidden)
  Auto-generated:
  • UNHAZZLE_POSTGRES_URL (from PostgreSQL access)
  • UNHAZZLE_REDIS_URL (from Redis access)
```

**Why**: Review page should reflect new container-level env var structure for accurate deployment summary.

---

### Step 7: Add Deprecation Notice (Optional Grace Period)
**If gradual migration is preferred**:

**Temporary approach**:
1. Keep `/environment` page but show deprecation banner
2. Add "Migrate to new flow" button
3. Remove after X days/weeks

**Deprecation banner**:
```
⚠️ This page is deprecated

Environment variables are now configured per container.

[Go to Overview Tab] [Learn More]
```

**Why**: Provides smoother transition for users mid-deployment or with existing bookmarks.

**Recommendation**: **Skip this step** - clean break is simpler for MVP. The environment page never went to production, so no user impact.

---

### Step 8: Update Documentation & User Guidance
**Documentation updates needed**:

1. **User guide**: Remove references to standalone environment page
2. **Tutorial/walkthrough**: Update screenshots showing new container config
3. **API docs** (if applicable): Update env var injection documentation
4. **In-app tooltips**: Update any references to "environment page"

**In-app guidance updates**:
- Remove any tooltips that say "Configure in Environment page"
- Update to "Configure per container in Overview tab"

**Why**: Keep documentation in sync with actual product behavior.

---

## Migration Checklist

**Code Changes**:
- [ ] Delete `/environment/page.tsx` route file
- [ ] Update questionnaire navigation: `/questionnaire` → `/domain` (skip environment)
- [ ] Add environment variables section to questionnaire container config
- [ ] Remove environment page links from navigation components
- [ ] Update deployment stepper/breadcrumb components
- [ ] Migrate `DeploymentContext` structure (project-level → container-level)
- [ ] Update review page to show container-level env vars
- [ ] Update any direct route references (`router.push('/environment')`)

**Testing**:
- [ ] Test full deployment flow (ensure no broken transitions)
- [ ] Test container env var configuration in questionnaire
- [ ] Test env var editing in Overview tab
- [ ] Test review page displays correct env var structure
- [ ] Test backward compatibility (existing deployments in localStorage)

**Documentation**:
- [ ] Update user guide
- [ ] Update tutorial screenshots
- [ ] Remove environment page from sitemap
- [ ] Update any video walkthroughs

---

## Backward Compatibility Considerations

### Handling Existing Deployments

**Scenario**: Users with deployments created using old flow (project-level env vars)

**Solution Options**:

**Option A - Automatic migration on load**:
```typescript
useEffect(() => {
  const state = getDeploymentState();
  if (state.environmentVariables && !state.containers[0].environmentVariables) {
    // Old format detected, migrate automatically
    migrateToContainerLevel(state);
  }
}, []);
```

**Option B - Show migration prompt**:
```
⚠️ Your project uses the old environment variable format.

[Migrate to New Format] [Learn More]
```

**Recommendation**: **Option A** (automatic migration) - seamless experience, no user action required.

---

## Success Metrics

- **Deployment completion rate**: Maintain or improve (ensure new flow isn't confusing)
- **Time to configure env vars**: Should decrease (fewer page transitions)
- **Support tickets**: Monitor for confusion about where to add env vars
- **User feedback**: Survey users on new container-centric config experience

---

## Rollback Plan

**If issues are discovered**:

1. **Revert navigation changes**: Restore `/environment` page route
2. **Restore transitions**: `/questionnaire` → `/environment` → `/domain`
3. **Keep new container env var UI**: Both can coexist temporarily
4. **Add sync logic**: Keep both project-level and container-level in sync

**Rollback trigger conditions**:
- Deployment completion rate drops >10%
- Critical bugs in env var configuration
- User confusion (support tickets spike)

---

## Timeline

**Phase 1** (Week 1): Code changes & testing
- Remove environment page route
- Update navigation & transitions
- Migrate DeploymentContext structure

**Phase 2** (Week 2): Documentation & QA
- Update all documentation
- Comprehensive testing of new flow
- Prepare rollback plan

**Phase 3** (Week 3): Deploy & monitor
- Deploy to production
- Monitor metrics & user feedback
- Quick fixes if needed

---

## Future Enhancements

Once environment page is successfully removed:

- [ ] Add bulk env var import (JSON/ENV file upload)
- [ ] Add environment variable templates per framework
- [ ] Add env var inheritance (base → environment-specific overrides)
- [ ] Add encrypted env var storage with audit log
- [ ] Add env var validation (format checking, URL validation)

---

## Related Specifications

- **Multi-container support** (`multi-container-support.md`): Defines new container-level env var structure
- **View current deployment config** (`view-current-deployment-config.md`): Defines post-deployment env var editing in Overview tab
- **Editable auto-generated env var names**: Covers customization of auto-injected variable names
