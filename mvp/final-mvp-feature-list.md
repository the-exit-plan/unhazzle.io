# Final MVP Feature List 

## Platform basics

**1. Project Management** DONE
- Create project with name and region selection
- Region visibility (show "Hetzner Falkenstein, Germany")
- Optional questionnaire (5 questions) for auto-configuration

**2. Environment Management** DONE
- Create environments (Production, Staging, Development) under project
- Environment badges (visual labels, not in names)
- Left panel navigation: Project → Environments → Apps

**3. App Deployment** DONE
- Container image deployment (OCI registry support: public/private)
- Health check configuration (single endpoint, auto-configure probes)
- Environment variables + secrets (key-value UI with JSON file upload for batch import)
- Persistent volume attachment (any deployment, not just StatefulSets)
- Multi-app deployments (separate containers as separate apps)

**4. Resource Management** DONE
- Questionnaire-driven auto-sizing (replicas, CPU/memory based on 5 questions)
- Horizontal Pod Autoscaling (HPA) with configurable min/max replicas
- Max cost transparency (show cost at max scale)
- Manual resource adjustment (override auto-config)

**5. Networking** DONE
- Auto-generated subdomain per app (`app-env-hash.unhazzle.app`)
- Custom domain support with TLS automation (cert-manager)
- Internal service discovery, explicit internal URLs shown in UI (`app-name.env-name`)
- Inter-app networking configuration (e.g. frontend → backend connectivity)

## Data Layer

**6. External Database** DONE
- Connection string input for external DB managed services (Aiven, Supabase, etc.)
- Region guidance (recommend same region as project)
- Connection validation: Make sure the connection string is valid and the database is accessible from unhazzle infrastructure

**7. Cache/Storage** DONE
- Deploy cache as standard pod (Redis, Memcached, Valkey)
- Volume attachment for persistence
- Standard container configuration (no special treatment)

## Observability (4-Tier)

**8. Tier 1: K8s Events (Always Visible)**
- Pod restart count + reasons (OOMKilled, CrashLoopBackOff, Error)
- Last 10 K8s events per app
- Current instance status (X/Y instances running)
- Deploy history (last 5 deployments)

**9. Tier 2: Basic Metrics (Always Visible)**
- Request count (derived from health checks)
- Error rate percentage
- CPU/Memory utilization
- Restart count alerts

**10. Tier 3: Container Logs (On-Demand)**
- Last 100 lines stdout/stderr
- Live tail option
- Filter by container (multi-container apps)

**11. Tier 4: External Integration**
- Datadog/external monitoring connection (API key input)
- Webhook for metrics push

## Developer Experience

**12. OCI Registry Integration**
- Connect public/private registries in project settings
- Auto-populate app config based on image inspection (detect ports, common patterns)
- Image selection UI with pre-configured defaults

**13. Actions & Operations**
- Restart app
- Scale (adjust resources/replicas)
- Redeploy (same or new image)
- Rollback to previous deployment

**14. CLI (Pipeline Use Only)**
- Deploy command (`unhazzle deploy`)
- Scale command (`unhazzle scale`)
- Logs command (`unhazzle logs --tail`)
- Export project config to YAML
- CI/CD integration (GitHub Actions, GitLab CI)

## Cost & Billing

**15. Cost Transparency**
- Real-time cost estimate during configuration
- Max cost display (HPA max replicas × resource cost)
- Cost breakdown per app
- Monthly estimate per project


