## Volume/Stateful Storage Specification

**Status**: 🟢 DONE

**Feature**: Persistent volume support for stateful applications and self-managed databases with smart size limits

**Source**: Inaki, Jeroen/Eveline feedback

**Priority**: MVP

---

### Overview

Enable users to attach persistent volumes to containers for stateful data storage. Since Unhazzle offers self-managed (DIY) infrastructure without third-party managed database services, volumes are essential for database persistence, user uploads, configuration files, and cache storage.

**Key Features**:
- **Single volume per container**: Simple, focused storage configuration
- **Smart size limits**: Right-sized based on container type (Applications: 500GB max, Databases: 10TB max)
- **Auto-scaling**: Automatic volume expansion when nearing capacity
- **Backup options**: Optional automatic backups with configurable frequency
- **Manual snapshots**: On-demand point-in-time snapshots
- **Lifecycle control**: Choose whether volume persists after container deletion

**Infrastructure**:
- **Provider**: Hetzner Cloud
- **Storage type**: High-availability SSD block storage
- **Pricing**: €0.044/GB/month (charged hourly)

---

### Step 1: Volume Configuration in Container Setup
**Page: Resources Configuration (Per-Container)**

**Current behavior**: Container configuration shows CPU, RAM, replicas, health checks, service access

**New behavior**: Do not expose a "Persistent Volume" section on the Resources page (MVP). Volumes remain implicit for database and cache containers.

**Location**: N/A on Resources page in MVP

---

**Container Configuration (MVP - no Volume section on Resources page)**:

```
Container: backend
├─ Resources (CPU, RAM, Replicas)
├─ Exposure (Public/Private, Domain)
├─ Health Check
└─ Service Access
```

---

Note: In MVP, volume configuration isn't available on the Resources page. Database and cache containers implicitly provision volumes with smart defaults; management happens elsewhere in the flow.

---

### Step 2: Smart Defaults and Validation
**Context: Volume Configuration Form**

**Smart Defaults by Container Type**:

**Application/Function Containers**:
- **Mount path**: `/app/data`
- **Size**: 50GB
- **Size range**: 10GB - 500GB
- **Auto-scaling**: Enabled
- **Backups**: Disabled
- **Delete with container**: Unchecked (persist)

**Database Containers** (PostgreSQL, MongoDB, MySQL):
- **Mount path**: Database-specific
  - PostgreSQL: `/var/lib/postgresql/data`
  - MongoDB: `/data/db`
  - MySQL: `/var/lib/mysql`
- **Size**: 100GB
- **Size range**: 10GB - 10TB
- **Auto-scaling**: Enabled (highly recommended)
- **Backups**: Daily (last 7 days)
- **Delete with container**: Unchecked (persist)

**Why**: Application containers rarely need TB-scale storage; limiting to 500GB prevents over-provisioning and runaway costs. Databases legitimately need TB-scale capacity for enterprise data.

---

**Validation Rules**:

**Mount Path**:
- **Format**: Must start with `/`
- **Reserved paths**: Cannot use `/`, `/etc`, `/sys`, `/proc`, `/dev`
- **Uniqueness**: Cannot conflict with other container paths
- **Example error**: 
  ```
  ❌ Mount path must start with / (e.g., /app/data)
  ❌ /etc is a reserved path
  ```

**Size**:
- **Application/Function**: 10GB ≤ size ≤ 500GB
- **Database**: 10GB ≤ size ≤ 10TB (10,000GB)
- **Granularity**: Must be whole number (no decimals)
- **Example error**: 
  ```
  ❌ Application volumes are limited to 500GB
  💡 For larger storage needs, consider object storage
  
  ❌ Database volumes must be at least 10GB
  ```

**Upgrade Limit Prompt** (when user tries to exceed application limit):
```
⚠️ Storage Limit for Applications

Application containers are limited to 500GB to prevent 
over-provisioning and keep costs predictable.

For applications requiring larger storage:
• Consider using object storage (S3-compatible)
• Store large files externally (CDN, blob storage)
• Contact support for custom enterprise limits

[Learn More] [Cancel] [Contact Support]
```

**Why**: Smart validation prevents misconfigurations while guiding users toward appropriate storage solutions.

---

### Step 3: Auto-Scaling Configuration
**Feature: Automatic Volume Expansion**

**How It Works**:

1. **Monitoring**: System monitors volume usage continuously
2. **Trigger**: When volume reaches 80% capacity
3. **Action**: Automatically increase size by 20% (minimum 10GB increase)
4. **Notification**: Alert user of expansion and new cost
5. **No downtime**: Expansion happens without service interruption

**Example Scenario**:

**Initial state**:
- Volume size: 100GB
- Used: 50GB (50%)
- Status: ✅ Healthy

**Approaching limit**:
- Volume size: 100GB
- Used: 82GB (82%)
- Status: ⚠️ Auto-scaling triggered

**After expansion**:
- Volume size: 120GB (100GB + 20%)
- Used: 82GB (68%)
- Status: ✅ Expanded
- Cost impact: €4.40/mo → €5.28/mo (+€0.88)

**User Notification**:
```
📊 Volume Auto-Scaled

Your volume `/app/data` in container "backend" 
has been automatically expanded:

100 GB → 120 GB

Reason: Reached 82% capacity (82 GB used)
New monthly cost: €5.28 (+€0.88)

[View Volume Details] [Dismiss]
```

**Why**: Prevents application downtime due to full volumes while keeping users informed of cost impacts.

---

**Disabling Auto-Scaling**:

If user unchecks "Auto-scale when 80% full":
- **Warning shown**:
  ```
  ⚠️ Auto-scaling is recommended
  
  Without auto-scaling, your application may crash 
  when the volume is full. You'll need to manually 
  resize the volume before it reaches capacity.
  
  [Keep Auto-Scaling] [Disable Anyway]
  ```

**Why**: Users should understand the risk of disabling auto-scaling, especially for databases.

---

### Step 4: Backup Configuration
**Feature: Automatic Backups and Manual Snapshots**

**Automatic Backups** (Optional):

**Pricing**:
- **Cost**: 20% of container's server/compute cost
- **Example**: 
  - Container: 2 CPU, 4GB RAM = €90/month
  - Backups: €90 × 20% = €18/month

**Frequency Options**:
```
Backups: [Daily (last 7d) ▾]
  • Disabled
  • Hourly (last 24 hours retained) +€18/mo
  • Daily (last 7 days retained) +€18/mo
  • Weekly (last 4 weeks retained) +€18/mo
```

**Retention Policy**:
- **Hourly**: Rolling 24-hour window (24 backups max)
- **Daily**: Rolling 7-day window (7 backups max)
- **Weekly**: Rolling 4-week window (4 backups max)

**Automatic Rotation**:
- Oldest backup deleted when new backup exceeds retention limit
- No manual cleanup needed

**Why**: Fixed retention prevents backup storage from growing indefinitely and keeps costs predictable.

---

**Manual Snapshots**:

**Pricing**:
- **Cost**: €0.011/GB/month per snapshot
- **Example**: 
  - 100GB volume snapshot = €1.10/month
  - 1TB database snapshot = €11/month

**Creation**:
- User clicks "Create Snapshot" in Overview tab
- Snapshot captured immediately
- Named with timestamp: `backend-2025-11-01-14-30`

**Retention**:
- User-defined (indefinite by default)
- Must be manually deleted
- **Warning shown**:
  ```
  💰 Snapshot Cost
  
  This snapshot will cost €1.10/month until deleted.
  Snapshots are charged separately from automatic backups.
  
  [Create Snapshot] [Cancel]
  ```

**Why**: Manual snapshots give users control for important milestones (pre-migration, pre-upgrade) but require explicit cost acknowledgment.

---

### Step 5: Volume Lifecycle Management
**Feature: Delete with Container Option**

**Checkbox**: ☐ Delete volume with container

**Checked (Delete with container)**:
- Volume is automatically deleted when container is deleted
- Stops all costs (volume + backups + snapshots)
- **Warning on container deletion**:
  ```
  ⚠️ Delete Container and Volume?
  
  This will permanently delete:
  • Container: backend
  • Volume: /app/data (50 GB)
  • All data in the volume
  
  This action cannot be undone.
  
  [Cancel] [Delete Container & Volume]
  ```

**Unchecked (Persist volume - DEFAULT)**:
- Volume persists after container deletion
- **Continues to incur costs** (volume + backups + snapshots)
- Can be reattached to new container
- **Warning on container deletion**:
  ```
  ⚠️ Delete Container Only?
  
  The container will be deleted, but the volume will persist:
  • Volume: /app/data (50 GB)
  • Cost: €2.20/month (continues)
  • Backups: Daily (€18/month continues)
  
  You can reattach this volume to another container or
  manually delete it from the Volumes page.
  
  [Cancel] [Delete Container Only]
  ```

**Why**: Clear warnings prevent surprise costs from orphaned volumes. Persisting by default protects data.

---

**Orphaned Volume Management**:

If container is deleted but volume persists, show in dashboard:

```
📦 Volumes

┌─────────────────────────────────────────────┐
│ Active Volumes                              │
├─────────────────────────────────────────────┤
│                                             │
│ /app/data (50 GB)                          │
│ • Status: ⚠️ Orphaned (no container)       │
│ • Cost: €2.20/month                        │
│ • Created: 2025-10-15                      │
│ • Last attached: backend (deleted)         │
│                                             │
│ [Attach to Container] [Delete Volume]      │
│                                             │
└─────────────────────────────────────────────┘
```

**Why**: Users can easily identify and manage orphaned volumes to control costs.

---

### Step 6: Volume Display in Review/Pricing Page
**Page: Review & Pricing**

**Volume Summary per Container**:

```
┌─────────────────────────────────────────────────────────┐
│ Review Your Configuration                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📦 Containers                           [Edit Layout]  │
│                                                         │
│ Backend (Application)                                   │
│ ├─ CPU: 2 cores ✏️                                     │
│ ├─ RAM: 2 GB ✏️                                        │
│ ├─ Replicas: 2-10 ✏️                                   │
│ └─ Volume: 50 GB ✏️                                    │
│    • Mount: /app/data                                  │
│    • Auto-scaling: Enabled                             │
│    • Backups: Disabled                                 │
│    Cost: €47.20/month (€45 compute + €2.20 storage)   │
│                                                         │
│ Database (PostgreSQL)                                   │
│ ├─ CPU: 2 cores ✏️                                     │
│ ├─ RAM: 4 GB ✏️                                        │
│ ├─ Replicas: 1                                         │
│ └─ Volume: 100 GB ✏️                                   │
│    • Mount: /var/lib/postgresql/data                   │
│    • Auto-scaling: Enabled                             │
│    • Backups: Daily (last 7d)                          │
│    Cost: €112.40/month                                 │
│      (€90 compute + €4.40 storage + €18 backups)      │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ Total Monthly Cost: €159.60/month                      │
│                                                         │
│ [Deploy Project]                                       │
└─────────────────────────────────────────────────────────┘
```

**Editable Volume Fields** (inline editing from Step 3 of edit-selections-on-pricing-page):
- **Size**: Click to edit, shows cost impact badge
- **Auto-scaling**: Toggle on/off
- **Backups**: Change frequency or disable

**Non-Editable** (requires going back to `/resources`):
- Mount path
- Delete with container option

**Why**: Consistent with other resource editing on review page; size and backup changes are most common cost adjustments.

---

### Step 7: Volume Monitoring in Dashboard
**Page: Dashboard → Overview Tab → Container Details**

**Volume Usage Display**:

```
Container: backend
├─ Status: ● Running (2/2 replicas)
├─ Resources
│  ├─ CPU: 45% (0.9 / 2 cores)
│  └─ RAM: 60% (1.2 GB / 2 GB)
└─ Volume: /app/data
   ├─ Size: 50 GB
   ├─ Used: 32 GB (64%)
   ├─ Available: 18 GB (36%)
   ├─ Status: ✅ Healthy
   ├─ Auto-scaling: Enabled
   └─ Last backup: 2 hours ago
   
   [Resize Volume] [Create Snapshot] [Configure Backups]
```

**Visual Indicators**:

**Usage Bar**:
```
Used: 32 GB / 50 GB (64%)
▓▓▓▓▓▓▓░░░ 64%
```

**Status Colors**:
- **Green** (<80%): ✅ Healthy
- **Yellow** (80-90%): ⚠️ Nearing capacity
- **Red** (>90%): 🔴 Critical - Auto-scaling soon

**Metrics Tracked**:
- Current size
- Used space
- Available space
- Percentage used
- Last backup timestamp (if enabled)
- Auto-scaling status
- Recent expansion history (if any)

**Why**: Simple, actionable metrics help users understand volume health without overwhelming detail.

---

### Step 8: Manual Volume Resize
**Triggered by: Click [Resize Volume] in Overview tab**

**Resize Modal**:

```
┌─────────────────────────────────────────────┐
│ Resize Volume                               │
├─────────────────────────────────────────────┤
│                                             │
│ Container: backend                          │
│ Mount Path: /app/data                       │
│                                             │
│ Current Size: 50 GB                         │
│ Used: 32 GB (64%)                           │
│                                             │
│ New Size: [75] GB                           │
│ Range: 50 GB - 500 GB (Application max)    │
│                                             │
│ Cost Impact:                                │
│ Current: €2.20/month                        │
│ New: €3.30/month                            │
│ Change: +€1.10/month                        │
│                                             │
│ ⚠️ Note: Volumes can only be expanded,     │
│    not reduced (to prevent data loss)       │
│                                             │
│ [Cancel] [Resize Volume]                    │
└─────────────────────────────────────────────┘
```

**Validation**:
- New size must be > current size
- Cannot exceed limit (500GB app, 10TB database)
- Whole numbers only

**Process**:
1. User enters new size
2. Shows cost impact
3. Confirms resize
4. Expansion happens without downtime
5. Success notification shown

**Why**: Manual resize gives users control for planned capacity increases beyond auto-scaling.

---

### Step 9: Snapshot Management
**Page: Dashboard → Overview Tab → Container Details → Volume Section**

**Create Snapshot**:

```
[Create Snapshot]

Modal:
┌─────────────────────────────────────────────┐
│ Create Snapshot                             │
├─────────────────────────────────────────────┤
│                                             │
│ Container: backend                          │
│ Volume: /app/data (50 GB)                   │
│                                             │
│ Snapshot Name (optional):                   │
│ [pre-migration-backup    ]                  │
│ Default: backend-2025-11-01-14-30           │
│                                             │
│ Cost: €0.55/month (€0.011/GB)              │
│                                             │
│ ⚠️ Snapshots persist until manually deleted│
│    and continue to incur monthly costs      │
│                                             │
│ [Cancel] [Create Snapshot]                  │
└─────────────────────────────────────────────┘
```

**Snapshot List**:

```
Snapshots (3)

┌─────────────────────────────────────────────┐
│ pre-migration-backup                        │
│ • Size: 50 GB                               │
│ • Cost: €0.55/month                         │
│ • Created: 2025-11-01 14:30                 │
│ [Restore] [Delete]                          │
├─────────────────────────────────────────────┤
│ backend-2025-10-28-09-15                    │
│ • Size: 45 GB                               │
│ • Cost: €0.50/month                         │
│ • Created: 2025-10-28 09:15                 │
│ [Restore] [Delete]                          │
├─────────────────────────────────────────────┤
│ backend-2025-10-15-11-00                    │
│ • Size: 40 GB                               │
│ • Cost: €0.44/month                         │
│ • Created: 2025-10-15 11:00                 │
│ [Restore] [Delete]                          │
└─────────────────────────────────────────────┘

Total snapshot cost: €1.49/month
```

**Restore Process**:
1. Click [Restore] on snapshot
2. **Warning modal**:
   ```
   ⚠️ Restore Snapshot?
   
   This will replace current volume data with snapshot:
   • Snapshot: pre-migration-backup (50 GB)
   • Created: 2025-11-01 14:30
   
   Current data will be lost unless you create a 
   snapshot before restoring.
   
   [Cancel] [Create Snapshot First] [Restore]
   ```
3. Container temporarily stopped
4. Volume restored from snapshot
5. Container restarted

**Why**: Snapshots provide disaster recovery without ongoing backup costs, user controls retention.

---

## Technical Implementation Notes

### Volume Provisioning

```typescript
interface VolumeConfig {
  mountPath: string;
  sizeGB: number;
  autoScale: boolean;
  backupFrequency: 'disabled' | 'hourly' | 'daily' | 'weekly';
  deleteWithContainer: boolean;
}

interface VolumeConstraints {
  minSizeGB: number;
  maxSizeGB: number;
  defaultSizeGB: number;
  defaultMountPath: string;
  recommendBackups: boolean;
}

const getVolumeConstraints = (containerType: string): VolumeConstraints => {
  if (containerType === 'database') {
    return {
      minSizeGB: 10,
      maxSizeGB: 10240, // 10TB
      defaultSizeGB: 100,
      defaultMountPath: '/var/lib/postgresql/data', // DB-specific
      recommendBackups: true,
    };
  }
  
  // Application/Function
  return {
    minSizeGB: 10,
    maxSizeGB: 500,
    defaultSizeGB: 50,
    defaultMountPath: '/app/data',
    recommendBackups: false,
  };
};
```

### Cost Calculation

```typescript
const calculateVolumeCost = (config: VolumeConfig, containerCost: number): number => {
  // Base storage cost
  const storageCost = config.sizeGB * 0.044; // €0.044/GB/month
  
  // Backup cost (20% of container compute cost)
  let backupCost = 0;
  if (config.backupFrequency !== 'disabled') {
    backupCost = containerCost * 0.20;
  }
  
  return storageCost + backupCost;
};

const calculateSnapshotCost = (sizeGB: number): number => {
  return sizeGB * 0.011; // €0.011/GB/month
};
```

### Auto-Scaling Logic

```typescript
const checkAutoScale = (volume: Volume): boolean => {
  if (!volume.autoScale) return false;
  
  const usagePercent = (volume.usedGB / volume.sizeGB) * 100;
  
  if (usagePercent >= 80) {
    const increaseAmount = Math.max(volume.sizeGB * 0.20, 10);
    const newSize = Math.ceil(volume.sizeGB + increaseAmount);
    
    // Respect max limits
    const constraints = getVolumeConstraints(volume.containerType);
    const cappedSize = Math.min(newSize, constraints.maxSizeGB);
    
    if (cappedSize > volume.sizeGB) {
      expandVolume(volume.id, cappedSize);
      notifyUser(volume, cappedSize);
      return true;
    }
  }
  
  return false;
};
```

---

## User Experience Considerations

### Guidance and Education

**In-app Tooltips**:
- **Mount path**: "The directory inside your container where the volume will be accessible"
- **Auto-scaling**: "Automatically expands volume when it reaches 80% capacity to prevent downtime"
- **Backups**: "Automatic snapshots taken at scheduled intervals. Cost is 20% of container cost"
- **Delete with container**: "If unchecked, volume persists after container deletion and continues to cost €X/month"

**Documentation Links**:
- "Learn about volume best practices"
- "How to optimize storage costs"
- "Backup and disaster recovery guide"

### Error Prevention

**Common Mistakes Prevented**:
1. ✅ Forgetting to add volume to database containers → Smart defaults suggest volume
2. ✅ Over-provisioning application storage → 500GB limit with guidance to use object storage
3. ✅ Forgetting backups for databases → Daily backups enabled by default
4. ✅ Orphaned volumes costing money → Clear warnings and orphaned volume dashboard

---

## Success Metrics

- **Volume adoption rate**: % of database containers using volumes (should be ~100%)
- **Application volume usage**: % of application containers using volumes
- **Average volume size**: By container type (detect over/under-provisioning)
- **Auto-scaling effectiveness**: % of volumes that auto-scaled vs manual resizes
- **Backup adoption**: % of volumes with backups enabled (especially databases)
- **Orphaned volumes**: Count and total cost (should trend toward zero)
- **Support tickets**: Volume-related issues (configuration, expansion, data loss)

---

## Future Enhancements (Not in MVP)

- [ ] **Shared volumes**: Multiple containers access same volume (ReadWriteMany)
- [ ] **Volume templates**: Pre-configured volume setups (e.g., "WordPress uploads")
- [ ] **Pre-populated volumes**: Upload files, pull from Git, init containers
- [ ] **Performance metrics**: IOPS, throughput, latency monitoring
- [ ] **Storage class options**: SSD vs HDD, with cost tradeoffs
- [ ] **Volume cloning**: Duplicate volume for testing/staging
- [ ] **Scheduled snapshots**: Automated snapshot creation on user-defined schedule
- [ ] **Snapshot retention policies**: Auto-delete snapshots older than X days
- [ ] **Volume migration**: Move data between volumes or regions
- [ ] **Block-level incremental backups**: Reduce backup time and storage costs
- [ ] **Backup to external storage**: S3, Google Cloud Storage, etc.

---

## Related Specifications

- **Multi-container support** (`multi-container-support.md`): Defines container structure where volumes are attached
- **View current deployment config** (`view-current-deployment-config.md`): Volume configuration editing in Overview tab
- **Edit selections on pricing page** (`edit-selections-on-pricing-page.md`): Volume size editing with real-time cost updates
