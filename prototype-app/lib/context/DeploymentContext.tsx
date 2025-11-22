'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for our deployment configuration
export interface UserInfo {
  name: string;
  githubUsername?: string;
}

export interface QuestionnaireAnswers {
  appType: 'ecommerce' | 'saas' | 'api' | 'content';
  traffic: 'steady' | 'burst' | 'global' | 'regional';
  database: 'postgres' | 'mysql' | 'mongodb' | 'none';
  cache: 'redis' | 'memcached' | 'none';
}

// New: Project basics and Smart Assistance typing
export interface RegionInfo {
  code: string; // e.g., fsn1, nbg1, hel1
  label: string; // e.g., 'Falkenstein (fsn1)'
  country: string; // e.g., 'Germany'
  flag: string; // e.g., '🇩🇪'
}

export interface SmartQuestionnaireAnswers {
  traffic: '<1k' | '1k-10k' | '10k-100k' | '100k-1m' | '1m+';
  latency: '<50ms' | '50-200ms' | '200-500ms' | '>500ms';
  workload: 'cpu' | 'memory' | 'io' | 'balanced';
  startup: '<5s' | '5-15s' | '15-30s' | '>30s';
  spikiness: 'steady' | 'daily' | 'weekly' | 'unpredictable';
}

export interface Recommendations {
  replicasBase: number;
  cpuPerReplica: string; // e.g., '2 vCPU'
  memoryPerReplica: string; // e.g., '4GB'
  hpaMin: number;
  hpaMax: number;
  hpaThreshold: number; // percent
  hpaCooldown: number; // minutes
  rationale: string;
}

// Project and Environment structure for hierarchical navigation
export interface PRSource {
  provider: 'github';
  repository: string;
  prNumber: number;
  prTitle: string;
  branchName: string;
  commitSha: string;
}

export interface ServiceOverride {
  serviceName: string;
  image: string;
}

export type EnvironmentType = 'standard' | 'pr' | 'non-prod' | 'prod';

export interface Environment {
  id: string;
  name: string; // 'dev', 'staging', 'prod', 'feature-fix-carts-pr-128'
  slug: string; // kebab-case, 3-63 chars
  type: EnvironmentType;
  deployed: boolean; // false = configuration phase, true = provisioned
  deployedAt?: string; // ISO 8601 timestamp of first deployment
  pendingChanges: boolean; // true when deployed env has unsaved modifications
  createdAt: string; // ISO 8601
  expiresAt?: string; // ISO 8601, only for type='pr'

  // PR-specific metadata
  prSource?: PRSource;
  triggeredBy?: 'pull_request_opened' | 'pull_request_reopened' | 'pull_request_synchronize';
  serviceOverride?: ServiceOverride;

  // Configuration
  applications: ApplicationConfig[];
  database?: {
    engine: string;
    version: string;
    type: 'managed' | 'external' | 'container'; // New field
    externalUrl?: string; // New field
    cpu: string;
    memory: string;
    storage: string;
    backups: { enabled: boolean; retention: string; frequency: string };
    replicas: string;
  };
  cache?: {
    engine: string;
    version: string;
    memory: string;
    evictionPolicy: string;
    persistence: string;
  };

  // Access
  baseDomain: string; // {env-slug}.{project-slug}.demo.unhazzle.io
  publicApplications: string[]; // application names with exposure='public'
}

export interface ConfigRepo {
  provider: 'github' | 'gitlab';
  repository: string; // 'owner/repo'
  branch: string; // 'main'
  manifestPath: string; // 'unhazzle.yaml'
}

export interface PREnvSettings {
  enabled: boolean;
  maxEnvs: number; // 1-20
  lifetimeHours: number; // 1-8
  autoDeleteOnPRClose: boolean; // always true in MVP
}

export interface RepositoryIntegration {
  url: string;
  branch: string;
  autoDeployEnabled: boolean;
  configPath: string; // Path to unhazzle.yaml in repo
}

export interface PREnvironmentSettings {
  enabled: boolean;
  autoCreateOnPR: boolean;
  autoDeleteOnMerge: boolean;
  expirationHours: number;
  nameTemplate: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string; // kebab-case
  description?: string;
  githubPAT?: string; // GitHub Personal Access Token for ghcr.io
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  repository?: RepositoryIntegration;
  prEnvironmentSettings?: PREnvironmentSettings;

  configRepo?: ConfigRepo;
  prEnvs: PREnvSettings;

  environments: Environment[];

  // Computed
  envCount: number;
  prEnvCount: number;
  standardEnvCount: number;
}

export interface VolumeConfig {
  mountPath: string;
  sizeGB: number;
  autoScale: boolean;
  backupFrequency: 'disabled' | 'hourly' | 'daily' | 'weekly';
  deleteWithContainer: boolean;
}

export interface ApplicationConfig {
  id: string;
  name: string;
  imageUrl: string;
  registryUsername?: string;
  registryToken?: string;
  port: number;
  healthCheck: {
    protocol: 'HTTP' | 'TCP' | 'gRPC';
    port: number;
    path?: string;
    interval: string;
    timeout: string;
    retries: number;
  };
  exposure: 'public' | 'private';
  customDomain?: string;
  resources: {
    cpu: string;
    memory: string;
    replicas: { min: number; max: number };
  };
  volume?: VolumeConfig;
  serviceAccess: {
    database: boolean;
    cache: boolean;
    applications?: string[]; // List of application IDs this app can talk to
  };
  externalDatabase?: {
    enabled: boolean;
    connectionString: string;
  };
  environmentVariables: {
    key: string;
    value: string;
    masked?: boolean;
  }[];
  // New fields for Application-Level Deployment Lifecycle
  status: 'deploying' | 'running' | 'paused' | 'failed' | 'stopped';
  isDirty: boolean; // true if config changed since last deploy
  pauseSchedule?: string; // Cron expression (e.g., "0 18 * * 1-5")
  deployedAt?: string;
}

export type ContainerConfig = ApplicationConfig; // Alias for backward compatibility

// Legacy single container support (deprecated but maintained for backward compatibility)
export interface LegacyApplicationConfig {
  imageUrl: string;
  registryUsername?: string;
  registryToken?: string;
  port?: number;
  healthCheck?: string;
}

export interface ResourceConfig {
  replicas: { min: number; max: number };
  cpu: string;
  memory: string;
  database?: {
    engine: string;
    version: string;
    type: 'managed' | 'external' | 'container'; // New field
    externalUrl?: string; // New field
    cpu: string;
    memory: string;
    storage: string;
    backups: { enabled: boolean; retention: string; frequency: string };
    replicas: string;
  };
  cache?: {
    engine: string;
    version: string;
    memory: string;
    evictionPolicy: string;
    persistence: string;
  };
}

export interface EnvironmentVariables {
  userSecrets: { key: string; value: string; masked?: boolean }[];
  autoGenerated: { key: string; value: string; readOnly: boolean }[];
}

export interface DomainConfig {
  customDomain?: string;
  defaultSubdomain: string;
  dnsInstructions?: string;
}

export interface CostBreakdown {
  application: number;
  database?: number;
  cache?: number;
  loadBalancer: number;
  bandwidth: number;
  total: number;
}

export interface DeploymentState {
  user: UserInfo | null;
  questionnaire: QuestionnaireAnswers | null;
  application: LegacyApplicationConfig | null; // Legacy support
  applications: ApplicationConfig[]; // Was containers
  resources: ResourceConfig | null;
  environment: EnvironmentVariables | null;
  domain: DomainConfig | null;
  cost: CostBreakdown | null;
  deployed: boolean;
  // New: Project-based structure
  project: Project | null;
  activeEnvironmentId: string | null; // Track which environment is selected in UI
  // New: Project Setup + Smart Assistance
  projectName?: string;
  region?: RegionInfo;
  smartQuestionnaire?: SmartQuestionnaireAnswers | null;
  recommendations?: Recommendations | null;
}

interface DeploymentContextType {
  state: DeploymentState;
  updateState: (partial: Partial<DeploymentState>) => void;
  updateUser: (user: UserInfo) => void;
  updateQuestionnaire: (answers: QuestionnaireAnswers) => void;
  updateApplication: (config: LegacyApplicationConfig) => void; // Legacy
  addApplication: (app: ApplicationConfig) => void;
  clearApplications: () => void;
  updateApplicationConfig: (id: string, app: Partial<ApplicationConfig>) => void;
  removeApplication: (id: string, envId?: string) => void;
  updateResources: (config: ResourceConfig) => void;
  updateEnvironment: (env: EnvironmentVariables) => void;
  updateDomain: (domain: DomainConfig) => void;
  updateCost: (cost: CostBreakdown) => void;
  markDeployed: () => void;
  resetState: () => void;
  removeDatabase: () => void;
  removeCache: () => void;
  // New: Project and Environment management
  updateProject: (updates: Partial<Project>) => void;
  createEnvironment: (envData: Partial<Environment> & { name: string }) => Environment;
  updateEnvironmentConfig: (envId: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (envId: string) => void;
  cloneEnvironment: (sourceEnvId: string, newName: string, autoDeploy?: boolean) => Environment;
  promoteEnvironment: (sourceEnvId: string, targetEnvId: string) => void;
  pauseEnvironment: (envId: string, schedule?: string) => void;
  resumeEnvironment: (envId: string) => void;
  setActiveEnvironment: (envId: string) => void;
  getActiveEnvironment: () => Environment | null;
  // New: OCI Registry and deployment flow
  createAppsFromImages: (environmentId: string, images: Array<{ name: string; url: string; autoName: string; tag?: string; description?: string; exposure?: 'public' | 'private' }>) => void;
  markEnvironmentChanged: (environmentId: string) => void;
  deployEnvironment: (environmentId: string) => void;
  applyEnvironmentChanges: (environmentId: string) => void;
  // New: Application-Level Deployment Lifecycle
  updateApplicationStatus: (appId: string, status: ApplicationConfig['status']) => void;
  promoteApplication: (sourceAppId: string, targetEnvId: string) => void;
  pauseApplication: (appId: string, schedule?: string) => void;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined);

const initialState: DeploymentState = {
  user: null,
  questionnaire: null,
  application: null,
  applications: [],
  resources: null,
  environment: null,
  domain: null,
  cost: null,
  deployed: false,
  project: null,
  activeEnvironmentId: null,
  projectName: undefined,
  region: undefined,
  smartQuestionnaire: null,
  recommendations: null,
};

export function DeploymentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DeploymentState>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unhazzle-deployment-state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure applications array exists (migrate from containers if needed)
          const applications = parsed.applications || parsed.containers || [];

          // If deployed but no project structure, create it from legacy data
          let project = parsed.project;
          if (parsed.deployed && !project && applications.length > 0) {
            const now = new Date().toISOString();
            const projectSlug = parsed.questionnaire?.appType ? `${parsed.questionnaire.appType.toLowerCase()}-app` : 'my-app';
            const publicApplications = applications
              .filter((c: ApplicationConfig) => c.exposure === 'public')
              .map((c: ApplicationConfig) => c.name);

            project = {
              id: 'proj-' + Date.now(),
              name: parsed.questionnaire?.appType ? `${parsed.questionnaire.appType} Application` : 'My Application',
              slug: projectSlug,
              createdAt: now,
              updatedAt: now,
              prEnvs: {
                enabled: true,
                maxEnvs: 3,
                lifetimeHours: 2,
                autoDeleteOnPRClose: true,
              },
              environments: [
                {
                  id: 'env-dev-' + Date.now(),
                  name: 'dev',
                  slug: 'dev',
                  type: 'standard' as EnvironmentType,
                  createdAt: now,
                  baseDomain: `dev.${projectSlug}.demo.unhazzle.io`,
                  publicApplications,
                  applications: applications,
                  database: parsed.resources?.database,
                  cache: parsed.resources?.cache,
                }
              ],
              envCount: 1,
              prEnvCount: 0,
              standardEnvCount: 1,
            };
          }

          // Ensure existing project environments have applications array (migrate from containers)
          if (project && project.environments) {
            project.environments = project.environments.map((env: any) => ({
              ...env,
              applications: env.applications || env.containers || [],
              containers: undefined // Clear legacy
            }));
          }

          return {
            ...parsed,
            applications,
            containers: undefined, // Clear legacy
            project
          };
        } catch (e) {
          console.error('Failed to parse saved state:', e);
        }
      }
    }
    return initialState;
  });

  const updateUser = (user: UserInfo) => {
    setState(prev => {
      const newState = { ...prev, user };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Generic partial state updater (for Project Setup fields)
  const updateState = (partial: Partial<DeploymentState>) => {
    setState(prev => {
      const newState = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateQuestionnaire = (answers: QuestionnaireAnswers) => {
    setState(prev => {
      const newState = { ...prev, questionnaire: answers };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateApplication = (config: LegacyApplicationConfig) => {
    setState(prev => {
      const newState = { ...prev, application: config };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const addApplication = (app: ApplicationConfig) => {
    setState(prev => {
      const existingApps = prev.applications || [];
      const newState = { ...prev, applications: [...existingApps, app] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const clearApplications = () => {
    setState(prev => {
      const newState = { ...prev, applications: [] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateApplicationConfig = (id: string, updates: Partial<ApplicationConfig>) => {
    setState(prev => {
      // 1. Update global applications (legacy support)
      const existingApps = prev.applications || [];
      const updatedGlobalApps = existingApps.map(c =>
        c.id === id ? { ...c, ...updates } : c
      );

      // 2. Update project environments
      let updatedProject = prev.project;
      if (prev.project?.environments) {
        updatedProject = {
          ...prev.project,
          environments: prev.project.environments.map((env: Environment) => {
            // Check if this environment has the application
            const hasApp = env.applications.some(c => c.id === id);

            if (hasApp) {
              // Update the application within this environment
              const updatedEnvApps = env.applications.map(c =>
                c.id === id ? { ...c, ...updates } : c
              );

              return {
                ...env,
                applications: updatedEnvApps,
                // Update publicApplications list if name changed
                publicApplications: updates.name
                  ? env.publicApplications.map(name => {
                    const oldApp = env.applications.find(c => c.id === id);
                    return oldApp && oldApp.name === name ? updates.name! : name;
                  })
                  : env.publicApplications
              };
            }
            return env;
          })
        };
      }

      const newState = {
        ...prev,
        applications: updatedGlobalApps,
        project: updatedProject
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const removeApplication = (id: string, envId?: string) => {
    setState(prev => {
      const existingApps = prev.applications || [];
      const updatedApps = existingApps.filter(c => c.id !== id);

      // Also update project environment structure
      let updatedProject = prev.project;
      if (prev.project?.environments) {
        updatedProject = {
          ...prev.project,
          environments: prev.project.environments.map((env: Environment) => {
            // If envId is provided, only update that specific environment
            // Otherwise, update all environments (legacy behavior)
            if (envId && env.id !== envId) {
              return env;
            }

            // Remove application from this environment
            const envApps = env.applications || [];
            const appToRemove = envApps.find(c => c.id === id);
            const updatedEnvApps = envApps.filter(c => c.id !== id);

            return {
              ...env,
              applications: updatedEnvApps,
              publicApplications: appToRemove
                ? env.publicApplications.filter(name => name !== appToRemove.name)
                : env.publicApplications,
            };
          })
        };
      }

      const newState = {
        ...prev,
        applications: updatedApps,
        project: updatedProject
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Remove database service from resources and clean up application references
  const removeDatabase = () => {
    setState(prev => {
      // Toggle off DB access and remove related env vars from all applications
      const cleanedApps = (prev.applications || []).map(c => {
        if (!c.serviceAccess?.database) return c;
        // Keep UNHAZZLE_POSTGRES_URL if it's an external DB (optional, but for now we remove access entirely)
        // Actually, if we remove the DB service, we should remove the env vars.
        const filteredEnv = (c.environmentVariables || []).filter(v => v.key !== 'UNHAZZLE_POSTGRES_URL' && v.key !== 'DATABASE_URL');
        return {
          ...c,
          serviceAccess: { ...c.serviceAccess, database: false },
          environmentVariables: filteredEnv,
        };
      });

      // Update resources (if present) by removing database
      const newResources = prev.resources ? { ...prev.resources, database: undefined } : prev.resources;

      // Remove auto-generated DATABASE_URL from environment if present
      let newEnv = prev.environment;
      if (prev.environment?.autoGenerated) {
        newEnv = {
          ...prev.environment,
          autoGenerated: prev.environment.autoGenerated.filter((e: any) => e.key !== 'DATABASE_URL')
        } as any;
      }

      // Also update project environment structure
      let updatedProject = prev.project;
      if (prev.project?.environments?.[0]) {
        updatedProject = {
          ...prev.project,
          environments: prev.project.environments.map((env: Environment, idx: number) => {
            if (idx === 0) {
              return {
                ...env,
                applications: cleanedApps,
                database: undefined,
              };
            }
            return env;
          })
        };
      }

      const newState = {
        ...prev,
        applications: cleanedApps,
        resources: newResources,
        environment: newEnv,
        project: updatedProject
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Remove cache service from resources and clean up application references
  const removeCache = () => {
    setState(prev => {
      // Toggle off cache access and remove related env vars from all applications
      const cleanedApps = (prev.applications || []).map(c => {
        if (!c.serviceAccess?.cache) return c;
        const filteredEnv = (c.environmentVariables || []).filter(v => v.key !== 'UNHAZZLE_REDIS_URL' && v.key !== 'REDIS_URL');
        return {
          ...c,
          serviceAccess: { ...c.serviceAccess, cache: false },
          environmentVariables: filteredEnv,
        };
      });

      // Update resources (if present) by removing cache
      const newResources = prev.resources ? { ...prev.resources, cache: undefined } : prev.resources;

      // Remove auto-generated REDIS_URL from environment if present
      let newEnv = prev.environment;
      if (prev.environment?.autoGenerated) {
        newEnv = {
          ...prev.environment,
          autoGenerated: prev.environment.autoGenerated.filter((e: any) => e.key !== 'REDIS_URL')
        } as any;
      }

      // Also update project environment structure
      let updatedProject = prev.project;
      if (prev.project?.environments?.[0]) {
        updatedProject = {
          ...prev.project,
          environments: prev.project.environments.map((env: Environment, idx: number) => {
            if (idx === 0) {
              return {
                ...env,
                applications: cleanedApps,
                cache: undefined,
              };
            }
            return env;
          })
        };
      }

      const newState = {
        ...prev,
        applications: cleanedApps,
        resources: newResources,
        environment: newEnv,
        project: updatedProject
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateResources = (config: ResourceConfig) => {
    setState(prev => {
      // Update both legacy resources AND project environment structure
      let updatedProject = prev.project;

      if (prev.project?.environments?.[0]) {
        // Update the first environment (typically 'dev') with new database/cache config
        updatedProject = {
          ...prev.project,
          environments: prev.project.environments.map((env: Environment, idx: number) => {
            if (idx === 0) {
              // Update first environment
              return {
                ...env,
                database: config.database,
                cache: config.cache,
              };
            }
            return env;
          })
        };
      }

      const newState = { ...prev, resources: config, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateEnvironment = (env: EnvironmentVariables) => {
    setState(prev => {
      const newState = { ...prev, environment: env };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateDomain = (domain: DomainConfig) => {
    setState(prev => {
      const newState = { ...prev, domain: domain };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateCost = (cost: CostBreakdown) => {
    setState(prev => {
      const newState = { ...prev, cost };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const markDeployed = () => {
    setState(prev => {
      // Create project structure with only dev environment initially
      const now = new Date().toISOString();

      // Generate a project name/slug (prefer user-provided projectName)
      const timestamp = Date.now();
      const providedName = prev.projectName?.trim();
      const projectName = providedName && providedName.length > 0 ? providedName : `Project ${timestamp.toString().slice(-6)}`;
      const projectSlug = (providedName && providedName.length > 0)
        ? providedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : `project-${timestamp.toString().slice(-6)}`;

      const publicApplications = (prev.applications || [])
        .filter(c => c.exposure === 'public')
        .map(c => c.name);

      // Dev environment (current deployment)
      const devEnv: Environment = {
        id: 'env-dev-' + timestamp,
        name: 'dev',
        slug: 'dev',
        type: 'standard' as EnvironmentType,
        deployed: true,
        deployedAt: now,
        pendingChanges: false,
        createdAt: now,
        baseDomain: `dev.${projectSlug}.demo.unhazzle.io`,
        publicApplications,
        applications: prev.applications || [],
        database: prev.resources?.database,
        cache: prev.resources?.cache,
      };

      const project: Project = {
        id: 'proj-' + timestamp,
        name: projectName,
        slug: projectSlug,
        description: 'A production-ready application deployed with Unhazzle',
        createdAt: now,
        updatedAt: now,
        repository: {
          url: `https://github.com/${prev.user?.githubUsername || 'username'}/${projectSlug}`,
          branch: 'main',
          autoDeployEnabled: true,
          configPath: 'unhazzle.yaml',
        },
        prEnvironmentSettings: {
          enabled: false, // Disabled by default - user can enable in settings
          autoCreateOnPR: true,
          autoDeleteOnMerge: true,
          expirationHours: 72,
          nameTemplate: 'pr-{number}',
        },
        prEnvs: {
          enabled: false, // Disabled by default
          maxEnvs: 3,
          lifetimeHours: 2,
          autoDeleteOnPRClose: true,
        },
        environments: [devEnv], // Only dev environment initially
        envCount: 1,
        prEnvCount: 0,
        standardEnvCount: 1,
      };

      const newState = { ...prev, deployed: true, project };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const resetState = () => {
    setState(initialState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unhazzle-deployment-state');
    }
  };

  // New: Project management
  const updateProject = (updates: Partial<Project>) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedProject = {
        ...prev.project,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // New: Environment management
  const createEnvironment = (envData: Partial<Environment> & { name: string }): Environment => {
    if (!state.project) {
      throw new Error('Cannot create environment without a project');
    }

    const now = new Date().toISOString();
    const slug = envData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const publicApplications = (envData.applications || [])
      .filter(c => c.exposure === 'public')
      .map(c => c.name);

    const newEnv: Environment = {
      id: `env-${slug}-${Date.now()}`,
      slug,
      type: envData.type || 'standard',
      deployed: envData.deployed || false,
      deployedAt: envData.deployedAt,
      pendingChanges: envData.pendingChanges || false,
      createdAt: now,
      baseDomain: `${slug}.${state.project.slug}.demo.unhazzle.io`,
      publicApplications,
      applications: envData.applications || [],
      database: envData.database,
      cache: envData.cache,
      ...envData,
      name: envData.name, // Override to ensure name is set last
    };

    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = [...prev.project.environments, newEnv];
      const prEnvCount = updatedEnvironments.filter(e => e.type === 'pr').length;
      const standardEnvCount = updatedEnvironments.filter(e => e.type === 'standard').length;

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        envCount: updatedEnvironments.length,
        prEnvCount,
        standardEnvCount,
        updatedAt: now,
      };

      const newState = {
        ...prev,
        project: updatedProject,
        activeEnvironmentId: newEnv.id, // Auto-select new environment
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });

    return newEnv;
  };

  const updateEnvironmentConfig = (envId: string, updates: Partial<Environment>) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        if (env.id === envId) {
          const updatedEnv = { ...env, ...updates };
          // Recalculate publicApplications if applications changed
          if (updates.applications) {
            updatedEnv.publicApplications = updates.applications
              .filter(c => c.exposure === 'public')
              .map(c => c.name);
          }
          return updatedEnv;
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString(),
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const deleteEnvironment = (envId: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const now = new Date().toISOString();
      const updatedEnvironments = prev.project.environments.filter(env => env.id !== envId);
      const prEnvCount = updatedEnvironments.filter(e => e.type === 'pr').length;
      const standardEnvCount = updatedEnvironments.filter(e => e.type === 'standard').length;

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        envCount: prEnvCount + standardEnvCount,
        prEnvCount,
        standardEnvCount,
        updatedAt: now,
      };

      // If deleting active environment, clear selection
      const newActiveEnvId = prev.activeEnvironmentId === envId ? null : prev.activeEnvironmentId;

      const newState = {
        ...prev,
        project: updatedProject,
        activeEnvironmentId: newActiveEnvId,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const cloneEnvironment = (sourceEnvId: string, newName: string, autoDeploy: boolean = false): Environment => {
    if (!state.project) {
      throw new Error('Cannot clone environment without a project');
    }

    const sourceEnv = state.project.environments.find(e => e.id === sourceEnvId);
    if (!sourceEnv) {
      throw new Error('Source environment not found');
    }

    // Clone configuration but create new identity
    const clonedEnv = createEnvironment({
      name: newName,
      type: 'standard',
      deployed: autoDeploy,
      deployedAt: autoDeploy ? new Date().toISOString() : undefined,
      applications: JSON.parse(JSON.stringify(sourceEnv.applications)), // Deep clone
      database: sourceEnv.database ? JSON.parse(JSON.stringify(sourceEnv.database)) : undefined,
      cache: sourceEnv.cache ? JSON.parse(JSON.stringify(sourceEnv.cache)) : undefined,
    });

    return clonedEnv;
  };

  const promoteEnvironment = (sourceEnvId: string, targetEnvId: string) => {
    if (!state.project) {
      throw new Error('Cannot promote without a project');
    }

    const sourceEnv = state.project.environments.find(e => e.id === sourceEnvId);
    const targetEnv = state.project.environments.find(e => e.id === targetEnvId);

    if (!sourceEnv || !targetEnv) {
      throw new Error('Source or target environment not found');
    }

    // Copy configuration from source to target
    updateEnvironmentConfig(targetEnvId, {
      applications: JSON.parse(JSON.stringify(sourceEnv.applications)),
      database: sourceEnv.database ? JSON.parse(JSON.stringify(sourceEnv.database)) : undefined,
      cache: sourceEnv.cache ? JSON.parse(JSON.stringify(sourceEnv.cache)) : undefined,
    });
  };

  const setActiveEnvironment = (envId: string) => {
    setState(prev => {
      const newState = { ...prev, activeEnvironmentId: envId };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const getActiveEnvironment = (): Environment | null => {
    if (!state.project || !state.activeEnvironmentId) return null;
    return state.project.environments.find(e => e.id === state.activeEnvironmentId) || null;
  };

  const pauseEnvironment = (envId: string, schedule?: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        if (env.id === envId) {
          // Mark as paused and scale all apps to 0
          const pausedApps = env.applications.map(app => ({
            ...app,
            status: 'paused' as const,
            pauseSchedule: schedule,
            resources: {
              ...app.resources,
              replicas: { ...app.resources.replicas, min: 0, max: 0 }
            }
          }));

          return {
            ...env,
            applications: pausedApps
          };
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString(),
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const resumeEnvironment = (envId: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        if (env.id === envId) {
          // In a real system, this would restore replicas and restart services
          return {
            ...env,
          };
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString(),
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }

      // Simulate resume delay
      setTimeout(() => {
        setState(current => {
          if (!current.project) return current;

          const envs = current.project.environments.map(e =>
            e.id === envId ? { ...e } : e
          );

          const proj = {
            ...current.project,
            environments: envs,
            updatedAt: new Date().toISOString(),
          };

          const s = { ...current, project: proj };
          if (typeof window !== 'undefined') {
            localStorage.setItem('unhazzle-deployment-state', JSON.stringify(s));
          }
          return s;
        });
      }, 2000);

      return newState;
    });
  };

  // New: Create apps from OCI registry images
  const createAppsFromImages = (
    environmentId: string,
    images: Array<{ name: string; url: string; autoName: string; tag?: string; description?: string; exposure?: 'public' | 'private' }>
  ) => {
    setState(prev => {
      if (!prev.project) return prev;

      const env = prev.project.environments.find(e => e.id === environmentId);
      if (!env) return prev;

      const newApps: ApplicationConfig[] = images.map((img, idx) => ({
        id: `app-${Date.now()}-${idx}`,
        name: img.autoName,
        imageUrl: img.url,
        registryToken: img.url.startsWith('ghcr.io') ? prev.project?.githubPAT : undefined,
        port: 3000, // Mocked auto-detection
        healthCheck: {
          protocol: 'HTTP',
          port: 3000,
          path: '/health',
          interval: '30s',
          timeout: '5s',
          retries: 3
        },
        exposure: img.exposure || 'private',
        resources: {
          cpu: prev.recommendations?.cpuPerReplica || '1 vCPU',
          memory: prev.recommendations?.memoryPerReplica || '2GB',
          replicas: {
            min: prev.recommendations?.hpaMin || 2,
            max: prev.recommendations?.hpaMax || 10
          }
        },
        serviceAccess: { database: false, cache: false },
        environmentVariables: [],
        status: 'stopped',
        isDirty: false
      }));

      const updatedEnvironments = prev.project.environments.map(e => {
        if (e.id === environmentId) {
          return {
            ...e,
            applications: [...e.applications, ...newApps],
            publicApplications: [...e.publicApplications, ...newApps.filter(c => c.exposure === 'public').map(c => c.name)]
          };
        }
        return e;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString()
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // New: Mark environment as having pending changes (for deployed environments)
  const markEnvironmentChanged = (environmentId: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const env = prev.project.environments.find(e => e.id === environmentId);
      if (!env || !env.deployed) return prev; // Only mark deployed environments

      const updatedEnvironments = prev.project.environments.map(e => {
        if (e.id === environmentId) {
          return { ...e, pendingChanges: true };
        }
        return e;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString()
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // New: Deploy environment (initial deployment)
  const deployEnvironment = (environmentId: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        if (env.id === environmentId) {
          return {
            ...env,
            deployed: true,
            deployedAt: new Date().toISOString(),
            pendingChanges: false
          };
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString()
      };

      const newState = { ...prev, project: updatedProject, deployed: true };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // New: Apply changes to deployed environment
  const applyEnvironmentChanges = (environmentId: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        if (env.id === environmentId) {
          return {
            ...env,
            pendingChanges: false,
            deployedAt: new Date().toISOString() // Update deployment timestamp
          };
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString()
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // New: Application-Level Deployment Lifecycle
  const updateApplicationStatus = (appId: string, status: ApplicationConfig['status']) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        const hasApp = env.applications.some(a => a.id === appId);
        if (hasApp) {
          const updatedApps = env.applications.map(app =>
            app.id === appId ? { ...app, status } : app
          );
          return { ...env, applications: updatedApps };
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString()
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const promoteApplication = (sourceAppId: string, targetEnvId: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      // Find source app
      let sourceApp: ApplicationConfig | undefined;
      for (const env of prev.project.environments) {
        const app = env.applications.find(a => a.id === sourceAppId);
        if (app) {
          sourceApp = app;
          break;
        }
      }

      if (!sourceApp) return prev;

      // Find target env
      const targetEnv = prev.project.environments.find(e => e.id === targetEnvId);
      if (!targetEnv) return prev;

      // Create new app config for target env
      const newApp: ApplicationConfig = {
        ...sourceApp,
        id: `app-${Date.now()}`, // New ID
        status: 'stopped', // Pending deploy
        isDirty: false,
        deployedAt: undefined
      };

      const updatedEnvironments = prev.project.environments.map(env => {
        if (env.id === targetEnvId) {
          return {
            ...env,
            applications: [...env.applications, newApp],
            publicApplications: newApp.exposure === 'public'
              ? [...env.publicApplications, newApp.name]
              : env.publicApplications
          };
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString()
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const pauseApplication = (appId: string, schedule?: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        const hasApp = env.applications.some(a => a.id === appId);
        if (hasApp) {
          const updatedApps = env.applications.map(app =>
            app.id === appId ? {
              ...app,
              status: 'paused' as const,
              pauseSchedule: schedule,
              resources: {
                ...app.resources,
                replicas: { ...app.resources.replicas, min: 0, max: 0 }
              }
            } : app
          );
          return { ...env, applications: updatedApps };
        }
        return env;
      });

      const updatedProject = {
        ...prev.project,
        environments: updatedEnvironments,
        updatedAt: new Date().toISOString()
      };

      const newState = { ...prev, project: updatedProject };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  return (
    <DeploymentContext.Provider
      value={{
        state,
        updateState,
        updateUser,
        updateQuestionnaire,
        updateApplication,
        addApplication,
        clearApplications,
        updateApplicationConfig,
        removeApplication,
        updateResources,
        updateEnvironment,
        updateDomain,
        updateCost,
        markDeployed,
        resetState,
        removeDatabase,
        removeCache,
        updateProject,
        createEnvironment,
        updateEnvironmentConfig,
        deleteEnvironment,
        cloneEnvironment,
        promoteEnvironment,
        pauseEnvironment,
        resumeEnvironment,
        setActiveEnvironment,
        getActiveEnvironment,
        createAppsFromImages,
        markEnvironmentChanged,
        deployEnvironment,
        applyEnvironmentChanges,
        updateApplicationStatus,
        promoteApplication,
        pauseApplication,
      }}
    >
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeployment() {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error('useDeployment must be used within a DeploymentProvider');
  }
  return context;
}
