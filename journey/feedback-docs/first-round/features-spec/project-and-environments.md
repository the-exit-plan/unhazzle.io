# Project and Environment Configuration Specification

**Status**: 🟡 IN PROGRESS (MVP Definition Phase)

**Feature**: Complete Project and Environment model with PR environment support

**Source**: Jeroen/Eveline feedback, architectural foundation for multi-environment workflows

**Priority**: MVP Foundation

---

## Overview

Define the complete Project and Environment hierarchy as the foundation for all Unhazzle deployments. This includes:

- **Projects**: Logical containers grouping related environments, applications, and resources
- **Environments**: Isolated deployment contexts (dev, staging, prod, PR environments)
- **PR Environments**: Ephemeral, cost-controlled preview environments triggered by pull requests
- **Environment Actions**: Clone, promote, and delete workflows

**Key Principles**:
- Single source of truth: One `unhazzle.yaml` per project defines all environments
- Cost control: PR environments have strict lifetime and count limits
- Developer velocity: Fast PR preview environments without manual setup
- No organization hierarchy in MVP (defer to later phases)

**Constraints**:
- PR environments are created via GitHub Action only (not from UI)
- Exposure and resources defined by `unhazzle.yaml` manifest
- PR environments have restricted actions (delete only, no clone/promote)
- Automatic cleanup on PR close or lifetime expiry

---

## Data Model

### Project

**Identity**:
- `id`: string (generated, e.g., `proj-abc123`)
- `name`: string (user-provided; if empty, auto-generated as `project-<shortid>`)
- `slug`: string (kebab-case derived from name, 3-63 chars, lowercase alphanumeric + hyphens, must start/end with alphanumeric)
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

**Configuration Repository Linkage**:
- `configRepo`: object (optional but recommended)
  - `provider`: 'github' | 'gitlab' (MVP: 'github' only)
  - `repo`: string (format: 'owner/repo', e.g., 'acme/shop-config')
  - `defaultBranch`: string (default: 'main')
  - `manifestPath`: string (default: 'unhazzle.yaml')
  
**PR Environment Settings**:
- `prEnvs`: object
  - `enabled`: boolean (default: `true`)
  - `maxEnvs`: integer (default: 3, min: 1, max: 20)
  - `lifetimeHours`: integer (default: 1, min: 1, max: 8)
  - `autoDeleteOnPRClose`: boolean (always `true` in MVP, not user-configurable)

**Derived/Computed**:
- `envCount`: integer (total environments including PR envs)
- `prEnvCount`: integer (count of active PR environments)
- `standardEnvCount`: integer (count of standard environments)

**Validation Rules**:
- `name`: 1-100 characters, UTF-8 allowed
- `slug`: Must be unique across user's projects, 3-63 chars, lowercase alphanumeric + hyphens only
- `prEnvs.maxEnvs`: 1-20 inclusive
- `prEnvs.lifetimeHours`: 1-8 inclusive

**Example**:
```typescript
{
  id: "proj-shop-2025",
  name: "E-commerce Shop",
  slug: "ecommerce-shop",
  createdAt: "2025-11-09T10:00:00Z",
  updatedAt: "2025-11-09T12:30:00Z",
  configRepo: {
    provider: "github",
    repo: "acme/shop-config",
    defaultBranch: "main",
    manifestPath: "unhazzle.yaml"
  },
  prEnvs: {
    enabled: true,
    maxEnvs: 3,
    lifetimeHours: 2,
    autoDeleteOnPRClose: true
  },
  envCount: 5,
  prEnvCount: 2,
  standardEnvCount: 3
}
```

---

### Environment

**Identity**:
- `id`: string (generated, e.g., `env-dev-xyz789` or `env-pr-128-abc`)
- `name`: string (e.g., 'dev', 'staging', 'prod', 'feature-fix-carts-pr-128')
- `slug`: string (kebab-case, same rules as project slug)
- `type`: 'standard' | 'pr' (automatically set)
- `createdAt`: ISO 8601 timestamp

**Lifecycle**:
- `status`: 'provisioning' | 'active' | 'deleting' | 'deleted' | 'expired'
- `expiresAt`: ISO 8601 timestamp (only for type='pr'; computed as `createdAt + project.prEnvs.lifetimeHours`)

**PR Metadata** (only when type='pr'):
- `prSource`: object
  - `provider`: 'github'
  - `repo`: string ('owner/repo' of the service that triggered the PR)
  - `prNumber`: integer
  - `prTitle`: string (for display; environment name is stable)
  - `prBranch`: string
  - `commitSha`: string (short or full)
- `triggeredBy`: 'pull_request_opened' | 'pull_request_reopened' | 'pull_request_synchronize'
- `serviceOverride`: object (identifies which service image was overridden)
  - `serviceName`: string (e.g., 'frontend')
  - `image`: string (e.g., 'ghcr.io/acme/shop-frontend:pr-128-abc123')

**Configuration Snapshot**:
- `containers`: ContainerConfig[] (as defined in DeploymentContext)
- `database`: DatabaseConfig | undefined
- `cache`: CacheConfig | undefined
- `envVars`: EnvironmentVariable[] (project/environment-level variables; future enhancement)

**Access/Exposure**:
- `baseDomain`: string (computed: `{env-slug}.{project-slug}.demo.unhazzle.io`)
- `publicContainers`: string[] (list of container names with exposure='public')

**Actions** (UI/CLI available actions based on type):
- **Standard environments**: Clone, Promote, Delete
- **PR environments**: Delete only

**Validation Rules**:
- `name`: 1-100 characters
- `slug`: Must be unique within project, 3-63 chars
- `type`: Automatically set (no user override)
- `expiresAt`: Required for PR envs, must be > createdAt

**Example (Standard Environment)**:
```typescript
{
  id: "env-dev-001",
  name: "dev",
  slug: "dev",
  type: "standard",
  createdAt: "2025-11-01T10:00:00Z",
  status: "active",
  containers: [...],
  database: {...},
  cache: {...},
  baseDomain: "dev.ecommerce-shop.demo.unhazzle.io",
  publicContainers: ["frontend"]
}
```

**Example (PR Environment)**:
```typescript
{
  id: "env-pr-128-abc",
  name: "feature-fix-carts-pr-128",
  slug: "feature-fix-carts-pr-128",
  type: "pr",
  createdAt: "2025-11-09T14:00:00Z",
  status: "active",
  expiresAt: "2025-11-09T16:00:00Z",
  prSource: {
    provider: "github",
    repo: "acme/shop-frontend",
    prNumber: 128,
    prTitle: "Fix shopping cart calculation",
    prBranch: "feature/fix-carts",
    commitSha: "a3b4c5d"
  },
  triggeredBy: "pull_request_opened",
  serviceOverride: {
    serviceName: "frontend",
    image: "ghcr.io/acme/shop-frontend:pr-128-a3b4c5d"
  },
  containers: [...],
  database: {...},
  cache: {...},
  baseDomain: "feature-fix-carts-pr-128.ecommerce-shop.demo.unhazzle.io",
  publicContainers: ["frontend"]
}
```

---

## unhazzle.yaml Manifest Schema

### Purpose
Single source of truth defining:
- Project metadata and PR environment policies
- Service repositories and registries (for multi-repo setups)
- Environment configurations (containers, resources, exposure)
- PR-specific resource overrides

### Supported Deployment Patterns
1. **Multi-repo with central config repo** (Recommended)
   - One repo holds canonical `unhazzle.yaml`
   - Each service repo builds/publishes images
   - PR workflows in service repos override specific service images
   
2. **Monorepo**
   - All services + `unhazzle.yaml` in one repo
   - Simpler workflow, single PR creates PR environment

### Schema (v1)

```yaml
unhazzleVersion: 1

project:
  name: my-ecommerce-shop
  
  # Optional: PR environment configuration
  prEnvs:
    enabled: true
    maxEnvs: 3
    lifetimeHours: 1
    autoDeleteOnPRClose: true  # Always true in MVP
  
  # Optional: Configuration repo reference (for documentation/tooling)
  configRepo:
    provider: github
    repo: the-exit-plan/unhazzle-project-config
    manifestPath: unhazzle.yaml

# Optional: Service metadata for multi-repo setups
services:
  - name: frontend
    repo: the-exit-plan/shop-frontend
    registry: ghcr.io/acme/shop-frontend
  - name: backend
    repo: the-exit-plan/shop-backend
    registry: ghcr.io/acme/shop-backend

# Environment definitions
environments:
  # Standard environments (manually created via UI/CLI)
  standard:
    dev:
      containers:
        - name: frontend
          image: ghcr.io/acme/shop-frontend:stable
          port: 3000
          exposure: public  # 'public' | 'private'
          domain: shop-dev.acme.com  # Optional custom domain
          healthCheck:
            protocol: HTTP  # HTTP | TCP | gRPC
            port: 3000
            path: /health
            interval: 30s
            timeout: 5s
            retries: 3
          resources:
            cpu: "0.5"
            memory: "512MB"
            replicas:
              min: 2
              max: 4
          volume:  # Optional
            mountPath: /app/uploads
            sizeGB: 50
            autoScale: true
            backupFrequency: disabled  # disabled | hourly | daily | weekly
            deleteWithContainer: false
          envVars:
            - key: NEXT_PUBLIC_API_URL
              value: https://api-dev.acme.com
            - key: STRIPE_PUBLIC_KEY
              value: pk_test_...
              masked: true
              
        - name: backend
          image: ghcr.io/acme/shop-backend:stable
          port: 8080
          exposure: private
          healthCheck:
            protocol: HTTP
            port: 8080
            path: /health
            interval: 30s
            timeout: 5s
            retries: 3
          resources:
            cpu: "1"
            memory: "1GB"
            replicas:
              min: 2
              max: 10
          serviceAccess:
            database: true
            cache: true
          envVars:
            - key: STRIPE_SECRET_KEY
              value: sk_test_...
              masked: true
            - key: JWT_SECRET
              value: super-secret-key
              masked: true
      
      # Optional: Shared resources
      database:
        engine: postgres  # postgres | mysql | mongodb
        version: "15"
        cpu: "1"
        memory: "2GB"
        storage: "100GB"
        backups:
          enabled: true
          retention: "7d"
          frequency: daily  # hourly | daily | weekly
        replicas: "1"  # HA: "2" or "3"
      
      cache:
        engine: redis  # redis | memcached
        version: "7"
        memory: "512MB"
        evictionPolicy: allkeys-lru
        persistence: disabled  # disabled | rdb | aof
    
    # Additional standard environments can be defined
    staging:
      containers: [...]  # Similar structure
      database: [...]
      cache: [...]
    
    prod:
      containers: [...]
      database: [...]
      cache: [...]

  # PR environment overrides (applied to all PR environments)
  prOverrides:
    containers:
      # Apply to all containers
      all:
        resources:
          cpu: "0.25"
          memory: "256MB"
          replicas:
            min: 1
            max: 1
      
      # Service-specific overrides (optional)
      frontend:
        resources:
          cpu: "0.5"
          memory: "512MB"
    
    database:
      cpu: "0.5"
      memory: "1GB"
      storage: "20GB"
      backups:
        enabled: false
    
    cache:
      memory: "128MB"
```

### Key Fields Explained

**project.prEnvs**:
- Controls PR environment creation and lifecycle
- `maxEnvs`: Hard cap on concurrent PR environments (prevents cost runaway)
- `lifetimeHours`: Auto-delete after X hours (even if PR still open)
- Future: Add `extendOnActivity` to reset timer on new commits

**services**:
- Optional metadata section for multi-repo setups
- Helps tooling (GitHub Actions) know which service to override
- Not used for deployment directly (containers.image is the source of truth)

**environments.standard**:
- Named standard environments (dev, staging, prod, etc.)
- Created manually via UI/CLI
- Support Clone and Promote actions

**environments.prOverrides**:
- Applied to all PR environments on top of `standard.dev` baseline
- Typical pattern: Reduce resources to minimum for cost control
- Can override per-service or apply to all containers

**container.exposure**:
- `public`: Accessible from internet, requires domain or uses default subdomain
- `private`: Internal only, accessible via internal DNS (`{container}.{env}.{project}`)

**container.serviceAccess**:
- Explicit opt-in for database/cache access
- Generates auto-injected environment variables (e.g., `UNHAZZLE_POSTGRES_URL`)

---

## PR Environment Lifecycle

### Creation Flow (GitHub Action)

**Trigger**: Pull request opened, reopened, or synchronized in a service repo

**GitHub Action Workflow** (in service repo):
```yaml
name: Unhazzle PR Environment
on:
  pull_request:
    types: [opened, reopened, synchronize]

jobs:
  deploy-pr-env:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Build and push PR image
        run: |
          docker build -t ghcr.io/acme/shop-frontend:pr-${{ github.event.pull_request.number }}-${{ github.sha }} .
          docker push ghcr.io/acme/shop-frontend:pr-${{ github.event.pull_request.number }}-${{ github.sha }}
      
      - name: Deploy to Unhazzle PR Environment
        uses: unhazzle/deploy-pr-env@v1
        with:
          unhazzle-token: ${{ secrets.UNHAZZLE_API_TOKEN }}
          project-slug: ecommerce-shop
          service-name: frontend
          image-override: ghcr.io/acme/shop-frontend:pr-${{ github.event.pull_request.number }}-${{ github.sha }}
          pr-number: ${{ github.event.pull_request.number }}
          pr-branch: ${{ github.head_ref }}
          pr-title: ${{ github.event.pull_request.title }}
          commit-sha: ${{ github.sha }}
```

**Unhazzle Action Logic** (`unhazzle/deploy-pr-env@v1`):
1. **Validate project**:
   - Project exists
   - `prEnvs.enabled = true`
   - `prEnvCount < maxEnvs`
   - Config repo accessible and manifest exists

2. **Load manifest**:
   - Fetch `unhazzle.yaml` from config repo (default branch)
   - Validate schema and required fields
   - Parse `environments.standard.dev` as baseline
   - Apply `environments.prOverrides` on top

3. **Override service image**:
   - Find container matching `service-name` in manifest
   - Replace `image` field with `image-override` parameter
   - Keep all other container config (port, exposure, resources, etc.)

4. **Generate environment**:
   - type: 'pr'
   - name: Sanitized PR title + `-pr-{number}`
   - slug: Kebab-case name
   - expiresAt: `now + lifetimeHours`
   - prSource: PR metadata from action inputs
   - serviceOverride: Record which service was overridden

5. **Provision environment**:
   - Deploy containers with overridden image
   - Provision database/cache if defined (with PR overrides)
   - Generate internal DNS and public domains
   - Inject auto-generated environment variables

6. **Post status**:
   - Comment on PR with environment URL and details
   - Set GitHub commit status check (✅ Environment ready)

**Example PR Comment**:
```markdown
🚀 **PR Environment Ready**

Your changes are deployed and ready for testing:

**Environment**: feature-fix-carts-pr-128
**URL**: https://feature-fix-carts-pr-128.ecommerce-shop.demo.unhazzle.io
**Expires**: Nov 9, 2025 at 16:00 UTC (2 hours remaining)

**What changed**: 
- `frontend` updated to `ghcr.io/acme/shop-frontend:pr-128-a3b4c5d`

**Services**:
- Frontend: https://feature-fix-carts-pr-128.ecommerce-shop.demo.unhazzle.io
- Backend: Internal (private)
- Database: PostgreSQL 15 (20GB)
- Cache: Redis 7 (128MB)

[View Dashboard](https://app.unhazzle.io/projects/ecommerce-shop/envs/feature-fix-carts-pr-128)
```

### Cap Reached Behavior

**Scenario**: User opens PR but `prEnvCount === maxEnvs`

**Action Result**:
- GitHub Action exits with failure status
- Error message posted as PR comment:
  ```
  ❌ **PR Environment Creation Failed**
  
  Cannot create new PR environment: limit reached (3/3 active).
  
  **Active PR Environments**:
  - PR #126: feature-new-checkout-pr-126 (expires in 45 minutes)
  - PR #127: bugfix-payment-pr-127 (expires in 1.5 hours)
  - PR #125: refactor-api-pr-125 (expires in 30 minutes)
  
  Delete an environment or wait for expiration to create a new one.
  
  [View Environments](https://app.unhazzle.io/projects/ecommerce-shop/envs)
  ```
- Commit status check: ⚠️ PR environment cap reached

**Manual Override** (via UI):
- User can delete an existing PR environment
- Re-run the failed GitHub Action (via PR UI or push new commit)

### Update Flow (New Commits to PR)

**Trigger**: Pull request synchronized (new commits pushed)

**Behavior**:
1. GitHub Action runs again (same workflow)
2. Builds new image with updated commit SHA
3. Calls Unhazzle deploy action with new image
4. Unhazzle updates existing PR environment:
   - Replaces container image with new build
   - Redeploys containers (simulated in prototype)
   - **Does NOT extend `expiresAt`** (keeps original expiration)
   - Updates `commitSha` in `prSource`
5. Posts update comment on PR:
   ```
   🔄 **PR Environment Updated**
   
   Latest changes deployed to: https://feature-fix-carts-pr-128...
   
   Commit: a3b4c5d → f7e8d9a
   Still expires: Nov 9, 2025 at 16:00 UTC (1.5 hours remaining)
   ```

### Deletion Flow

**Trigger 1: PR Closed or Merged**
- GitHub webhook (or action on `pull_request.closed`)
- Unhazzle immediately deletes PR environment:
  - status: 'deleting' → 'deleted'
  - Removes all resources (containers, volumes, DNS)
  - Ignores remaining lifetime
- Posts final comment:
  ```
  🗑️ **PR Environment Deleted**
  
  Environment deleted automatically (PR closed).
  ```

**Trigger 2: Lifetime Expired**
- Background job runs every 10 minutes (simulated in prototype)
- Checks all PR environments where `now > expiresAt`
- For each expired:
  - status: 'expired' → 'deleted'
  - Removes all resources
  - Posts comment on PR (if still open):
    ```
    ⏰ **PR Environment Expired**
    
    Environment deleted after lifetime limit (2 hours).
    Push a new commit to create a fresh environment.
    ```

**Trigger 3: Manual Delete (UI/CLI)**
- User clicks "Delete" in environment list or dashboard
- Confirmation modal:
  ```
  Delete PR Environment?
  
  Environment: feature-fix-carts-pr-128
  PR: #128 in acme/shop-frontend
  URL: https://feature-fix-carts-pr-128...
  
  This will remove all resources. This cannot be undone.
  
  [Cancel] [Delete Environment]
  ```
- On confirm: Immediate deletion

### Reopen Flow

**Scenario**: PR closed, then reopened

**Behavior**:
- Previous PR environment already deleted (auto-delete on close)
- GitHub Action treats reopened as new `pull_request_opened` event
- If under cap: Provisions fresh environment with new ID
  - New `createdAt` and `expiresAt`
  - Same PR number but new environment instance
- If at cap: Deny with cap message

---

## Standard Environment Actions

### Clone

**Purpose**: Duplicate an environment's configuration to create a new environment

**Trigger**: User clicks "Clone" on standard environment in UI or runs CLI command

**Flow**:
1. User selects source environment (e.g., 'dev')
2. Prompted for new environment name (e.g., 'staging')
3. System validates:
   - Name is unique within project
   - Slug doesn't conflict
4. Copies configuration:
   - All container definitions (image, resources, exposure, env vars)
   - Database/cache configuration
   - Service access settings
5. Does NOT copy:
   - Runtime metrics or history
   - Volumes (new volumes provisioned if defined)
   - Logs or events
6. New environment starts with status 'provisioning' → 'active'
7. User redirected to new environment dashboard

**UI**:
```
┌─────────────────────────────────────────────┐
│ Clone Environment                           │
├─────────────────────────────────────────────┤
│ Source: dev                                 │
│                                             │
│ New Environment Name:                       │
│ [staging                          ]         │
│                                             │
│ What will be cloned:                        │
│ ✓ 2 containers (frontend, backend)         │
│ ✓ PostgreSQL database (100 GB)             │
│ ✓ Redis cache (512 MB)                     │
│ ✓ Environment variables                    │
│                                             │
│ ℹ️ Runtime data and logs are not cloned    │
│                                             │
│ Estimated cost: €169/month                  │
│                                             │
│ [Cancel] [Clone Environment]                │
└─────────────────────────────────────────────┘
```

### Promote

**Purpose**: Copy configuration from one environment to another (e.g., staging → prod)

**Trigger**: User clicks "Promote" on source environment

**Flow**:
1. User selects source environment (e.g., 'staging')
2. Prompted to select target environment (e.g., 'prod')
3. Shows diff of what will change:
   - Container image versions
   - Resource allocation differences
   - Environment variables added/removed/changed
4. User confirms promotion
5. System applies configuration to target:
   - Updates container images (simulated redeploy in prototype)
   - Adjusts resources if needed
   - Merges/updates environment variables
6. Target environment redeployed with new config
7. Event logged: "Promoted staging → prod by user@example.com"

**UI**:
```
┌─────────────────────────────────────────────┐
│ Promote Environment                         │
├─────────────────────────────────────────────┤
│ Source: staging                             │
│ Target: prod                                │
│                                             │
│ Changes to be applied:                      │
│                                             │
│ frontend:                                   │
│   image: v2.1.0 → v2.2.0                   │
│                                             │
│ backend:                                    │
│   image: v2.1.0 → v2.2.0                   │
│   cpu: 1 core → 2 cores                    │
│   replicas: 2-10 → 5-20                    │
│                                             │
│ Environment variables:                      │
│   + API_RATE_LIMIT: 1000                   │
│   ~ LOG_LEVEL: debug → info                │
│                                             │
│ ⚠️ This will redeploy the prod environment │
│                                             │
│ [Cancel] [Promote to prod]                  │
└─────────────────────────────────────────────┘
```

**Validation**:
- Can only promote between standard environments
- Cannot promote to/from PR environments
- Target must exist (no auto-create in MVP)

### Delete

**Purpose**: Remove an environment and all its resources

**Trigger**: User clicks "Delete" on environment

**Flow**:
1. Confirmation modal shows:
   - Environment name and type
   - Resources to be deleted (containers, database, cache, volumes)
   - Cost savings
   - Warning about data loss
2. User must type environment name to confirm (for prod environments)
3. On confirm:
   - status: 'deleting'
   - Remove all containers
   - Delete database/cache if not shared
   - Handle volumes per lifecycle rules (persist or delete)
   - Remove DNS records
   - status: 'deleted'
4. Environment marked deleted but retained in history (for audit)

**UI (Standard Environment)**:
```
┌─────────────────────────────────────────────┐
│ Delete Environment                          │
├─────────────────────────────────────────────┤
│ ⚠️ Delete "prod" environment?              │
│                                             │
│ This will permanently delete:               │
│ • 2 containers (frontend, backend)          │
│ • PostgreSQL database (100 GB)             │
│ • Redis cache (512 MB)                     │
│ • All environment variables                 │
│ • Persistent volumes (if configured)        │
│                                             │
│ Cost savings: €169/month                    │
│                                             │
│ ⚠️ This action cannot be undone            │
│                                             │
│ Type "prod" to confirm:                     │
│ [                              ]            │
│                                             │
│ [Cancel] [Delete Environment]               │
└─────────────────────────────────────────────┘
```

**UI (PR Environment - Simplified)**:
```
┌─────────────────────────────────────────────┐
│ Delete PR Environment                       │
├─────────────────────────────────────────────┤
│ Environment: feature-fix-carts-pr-128       │
│ PR: #128 in acme/shop-frontend              │
│                                             │
│ This will delete all resources.             │
│                                             │
│ [Cancel] [Delete]                           │
└─────────────────────────────────────────────┘
```

---

## UI/UX Implementation for Prototype

**Design Principle**: All new Project and Environment features MUST follow the existing dashboard editing pattern:
- Left sidebar for hierarchical navigation
- Right panel for detailed editing
- Draft state with "Show Changes" + "Apply" buttons
- Confirmation modal before applying changes
- Real-time status updates during transitions
- Consistent styling with current dashboard components

### Project Settings Page (New)

**Location**: `/projects/{slug}/settings`

**Important**: Project settings follow the same split-view pattern as the Overview tab

**Layout**: Two-column layout (consistent with existing dashboard)

**Left Sidebar**:
```
⚙️ Project Settings

┌─────────────────────────┐
│ General                 │ ← Active
├─────────────────────────┤
│ Repository Integration  │
├─────────────────────────┤
│ PR Environments         │
├─────────────────────────┤
│ Cost & Billing          │
└─────────────────────────┘
```

**Right Panel (General section)**:
```
General Settings

Project Name: [E-commerce Shop                    ]
Project Slug: ecommerce-shop (read-only 🔒)
Created: Nov 1, 2025

[Show Changes] [Apply]
```

**Right Panel (Repository Integration section)**:
```
Repository Integration

Provider:     [GitHub ▾]
Repository:   [the-exit-plan/shop-config          ]
Branch:       [main                               ]
Manifest:     [unhazzle.yaml                      ]

Status: ✓ Connected
Last sync: 5 minutes ago

[Test Connection] [Show Changes] [Apply]
```

**Right Panel (PR Environments section)**:
```
PR Environment Settings

Enable PR Environments:  [✓] Enabled

Max concurrent PR envs:  [3  ] (1-20)
  💡 Prevents cost runaway from forgotten environments

PR lifetime:             [2  ] hours (1-8)
  💡 Auto-delete after this duration, even if PR is open

Auto-delete on PR close: ✓ Enabled (not configurable)

[Show Changes] [Apply]
```

**State Management**: Uses same draft pattern as container/database/cache editing
- Changes staged in memory until "Apply" clicked
- "Show Changes" reveals diff modal
- Apply triggers confirmation modal with impact assessment

### Environments List Page (Enhanced)

**Location**: `/projects/{slug}/environments`

**Important**: Environment list integrates into the existing dashboard Overview tab pattern

**Integration with Existing Dashboard**:

The environments list becomes part of the left sidebar in the Overview tab, following the same hierarchical navigation pattern already established:

**Left Sidebar (Enhanced)**:
```
📦 E-commerce Shop                    ← Project header
   3 environments

   🔧 dev [Standard] ● Active         ← Expandable
      🚀 frontend
      🚀 backend
      💾 PostgreSQL
      ⚡ Redis

   🔧 staging [Standard] ● Active     ← Collapsed
   
   🔧 prod [Standard] ● Active        ← Collapsed
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   PR Environments (2/3)
   
   🔧 feature-fix-carts-pr-128
      [PR #128] ● Active
      ⏰ Expires in 1.5h
      [Delete]
   
   🔧 bugfix-payment-pr-127
      [PR #127] ● Active
      ⏰ Expires in 45m
      [Delete]
```

**Right Panel Changes Based on Selection**:
- Click environment name → shows environment-level info + containers/resources
- Click container → shows container editor (existing component)
- Click database → shows database editor (existing component)
- Click cache → shows cache editor (existing component)

**Key Design Decisions**:
- Reuse existing left sidebar navigation pattern
- Type badges: [Standard] or [PR #N]
- Status indicators: ● Active, ⚠️ Provisioning, 🔴 Deleting
- Expiration timer for PR envs (inline, compact)
- PR count "2/3" shows usage vs cap
- Delete action inline for PR envs (no modal needed, just confirmation)
- Standard env actions (Clone, Promote) shown in right panel when selected

### Environment Details Page (Enhanced)

**Location**: Integrated into Overview tab's right panel

**Standard Environment - Right Panel Content**:

When a standard environment is selected in the left sidebar, the right panel shows:

```
┌─────────────────────────────────────────────────────────────┐
│ dev                                    [Standard] ● Active  │
│ https://dev.ecommerce-shop.demo.unhazzle.io                │
│                                                             │
│ Actions: [Clone] [Promote] [Delete]                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Environment Information                                     │
│                                                             │
│ Created: Nov 1, 2025                                       │
│ Status: Running (all resources healthy)                    │
│ Cost: €169/month                                           │
│                                                             │
│ Resources in this environment:                             │
│ • 2 containers (frontend, backend)                         │
│ • PostgreSQL (100GB)                                       │
│ • Redis (512MB)                                            │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│ 💡 Click on a resource in the sidebar to edit its config  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**PR Environment - Right Panel Content**:

When a PR environment is selected, additional PR metadata is shown:

```
┌─────────────────────────────────────────────────────────────┐
│ feature-fix-carts-pr-128               [PR #128] ● Active   │
│ https://feature-fix-carts-pr-128.ecommerce-shop...         │
│                                                             │
│ Actions: [Delete]                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🔀 Pull Request Details                               │   │
│ │                                                       │   │
│ │ PR: #128 - Fix shopping cart calculation             │   │
│ │ Repo: acme/shop-frontend                              │   │
│ │ Branch: feature/fix-carts                             │   │
│ │ Commit: a3b4c5d                                       │   │
│ │ Service Override: frontend                            │   │
│ │                                                       │   │
│ │ ⏰ Expires: Nov 9 at 16:00 (1.5 hours remaining)     │   │
│ │ 🔄 Last updated: 15 minutes ago (new commit)         │   │
│ │                                                       │   │
│ │ [View PR on GitHub →]                                │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Resources in this environment:                             │
│ • 2 containers (frontend [PR override], backend)           │
│ • PostgreSQL (20GB, minimum preset)                        │
│ • Redis (128MB, minimum preset)                            │
│                                                             │
│ Cost: €28/month (prorated: ~€0.08 for 2 hours)            │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│ 💡 Click on a container to view its configuration         │
│ (PR environments use minimum resources by default)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design Consistency**:
- Uses same card-based layout as existing resource editors
- Same action button styling (purple for primary actions)
- Consistent information hierarchy
- Status badges match existing container status indicators

### Create Environment Modal (Standard Only)

**Trigger**: Click "Create Environment" button in project header (next to "Create Project")

**Modal follows existing confirmation modal pattern**:

```
┌─────────────────────────────────────────────┐
│ Create New Environment                      │
├─────────────────────────────────────────────┤
│                                             │
│ Environment Name:                           │
│ [staging                          ]         │
│                                             │
│ Clone from existing environment (optional): │
│ [Select environment ▾]                      │
│   • dev                                     │
│   • None (empty environment)                │
│                                             │
│ ℹ️ Configure containers and resources      │
│    after creation using the Overview tab   │
│                                             │
│ [Cancel] [Create Environment]               │
└─────────────────────────────────────────────┘
```

**Flow After Creation**:
1. User clicks "Create Environment"
2. Brief loading state (500ms simulated)
3. Modal closes
4. Left sidebar updates to show new environment
5. New environment auto-selected in sidebar
6. Right panel shows environment info with prompt:
   ```
   ✅ Environment "staging" created successfully
   
   Next steps:
   • Add containers from the questionnaire flow
   • Or clone containers from another environment
   
   [Start Questionnaire] [Clone from dev]
   ```

**Design Consistency**:
- Same modal styling as confirmation modals
- Input fields match existing form styling
- Button colors consistent with Apply/Cancel pattern

### Clone/Promote/Delete Actions

**Important**: All environment actions follow the existing confirmation modal pattern

**Clone Action - Triggered from right panel when standard env selected**:

```
┌─────────────────────────────────────────────┐
│ Clone Environment                           │
├─────────────────────────────────────────────┤
│ Source: dev                                 │
│                                             │
│ New Environment Name:                       │
│ [staging                          ]         │
│                                             │
│ What will be cloned:                        │
│ ✓ 2 containers (frontend, backend)         │
│ ✓ PostgreSQL database (100 GB)             │
│ ✓ Redis cache (512 MB)                     │
│ ✓ Environment variables                    │
│                                             │
│ ℹ️ Runtime data and logs are not cloned    │
│                                             │
│ Estimated cost: €169/month                  │
│                                             │
│ [Cancel] [Clone Environment]                │
└─────────────────────────────────────────────┘
```

**Promote Action - Shows diff like existing "Show Changes" pattern**:

```
┌─────────────────────────────────────────────┐
│ Promote Environment                         │
├─────────────────────────────────────────────┤
│ Source: staging                             │
│ Target: prod                                │
│                                             │
│ Changes to be applied:                      │
│                                             │
│ frontend:                                   │
│   image: v2.1.0 → v2.2.0                   │
│                                             │
│ backend:                                    │
│   image: v2.1.0 → v2.2.0                   │
│   cpu: 1 core → 2 cores                    │
│   replicas: 2-10 → 5-20                    │
│                                             │
│ Environment variables:                      │
│   + API_RATE_LIMIT: 1000                   │
│   ~ LOG_LEVEL: debug → info                │
│                                             │
│ ⚠️ This will redeploy the prod environment │
│                                             │
│ Impact Assessment:                          │
│ ⏱️ Estimated time: ~3 minutes              │
│ ✅ Zero-downtime rolling deployment         │
│ 💰 Cost impact: +€45/month                  │
│                                             │
│ [Cancel] [Promote to prod]                  │
└─────────────────────────────────────────────┘
```

**Delete Action - Same pattern as existing delete confirmations**:

**For Standard Environment**:
```
┌─────────────────────────────────────────────┐
│ Delete Environment                          │
├─────────────────────────────────────────────┤
│ ⚠️ Delete "prod" environment?              │
│                                             │
│ This will permanently delete:               │
│ • 2 containers (frontend, backend)          │
│ • PostgreSQL database (100 GB)             │
│ • Redis cache (512 MB)                     │
│ • All environment variables                 │
│ • Persistent volumes (if configured)        │
│                                             │
│ Cost savings: €169/month                    │
│                                             │
│ ⚠️ This action cannot be undone            │
│                                             │
│ Type "prod" to confirm:                     │
│ [                              ]            │
│                                             │
│ [Cancel] [Delete Environment]               │
└─────────────────────────────────────────────┘
```

**For PR Environment (Simplified, can delete inline)**:
```
┌─────────────────────────────────────────────┐
│ Delete PR Environment                       │
├─────────────────────────────────────────────┤
│ Environment: feature-fix-carts-pr-128       │
│ PR: #128 in acme/shop-frontend              │
│                                             │
│ This will delete all resources.             │
│                                             │
│ [Cancel] [Delete]                           │
└─────────────────────────────────────────────┘
```

**Progress Feedback**: After confirmation, use same inline progress pattern as existing apply changes:

```
🔄 Cloning environment...

✅ Validating configuration
✅ Provisioning containers (2/2)
⏳ Setting up database
⏳ Configuring cache

Current status: 60% complete
```

---

## Validation Rules

### Project

**name**:
- Required if user doesn't accept auto-generated
- 1-100 characters
- UTF-8 allowed (for international users)

**slug**:
- 3-63 characters
- Lowercase letters (a-z), numbers (0-9), hyphens (-) only
- Must start and end with alphanumeric character
- Must be unique across user's projects
- Auto-generated from name if not provided
- Pattern: `/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/`

**prEnvs.maxEnvs**:
- Integer 1-20 inclusive
- Default: 3

**prEnvs.lifetimeHours**:
- Integer 1-8 inclusive
- Default: 1

### Environment

**name**:
- Required
- 1-100 characters
- For PR envs: Auto-generated from PR title + PR number

**slug**:
- 3-63 characters
- Same pattern as project slug
- Must be unique within project
- Auto-generated from name

**type**:
- Automatically set by system
- 'standard' for manually created
- 'pr' for GitHub Action created

**expiresAt**:
- Required for PR environments
- Must be > createdAt
- Computed as `createdAt + project.prEnvs.lifetimeHours`

---

## Edge Cases

### 1. PR Environment Name Collision

**Scenario**: Two PRs with identical titles opened simultaneously

**Handling**:
- Append incremental suffix: `-2`, `-3`, etc.
- Example: `feature-fix-carts-pr-128`, `feature-fix-carts-pr-128-2`
- Suffix added before final slug generation

### 2. Cap Reached During Creation

**Scenario**: Cap reached between validation check and provisioning

**Handling**:
- Atomic check-and-increment of `prEnvCount`
- If race condition detected, fail with cap message
- User retries (GitHub Action re-runs)

### 3. PR Renamed After Environment Created

**Scenario**: User renames PR title in GitHub

**Handling**:
- Environment name/slug remains stable (no rename)
- `prSource.prTitle` updated for display purposes
- UI shows updated title but URL unchanged

### 4. PR Reopened After Auto-Delete

**Scenario**: PR closed (env deleted), then reopened

**Handling**:
- Treat as fresh creation
- New environment ID and lifecycle
- Check cap before provisioning

### 5. Manifest Removed Mid-Lifecycle

**Scenario**: User deletes `unhazzle.yaml` from config repo after PR env created

**Handling**:
- Initial creation: Fail with "manifest not found" error
- Update/sync: Keep last known good config, post warning comment:
  ```
  ⚠️ Manifest missing in latest commit
  
  unhazzle.yaml not found at path 'unhazzle.yaml'.
  Environment is using the last valid configuration.
  ```

### 6. Invalid Manifest After Valid Creation

**Scenario**: Manifest becomes invalid (syntax error) on PR update

**Handling**:
- Validation fails on sync event
- Keep existing environment running with previous config
- Post error comment with validation details
- Do not redeploy until manifest is fixed

### 7. Service Name Mismatch

**Scenario**: GitHub Action specifies `service-name: frontend` but manifest has no container named "frontend"

**Handling**:
- Fail with error: "Service 'frontend' not found in manifest"
- List available service names from manifest
- User fixes action configuration and re-runs

### 8. Concurrent PR Environments from Same PR

**Scenario**: Multiple commits pushed rapidly, triggering multiple workflow runs

**Handling**:
- Use PR number as idempotency key
- Only one environment per PR number
- Subsequent runs update existing environment (don't create duplicates)
- Queue updates if deployment in progress

### 9. Expiration During Active Use

**Scenario**: User actively testing PR env when lifetime expires

**Handling**:
- Hard expiration (no grace period in MVP)
- Environment deleted as scheduled
- User can push new commit to recreate (if under cap)
- Future: Add "extend lifetime" button (manually add +1 hour, max 8)

### 10. Database/Cache Sharing Between Environments

**Scenario**: User wants PR envs to share staging database

**Handling**:
- Not supported in MVP (each env has isolated resources)
- Future: Add `sharedResources` section in manifest to reference existing DB

---

## Success Criteria

### Functional

- ✅ Project can be created with name and PR settings
- ✅ Standard environments can be created, cloned, promoted, and deleted
- ✅ PR environments created automatically via GitHub Action
- ✅ PR environments respect cap limit (deny creation when reached)
- ✅ PR environments auto-delete on PR close
- ✅ PR environments auto-delete on lifetime expiry
- ✅ PR environments update on new commits (without extending lifetime)
- ✅ Service image correctly overridden in PR environments
- ✅ Exposure and resources applied per manifest
- ✅ Environment list shows type, status, expiration clearly
- ✅ PR environment details show PR metadata

### Non-Functional

- ✅ Manifest validation provides clear, actionable error messages
- ✅ PR environment provisioning completes in < 2 minutes (simulated in prototype)
- ✅ GitHub Action posts helpful status comments on PRs
- ✅ UI clearly distinguishes standard vs PR environments
- ✅ Cost impact of PR environments clearly communicated

### UX

- ✅ Developers can preview changes in < 5 minutes (build + provision)
- ✅ No manual cleanup needed (auto-delete prevents forgotten envs)
- ✅ Clear visibility of PR env count vs cap
- ✅ Easy to extend PR lifetime if needed (future enhancement)
- ✅ Straightforward to increase cap for active sprint periods

---

## Cost Implications

### PR Environment (Example)

**Resources** (with prOverrides):
- Frontend: 0.25 CPU, 256MB RAM, 1 replica: €5/month prorated
- Backend: 0.25 CPU, 256MB RAM, 1 replica: €5/month prorated
- PostgreSQL: 0.5 CPU, 1GB RAM, 20GB storage: €15/month prorated
- Redis: 128MB: €3/month prorated

**Total**: ~€28/month if ran for full month

**Actual cost for 2-hour PR env**: €28 × (2h / 730h) = **€0.08 per PR**

**Example project** (3 concurrent PR envs):
- 3 PR envs active 2 hours each: €0.24/day
- 10 PRs per day: €2.40/day = **€72/month**

**Cost control benefits**:
- Lifetime cap prevents 24/7 costs
- Max cap prevents cost runaway
- Auto-delete on close prevents forgotten envs
- Clear prorated cost shown in UI

---

## Future Enhancements (Post-MVP)

### Immediate Follow-Ups (Next Phase)

- [ ] **Extend lifetime button**: Manually add +1 hour (max 8 total)
- [ ] **PR env activity tracking**: Reset timer on commits (optional flag)
- [ ] **Basic auth for PR envs**: Require password or GitHub SSO
- [ ] **Slack/Discord notifications**: PR env ready, expiring, deleted
- [ ] **Cost budget alerts**: Warn when PR env costs exceed threshold

### Mid-Term Enhancements

- [ ] **Distributed service manifests**: Each repo has `.unhazzle/service.yaml`
- [ ] **Shared resources**: PR envs share staging database (read-only)
- [ ] **Environment variables inheritance**: Org → Project → Environment cascade
- [ ] **RBAC per environment**: Different permissions for dev vs prod
- [ ] **Manual snapshot before promote**: Auto-backup prod before applying changes
- [ ] **Promote approval workflow**: Require approval before staging → prod

### Long-Term Vision

- [ ] **Organization hierarchy**: User → Org → Projects
- [ ] **Multi-region environments**: Deploy to EU + US simultaneously
- [ ] **Blue-green deployments**: Zero-downtime promotes
- [ ] **Canary deployments**: Gradual traffic shift
- [ ] **Cost allocation tags**: Track costs by team/feature
- [ ] **Multi-PR composite envs**: Combine PRs from multiple repos into one env

---

## Related Specifications

- **Multi-container support** (`multi-container-support.md`): Defines container structure used in environments
- **Volume/stateful storage** (`volume-stateful-storage.md`): Volume lifecycle within environments
- **Dashboard architecture view** (`dashboard-architecture-view.md`): Visualizing multi-environment projects
- **View current deployment config** (`view-current-deployment-config.md`): **PRIMARY REFERENCE** for editing patterns - all new features must follow this specification's UI/UX patterns
- **Edit selections on pricing page** (`edit-selections-on-pricing-page.md`): Inline editing with cost preview

---

## Design Integration Summary

**This specification builds on existing dashboard foundations**:

1. **Extends, doesn't replace**: The current Overview tab's split-view pattern (HybridOverview) is extended to include environment hierarchy, not replaced.

2. **Component reuse**: Existing editor components (ContainerEditor, DatabaseEditor, CacheEditor) continue to work unchanged; they just gain environment context.

3. **Pattern consistency**: All new modals, forms, and actions follow the established patterns:
   - Draft state → Show Changes → Apply → Confirmation → Progress feedback
   - Purple for primary actions, amber for pending changes, red for destructive actions
   - Inline progress with emoji indicators (✅ ⏳ 🔄)

4. **State management**: New Project/Environment state integrates into existing DeploymentContext without breaking current functionality.

5. **Visual language**: Same card layouts, status badges, typography, spacing as current dashboard.

**Implementation order recommendation**:
1. Add Project model to DeploymentContext (minimal impact)
2. Extend left sidebar with environment hierarchy (EnvironmentNavigator)
3. Add environment info right panel (EnvironmentInfo)
4. Implement Clone/Promote/Delete modals (reuse confirmation pattern)
5. Add Project settings page (new route, follows split-view pattern)
6. Add PR environment UI elements (badges, timers, PR metadata)

This ensures incremental changes that can be tested at each step without disrupting existing editing flows.

---

## Prototype Implementation Notes

### Integration with Existing Dashboard Architecture

**Critical**: All Project/Environment features MUST integrate with the current dashboard codebase without breaking existing functionality.

**Existing Dashboard Components to Reuse**:
1. **HybridOverview component**: Left sidebar + right panel pattern
   - Extend left sidebar to show environment hierarchy
   - Keep right panel editing pattern intact
   
2. **ContainerEditor / DatabaseEditor / CacheEditor**: 
   - No changes needed; these work per-resource
   - Just context-aware of which environment they're editing
   
3. **Draft state management**:
   - `draftContainer`, `draftDatabase`, `draftCache` pattern
   - "Show Changes" + "Apply" button logic
   - Confirmation modals with impact assessment
   
4. **State management via DeploymentContext**:
   - Extend `Project` and `Environment` interfaces
   - Add methods: `updateProject()`, `cloneEnvironment()`, `promoteEnvironment()`
   - Keep existing `updateContainer()`, `removeDatabase()`, etc.

**New Components to Build**:
1. **EnvironmentNavigator** (extends left sidebar):
   - Collapsible environment sections
   - Type badges ([Standard] / [PR #N])
   - Status indicators and expiration timers
   
2. **EnvironmentInfo** (right panel component):
   - Shows environment-level details
   - Actions: Clone, Promote, Delete
   - PR metadata panel (when applicable)
   
3. **ProjectSettings** (new page):
   - Follows same split-view pattern
   - Reuses draft state + apply pattern
   
4. **EnvironmentActions** (modals):
   - CloneModal, PromoteModal, DeleteModal
   - Reuse existing confirmation modal styling

### Demo Mode Adaptations

**Simulated behaviors**:
- GitHub Action integration: Show mock webhook events
- PR metadata: Pre-populate with realistic examples
- Expiration countdown: Visual timer (not real-time deletion)
- Provisioning delay: 5-10 second simulated deployment
- Cost calculations: Real formulas, simulated usage
- Environment transitions: Same progress feedback as resource updates

**Mock data for testing**:
- 1 project: "E-commerce Shop"
- 3 standard environments (dev, staging, prod)
- 2 active PR environments (near cap to show warning UX)
- Each environment has 2 containers + database + cache
- Mixed service repos (frontend + backend in different repos)

**UI Consistency Checklist**:
- ✅ Purple gradient buttons for primary actions
- ✅ Amber "Show Changes" buttons when draft exists
- ✅ Confirmation modals with impact assessment
- ✅ Inline progress feedback during transitions
- ✅ Status badges with color coding (green/yellow/red)
- ✅ Toast notifications for success/error states
- ✅ Same card-based layout for info panels

### Key User Flows to Demo

1. **Navigate environment hierarchy**: Expand/collapse envs in sidebar
2. **Edit container in specific environment**: Click env → click container → edit
3. **Clone standard environment**: Create staging from dev with progress
4. **Promote**: Push staging config to prod (show diff modal)
5. **View PR environment details**: PR metadata panel with GitHub link
6. **Delete PR environment**: Simplified confirmation, inline action
7. **Project settings**: Configure PR policies with draft state
8. **Cap warning**: Message when PR env limit reached

### What NOT to Build for Demo

- ❌ Actual GitHub integration (use mock data)
- ❌ Real-time expiration (visual countdown only)
- ❌ Actual image pulling/deployment
- ❌ Live manifest parsing (pre-load examples)
- ❌ Real DNS provisioning
- ❌ GitHub commit status checks
- ❌ Separate pages for environments (integrate into Overview tab)

---

## Glossary Alignment

This specification uses terminology consistent with `/journey/GLOSSARY.md`:

- **Project**: Top-level logical container
- **Environment**: Isolated deployment context within project
- **Application**: Long-running container (part of environment)
- **Function**: Short-lived workload (future; not in this spec)
- **Database/Cache/Queue**: Managed services within environment

New terms introduced:
- **PR Environment**: Ephemeral environment triggered by pull request
- **Standard Environment**: Manually created, persistent environment
- **prOverrides**: Manifest section defining PR-specific resource limits
