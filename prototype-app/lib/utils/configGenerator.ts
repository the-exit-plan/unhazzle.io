// Utility to generate intelligent resource configuration based on questionnaire answers
import { QuestionnaireAnswers, ResourceConfig } from '../context/DeploymentContext';

export function generateResourceConfig(answers: QuestionnaireAnswers): ResourceConfig {
  const { appType, traffic, database, cache } = answers;

  // Base configuration based on traffic pattern
  const baseConfig: ResourceConfig = {
    replicas: getReplicaConfig(traffic),
    cpu: getCPUConfig(traffic),
    memory: getMemoryConfig(traffic),
  };

  // Add database configuration if needed
  if (database !== 'none') {
    baseConfig.database = {
      engine: database,
      version: getDatabaseVersion(database),
      type: 'container',
      cpu: getDatabaseCPU(traffic),
      memory: getDatabaseMemory(traffic),
      storage: getStorageSize(traffic),
      backups: {
        enabled: true,
        retention: getBackupRetention(traffic),
        frequency: 'Daily at 2 AM UTC',
      },
      replicas: getDatabaseReplicas(traffic),
    };
  }

  // Add cache configuration if needed
  if (cache !== 'none') {
    baseConfig.cache = {
      engine: cache === 'redis' ? 'Redis' : 'Memcached',
      version: cache === 'redis' ? '7.0' : '1.6',
      memory: getCacheMemory(traffic, appType),
      evictionPolicy: 'allkeys-lru',
      persistence: appType === 'ecommerce' ? 'AOF (Append-Only File)' : 'None',
    };
  }

  return baseConfig;
}

function getReplicaConfig(traffic: string): { min: number; max: number } {
  switch (traffic) {
    case 'burst':
      return { min: 2, max: 10 };
    case 'global':
      return { min: 3, max: 15 };
    case 'regional':
      return { min: 1, max: 5 };
    case 'steady':
    default:
      return { min: 2, max: 8 };
  }
}

function getCPUConfig(traffic: string): string {
  return traffic === 'burst' || traffic === 'global' ? '2 vCPU' : '1 vCPU';
}

function getMemoryConfig(traffic: string): string {
  return traffic === 'burst' || traffic === 'global' ? '4GB' : '2GB';
}

function getDatabaseVersion(database: string): string {
  switch (database) {
    case 'postgres':
      return '15';
    case 'mysql':
      return '8.0';
    case 'mongodb':
      return '6.0';
    default:
      return '15';
  }
}

function getStorageSize(traffic: string): string {
  switch (traffic) {
    case 'global':
      return '100GB';
    case 'burst':
      return '50GB';
    default:
      return '20GB';
  }
}

function getBackupRetention(traffic: string): string {
  return traffic === 'global' ? '30 days' : '7 days';
}

function getDatabaseReplicas(traffic: string): string {
  return traffic === 'global' ? 'Multi-region read replicas' : 'Single instance with HA';
}

function getDatabaseCPU(traffic: string): string {
  switch (traffic) {
    case 'global':
      return '4 vCPU';
    case 'burst':
      return '2 vCPU';
    default:
      return '2 vCPU';
  }
}

function getDatabaseMemory(traffic: string): string {
  switch (traffic) {
    case 'global':
      return '8GB';
    case 'burst':
      return '4GB';
    default:
      return '4GB';
  }
}

function getCacheMemory(traffic: string, appType: string): string {
  if (traffic === 'global' || traffic === 'burst') {
    return '2GB';
  }
  return appType === 'ecommerce' ? '512MB' : '256MB';
}
