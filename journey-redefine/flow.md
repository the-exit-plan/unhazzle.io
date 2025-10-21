## Unhazzle User Flow

***

### Step 1: Authentication
**Page: Home**

**Action:** Click "Start Building"  
**Why:** Single clear CTA reduces decision paralysis and immediately signals the platform's purpose.

**Action:** Sign in with GitHub (identity only, no repo permissions)  
**Why:** OAuth eliminates password friction and builds instant trust through recognizable authentication without requesting invasive permissions.

**Action:** Enter name  
**Why:** Personalize the experience and prepare for account creation without lengthy forms.

***

### Step 2: Discovery Questions
**Page: Tell Us About Your App**

**Action:** What type of application?  
**Options:** E-commerce / SaaS Platform / API/Microservices / Content Platform  
**Why:** Determines infrastructure template (e-commerce needs cache + DB, SaaS needs job queues, etc.)

**Action:** Expected traffic pattern?  
**Options:** Steady / High burst periods / Global 24/7 / Regional  
**Why:** Defines autoscaling strategy and replica counts (bursts = aggressive scaling, steady = conservative).

**Action:** Need a database?  
**Options:** Yes (PostgreSQL/MySQL/MongoDB) / No  
**Why:** Provision stateful storage only if needed to avoid unnecessary cost.

**Action:** Need caching?  
**Options:** Yes (Redis/Memcached) / No  
**Why:** E-commerce/SaaS apps need session/data caching for performance; APIs often don't.

**Overall Step Why:** Gather minimum viable context (4 questions, 30 seconds) to intelligently configure infrastructure rather than forcing users through 50+ manual settings.

***

### Step 3: Application Setup
**Page: Add Your Application**

**Action:** Enter container image URL  
**Input:** `ghcr.io/acme/shop:v2.1.0`  
**Why:** This is the only thing you can't auto-detect - the actual application artifact.

**Action:** Registry credentials (if private)  
**Input:** Username/token  
**Why:** Required to pull images from private registries; skip for public images to reduce friction.

**Behind the scenes (auto-detect):**
- Extract EXPOSE port from image metadata  
  **Why:** Users already defined this in their Dockerfile - don't make them repeat it.
- Extract HEALTHCHECK endpoint if present  
  **Why:** Reuse existing health check logic rather than requiring manual configuration.

**Overall Step Why:** Minimize input to the single piece of information (image URL) that only the user knows.

***

### Step 4: Resource Configuration
**Page: Configure Resources (Smart Defaults)**

**Application Resources (with overrides):**
- Replicas: 2 (auto-scale to 10)  
  **Why:** 2 ensures HA during deploys, 10 cap prevents runaway costs during validation phase.
- CPU: 1 vCPU  
  **Why:** Based on "e-commerce" answer from Step 2 - typical web app baseline.
- Memory: 2GB  
  **Why:** Node/Python apps with DB connections typically need 1.5-2GB; safer to start higher.

**Database (PostgreSQL 14):**
- Storage: 20GB  
  **Why:** Enough for early-stage e-commerce (thousands of products) without over-provisioning.
- Backups: Daily, 7-day retention  
  **Why:** Industry standard for production; weekly would risk data loss, more is expensive.

**Cache (Redis 7):**
- Memory: 512MB  
  **Why:** Sufficient for session storage + hot data for small-medium traffic volumes.

**Overall Step Why:** Show intelligent defaults that prove platform expertise while allowing power users to adjust based on actual workload knowledge.

***

### Step 5: Environment Variables
**Page: Add Secrets**

**User inputs (secrets only they know):**
- `STRIPE_SECRET_KEY`  
  **Why:** Third-party API key only user possesses.
- `STRIPE_WEBHOOK_SECRET`  
  **Why:** Security credential for webhook validation.

**Platform auto-generates (shown for reference):**
- `DATABASE_URL=postgres://...` (read-only display)  
  **Why:** Platform knows DB credentials it just created - no manual connection string errors.
- `REDIS_URL=redis://...` (read-only display)  
  **Why:** Same as DB - eliminate copy-paste mistakes and credential leaks.

**Overall Step Why:** Only ask for secrets the platform can't generate, auto-provide everything else to reduce error-prone manual configuration.

***

### Step 6: Domain Setup
**Page: Custom Domain (Optional)**

**Action:** Enter custom domain  
**Input:** `shop.acme.com` (optional, can skip)  
**Why:** Professional businesses need custom domains, but provide default subdomain for instant testing.

**Platform shows:**
- "We'll auto-configure SSL certificate via Let's Encrypt"  
  **Why:** Reassure users they don't need to buy/manage certificates manually.
- "Add this DNS record: CNAME shop.acme.com → xyz.unhazzle.io"  
  **Why:** Clear, actionable instruction with exact values - no guesswork.

**Overall Step Why:** Make custom domains optional and trivial to configure, removing a traditional deployment bottleneck.

***

### Step 7: Review & Cost Estimate
**Page: Review Deployment**

**Show detailed cost breakdown:**
- Application (2-10 replicas): €45/month  
  **Why:** Transparent per-resource pricing builds trust; users see what they're paying for.
- PostgreSQL (20GB, HA): €65/month  
  **Why:** Show database cost separately - users understand stateful storage is expensive.
- Redis (512MB): €15/month  
  **Why:** Break out each component to justify total vs showing one opaque number.
- Load Balancer + SSL: €12/month  
  **Why:** Highlight infrastructure users would pay for separately on AWS (ALB = $16/mo).
- Bandwidth (estimated): €10/month  
  **Why:** Set expectation that traffic costs scale with usage.

**Total: €147/month**

**Show what's included (the "magic"):**
- Zero-downtime deployments  
  **Why:** Would take hours to configure rolling updates + health checks in raw K8s.
- Auto-scaling (CPU/memory based)  
  **Why:** HPA setup requires metrics-server, rules, testing - automated here.
- Static IP: `185.34.12.89`  
  **Why:** Solves webhook pain point mentioned in problem statement.
- SSL certificate (auto-renew)  
  **Why:** Cert-manager setup + monitoring eliminated.
- Daily database backups  
  **Why:** CronJob + S3 storage + restoration scripts automated.
- Log aggregation  
  **Why:** ELK stack setup avoided.
- Health monitoring & automatic failover  
  **Why:** Liveness probes + restart policies configured.

**Overall Step Why:** Justify pricing by showing massive time savings (days → minutes) and technical complexity being handled automatically.

***

### Step 8: Deploy
**Page: Deploying... (Real-time Progress)**

**Show sequential progress:**
- ✅ Pulling image from registry  
  **Why:** Confirm connectivity and authentication worked.
- ✅ Provisioning PostgreSQL database  
  **Why:** Show stateful provisioning is happening (slow operation).
- ✅ Provisioning Redis cache  
  **Why:** Indicate all requested add-ons are being created.
- ✅ Configuring load balancer  
  **Why:** External IP allocation takes time - show it's in progress.
- ✅ Generating SSL certificate  
  **Why:** Let's Encrypt ACME challenge happens here - visible progress.
- ✅ Starting application containers  
  **Why:** Show actual deployment happening.
- ✅ Health checks passing  
  **Why:** Confirm app is actually responding, not just running.

**Overall Step Why:** Real-time feedback reduces deployment anxiety and proves complex infrastructure work is actually happening vs instant "done" that feels fake.

***

### Step 9: Application Dashboard
**Page: Live Dashboard**

**Display immediately:**
- **Status:** Running (2 replicas)  
  **Why:** Confirm deployment succeeded and current scale.
- **URL:** `https://shop.acme.com`  
  **Why:** One-click access to live application.
- **Static IP:** `185.34.12.89` with "Add to Stripe webhook whitelist"  
  **Why:** Actionable next step for e-commerce integration.

**Tab 1: Overview**
- Request rate (req/sec)  
  **Why:** Immediate traffic visibility without setup.
- Response time (p50, p95, p99)  
  **Why:** Performance monitoring engineers care about percentiles.
- Error rate %  
  **Why:** Catch production issues fast.
- Active connections  
  **Why:** Understand concurrent load.

**Tab 2: Logs (Live Tail)**
- Filterable by timestamp, severity  
  **Why:** Debugging requires quick log access without SSH/kubectl.

**Tab 3: Metrics**
- CPU/Memory usage per replica  
  **Why:** Validate resource allocation decisions.
- Database connections  
  **Why:** Catch connection pool exhaustion.
- Cache hit rate  
  **Why:** Redis effectiveness monitoring.

**Tab 4: Events**
- "Scaled from 2→5 replicas at 18:23 (CPU spike)"  
  **Why:** Prove auto-scaling is working - builds trust in automation.
- "SSL certificate renewed at 02:15"  
  **Why:** Show automated maintenance happening.
- "Deployed v2.1.1 at 14:32"  
  **Why:** Deployment history for rollback decisions.

**Tab 5: Settings**
- Update environment variables  
  **Why:** Change secrets without redeployment process.
- Adjust resource limits  
  **Why:** Scale up/down without starting over.
- Manual deployment trigger  
  **Why:** Force redeploy for testing.
- Download YAML manifest  
  **Why:** Export config for GitOps without forcing write access to repos.

**Overall Step Why:** Deliver operational visibility that would take days to configure (Prometheus, Grafana, logging stack) instantly, proving platform value beyond just deployment.

***

## Summary

**Total time: 5-7 minutes** from signup to production app vs days/weeks with raw Kubernetes or competitors.

**Every step designed to:**
1. **Minimize input** - only ask what can't be auto-detected
2. **Show intelligence** - defaults prove you understand their use case  
3. **Build trust** - transparent costs and visible automation
4. **Deliver immediate value** - operational tools ready instantly
5. **Enable control** - power users can override everything
