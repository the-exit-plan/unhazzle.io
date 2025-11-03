# Glossary

The purpose of the glossary is to define the standard terminology to be used across all systems, code and documents of `unhazzle.io` ecosystem.

The following collections of terms have been assembled using a grammar system that defines subjects, objects and verbs.

## Core Concepts

### Subjects
Things that are doing or being something in the unhazzle ecosystem.

### Verbs
An action or state of being.

### Objects
Receives the action of the verb.

## unhazzle subjects hierarchy

- 💡 **Project**  
  A logical container that groups related environments, applications, and resources together for a specific software product or initiative.

  - 🗳️ **Environment** *(or Env)*  
    An isolated deployment context (dev, staging, prod) that hosts applications, functions, and services with specific configurations and resource allocations.

    - 🚀 **Application** *(or App)*  
      Long-running user code deployments (frontend/backend) that serve web traffic, APIs, or other persistent workloads within an environment.

    - ⚡ **Function** *(or Task)*  
      Short-lived, event-driven workloads that execute specific jobs like migrations, data processing, or scheduled tasks without persistent infrastructure.

    - 📕 **Database**  
      Managed database services including relational (PostgreSQL, MySQL) and NoSQL (MongoDB, CouchDB) databases that applications and functions depend on.

    - 🔅 **Cache**  
      In-memory data stores like Redis or Memcached that provide fast data access and session storage for applications and functions.

    - ♒ **Queue**  
      Message queuing systems like RabbitMQ, Apache Kafka, or cloud-native queues that handle asynchronous communication between services.

## unhazzle internal subjects

- 🗄️ **Registry**  
  OCI registry access credentials and configuration that allow unhazzle to pull customer artifacts (applications, functions, and services) from external container registries.

- ⚙️ **Cluster**  
  Kubernetes clusters that serve as the backbone infrastructure where unhazzle deploys and manages customer workloads across different environments.

- ☁️ **Provider**  
  Cloud and infrastructure providers (from european specialized providers to hyperscalers) where unhazzle provisions and manages Kubernetes clusters.

- 📡 **Platform radar**  
  Feature roadmap and status tracker that maintains a comprehensive list of platform capabilities categorized by their development stage: ready-to-use, coming soon, or planning stage. Displayed on the website for transparency and customer planning.

- 🧔 **User**  
  Human being that interacts with the unhazzle platform in any way, UI or CLI, that has an account registered in our database.

- 🔒 **Certificate**  
  TLS/SSL certificates managed by unhazzle for securing customer applications and services with HTTPS encryption and domain validation.

- 🌐 **Domain**  
  Custom domains and DNS configurations that customers use to expose their applications and services to end users with branded URLs.

- 📍 **Location**  
  Geographical regions and availability zones where customer workloads are provisioned, determining data residency, latency, and compliance requirements.

## Design Decisions

## Design decisions

### Subject-First Command Structure

The CLI commands follow a **subject-first** structure (e.g., `project create`, `application deploy`) rather than verb-first (e.g., `create project`, `deploy application`). This decision was made for several reasons:

- **Better discoverability**: Users can type a subject and use tab completion to see all available actions
- **Logical grouping**: All commands for a specific resource type are grouped together
- **Modern CLI patterns**: Aligns with popular tools like Docker (`docker container start`), AWS CLI (`aws s3 cp`), and Azure CLI (`az vm create`)
- **Development efficiency**: Easier to organize and implement CLI functionality by resource type
- **Context-oriented workflow**: Users working with specific resources can stay in that context

### Singular Subject Names

All subjects use singular forms (e.g., `project`, `application`, `function`) rather than plurals, even for commands that operate on multiple items (like `project list`). This approach provides:

- **Consistency**: One predictable pattern across all commands
- **Simplicity**: Reduces cognitive load for users
- **Fewer variations**: Eliminates the need to remember which commands use singular vs plural
- **Convention over configuration**: Users learn one pattern and apply it everywhere

### UI vs CLI Terminology

While the CLI uses **subject-first** structure for technical efficiency, the user interface (website, buttons, labels) will use **verb-first** language for better user experience:

- **CLI**: `project create` (technical, resource-oriented)
- **UI**: "Create Project" (natural, action-oriented)

This dual approach optimizes each interface for its specific use case and user expectations.

## Verbs

Actions to be performed on subjects (in this case they act like objects).

### Project

- `project init` — Create starter template manifests/config for project
- `project create` — Create a new project
- `project list` — List all projects
- `project switch` — Change active project context
- `project delete` — Remove a project entirely
- `project export` — Export manifests/config
- `project describe` — Detailed information

### Environment / Env

- `environment init` — Create starter template manifests/config for environment
- `environment create` — Create a new environment
- `environment list` — List all environments in project
- `environment switch` — Change active environment context
- `environment delete` — Remove an environment entirely
- `environment update` — Update settings
- `environment clone` — Clone environment settings
- `environment promote` — Promote changes from one environment to another
- `environment export` — Export manifests/config of all (selected) subjects
- `environment describe` — Detailed information

### Application / App

- `application init` — Create starter template manifests/config for application
- `application create` — Create a new application
- `application list` — List all applications in environment
- `application deploy` — Deploy application to environment
- `application delete` — Remove an application entirely
- `application stop` — Stop running application
- `application start` — Start stopped application
- `application restart` — Restart running application
- `application scale` — change replicas/resources
- `application update` — update config (runtime vars, image)
- `application rollback` — revert to previous version
- `application clone` — Clone application configuration
- `application promote` — Promote application to next environment
- `application logs` — View application logs
- `application status` — Check application health status
- `application export` — Export manifests/config
- `application describe` — Detailed information

### Function / Task

- `function init` — Create starter template manifests/config for function
- `function create` — Create a new function
- `function list` — List all functions in environment
- `function delete` — Remove a function entirely
- `function run` — execute once (**Default action**)
- `function schedule` — Set up scheduled execution
- `function update` — Update function config
- `function logs` — View function execution logs
- `function status` — Check function status
- `function export` — Export manifests/config
- `function describe` — Detailed information

### Database/Cache/Queue

- `database init` — Create starter template manifests/config for database
- `database create` — Create a new database
- `database list` — List all databases in environment
- `database delete` — Remove a database entirely
- `database stop` — Stop running database
- `database start` — Start stopped database
- `database scale` — resize plan (e.g. storage, memory, compute)
- `database update` — Update database config
- `database backup` — Create database backup
- `database restore` — Restore database from backup
- `database logs` — View database logs
- `database status` — Check database health status
- `database export` — Export manifests/config
- `database describe` — Detailed database information

*Note: Replace `database` with `cache` or `queue` for respective services (e.g., `cache create`, `queue start`)*

### Registry

- `registry connect` — Connect to an OCI registry with credentials
- `registry create` — Create a new registry connection
- `registry list` — List all configured registries
- `registry delete` — Remove a registry connection
- `registry test` — Test registry connectivity and authentication
- `registry update` — Update registry credentials or configuration
- `registry authenticate` — Re-authenticate with a registry
- `registry sync` — Synchronize available artifacts from registry
- `registry describe` — Detailed registry connection information

### Cluster

- `cluster create` — Create a new Kubernetes cluster
- `cluster list` — List all managed clusters
- `cluster delete` — Remove a cluster entirely
- `cluster scale` — Scale cluster nodes up or down
- `cluster update` — Update cluster configuration
- `cluster status` — Check cluster health and status
- `cluster connect` — Connect to cluster for management
- `cluster upgrade` — Upgrade cluster Kubernetes version
- `cluster backup` — Create cluster backup
- `cluster restore` — Restore cluster from backup
- `cluster logs` — View cluster system logs
- `cluster describe` — Detailed cluster information

### Authentication Verbs

User session management actions for accessing and securing the unhazzle platform.

- `Sign up` — Create new account
- `Sign in` — Access an existing account
- `Sign out` — Exit current session

### User Management

Team collaboration and access control operations.

- `user list` — List users
- `user invite` — Invite new user
- `user delete` — Remove user access
- `user update` — Updates user details
