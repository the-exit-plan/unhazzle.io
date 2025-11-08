# Remove Application, Database, or Cache

Status: Completed

Completion date: 2025-11-08

Implementation notes:
- Context: added `removeDatabase()`, `removeCache()`, and `removeContainer()` in `prototype-app/lib/context/DeploymentContext.tsx` with proper cleanup of service access and env vars.
- Resources page: removal controls for apps/DB/cache with immediate state updates (`app/resources/page.tsx`).
- Review page: removal controls pre-deploy for apps/DB/cache (`app/review/page.tsx`).
- Dashboard Overview (post-deploy): removal controls for containers/DB/cache integrated into `ContainerEditor`, `DatabaseEditor`, and `CacheEditor` components with proper validation (`app/dashboard/page.tsx`).
- Fixed SSR/hydration and nested button issues observed during implementation.
- **Update 2025-11-08**: Restored removal functionality in the new `HybridOverview` component after dashboard refactoring. Added "Remove" buttons to all resource editors with proper validation:
  - `ContainerEditor`: Prevents removal of last container
  - `DatabaseEditor`: Checks for container dependencies before removal
  - `CacheEditor`: Checks for container dependencies before removal

## Overview
Enable users to remove (delete) applications, databases, or cache resources from their deployment configuration. This action should be available in the Resources and Review pages before deployment, and in the Overview tab after deployment. State must be updated immediately after removal.

## User Stories
- As a user, I want to remove an application, database, or cache from my deployment before launching, so I can adjust my configuration.
- As a user, I want to remove a database or cache from the Overview tab after deployment, unless it is still accessed by an application.

## Acceptance Criteria
### Resources & Review Pages (Pre-Deployment)
- Users can remove any application, database, or cache listed in the configuration.
- Removal is performed via a visible delete/remove button next to each resource.
- After removal, the deployment state is updated and cost recalculated.
- If all applications are removed, show an empty state and prompt to add a new application.
- If all databases or caches are removed, show an empty state and prompt to add a new resource.

### Overview Tab (Post-Deployment)
- Users can remove databases or caches from the Overview tab.
- If a database or cache is still accessed by any application, show a warning and block removal ("Cannot remove: still in use by application {name}").
- If not accessed, allow removal and update state immediately.
- Cost breakdown updates after removal.

## State Management
- Use `updateState()` to remove the resource and trigger cost recalculation.
- Ensure all references to the removed resource are deleted from state (e.g., environment variables, service access).
- Validate that no orphaned connections remain after removal.

## UI/UX
- Show a confirmation dialog before final removal.
- Display inline error if removal is blocked due to active connections.
- Use Tailwind for styling; match existing button and card patterns.
- Update cost display and resource lists in real time.

## Validation Rules
- Cannot remove a database or cache if any application is still connected to it.
- Can always remove applications.
- After removal, validate that state and UI reflect the change immediately.

## Example
```tsx
// Remove button in resource list
<button className="text-red-600" onClick={() => confirmRemove(resourceId)}>
  Remove
</button>

// Blocked removal (Overview tab)
{isInUse && (
  <div className="text-red-500 text-sm mt-2">
    Cannot remove: still in use by application {appName}
  </div>
)}
```

## Related Specs
- [Review page simplification](./review-page-simplification.md)
- [Multi-container support](./multi-container-support.md)
- [View current deployment config](./view-current-deployment-config.md)
