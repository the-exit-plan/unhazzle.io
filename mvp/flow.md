## Unhazzle User Flow (Actual Implementation)

***

### Step 1: Sign In & Authentication
**Page:** `/` (Home/Sign In)

**Actions:**
- Enter your name
- Click "Start Building"
- Authenticate via simulated GitHub OAuth (identity only, no repo permissions)

**What happens:**
- User info saved to state (name + generated GitHub username)
- Redirects to `/dashboard` (landing page after authentication)

**Why:**
- Single-page signup reduces friction
- GitHub OAuth signals trust without requesting repository access
- Direct redirect to dashboard (not questionnaire) allows users to explore or create projects

***

### Step 2: Dashboard - Central Operations Hub
**Page:** `/dashboard`

**First-time experience:**
- Empty state: "No Projects Yet"
- Single CTA: "Create Your First Project"

**After first deployment:**
- **Project view** (default tab): Hierarchical navigation (left panel) + resource editing (right panel)
  - **Why:** Dashboard replaces the old linear flow's "Step 9" and becomes the control center. Users manage existing projects here.
  
- **Tabs:**
  - **Projects**: Edit container resources, database, cache, environment variables in real-time
  - **Logs**: Live application logs, filterable by container
  - **Metrics**: CPU, memory, request rates, response times
  - **Events**: Deployment history, auto-scaling events, SSL renewals
  - **Settings**: Moved to Projects tab (edit in left/right panel)
  - **Next Steps** (highlighted): Post-deployment CLI setup and continuous deployment guide

- **Project/Environment Navigation (left panel):**
  - Project settings (name, description, repository integration)
  - Environment list (dev, staging, prod, PR preview environments)
  - Per-environment architecture view
  - Containers, database, cache resources

- **Resource Editor (right panel):**
  - Inline editing with staged changes
  - "Show Changes" + "Apply" workflow
  - Cost impact preview before applying
  - Remove resources with dependency checks

**Why the dashboard evolved:**
- Users need a persistent place to manage live deployments, not just a one-time setup flow
- Real projects have multiple environments (dev, staging, prod) - dashboard supports this
- Post-deployment configuration changes (scale up, add env vars, adjust DB resources) are common
- Dashboard-first architecture prepares for multi-project, multi-environment management

***

### Step 3: Project Setup (Triggered from Dashboard)
**Page:** `/questionnaire`

**Part A: Project Basics (Required)**
1. **Project name**: 3-63 characters, lowercase, alphanumeric + hyphens
   - **Why:** Used for deployment URLs and internal references
   - Validation: Live feedback, must start/end with alphanumeric
   
2. **Region**: Choose deployment location
   - 🇩🇪 **Germany**: Falkenstein (fsn1), Nuremberg (nbg1)
   - 🇫🇮 **Finland**: Helsinki (hel1)
   - **Why:** Data residency, latency optimization, GDPR compliance
   - Grouped by country with flag icons for clarity

**Part B: Auto-configure resources (Optional, collapsed by default)**

**Accordion title:** "Auto-configure resources (optional)"
**Subheading:** "Tell us about your app's traffic and performance needs. We'll recommend CPU, memory, and scaling settings so you don't have to guess."

**5 Questions (all required to generate recommendations):**

1. **Peak hourly request volume:**
   - <1K requests/hour → 1 replica, no HPA
   - 1K-10K req/hour → 1 replica start, HPA 1-3
   - 10K-100K req/hour → 2 replicas start, HPA 2-10
   - 100K-1M req/hour → 5 replicas start, HPA 5-20
   - 1M+ req/hour → 8 replicas start (custom setup)
   - **Why:** Direct correlation to replica count needed

2. **Acceptable response time under load:**
   - <50ms → 2-4 CPU, 4-8GB RAM (no resource contention)
   - 50-200ms → 1-2 CPU, 2-4GB RAM (standard web app)
   - 200-500ms → 0.5-1 CPU, 1-2GB RAM (can tolerate queuing)
   - >500ms → 0.5 CPU, 1GB RAM (batch processing)
   - **Why:** Latency tolerance → CPU/memory sizing + HPA threshold

3. **What your app does most:**
   - CPU-heavy → 4 CPU, 2GB RAM (CPU-bound)
   - Memory-heavy → 1 CPU, 8GB RAM (memory-bound)
   - I/O-heavy → 1 CPU, 2GB RAM (waiting on I/O)
   - Balanced → 2 CPU, 4GB RAM (standard web app)
   - **Why:** Workload type → resource ratio + HPA metric

4. **App startup time:**
   - <5 seconds → Aggressive HPA, 2min cooldown
   - 5-15 seconds → Moderate HPA, 5min cooldown
   - 15-30 seconds → Conservative HPA, 10min cooldown
   - >30 seconds → Very conservative HPA, 15min cooldown, higher min replicas
   - **Why:** Startup time → HPA aggressiveness + cooldown periods

5. **Traffic predictability:**
   - Steady → Min replicas = avg needed, max = 2x min
   - Daily pattern → Min = nighttime baseline, max = 3x min
   - Weekly pattern → Min = weekend baseline, max = 5x min
   - Unpredictable spikes → Min = higher baseline (2-3), max = 10x min
   - **Why:** Traffic pattern → min/max replica ratio

**Live preview behavior:**
- Recommendations appear **automatically** as soon as all 5 questions are answered
- Green checkmark box: "✓ We'll use these settings as defaults"
- Shows: Base replicas, HPA range, scaling threshold, cooldown, rationale
- Note: "You can adjust these in the next step if needed"
- **No Apply button** - auto-accepted if questions answered
- Reset button clears all answers to opt out

**Recommendations formula:**
```
Base replicas = f(traffic_volume, latency_sensitivity)
Resource per replica = f(latency_sensitivity, workload_type)
HPA min = f(traffic_spikiness, startup_time)
HPA max = min * spike_multiplier(traffic_spikiness)
HPA threshold = f(latency_sensitivity)
HPA cooldown = f(startup_time)
```

**Example output:**
- User answers: 10K-100K req/hour, 50-200ms latency, Balanced workload, 5-15s startup, Daily pattern
- **Generated recommendations:**
  - "2 replicas start · HPA 1-6 · Scale at 70% CPU · 5m cooldown"
  - Rationale: "Daily traffic + 50-200ms latency and balanced workload ⇒ 2 vCPU / 4GB per replica with HPA 1-6, scale at 70% CPU, 5m cooldown."

**Saved to state → redirects to `/application`**

**Why this evolved:**
- Project name + region are **foundational metadata** needed before infrastructure decisions
- 5 workload questions replace generic 4-question flow with **data-driven sizing**
- Optional accordion = zero friction for users who want manual control
- Auto-accept UX = no confusing "Apply" button, live preview builds confidence
- Recommendations **persist through flow** and seed resource defaults on next page
- Region badges appear in dashboard/review for transparency

***

### Step 4: Application Setup (Multi-Container Support)
**Page:** `/application`

**Two image sources:**

**A. Private GitHub Container Registry:**
- Enter GitHub Personal Access Token (PAT) for `ghcr.io`
  - **Why:** Private images require authentication; PAT = read-only package access
- Select from mock image list (simulated registry browse)
- Up to 5 applications (containers)
  - **Why:** Real projects have frontend, backend, workers, etc.

**B. Public Registries:**
- Add public image URLs (Docker Hub, public registries)
- Manual entry: `nginx:latest`, `docker.io/library/redis:7`
- Up to 5 total applications across both sources

**Behind the scenes (per container):**
- Auto-detect port from image metadata (default: 3000)
- Auto-detect health check endpoint (default: `/health`)
  - **Why:** Reuse Dockerfile EXPOSE + HEALTHCHECK directives
- Generate internal DNS names: `app-name.internal`
- Apply smart resource defaults based on questionnaire answers

**What changed from original flow:**
- **Multi-container support** replaces single application page
- GitHub PAT authentication flow for private images
- Combined private + public image selection
- Container limit (5) prevents overwhelming first-time users

**Redirects to `/resources`**

**Why:**
- Modern apps are multi-container (frontend + backend + jobs)
- Private registry authentication is essential for real-world use
- Limiting to 5 containers balances flexibility with simplicity

***

### Step 5: Resource Configuration (Per-Container + Infrastructure)
**Page:** `/resources`

**Container-specific configuration (expandable accordions):**
- **Compute:** CPU (0.5-4 vCPU), Memory (512MB-8GB), Replicas (desired + max)
- **Health check:** Protocol (HTTP/TCP/gRPC), port, path
- **Exposure:** Public (external domain) or Private (internal-only)
- **Service access:** Toggle database + cache connections
  - **Why:** Automatic network configuration + credential injection as env vars
- **Environment variables:** Key-value pairs, masked secrets, auto-generated infra vars
  - Auto-injected: `UNHAZZLE_POSTGRES_URL`, `UNHAZZLE_REDIS_URL`

**Infrastructure resources (shared):**
- **Database:** CPU (1-8 vCPU), Memory (2-16GB), Storage (10GB-1TB), backup settings
- **Cache:** Memory (256MB-8GB), version, eviction policy, persistence mode
- **Remove buttons** with dependency checks:
  - Cannot remove database if any container has `serviceAccess.database = true`
  - Cannot remove cache if any container has `serviceAccess.cache = true`

**Smart defaults example (E-commerce, burst traffic):**
- App container: 1 vCPU, 2GB, 2-10 replicas
- PostgreSQL: 2 vCPU, 4GB, 20GB storage, daily backups
- Redis: 512MB, AOF persistence

**If auto-configure questionnaire was completed:**
- Per-replica resources seeded from recommendations (e.g., 2 vCPU, 4GB based on workload answers)
- HPA min/max set from traffic pattern (e.g., 1-6 replicas for daily pattern)
- User can still adjust everything manually

**Redirects to `/review`**

**Why:**
- Per-container resource control = precise cost optimization
- Service access toggles = explicit networking permissions (security)
- Environment variable editing here = unified config view
- Infrastructure shared across containers = cost efficiency
- Recommendations from questionnaire provide intelligent starting point but don't lock users in

***

### Step 6: Review & Editable Cost Breakdown
**Page:** `/review`

**Header displays:**
- Project name badge: 📁 `my-awesome-project`
- Region badge: 🇩🇪 `Falkenstein (fsn1)` or 🇫🇮 `Helsinki (hel1)`
- **Why:** Transparency and continuity - users see their project metadata throughout

**Editable resource cards (inline dropdowns):**
- Each container: CPU, memory, replicas (editable dropdowns)
- Database: CPU, memory, storage (editable dropdowns)
- Cache: Memory, version (editable dropdowns)
- **Real-time cost recalculation** on every change

**Cost breakdown:**
- Application: €X/month (sum of all container costs)
- Database: €Y/month (if provisioned)
- Cache: €Z/month (if provisioned)
- Load Balancer + SSL: €10/month (fixed)
- **Total: €N/month**

**What's included (built-in Unhazzle features):**
- Hetzner enterprise servers (Germany)
- NVMe SSD storage, 10 Gbit/s network
- Auto-scaling, zero-downtime deployments
- Health monitoring, automatic failover
- Free SSL certificates, DDoS protection
- Secrets encryption (AES-256), GDPR compliant

**Pricing note:**
- Transparent infrastructure costs (Hetzner Cloud Germany)
- 30% service margin included
- First 20 TB bandwidth included
- No hidden fees

**Deployment button:** "🚀 Deploy Now"

**Why:**
- Last chance to adjust resources before deployment
- Inline editing = no need to go back through flow
- Transparent cost breakdown builds trust
- "What's included" justifies pricing (vs raw cloud provider costs)

***

### Step 7: Deployment Progress (Real-time)
**Page:** `/deploying`

**Sequential steps (dynamically generated based on selection):**
1. ✅ Validating configuration
2. ✅ Provisioning infrastructure
3. ✅ Configuring database _(if selected)_
4. ✅ Setting up cache _(if selected)_
5-N. ✅ Deploying [container-name] _(one step per container)_
N+1. ✅ Configuring load balancer
N+2. ✅ Running health checks
N+3. ✅ Deployment complete

**Each step shows:**
- Generic infrastructure logs (no brand names)
- Progress indicators (spinner → checkmark)
- Elapsed time counter
- Overall progress bar

**Example container deployment logs:**
```
→ Authenticating with registry
→ Pulling image: ghcr.io/acme/shop:v2.1.0
→ Configuring DNS: shop.internal
→ Injecting DATABASE_URL
→ Starting 2 replicas
✓ shop running (public)
```

**"What's happening behind the scenes" info box:**
- Provisioning servers in Germany
- Setting up database with automated backups _(if selected)_
- Deploying cache service _(if selected)_
- Deploying [container-1]: 2-10 replicas (public)
- Deploying [container-2]: 1-3 replicas (private)
- Provisioning SSL certificate for HTTPS
- Deploying to: `{env-slug}.{project-slug}.demo.unhazzle.io`

**Completion state:**
- 🎉 "Deployment Complete!"
- Button: "View Operations Dashboard →"

**Why:**
- Real-time progress reduces anxiety (vs instant "done")
- Step-by-step logs prove complex work is happening
- Generic logs maintain vendor flexibility
- Redirect to dashboard (not a static "success" page)

***

### Step 8: Post-Deployment Dashboard (Operational Hub)
**Page:** `/dashboard` (returns here after deployment)

**Now fully populated:**

**Header displays:**
- Deployment URL: `dev.my-project.demo.unhazzle.io`
- Region badge: 🇩🇪 `Falkenstein (fsn1)` or 🇫🇮 `Helsinki (hel1)`
- Status: 🟢 Live

**Projects Tab (default view after first deployment):**
- **Left panel:** Hierarchical navigation
  - Project settings (name, description, repo integration)
  - Environment: `dev` (running, active)
    - Architecture diagram
    - Container 1 (public, 2 replicas)
    - Container 2 (private, 1 replica)
    - Database (PostgreSQL)
    - Cache (Redis)
  
- **Right panel:** Resource editor
  - Click container → edit resources, env vars, health checks
  - Click database → adjust CPU, memory, storage, backup settings
  - Click cache → adjust memory, version, eviction policy
  - **Staged changes workflow:**
    - Make edits → "Show Changes" → "Apply" (with confirmation modal)
    - Cost impact preview before applying
  - **Remove resources:**
    - "Remove Container" (checks if last container)
    - "Remove Database" (checks if any container still connected)
    - "Remove Cache" (checks if any container still connected)

**Architecture Tab (inside environment):**
- Visual diagram showing:
  - Container connections to database/cache
  - Internal DNS names
  - Public vs private endpoints
  - Load balancer routing

**Logs Tab:**
- Live tail of application logs
- Filter by container (dropdown)
- Simulated logs:
  - Application startup messages
  - HTTP requests (for public containers)
  - Database/cache connection confirmations
  - Background job processing (for private containers)

**Metrics Tab:**
- Average response time: 45ms
- Error rate: 0.02%
- 99th percentile (p99): 234ms
- Requests today: 1.8M
- CPU/Memory usage graphs (simulated updates every 3 seconds)

**Events Tab:**
- Deployment completed (2 hours ago)
- Auto-scaling triggered: 2→4 replicas (45 min ago)
- Database backup completed (1 hour ago)
- SSL certificate renewed (3 days ago)

**Next Steps Tab (highlighted with "IMPORTANT" badge):**
- **Step 1:** Export infrastructure configuration (YAML)
  - Displays generated `unhazzle.yaml` with copy button
  - **Why:** Version control your infrastructure config
  
- **Step 2:** Add YAML to your repository
  - Git commands: `git add unhazzle.yaml`, `git commit`, `git push`
  
- **Step 3:** Set up GitHub Actions workflow
  - Displays `.github/workflows/deploy.yml` with copy button
  - **Why:** Continuous deployment on every push
  
- **Step 4:** Install Unhazzle CLI
  - `npm install -g @unhazzle/cli`
  - `unhazzle auth login`
  
- **Step 5:** Continuous deployment enabled
  - Every push → automatic deployment
  - No manual steps, no config drift
  
- **Useful CLI commands:**
  - `unhazzle status`, `unhazzle logs --follow`
  - `unhazzle env set KEY=VALUE`
  - `unhazzle deploy --config unhazzle.yaml`
  
- **Link:** "Experience the Unhazzle CLI" → Interactive CLI demo

**Why dashboard is now central:**
- Post-deployment changes are common (scale up, adjust resources, add env vars)
- Dashboard replaces scattered settings pages with unified control center
- Project/environment hierarchy prepares for multi-env workflows (dev, staging, prod)
- "Next Steps" tab guides users to continuous deployment (critical for real adoption)

***

## Summary of Evolution

### What stayed the same:
1. ✅ Minimal onboarding questions (quick setup)
2. ✅ Smart defaults based on application characteristics
3. ✅ Transparent cost breakdown with editing
4. ✅ Real-time deployment progress
5. ✅ Zero manual Kubernetes/infrastructure configuration

### What evolved significantly:
1. **🔄 Dashboard-first architecture**
   - Old: Linear flow ending at "Dashboard" (Step 9)
   - New: Dashboard is the landing page after login, central hub for all operations

2. **🔄 Multi-container support**
   - Old: Single application image
   - New: Up to 5 containers (frontend, backend, workers, etc.)
   - Why: Real-world apps are multi-service

3. **🔄 Project & Environment structure**
   - Old: Single deployment
   - New: Projects contain multiple environments (dev, staging, prod, PR previews)
   - Why: Prepare for production workflow (not just first deployment)

4. **🔄 Project Setup with workload intelligence**
   - Old: 4 generic questions (app type, traffic, database, cache)
   - New: Project name + region selection + optional 5-question workload profile
   - Why: Project metadata foundational; workload questions drive data-driven CPU/memory/HPA sizing
   - Auto-accept UX: Live preview, no confusing apply button
   - Recommendations persist and seed resource defaults

5. **🔄 Editable post-deployment config**
   - Old: "Settings" tab for post-deployment changes
   - New: Projects tab with left/right panel (navigate → edit → apply)
   - Why: Staged changes workflow with cost preview prevents mistakes

6. **🔄 Next Steps focus**
   - Old: Dashboard had tabs, but no clear "what's next"
   - New: Prominent "Next Steps" tab with CLI setup and continuous deployment guide
   - Why: First deployment is just the beginning - users need GitOps workflow

### Total time: 5-7 minutes
Same as before, but now with:
- Project name and region selection upfront
- Optional workload-driven resource recommendations
- Multi-container support
- Post-deployment resource editing
- Clear path to continuous deployment

### Every step designed to:
1. **Minimize input** - only ask what can't be auto-detected
2. **Show intelligence** - workload questions generate transparent, data-driven recommendations
3. **Build trust** - transparent costs, visible automation, project metadata throughout
4. **Deliver immediate value** - operational tools ready instantly
5. **Enable growth** - dashboard prepares for multi-project, multi-environment workflows
