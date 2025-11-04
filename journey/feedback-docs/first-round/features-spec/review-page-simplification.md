## Review Page Simplification Specification

**Status**: 🔴 TO_DO

**Feature**: Restore clean card-based layout for review page with multi-container support and remove architecture diagram

**Source**: User feedback - UX improvement

**Priority**: HIGH (blocks deploy flow clarity)

**Related**: 
- Builds on: Multi-Container Support (Phase 2)
- Enables: Cleaner pre-deploy review experience

---

### Overview

The current review page shows an architecture diagram that, while visually impressive, adds cognitive load during the final pre-deployment review. Users need a fast, actionable interface to verify and adjust configurations before deploying—not an educational visualization.

This spec restores the clean card-based layout from `page_singlecontainer.tsx` while extending it to support multiple containers from the multi-container feature.

---

### Current Problems

1. **Architecture diagram is distracting**: Takes up significant screen space and shifts focus from "review & edit" to "understand architecture"
2. **Mixed purposes**: Trying to serve both editing and visualization needs in one view
3. **Cognitive overload**: Too much visual information when users just want to verify settings
4. **Poor mobile experience**: Architecture diagram doesn't scale well on smaller screens

---

### Proposed Solution

**Restore card-based layout with multi-container support:**

1. **Remove architecture diagram section entirely**
2. **Use clean card grid** (like `page_singlecontainer.tsx`)
3. **Show one card per resource type:**
   - Application containers (one card per container)
   - Database (if configured)
   - Cache (if configured)
   - Domain
   - Environment summary
4. **Keep all inline editing functionality**
5. **Maintain cost summary hero section at top**
6. **Keep "What's Included" section at bottom**

---

### User Interface

#### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Header: "Ready to Deploy"                      │
│ Subtitle: "Review and adjust resources"        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ COST SUMMARY (Hero - Gradient Purple/Blue)     │
│                                                 │
│  €XXX.XX /month                                │
│                                                 │
│  Grid: Application | Database | Cache | LB     │
└─────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬───────────┐
│ 🚀 Container 1   │ 🚀 Container 2   │ 🐘 DB     │
│ [Edit Resources] │ [Edit Resources] │ [Edit]    │
│                  │                  │           │
│ CPU: [dropdown]  │ CPU: [dropdown]  │ CPU: [▼]  │
│ Memory: [▼]      │ Memory: [▼]      │ Mem: [▼]  │
│ Replicas: [#]    │ Replicas: [#]    │ Stor: [▼] │
│                  │                  │           │
│ 💾 Volume: 50GB  │ (no volume)      │           │
└──────────────────┴──────────────────┴───────────┘

┌──────────────────┬──────────────────────────────┐
│ ⚡ Cache         │ 🌐 Domain                    │
│ [Edit Resources] │ [Edit Domain]                │
│                  │                              │
│ Memory: [▼]      │ Default: subdomain.unhazzle  │
│                  │ Custom: example.com          │
│                  │ 🔒 SSL auto-provisioned      │
└──────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔐 Environment                                  │
│                                                 │
│ Auto-generated vars: X                          │
│ User secrets: Y                                 │
│ 🔐 AES-256 encrypted                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✨ Benefit from these built-in unhazzle features│
│                                                 │
│ [3-column feature grid]                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 💰 Transparent pricing (info box)               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ← Back                    🚀 Deploy Now →       │
└─────────────────────────────────────────────────┘
```

---

### Multi-Container Support Details

#### Container Cards (Dynamic)

**Show one card per container** (from `state.containers` array):

```tsx
{state.containers.map((container, index) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <span>🚀</span>
        <span>Container {index + 1}</span>
        <span className="text-sm text-slate-500">
          ({getDisplayName(container.imageUrl)})
        </span>
      </h3>
      <button onClick={() => router.push(`/resources#container-${container.id}`)}>
        Edit Resources
      </button>
    </div>
    
    {/* Inline editing for CPU, Memory, Replicas */}
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span>CPU</span>
        <select value={container.resources.cpu} onChange={...}>
          {/* CPU options */}
        </select>
      </div>
      
      <div className="flex justify-between">
        <span>Memory</span>
        <select value={container.resources.memory} onChange={...}>
          {/* Memory options */}
        </select>
      </div>
      
      <div className="flex justify-between">
        <span>Replicas</span>
        <input type="number" value={container.resources.replicas.min} onChange={...} />
      </div>
      
      {/* Show volume if configured */}
      {container.volume && (
        <>
          <div className="border-t pt-3">
            <div className="flex items-center gap-1 mb-2">
              <span>💾</span>
              <span>Persistent Volume</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Size</span>
            <select value={container.volume.sizeGB} onChange={...}>
              {/* Size options */}
            </select>
          </div>
          <div className="flex justify-between">
            <span>Mount path</span>
            <code>{container.volume.mountPath}</code>
          </div>
        </>
      )}
      
      {/* Show exposure type */}
      <div className="flex justify-between">
        <span>Exposure</span>
        <span className="font-semibold">
          {container.exposure === 'public' ? '🌐 Public' : '🔒 Private'}
        </span>
      </div>
      
      {/* Show port */}
      <div className="flex justify-between">
        <span>Port</span>
        <code className="bg-slate-100 px-2 py-1 rounded">
          {container.port}
        </code>
      </div>
    </div>
  </div>
))}
```

---

### Cost Calculation (Multi-Container)

**Update cost summary to aggregate all containers:**

```tsx
// Cost breakdown includes all containers
const totalApplicationCost = state.containers.reduce((total, container) => {
  const cpuCost = getCPUCost(container.resources.cpu);
  const memoryCost = getMemoryCost(container.resources.memory);
  const replicaCost = (cpuCost + memoryCost) * container.resources.replicas.min;
  
  const volumeCost = container.volume 
    ? container.volume.sizeGB * 0.044 
    : 0;
  
  const backupCost = container.volume?.backupFrequency !== 'disabled'
    ? replicaCost * 0.20
    : 0;
  
  return total + replicaCost + volumeCost + backupCost;
}, 0);

// Display in hero section
<div className="bg-white/10 backdrop-blur rounded-lg p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-purple-100 text-sm">Application</p>
      <p className="text-2xl font-bold">€{totalApplicationCost.toFixed(2)}</p>
      <p className="text-purple-200 text-xs mt-1">
        {state.containers.length} container(s)
      </p>
    </div>
    <div className="text-3xl">🚀</div>
  </div>
</div>
```

---

### Inline Editing (Preserved)

**All existing inline editing functionality is preserved:**

1. ✅ CPU dropdowns with real-time cost updates
2. ✅ Memory dropdowns with recalculation
3. ✅ Replica number inputs
4. ✅ Volume size dropdowns (per container)
5. ✅ Database resource dropdowns
6. ✅ Cache memory dropdowns
7. ✅ Loading state with opacity blur during recalculation
8. ✅ "Edit Resources" buttons with hash navigation to Resources page

**Recalculation logic:**
```tsx
const recalculateAndUpdateCost = () => {
  setIsRecalculating(true);
  
  setTimeout(() => {
    // Aggregate costs for all containers
    const newCost = calculateMultiContainerCost(state);
    setCost(newCost);
    updateCost(newCost);
    setIsRecalculating(false);
  }, 150);
};
```

---

### Database & Cache Cards (Unchanged)

**Keep existing database and cache cards from `page_singlecontainer.tsx`:**

- Database: CPU, Memory, Storage dropdowns (if configured)
- Cache: Memory dropdown (if configured)
- Both show "Edit Resources" button → `/resources#database` or `/resources#cache`

---

### Domain & Environment Cards (Unchanged)

**Keep existing cards:**

- **Domain**: Shows default subdomain + custom domain (if set) + SSL badge
- **Environment**: Shows count of auto-generated vars + user secrets + encryption badge

---

### What's Included Section (Unchanged)

**Keep the 3-column feature showcase:**

1. Infrastructure (Hetzner, NVMe SSD, 10Gbit, 20TB bandwidth)
2. High Availability (Auto-scaling, zero-downtime, health checks, failover)
3. Security & Compliance (SSL, DDoS, encryption, GDPR)

---

### Pricing Note (Unchanged)

**Keep the transparent pricing info box:**

- Infrastructure costs explanation
- 30% margin disclosure
- Auto-scaling cost behavior
- Bandwidth, storage pricing
- "No hidden fees" guarantee

---

### Action Buttons (Unchanged)

**Keep existing button layout:**

```tsx
<div className="flex items-center justify-between">
  <button onClick={() => router.back()}>
    ← Back
  </button>
  <button onClick={handleDeploy} disabled={isDeploying}>
    {isDeploying ? '⏳ Deploying...' : '🚀 Deploy Now'}
  </button>
</div>
```

---

### Implementation Checklist

- [ ] Remove architecture diagram section from current `/review/page.tsx`
- [ ] Copy card-based layout structure from `page_singlecontainer.tsx`
- [ ] Update application section to loop over `state.containers[]` array
- [ ] Add per-container cards with:
  - [ ] Container number + display name (from image)
  - [ ] CPU/Memory/Replicas inline editing
  - [ ] Volume section (if configured)
  - [ ] Exposure type display
  - [ ] Port display
  - [ ] "Edit Resources" button with hash navigation
- [ ] Update cost calculation to aggregate all containers
- [ ] Update cost hero section to show total application cost for all containers
- [ ] Add container count indicator (e.g., "3 container(s)")
- [ ] Preserve all database/cache/domain/environment cards (no changes)
- [ ] Preserve "What's Included" section
- [ ] Preserve "Transparent Pricing" note
- [ ] Test inline editing recalculation with multiple containers
- [ ] Test hash navigation from "Edit Resources" buttons
- [ ] Verify cost accuracy with volume + backup costs
- [ ] Test with 1, 2, 3, 4, 5 containers
- [ ] Verify responsive layout (mobile, tablet, desktop)

---

### Files to Modify

**Primary:**
- `prototype-app/app/review/page.tsx` - Complete rewrite using `page_singlecontainer.tsx` as base

**Utilities (may need updates):**
- `prototype-app/lib/utils/costCalculator.ts` - Ensure multi-container aggregation works

**Context (no changes needed):**
- `prototype-app/lib/context/DeploymentContext.tsx` - Already supports `containers[]`

---

### Testing Scenarios

1. **Single container**: Should match `page_singlecontainer.tsx` exactly
2. **Multiple containers (2-5)**: Each gets its own card with inline editing
3. **Mixed configurations**: Container 1 with volume, Container 2 without
4. **Cost recalculation**: Change CPU on Container 2 → see total app cost update
5. **Edit navigation**: Click "Edit Resources" → lands on Resources page with correct hash
6. **Database/Cache editing**: Still works independently
7. **Deploy flow**: Can deploy after reviewing/editing

---

### Success Criteria

✅ **Review page is clean and focused**
✅ **All containers are editable inline**
✅ **Cost calculation accurate for multi-container**
✅ **No architecture diagram clutter**
✅ **Fast review → edit → deploy flow**
✅ **Mobile responsive**
✅ **Hash navigation works for all resources**
✅ **No TypeScript/build errors**

---

### Notes

- Architecture diagram will be moved to Dashboard (see companion spec: `dashboard-architecture-view.md`)
- This change **improves UX** by separating "review & edit" from "understand architecture"
- The card layout scales better on mobile than the diagram
- Inline editing is faster than navigating back to Resources page
- Multi-container cost aggregation is transparent in hero section
