# Feature Spec: Dashboard as Project & Environment Navigator

**Status**: Ready for Implementation  
**Created**: November 8, 2025  
**Source**: MVP Feedback - Environment Visualization (Jeroen/Eveline)

---

## Overview

Repurpose the existing dashboard page as the main navigation hub for projects and environments. The "Overview" tab becomes the primary way for users to browse all their projects, environments, and resources in a hierarchical structure. Users can create new projects via a prominent "Create Project" action that redirects to the questionnaire flow.

---

## User Stories

- As a user, I want the dashboard's "Overview" tab to let me browse all my projects and their environments/resources in a clear hierarchy.
- As a user, I want a prominent "Create Project" button that takes me to the questionnaire flow to set up a new project.
- As a user, I expect every new project to start with a default "dev" environment.
- As a user, I want to expand/collapse projects and environments to see their resources.
- As a user, I want to see which containers have access to which services (databases, caches, etc.).
- As a user, I want to see the cost impact of each resource and environment at a glance.

---

## Goals

1. **Landing Page**: Dashboard becomes the first page users see after login.
2. **Navigation Hub**: Overview tab provides hierarchical navigation through projects → environments → resources.
3. **Project Creation**: Clear "Create Project" action to start the questionnaire flow.
4. **Default Environment**: Every new project starts with a "dev" environment.
5. **Cost Transparency**: Show cost breakdowns at resource, environment, and project levels.

---

## Acceptance Criteria

### 1. Dashboard Reuse & Structure

- ✅ The current dashboard page (`/dashboard`) is reused as the main landing page after login.
- ✅ Remove the "key metrics" section from the dashboard.
- ✅ The "Overview" tab is the primary interface for navigating projects, environments, and resources.
- ✅ The dashboard maintains the existing tab structure (Overview, Logs, Metrics, Settings).

### 2. Project & Environment Hierarchy

- ✅ Display projects at the top level with expand/collapse functionality.
- ✅ Under each project, list all environments (dev, staging, prod, etc.).
- ✅ Each environment can be expanded/collapsed to show its resources.
- ✅ For demo mode, support a single project with multiple environments.

### 3. Resource Navigation

- ✅ Resources are grouped by type under each environment:
  - Containers
  - Databases
  - Caches
  - Volumes (future)
  - Other services (future)
- ✅ Each resource displays:
  - Name
  - Type (with generic icon/label, no brand names)
  - Status (mocked: Running, Pending, Error, Stopped)
  - Estimated monthly cost
- ✅ Clicking a resource opens a side panel or modal with full details and available actions (view config, edit, remove, etc.).

### 4. Resource Relationships

- ✅ Show which containers have access to which services (DB, cache, etc.).
- ✅ Use visual indicators (lines, arrows, badges, or nested grouping) to represent service access.
- ✅ On hover or click, highlight the connections between resources.
- ✅ Use generic terms and icons (no brand names like "PostgreSQL" in the main view, use "Database" instead).

### 5. Create Project Action

- ✅ Add a prominent "Create Project" button at the top of the dashboard.
- ✅ Clicking "Create Project" redirects to `/questionnaire`.
- ✅ Upon completing the questionnaire and deployment, the new project appears in the dashboard.
- ✅ Every new project automatically has a default "dev" environment created.

### 6. Cost Transparency

- ✅ Each resource shows its estimated monthly cost.
- ✅ Each environment shows the total cost of all its resources.
- ✅ Each project shows the total cost across all environments.
- ✅ Use the existing `costCalculator.ts` utility for all cost calculations.

### 7. Interactivity & UX

- ✅ Expand/collapse functionality for projects, environments, and resource groups.
- ✅ Tooltips on hover for quick resource information.
- ✅ Responsive design: works on mobile and desktop.
- ✅ Keyboard navigation support (arrow keys, enter, escape).
- ✅ Accessible (ARIA labels, sufficient color contrast, screen reader support).

### 8. Demo Mode

- ✅ All data is simulated from the in-memory deployment state (via `useDeployment()` context).
- ✅ No backend or real infrastructure calls.
- ✅ Show realistic but mocked statuses for resources.
- ✅ Updates automatically when the deployment state changes.

---

## Out of Scope (For This Feature)

- Multi-project support (demo only supports one project for now).
- Real-time backend synchronization or live infrastructure data.
- Drag-and-drop resource management.
- Environment creation/deletion UI (future work).
- Third-party integrations or external monitoring tools.
- Editing resources directly from the dashboard (future work).

---

## Technical Implementation Notes

### Data Source

- Use the existing `DeploymentContext` to read the current deployment state.
- Project structure:
  ```typescript
  interface Project {
    id: string;
    name: string;
    environments: Environment[];
    totalCost: number;
  }

  interface Environment {
    id: string;
    name: string; // 'dev', 'staging', 'prod', etc.
    containers: Container[];
    database?: Database;
    cache?: Cache;
    volumes?: Volume[]; // future
    totalCost: number;
  }
  ```

### UI Components

- **ProjectCard**: Top-level component showing project name, total cost, expand/collapse.
- **EnvironmentSection**: Shows environment name, resources, cost, expand/collapse.
- **ResourceItem**: Individual resource with icon, name, status, cost, click handler.
- **ResourceDetailPanel**: Side panel or modal showing full resource configuration.

### Styling

- Use Tailwind CSS following the existing design system.
- Hierarchical indentation or card nesting to show structure.
- Icons for resource types (container, database, cache, volume).
- Status badges with color coding (green = running, yellow = pending, red = error).

### Routing

- Dashboard remains at `/dashboard`.
- "Create Project" button links to `/questionnaire`.
- Resource detail views can be modals/panels (no new routes needed).

---

## UI/UX Mockup (Textual)

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                        [Create Project] Button │
├─────────────────────────────────────────────────────────┤
│ Overview | Logs | Metrics | Settings                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ 📦 My Application Project              $127.50/mo       │
│   ▼ Environments                                         │
│                                                           │
│     🔧 dev                             $42.50/mo         │
│       ▼ Containers (2)                                   │
│         🐳 web-frontend    [Running]   $15.00/mo        │
│         🐳 api-backend     [Running]   $15.00/mo   →DB  │
│       ▼ Database                                         │
│         💾 postgres        [Running]   $10.00/mo        │
│       ▼ Cache                                            │
│         ⚡ redis           [Running]    $2.50/mo        │
│                                                           │
│     🔧 staging                         $42.50/mo         │
│       (collapsed)                                        │
│                                                           │
│     🔧 prod                            $42.50/mo         │
│       (collapsed)                                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

- Arrows or badges show service connections (e.g., `api-backend → DB`).
- Each item is clickable to view details.
- Costs are displayed at resource, environment, and project levels.

---

## Default Environment Behavior

- When a user completes the questionnaire and deploys, a project is created.
- By default, the project has a single "dev" environment.
- All resources configured in the questionnaire are assigned to the "dev" environment.
- Future work: Allow users to add additional environments (staging, prod, etc.).

---

## Accessibility Requirements

- All interactive elements are keyboard-navigable (Tab, Enter, Escape, Arrow keys).
- ARIA labels for expand/collapse buttons, resource items, and status indicators.
- Sufficient color contrast for text and status badges (WCAG AA minimum).
- Screen reader announcements for expand/collapse actions.
- Focus indicators on all interactive elements.

---

## Cost Calculation

- Use the existing `costCalculator.ts` utility.
- Calculate costs at three levels:
  1. **Resource level**: Individual container, DB, cache, volume.
  2. **Environment level**: Sum of all resources in the environment.
  3. **Project level**: Sum of all environments.
- Display costs in the format `$XX.XX/mo`.

---

## Implementation Checklist

- [ ] Remove key metrics section from dashboard Overview tab.
- [ ] Add "Create Project" button at the top of the dashboard.
- [ ] Build hierarchical project → environments → resources UI.
- [ ] Implement expand/collapse functionality for projects and environments.
- [ ] Create resource list components with type icons, status, and cost.
- [ ] Add resource detail modal/panel with full configuration.
- [ ] Show service access relationships (container → DB, container → cache).
- [ ] Integrate cost display at resource, environment, and project levels.
- [ ] Ensure responsive design (mobile and desktop).
- [ ] Add keyboard navigation and ARIA labels.
- [ ] Test with various mock configurations (1 container, multiple containers, with/without DB/cache).
- [ ] Verify "Create Project" flow redirects to questionnaire and creates default "dev" environment.
- [ ] Manual test: create project, expand/collapse, view resource details, check costs.

---

## Testing Scenarios

1. **New User**: Click "Create Project" → Complete questionnaire → See project in dashboard with "dev" environment.
2. **Single Container**: Deploy with one container, no DB/cache → See container in "dev" environment.
3. **Multi-Container**: Deploy with 2+ containers → See all containers listed under "dev".
4. **Database Access**: Deploy with container + database → See connection indicator (badge, arrow, etc.).
5. **Cache Access**: Deploy with container + cache → See connection indicator.
6. **Cost Display**: Verify costs at all levels match `costCalculator.ts` output.
7. **Expand/Collapse**: Click project, environment, and resource groups → Verify smooth expand/collapse.
8. **Resource Details**: Click a resource → Modal/panel opens with full config.
9. **Responsive**: Test on mobile, tablet, desktop → Verify layout adapts.
10. **Keyboard**: Navigate using Tab, Enter, Escape → Verify all actions work.

---

## Success Metrics

- Users can navigate from dashboard to project details without confusion.
- "Create Project" action is discoverable and functional.
- Cost transparency is clear at all levels.
- Resource relationships (service access) are understandable.
- Mobile and keyboard navigation work smoothly.

---

## Future Enhancements (Out of Scope for MVP)

- Multi-project support (list multiple projects in the dashboard).
- Add/remove environments from the dashboard.
- Inline editing of resource configuration.
- Drag-and-drop to move resources between environments.
- Real-time status updates from backend.
- Filtering and search for resources.
- Sorting by name, cost, status, etc.
- Exporting project configuration as YAML/JSON.

---

## References

- **Glossary**: `/journey/GLOSSARY.md`
- **State Management**: `/prototype-app/lib/context/DeploymentContext.tsx`
- **Cost Calculation**: `/prototype-app/lib/utils/costCalculator.ts`
- **Related Specs**:
  - `remove-resource.md` (resource removal capability)
  - `multi-container-support.md` (multiple containers per environment)
  - `view-current-deployment-config.md` (viewing configuration)

---

**End of Spec**
