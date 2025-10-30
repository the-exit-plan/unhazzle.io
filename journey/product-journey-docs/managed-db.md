# Managed Database Service: Technical Feasibility & Requirements Analysis

**Date:** October 28, 2025  
**Context:** Strategic evaluation of whether to offer managed database services on self-hosted infrastructure (no hyperscaler dependencies)

***

## Executive Summary

Building a production-grade managed database service requires significant engineering investment, specialized expertise, and ongoing operational overhead. This analysis examines the technical requirements, complexity, timeline, and strategic alternatives to inform the decision of whether to pursue this capability.

**Key Findings:**
- **Timeline:** 6-12 months initial build + ongoing maintenance
- **Team Requirements:** 1.5-2 FTE engineers + dedicated DBA expertise
- **Complexity Level:** Very High (significantly more complex than container orchestration)
- **Operational Burden:** 24/7 on-call support required

***

## Core Technical Requirements

### 1. Database Provisioning & Lifecycle Management

**Capabilities needed:**

- Automated provisioning of database instances (PostgreSQL, MySQL, MongoDB)
- Configuration management (memory tuning, connection limits, query optimization)
- Version upgrades (minor and major) without downtime
- Cluster initialization (primary/replica setup, replication configuration)
- Database deletion and resource cleanup

**Complexity:** High  
**Estimated Effort:** 2-3 months

**Technical challenges:**
- Supporting multiple database engines with different configuration paradigms
- Zero-downtime upgrades across major versions
- Handling schema migrations for customer data
- Resource allocation algorithms (CPU, memory, IOPS per database)

**Available tools:**
- Postgres Operator (Zalando)
- CloudNativePG
- Kubegres
- Percona Operators
- KubeDB

***

### 2. High Availability & Replication

**Capabilities needed:**

- Streaming replication (primary → replica synchronization)
- Automatic failover when primary fails
- Split-brain prevention mechanisms
- Read replicas for load distribution
- Connection pooling (PgBouncer for Postgres, ProxySQL for MySQL)
- Health monitoring and failure detection

**Complexity:** Very High  
**Estimated Effort:** 3-4 months

**Technical challenges:**
- Detecting true failures vs network partitions (consensus algorithms)
- Promoting replicas without data loss
- Handling cascading failures (all replicas down)
- Ensuring zero data loss during failover (synchronous replication overhead)
- Replication lag monitoring and alerting
- Automatic DNS/connection string updates post-failover

**Critical scenarios:**

**Primary Failure Recovery:**
```
1. Monitoring detects primary is down (30 sec)
2. Operator verifies it's truly dead, not network blip (30 sec)
3. Select best replica to promote (lowest lag) (10 sec)
4. Promote replica to primary (20 sec)
5. Reconfigure other replicas to follow new primary (30 sec)
6. Update DNS/connection pooler to new primary (10 sec)

Total downtime: ~2 minutes (optimal scenario)
```

**What can go wrong:**
- Split-brain (two primaries writing simultaneously → data corruption)
- Replication lag means data loss
- Cascading failure (replicas also fail)
- Disk full on replica prevents promotion

***

### 3. Backup & Point-in-Time Recovery (PITR)

**Capabilities needed:**

- Automated daily backups (full + incremental)
- WAL (Write-Ahead Log) archiving for Postgres
- Point-in-Time Recovery (restore to any second in last 7-30 days)
- Cross-region backup replication
- Backup encryption (at rest and in transit)
- Backup testing (verify restorability regularly)
- Retention policy management

**Complexity:** High  
**Estimated Effort:** 2-3 months

**Technical challenges:**
- Storage requirements scale with number of databases
- Backup compression and deduplication
- Maintaining backup performance without impacting database
- PITR requires continuous WAL archiving (storage and bandwidth intensive)
- Restore time objectives (RTO) - how fast can you restore?
- Recovery point objectives (RPO) - how much data loss is acceptable?

**Storage infrastructure needed:**
- S3-compatible object storage (MinIO, Ceph, or custom)
- Retention policies (7-30 days typical)
- Geographic distribution for disaster recovery

**Available tools:**
- pgBackRest (Postgres)
- WAL-G (Postgres)
- Percona XtraBackup (MySQL)
- Velero (Kubernetes-native backup)

**Restore scenario:**
```
Customer: "I accidentally dropped a table 3 hours ago. Restore?"

Process:
1. Find backup closest to requested time (5 min)
2. Provision temporary database instance (10 min)
3. Restore full backup (20 min for 50GB database)
4. Replay WAL logs to exact timestamp (30 min)
5. Export specific table data (10 min)
6. Customer imports into their database (their time)

Total: 75+ minutes
```

***

### 4. Monitoring & Alerting

**Capabilities needed:**

**Database-specific metrics:**
- Query performance (slow queries, locks, deadlocks)
- Connection counts and pool saturation
- Replication lag (seconds behind primary)
- Transaction rate and throughput
- Cache hit ratio
- Disk I/O and storage usage
- CPU and memory per database instance
- Database-specific metrics (buffer pool usage, checkpoint frequency)

**Alerting conditions:**
- Primary failure
- Replication lag exceeds threshold
- Disk space < 10% remaining
- Connection pool exhaustion
- Long-running transactions (potential locks)
- Backup failures
- CPU/memory saturation
- Unusual query patterns (possible security issue)

**Complexity:** Medium-High  
**Estimated Effort:** 1-2 months

**Technical stack:**
- Prometheus + database exporters (postgres_exporter, mysqld_exporter)
- Grafana dashboards for visualization
- AlertManager for notification routing
- Custom monitoring agents for database-specific metrics

**Performance emergency scenario:**
```
Customer: "Database is slow, all queries timing out!"

Investigation:
1. Check monitoring dashboards (5 min)
2. Log into database to inspect active queries (10 min)
3. Identify long-running transaction blocking others (15 min)
4. Kill blocking transaction (1 min)
5. Explain to customer what happened (10 min)
6. Recommend adding indexes (ongoing)

Requires: On-call DBA expertise 24/7
```

***

### 5. Security & Compliance

**Capabilities needed:**

- Encryption at rest (disk-level encryption)
- Encryption in transit (TLS for client connections and replication)
- User authentication and role management (RBAC)
- Network isolation (firewall rules, private networking)
- Audit logging (who accessed what data when)
- Secrets management (database passwords, TLS certificates)
- GDPR compliance (data residency, right to deletion)
- PCI-DSS compliance (if handling payment data)
- Vulnerability scanning and patching
- Security incident response procedures

**Complexity:** High  
**Estimated Effort:** 2-3 months

**Compliance requirements:**
- GDPR: Data residency in EU, right to access/deletion, breach notification
- PCI-DSS: Network isolation, encryption, access logging, regular audits
- SOC 2: Security controls, availability, processing integrity
- HIPAA: (if healthcare) PHI encryption, access controls, audit trails

**Security hardening checklist:**
- CIS benchmark compliance for database configuration
- Network segmentation between tenants
- Principle of least privilege for database users
- Regular security updates and patches
- Penetration testing and vulnerability assessments
- Incident response runbooks

***

### 6. Storage Management

**Capabilities needed:**

- Persistent volumes (StatefulSets in Kubernetes)
- Dynamic volume provisioning
- Volume snapshots for backups
- Storage classes (SSD for databases, HDD for backups)
- Volume expansion (resize without downtime)
- IOPS guarantees (consistent performance)
- Storage encryption
- Multi-tenancy isolation (prevent noisy neighbors)

**Complexity:** Medium  
**Estimated Effort:** 1 month

**Critical considerations:**
- Databases are **I/O intensive** - require fast storage (NVMe SSDs)
- Storage is expensive and scales linearly with customer count
- Need to prevent one database from saturating disk I/O
- Volume snapshots must be consistent (requires coordination with database)
- Storage failure = data loss if not properly replicated

**Infrastructure costs (per database):**
- 50GB SSD storage: ~€10/month
- Backup storage (200GB retention): ~€5/month
- Storage scales with customer count and data growth

***

### 7. Performance Tuning

**Capabilities needed:**

- Auto-tuning of database parameters based on workload
- Query performance insights (slow query logs, explain plans)
- Index recommendations
- Connection pooling configuration
- Cache tuning (shared_buffers, innodb_buffer_pool)
- Workload analysis (OLTP vs OLAP)
- Resource allocation optimization

**Complexity:** Very High (requires deep database expertise)  
**Estimated Effort:** Ongoing (never "done")

**Why this is hard:**
- Each database engine has hundreds of tunable parameters
- Optimal settings vary by workload type
- Requires continuous monitoring and adjustment
- Bad configuration can cause catastrophic failures
- Customers expect optimal performance without manual tuning

**Requires:**
- Experienced DBAs who understand query planners
- Automated query analysis tools
- Machine learning for workload pattern detection
- Customer education on query optimization

***

### 8. Multi-Tenancy & Resource Isolation

**Capabilities needed:**

- Resource limits per database (CPU, memory, IOPS)
- Network isolation between tenants
- Prevent one database from impacting others
- Fair queuing for disk I/O
- Cost tracking per database/customer
- QoS (Quality of Service) tiers

**Complexity:** High  
**Estimated Effort:** 2 months

**Technical challenges:**
- Kubernetes resource quotas and limits
- CPU throttling and memory OOM prevention
- Disk I/O isolation (cgroups, blkio controllers)
- Network bandwidth limits
- Preventing resource starvation

***

### 9. Maintenance Windows & Upgrades

**Capabilities needed:**

- Scheduled maintenance (minor version patches)
- Major version upgrades (Postgres 14 → 15)
- Schema migration support
- Blue-green deployments for zero-downtime upgrades
- Rollback capability if upgrade fails
- Customer notification system

**Complexity:** Very High  
**Estimated Effort:** 2-3 months

**Major version upgrade challenges:**
- PostgreSQL major version upgrades are **not** backward compatible
- Require logical dump/restore or pg_upgrade tool
- Downtime required (unless using logical replication)
- Extension compatibility issues
- Customer application may break with new version

***

### 10. Operational Support (24/7)

**What you need:**

- On-call rotation for database emergencies
- Runbooks for common failure scenarios
- Incident response procedures
- Database expertise (DBA knowledge)
- Customer support for connection issues, performance problems
- SLA tracking and reporting

**Complexity:** Organizational challenge  
**Estimated Effort:** Ongoing (requires dedicated team)

**Common incidents requiring immediate response:**
- Database down (primary failure)
- Replication stopped
- Disk full (causes database crash)
- Connection exhaustion
- Performance degradation
- Data corruption
- Accidental data deletion
- Security breach

**Each incident requires:**
- Fast diagnosis (5-30 min)
- Root cause analysis
- Fix implementation
- Customer communication
- Post-mortem documentation

***

## Total Engineering Effort Estimate

| Component | Initial Build | Ongoing Maintenance |
|-----------|--------------|---------------------|
| Provisioning & lifecycle | 3 months | 20% of 1 engineer |
| HA & replication | 4 months | 30% of 1 engineer |
| Backup & PITR | 3 months | 10% of 1 engineer |
| Monitoring & alerting | 2 months | 15% of 1 engineer |
| Security & compliance | 3 months | 10% of 1 engineer |
| Storage management | 1 month | 5% of 1 engineer |
| Performance tuning | Ongoing | 20% of 1 engineer |
| Multi-tenancy | 2 months | 10% of 1 engineer |
| Upgrades & maintenance | 3 months | 20% of 1 engineer |
| Operational support | N/A | **1+ full-time DBA** |
| **Total** | **6-12 months** | **1.5-2 FTE engineers** |

***

## Technical Architecture Overview

### Infrastructure Stack

```
┌─────────────────────────────────────────────┐
│  Customer Application (container)           │
└──────────────────┬──────────────────────────┘
                   │ DATABASE_URL
                   ↓
┌─────────────────────────────────────────────┐
│  Connection Pooler (PgBouncer/ProxySQL)     │
│  - Connection multiplexing                  │
│  - Load balancing                           │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Primary Database Instance                  │
│  - StatefulSet pod                          │
│  - Persistent volume (NVMe SSD)             │
│  - Streaming replication enabled            │
└──────────────────┬──────────────────────────┘
                   │ Replication stream
                   ↓
┌─────────────────────────────────────────────┐
│  Replica Database Instance(s)               │
│  - Read-only queries                        │
│  - Automatic promotion on primary failure   │
│  - Replication lag monitoring               │
└──────────────────┬──────────────────────────┘
                   │ WAL archiving
                   ↓
┌─────────────────────────────────────────────┐
│  Backup Storage (S3-compatible)             │
│  - Full backups (daily)                     │
│  - WAL segments (continuous)                │
│  - 7-30 day retention                       │
│  - Point-in-time recovery capability        │
└─────────────────────────────────────────────┘
```

### Control Plane Components

You need to build:

1. **Database Operator** (Kubernetes custom controller)
   - Watches for DatabaseCluster custom resources
   - Provisions StatefulSets, Services, PVCs
   - Manages lifecycle (create, update, delete, upgrade)

2. **Backup Controller**
   - Scheduled backups via CronJobs
   - WAL archiving automation
   - PITR restore orchestration

3. **Monitoring Agent**
   - Collects database-specific metrics
   - Exports to Prometheus
   - Custom health checks

4. **Provisioning API**
   - REST/gRPC API for database operations
   - Authentication and authorization
   - Rate limiting and quotas

5. **Admin Dashboard**
   - For operations team troubleshooting
   - Database metrics visualization
   - Incident management interface

***

## Infrastructure Cost Considerations

### Per Database Cluster

**Compute:**
- Primary instance: 2 CPU, 4GB RAM
- Replica instance: 2 CPU, 4GB RAM
- Connection pooler: 0.5 CPU, 512MB RAM

**Storage:**
- Database storage: 50GB NVMe SSD
- Backup storage: 200GB (4x database size with retention)

**Network:**
- Replication traffic between primary/replica
- WAL archiving to backup storage
- Customer connection traffic

**Total resource footprint per database cluster:**
- 4.5 CPU cores
- 8.5GB RAM
- 250GB storage (50GB SSD + 200GB backup)
- Network bandwidth

***

## Real-World Complexity Examples

### Scenario 1: Primary Database Failure

**Sequence of events:**
```
1. Monitoring detects primary is down (30 sec)
   - No response to health checks
   - Replication stream stopped

2. Operator verifies it's truly dead, not network partition (30 sec)
   - Attempts reconnection
   - Queries other replicas for consensus

3. Select best replica to promote (lowest lag) (10 sec)
   - Check replication lag on all replicas
   - Choose replica with most recent data

4. Promote replica to primary (20 sec)
   - Execute promotion command
   - Replica becomes read-write

5. Reconfigure other replicas to follow new primary (30 sec)
   - Update replication configuration
   - Restart replication streams

6. Update DNS/connection pooler to new primary (10 sec)
   - Update service endpoints
   - Drain connections to old primary

7. Notify customer of failover event
   - Email/webhook notification
   - Include incident details

Total downtime: ~2 minutes (optimal case)
```

**What can go wrong:**
- **Split-brain:** Two primaries accept writes simultaneously → data conflicts
- **Replication lag:** Newly promoted primary is 5 minutes behind → data loss
- **Cascading failure:** All replicas fail too → complete outage
- **Disk full on replica:** Cannot promote because disk space exhausted
- **Network partition:** Can't reach replicas to coordinate failover

### Scenario 2: Customer Requests Data Restore

**Customer scenario:**
"I accidentally dropped the `orders` table at 3:15 PM today. Can you restore it?"

**Your recovery process:**
```
1. Identify the exact timestamp (15:15:00)

2. Find the appropriate backup
   - Last full backup: 02:00 AM today
   - Need WAL logs from 02:00 to 15:15

3. Provision temporary database instance (10 min)
   - Create new StatefulSet
   - Allocate storage

4. Restore full backup to temporary instance (20 min for 50GB)
   - Download from backup storage
   - Restore using pg_restore

5. Replay WAL logs to exact timestamp (30 min)
   - Download WAL segments
   - Apply logs until 15:15:00

6. Export the dropped table (10 min)
   - pg_dump specific table
   - Compress and upload

7. Provide dump file to customer
   - Customer imports using psql

8. Clean up temporary instance

Total time: 75+ minutes
```

**Complexity factors:**
- Large databases take hours to restore
- WAL replay can be slow (depends on write volume)
- Point-in-time accuracy depends on WAL archiving frequency
- Need temporary compute resources (cost)

### Scenario 3: Performance Degradation

**Customer report:**
"Our database is suddenly very slow. All queries are taking 10x longer."

**Investigation process:**
```
1. Check monitoring dashboards (5 min)
   - CPU, memory, disk I/O
   - Query latency metrics
   - Connection count

2. Log into database directly (10 min)
   - Check active queries (pg_stat_activity)
   - Check for locks (pg_locks)
   - Check table bloat

3. Identify root cause (15 min)
   - Found: One query doing full table scan
   - Missing index on frequently joined column
   - Query holding lock, blocking all others

4. Immediate remediation (1 min)
   - Kill the blocking query
   - Performance returns to normal

5. Long-term fix (ongoing)
   - Work with customer to add proper index
   - Analyze query patterns
   - Recommend schema changes

Total resolution time: 30+ minutes
```

**Why this requires DBA expertise:**
- Understanding query execution plans
- Recognizing lock contention patterns
- Knowing when to kill vs wait for queries
- Index design recommendations
- Schema optimization knowledge

***

## Alternative Approaches

### Option 1: Use Kubernetes Operators

**Approach:** Leverage existing open-source operators instead of building from scratch.

**Recommended operators:**
- **CloudNativePG** (Postgres) - Modern, actively maintained
- **Zalando Postgres Operator** - Production-proven, used by Zalando
- **Percona Operators** - MySQL, MongoDB support
- **KubeDB** - Multi-database support

**Pros:**
- Significant head start (6+ months of development)
- Battle-tested in production environments
- Active community support
- Regular security updates

**Cons:**
- Still need to operate and troubleshoot
- Limited customization options
- Operator bugs become your problems
- Need deep understanding to debug issues
- Still requires 24/7 operational support

**What you still build:**
- Customer-facing provisioning API
- Billing integration
- Multi-tenancy isolation
- Monitoring and alerting
- Backup management UI
- Support infrastructure

**Effort reduction:** ~50% (3-6 months instead of 6-12 months)

***

### Option 2: "Bring Your Own Database" (BYOD)

**Approach:** Don't offer managed databases. Let users connect external databases.

**Implementation:**
```yaml
# User provides their own DATABASE_URL
env:
  DATABASE_URL: postgres://user:pass@external-db.com:5432/mydb
```

**Customer options:**
- Use existing database provider (Supabase, PlanetScale, Aiven)
- Use their company's database infrastructure
- Provision from their cloud provider (if they have one)

**What Unhazzle provides:**
- Easy environment variable injection
- Connection validation
- Documentation on database providers
- Best practices guides
- Connection pooling recommendations

**Pros:**
- **Zero infrastructure burden** for Unhazzle
- Customer uses their preferred provider
- Focus on core competency (container orchestration)
- No 24/7 on-call for database issues
- No database expertise required
- Faster time to market

**Cons:**
- Less integrated experience
- Customer manages two platforms
- No single pane of glass
- Potential connection/networking issues
- Can't optimize database for workload

**Recommended documentation to provide:**
- "How to use Supabase with Unhazzle"
- "How to use PlanetScale with Unhazzle"  
- "How to connect to external PostgreSQL"
- "Database security best practices"
- "Connection pooling setup guide"

***

### Option 3: Partner with Database-as-a-Service Providers

**Approach:** Integrate with existing database providers through partnerships.

**Potential partners:**
- **Supabase** - Postgres with real-time features
- **PlanetScale** - MySQL with branching
- **MongoDB Atlas** - Managed MongoDB
- **Aiven** - Multi-database provider
- **Neon** - Serverless Postgres
- **CockroachDB Cloud** - Distributed SQL

**Implementation options:**

**A. Referral Partnership**
- "Add Database" button links to partner signup
- Partner tracks referrals, pays commission
- Minimal integration work

**B. API Integration**
- Provision databases via partner API
- Show database status in Unhazzle dashboard
- Unified billing (optional)

**C. Embedded Partner UI**
- iframe partner's provisioning flow
- Seamless experience
- Auto-inject connection strings

**Revenue model:**
- Commission on customer spend (10-20% typical)
- Referral fees (one-time or recurring)
- Marketplace fee for tighter integrations

**Pros:**
- Zero operational burden
- Partner handles all database complexity
- Customers get best-in-class database service
- Revenue share opportunity
- Fast time to market (days, not months)

**Cons:**
- Dependency on external provider
- Less control over customer experience
- Revenue split instead of full margin
- Partner's limitations become yours

***

## Strategic Decision Framework

### When to Build Managed Databases

**Build if ALL of these are true:**

1. **Market Demand**
   - 50+ customers explicitly requesting managed databases
   - Willingness to pay significant premium
   - Clear differentiation from existing providers

2. **Team Capability**
   - Can hire 2+ experienced DBAs
   - Have 6-12 months of runway for development
   - Team has database operations expertise

3. **Operational Readiness**
   - 24/7 on-call coverage established
   - Incident response procedures defined
   - Monitoring and alerting infrastructure ready

4. **Strategic Fit**
   - Database service is core to long-term strategy
   - Willing to become a database company
   - Competitive advantage from controlling full stack

### When NOT to Build Managed Databases

**Don't build if ANY of these are true:**

1. **Early Stage**
   - Pre-product-market fit
   - Limited engineering resources
   - Need to focus on core differentiator

2. **Lack of Expertise**
   - No database operations experience on team
   - Can't hire experienced DBAs
   - Learning curve too steep

3. **Better Alternatives Exist**
   - Existing providers offer better service
   - Partnership/integration is faster
   - Customer doesn't care who provides database

4. **Resource Constraints**
   - Can't commit 1.5-2 FTE for ongoing operations
   - Can't provide 24/7 support
   - Limited runway (< 12 months)

***

## Recommendation

### Phase 1: Validation Phase (Current)

**Action:** Support "Bring Your Own Database" only

**Implementation:**
- Discovery question: "Do you need a database?"
  - No
  - Yes, I have an external database (provide DATABASE_URL)
  - Yes, I need help setting one up → Link to setup guide

**Provide documentation:**
- Integration guides for popular database providers
- Connection security best practices
- Performance optimization tips
- Troubleshooting connection issues

**Value proposition:**
- Easy environment variable management
- Secure secrets handling
- Connection validation
- No database operational burden

**Timeline:** Implement in current sprint

***

### Phase 2: Market Validation (6-12 months)

**Action:** Test database demand and identify friction points

**Gather **
- How many customers ask for managed databases?
- What providers do they currently use?
- What problems do they face with BYOD?
- Willingness to pay for integrated database?

**Experiment with partnerships:**
- Reach out to Supabase, Aiven, or Neon
- Test referral integration
- Measure conversion rates
- Collect customer feedback

**Decision point:** If 30%+ of customers want integrated databases, proceed to Phase 3.

***

### Phase 3: Partnership Integration (12-18 months)

**Action:** Build formal integration with database provider

**Implementation options:**

**Option A: Referral Partnership (2-4 weeks)**
- Add "Provision Database" button
- Redirect to partner signup with tracking
- Partner auto-fills connection string back
- Commission on customer spend

**Option B: API Integration (2-3 months)**
- Provision databases via partner API
- Display database status in dashboard
- Manage databases from Unhazzle UI
- Unified billing (optional)

**Benefits:**
- Integrated experience for customers
- Revenue share opportunity
- Zero operational burden
- Focus on core platform

***

### Phase 4: Evaluate Self-Hosted (18+ months)

**Only proceed if:**
- 200+ customers with databases
- Strong demand for self-hosted option
- Team has grown to 10+ engineers
- Can hire dedicated database team (3+ engineers)
- 24/7 operations established
- Clear competitive advantage from owning database layer

**Decision criteria:**
- Total Addressable Market analysis
- Build vs partner economics
- Competitive landscape assessment
- Technical feasibility with current infrastructure
- Risk assessment

***

## Conclusion

**Building managed databases is feasible but resource-intensive:**

**Technical Complexity:** Very High
- Requires 6-12 months initial development
- Ongoing maintenance: 1.5-2 FTE engineers
- 24/7 operational support mandatory
- Deep database expertise required

**Operational Requirements:**
- Experienced DBAs on staff
- Incident response procedures
- Customer support infrastructure
- Comprehensive monitoring and alerting
- Disaster recovery capabilities

**Strategic Considerations:**
- Database operations is a different business than container orchestration
- Existing providers (Supabase, Aiven, PlanetScale) have years of head start
- Distraction from core value proposition
- Significant operational risk (data loss = reputational damage)

**Recommended Approach:**
1. **Now:** Support BYOD with excellent documentation
2. **6-12 months:** Validate demand, test partnerships
3. **12-18 months:** Build partner integrations if demand exists
4. **18+ months:** Evaluate self-hosted only if strategic necessity

**Focus on core strength:** Make container deployment effortless. Let database specialists handle databases.

The most successful platforms excel at one thing (Vercel = frontend, Railway = containers, Supabase = Postgres) rather than being mediocre at everything. Choose to be great at container orchestration.

Sources
[1] What are managed database services and 7 key capabilities https://www.instaclustr.com/education/data-architecture/what-are-managed-database-services-and-7-key-capabilities/
[2] Managed Database Services https://www.optimadata.nl/en/database-management/database-managed-services/
[3] What is a Managed Database Service? https://cloud.google.com/discover/what-is-managed-database-service
[4] Managed Cloud Database Guide | Performance & Cost https://aerospike.com/blog/managed-cloud-database-guide
[5] DIY DBaaS: A guide to building your own full-featured DBaaS https://severalnines.com/resources/whitepapers/diy-dbaas-a-guide-to-building-your-own-full-featured-dbaas/
[6] Building A Managed Database Service Platform within A ... https://www.infosys.com/services/cloud-cobalt/insights/documents/private-cloud-environment.pdf
[7] Managed Databases | DigitalOcean Documentation https://docs.digitalocean.com/products/databases/
[8] What is Azure SQL Managed Instance? https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/sql-managed-instance-paas-overview?view=azuresql
[9] What is a Managed Database? https://www.enterprisedb.com/blog/databases/what-is-a-managed-database
[10] What Is a Managed Database? https://www.oracle.com/sa/autonomous-database/what-is-managed-database/
