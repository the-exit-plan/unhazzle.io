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
export type EnvironmentStatus = 'provisioning' | 'active' | 'paused' | 'deleting' | 'deleted' | 'expired';

export interface Environment {
  id: string;
  name: string; // 'dev', 'staging', 'prod', 'feature-fix-carts-pr-128'
  slug: string; // kebab-case, 3-63 chars
  type: EnvironmentType;
  status: EnvironmentStatus;
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
  containers: ContainerConfig[];
  database?: {
    engine: string;
    version: string;
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
  publicContainers: string[]; // container names with exposure='public'
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

export interface ContainerConfig {
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
  };
  environmentVariables: {
    key: string;
    value: string;
    masked?: boolean;
  }[];
}

// Legacy single container support (deprecated but maintained for backward compatibility)
export interface ApplicationConfig {
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
  application: ApplicationConfig | null; // Legacy support
  containers: ContainerConfig[]; // Legacy: will be migrated to project.environments[0].containers
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
  updateApplication: (config: ApplicationConfig) => void; // Legacy
  addContainer: (container: ContainerConfig) => void;
  clearContainers: () => void;
  updateContainer: (id: string, container: Partial<ContainerConfig>) => void;
  removeContainer: (id: string, envId?: string) => void;
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
  cloneEnvironment: (sourceEnvId: string, newName: string) => Environment;
  promoteEnvironment: (sourceEnvId: string, targetEnvId: string) => void;
  pauseEnvironment: (envId: string) => void;
  resumeEnvironment: (envId: string) => void;
  setActiveEnvironment: (envId: string) => void;
  getActiveEnvironment: () => Environment | null;
  // New: OCI Registry and deployment flow
  createAppsFromImages: (environmentId: string, images: Array<{ name: string; url: string; autoName: string; tag?: string; description?: string; exposure?: 'public' | 'private' }>) => void;
  markEnvironmentChanged: (environmentId: string) => void;
  deployEnvironment: (environmentId: string) => void;
  applyEnvironmentChanges: (environmentId: string) => void;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined);

const initialState: DeploymentState = {
  user: null,
  questionnaire: null,
  application: null,
  containers: [],
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
          // Ensure containers array exists for backward compatibility
          const containers = parsed.containers || [];
          
          // If deployed but no project structure, create it from legacy data
          let project = parsed.project;
          if (parsed.deployed && !project && containers.length > 0) {
            const now = new Date().toISOString();
            const projectSlug = parsed.questionnaire?.appType ? `${parsed.questionnaire.appType.toLowerCase()}-app` : 'my-app';
            const publicContainers = containers
              .filter((c: ContainerConfig) => c.exposure === 'public')
              .map((c: ContainerConfig) => c.name);
              
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
                  status: 'active' as EnvironmentStatus,
                  createdAt: now,
                  baseDomain: `dev.${projectSlug}.demo.unhazzle.io`,
                  publicContainers,
                  containers: containers,
                  database: parsed.resources?.database,
                  cache: parsed.resources?.cache,
                }
              ],
              envCount: 1,
              prEnvCount: 0,
              standardEnvCount: 1,
            };
          }
          
          return {
            ...parsed,
            containers,
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

  const updateApplication = (config: ApplicationConfig) => {
    setState(prev => {
      const newState = { ...prev, application: config };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const addContainer = (container: ContainerConfig) => {
    setState(prev => {
      const existingContainers = prev.containers || [];
      const newState = { ...prev, containers: [...existingContainers, container] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const clearContainers = () => {
    setState(prev => {
      const newState = { ...prev, containers: [] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const updateContainer = (id: string, updates: Partial<ContainerConfig>) => {
    setState(prev => {
      // 1. Update global containers (legacy support)
      const existingContainers = prev.containers || [];
      const updatedGlobalContainers = existingContainers.map(c => 
        c.id === id ? { ...c, ...updates } : c
      );
      
      // 2. Update project environments
      let updatedProject = prev.project;
      if (prev.project?.environments) {
        updatedProject = {
          ...prev.project,
          environments: prev.project.environments.map((env: Environment) => {
            // Check if this environment has the container
            const hasContainer = env.containers.some(c => c.id === id);
            
            if (hasContainer) {
              // Update the container within this environment
              const updatedEnvContainers = env.containers.map(c => 
                c.id === id ? { ...c, ...updates } : c
              );
              
              return {
                ...env,
                containers: updatedEnvContainers,
                // Update publicContainers list if name changed
                publicContainers: updates.name 
                  ? env.publicContainers.map(name => {
                      const oldContainer = env.containers.find(c => c.id === id);
                      return oldContainer && oldContainer.name === name ? updates.name! : name;
                    })
                  : env.publicContainers
              };
            }
            return env;
          })
        };
      }
      
      const newState = {
        ...prev,
        containers: updatedGlobalContainers,
        project: updatedProject
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const removeContainer = (id: string, envId?: string) => {
    setState(prev => {
      const existingContainers = prev.containers || [];
      const updatedContainers = existingContainers.filter(c => c.id !== id);
      
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
            
            // Remove container from this environment
            const envContainers = env.containers || [];
            const containerToRemove = envContainers.find(c => c.id === id);
            const updatedEnvContainers = envContainers.filter(c => c.id !== id);
            
            return {
              ...env,
              containers: updatedEnvContainers,
              publicContainers: containerToRemove 
                ? env.publicContainers.filter(name => name !== containerToRemove.name)
                : env.publicContainers,
            };
          })
        };
      }
      
      const newState = {
        ...prev,
        containers: updatedContainers,
        project: updatedProject
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('unhazzle-deployment-state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Remove database service from resources and clean up container references
  const removeDatabase = () => {
    setState(prev => {
      // Toggle off DB access and remove related env vars from all containers
      const cleanedContainers = (prev.containers || []).map(c => {
        if (!c.serviceAccess?.database) return c;
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
                containers: cleanedContainers,
                database: undefined,
              };
            }
            return env;
          })
        };
      }

      const newState = { 
        ...prev, 
        containers: cleanedContainers, 
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

  // Remove cache service from resources and clean up container references
  const removeCache = () => {
    setState(prev => {
      // Toggle off cache access and remove related env vars from all containers
      const cleanedContainers = (prev.containers || []).map(c => {
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
                containers: cleanedContainers,
                cache: undefined,
              };
            }
            return env;
          })
        };
      }

      const newState = { 
        ...prev, 
        containers: cleanedContainers, 
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
      
      const publicContainers = (prev.containers || [])
        .filter(c => c.exposure === 'public')
        .map(c => c.name);
      
      // Dev environment (current deployment)
      const devEnv: Environment = {
        id: 'env-dev-' + timestamp,
        name: 'dev',
        slug: 'dev',
        type: 'standard' as EnvironmentType,
        status: 'active' as EnvironmentStatus,
        deployed: true,
        deployedAt: now,
        pendingChanges: false,
        createdAt: now,
        baseDomain: `dev.${projectSlug}.demo.unhazzle.io`,
        publicContainers,
        containers: prev.containers || [],
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
    const publicContainers = (envData.containers || [])
      .filter(c => c.exposure === 'public')
      .map(c => c.name);

    const newEnv: Environment = {
      id: `env-${slug}-${Date.now()}`,
      slug,
      type: envData.type || 'standard',
      status: envData.status || 'active',
      deployed: envData.deployed || false,
      deployedAt: envData.deployedAt,
      pendingChanges: envData.pendingChanges || false,
      createdAt: now,
      baseDomain: `${slug}.${state.project.slug}.demo.unhazzle.io`,
      publicContainers,
      containers: envData.containers || [],
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
          // Recalculate publicContainers if containers changed
          if (updates.containers) {
            updatedEnv.publicContainers = updates.containers
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
      const updatedEnvironments = prev.project.environments.map(env => 
        env.id === envId 
          ? { ...env, status: 'deleted' as EnvironmentStatus }
          : env
      );

      const prEnvCount = updatedEnvironments.filter(e => e.type === 'pr' && e.status !== 'deleted').length;
      const standardEnvCount = updatedEnvironments.filter(e => e.type === 'standard' && e.status !== 'deleted').length;

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

  const cloneEnvironment = (sourceEnvId: string, newName: string): Environment => {
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
      containers: JSON.parse(JSON.stringify(sourceEnv.containers)), // Deep clone
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
      containers: JSON.parse(JSON.stringify(sourceEnv.containers)),
      database: sourceEnv.database ? JSON.parse(JSON.stringify(sourceEnv.database)) : undefined,
      cache: sourceEnv.cache ? JSON.parse(JSON.stringify(sourceEnv.cache)) : undefined,
      status: 'provisioning', // Trigger redeploy
    });

    // After a short delay, mark as active (simulated deployment)
    setTimeout(() => {
      updateEnvironmentConfig(targetEnvId, { status: 'active' });
    }, 100);
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

  const pauseEnvironment = (envId: string) => {
    setState(prev => {
      if (!prev.project) return prev;

      const updatedEnvironments = prev.project.environments.map(env => {
        if (env.id === envId && env.status === 'active') {
          // Mark as paused - in a real system, this would scale replicas to 0
          // and stop database/cache services
          return {
            ...env,
            status: 'paused' as EnvironmentStatus,
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
        if (env.id === envId && env.status === 'paused') {
          // Mark as provisioning, then transition to active
          // In a real system, this would restore replicas and restart services
          return {
            ...env,
            status: 'provisioning' as EnvironmentStatus,
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

      // Simulate provisioning delay, then mark as active
      setTimeout(() => {
        setState(current => {
          if (!current.project) return current;

          const envs = current.project.environments.map(e => 
            e.id === envId && e.status === 'provisioning'
              ? { ...e, status: 'active' as EnvironmentStatus }
              : e
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

      const newContainers: ContainerConfig[] = images.map((img, idx) => ({
        id: `container-${Date.now()}-${idx}`,
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
        environmentVariables: []
      }));

      const updatedEnvironments = prev.project.environments.map(e => {
        if (e.id === environmentId) {
          return {
            ...e,
            containers: [...e.containers, ...newContainers],
            publicContainers: [...e.publicContainers, ...newContainers.filter(c => c.exposure === 'public').map(c => c.name)]
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
            status: 'active' as EnvironmentStatus,
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

  return (
    <DeploymentContext.Provider
      value={{
        state,
        updateState,
        updateUser,
        updateQuestionnaire,
        updateApplication,
        addContainer,
        clearContainers,
        updateContainer,
        removeContainer,
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
