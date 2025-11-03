## Edit Selections on Pricing Page Specification

**Status**: 🟢 DONE

**Feature**: Allow inline editing of resource configurations on review/pricing page to experiment with costs before deployment

**Source**: Viviana feedback

**Priority**: MVP

---

### Overview

Enable users to adjust resource configurations (CPU, RAM, storage, replicas) directly on the review/pricing page with real-time price updates. This allows users to experiment with different configurations and see immediate cost impacts without navigating back through the deployment flow.

**Key Goals**:
- **Cost experimentation**: Let users play with values to find optimal price/performance balance
- **Instant feedback**: Real-time price updates as values change
- **Simple interaction**: Inline editing for quick tweaks
- **Minimal scope**: Focus on resource sizing only; complex changes require going back

**Constraints**:
- Only resource sizing is editable (CPU, RAM, storage, replicas)
- Changes auto-save to DeploymentContext immediately
- Structural changes (add/remove containers, services) require navigating back to `/resources`

---

### Step 1: Review Page Layout with Editable Fields
**Page: Review & Pricing (Enhanced)**

**Current behavior**: Review page shows read-only summary of all configurations

**New behavior**: Resource values are inline-editable with pencil icons

**Page Structure**:

```
┌─────────────────────────────────────────────────────────┐
│ Review Your Configuration                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📦 Containers                           [Edit Layout]  │
│ ├─ Frontend                                            │
│ │  • CPU: [1 core ✏️]                                 │
│ │  • RAM: [1 GB ✏️]                                   │
│ │  • Replicas: [2-5 ✏️]                               │
│ │  • Cost: €22/month                                  │
│ │                                                      │
│ └─ Backend                                             │
│    • CPU: [2 cores ✏️]                                │
│    • RAM: [2 GB ✏️]                                   │
│    • Replicas: [2-10 ✏️]                              │
│    • Cost: €45/month                                  │
│                                                        │
│ 🗄️ Database                            [Edit Type]     │
│ ├─ PostgreSQL                                          │
│    • Storage: [20 GB ✏️]                              │
│    • Backups: [7 days ✏️]                             │
│    • Cost: €65/month                                  │
│                                                        │
│ 💾 Cache                               [Edit Type]     │
│ ├─ Redis                                               │
│    • Memory: [512 MB ✏️]                              │
│    • Cost: €15/month                                  │
│                                                        │
│ 📊 Total Monthly Cost: €147/month                      │
│                                                        │
│ [Deploy Project]                                       │
└─────────────────────────────────────────────────────────┘
```

**Visual Design**:
- **Editable values**: Show pencil icon (✏️) on hover
- **[Edit Layout/Type] buttons**: For non-editable changes → navigate to `/resources`
- **Cost per section**: Displayed alongside configuration
- **Total cost**: Prominent display at bottom, updates in real-time

**Why**: Clear visual distinction between quick-editable values and structural changes that require full configuration flow.

---

### Step 2: Inline Editing Interaction
**Triggered by: Click on editable value or pencil icon**

**Interaction Flow**:

**Example: Editing CPU for Backend container**

**State 1: Default (hover)**
```
Backend
• CPU: 2 cores ✏️  ← Pencil icon appears on hover
• RAM: 2 GB ✏️
```

**State 2: Editing (click)**
```
Backend
• CPU: [2  ▼] cores  ← Inline input field or dropdown
      └─ Dropdown: 0.5, 1, 2, 4, 8, 16 cores
• RAM: 2 GB ✏️
```

**State 3: Changed (blur/enter)**
```
Backend
• CPU: 4 cores ✏️     +€15/mo ← Cost impact badge
• RAM: 2 GB ✏️
```

**Input Types by Field**:

**CPU/RAM** (dropdown with common values):
- **CPU**: 0.5, 1, 2, 4, 8, 16 cores
- **RAM**: 256MB, 512MB, 1GB, 2GB, 4GB, 8GB, 16GB, 32GB
- **Why**: Predefined values ensure valid configurations

**Replicas** (range input or number field):
- **Format**: "Min - Max" (e.g., "2 - 10")
- **Input**: Two number fields with validation
- **Validation**: Min ≥ 1, Max ≥ Min, Max ≤ 50
- **Why**: Flexible input for autoscaling configuration

**Storage** (number input with unit):
- **Database storage**: 10GB, 20GB, 50GB, 100GB, 200GB, 500GB
- **Format**: Number field + "GB" label
- **Why**: Common storage tiers

**Memory (Cache)** (dropdown):
- **Redis/Memcached**: 256MB, 512MB, 1GB, 2GB, 4GB, 8GB
- **Why**: Standard cache memory sizes

**Backup Retention** (dropdown):
- **Options**: 7 days, 14 days, 30 days, 60 days, 90 days
- **Why**: Common retention policies

**Why**: Different input types optimize for different value ranges and common patterns.

---

### Step 3: Real-time Price Updates
**Triggered by: Value change (on blur or dropdown selection)**

**Price Recalculation Flow**:

1. **User changes value** (e.g., CPU: 2 → 4 cores)
2. **Calculate new cost** for that resource
3. **Update section cost** (Backend: €45 → €60)
4. **Update total cost** (Total: €147 → €162)
5. **Show cost impact badge** next to changed value: `+€15/mo`

**Cost Impact Badge Design**:

**Visual Style**:
```
• CPU: 4 cores ✏️     +€15/mo
                      ^^^^^^^^
                      Small badge, subtle color
```

**Color Coding**:
- **Green badge**: Negative change (savings) `-€20/mo`
- **Yellow/Orange badge**: Positive change (increase) `+€15/mo`
- **No badge**: No cost impact (e.g., changing replicas within same tier)

**Badge Behavior**:
- ✅ Shows after edit completes (on blur)
- ✅ Fades away after 3-5 seconds (optional)
- ✅ Multiple badges can appear simultaneously
- ❌ Does NOT show while user is typing (non-invasive)

**Price Calculation Logic**:

```typescript
function calculateResourceCost(resource: Resource): number {
  // CPU: €10/core/month
  const cpuCost = resource.cpu * 10;
  
  // RAM: €5/GB/month
  const ramCost = resource.memory * 5;
  
  // Replicas: cost multiplied by min replicas (reserved capacity)
  const replicaCost = (cpuCost + ramCost) * resource.replicas.min;
  
  return replicaCost;
}

function updatePricing(updatedResource: Resource) {
  const newCost = calculateResourceCost(updatedResource);
  const oldCost = calculateResourceCost(previousResource);
  const impact = newCost - oldCost;
  
  // Update section cost
  updateSectionCost(resource.id, newCost);
  
  // Recalculate total
  const totalCost = sumAllResourceCosts();
  updateTotalDisplay(totalCost);
  
  // Show impact badge
  if (impact !== 0) {
    showCostImpact(resource.field, impact);
  }
}
```

**Why**: Immediate cost feedback helps users make informed decisions without deploying and discovering unexpected costs.

---

### Step 4: Validation and Warnings
**Triggered by: Invalid value entry or risky configuration**

**Validation Types**:

**1. Format Validation** (immediate, while typing):
```
CPU: [abc]  ← Invalid input
     ^^^^
     ❌ Must be a number
```
- Red border on input field
- Inline error message below field
- Deploy button remains enabled (can fix)

**2. Range Validation** (on blur):
```
RAM: [0.1 GB]  ← Below minimum
     ^^^^^^^^
     ⚠️ Minimum RAM is 256MB
```
- Yellow warning icon
- Suggestion: "Recommended: 512MB minimum"

**3. Performance Warnings** (non-blocking):
```
Backend
• CPU: 0.5 cores ✏️
• RAM: 256MB ✏️
  ⚠️ Low resources may impact performance for backend workloads
  💡 Recommended: 1 CPU, 1GB RAM minimum
```
- Warning icon with tooltip
- Does not block deployment
- Shows recommendation

**4. Cost Warnings** (significant changes):
```
Database Storage: [500 GB]  ← Large increase
                  ^^^^^^^^
                  ⚠️ This will increase cost by €120/month
                  Current: €65/mo → New: €185/mo
```
- Shows before/after comparison
- User can still proceed

**5. Dependency Validation** (blocking):
```
Frontend Replicas: Min [5] Max [3]
                          ^^^^^^^^
                          ❌ Max must be ≥ Min
```
- Red error state
- Deploy button disabled until fixed
- Clear error message

**Validation Rules**:

**CPU**:
- Min: 0.1 cores
- Max: 32 cores
- Warning if < 0.5 for backend

**RAM**:
- Min: 256MB
- Max: 64GB
- Warning if < 512MB for backend

**Replicas**:
- Min: 1
- Max: 50
- Max must be ≥ Min

**Storage (Database)**:
- Min: 10GB
- Max: 1TB
- Warning if > 200GB (significant cost)

**Cache Memory**:
- Min: 128MB
- Max: 16GB

**Why**: Prevent invalid configurations while allowing users to experiment freely within safe bounds.

---

### Step 5: Change Persistence
**Triggered by: Any value edit**

**Auto-save Behavior**:

1. **User edits value** (e.g., CPU: 2 → 4 cores)
2. **On blur/selection**: Value is validated
3. **If valid**: Immediately save to DeploymentContext
4. **Context updated**: `updateContainerResources(containerId, { cpu: 4 })`
5. **Changes persist**: If user navigates to `/resources`, new values are shown

**DeploymentContext Update**:

```typescript
// In DeploymentContext
const updateContainerResources = (
  containerId: string,
  updates: Partial<ContainerResources>
) => {
  setDeploymentState((prev) => ({
    ...prev,
    containers: prev.containers.map((container) =>
      container.id === containerId
        ? { ...container, resources: { ...container.resources, ...updates } }
        : container
    ),
  }));
  
  // Auto-save to localStorage
  saveToLocalStorage(deploymentState);
};
```

**Persistence Guarantees**:
- ✅ Changes saved immediately (no "Save" button needed)
- ✅ Survives page refresh (localStorage)
- ✅ Visible in `/resources` page if user goes back
- ✅ No "unsaved changes" warnings

**Why**: Seamless experience without manual save steps; users can navigate freely without losing work.

---

### Step 6: Navigation for Non-Editable Changes
**Triggered by: User needs to make structural changes**

**[Edit Layout] / [Edit Type] Buttons**:

**Containers Section**:
```
📦 Containers                           [Edit Layout]
```
- **Action**: Click [Edit Layout]
- **Navigation**: → `/resources` (container configuration step)
- **Why**: Adding/removing containers, changing images requires full configuration flow

**Database Section**:
```
🗄️ Database                            [Edit Type]
```
- **Action**: Click [Edit Type]
- **Navigation**: → `/resources#database` (scroll to database section)
- **Why**: Changing PostgreSQL → MongoDB requires reconfiguration

**Cache Section**:
```
💾 Cache                               [Edit Type]
```
- **Action**: Click [Edit Type]
- **Navigation**: → `/resources#cache`

**Navigation Behavior**:
- Preserves all current changes (already saved to context)
- Opens `/resources` page with focus on relevant section
- User can make structural changes
- Click "Next" → returns to `/review` page

**Breadcrumb/Back Navigation**:
- Review page shows step indicator
- User can click any previous step to navigate back
- All changes are preserved

**Why**: Clear separation between quick tweaks (inline) and structural changes (full configuration).

---

### Step 7: Deploy with Changes
**Triggered by: User clicks "Deploy Project"**

**Deploy Button Behavior**:

**Always Enabled**:
- No change count indicator needed
- No "Deploy with changes" text
- Standard button: **"Deploy Project"**
- **Why**: This is initial deployment, all changes are part of the configuration

**Pre-deployment Validation**:
```typescript
const handleDeploy = () => {
  // 1. Validate all configurations
  const validationErrors = validateDeploymentConfig(deploymentState);
  
  if (validationErrors.length > 0) {
    // Show error modal with issues
    showValidationErrors(validationErrors);
    return;
  }
  
  // 2. Show final confirmation with total cost
  showDeploymentConfirmation({
    totalCost: calculateTotalCost(deploymentState),
    containers: deploymentState.containers.length,
    services: deploymentState.services.length,
  });
};
```

**Deployment Confirmation Modal**:
```
🚀 Deploy Your Project?

Configuration Summary:
• 2 containers (frontend, backend)
• PostgreSQL database (20GB)
• Redis cache (512MB)

Total Monthly Cost: €147

[Cancel]  [Deploy Project]
```

**Why**: Simple, clear deployment flow with final cost confirmation; no ambiguity about changes.

---

### Step 8: Cost Summary Component
**Component: Real-time Cost Breakdown**

**Display Location**: Bottom of review page or sidebar

**Structure**:
```
┌─────────────────────────────────────┐
│ 💰 Monthly Cost Breakdown          │
├─────────────────────────────────────┤
│                                     │
│ Containers:                €67/mo  │
│ ├─ Frontend (1 CPU, 1GB)   €22     │
│ └─ Backend (2 CPU, 2GB)    €45     │
│                                     │
│ Infrastructure:            €80/mo  │
│ ├─ PostgreSQL (20GB)       €65     │
│ └─ Redis (512MB)           €15     │
│                                     │
│ Platform:                  €0/mo   │
│ ├─ Load Balancer          Included │
│ ├─ SSL Certificate        Included │
│ └─ Monitoring             Included │
│                                     │
│ ─────────────────────────────────  │
│ Total: €147/month                  │
│                                     │
│ 💡 Estimated bandwidth: €10/mo    │
│    (scales with actual usage)      │
└─────────────────────────────────────┘
```

**Update Behavior**:
- Recalculates on every value change
- Smooth animation when values update
- Highlights changed sections briefly
- Shows breakdown to justify cost

**Interactive Features**:
- **Hover on cost**: Show tooltip with calculation breakdown
- **Click section**: Scroll to that configuration section
- **Cost history** (optional): "You've saved €30/mo from initial estimate"

**Why**: Transparent cost breakdown builds trust and helps users understand where their money goes.

---

## Technical Implementation Notes

### State Management

```typescript
interface ReviewPageState {
  isEditing: string | null; // field ID currently being edited
  originalValues: Record<string, any>; // for comparison
  costImpacts: Record<string, number>; // track per-field impact
  validationErrors: Record<string, string>; // validation messages
}

// Real-time price calculation
const calculateCost = (config: DeploymentConfig): Cost => {
  const containerCost = config.containers.reduce((sum, container) => {
    const baseCost = (container.cpu * 10 + container.memory * 5);
    return sum + (baseCost * container.replicas.min);
  }, 0);
  
  const dbCost = config.database.storage * 3; // €3/GB
  const cacheCost = config.cache.memory * 15; // €15/GB
  
  return {
    containers: containerCost,
    infrastructure: dbCost + cacheCost,
    total: containerCost + dbCost + cacheCost,
  };
};
```

### Validation Engine

```typescript
interface ValidationRule {
  field: string;
  check: (value: any, config: DeploymentConfig) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const validationRules: ValidationRule[] = [
  {
    field: 'container.resources.cpu',
    check: (cpu) => cpu >= 0.1 && cpu <= 32,
    message: 'CPU must be between 0.1 and 32 cores',
    severity: 'error',
  },
  {
    field: 'container.resources.ram',
    check: (ram) => ram >= 256,
    message: 'Minimum RAM is 256MB',
    severity: 'error',
  },
  {
    field: 'container.resources.cpu',
    check: (cpu, config) => {
      if (config.containerType === 'backend' && cpu < 0.5) {
        return false;
      }
      return true;
    },
    message: 'Backend containers should have at least 0.5 CPU',
    severity: 'warning',
  },
];
```

### Cost Impact Display

```typescript
const showCostImpact = (fieldId: string, impact: number) => {
  // Add badge to UI
  const badge = createImpactBadge(impact);
  
  // Auto-hide after 5 seconds (optional)
  setTimeout(() => {
    badge.fadeOut();
  }, 5000);
};

const createImpactBadge = (impact: number) => {
  const sign = impact > 0 ? '+' : '';
  const color = impact > 0 ? 'yellow' : 'green';
  const text = `${sign}€${Math.abs(impact)}/mo`;
  
  return { text, color };
};
```

---

## User Experience Considerations

### Visual Feedback

**Hover States**:
- Pencil icon appears on hover
- Subtle highlight on editable values
- Cursor changes to pointer

**Editing States**:
- Input field replaces static text
- Focus state clearly visible
- Dropdown/picker styled consistently

**Loading States**:
- Spinner during price recalculation (if async)
- Optimistic updates (update UI immediately, sync in background)

**Success States**:
- Brief highlight animation on value change
- Cost badge appears smoothly
- Total cost updates with animation

### Accessibility

**Keyboard Navigation**:
- Tab between editable fields
- Enter to activate/save
- Escape to cancel edit
- Arrow keys in dropdowns

**Screen Readers**:
- ARIA labels for all inputs
- Announce price changes
- Validation errors read aloud

**Focus Management**:
- Focus moves to input on click
- Returns to trigger element after edit
- Visible focus indicators

---

## Success Metrics

- **Edit engagement rate**: % of users who edit values on review page
- **Average edits per user**: How many tweaks before deploying
- **Most edited fields**: Which resources users adjust most (CPU, RAM, storage)
- **Cost variance**: Average difference between initial and final configuration cost
- **Time on review page**: Increased time = good (users are experimenting)
- **Deploy confidence**: Survey users on confidence level after reviewing

---

## Future Enhancements (Not in MVP)

- [ ] **Preset configurations**: "Optimize for cost" / "Optimize for performance" buttons
- [ ] **Cost scenarios**: "Show cost at 2x traffic" / "Show cost at 50% scale"
- [ ] **Comparison view**: Side-by-side comparison of current vs previous configuration
- [ ] **Undo/redo**: Allow reverting changes
- [ ] **Configuration templates**: Save current config as template for future projects
- [ ] **Cost forecast**: Predict monthly cost based on usage patterns
- [ ] **Bulk editing**: "Apply same CPU to all containers"
- [ ] **Advanced mode**: Show raw YAML for power users

---

## Related Specifications

- **View current deployment config** (`view-current-deployment-config.md`): Similar editing patterns for post-deployment config changes
- **Multi-container support** (`multi-container-support.md`): Defines container resource structure being edited
