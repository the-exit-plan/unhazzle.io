## Multi-Container Support Specification

**Status**: ✅ COMPLETE (Phase 2 - UI Implementation)

**Feature**: Support multiple containers per project (frontend/backend separation) with granular service access control

**Source**: Jeroen/Eveline feedback

**Priority**: MVP

---

### Overview

Enable users to deploy multi-service architectures within a single project, where each container (Application/Function) can be independently configured with its own resources, exposure settings, and service access permissions.

**Constraints**:
- Maximum 2-5 containers per project
- Each container has isolated environment variables
- Service access (Database/Cache/Queue) is explicit opt-in per container
- Inter-container communication via internal DNS only

---

### Step 1: Container Definition
**Page: Add Your Application (Enhanced)**

**Current behavior**: Single container input (image URL + registry credentials)

**New behavior**: Support multiple container definitions

**Action**: Enter first container details
- **Container name**: `frontend` (user-defined, used for DNS)
- **Container image URL**: `ghcr.io/acme/shop-frontend:v2.1.0`
- **Registry credentials** (if private): Username/token

**Action**: Click "Add Another Container" button (optional, up to 4 more)
- Opens new container definition form
- **Container name**: `backend`
- **Container image URL**: `ghcr.io/acme/shop-backend:v2.1.0`
- **Registry credentials** (if private)

**Why**: Allow users to define all containers in their architecture upfront, establishing the foundation for multi-service projects.

**Behind the scenes (auto-detect per container)**:
- Extract `EXPOSE` port from image metadata
  - **Fallback**: Default to 8080 if not found
- Extract `HEALTHCHECK` endpoint if present
  - **Fallback**: Default to `/health`
- Apply smart defaults for CPU/RAM based on inferred container type

**Display message**: 
> 💡 **Coming soon**: YAML-based configuration for complex deployments

**Overall Step Why**: Minimize repetitive input by detecting configuration from Docker images while allowing multiple container definitions in a streamlined flow.

---

### Step 2: Container Resource Configuration
**Page: Configure Resources (Per-Container)**

**For each defined container, show expandable section:**

**Container: `frontend`**

**Port Configuration (always editable)**:
- **Port**: 3000 (inferred from Dockerfile `EXPOSE` or default 8080)
  - **Why**: Single port simplifies configuration; can be used for both application and health checks

**Exposure Settings**:
- **Visibility**: Public / Private (radio buttons)
  - **Public**: Container is accessible from internet, requires domain
  - **Private**: Internal only, accessible via `{container-name}.{project-name}`
- **Domain** (if Public selected): `shop.acme.com`
  - **Why**: Professional businesses need custom domains for public-facing services

**Resource Allocation (smart defaults, always editable)**:
- **CPU**: 0.5 cores (smart default for frontend)
  - **Why**: Frontend typically less CPU-intensive than backend services
- **Memory**: 512MB (smart default for frontend)
  - **Why**: Static/lightweight frontends need less memory than API servers
- **Replicas**: 2 (auto-scale to 10)
  - **Why**: Ensure high availability for all containers

**Health Check Configuration (smart defaults, always editable)**:
- **Protocol**: HTTP / TCP / gRPC
  - **Default**: HTTP
- **Port**: 3000 (uses container port)
- **Path**: `/health` (default)
  - **Why**: Industry standard health check endpoint
- **Interval**: 30s
- **Timeout**: 5s
- **Retries**: 3
  - **Why**: Balance between quick failure detection and avoiding false positives

**Service Access (explicit opt-in with editable variable names)**:
Checkboxes for services configured in Step 2 (Discovery Questions):

- ☐ PostgreSQL Database
  - **Variable name**: `UNHAZZLE_POSTGRES_URL` (editable) ✏️
  - **Value**: `postgresql://user:pass@postgres.my-project:5432/mydb` (auto-generated, read-only)
  - **Helper text**: "Customize the variable name if your app expects a different format (e.g., DATABASE_URL)"
  - **Why**: Platform proposes smart default with UNHAZZLE_ prefix, but users can change to match their app's expectations

- ☐ Redis Cache
  - **Variable name**: `UNHAZZLE_REDIS_URL` (editable) ✏️
  - **Value**: `redis://cache.my-project:6379` (auto-generated, read-only)

- ☐ RabbitMQ Queue
  - **Variable name**: `UNHAZZLE_RABBITMQ_URL` (editable) ✏️
  - **Value**: `amqp://user:pass@queue.my-project:5672` (auto-generated, read-only)

**Selected services**: None by default
  - **Why**: Frontend typically doesn't need direct database access; enforce least-privilege by default

**Variable naming rules**:
- Default format: `UNHAZZLE_{ENGINE}_URL` (e.g., `UNHAZZLE_POSTGRES_URL` for PostgreSQL)
- Fully editable by user (can change to `DATABASE_URL`, `DB_CONNECTION`, etc.)
- Must be unique (no conflicts with user-defined env vars or other auto-generated vars)
- Format validation: Uppercase letters, numbers, and underscores only

**Multiple services of same type**:
- If user adds second PostgreSQL database named "analytics", default name: `UNHAZZLE_POSTGRES_ANALYTICS_URL`
- Pattern: `UNHAZZLE_{ENGINE}_{USER_PROVIDED_NAME}_URL`
- Example: Main DB → `UNHAZZLE_POSTGRES_MAIN_URL`, Analytics DB → `UNHAZZLE_POSTGRES_ANALYTICS_URL`

**Container: `backend`**

*(Repeat same configuration structure)*

**Port**: 8080 (inferred or default)

**Exposure Settings**:
- **Visibility**: Private (default for backend APIs)
  - **Why**: Backend services typically don't need public exposure; accessed via frontend

**Resource Allocation**:
- **CPU**: 1 core (smart default for backend)
  - **Why**: API/backend services are typically more compute-intensive
- **Memory**: 1GB (smart default for backend)
  - **Why**: Backend services with DB connections need more memory

**Health Check**: *(same options as frontend)*

**Service Access (with editable variable names)**:
- ☑ PostgreSQL Database
  - **Variable name**: `UNHAZZLE_POSTGRES_URL` (editable) ✏️
  - User can customize (e.g., change to `DATABASE_URL` if their framework expects it)
- ☑ Redis Cache
  - **Variable name**: `UNHAZZLE_REDIS_URL` (editable) ✏️
  - User can customize (e.g., change to `REDIS_URL` or `CACHE_URL`)
- ☐ RabbitMQ Queue

**Selected services**: Database + Cache typically needed for backend
  - **Why**: Backend handles business logic and data access

**Environment Variables (inline within container section)**:

**User-defined environment variables** (add/edit inline):
- Key-value pairs specific to this container
- **Add Variable** button to add new entries
- Example for frontend:
  - `NEXT_PUBLIC_API_URL` = `https://api.acme.com`
  - `STRIPE_PUBLIC_KEY` = `pk_live_...`
- Example for backend:
  - `STRIPE_SECRET_KEY` = `sk_live_...`
  - `JWT_SECRET` = `...`
- **Why**: Each container has isolated environment scope

**Auto-generated service variables** (read-only, shown below user-defined vars):
- Automatically populated based on Service Access checkboxes above
- Variable names were customized in Service Access section
- Connection strings auto-generated with project-specific DNS
- Examples:
  - `UNHAZZLE_POSTGRES_URL` = `postgresql://user:pass@postgres.my-project:5432/mydb`
  - `UNHAZZLE_REDIS_URL` = `redis://cache.my-project:6379`
- **Why**: Show users exactly what will be injected at runtime

**Connection String Format**:
```
{CUSTOM_VAR_NAME}={protocol}://{credentials}@{host}:{port}/{database}
```

**Default naming convention**:
- Single service: `UNHAZZLE_{ENGINE}_URL` (e.g., `UNHAZZLE_POSTGRES_URL`)
- Multiple services of same type: `UNHAZZLE_{ENGINE}_{USER_NAME}_URL` (e.g., `UNHAZZLE_POSTGRES_MAIN_URL`, `UNHAZZLE_POSTGRES_ANALYTICS_URL`)

**Note for users**: 
> ℹ️ Auto-generated variables use your service credentials configured earlier. Variable names can be customized in the Service Access section above.

**Overall Step Why**: Provide granular per-container configuration while maintaining smart defaults that reflect real-world architectural patterns. Allow users to control exactly which services each container can access. Environment variables are configured inline within each container's section for clarity and isolation.

---

### Step 3: Review & Deploy
**Page: Review & Pricing (Multi-Container View)**

**Show container architecture diagram**:
```
┌─────────────────────────────────────────────┐
│ Project: my-ecommerce-shop                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │  Frontend    │─────▶│   Backend    │   │
│  │  (Public)    │      │  (Private)   │   │
│  │  :3000       │      │  :8080       │   │
│  └──────────────┘      └───────┬──────┘   │
│                                 │          │
│                        ┌────────▼──────┐   │
│                        │   PostgreSQL  │   │
│                        │   Redis       │   │
│                        └───────────────┘   │
└─────────────────────────────────────────────┘
```

**Container Details Summary**:

**Frontend**:
- Image: `ghcr.io/acme/shop-frontend:v2.1.0`
- Resources: 0.5 CPU, 512MB RAM, 2-10 replicas
- Exposure: Public via `shop.acme.com`
- Service Access: None
- Internal DNS: `frontend.my-ecommerce-shop`

**Backend**:
- Image: `ghcr.io/acme/shop-backend:v2.1.0`
- Resources: 1 CPU, 1GB RAM, 2-10 replicas
- Exposure: Private (internal only)
- Service Access: PostgreSQL, Redis
- Internal DNS: `backend.my-ecommerce-shop`

**Cost Breakdown (updated)**:
- Frontend (2-10 replicas, 0.5 CPU, 512MB): €22/month
- Backend (2-10 replicas, 1 CPU, 1GB): €45/month
- PostgreSQL (20GB, HA): €65/month
- Redis (512MB): €15/month
- Load Balancer + SSL: €12/month
- Bandwidth (estimated): €10/month

**Total: €169/month**

**Inter-Container Communication**:
- Frontend can call Backend via: `http://backend.my-ecommerce-shop:8080`
  - **Why**: Show users exact DNS names for service-to-service calls
- Backend can access PostgreSQL via auto-injected `UNHAZZLE_POSTGRES_URL`
- Backend can access Redis via auto-injected `UNHAZZLE_REDIS_URL`

**Action**: Click "Deploy Project"

**Overall Step Why**: Provide clear visualization of multi-container architecture and communication patterns, building confidence that the platform understands their architecture and has configured it correctly.

---

### Step 4: Deployment Progress
**Page: Deploying... (Multi-Container Progress)**

**Show sequential progress per container**:

**Frontend**:
- ✅ Pulling image from `ghcr.io`
- ✅ Configuring DNS: `frontend.my-ecommerce-shop`
- ✅ Configuring public domain: `shop.acme.com`
- ✅ Generating SSL certificate
- ✅ Starting container (2 replicas)
- ✅ Health checks passing on port 3000

**Backend**:
- ✅ Pulling image from `ghcr.io`
- ✅ Configuring DNS: `backend.my-ecommerce-shop`
- ✅ Injecting service credentials (PostgreSQL, Redis)
- ✅ Starting container (2 replicas)
- ✅ Health checks passing on port 8080

**Services**:
- ✅ PostgreSQL ready at `postgres.my-ecommerce-shop:5432`
- ✅ Redis ready at `cache.my-ecommerce-shop:6379`

**Overall progress**: 100%

**Overall Step Why**: Show that each container is being deployed independently with its specific configuration, building trust that the multi-container architecture is being correctly provisioned.

---

### Step 5: Dashboard (Multi-Container View)
**Page: Live Dashboard (Enhanced)**

**Project Overview**:
- **Project Name**: my-ecommerce-shop
- **Status**: Running
- **Containers**: 2 active

**Container Cards** (one per container):

**Card: Frontend**
- **Status**: Running (2/2 replicas healthy)
- **URL**: `https://shop.acme.com` (clickable)
- **Internal DNS**: `frontend.my-ecommerce-shop:3000`
- **Resources**: 0.5 CPU, 512MB RAM per replica
- **Actions**: View Logs | View Metrics | Settings

**Card: Backend**
- **Status**: Running (2/2 replicas healthy)
- **Exposure**: Private (internal only)
- **Internal DNS**: `backend.my-ecommerce-shop:8080`
- **Service Connections**: PostgreSQL ✓ | Redis ✓
- **Resources**: 1 CPU, 1GB RAM per replica
- **Actions**: View Logs | View Metrics | Settings

**Tab 1: Overview (Project-level)**
- Total request rate (req/sec) across all containers
- Average response time (p50, p95, p99)
- Error rate % by container
- Active connections by container

**Tab 2: Logs (Multi-Container)**
- **Filter by container**: Dropdown (All | Frontend | Backend)
- Live tail with container name prefix:
  - `[frontend]` Log line from frontend container
  - `[backend]` Log line from backend container
- **Why**: Single view for debugging multi-service issues

**Tab 3: Metrics (Per-Container)**
- CPU/Memory usage per container
- Request rate per container
- Database connections (Backend only)
- Cache hit rate (Backend only)
- **Why**: Independent resource monitoring per container

**Tab 4: Events (Project-level)**
- "Frontend scaled from 2→5 replicas at 18:23 (traffic spike)"
- "Backend health check failed on 1 replica at 14:15 (auto-recovered)"
- "SSL certificate renewed for shop.acme.com at 02:15"
- **Why**: Track all container lifecycle events in one timeline

**Tab 5: Settings (Per-Container Editable)**

**Frontend Settings**:
- Update environment variables
- Adjust CPU/RAM allocation
- Change replica min/max
- Update health check configuration
- **Service Access**: Add/remove service connections
  - Current: None
  - Available: PostgreSQL, Redis, RabbitMQ
- Manual deployment trigger

**Backend Settings**:
- *(Same options as Frontend)*
- **Service Access**: 
  - Current: PostgreSQL ✓, Redis ✓
  - Available: RabbitMQ

**Overall Step Why**: Provide unified project-level monitoring while maintaining per-container configuration and observability. Enable users to manage multi-container deployments without complexity.

---

## Technical Implementation Notes

### DNS Resolution
- Internal DNS pattern: `{container-name}.{project-name}.svc.cluster.local`
- Simplified user-facing format: `{container-name}.{project-name}`
- All containers within project can resolve each other via DNS

### Service Discovery
- Automatic DNS records created for each container
- Load balanced across all healthy replicas
- Health check integration: unhealthy replicas removed from DNS

### Network Policies
- Default: All containers within project can communicate
- Outbound internet access enabled by default
- Future: Fine-grained network policies between containers

### Environment Variable Injection
- Service URLs injected at container runtime
- Format: `UNHAZZLE_{SERVICE}_URL` connection string
- Changes require container restart (handled automatically)

### Health Checks
- Per-container health check configuration
- Project health: ALL required containers must be healthy
- Optional containers (future): Can be marked as non-blocking

### Cost Calculation
- Per-container resource pricing
- Shared service costs (database, cache, queue)
- Load balancer cost amortized across public containers

---

## User Education

**Documentation needed**:
1. Multi-container architecture best practices
2. Internal DNS naming and service discovery guide
3. Service access patterns (which containers should access what)
4. Environment variable injection reference
5. Container-to-container communication examples

**In-app guidance**:
- Tooltip on "Add Another Container": "Deploy multiple services (frontend + backend) in one project"
- Warning when granting frontend database access: "⚠️ Typically, frontends shouldn't access databases directly. Consider using your backend API instead."
- Example project templates: "E-commerce (Frontend + Backend + DB)"

---

## Success Metrics

- % of projects using multi-container deployments
- Average containers per project
- Most common container combinations (frontend+backend, app+worker, etc.)
- Reduction in support tickets related to inter-service communication
- User satisfaction with DNS-based service discovery

---

## Future Enhancements (Not in MVP)

- [ ] YAML-based configuration import
- [ ] Container dependency ordering (deploy backend before frontend)
- [ ] Sidecar pattern support (logging, monitoring sidecars)
- [ ] Fine-grained network policies between containers
- [ ] Container health marked as optional (non-blocking)
- [ ] Visual architecture diagram editor
- [ ] Container templates library (common patterns)
- [ ] Multi-container rollback (atomic deployments)
