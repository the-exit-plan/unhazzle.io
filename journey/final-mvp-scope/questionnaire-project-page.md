## Question 1: Traffic Pattern (Critical for HPA)

**Q:** "What's your peak hourly request volume?"

**Options:**

- <1K requests/hour (Internal tool, staging, low traffic)
- 1K-10K req/hour (Early startup, small user base)
- 10K-100K req/hour (Growing startup, active users)
- 100K-1M req/hour (Scale-up, significant traffic)
- 1M req/hour (High scale)

**Why this matters:**

- <1K → 1 replica, no HPA (waste of money)
- 1K-10K → 1-2 replicas, HPA min 1 max 3 (handle 2x spike)
- 10K-100K → 2-5 replicas, HPA min 2 max 10 (handle 3x spike)
- 100K-1M → 5-15 replicas, HPA min 5 max 20
- 1M → Custom setup (talk to them)

**Actual correlation:** Requests/hour directly maps to replica count needed.

---

## Question 2: Request Latency Sensitivity (Critical for Resources)

**Q:** "What's acceptable response time under load?"

**Options:**

- <50ms (Real-time, gaming, high-frequency trading)
- 50-200ms (User-facing API, web apps)
- 200-500ms (Background jobs, async processing)
- 500ms (Batch processing, reports)

**Why this matters:**

**<50ms:**

- Needs: 2-4 CPU, 4-8GB RAM per instance (no resource contention)
- HPA: Aggressive (scale at 50% CPU to maintain headroom)

**50-200ms:**

- Needs: 1-2 CPU, 2-4GB RAM (standard web app)
- HPA: Moderate (scale at 70% CPU)

**200-500ms:**

- Needs: 0.5-1 CPU, 1-2GB RAM (can tolerate some queuing)
- HPA: Conservative (scale at 80% CPU)

**>500ms:**

- Needs: 0.5 CPU, 1GB RAM (batch processing, doesn't need fast response)
- HPA: Very conservative (scale at 85% CPU)

**Actual correlation:** Latency tolerance → CPU/memory sizing + HPA threshold.

---

## Question 3: Workload Type (Critical for Resource Allocation)

**Q:** "What does your app do most?"

**Options:**

- CPU-heavy (Video processing, encryption, computation)
- Memory-heavy (Caching, in-memory processing, large datasets)
- I/O-heavy (Database queries, file uploads, network calls)
- Balanced (Typical web API)

**Why this matters:**

**CPU-heavy:**

- Resource: 4 CPU, 2GB RAM (CPU-bound, less memory)
- HPA metric: CPU-based (scale when CPU >70%)

**Memory-heavy:**

- Resource: 1 CPU, 8GB RAM (memory-bound, less CPU)
- HPA metric: Memory-based (scale when memory >75%)

**I/O-heavy:**

- Resource: 1 CPU, 2GB RAM (waiting on I/O, doesn't need much)
- HPA metric: Request-count-based (scale when req/sec >50)

**Balanced:**

- Resource: 2 CPU, 4GB RAM (standard web app)
- HPA metric: CPU-based (scale when CPU >70%)

**Actual correlation:** Workload type → resource ratio + HPA metric.

---

## Question 4: Startup Time (Critical for HPA Behavior)

**Q:** "How long does your app take to start and be ready?"

**Options:**

- <5 seconds (Go, Rust, compiled apps)
- 5-15 seconds (Node.js, Python, Ruby)
- 15-30 seconds (JVM apps, heavy frameworks)
- 30 seconds (Large ML models, complex initialization)

**Why this matters:**

**<5s:**

- HPA: Aggressive (can scale up/down quickly)
- Startup probe: 10s timeout
- Scale-down cooldown: 2 minutes

**5-15s:**

- HPA: Moderate
- Startup probe: 30s timeout
- Scale-down cooldown: 5 minutes

**15-30s:**

- HPA: Conservative (can't react fast to spikes)
- Startup probe: 60s timeout
- Scale-down cooldown: 10 minutes

**>30s:**

- HPA: Very conservative (keep min replicas high)
- Startup probe: 120s timeout
- Scale-down cooldown: 15 minutes

**Actual correlation:** Startup time → HPA aggressiveness + cooldown periods.

---

## Question 5: Traffic Spikiness (Critical for Min Replicas)

**Q:** "How predictable is your traffic?"

**Options:**

- Steady (same load 24/7)
- Daily pattern (higher during work hours)
- Weekly pattern (higher on weekdays)
- Unpredictable spikes (viral content, marketing campaigns)

**Why this matters:**

**Steady:**

- Min replicas = avg needed (no buffer)
- Max replicas = 2x min (handle small variance)

**Daily pattern:**

- Min replicas = nighttime baseline (1-2)
- Max replicas = 3x min (handle peak hours)

**Weekly pattern:**

- Min replicas = weekend baseline (1-2)
- Max replicas = 5x min (handle weekday peaks)

**Unpredictable spikes:**

- Min replicas = higher baseline (2-3, always ready)
- Max replicas = 10x min (handle viral spikes)

**Actual correlation:** Traffic pattern → min/max replica ratio.

---

## The Formula

**Based on answers, you calculate:**

```
Base replicas = f(traffic_volume, latency_sensitivity)
Resource per replica = f(latency_sensitivity, workload_type)
HPA min = f(traffic_spikiness, startup_time)
HPA max = min * spike_multiplier(traffic_spikiness)
HPA threshold = f(latency_sensitivity)
HPA cooldown = f(startup_time)

```

**Example:**

User answers:

- Traffic: 10K-100K req/hour
- Latency: 50-200ms
- Workload: Balanced
- Startup: 5-15s
- Spikiness: Daily pattern

**Your auto-config:**

- Initial: 2 replicas, 2 CPU 4GB each
- HPA: min 1, max 6, scale at 70% CPU
- Cooldown: 5 min scale-down
- Cost estimate: €99/month (2 replicas) - €297/month (6 replicas max)

---

## What NOT to Ask

❌ "What programming language?" (doesn't tell you resources)

❌ "What industry?" (doesn't affect infra)

❌ "How many users?" (users ≠ traffic)

❌ "What features?" (too vague)

## Bottom Line

**These 5 questions map directly to:**

- Replica count
- CPU/memory sizing
- HPA min/max/threshold
- Cooldown periods

**Anything else is noise.**