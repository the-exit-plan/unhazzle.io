# Feature Spec: Application-Level Deployment Lifecycle

## Goal
Refactor the deployment model to make **Applications** the primary and **only** deployable entities, decoupling their lifecycle from Environments. This aligns with software lifecycle best practices where applications are promoted across environments (e.g., Dev → Staging → Prod). The Environment becomes a pure logical container - it has no deployment status, no "Ready to Deploy" flow, and imposes no restrictions on application actions. Applications can be added, edited, deployed, promoted, or deleted at any time, regardless of the environment's state.

## Status
DONE

## Scope
In-scope:
- **Data Model**:
  - Rename `Container` to `Application` in UI terminology (code refactoring optional but recommended).
  - Add `status`, `isDirty`, and `pauseSchedule` to Application.
  - Remove `status` from Environment.
- **Project Settings**:
  - Move Environment deletion to Project Settings -> Environments list.
- **Environment Actions**:
  - Remove "Promote" and "Delete" from Environment overview.
  - Update "Pause" to scale all apps to 0.
  - Update "Clone" to include "Auto-deploy" option.
- **Application Actions**:
  - New "Actions" dropdown in Application Editor.
  - **Deploy/Apply**: Triggers deployment for single app.
  - **Promote**: Copies app config to another existing environment.
  - **Pause**: Scales replicas to 0, with optional Cron schedule.
  - **Delete**: Renamed from "Remove".
- **Deployment Page**:
  - Support single-application deployment flow.
- **Navigator UI**:
  - Move status indicators from Environment to Application items.

Out of scope:
- Creating new environments during promotion (target must exist).
- Complex cron UI builder (text input only).
- Real infrastructure provisioning.

## Data Model Changes

### Application Interface (formerly Container)
```ts
interface Application { // formerly Container
  id: string;
  name: string;
  // ... existing fields ...
  
  // NEW FIELDS
  status: 'deploying' | 'running' | 'paused' | 'failed' | 'stopped';
  isDirty: boolean; // true if config changed since last deploy
  pauseSchedule?: string; // Cron expression (e.g., "0 18 * * 1-5")
  deployedAt?: string;
}
```

### Environment Interface Updates
```ts
interface Environment {
  // ... existing fields ...
  
  // REMOVED
  // status: EnvironmentStatus; // Environment has no status
  // deployed: boolean; // Environment is not a deployable entity
  
  // CLARIFICATION
  // Environment is purely a logical container for organizing applications
  // It does not gate or restrict application actions
}
```

## UI Flow Changes

### 1. Project Settings: Environment Management
**Location**: `ProjectSettings.tsx` -> Environments Tab

**Changes**:
- Add "Delete" button to each row in the environments table.
- Clicking "Delete" shows confirmation modal (destructive action).
- This becomes the *only* place to delete an environment.

### 2. Environment Overview
**Location**: `EnvironmentInfo.tsx`

**Changes**:
- **Remove**: "Promote Environment", "Delete Environment", "Ready to Deploy", and "Pending Changes" sections.
- **Remove**: All status badges and deployment state checks from environment header.
- **Update Pause**: "Pause Environment" now iterates through all apps in env and sets replicas to 0 and sets the apps status to paused.
- **Update Clone**: "Clone Environment" modal adds a checkbox:
  - `[ ] Auto-deploy applications in new environment`
  - If checked, apps start in `deploying` state.
  - If unchecked, apps start in `stopped` state (config only).
- **Clarification**: Actions like "Add Application", "Pause All Apps", and "Clone" are always available. No checks for environment deployment status.

### 3. Application Editor Actions
**Location**: `dashboard/page.tsx` (ApplicationEditor)

**Changes**:
- **Always show**: "Show Changes" and "Apply" buttons in header (enabled when changes exist).
- Group additional actions into an "Actions" dropdown button.
- **Items** (always available, no environment status checks):
  1. **Promote**: Opens `PromoteApplicationModal`.
  2. **Pause**: Opens `PauseApplicationModal`.
  3. **Delete**: Renamed from "Remove". Shows `DeleteApplicationModal`.
- **Apply behavior**: When user clicks "Apply", the app config is updated and user is redirected to `/deploying?appId=...&envId=...`.

### 4. Promote Application Modal
**Trigger**: Actions -> Promote

**UI**:
- Dropdown: "Select Target Environment"
- List *only* existing environments (excluding current).
- Info: "This will copy the application configuration (Image, Resources, Env Vars) to the target environment."
- Action: "Promote".
- **Result**: Creates/Updates app in target env. Status = `stopped` (pending deploy).

### 5. Pause Application Modal
**Trigger**: Actions -> Pause

**UI**:
- Toggle: "Pause Now" (sets replicas to 0 immediately).
- Input: "Schedule (Cron Expression)"
  - Placeholder: `0 18 * * 1-5` (e.g., Pause every weekday at 6 PM).
  - Info: "Define when this application should automatically pause to save costs."

### 6. Deployment Page
**Location**: `deploying/page.tsx`

**Changes**:
- Support query params: `?appId=...&envId=...`
- If `appId` is present:
  - Show steps *only* for that application.
  - "Pulling image..."
  - "Provisioning resources..."
  - "Health check..."
- If no `appId` (Environment Clone with auto-deploy):
  - Iterate through all apps.

### 7. Environment Navigator
**Location**: `EnvironmentNavigator.tsx`

**Changes**:
- **Environment Item**: Remove status badge/dot.
- **Application Item**: Add status indicator dot.
  - Green: `running`
  - Yellow: `deploying`
  - Grey: `stopped` / `paused`
  - Red: `failed`

## Integration Points

### DeploymentContext
- Update `updateApplicationStatus(appId, status)`
- Update `promoteApplication(sourceAppId, targetEnvId)`
- Update `pauseApplication(appId, schedule?)`

### Cost Calculator
- Paused apps (replicas=0) should cost €0 for compute (storage/volume costs persist).

## Validation Rules
- **Promote**: Target environment must exist.
- **Pause Schedule**: Simple cron validation (regex or try-catch parser).
- **Delete Environment**: Block if environment contains "production" apps (require confirmation).

## Demo Mode Notes
- Promotion is instant (copy config).
- Deployment simulates delay (5-10s).
- Pausing is instant.
- Cron schedule is stored but not executed (visual only).

## Acceptance Criteria
- ✅ Environment status badges removed from UI.
- ✅ "Ready to Deploy" and "Pending Changes" sections removed from Environment Overview.
- ✅ App status is visible in Navigator.
- ✅ Application actions (Apply, Promote, Pause, Delete) are available regardless of environment state.
- ✅ "Actions" dropdown appears in App Editor with all options.
- ✅ Can promote an app to another environment.
- ✅ Can pause an app with a cron schedule string.
- ✅ Can delete an environment from Project Settings.
- ✅ Deployment page works for single app.
- ✅ No environment-level deployment checks block application actions.
