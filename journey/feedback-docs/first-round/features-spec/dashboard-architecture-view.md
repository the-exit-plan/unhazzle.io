## Dashboard Architecture View Specification

**Status**: ✅ DONE

**Feature**: Add read-only architecture diagram to Dashboard Overview as informational view

**Source**: User feedback - UX improvement

**Priority**: MEDIUM (educational enhancement)

**Related**: 
- Companion to: Review Page Simplification
- Builds on: Multi-Container Support (Phase 2)

**Implementation Date**: November 4, 2025

---

### ✅ Implementation Summary

**Completed Features:**
1. ✅ New "Architecture Diagram" sidebar section in Dashboard Overview
2. ✅ Full ArchitectureDiagram component with dynamic rendering
3. ✅ Read-only informational view with blue info box
4. ✅ Internal DNS reference table with all services
5. ✅ Multi-container support with public/private separation
6. ✅ Color-coded legend (purple, blue, gray, green, red)
7. ✅ Responsive layout with flex-wrap
8. ✅ Service name generation from container IDs
9. ✅ Example connection strings for easy reference
10. ✅ Zero TypeScript errors - builds successfully

**Files Modified:**
- `prototype-app/app/dashboard/page.tsx` - Added sidebar section, architecture view panel, and ArchitectureDiagram component

**Testing:**
- ✅ Development server running at http://localhost:3000
- ✅ No compilation errors
- ✅ All TypeScript checks passed
- ✅ Ready for user testing

---

### Overview

The architecture diagram currently lives on the Review page, where it adds cognitive load during pre-deploy configuration review. However, the diagram **is valuable** as an educational/informational tool—just not during the review process.

This spec moves the architecture diagram to the Dashboard Overview page, where it serves as a **post-deploy reference** for understanding how containers connect, what internal DNS names are used, and how the infrastructure is organized.

---

### Current Problems

1. **Architecture diagram is valuable but misplaced**: Useful for understanding, not for reviewing
2. **No post-deploy architecture reference**: Once deployed, users have no way to see system topology
3. **Missing internal DNS documentation**: Users don't see container-to-container networking details
4. **Educational value is lost**: Diagram should help users understand their infrastructure

---

### Proposed Solution

**Add "Architecture Diagram" view to Dashboard Overview:**

1. **New sidebar button** in Dashboard Overview left panel:
   - Add below existing sections (Application Containers, Database, Cache)
   - Label: "🏗️ Architecture Diagram"
   - Behavior: When clicked, right panel shows read-only architecture visualization
2. **Read-only view** (no editing):
   - Purpose: Informational reference, not configuration
   - Show deployed infrastructure topology
   - Highlight container connections and internal DNS
   - Display service dependencies
3. **Dynamic content**:
   - Reflect actual deployed state (not staged changes)
   - Show all containers from `state.containers[]`
   - Show database/cache if configured
   - Show load balancer if any container is public

---

### User Interface

#### Left Sidebar (New Section)

**Add new section after Cache:**

```tsx
<div className="space-y-2 border-t pt-4">
  <button
    onClick={() => setSelectedView('architecture')}
    className={cn(
      "w-full text-left px-4 py-3 rounded-lg transition-colors",
      "flex items-center gap-3",
      selectedView === 'architecture'
        ? "bg-purple-50 text-purple-700 font-semibold"
        : "text-slate-700 hover:bg-slate-100"
    )}
  >
    <span className="text-2xl">🏗️</span>
    <span>Architecture Diagram</span>
  </button>
  
  <p className="px-4 text-xs text-slate-500">
    View infrastructure topology and internal DNS
  </p>
</div>
```

---

#### Right Panel (Architecture View)

**When `selectedView === 'architecture'`:**

```tsx
{selectedView === 'architecture' && (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        🏗️ Architecture Diagram
      </h2>
      <p className="text-slate-600">
        Visual representation of your deployed infrastructure, 
        including container connections and internal DNS.
      </p>
    </div>
    
    {/* Info box */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">ℹ️</span>
        <div>
          <p className="text-sm text-blue-900 font-semibold mb-1">
            Read-Only Reference
          </p>
          <p className="text-sm text-blue-800">
            This diagram shows your <strong>deployed</strong> infrastructure. 
            To edit resources, use the configuration panels in the left sidebar.
          </p>
        </div>
      </div>
    </div>
    
    {/* Architecture visualization */}
    <ArchitectureDiagram state={state} />
    
    {/* Internal DNS reference table */}
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span>🔗</span>
        <span>Internal DNS Names</span>
      </h3>
      
      <div className="space-y-3 text-sm">
        <p className="text-slate-600 mb-4">
          Use these hostnames for container-to-container communication:
        </p>
        
        {/* Container DNS entries */}
        {state.containers.map((container, index) => (
          <div key={container.id} className="flex items-center justify-between py-2 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-lg">🚀</span>
              <div>
                <p className="font-semibold text-slate-900">
                  Container {index + 1}
                </p>
                <p className="text-xs text-slate-500">
                  {getDisplayName(container.imageUrl)}
                </p>
              </div>
            </div>
            <code className="bg-white px-3 py-1 rounded border border-slate-300 font-mono text-xs">
              {container.serviceName || `container-${container.id}`}.internal
            </code>
          </div>
        ))}
        
        {/* Database DNS */}
        {state.resources.database && (
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-lg">🐘</span>
              <div>
                <p className="font-semibold text-slate-900">
                  PostgreSQL Database
                </p>
                <p className="text-xs text-slate-500">
                  Internal network only
                </p>
              </div>
            </div>
            <code className="bg-white px-3 py-1 rounded border border-slate-300 font-mono text-xs">
              postgres.internal
            </code>
          </div>
        )}
        
        {/* Cache DNS */}
        {state.resources.cache && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="font-semibold text-slate-900">
                  Redis Cache
                </p>
                <p className="text-xs text-slate-500">
                  Internal network only
                </p>
              </div>
            </div>
            <code className="bg-white px-3 py-1 rounded border border-slate-300 font-mono text-xs">
              redis.internal
            </code>
          </div>
        )}
      </div>
      
      {/* Usage example */}
      <div className="mt-6 bg-white border border-slate-300 rounded-lg p-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">
          Example Connection String:
        </p>
        <code className="text-xs font-mono text-slate-900">
          postgresql://user:pass@postgres.internal:5432/dbname
        </code>
      </div>
    </div>
  </div>
)}
```

---

### Architecture Diagram Component

**Reuse existing diagram from Review page (with modifications):**

```tsx
const ArchitectureDiagram: React.FC<{ state: DeploymentState }> = ({ state }) => {
  const publicContainers = state.containers.filter(c => c.exposure === 'public');
  const privateContainers = state.containers.filter(c => c.exposure === 'private');
  const hasLoadBalancer = publicContainers.length > 0;
  const hasDatabase = state.resources.database !== null;
  const hasCache = state.resources.cache !== null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200">
      <div className="flex flex-col items-center space-y-8">
        
        {/* Load Balancer (if public containers exist) */}
        {hasLoadBalancer && (
          <>
            <div className="bg-purple-500 text-white rounded-lg p-6 shadow-lg text-center min-w-[200px]">
              <div className="text-3xl mb-2">⚖️</div>
              <div className="font-bold">Load Balancer</div>
              <div className="text-sm opacity-90 mt-1">
                {state.deployment.domain.type === 'custom' 
                  ? state.deployment.domain.customDomain 
                  : `${state.deployment.domain.subdomain}.unhazzle.io`}
              </div>
            </div>
            
            {/* Arrow down */}
            <div className="text-slate-400">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <line x1="20" y1="0" x2="20" y2="30" stroke="currentColor" strokeWidth="3"/>
                <polygon points="20,40 15,30 25,30" fill="currentColor"/>
              </svg>
            </div>
          </>
        )}
        
        {/* Public Containers Row */}
        {publicContainers.length > 0 && (
          <div className="flex gap-6 flex-wrap justify-center">
            {publicContainers.map((container, index) => (
              <div 
                key={container.id}
                className="bg-blue-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]"
              >
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-bold text-sm">Container {state.containers.indexOf(container) + 1}</div>
                <div className="text-xs opacity-90 mt-1">
                  {getDisplayName(container.imageUrl)}
                </div>
                <div className="text-xs opacity-75 mt-2">
                  :{container.port}
                </div>
                <div className="text-xs font-mono bg-blue-600 rounded px-2 py-1 mt-2">
                  {container.serviceName || `container-${container.id}`}.internal
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Private Containers Row */}
        {privateContainers.length > 0 && (
          <>
            {publicContainers.length > 0 && (
              <div className="text-slate-400 text-sm">Internal Network</div>
            )}
            
            <div className="flex gap-6 flex-wrap justify-center">
              {privateContainers.map((container, index) => (
                <div 
                  key={container.id}
                  className="bg-slate-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]"
                >
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-bold text-sm">Container {state.containers.indexOf(container) + 1}</div>
                  <div className="text-xs opacity-90 mt-1">
                    {getDisplayName(container.imageUrl)}
                  </div>
                  <div className="text-xs opacity-75 mt-2">
                    :{container.port}
                  </div>
                  <div className="text-xs font-mono bg-slate-600 rounded px-2 py-1 mt-2">
                    {container.serviceName || `container-${container.id}`}.internal
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Database & Cache Row */}
        {(hasDatabase || hasCache) && (
          <>
            <div className="text-slate-400 text-sm">Backend Services</div>
            
            <div className="flex gap-6">
              {hasDatabase && (
                <div className="bg-green-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]">
                  <div className="text-2xl mb-2">🐘</div>
                  <div className="font-bold text-sm">PostgreSQL</div>
                  <div className="text-xs opacity-90 mt-1">
                    {state.resources.database.cpu} CPU
                  </div>
                  <div className="text-xs font-mono bg-green-600 rounded px-2 py-1 mt-2">
                    postgres.internal
                  </div>
                </div>
              )}
              
              {hasCache && (
                <div className="bg-red-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-bold text-sm">Redis</div>
                  <div className="text-xs opacity-90 mt-1">
                    {state.resources.cache.memory}GB RAM
                  </div>
                  <div className="text-xs font-mono bg-red-600 rounded px-2 py-1 mt-2">
                    redis.internal
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
      </div>
      
      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-slate-300 flex flex-wrap gap-4 justify-center text-sm">
        {hasLoadBalancer && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-slate-700">Public Internet</span>
          </div>
        )}
        {publicContainers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-slate-700">Public Container</span>
          </div>
        )}
        {privateContainers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-500 rounded"></div>
            <span className="text-slate-700">Private Container</span>
          </div>
        )}
        {hasDatabase && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-slate-700">Database</span>
          </div>
        )}
        {hasCache && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-slate-700">Cache</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### Internal DNS Reference Table

**Purpose**: Provide copy-pastable DNS names for container-to-container communication

**Features**:
1. List all containers with their internal DNS names
2. Show database DNS (if configured)
3. Show cache DNS (if configured)
4. Provide example connection string
5. Highlight that services are on internal network (not publicly accessible)

**Dynamic generation**:
```tsx
// Generate service names
const getServiceName = (container: Container) => {
  return container.serviceName || `container-${container.id}`;
};

// Internal DNS format
const internalDns = `${getServiceName(container)}.internal`;
```

---

### State Management

**No new state needed** - uses existing `DeploymentContext`:

```tsx
const { state } = useDeploymentContext();

// selectedView state (already exists in Dashboard)
const [selectedView, setSelectedView] = useState<
  'overview' | 'container' | 'database' | 'cache' | 'architecture'
>('overview');
```

---

### Behavior & Interaction

1. **Sidebar click**: 
   - Click "🏗️ Architecture Diagram" → Right panel shows diagram
   - Sidebar button highlights (purple background)

2. **Read-only view**:
   - No editing controls
   - No "Apply" button
   - No staged changes
   - Purely informational

3. **Dynamic content**:
   - Reflects current deployed state
   - Updates when resources are changed via Apply in other panels

4. **Navigation**:
   - Users can switch back to other panels (Application, Database, Cache)
   - Architecture view is just another sidebar option

---

### Multi-Container Support

**Diagram scales with container count:**

- **1 container**: Simple linear flow (LB → Container → DB/Cache)
- **2-3 containers**: Horizontal layout with clear grouping
- **4-5 containers**: Wraps to multi-row grid with flex-wrap
- **Public + Private**: Separate visual rows with "Internal Network" label
- **All private (no LB)**: Show only containers + backend services

**Service naming**:
```tsx
// Each container gets unique DNS
container.serviceName || `container-${container.id}`;

// Examples:
// - api-server.internal
// - worker.internal
// - frontend.internal
// - container-abc123.internal (fallback)
```

---

### Implementation Checklist

- [x] Add "Architecture Diagram" section to Dashboard Overview left sidebar
- [x] Create `ArchitectureDiagram` component (extract from Review page)
- [x] Update sidebar state to include `'architecture'` view option
- [x] Implement right panel view for `selectedView === 'architecture'`
- [x] Add info box explaining read-only nature
- [x] Build Internal DNS reference table component
- [x] Generate service names dynamically from `state.containers[]`
- [x] Add database DNS entry (if configured)
- [x] Add cache DNS entry (if configured)
- [x] Add example connection string
- [x] Style architecture diagram with responsive layout
- [x] Add legend to diagram (color-coded resource types)
- [x] Test with single container deployment
- [x] Test with multi-container (2-5 containers)
- [x] Test with public + private container mix
- [x] Test with database + cache enabled
- [x] Test with all-private containers (no load balancer)
- [x] Verify responsive layout on mobile/tablet
- [x] Ensure no TypeScript errors

---

### Files to Modify

**Primary:**
- `prototype-app/app/dashboard/page.tsx` - Add new sidebar section + architecture view

**New Components (optional - can inline if preferred):**
- `prototype-app/app/dashboard/ArchitectureDiagram.tsx` - Extract diagram component
- `prototype-app/app/dashboard/InternalDnsTable.tsx` - DNS reference table

**Utilities (no changes needed):**
- `prototype-app/lib/context/DeploymentContext.tsx` - No changes

---

### Testing Scenarios

1. **Navigation**: Click "Architecture Diagram" → See diagram + DNS table
2. **Single container**: Diagram shows simple flow
3. **Multi-container**: Diagram shows all containers in organized layout
4. **Public + Private mix**: Separate visual rows with labels
5. **Database + Cache**: Backend services row appears
6. **All private (no LB)**: No load balancer shown
7. **Internal DNS**: All containers listed with correct `.internal` hostnames
8. **Example connection string**: Shows postgres.internal usage
9. **Read-only**: No edit controls visible
10. **Switch views**: Can navigate back to Application/Database/Cache panels

---

### Success Criteria

✅ **Architecture diagram available post-deploy**
✅ **Clear visual representation of infrastructure**
✅ **Internal DNS documented and copy-pastable**
✅ **Read-only view (no confusion with editing)**
✅ **Scales with multi-container deployments**
✅ **Responsive on mobile/tablet**
✅ **Educational value preserved**
✅ **No TypeScript/build errors**

---

### Notes

- This complements the Review page simplification (see companion spec: `review-page-simplification.md`)
- Architecture diagram is **valuable** - we're just moving it to the right place (post-deploy reference)
- Internal DNS table is critical for container-to-container communication
- Read-only nature prevents confusion with config editing
- Diagram updates when resources change via Apply in other panels
- Service naming should match actual Kubernetes/Docker service names
