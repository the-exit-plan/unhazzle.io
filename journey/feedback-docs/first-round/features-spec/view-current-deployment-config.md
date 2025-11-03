## View Current Deployment Config Specification

**Status**: ✅ DONE

**Feature**: Display and edit complete resource configuration in Overview tab with visual consistency and change preview

**Source**: Mahya feedback

**Priority**: MVP

**Related Items**: 
- ✅ **Covers**: "Edit replicas/resources inline" (item #3) - inline editing is part of this specification

---

### Overview

Enable users to view and edit complete resource configuration (Applications, Functions, Databases, Caches, Queues) directly in the Overview tab with a consistent configuration experience, staged changes, and clear impact preview.

**Scope**:
- ✅ **Resource-level settings** (containers, databases, caches, queues)
- ❌ **Project-level settings** (deferred to "ENVIRONMENTS & WORKFLOWS")
- ❌ **Environment-level settings** (deferred to "ENVIRONMENTS & WORKFLOWS")

**Key Principle**: Maintain visual consistency with initial configuration experience and standardize configuration UI across all resource types.

---

### Step 1: Overview Tab - Resource Configuration View
**Page: Dashboard → Overview Tab**

**Current behavior**: Overview tab shows read-only metrics and status

**New behavior**: Split-view interface for viewing and editing resource configuration

**Layout: Split View**

**Left Sidebar (Resource Navigation)**:
- **Applications** section
  - List of all application containers (e.g., `frontend`, `backend`)
  - Status indicator per container (● Running, ⚠️ Warning, ⚫ Stopped)
  - Replica count badge (e.g., `3/3`)

- **Functions** section
  - List of all serverless functions (e.g., `migration`, `worker`)
  - Status and execution count

- **Databases** section
  - List of provisioned databases (e.g., `postgres`, `mongodb`)
  - Connection status indicator

- **Caches** section
  - List of caching services (e.g., `redis`, `memcached`)
  - Memory usage indicator

- **Queues** section
  - List of message queues (e.g., `rabbitmq`, `kafka`)
  - Queue depth indicator

**Why**: Hierarchical navigation provides clear context and allows quick switching between resources without losing place.

**Right Panel (Configuration Display)**:
Shows selected resource's complete configuration with editable sections

**Why**: Dedicated space for detailed configuration without cluttering the navigation.

---

### Step 2: Resource Configuration Display
**Page: Overview Tab → Selected Resource**

**Example: Application Container "frontend"**

**Header Section (always visible)**:
- **Container name**: `frontend`
- **Status**: ● Running (3/3 replicas)
  - **Desired**: 3 replicas
  - **Actual**: 3 replicas
  - **Status color**: Green (in sync) / Yellow (transitioning) / Red (error)
- **Image**: `ghcr.io/acme/shop-frontend:v2.1.0` 🔒 (read-only)
- **Last updated**: "2 hours ago"

**Why**: Immediate visibility of resource health and state before diving into configuration details.

---

**Section 1: Resources** 

*Visual consistency: Match initial configuration form style*

**Fields (editable)**:
- **CPU**: `1 core` [Edit]
  - Smart default badge: "Recommended: 0.5-2 cores"
  - Input: Number field with unit selector (cores/millicores)
  
- **RAM**: `1 GB` [Edit]
  - Smart default badge: "Recommended: 512MB-2GB"
  - Input: Number field with unit selector (MB/GB)
  
- **Replicas** [Edit]
  - **Min**: `2` (always running)
  - **Max**: `5` (scale up to)
  - **Desired** (optional): `3` (current target)
  - Helper text: *"Set min=max for fixed scaling (no autoscaling). Different values enable autoscaling based on CPU/memory."*

**Read-only fields** 🔒:
- **Region**: `eu-central-1`
  - Tooltip: "Region cannot be changed after deployment"

**Why**: Allow resource adjustment based on actual workload while preventing destructive changes to immutable fields.

---

**Section 2: Environment Variables** [+ Add]

**User-defined variables** (editable):
- `NEXT_PUBLIC_API_URL` = `https://api.acme.com` [Edit] [Delete]
- `FEATURE_FLAGS` = `new-checkout,analytics` [Edit] [Delete]

**Secrets** (masked, editable with confirmation):
- `STRIPE_PUBLIC_KEY` = `••••••••` [Edit]
  - Click [Edit] → Confirmation modal: "Are you sure you want to change this secret?"
  - Input: Password field, requires re-entering value
  - Never display actual secret value

**Auto-generated variables** (editable names, read-only values):
- `UNHAZZLE_POSTGRES_URL` = `postgresql://...` [Edit name]
  - **Name**: Editable (click [Edit name] to customize)
  - **Value**: Read-only (auto-generated connection string)
  - Badge: "Auto-injected" with info icon
  - Tooltip: "This variable is automatically injected because this container has PostgreSQL access. You can customize the variable name to match your app's expectations."
  
- `UNHAZZLE_REDIS_URL` = `redis://...` [Edit name]
  - **Name**: Editable
  - **Value**: Read-only (auto-generated)

**Editing auto-generated variable names**:
- Click [Edit name] → inline text field appears
- User can change name (e.g., `UNHAZZLE_POSTGRES_URL` → `DATABASE_URL`)
- Validation:
  - Must be unique (no conflicts with user-defined vars)
  - Format: Uppercase letters, numbers, underscores only
  - Cannot be empty
- Changes require clicking [Apply] and trigger container restart

**Action**: [+ Add Variable] button
- Opens inline form: Key | Value | [Add]
- Validates key format (alphanumeric, underscores)

**Why**: Centralize env var management with clear distinction between user-defined, secrets, and auto-generated variables. Allow customization of auto-generated variable names to match framework conventions without changing connection values.

---

**Section 3: Health Check** [Edit]

**Current configuration** (editable):
- **Protocol**: `HTTP` (dropdown: HTTP / TCP / gRPC)
- **Port**: `3000` (inferred from container port)
- **Path**: `/health`
- **Interval**: `30s` (how often to check)
- **Timeout**: `5s` (how long to wait for response)
- **Retries**: `3` (failures before marking unhealthy)

**Smart defaults badge**: "Using recommended values"

**Why**: Make health check configuration visible and editable while guiding users toward best practices.

---

**Section 4: Networking** [Edit]

**Exposure**:
- **Visibility**: `Public` (radio: Public / Private)
- **Domain**: `shop.acme.com` [Edit]
  - Shows DNS configuration status: ✓ Configured / ⚠️ Pending / ✗ Error
  - Link: "View DNS instructions"

**Internal DNS** (read-only, reference):
- **Service name**: `frontend.my-ecommerce-shop`
  - Badge: "Auto-configured"
  - Tooltip: "Other containers can reach this service using this DNS name"

**Port**: `3000` (from container configuration)

**Why**: Consolidate networking configuration with clear public/private distinction and DNS guidance.

---

**Section 5: Service Access** [Edit]

**Connected services** (checkboxes with editable variable names):
- ☐ PostgreSQL
  - If checked: Shows "Auto-injects as: `[UNHAZZLE_POSTGRES_URL]` ✏️" (editable)
  - Click edit icon to customize variable name
- ☑ Redis
  - Shows: "Auto-injects as: `[UNHAZZLE_REDIS_URL]` ✏️" (editable)
  - Badge: "Connected"
  - Current custom name displayed (if changed from default)
- ☐ RabbitMQ
  - If checked: Shows "Auto-injects as: `[UNHAZZLE_RABBITMQ_URL]` ✏️" (editable)

**Variable naming**:
- **Default format**: `UNHAZZLE_{ENGINE}_URL` for single services
- **Multiple services**: `UNHAZZLE_{ENGINE}_{USER_NAME}_URL` based on service names
- **Fully customizable**: Users can change to match their framework (e.g., `DATABASE_URL`, `DB_CONNECTION`)

**Helper text**: "Grant this container access to databases, caches, or queues. Connection details are automatically injected as environment variables. Variable names can be customized to match your app's expectations."

**Why**: Explicit least-privilege access control with transparency about what env vars will be injected, and flexibility to customize names for framework compatibility.

---

**Action Buttons (sticky footer)**:
- **[Show Changes]** button (disabled if no changes)
  - Shows badge with count: "3 changes"
- **[Apply]** button (disabled if no changes)
  - Primary action button

**Why**: Always-visible actions reduce scrolling to save changes.

---

### Step 3: Change Preview
**Triggered by: Click [Show Changes]**

**Simple Preview (default view)**:

Modal or expandable panel showing:
```
📝 Pending Changes (3)

Container: frontend
• CPU: 1 core → 2 cores
• RAM: 1 GB → 2 GB
• Environment Variables: Added 1 variable (FEATURE_NEW_UI=true)

Impact:
⚠️ Changing CPU/RAM requires rolling restart
⏱️ Estimated impact: ~2 minutes
✅ Zero-downtime deployment (traffic served by other replicas)

[View Full Diff] [Cancel] [Apply]
```

**Why**: Provide clear summary of changes and impact without overwhelming users with technical details.

---

**Full Diff View (expandable)**:

Click [View Full Diff] reveals modal with side-by-side YAML comparison:

```yaml
# unhazzle.yaml

applications:
  - name: frontend
    resources:
-     cpu: "1"
+     cpu: "2"
-     memory: "1Gi"
+     memory: "2Gi"
    replicas:
      min: 2
      max: 5
    env:
      - name: NEXT_PUBLIC_API_URL
        value: https://api.acme.com
+     - name: FEATURE_NEW_UI
+       value: "true"
```

**Display options**:
- Unified diff (default)
- Side-by-side diff (toggle)
- Copy YAML button

**Why**: Power users can see exact configuration changes in familiar YAML format for GitOps workflows.

---

### Step 4: Apply Configuration Changes
**Triggered by: Click [Apply]**

**Confirmation Modal**:
```
⚠️ Apply Configuration Changes?

Summary:
Container: frontend
• CPU: 1 core → 2 cores
• RAM: 1 GB → 2 GB
• Added environment variable: FEATURE_NEW_UI

Impact Assessment:
⚠️ Rolling restart required
⏱️ Estimated time: ~2 minutes
✅ No expected traffic disruption
📊 Cost impact: +€15/month

Are you sure you want to apply these changes?

[Cancel]  [Apply Changes]
```

**Why**: Final confirmation prevents accidental changes with clear impact assessment including cost implications.

---

**Action: User confirms**

**Application Progress (inline, replaces content)**:
```
🔄 Applying changes to frontend...

✅ Validating configuration
✅ Updating replica 1/3 (2 min remaining)
⏳ Updating replica 2/3 (health checks passing)
⏳ Waiting for replica 3/3

Current status: 2/3 replicas updated
```

**Why**: Real-time progress feedback reduces anxiety and shows the platform is working.

---

**Success State**:
```
✅ Changes applied successfully

Container: frontend
• All replicas updated (3/3)
• Configuration changes active
• Status: ● Running

[View Logs] [Close]
```

**Status indicator updates**:
- **Desired state**: Now shows new values (2 cores, 2 GB)
- **Actual state**: Syncs to match desired state
- **Color**: Green (in sync)

**Why**: Clear success confirmation with option to view logs for validation.

---

### Step 5: State Display During Transitions
**Page: Overview Tab (ongoing updates)**

**Scenario**: User applied CPU change, rolling restart in progress

**Header status shows both states**:
```
Container: frontend
Status: 🔄 Updating (2/3 replicas)

Desired: 3 replicas (2 CPU cores, 2 GB RAM)
Actual: 2 replicas updated, 1 replica restarting

Progress: ▓▓▓▓▓▓▓▓░░ 80%
```

**Color coding**:
- **Green**: In sync (actual = desired)
- **Yellow**: Transitioning (actual ≠ desired, in progress)
- **Red**: Error state (actual ≠ desired, failed)

**Why**: Transparency during state transitions builds trust and helps debug issues.

---

### Step 6: Settings Tab Placeholder
**Page: Dashboard → Settings Tab**

**Current content**: Existing settings UI (if any)

**New content** (replace or prepend):
```
⚙️ Settings

Project and Environment settings will be available here soon.

For now, you can configure individual resources in the Overview tab.

Coming soon:
• Project-level settings (name, region, tags)
• Environment-level settings (dev/staging/prod)
• Team access control and permissions
• Billing and usage limits
• Notification preferences

💡 Tip: Click on any resource in the Overview tab to edit its configuration.

[Go to Overview Tab]
```

**Why**: Set expectations about future functionality while directing users to current configuration capabilities.

---

## Technical Implementation Notes

### State Management
```typescript
interface ResourceState {
  desiredState: ResourceConfig;
  actualState: ResourceConfig;
  transitionStatus: 'in_sync' | 'transitioning' | 'error';
  lastUpdated: Date;
  changesPending: ResourceConfig | null;
}
```

- **Desired state**: What user has configured (target)
- **Actual state**: What's currently running (reality)
- **Transition status**: Sync status for UI coloring
- **Changes pending**: Staged edits not yet applied

### Real-time Updates
- WebSocket connection for live state updates
- Fallback to polling every 5 seconds
- Update actual state when replicas scale, restart, or fail

### YAML Generation
```typescript
function generateUnhazzleYAML(resource: Resource): string {
  // Convert internal resource model to unhazzle.yaml format
  // Used for diff view and GitOps export
}

function generateDiff(before: string, after: string): Diff {
  // Generate unified or side-by-side diff
  // Highlight additions, deletions, changes
}
```

### Impact Calculation
```typescript
interface ChangeImpact {
  requiresRestart: boolean;
  estimatedDuration: string; // e.g., "~2 minutes"
  downtime: 'none' | 'minimal' | 'significant';
  costImpact: number; // monthly delta in currency
  affectedResources: string[]; // other resources impacted
}

function calculateImpact(changes: ResourceChanges): ChangeImpact {
  // Logic to determine impact based on change type
  // CPU/RAM changes → rolling restart
  // Env var changes → may or may not require restart
  // Scaling changes → no restart
}
```

### Secrets Security
- Never send actual secret values to frontend after creation
- Backend validates secret edit with additional authentication
- Mask secrets as `••••••••` in UI
- Confirmation modal required before editing secrets

### Validation
```typescript
interface ValidationRule {
  field: string;
  rule: (value: any) => boolean;
  message: string;
}

// Example validations
const validations: ValidationRule[] = [
  {
    field: 'replicas.min',
    rule: (min) => min > 0,
    message: 'Min replicas must be at least 1'
  },
  {
    field: 'replicas.max',
    rule: (max, config) => max >= config.replicas.min,
    message: 'Max replicas must be >= min replicas'
  },
  {
    field: 'resources.cpu',
    rule: (cpu) => cpu > 0 && cpu <= 32,
    message: 'CPU must be between 0.1 and 32 cores'
  }
];
```

---

## User Experience Considerations

### Visual Consistency
- Configuration forms match initial setup questionnaire style
- Same input components (dropdowns, sliders, toggles)
- Consistent spacing, typography, and color scheme
- Edit buttons use consistent iconography (pencil icon)

### Helper Text & Tooltips
- **Helper text**: Guide users on best practices ("Set min=max for fixed scaling")
- **Tooltips**: Explain technical concepts (hover on 🔒 icon for immutability reason)
- **Smart defaults**: Show recommended values based on workload type
- **Impact warnings**: Always communicate consequences before applying

### Error Handling
- **Validation errors**: Inline, near the field (red border + message)
- **Application errors**: Modal with error details and suggested actions
- **Retry logic**: Automatically retry transient failures
- **Support context**: Error messages include troubleshooting links

### Accessibility
- Keyboard navigation for all editable fields
- ARIA labels for screen readers
- Focus indicators on interactive elements
- High contrast mode support

---

## Success Metrics

- **Configuration edit completion rate**: % of users who start editing and successfully apply changes
- **Time to edit**: Average time from opening Overview tab to applying changes
- **Error rate**: % of configuration changes that fail to apply
- **Change preview usage**: % of users who view diff before applying
- **Support tickets**: Reduction in "how do I change X" tickets

---

## Future Enhancements (Not in MVP)

- [ ] Configuration change history / audit log
- [ ] Rollback to previous configuration
- [ ] Configuration templates (save and reuse common patterns)
- [ ] Bulk editing across multiple containers
- [ ] A/B testing different configurations
- [ ] Cost impact calculator (detailed breakdown)
- [ ] Configuration validation in staging before production
- [ ] Scheduled configuration changes (apply at specific time)
- [ ] GitOps sync (auto-apply changes from Git repository)
- [ ] Configuration drift detection (alert when actual ≠ desired)

---

## Related Specifications

- **Multi-container support** (`multi-container-support.md`): Defines container structure and service access patterns used in this configuration view
- **Editable auto-generated env var names** (to be created): Will extend environment variables section with name customization
- **Edit selections on pricing page** (to be created): Related to configuration editing but in review/pricing context
