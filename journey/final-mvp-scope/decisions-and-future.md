# Unhazzle MVP: Decisions & Future Roadmap

## Key Decisions (MVP Scope)

**Infrastructure Architecture:**
- Option 2: Shared K8s cluster with namespace isolation
- Single region for MVP (EU-only, Hetzner-based)
- No StatefulSets - use Deployments with volume attachments

**Data Layer:**
- External databases only (Aiven, Supabase) - no managed DB for MVP
- Cache treated as standard pod deployment with optional volume
- Connection via TLS over internet (region guidance for <20ms latency)

**Project Structure:**
- Hierarchy: Project → Environment → Apps
- Environments as explicit field with visual badges (not in app names)
- Region selection at project level

**Auto-Configuration:**
- 5-question questionnaire drives initial resource sizing
- Questions map to: traffic volume, latency sensitivity, workload type, startup time, traffic pattern
- Direct correlation to replicas, CPU/memory, HPA settings, cooldown periods

**Scaling & Resources:**
- Horizontal Pod Autoscaling (HPA) is mandatory
- Max replicas configuration for cost transparency
- Real-time cost estimates showing max scale cost

**Developer Experience:**
- No K8s terminology (use "instances" not "pods")
- OCI registry integration with auto-population from image inspection
- Internal service URLs explicitly shown for inter-app communication
- JSON file upload for batch env var/secrets import
- CLI for pipelines only (not primary interface)
- YAML export for GitOps/version control

**Observability:**
- Tier 1: K8s events (restarts, reasons, status) - always visible
- Tier 2: Basic metrics (requests, errors, CPU/mem) - always visible
- Tier 3: Container logs (last 100 lines, live tail) - on-demand
- Tier 4: External integration (Datadog, webhooks)

***

## Post-MVP Roadmap (Do Later)

**Managed Services (3-6 months post-launch):**
- In-cluster Redis provisioning (easier than DB, good first managed service)
- Managed databases (Postgres, MySQL) with backups/HA
- Private networking to external DBs via Aiven partnership

**Platform Features (6-12 months):**
- Multi-region deployments
- StatefulSets support for complex stateful workloads
- Multi-container in single pod (sidecar pattern)
- Blue-green and canary deployment strategies
- RBAC and team permissions
- GitOps integration (auto-deploy from Git repos)

**Advanced Observability:**
- In-cluster monitoring stack (Prometheus/Grafana provisioning as managed service)
- Advanced metrics and custom dashboards
- Alerting rules and incident management

**Enterprise Features:**
- Service mesh for advanced networking
- Compliance certifications (SOC 2, ISO 27001)
- Dedicated clusters for high-value customers (Option 1 architecture)
- SLA guarantees and premium support

**Technical Enhancements:**
- Custom probe configuration (override auto-config if needed)
- Advanced resource management and optimization suggestions
- Cost anomaly detection and alerts
- Automated security scanning and vulnerability alerts

***

**Priority Order:**
1. Launch MVP (core features above)
2. Get first 50 customers, validate product-market fit
3. Add managed Redis (operational learning with lower risk than DB)
4. Partner with Aiven for private networking
5. Evaluate multi-region based on customer demand
6. Build managed database offering once team scales to 10+ engineers

