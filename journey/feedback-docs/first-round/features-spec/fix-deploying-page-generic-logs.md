## Fix Deploying Page - Generic Resource Logs

**Status**: � DONE

**Feature**: Refactor deploying page to read saved state and generate generic messages per resource

**Source**: Inaki feedback (BUGS section)

**Priority**: MVP

**Bug**: "Selected memcached but deployment shows Redis. The mocked logs in the deploying page should not use services brands. Lets keep it simple by using generic terms."

---

### Overview

The current deploying page uses hardcoded logs that reference specific service brands (PostgreSQL, Redis, specific versions, etc.) regardless of what the user actually selected. This creates inconsistency and confusion when the displayed logs don't match the user's selections (e.g., selecting Memcached but seeing "Deploying Redis 7.2 container" in logs).

**Current Problem**:
```typescript
// Hardcoded logs (current)
cache: [
  '→ Deploying Redis 7.2 container',  // ❌ Shows Redis even if Memcached selected
  '→ Configuring 512MB memory limit',
  '→ Enabling daily persistence (AOF)',
  '✓ Cache ready: redis://...unhazzle.io:6379'
]
```

**Solution**:
- **Read from DeploymentContext** to determine which resources were selected
- **Generate generic logs** using resource types (not brand names)
- **Keep existing deployment phases** (validate, provision, database, cache, container, etc.)
- **Maintain simplicity** for prototype (detailed logs come in full MVP)

---

### Scope: Prototype vs MVP

**Prototype (This Spec)**:
- ✅ Generic resource type names ("database", "cache", "container")
- ✅ Read from DeploymentContext to determine what to show
- ✅ Simple messaging (no sizes, versions, or custom names)
- ✅ Keep current phase grouping
- ✅ Mocked/simulated timing

**Full MVP (Future Enhancement)**:
- More detailed logs with resource specs (CPU, RAM, storage)
- Custom resource names if user provided them
- Real backend WebSocket integration
- Actual deployment status updates
- Failure handling and retry mechanisms

---

### Step 1: Dynamic Phase Generation Based on Selected Resources
**File: `prototype-app/app/deploying/page.tsx`**

**Current Behavior**: All deployment phases are hardcoded with all resource types (database, cache, etc.) shown regardless of what user selected.

**New Behavior**: Generate deployment phases dynamically based on `state.resources` from DeploymentContext.

---

**Logic for Including Phases**:

```typescript
const generateDeploymentSteps = (state: DeploymentState): DeploymentStep[] => {
  const steps: DeploymentStep[] = [];

  // 1. Validate (always included)
  steps.push({
    id: 'validate',
    label: 'Validating configuration',
    description: 'Checking resources and dependencies',
    duration: 2,
    status: 'pending',
    logs: []
  });

  // 2. Provision (always included)
  steps.push({
    id: 'provision',
    label: 'Provisioning infrastructure',
    description: 'Setting up servers and networking',
    duration: 8,
    status: 'pending',
    logs: []
  });

  // 3. Database (only if database was selected)
  if (state.resources?.database) {
    steps.push({
      id: 'database',
      label: 'Configuring database',
      description: 'Setting up database instance with backups',
      duration: 6,
      status: 'pending',
      logs: []
    });
  }

  // 4. Cache (only if cache was selected)
  if (state.resources?.cache) {
    steps.push({
      id: 'cache',
      label: 'Setting up cache',
      description: 'Deploying cache service',
      duration: 4,
      status: 'pending',
      logs: []
    });
  }

  // 5. Container (always included)
  steps.push({
    id: 'container',
    label: 'Pulling container image',
    description: 'Fetching and verifying image layers',
    duration: 5,
    status: 'pending',
    logs: []
  });

  // 6. Deploy (always included)
  steps.push({
    id: 'deploy',
    label: 'Deploying application',
    description: 'Starting containers across replicas',
    duration: 7,
    status: 'pending',
    logs: []
  });

  // 7. Load Balancer (always included)
  steps.push({
    id: 'loadbalancer',
    label: 'Configuring load balancer',
    description: 'Setting up SSL and routing rules',
    duration: 4,
    status: 'pending',
    logs: []
  });

  // 8. Health (always included)
  steps.push({
    id: 'health',
    label: 'Running health checks',
    description: 'Verifying application is responding',
    duration: 5,
    status: 'pending',
    logs: []
  });

  // 9. Complete (always included)
  steps.push({
    id: 'complete',
    label: 'Deployment complete',
    description: 'Your application is live!',
    duration: 1,
    status: 'pending',
    logs: []
  });

  return steps;
};
```

**Why**: Only show deployment phases for resources that were actually selected. If user didn't select a cache, don't show "Setting up cache" phase.

---

### Step 2: Generic Log Messages per Resource Type
**Context: Log Generation Functions**

**Current Problem**: Hardcoded logs with specific brands and versions.

**New Approach**: Generic messages based on resource type only.

---

**Generic Log Messages by Phase**:

```typescript
const getLogsForStep = (stepId: string, state: DeploymentState): string[] => {
  switch (stepId) {
    case 'validate':
      return [
        '✓ Configuration validated',
        '✓ Resource quotas checked',
        '✓ Dependencies resolved'
      ];

    case 'provision':
      return [
        '→ Allocating compute resources',
        '→ Creating network infrastructure',
        '→ Configuring firewall rules',
        '✓ Infrastructure provisioned',
        '✓ Network established'
      ];

    case 'database':
      return [
        '→ Creating database instance',
        '→ Allocating storage',
        '→ Enabling automated backups',
        '✓ Database ready'
      ];

    case 'cache':
      return [
        '→ Deploying cache service',
        '→ Configuring memory allocation',
        '→ Setting up persistence',
        '✓ Cache service ready'
      ];

    case 'container':
      return [
        '→ Authenticating with registry',
        '→ Pulling image layers',
        '→ Verifying image',
        '✓ Image pulled successfully'
      ];

    case 'deploy':
      return [
        '→ Injecting environment variables',
        '→ Starting application containers',
        '→ Configuring auto-scaling',
        '✓ Application running'
      ];

    case 'loadbalancer':
      return [
        '→ Creating load balancer',
        '→ Provisioning SSL certificate',
        '→ Configuring routing rules',
        '✓ Load balancer active'
      ];

    case 'health':
      return [
        '→ Waiting for application to start',
        '→ Running health checks',
        '→ Verifying SSL certificate',
        '✓ All health checks passed'
      ];

    case 'complete':
      return [
        '🎉 Deployment successful!'
      ];

    default:
      return [];
  }
};
```

**Why**: 
- **No brand names**: "database" instead of "PostgreSQL 16", "cache service" instead of "Redis 7.2"
- **No specific versions**: Removed version numbers and technical details
- **No specific configurations**: Removed memory sizes, connection strings, etc.
- **Simple and consistent**: Works for any resource selection

---

### Step 3: Remove Hardcoded Resource References
**Context: Log Functions Refactor**

**Remove These Functions**:
```typescript
// ❌ DELETE: getLogCountForStep() - has hardcoded logs
// ❌ DELETE: getLogForStep() - has hardcoded logs
```

**Replace With**:
```typescript
const getLogsForStep = (stepId: string, state: DeploymentState): string[] => {
  // Returns all logs for a step at once (shown with delay animation)
  // Implementation shown in Step 2 above
};
```

**Update Component Logic**:
```typescript
// OLD (current):
const allLogs = Array.from({ length: getLogCountForStep(steps[index].id) }, (_, i) => 
  getLogForStep(steps[index].id, i)
);

// NEW (refactored):
const allLogs = getLogsForStep(steps[index].id, state);
```

**Why**: Single source of truth for logs that reads from actual deployment state.

---

### Step 4: Update Initial Steps State
**Context: Component State Initialization**

**Current**:
```typescript
const [steps, setSteps] = useState<DeploymentStep[]>([
  { /* hardcoded steps */ }
]);
```

**New**:
```typescript
const [steps, setSteps] = useState<DeploymentStep[]>(() => 
  generateDeploymentSteps(state)
);
```

**Why**: Steps are generated based on what user actually selected, not a fixed list.

---

### Step 5: Update "What's happening" Info Box
**Context: Info box below deployment steps**

**Current** (has hardcoded details):
```tsx
<ul className="space-y-2 text-sm text-slate-700">
  <li>Spinning up enterprise-grade Hetzner servers in Germany</li>
  <li>Configuring high-availability database with automated backups</li>
  <li>Setting up auto-scaling from {state.resources?.replicas.min} to {state.resources?.replicas.max} replicas</li>
  <li>Provisioning free SSL certificate for HTTPS</li>
  <li>Deploying to: <code>{state.domain?.defaultSubdomain}</code></li>
</ul>
```

**New** (conditionally show based on selections):
```tsx
<ul className="space-y-2 text-sm text-slate-700">
  <li className="flex items-start gap-2">
    <span className="text-purple-600 mt-0.5">•</span>
    <span>Provisioning servers in Germany</span>
  </li>
  
  {state.resources?.database && (
    <li className="flex items-start gap-2">
      <span className="text-purple-600 mt-0.5">•</span>
      <span>Setting up database with automated backups</span>
    </li>
  )}
  
  {state.resources?.cache && (
    <li className="flex items-start gap-2">
      <span className="text-purple-600 mt-0.5">•</span>
      <span>Deploying cache service</span>
    </li>
  )}
  
  <li className="flex items-start gap-2">
    <span className="text-purple-600 mt-0.5">•</span>
    <span>Configuring auto-scaling from {state.resources?.replicas.min} to {state.resources?.replicas.max} replicas</span>
  </li>
  
  <li className="flex items-start gap-2">
    <span className="text-purple-600 mt-0.5">•</span>
    <span>Provisioning SSL certificate for HTTPS</span>
  </li>
  
  <li className="flex items-start gap-2">
    <span className="text-purple-600 mt-0.5">•</span>
    <span>Deploying to: <code className="bg-white px-2 py-0.5 rounded text-xs">{state.domain?.defaultSubdomain}</code></span>
  </li>
</ul>
```

**Why**: Info box reflects actual resources being deployed, not assuming all resources exist.

---

### Step 6: Adjust Total Duration Dynamically
**Context: Progress Bar and Time Estimates**

**Current**: Fixed total duration (sum of all hardcoded steps ≈ 42 seconds)

**New**: Calculate based on included steps

```typescript
const calculateTotalDuration = (steps: DeploymentStep[]): number => {
  return steps.reduce((total, step) => total + step.duration, 0);
};

// Usage in component
const totalDuration = calculateTotalDuration(steps);
```

**Update Description**:
```tsx
<p className="text-lg text-slate-600">
  Sit back and relax. This typically takes {totalDuration}-{totalDuration + 10} seconds.
</p>
```

**Why**: Deployment time varies based on number of resources (no cache = faster deployment).

---

## Implementation Example

### Before (Current - Hardcoded):

```typescript
// ❌ Hardcoded logs with brand names
database: [
  '→ Creating PostgreSQL 16 instance',  // Hardcoded version
  '→ Allocating 20GB block storage',    // Hardcoded size
  '→ Enabling automated backups (7-day retention)',
  '→ Configuring HA standby replica',
  '✓ Database ready: postgresql://...unhazzle.io:5432'  // Hardcoded URL
],
cache: [
  '→ Deploying Redis 7.2 container',    // ❌ BUG: Shows Redis even if Memcached selected
  '→ Configuring 512MB memory limit',   // Hardcoded size
  '→ Enabling daily persistence (AOF)',
  '✓ Cache ready: redis://...unhazzle.io:6379'  // Hardcoded URL
]
```

**Problems**:
1. Shows Redis when Memcached was selected
2. Shows PostgreSQL when MySQL or MongoDB was selected
3. Shows specific versions and sizes not related to user's selections
4. Always shows database/cache phases even if not selected

---

### After (Refactored - State-Driven):

```typescript
// ✅ Generic logs generated from state
const getLogsForStep = (stepId: string, state: DeploymentState): string[] => {
  switch (stepId) {
    case 'database':
      // Generic, works for any database type
      return [
        '→ Creating database instance',
        '→ Allocating storage',
        '→ Enabling automated backups',
        '✓ Database ready'
      ];
      
    case 'cache':
      // Generic, works for Redis or Memcached
      return [
        '→ Deploying cache service',
        '→ Configuring memory allocation',
        '→ Setting up persistence',
        '✓ Cache service ready'
      ];
    // ... other steps
  }
};

// Only include phases for selected resources
const generateDeploymentSteps = (state: DeploymentState): DeploymentStep[] => {
  const steps: DeploymentStep[] = [/* validate, provision */];
  
  if (state.resources?.database) {
    steps.push({ id: 'database', /* ... */ });
  }
  
  if (state.resources?.cache) {
    steps.push({ id: 'cache', /* ... */ });
  }
  
  // ... rest of steps
  return steps;
};
```

**Benefits**:
1. ✅ Shows generic "cache service" regardless of Redis or Memcached
2. ✅ Shows generic "database" regardless of PostgreSQL, MySQL, or MongoDB
3. ✅ No version numbers or technical details
4. ✅ Only shows phases for resources that were selected
5. ✅ Consistent with user's actual selections

---

## Visual Examples

### Example 1: User Selected Database + Cache

**Deployment Steps Shown**:
```
✓ Validating configuration
✓ Provisioning infrastructure
✓ Configuring database          ← Shows because database selected
✓ Setting up cache              ← Shows because cache selected
✓ Pulling container image
✓ Deploying application
✓ Configuring load balancer
✓ Running health checks
✓ Deployment complete
```

**Logs for Database Step**:
```
→ Creating database instance
→ Allocating storage
→ Enabling automated backups
✓ Database ready
```

**Logs for Cache Step**:
```
→ Deploying cache service
→ Configuring memory allocation
→ Setting up persistence
✓ Cache service ready
```

---

### Example 2: User Selected NO Database, NO Cache

**Deployment Steps Shown**:
```
✓ Validating configuration
✓ Provisioning infrastructure
✓ Pulling container image       ← Database and cache steps skipped
✓ Deploying application
✓ Configuring load balancer
✓ Running health checks
✓ Deployment complete
```

**Info Box** (conditionally shows):
```
💡 What's happening behind the scenes
• Provisioning servers in Germany
• Configuring auto-scaling from 2 to 10 replicas
• Provisioning SSL certificate for HTTPS
• Deploying to: my-app.unhazzle.io
```

Notice: No mentions of database or cache since they weren't selected.

---

## Technical Implementation Notes

### DeploymentContext State Structure (Reference)

```typescript
interface DeploymentState {
  resources: {
    database?: {
      engine: string;     // 'postgres' | 'mysql' | 'mongodb'
      version: string;
      storage: string;
      // ... other config
    };
    cache?: {
      engine: string;     // 'redis' | 'memcached'
      version: string;
      memory: string;
      // ... other config
    };
    // ... other resources
  } | null;
}
```

**Key Insight**: We check for existence (`if (state.resources?.database)`) not the specific engine. For prototype, we don't need to differentiate between PostgreSQL vs MySQL in the logs.

---

### Function Signatures

```typescript
// Generate dynamic steps based on selected resources
const generateDeploymentSteps = (state: DeploymentState): DeploymentStep[] => {
  // Returns array of steps, conditionally including database/cache
};

// Get all logs for a specific step
const getLogsForStep = (stepId: string, state: DeploymentState): string[] => {
  // Returns array of log messages for the step
};

// Calculate total deployment duration
const calculateTotalDuration = (steps: DeploymentStep[]): number => {
  // Returns sum of all step durations
};
```

---

### Log Animation Timing

**Keep existing animation logic**:
- Logs appear one at a time with 600ms delay between each
- Step completes after `duration * 1000` milliseconds
- Status transitions: `pending` → `running` → `completed`

**No changes needed** to animation timing, only to log content.

---

## Testing Checklist

**Scenario 1: Database + Cache**
- [ ] Both "Configuring database" and "Setting up cache" phases appear
- [ ] Database logs show generic "database instance" (not PostgreSQL/MySQL)
- [ ] Cache logs show generic "cache service" (not Redis/Memcached)
- [ ] Info box mentions both database and cache

**Scenario 2: Database Only (No Cache)**
- [ ] "Configuring database" phase appears
- [ ] "Setting up cache" phase does NOT appear
- [ ] Info box mentions database but NOT cache
- [ ] Total duration is shorter (no cache step)

**Scenario 3: Cache Only (No Database)**
- [ ] "Setting up cache" phase appears
- [ ] "Configuring database" phase does NOT appear
- [ ] Info box mentions cache but NOT database

**Scenario 4: No Database, No Cache**
- [ ] Neither database nor cache phases appear
- [ ] Info box mentions neither database nor cache
- [ ] Total duration is shortest

**Scenario 5: Memcached Selected**
- [ ] Cache logs show "cache service" (NOT Redis)
- [ ] ✅ Bug fixed: No brand-specific references

---

## Success Metrics

- **Bug resolution**: 0 instances of wrong service brand shown (Redis when Memcached selected)
- **Consistency**: 100% match between selected resources and displayed deployment phases
- **Simplicity**: 0 brand names or versions in prototype logs
- **User feedback**: Reduced confusion about deployment logs
- **Code maintainability**: Single source of truth for logs (no hardcoded messages)

---

## Future Enhancements (Full MVP)

- [ ] **Detailed logs**: Include resource sizes, versions, connection strings
- [ ] **Custom names**: Show user-provided resource names
- [ ] **Real backend integration**: WebSocket connection for actual deployment status
- [ ] **Progress percentages**: Real progress tracking (not just simulated timing)
- [ ] **Failure handling**: Show specific error messages and retry options
- [ ] **Deployment history**: Track and display past deployment logs
- [ ] **Multi-container support**: Show logs for each container being deployed
- [ ] **Volume deployment**: Show logs for volume attachment and configuration
- [ ] **Rollback capability**: Show logs for rollback operations

---

## Related Specifications

- **Multi-container support** (`multi-container-support.md`): Will require enhanced logs showing per-container deployment
- **Volume/stateful storage** (`volume-stateful-storage.md`): Will require volume attachment logs
- **View current deployment config** (`view-current-deployment-config.md`): Deployed resources shown in Overview tab

---

## Migration Notes

### Code Changes Required

**File: `prototype-app/app/deploying/page.tsx`**

1. **Add helper functions** (top of file):
   - `generateDeploymentSteps(state: DeploymentState)`
   - `getLogsForStep(stepId: string, state: DeploymentState)`
   - `calculateTotalDuration(steps: DeploymentStep[])`

2. **Update state initialization**:
   - Replace hardcoded `steps` array with `generateDeploymentSteps(state)`

3. **Remove old functions**:
   - Delete `getLogCountForStep()`
   - Delete `getLogForStep()` (old version with index parameter)

4. **Update log generation logic**:
   - Replace `Array.from({ length: getLogCountForStep(...) })` with direct `getLogsForStep()` call

5. **Update info box**:
   - Add conditional rendering based on `state.resources?.database` and `state.resources?.cache`

6. **Update duration estimate**:
   - Use `calculateTotalDuration(steps)` instead of hardcoded value

### Backward Compatibility

**No breaking changes**: Changes are internal to deploying page component. All other pages remain unchanged.

### Testing Strategy

1. **Manual testing**: Test all 4 scenarios (database+cache, database-only, cache-only, neither)
2. **Visual regression**: Ensure deployment phases still animate correctly
3. **Timing verification**: Confirm total duration matches sum of included steps
4. **State validation**: Verify correct resources shown based on DeploymentContext
