# Claude Development Guide for Unhazzle.io Prototype

## Overview

This guide provides instructions for implementing features in the Unhazzle.io prototype application. The prototype is a **spec-driven, demo mode application** designed to validate UX flows and gather user feedback before building production infrastructure.

**Important**: This is **not** a production application. It's an interactive mockup with pre-filled data and simulated responses to test the deployment experience without real infrastructure.

## Project Context

**Unhazzle.io** is an Infrastructure-as-a-Service platform that simplifies cloud infrastructure management. The mission is to remove complexity from infrastructure administration while maintaining professional-grade capabilities.

**Prototype Goal**: Validate deployment flows, resource configuration UX, and pricing transparency with real users before building actual Kubernetes automation.

## Technology Stack

### Prototype App (`/prototype-app`)
- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API (DeploymentContext)
- **Runtime**: React 19.1.0
- **Build Tool**: Turbopack (integrated via Next.js `--turbopack` flag)

### Scripts
```bash
npm run dev    # Development server (port 3000)
npm run build  # Production build
npm start      # Production server
```

## Core Principles

### 1. Spec-Driven Development
- **All features are specified** in `/journey/product-journey-docs/` and `/journey/feedback-docs/first-round/features-spec/`
- **Read specs before coding**: Understand the UX flow, validation rules, and business logic
- **Follow specs precisely**: They define the expected behavior based on user research
- **Reference the glossary**: `/journey/GLOSSARY.md` defines standard terminology

### 2. Lightweight Implementation (No TDD)
- **No test infrastructure required**: Focus on rapid iteration for user testing
- **Manual verification**: Test features by running the app and clicking through flows
- **Type safety**: Use TypeScript to catch errors at compile time
- **Build validation**: Run `npm run build` to ensure no TypeScript errors

### 3. Demo Mode Philosophy
- **Pre-filled data**: Default values should reflect realistic use cases (e.g., e-commerce app)
- **Simulated responses**: Deployment shows realistic progress with delays, but no actual infrastructure
- **Interactive but guided**: Users can edit values, but outcomes are predetermined
- **Transparent**: Use demo mode banner where appropriate to set expectations

### 4. User-Centered Design
- **Minimize cognitive load**: Show only what's needed at each step
- **Smart defaults**: Pre-populate based on questionnaire answers
- **Progressive disclosure**: Complex settings are optional and hidden initially
- **Transparency**: Always show cost impact and explain consequences

## Development Workflow

### Before Starting a Feature

1. **Read the specification**:
   - Check `/journey/feedback-docs/first-round/features-spec/{feature-name}.md`
   - Check `/journey/feedback-docs/first-round/feedback-summary.md` for priority
   - Review related specs in "Related Items" section

2. **Understand the user flow**:
   - Review `/journey/product-journey-docs/flow.md` for overall journey
   - Identify where your feature fits in the flow
   - Note dependencies on other features

3. **Check the glossary**:
   - Use correct terminology from `/journey/GLOSSARY.md`
   - Follow subject-first command structure (e.g., `application deploy`)
   - Use singular forms (e.g., `application`, not `applications`)

### During Implementation

1. **Follow existing patterns**:
   - Study similar components in the codebase
   - Use consistent file structure and naming
   - Match existing UI components and styling

2. **Use smart defaults**:
   - Pre-fill forms with realistic example data
   - Base defaults on questionnaire answers (stored in DeploymentContext)
   - Allow editing but guide users toward best practices

3. **Maintain type safety**:
   - Define TypeScript interfaces for all data structures
   - Use strict TypeScript compilation
   - Avoid `any` types except when absolutely necessary

4. **Keep it simple**:
   - This is a prototype, not production code
   - Prefer straightforward implementations over clever abstractions
   - Use inline styles sparingly; prefer Tailwind utilities

### After Implementation

1. **Manual testing**:
   - Run `npm run dev` and test the complete user flow
   - Test with different data inputs
   - Verify responsive design (mobile, tablet, desktop)
   - Check for TypeScript errors with `npm run build`

2. **Verify against spec**:
   - Compare implementation to specification
   - Ensure all acceptance criteria are met
   - Check that error states are handled

3. **Cost calculation accuracy**:
   - If feature affects pricing, verify cost calculations
   - Ensure cost breakdowns are transparent
   - Test edge cases (min/max values)

## Feature Priority Levels (from Feedback)

### MVP (Must implement for first launch)
These features are critical for the prototype to be useful for testing:

- **View current deployment config** (✅ DONE)
- **Multi-container support** (✅ COMPLETE Phase 2)
- **Edit selections on pricing page**
- **Volume/stateful storage**
- **Fix deploying page generic logs** (avoid brand names, use generic terms)
- **Editable auto-generated env var names** (UNHAZZLE_ prefix customization)
- **Team permissions & RBAC**
- **NoSQL database support** (MongoDB, etc.)
- **Message queue service** (RabbitMQ, Kafka)
- **In-memory cache service** (Redis, Valkey)
- **FaaS/Serverless functions**
- **Managed vs. self-managed services** (clear option presentation)
- **Infrastructure alerting**
- **Cost alerts**
- **Third-party monitoring integration** (Datadog, Prometheus, etc.)
- **Monitoring stack template** (pre-configured Grafana LGTM, ELK)
- **Show max cost on scale-up**
- **IP whitelist**

### Must-Have (ASAP after launch)
Important but can be added shortly after MVP:

- **Shorten CLI binary name**
- **Interactive CLI mode**
- **In-terminal help/guidance**
- **Better GH Actions setup docs**
- **Configuration guardrails** (prevent junior devs from over-provisioning)
- **Better documentation/examples**
- **Risk disclosure** (communicate risks with choices)
- **Migration tools** (from existing platforms)
- **EU compliance framework** (GDPR, etc.)
- **SLA and DPA documentation**
- Multiple cost governance features (see feedback-summary.md)

### Bugs (Fix immediately)
- **Cache selection mismatch** (selected Memcached but shows Redis in logs - use generic terms in logs)

## Key Specifications Reference

### Core Flow Specs
- **Overall user flow**: `/journey/product-journey-docs/flow.md`
- **Prototype strategy**: `/journey/product-journey-docs/prototype.md`
- **Glossary**: `/journey/GLOSSARY.md`

### Feature Specs (Priority Order)
1. **View current deployment config**: `/journey/feedback-docs/first-round/features-spec/view-current-deployment-config.md`
2. **Multi-container support**: `/journey/feedback-docs/first-round/features-spec/multi-container-support.md`
3. **Review page simplification**: `/journey/feedback-docs/first-round/features-spec/review-page-simplification.md`
4. **Volume/stateful storage**: `/journey/feedback-docs/first-round/features-spec/volume-stateful-storage.md`
5. **Edit selections on pricing page**: `/journey/feedback-docs/first-round/features-spec/edit-selections-on-pricing-page.md`
6. **Fix deploying page generic logs**: `/journey/feedback-docs/first-round/features-spec/fix-deploying-page-generic-logs.md`
7. **Dashboard architecture view**: `/journey/feedback-docs/first-round/features-spec/dashboard-architecture-view.md`
8. **Remove domain configuration**: `/journey/feedback-docs/first-round/features-spec/remove-domain-configuration.md`
9. **Remove environment page**: `/journey/feedback-docs/first-round/features-spec/remove-environment-page.md`

### Feedback Documentation
- **Summary**: `/journey/feedback-docs/first-round/feedback-summary.md`
- **User feedback**: `/journey/feedback-docs/first-round/{user}-friends.md`

## Project Structure

```
/prototype-app/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── questionnaire/page.tsx    # Discovery questions
│   ├── application/page.tsx      # Container image input
│   ├── resources/page.tsx        # Resource configuration
│   ├── review/page.tsx           # Review & pricing
│   ├── deploying/page.tsx        # Deployment progress
│   ├── dashboard/page.tsx        # Live dashboard
│   └── layout.tsx                # Root layout
├── lib/
│   ├── context/                  # React Context providers
│   │   └── DeploymentContext.tsx # Global state management
│   └── utils/                    # Utility functions
│       └── costCalculator.ts     # Pricing logic
├── public/                       # Static assets
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config

/journey/
├── GLOSSARY.md                   # Standard terminology
├── product-journey-docs/         # Product specifications
│   ├── prototype.md              # Demo mode strategy
│   ├── flow.md                   # User flow definition
│   └── ...
└── feedback-docs/                # User testing feedback
    └── first-round/
        ├── feedback-summary.md   # Aggregated feedback
        └── features-spec/        # Detailed feature specs
```

## State Management (DeploymentContext)

The application uses React Context to maintain deployment configuration across pages:

```typescript
interface DeploymentState {
  // Questionnaire answers
  appType: string;              // 'ecommerce' | 'saas' | 'api' | 'content'
  trafficPattern: string;       // 'steady' | 'burst' | 'global' | 'regional'
  needsDatabase: boolean;
  needsCache: boolean;
  
  // Container configuration (supports multiple)
  containers: Container[];
  
  // Service configuration
  database?: DatabaseConfig;
  cache?: CacheConfig;
  queue?: QueueConfig;
  
  // Domain and environment
  customDomain?: string;
  environmentVariables: EnvVar[];
  
  // Cost tracking
  estimatedMonthlyCost: number;
}
```

**Key principles for state management**:
- Use `useDeployment()` hook to access state
- Update state with `updateState()` method
- State persists across page navigation (in-memory only, no localStorage for demo)
- Cost recalculation happens automatically on state changes

## UI/UX Guidelines

### Design System
- **Colors**: Use Tailwind's default palette (blue for primary, slate for neutral)
- **Spacing**: Consistent spacing using Tailwind scale (p-4, p-6, p-8)
- **Typography**: Clear hierarchy with text-sm, text-base, text-lg, text-xl, text-2xl
- **Cards**: Use rounded-xl with shadow-lg for major components
- **Buttons**: Primary actions use gradient backgrounds, secondary use outline

### Component Patterns

#### Form Inputs
```tsx
// Dropdown with smart default
<select className="w-full rounded-lg border border-slate-300 p-2">
  <option value="512">512 MB (Recommended)</option>
  <option value="1024">1 GB</option>
  <option value="2048">2 GB</option>
</select>
```

#### Inline Editing
```tsx
// Editable field with recalculation
<div className="flex justify-between items-center">
  <span className="text-slate-600">CPU</span>
  <select 
    value={cpu} 
    onChange={(e) => {
      updateCPU(e.target.value);
      recalculateCost();
    }}
  >
    {/* options */}
  </select>
</div>
```

#### Cost Display
```tsx
// Transparent cost breakdown
<div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-xl">
  <div className="text-4xl font-bold">€{cost.toFixed(2)}/month</div>
  <div className="text-sm opacity-90 mt-2">
    <div>Application: €{appCost}</div>
    <div>Database: €{dbCost}</div>
    <div>Cache: €{cacheCost}</div>
  </div>
</div>
```

### Responsive Design
- **Mobile-first**: Design for mobile, enhance for desktop
- **Breakpoints**: Use Tailwind responsive prefixes (sm:, md:, lg:, xl:)
- **Touch-friendly**: Buttons and inputs should be at least 44px tall
- **Readable**: Text should be at least 16px on mobile

### Loading States
```tsx
// Show loading during recalculation
<div className={`transition-opacity ${isRecalculating ? 'opacity-50' : 'opacity-100'}`}>
  {/* content */}
</div>
```

### Error Handling
```tsx
// Inline validation errors
{error && (
  <div className="text-red-600 text-sm mt-1">
    {error}
  </div>
)}
```

## Cost Calculation

### Pricing Model
The prototype uses simplified pricing based on Hetzner infrastructure with 30% margin:

```typescript
// Base costs per unit
const CPU_COST_PER_CORE = 15;      // €15/month per CPU core
const MEMORY_COST_PER_GB = 7.50;   // €7.50/month per GB RAM
const STORAGE_COST_PER_GB = 0.044; // €0.044/month per GB storage
const LOAD_BALANCER_COST = 12;     // €12/month
const BANDWIDTH_ESTIMATE = 10;     // €10/month estimated

// Database costs (tiered)
const POSTGRES_BASE = 45;          // €45/month base cost
const POSTGRES_STORAGE = 0.044;    // €0.044/month per GB

// Cache costs
const REDIS_512MB = 15;            // €15/month
const REDIS_1GB = 25;              // €25/month
```

### Multi-Container Cost Aggregation
```typescript
// Calculate total application cost
const totalApplicationCost = containers.reduce((total, container) => {
  const cpuCost = container.resources.cpu * CPU_COST_PER_CORE;
  const memoryCost = (container.resources.memory / 1024) * MEMORY_COST_PER_GB;
  const replicaCost = (cpuCost + memoryCost) * container.resources.replicas.min;
  
  const volumeCost = container.volume 
    ? container.volume.sizeGB * STORAGE_COST_PER_GB 
    : 0;
  
  return total + replicaCost + volumeCost;
}, 0);
```

**Important**: Always show cost breakdown transparently. Users should understand what they're paying for.

## Simulated Deployment Flow

### Deployment Progress (Demo Mode)
The deploying page should show realistic progress with appropriate delays:

```typescript
const deploySteps = [
  { msg: "Pulling image from registry", duration: 2000 },
  { msg: "Provisioning database", duration: 3000 },
  { msg: "Provisioning cache", duration: 1500 },
  { msg: "Configuring load balancer", duration: 2000 },
  { msg: "Generating SSL certificate", duration: 2500 },
  { msg: "Starting application containers", duration: 2000 },
  { msg: "Health checks passing", duration: 1500 }
];

// Total: ~14 seconds (feels real, not too fast or slow)
```

**Avoid**:
- ❌ Brand-specific logs (e.g., "Starting PostgreSQL 14.2")
- ❌ Too fast (feels fake)
- ❌ Too slow (user frustration)

**Use**:
- ✅ Generic terms (e.g., "Provisioning database")
- ✅ Realistic delays (2-3 seconds per major step)
- ✅ Progressive status updates

## Common Patterns

### Auto-Generated Environment Variables

Environment variables for databases, caches, and queues are auto-generated with customizable names:

```typescript
// Default naming pattern
UNHAZZLE_{SERVICE}_URL  // e.g., UNHAZZLE_POSTGRES_URL

// For multiple services of same type
UNHAZZLE_{SERVICE}_{NAME}_URL  // e.g., UNHAZZLE_POSTGRES_MAIN_URL

// User can customize to match framework expectations
DATABASE_URL              // Changed from UNHAZZLE_POSTGRES_URL
REDIS_URL                 // Changed from UNHAZZLE_REDIS_URL
```

**Implementation**:
1. Show editable variable name in Service Access section
2. Connection string value is read-only (auto-generated)
3. Validate uniqueness (no conflicts with user-defined vars)
4. Format validation: `[A-Z0-9_]+`

### Service Access Control

Each container can opt-in to service access:

```tsx
<div>
  <h3>Service Access</h3>
  <p className="text-sm text-slate-600">
    Grant this container access to databases, caches, or queues.
  </p>
  
  <label className="flex items-center gap-2">
    <input 
      type="checkbox" 
      checked={hasPostgresAccess}
      onChange={togglePostgresAccess}
    />
    <span>PostgreSQL</span>
  </label>
  
  {hasPostgresAccess && (
    <div className="ml-6 text-sm">
      <span className="text-slate-600">Auto-injects as:</span>
      <input 
        type="text"
        value={postgresVarName}
        onChange={updatePostgresVarName}
        className="ml-2 border rounded px-2 py-1"
      />
    </div>
  )}
</div>
```

### Multi-Container Support

The application supports 1-5 containers per project:

```tsx
// Container definition
interface Container {
  id: string;
  name: string;                    // DNS name (e.g., 'frontend', 'backend')
  imageUrl: string;                // Container image
  port: number;                    // Exposed port
  exposure: 'public' | 'private';  // Internet-facing or internal
  resources: {
    cpu: number;                   // CPU cores
    memory: number;                // Memory in MB
    replicas: {
      min: number;
      max: number;
    };
  };
  healthCheck: HealthCheckConfig;
  serviceAccess: {
    postgres?: boolean;
    redis?: boolean;
    rabbitmq?: boolean;
  };
  environmentVariables: EnvVar[];
  volume?: VolumeConfig;           // Optional persistent storage
}
```

**Inter-Container Communication**:
- Internal DNS: `{container-name}.{project-name}`
- Example: Frontend calls backend via `http://backend.my-project:8080`

## Validation Rules

### Input Validation
- **Container name**: Lowercase alphanumeric + hyphens, 3-63 chars
- **CPU**: 0.1 to 32 cores
- **Memory**: 128 MB to 64 GB
- **Replicas**: Min 1, max 100, min ≤ max
- **Port**: 1-65535
- **Storage**: 1 GB to 10 TB

### Business Rules
- **Min replicas ≥ 1**: Ensure availability
- **Max replicas ≥ min replicas**: Logical scaling
- **Public containers require domain**: No IP-only exposure
- **Private containers cannot have custom domain**: Internal DNS only

## Testing Checklist

Before submitting a feature implementation, verify:

- [ ] Follows specification precisely
- [ ] Uses correct terminology from glossary
- [ ] Pre-fills realistic default values
- [ ] Shows cost impact transparently
- [ ] Handles validation errors gracefully
- [ ] Works on mobile, tablet, desktop
- [ ] No TypeScript compilation errors (`npm run build`)
- [ ] State persists across page navigation
- [ ] Loading states show during recalculation
- [ ] Matches existing UI patterns and styling
- [ ] Uses generic terms (no brand-specific logs)
- [ ] Simulated delays feel realistic (not too fast/slow)

## Common Mistakes to Avoid

1. **Don't build real infrastructure**: This is a demo/prototype
2. **Don't add external API calls**: All data is mock/simulated
3. **Don't use localStorage**: State is in-memory only for demo
4. **Don't skip cost calculations**: Always show pricing impact
5. **Don't ignore specs**: They're based on user research
6. **Don't use brand names in logs**: Keep it generic
7. **Don't over-engineer**: Simple, straightforward code
8. **Don't break existing flows**: Test the full user journey
9. **Don't ignore TypeScript errors**: Fix them, don't suppress
10. **Don't assume knowledge**: Show tooltips and helper text

## Questions to Ask Before Implementing

1. **Is there a spec for this feature?** → Read it first
2. **What's the priority?** → Check feedback-summary.md
3. **Are there dependencies?** → Review related specs
4. **How does this affect cost?** → Update cost calculator
5. **What are the edge cases?** → Plan validation
6. **Does it follow patterns?** → Study existing code
7. **Is it responsive?** → Test on different screen sizes
8. **What's the user journey?** → Review flow.md
9. **What feedback drove this?** → Understand the "why"
10. **How will we test it?** → Manual testing plan

## Resources

### Documentation
- **Product Specs**: `/journey/product-journey-docs/`
- **Feature Specs**: `/journey/feedback-docs/first-round/features-spec/`
- **Feedback Summary**: `/journey/feedback-docs/first-round/feedback-summary.md`
- **Glossary**: `/journey/GLOSSARY.md`

### Code References
- **DeploymentContext**: `/prototype-app/lib/context/DeploymentContext.tsx`
- **Cost Calculator**: `/prototype-app/lib/utils/costCalculator.ts`
- **Example Pages**: All pages in `/prototype-app/app/`

### External
- **Next.js App Router**: https://nextjs.org/docs/app
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

## Getting Help

If you're unsure about implementation details:

1. **Check the spec**: Most questions are answered there
2. **Review existing code**: Find similar patterns
3. **Test incrementally**: Don't build everything at once
4. **Validate early**: Run the app and test as you go
5. **Ask specific questions**: Reference spec sections and code

## Version History

- **v1.0** (Current): Initial development guide based on first-round testing feedback
- Reflects completed features: View current deployment config, Multi-container support Phase 2
- Prioritizes: Edit selections on pricing page, Volume storage, Generic logs, Env var name editing

---

**Remember**: The goal is to validate UX flows and gather feedback, not to build production-ready infrastructure. Keep it simple, follow the specs, and focus on the user experience.
