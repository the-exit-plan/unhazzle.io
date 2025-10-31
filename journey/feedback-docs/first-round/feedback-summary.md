# Feedback Analysis: Features, Bugs & Improvements

**Generated**: October 30, 2025  
**Sources**: Mahya, Inaki, Matija, Andre (incl. P&G/Procurement perspective), Viviana, Jeroen, Eveline

---

## **BUGS**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Cache selection mismatch | Selected memcached but deployment shows Redis | Inaki | ✓ | | | |

---

## **SECURITY & SECRETS MANAGEMENT**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Mask secrets in UI | Secrets should be write-once, not visible after creation (security risk) | Mahya | | | | ✓ |
| Sensitive data in logs | Define policy for handling sensitive data in logs | Mahya | | | | ✓ |
| Team permissions & RBAC | Define different permission levels for team members and Unhazzle platform access | Mahya | ✓ | | | |

---

## **CONFIGURATION & SETTINGS**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| View current deployment config | Settings tab should show complete current configuration at a glance | Mahya | ✓ | | | |
| Environment context in toggles | Show which environment (dev/prod) when toggling settings like autoscaling | Mahya | ✓ | | | |
| Edit replicas/resources inline | When autoscaling is disabled, allow editing replicas, CPU, RAM in place | Mahya | ✓ | | | |
| Editable auto-generated env var names | Users need to customize env var names or rebuild app to match. Add the UNHAZZLE prefix  | Jeroen/Eveline | ✓ | | | |
| Edit selections on pricing page | Allow editing configuration choices on review/pricing page without going back | Viviana | ✓ | | | |
| Multi-container support | Support multiple containers per application (frontend/backend separation). Think on a way to select which containers have access to what | Jeroen/Eveline | ✓ | | | |
| Init Container | Think how it can be included | Sep | ? | | | |
| Volume/stateful storage | Ability to attach persistent volumes for stateful applications | Inaki/Jeroen/Eveline | ✓ | | | |
| Static content hosting (Need more investigation) | Solution for hosting static assets (CDN, object storage) | Matija, Jeroen/Eveline | ? | | | |
| Private endpoints | Configure private endpoints for third-party services (no internet exposure) | Inaki | | | ✓ | |
| Scheduled scaling | Schedule scaling based on time/date (e.g., scale up during business hours) | Jeroen/Eveline | | | ✓ | |

---

## **MONITORING & OBSERVABILITY**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Infrastructure logs (TBD) | Provide actual infrastructure logs (connections, ports, protocols, DB, cache, requests) | Mahya | ? | | | |
| Infrastructure metrics (TBD) | Add infra-related metrics (e.g., JVM for Java apps) | Mahya | ? | | | |
| Application-level metrics (TBD)| Golden signals: latency, traffic, errors, saturation | Inaki | ? |  | | |
| HTTP status distribution (TBD)| Show percentage of requests by status code (200, 201, 500, etc.) | Inaki | ? | | | |
| Log persistence (TBD)| Clear policy on how long logs are retained | Matija | ? | | | |
| Third-party monitoring integration | Support Datadog, Dynatrace, Prometheus, Grafana, OpenTelemetry configuration | Inaki, Jeroen/Eveline | ✓ | | | |
| Monitoring stack template | Offer pre-configured monitoring stack (Grafana LGTM, ELK) for multiple projects | Jeroen/Eveline | ✓ | | | |
| Performance improvement suggestions | AI-based suggestions to improve performance based on metrics | Andre | ? | | | |

---

## **ALERTING & NOTIFICATIONS**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Infrastructure alerting | Alerts when infrastructure components fail or degrade | Mahya | ✓ | | | |
| Cost alerts | Alerts when costs exceed thresholds | Matija | ✓ | | | |

---

## **DATABASE & SERVICES**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| NoSQL database support | Add MongoDB, Cassandra, or other NoSQL options. Investigate how they are going to configure (advance) it | Matija, Inaki | ✓ | | | |
| Message queue service | Event-driven apps need message queues (RabbitMQ, Kafka, SQS) | Jeroen/Eveline | ✓ | | | |
| In-memory cache service | Redis, Valkey, OSS |  | ✓ | | | |
| FaaS/Serverless functions | Support for short-lived jobs and serverless functions | Jeroen/Eveline | ✓ | | | |
| Managed vs. self-managed services | Clear option: Aiven-managed (higher cost) or self-managed with backups enabled | Inaki, Jeroen/Eveline | ✓ | | | |
---

## **CLI IMPROVEMENTS**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Shorten CLI binary name | "unhazzle" is too long for frequent typing | Matija | | ✓ | | |
| Interactive CLI mode | Support both flags and interactive prompts (e.g., `unhazzle init` asks questions) | Matija | | ✓ | | |
| In-terminal help/guidance | Modern CLI with built-in guidance, less need for external docs | Matija | | ✓ | | |
| Better GH Actions setup docs | Clearer instructions on what users need to do to set up GitHub Actions | Matija | ✓ | | | |

---

## **GUARDRAILS & GUIDANCE**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Configuration guardrails | Prevent junior devs from provisioning unnecessary resources (e.g., DB warnings) | Mahya | | ✓ | | |
| Onboarding video | Short video for beginners and power users | Andre | | | ✓ | |
| FAQ or chatbot support | Built-in help for common questions during configuration | Viviana, Andre | | | ✓ | |
| Better documentation/examples | Good Docker examples reduce need for complex documentation | Matija | | ✓ | | |

---

## **PRICING & TRANSPARENCY**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Show max cost on scale-up | Display maximum potential cost if scaling reaches upper limits | Andre | ✓ | | | |
| Risk disclosure | Clearly communicate risks associated with choices | Andre | | ✓ | | |

---

## **ENVIRONMENTS & WORKFLOWS**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Environment visualization | Visualize project + environment relationship | Jeroen/Eveline | | | ✓ | |
| PR/ephemeral environments | Short-lived environments for pull requests (auto-expire, minimal resources) | Jeroen/Eveline | ? | | | |
| Max PR environments cap | Limit number of PR environments per project to control costs | Jeroen/Eveline | ? | | | |

---

## **NETWORK & SECURITY**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| IP whitelist | Restrict access by IP address | Jeroen/Eveline | ✓ | | | |
| Geo-based firewalling | Block traffic based on geographic location | Jeroen/Eveline | | | ? | |

---

## **UX IMPROVEMENTS (DEMO)**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Auto-advance on mobile | On mobile, auto-advance to next question after selection | Viviana | | | ✓ | |
| Required field indicators | Mark required fields with asterisk (*) | Viviana | | | ✓ | |
| EU language selector | Support multiple European languages in UI | Andre | | | ✓ | |

---

## **COMPLIANCE & LEGAL**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| EU compliance framework | Legal/data-protection/governance standards (GDPR, etc.) | Andre | | ✓ | | |
| SLA and DPA documentation | Service Level Agreement and Data Processing Agreement | Andre | | ✓ | | |
| Sustainability/green hosting | EU data centers with renewable energy, efficiency transparency | Andre | | | ✓ | |

---

## **MIGRATION & INTEGRATION**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Migration tools | Help users migrate from existing platforms with running pipelines | Mahya | | ✓ | | |

---

## **COST GOVERNANCE & MARGIN MANAGEMENT**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Cost Telemetry Service | Track compute, storage, and bandwidth per app/config to maintain predictable margins | Andre (P&G) | | ✓ | | |
| Replica usage tracking per tenant | Track and flag when sustained >80% replica usage occurs; trigger upgrade recommendations | Andre (P&G) | | ✓ | | |
| Real-time bandwidth alerts | Alert at 80% bandwidth usage; show in dashboard; charge for overages beyond included 20TB | Andre (P&G) | | ✓ | | |
| Storage tracking & auto-upgrades | Automate storage monitoring and trigger plan upgrades at thresholds (Postgres 50GB+) | Andre (P&G) | | ✓ | | |
| Tiered backup retention | Track backup volume per tenant; apply tiered retention policies (7/30/90 days) | Andre (P&G) | | ✓ | | |
| Vendor pricing sync via API | Sync Hetzner/vendor pricing via API; maintain 4-5% buffer and alert on cost shifts | Andre (P&G) | | ✓ | | |
| Support time tracking | Log support time per tenant; integrate into pricing model quarterly | Andre (P&G) | | | ✓ | |
| Dynamic cost recalculation | Link configuration changes to internal cost tables; recalculate impact in real-time | Andre (P&G) | | ✓ | | |
| Cost drift alerts | Create alerts when usage exceeds thresholds (CPU >90%, bandwidth >80%) | Andre (P&G) | | ✓ | | |
| Cost baselines per template | Define and store cost baselines in DB/YAML per resource template (compute, DB, cache) | Andre (P&G) | | ✓ | | |
| Usage & vendor reporting | Auto-generate usage and vendor reports for GDPR and enterprise compliance | Andre (P&G) | | ✓ | | |
| Quarterly pricing review cycle | Scheduled API pulls for vendor pricing updates; review quarterly | Andre (P&G) | | ✓ | | |

---

## **STRATEGIC/BUSINESS**

| Item | Description | Source | MVP | Must-Have (ASAP after launch) | Nice-to-Have (revisit later) | Won't do |
|------|-------------|--------|-----|-----------|--------------|----------|
| Testing scoring/checklist | Internal framework to evaluate performance, usability, compliance, support | Andre | | | ✓ | |
| AI feedback reports | AI-generated reports on user feedback and feature requests | Andre | | | ✓ | |
| Competitor feature analysis | Regularly assess which competitor features users expect | Andre | | | ✓ | |

---

## Summary Statistics

- **Total Items**: 68
- **MVP**: 12 items
- **Must-Have**: 44 items
- **Nice-to-Have**: 12 items
- **Bugs**: 1

---

## Key Takeaways for MVP Discussion

### Critical MVP Items (Must Fix/Add):
1. **Fix cache selection bug** (Redis vs Memcached)
2. **Mask secrets properly** (security)
3. **Show current config in Settings tab**
4. **Environment context in settings** (dev/prod clarity)
5. **Editable env var names**
6. **Infrastructure logs** (actual useful logs)
7. **Infrastructure metrics** (JVM, etc.)
8. **Log persistence policy**
9. **Max cost display** for scaling
10. **Managed vs self-managed DB/cache strategy**
11. **Sensitive data in logs policy**
12. **View current deployment snapshot**

### High-Impact Must-Haves:
- Multi-container support
- Volume/stateful storage
- Static content hosting
- Application-level monitoring
- Third-party monitoring integration
- Message queue service
- NoSQL database options
- Infrastructure alerting
- Cost alerting
- Configuration guardrails

### Quick Wins (Nice-to-Have but Easy):
- Auto-advance on mobile
- Required field indicators
- Shorten CLI binary name
- Better GH Actions documentation

---

## Feedback Highlights by Persona

### **Senior Engineers (Mahya, Inaki)**
- Focus on operational excellence, security, and incident response
- Need proper logs, metrics, alerting
- Want granular control and visibility
- Concerned about security and permissions

### **Power Users (Matija)**
- CLI-first approach
- Need interactive guidance
- Cost visibility is critical
- Serverless/NoSQL support for modern architectures

### **Business/Procurement (Andre)**
- Compliance and legal framework essential
- Transparency in pricing and risks
- Sustainability as differentiator
- User support and onboarding matter
- **Cost governance & margin management critical** (P&G perspective)
  - Need internal telemetry for cost tracking per tenant
  - Real-time alerts for resource overages (bandwidth, storage, replicas)
  - Vendor pricing volatility protection (API sync + buffer)
  - Dynamic cost recalculation for configuration changes
  - Usage/compliance reporting for enterprise customers

### **DevOps/Platform Engineers (Jeroen, Eveline)**
- Multi-container and stateful workloads
- Integration with existing monitoring tools
- Message queues and event-driven architectures
- PR environments for efficient development
- Managed services strategy is pragmatic

### **Non-Technical (Viviana)**
- UX polish matters
- In-app help and guidance
- Mobile-first experience
- Clear required field indicators
