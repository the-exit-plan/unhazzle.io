# Unhazzle CLI Design Guide

# CLI validation

After the UI demo finishes and the local-to-production process is completed we share with our friends our vision for the next steps. From now on they can continuously deploy the application by moving the unhazzle.yaml to their GitHub repository and integrate with Unhazzle CLI via GitHub actions.

1. What do you think about this?
2. Would you also like to have the same UI flow implemented in the CLI?
3. How would you use the CLI to interact with Unhazzle? (Both for a first project or an existing running project)


## Core Philosophy

**UI = Exploration, discovery, first-time use, visual feedback**  
**CLI = Automation, scripting, speed, CI/CD pipelines**

Don't mirror the UI flow in CLI - optimize for CLI strengths.

***

## Design Principles

### Speed Over Guidance
Developers using CLI want **one command to rule them all** - not a multi-step wizard.

### Intelligent Defaults First
Apply smart defaults based on image inspection + industry standards. Don't ask questions unless explicitly requested.

### Three Deployment Paths
1. **Fast path:** Defaults + flags (no questions, 10 seconds)
2. **Guided path:** `--interactive` mode (questions, 2-3 minutes)
3. **Declarative path:** Config file (no questions, repeatable)

***

## Core Commands

### 1. Deploy (Primary Command)

**Basic Syntax:**
```bash
unhazzle deploy <image> [options]
```

**Minimal Deploy (No Questions):**
```bash
unhazzle deploy ghcr.io/acme/shop:v2.1.0
```

**What happens:**
1. Inspect image → Extract port, health check endpoint
2. Apply smart defaults:
   - Type: Auto-detect as "web app"
   - Replicas: 2-10 (standard auto-scale)
   - CPU: 1 vCPU
   - Memory: 2GB
   - Database: **None** (don't provision unless requested)
   - Cache: **None**
3. Deploy immediately

**Output:**
```
🚀 Deploying acme-shop with default configuration...
   ✓ Deployed with 2 replicas, 1 CPU, 2GB RAM
   
✅ Live at: https://acme-shop-a7k2.unhazzle.io
   Static IP: 185.34.12.89
   
💡 To customize: unhazzle deploy --help
```

***

**Explicit Config (Power Users):**
```bash
unhazzle deploy ghcr.io/acme/shop:v2.1.0 \
  --type ecommerce \
  --database postgres \
  --cache redis \
  --env STRIPE_SECRET_KEY=sk_live_xxx \
  --env STRIPE_WEBHOOK_SECRET=whsec_xxx \
  --cpu 2 \
  --memory 4GB \
  --replicas 3-15 \
  --domain shop.acme.com
```

**Available Flags:**
- `--type <app-type>` - E-commerce, SaaS, API (default: auto-detect)
- `--replicas <min>-<max>` - Auto-scale range (default: 2-10)
- `--cpu <cores>` - CPU per replica (default: 1)
- `--memory <gb>` - Memory per replica (default: 2GB)
- `--database <type>` - postgres, mysql, none (default: none)
- `--cache <type>` - redis, memcached, none (default: none)
- `--env KEY=VALUE` - Environment variables (repeatable)
- `--domain <domain>` - Custom domain (default: auto-generated)
- `--region <region>` - EU, US (default: EU)

**Output:**
```
🚀 Deploying acme-shop...
   ✓ Pulling image from registry (2s)
   ✓ Provisioning PostgreSQL database (8s)
   ✓ Provisioning Redis cache (4s)
   ✓ Configuring load balancer (3s)
   ✓ Generating SSL certificate (5s)
   ✓ Starting 2 replicas (6s)
   ✓ Health checks passing (2s)

✅ Deployment successful!

   App URL:      https://shop.acme.com
   Static IP:    185.34.12.89
   Dashboard:    https://app.unhazzle.io/apps/acme-shop
   
   Database:     postgres://user:pass@db.unhazzle.io:5432/acme-shop
   Redis:        redis://cache.unhazzle.io:6379
   
   Cost estimate: €147/month
```

***

### 2. Interactive Mode (For First-Time Users)

```bash
unhazzle deploy --interactive
```

**Flow:**
```
? Container image URL: ghcr.io/acme/shop:v2.1.0
? Application type: 
  > E-commerce
    SaaS Platform
    API/Microservices
    Skip (use defaults)
? Need a database? (Y/n): y
? Database type:
  > PostgreSQL
    MySQL
    MongoDB
? Need caching? (y/N): y
? Redis memory (MB) [512]: 
? Add environment variable? (Y/n): y
? Key: STRIPE_SECRET_KEY
? Value: ••••••••••••
? Add another? (y/N): n
? Custom domain (optional): shop.acme.com

🚀 Deploying acme-shop...
```

**When to use:** Explicit opt-in for first-time CLI users who need guidance. Not forced on every deploy.

***

### 3. Smart Hints (Non-Blocking Suggestions)

**Scenario:** User deploys without database, but platform detects database dependencies.

```bash
unhazzle deploy ghcr.io/acme/shop:v2.1.0
```

**Output:**
```
🚀 Deploying acme-shop...
   
⚠️  Detected: This image contains PostgreSQL client libraries
   
💡 Add a database? Run:
   unhazzle deploy ghcr.io/acme/shop:v2.1.0 --database postgres
   
   Or, if you have an external database, set DATABASE_URL:
   unhazzle deploy ghcr.io/acme/shop:v2.1.0 --env DATABASE_URL=postgres://...

Deploying without database... (Ctrl+C to cancel)
⏳ 3... 2... 1...
```

***

### 4. Config File (Infrastructure-as-Code)

```bash
unhazzle deploy --config unhazzle.yaml
```

**unhazzle.yaml:**
```yaml
image: ghcr.io/acme/shop:v2.1.0
type: ecommerce
domain: shop.acme.com

resources:
  replicas: 2-10
  cpu: 1
  memory: 2GB

services:
  database:
    type: postgres
    storage: 20GB
  cache:
    type: redis
    memory: 512MB

env:
  STRIPE_SECRET_KEY: ${STRIPE_KEY}
  STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK}
```

**Why:** Infrastructure-as-code, version-controlled, CI/CD friendly, repeatable deploys.

***

### 5. Status & Monitoring

```bash
unhazzle status [app-name]
```

**Output:**
```
📊 acme-shop

Status:       Running
Replicas:     2/2 healthy
URL:          https://shop.acme.com
Deployed:     2 hours ago (v2.1.0)

Resources:
  CPU:        45% avg
  Memory:     1.2GB / 4GB
  Requests:   156 req/min

Recent events:
  2h ago  Deployed v2.1.0
  1h ago  Scaled 2→3 replicas (CPU spike)
  30m ago Scaled 3→2 replicas (load normalized)
```

***

### 6. Logs (Real-time)

```bash
unhazzle logs [app-name] [--follow] [--since 1h]
```

**Output:**
```
[replica-1] 2025-10-21 13:42:15 INFO Starting server on port 8080
[replica-2] 2025-10-21 13:42:16 INFO Database connected
[replica-1] 2025-10-21 13:42:20 POST /api/checkout 200 124ms
[replica-2] 2025-10-21 13:42:21 GET /products 200 45ms
```

***

### 7. Environment Variables

```bash
unhazzle env set <app> KEY=VALUE
unhazzle env get <app> [KEY]
unhazzle env list <app>
```

**Example:**
```bash
unhazzle env set acme-shop STRIPE_KEY=sk_live_new_key
✓ Updated STRIPE_KEY
⚠ Restart required for changes to take effect

unhazzle restart acme-shop
```

***

### 8. Scale (Manual Override)

```bash
unhazzle scale <app> --replicas 5
unhazzle scale <app> --cpu 2 --memory 4GB
```

***

## CLI vs UI Comparison

### Philosophy

| **Aspect** | **UI** | **CLI** |
|---|---|---|
| **Primary use case** | First-time setup, exploration | Daily operations, automation |
| **Discovery questions** | Always shown | Never (unless --interactive) |
| **Configuration** | Visual forms, guided | Flags or config file |
| **Feedback** | Visual dashboards, graphs | Text output, progress bars |
| **Time to deploy** | 5-7 minutes (guided) | 10 seconds (one command) |

***

### User Journeys

| **Scenario** | **UI** | **CLI (Default)** | **CLI (--interactive)** |
|---|---|---|---|
| First-time deploy | Discovery questions → visual config | `unhazzle deploy <image>` | `unhazzle deploy --interactive` |
| Daily deployments | Click through 5 screens | `unhazzle deploy <image>` | N/A |
| CI/CD pipeline | N/A | `unhazzle deploy --config` | N/A |
| Check app status | Dashboard with graphs | `unhazzle status` | N/A |
| View logs | Web console with filters | `unhazzle logs --follow \| grep ERROR` | N/A |
| Update secrets | Form with masked inputs | `unhazzle env set KEY=VALUE` | N/A |
| Monitoring/debugging | Dashboard (visual graphs) | Link to web dashboard | N/A |

***

### Configuration Approach

| **Aspect** | **UI** | **CLI (Default)** | **CLI (--interactive)** |
|---|---|---|---|
| Database provisioning | Ask before deploying | Only if `--database` flag | Ask during flow |
| App type selection | Required question | Auto-detect/default | Ask with options |
| Environment variables | Form with fields | Flags: `--env KEY=VALUE` | Prompt for each |
| Configuration review | Visual summary screen | Logs during deploy | Summary before deploy |

***

## CLI UX Best Practices

### 1. Progress Indicators
```bash
🚀 Deploying acme-shop...
   ⏳ Pulling image... (15s)
   ✓ Image pulled
   ⏳ Provisioning database... (estimated 30s)
```

**Why:** Long operations need feedback without blocking.

***

### 2. Smart Defaults + Overrides
```bash
# Minimal command (uses all defaults)
unhazzle deploy ghcr.io/acme/shop:latest

# Override specific settings
unhazzle deploy ghcr.io/acme/shop:latest --cpu 2 --replicas 5-20
```

**Why:** Power users love flags, beginners love defaults.

***

### 3. Actionable Output
```bash
✅ Deployment successful!
   Static IP: 185.34.12.89
   
💡 Next steps:
   1. Add this IP to your Stripe webhook whitelist
   2. Configure DNS: CNAME shop.acme.com → xyz.unhazzle.io
   3. View logs: unhazzle logs acme-shop --follow
```

**Why:** Tell users what to do next.

***

### 4. Error Handling
```bash
❌ Deployment failed: Image not found

Troubleshooting:
  • Verify image exists: docker pull ghcr.io/acme/shop:v2.1.0
  • Check registry credentials: unhazzle registry auth
  • View full logs: unhazzle logs acme-shop --deploy-errors
```

**Why:** Help users fix problems without contacting support.

***

## What CLI Should NOT Do

**Don't replicate UI wizards:**
- Multi-step interactive flows (except `--interactive` mode)
- Visual dashboards (link to web dashboard instead)
- Drag-and-drop config builders

**Why:** CLI users want speed and automation, not hand-holding.

***

## Summary

**CLI Design Philosophy:**
- **Default behavior:** Smart defaults, no questions, instant deploy
- **Interactive mode:** Opt-in guided flow for first-time users
- **Config file:** Infrastructure-as-code for repeatable deploys
- **Speed optimized:** Single command = single deploy
- **CI/CD friendly:** Scriptable, no state between commands

**Core Commands:**
1. `unhazzle deploy` - One-command deploy
2. `unhazzle status` - Quick health check
3. `unhazzle logs` - Real-time debugging
4. `unhazzle env` - Secrets management
5. `unhazzle deploy --config` - Infrastructure-as-code

**Key Takeaway:** Don't force questions in CLI. Provide three paths: fast (defaults + flags), guided (--interactive), and declarative (config file). CLI users who want suggestions will use UI first, then copy the generated config to CLI/YAML for future deploys.
