# Feature Spec: Dashboard-First Flow with OCI Registry Integration

## Goal
Transform the post-questionnaire flow from a linear multi-page journey into a dashboard-centric configuration experience. Users create a project, land on the dashboard, create environments, connect their OCI registry (GitHub Container Registry), select container images, configure apps, and deploy with full cost transparency. This enables iterative configuration and post-deployment modifications with explicit "Apply Changes" workflow.

## Scope
In-scope:
- Redirect from questionnaire to dashboard with empty project (no environments)
- Environment creation UI with name and type (non-prod/prod)
- Optional OCI registry connection modal (GitHub PAT for ghcr.io)
- Multi-image selection to auto-generate containers
- Manual container/cache addition with public image URLs
- Persistent cost header showing real-time estimates
- "Deploy Environment" button for initial deployment
- "Apply Changes" workflow for post-deployment modifications
- Production environment warnings and confirmations
- Remove database support (users add connection strings as env vars)
- Deprecate `/application` and `/resources` pages

Out of scope:
- Multiple OCI registries (Docker Hub, generic registries) - GitHub only for MVP
- PR environments (keep data model but don't expose UI)
- Organization hierarchy
- Actual infrastructure provisioning
- Image auto-detection beyond mocked metadata

## Data Model Changes

### Environment Interface Updates
```ts
interface Environment {
  id: string;
  name: string; // free-form, user-provided
  slug: string; // kebab-case, 3-63 chars
  type: 'non-prod' | 'prod'; // replaces 'standard' for user-created envs, keep 'pr' for future
  status: EnvironmentStatus;
  deployed: boolean; // NEW: false = configuration phase, true = provisioned
  deployedAt?: string; // NEW: ISO 8601 timestamp of first deployment
  pendingChanges: boolean; // NEW: true when deployed env has unsaved modifications
  createdAt: string;
  
  // Remove database field entirely
  database?: never; // Database removed from MVP
  
  containers: ContainerConfig[];
  cache?: {
    engine: string;
    version: string;
    memory: string;
    evictionPolicy: string;
    persistence: string;
  };
  
  baseDomain: string;
  publicContainers: string[];
}

// Keep existing EnvironmentType but extend
export type EnvironmentType = 'standard' | 'pr' | 'non-prod' | 'prod';
```

### Project Interface Updates
```ts
interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  githubPAT?: string; // NEW: migrated from localStorage
  
  repository?: RepositoryIntegration;
  prEnvironmentSettings?: PREnvironmentSettings;
  configRepo?: ConfigRepo;
  prEnvs: PREnvSettings;
  
  environments: Environment[];
  
  envCount: number;
  prEnvCount: number;
  standardEnvCount: number;
}
```

### New DeploymentContext Methods
```ts
// Create empty environment
createEnvironment(name: string, type: 'non-prod' | 'prod'): void

// Generate containers from OCI registry images
createAppsFromImages(environmentId: string, images: Array<{
  name: string;
  url: string;
  autoName: string;
  tag?: string;
  description?: string;
}>): void

// Track changes on deployed environments
markEnvironmentChanged(environmentId: string): void

// Apply pending changes (triggers review → deployment)
applyEnvironmentChanges(environmentId: string): void
```

## UI Flow Changes

### 1. Questionnaire → Dashboard
**Current**: `/questionnaire` → `/application`  
**New**: `/questionnaire` → `/dashboard`

Changes to `app/questionnaire/page.tsx`:
- On "Continue" button click:
  - Call `updateProject()` with name, region, questionnaire answers, recommendations
  - Create project with `environments: []` (empty, no default dev)
  - Migrate `localStorage.getItem('github_pat')` to `project.githubPAT`
  - Navigate to `/dashboard`

### 2. Dashboard Empty State: Create First Environment
When `state.project && state.project.environments.length === 0`:

**UI Components**:
- Hero section: "Create Your First Environment"
- Form fields:
  - **Name** (text input, free-form)
  - **Type** (radio buttons: Non-Production / Production)
- Info box: "💡 We recommend descriptive names like 'production', 'staging', 'development', 'test'. Environment type helps Unhazzle apply appropriate safeguards."
- Primary button: "Create Environment"

**Validation**:
- Name: 3-63 chars, lowercase alphanumeric + hyphens
- Type: required selection
- No duplicate names within project

**On Submit**:
- Call `createEnvironment(name, type)`
- Show OCI registry connection modal

### 3. OCI Registry Connection Modal
Appears immediately after environment creation when `activeEnvironment.containers.length === 0`.

**Modal Structure**:
```
┌─────────────────────────────────────────────┐
│ Connect Your Container Registry             │
├─────────────────────────────────────────────┤
│ Connect to GitHub Container Registry to     │
│ quickly deploy your private images from     │
│ ghcr.io                                      │
│                                              │
│ [GitHub Personal Access Token]              │
│ [_________________________________]          │
│                                              │
│ Info: Token needs read:packages scope       │
│                                              │
│ [Skip]  [Fetch Images →]                    │
└─────────────────────────────────────────────┘
```

**Flow A: User Enters PAT**
1. Enter token, click "Fetch Images"
2. Store in `project.githubPAT`
3. Show mock image grid (from `MOCK_GHCR_IMAGES`)
4. Multi-select checkboxes (max 5)
5. Auto-generate container names from image names
6. "Continue" button creates containers via `createAppsFromImages()`

**Flow B: User Skips**
1. Click "Skip"
2. Close modal
3. Show "Add Container" / "Add Cache" buttons in dashboard

**Mock Image Grid**:
```
┌────────────────────────────────────────────┐
│ Select Images to Deploy (max 5)            │
├────────────────────────────────────────────┤
│ □ acme/ecommerce-shop:v2.1.0               │
│   Main e-commerce application              │
│   324 MB • Updated 2 days ago              │
│                                             │
│ □ acme/api-gateway:v1.5.2                  │
│   GraphQL API gateway service              │
│   156 MB • Updated 5 days ago              │
│                                             │
│ [2 selected]           [Continue →]        │
└────────────────────────────────────────────┘
```

### 4. Persistent Cost Header
Always visible in dashboard when environment is active:

```
┌─────────────────────────────────────────────────────┐
│ dev (non-prod)                                       │
│ Current: €45/mo • Max (scaled): €180/mo    [ℹ️]     │
└─────────────────────────────────────────────────────┘
```

**Cost Calculation**:
- Current = sum of all containers at min replicas + cache
- Max = sum of all containers at max replicas + cache
- Color coding:
  - Green: < €50
  - Yellow: €50-200
  - Orange: > €200

**Updates**:
- Real-time on any container/cache/resource change
- Uses existing `costCalculator.ts`

### 5. Add Container / Add Cache Modals

**Add Container Button** (left panel):
Opens modal:
```
┌─────────────────────────────────────────────┐
│ Add Container                                │
├─────────────────────────────────────────────┤
│ Image Source                                 │
│ ○ Public URL (Docker Hub, etc.)              │
│ ○ Private GitHub (ghcr.io)                   │
│                                              │
│ Container Name                               │
│ [_________________________________]          │
│                                              │
│ Image URL                                    │
│ [_________________________________]          │
│                                              │
│ [Cancel]                [Add Container]      │
└─────────────────────────────────────────────┘
```

**Add Cache Button** (left panel):
Opens cache-specific modal:
```
┌─────────────────────────────────────────────┐
│ Add Cache                                    │
├─────────────────────────────────────────────┤
│ Popular cache engines:                       │
│ • Redis (most versatile)                     │
│ • Valkey (Redis fork)                        │
│ • Memcached (simple key-value)               │
│                                              │
│ Cache Name                                   │
│ [_________________________________]          │
│                                              │
│ Image URL                                    │
│ [redis:7-alpine___________________]          │
│                                              │
│ [Cancel]                [Add Cache]          │
└─────────────────────────────────────────────┘
```

**Cache Defaults**:
- Volume auto-attached (persistence)
- Memory: 512MB
- No public exposure (internal only)
- Display with ⚡ icon in left panel

### 6. Left Panel Resource Tree
```
📁 ecommerce-shop (project)
  └─ 🌍 dev (non-prod) [○ pending changes]
      ├─ 📦 frontend
      ├─ 📦 api-gateway
      ├─ ⚡ redis-cache
      └─ ➕ Add Container / Add Cache
  └─ 🌍 production (prod)
      └─ ➕ Create your first app
```

**Visual Indicators**:
- Orange dot `○` = pending changes (deployed env only)
- Green checkmark `✓` = deployed
- Grey `—` = not deployed

### 7. Deploy Environment Button
**Appears when**: `activeEnvironment && !activeEnvironment.deployed && containers.length > 0`

**Location**: Dashboard header (top right)

**Label**: "Deploy Environment"

**Click Action**:
1. Navigate to `/review`
2. Show cost breakdown
3. "Deploy" button → `/deploying`
4. Simulate deployment progress
5. Return to `/dashboard`
6. Set `environment.deployed = true`, `deployedAt = now()`

### 8. Apply Changes Button
**Appears when**: `activeEnvironment && activeEnvironment.deployed && activeEnvironment.pendingChanges`

**Location**: Dashboard header (replaces Deploy button)

**Label**: "Apply Changes" (orange/yellow color)

**Click Action**:
1. Navigate to `/review` with delta mode
2. Show old vs new cost comparison:
```
┌─────────────────────────────────────────────┐
│ Cost Impact                                  │
├─────────────────────────────────────────────┤
│ Current:  €45/mo                             │
│ New:      €67/mo                             │
│ Delta:    +€22/mo (+48.8%)                   │
└─────────────────────────────────────────────┘
```
3. "Apply" button → `/deploying`
4. Return to `/dashboard`
5. Set `environment.pendingChanges = false`, update `deployedAt`

### 9. Production Environment Warnings
When `activeEnvironment.type === 'prod'`:

**Destructive Actions Require Confirmation**:
- Delete container
- Remove cache
- Scale down replicas
- Delete environment

**Confirmation Modal**:
```
┌─────────────────────────────────────────────┐
│ ⚠️ Delete Production Container?             │
├─────────────────────────────────────────────┤
│ You are about to delete a container from a  │
│ PRODUCTION environment. This action cannot   │
│ be undone.                                   │
│                                              │
│ Type CONFIRM to proceed:                     │
│ [_________________________________]          │
│                                              │
│ [Cancel]                [Delete]             │
└─────────────────────────────────────────────┘
```

**Apply Changes Extra Confirmation**:
- Show additional "Review Changes" screen
- Require explicit checkbox: "I have reviewed these changes to production"

## Integration Points

### Questionnaire Page
**File**: `app/questionnaire/page.tsx`

**Changes**:
```ts
const handleContinue = () => {
  // Create project
  updateProject({
    id: `proj-${Date.now()}`,
    name: projectName,
    slug: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    githubPAT: localStorage.getItem('github_pat') || undefined,
    environments: [], // Start with no environments
    envCount: 0,
    prEnvCount: 0,
    standardEnvCount: 0,
    prEnvs: {
      enabled: true,
      maxEnvs: 3,
      lifetimeHours: 2,
      autoDeleteOnPRClose: true
    }
  });
  
  // Store questionnaire and recommendations
  updateState({
    projectName,
    region,
    smartQuestionnaire: answers,
    recommendations: recs
  });
  
  // Navigate to dashboard
  router.push('/dashboard');
};
```

### Dashboard Page
**File**: `app/dashboard/page.tsx`

**New State Checks**:
```ts
const showEnvironmentCreation = state.project && state.project.environments.length === 0;
const showRegistryModal = activeEnvironment && 
                          !activeEnvironment.deployed && 
                          activeEnvironment.containers.length === 0;
const showDeployButton = activeEnvironment && 
                         !activeEnvironment.deployed && 
                         activeEnvironment.containers.length > 0;
const showApplyButton = activeEnvironment && 
                        activeEnvironment.deployed && 
                        activeEnvironment.pendingChanges;
```

**Container Configuration**:
- Clicking container in left panel opens right panel editor
- Show: name, image, port, health check, resources, env vars, volumes
- Changes set `pendingChanges = true` if environment is deployed

### Review Page
**File**: `app/review/page.tsx`

**Dual Mode**:
1. **Initial Deployment** (`!environment.deployed`):
   - Show total cost breakdown
   - "Deploy Environment" button
   
2. **Change Review** (`environment.deployed && pendingChanges`):
   - Show old vs new comparison
   - Delta calculations
   - "Apply Changes" button

### Deprecated Pages
**Files**: `app/application/page.tsx`, `app/resources/page.tsx`

**Add Redirect Logic**:
```ts
useEffect(() => {
  if (state.project) {
    router.push('/dashboard');
    // Show toast: "Configuration now happens in the dashboard"
  }
}, [state.project, router]);
```

Keep files for reference but add deprecation notice at top.

## DeploymentContext Changes
**File**: `lib/context/DeploymentContext.tsx`

### New Methods
```ts
const createEnvironment = (name: string, type: 'non-prod' | 'prod') => {
  if (!project) return;
  
  const newEnv: Environment = {
    id: `env-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    type,
    status: 'provisioning',
    deployed: false,
    pendingChanges: false,
    createdAt: new Date().toISOString(),
    containers: [],
    baseDomain: `${name}-${project.slug}.demo.unhazzle.io`,
    publicContainers: []
  };
  
  updateProject({
    environments: [...project.environments, newEnv],
    envCount: project.envCount + 1,
    standardEnvCount: project.standardEnvCount + 1
  });
  
  setActiveEnvironmentId(newEnv.id);
};

const createAppsFromImages = (environmentId: string, images: Array<{...}>) => {
  const env = project?.environments.find(e => e.id === environmentId);
  if (!env) return;
  
  const newContainers: ContainerConfig[] = images.map((img, idx) => ({
    id: `container-${Date.now()}-${idx}`,
    name: img.autoName,
    imageUrl: img.url,
    registryToken: img.url.startsWith('ghcr.io') ? project?.githubPAT : undefined,
    port: 3000, // Mocked auto-detection
    healthCheck: {
      protocol: 'HTTP',
      port: 3000,
      path: '/health',
      interval: '30s',
      timeout: '5s',
      retries: 3
    },
    exposure: 'public',
    resources: {
      cpu: recommendations?.cpuPerReplica || '1 vCPU',
      memory: recommendations?.memoryPerReplica || '2GB',
      replicas: {
        min: recommendations?.hpaMin || 2,
        max: recommendations?.hpaMax || 10
      }
    },
    serviceAccess: { database: false, cache: false },
    environmentVariables: []
  }));
  
  updateEnvironment(environmentId, {
    containers: [...env.containers, ...newContainers]
  });
};

const markEnvironmentChanged = (environmentId: string) => {
  const env = project?.environments.find(e => e.id === environmentId);
  if (env?.deployed) {
    updateEnvironment(environmentId, { pendingChanges: true });
  }
};
```

## Validation Rules

### Environment Name
- Regex: `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$`
- Length: 3-63 characters
- Must be unique within project

### Container Name
- Same as environment name validation
- Must be unique within environment

### GitHub PAT
- Optional (can skip)
- No validation beyond non-empty if provided
- Stored in project settings

### Production Confirmations
- Delete actions: Type "CONFIRM"
- Scale down: Show impact warning
- Apply changes: Explicit checkbox

## Cost Calculation Integration
**File**: `lib/utils/costCalculator.ts`

**Usage**:
```ts
import { calculateEnvironmentCost } from '@/lib/utils/costCalculator';

// Current cost (min replicas)
const currentCost = calculateEnvironmentCost(environment, 'min');

// Max cost (max replicas with HPA)
const maxCost = calculateEnvironmentCost(environment, 'max');

// Delta for changes
const oldCost = calculateEnvironmentCost(previousState, 'min');
const newCost = calculateEnvironmentCost(currentState, 'min');
const delta = newCost - oldCost;
```

## Mock Data
**Reuse from**: `app/application/page.tsx`

Copy `MOCK_GHCR_IMAGES` array to shared utility or inline in registry modal component.

## Demo Mode Notes
- All deployments simulated with progress bars
- No actual API calls to GitHub Container Registry
- Image metadata is mocked (ports, health checks auto-detected)
- Cost calculations use existing `costCalculator.ts` logic
- State persists in-memory only (refresh clears)
- GitHub PAT stored in project state (not sent anywhere)

## Acceptance Criteria

### 1. Questionnaire Navigation
- ✅ Completing questionnaire creates empty project
- ✅ Navigates to `/dashboard` instead of `/application`
- ✅ GitHub PAT migrated from localStorage to project
- ✅ No default environment created

### 2. Environment Creation UI
- ✅ Dashboard shows "Create First Environment" when no environments
- ✅ Form has name input and type radio buttons
- ✅ Info message recommends naming conventions
- ✅ Validation prevents invalid/duplicate names
- ✅ Creates environment and shows registry modal

### 3. OCI Registry Modal
- ✅ Appears after environment creation
- ✅ GitHub PAT input with skip option
- ✅ "Fetch Images" shows mock image grid
- ✅ Multi-select with max 5 limit
- ✅ Auto-generates container names from images
- ✅ "Continue" creates containers with smart defaults
- ✅ Skip closes modal and shows manual add buttons

### 4. Persistent Cost Header
- ✅ Shows current and max monthly cost
- ✅ Updates in real-time on configuration changes
- ✅ Color coded by cost tier
- ✅ Tooltip shows breakdown

### 5. Add Container/Cache
- ✅ "Add Container" button in left panel
- ✅ Modal with public/private radio, name, URL inputs
- ✅ "Add Cache" button shows cache-specific modal
- ✅ Cache suggestions: Redis, Valkey, Memcached
- ✅ Cache displayed with ⚡ icon, containers with 📦
- ✅ Added resources appear in left panel tree

### 6. Deploy Environment
- ✅ "Deploy Environment" button when not deployed + has containers
- ✅ Navigates to `/review` with cost breakdown
- ✅ Deploy button → `/deploying` → `/dashboard`
- ✅ Sets `deployed = true`, `deployedAt = timestamp`
- ✅ Button disappears after deployment

### 7. Apply Changes Workflow
- ✅ Changes to deployed environment set `pendingChanges = true`
- ✅ Orange dot indicator on environment in left panel
- ✅ "Apply Changes" button appears in header
- ✅ Navigates to `/review` in delta mode
- ✅ Shows old/new cost comparison
- ✅ Apply → `/deploying` → resets `pendingChanges`

### 8. Production Warnings
- ✅ Production environments show confirmation modals for destructive actions
- ✅ "Type CONFIRM" validation on delete operations
- ✅ Apply changes requires explicit review checkbox
- ✅ Warning banners on prod environment header

### 9. Database Removal
- ✅ Database field removed from `Environment` interface
- ✅ No database UI in dashboard or modals
- ✅ Info box explains: "Add database connection strings as environment variables"
- ✅ Container editor shows env var section

### 10. Page Deprecation
- ✅ `/application` redirects to `/dashboard` if project exists
- ✅ `/resources` redirects to `/dashboard` if project exists
- ✅ Toast notification explains new flow
- ✅ `/review` kept for cost breakdown

### 11. Cost Transparency
- ✅ Real-time cost in persistent header
- ✅ Per-container cost in resource tree
- ✅ Environment total in left panel
- ✅ Review page breakdown before deployment
- ✅ Delta view for post-deployment changes

## Non-Functional Requirements
- TypeScript strict mode passes
- No console errors on navigation
- Responsive design (mobile + desktop)
- Existing dashboard functionality preserved (Logs, Metrics, Settings tabs)
- localStorage backup/restore still works
- Build completes without errors

## Future Extension Hooks
- Multiple OCI registries (Docker Hub, custom)
- Real image inspection API calls
- PR environment UI (create/manage from dashboard)
- Multi-project support
- Cost alerts and budgets
- Rollback to previous environment states

---
End of spec.
