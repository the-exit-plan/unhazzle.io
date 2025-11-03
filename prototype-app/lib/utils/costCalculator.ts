// Utility to calculate cost based on resource configuration
import { ResourceConfig, CostBreakdown, QuestionnaireAnswers, VolumeConfig, DeploymentState } from '../context/DeploymentContext';

export function calculateCost(
  resources: ResourceConfig,
  answers: QuestionnaireAnswers,
  volumeConfig?: VolumeConfig,
  applicationCostForBackup?: number
): CostBreakdown {
  // Base application cost (per replica range)
  const baseApplicationCost = calculateApplicationCost(resources.replicas, resources.cpu, resources.memory);

  // Volume cost (if configured)
  const volumeCost = volumeConfig 
    ? calculateVolumeCost(volumeConfig, applicationCostForBackup || baseApplicationCost)
    : 0;

  // Total application cost (compute + volume)
  const applicationCost = baseApplicationCost + volumeCost;

  // Database cost
  const databaseCost = resources.database
    ? calculateDatabaseCost(
        resources.database.cpu,
        resources.database.memory,
        resources.database.storage,
        resources.database.replicas
      )
    : undefined;

  // Cache cost
  const cacheCost = resources.cache ? calculateCacheCost(resources.cache.memory) : undefined;

  // Load balancer + SSL
  const loadBalancerCost = 12;

  // Bandwidth estimate
  const bandwidthCost = estimateBandwidth(answers.traffic);

  const subtotal = applicationCost + (databaseCost || 0) + (cacheCost || 0) + loadBalancerCost + bandwidthCost;
  
  // Add 30% margin
  const total = Math.round(subtotal * 1.3 * 100) / 100;

  return {
    application: applicationCost,
    database: databaseCost,
    cache: cacheCost,
    loadBalancer: loadBalancerCost,
    bandwidth: bandwidthCost,
    total,
  };
}

function calculateVolumeCost(volume: VolumeConfig, containerCost: number): number {
  // Base storage cost: €0.044/GB/month
  const storageCost = volume.sizeGB * 0.044;
  
  // Backup cost: 20% of container compute cost (if enabled)
  let backupCost = 0;
  if (volume.backupFrequency !== 'disabled') {
    backupCost = containerCost * 0.20;
  }
  
  return Math.round((storageCost + backupCost) * 100) / 100;
}

function calculateApplicationCost(
  replicas: { min: number; max: number },
  cpu: string,
  memory: string
): number {
  // Parse CPU and memory
  const cpuCores = parseFloat(cpu);
  const memoryGB = parseFloat(memory);

  // Map to Hetzner CX instance type based on resources
  // Using Hetzner Shared Regular Performance pricing (Germany)
  let monthlyPerInstance: number;
  
  if (cpuCores <= 1 && memoryGB <= 2) {
    monthlyPerInstance = 4.99; // CX22: 2 vCPU, 4 GB
  } else if (cpuCores <= 2 && memoryGB <= 4) {
    monthlyPerInstance = 5.49; // CX33: 4 vCPU, 8 GB (split between 2 containers)
  } else if (cpuCores <= 4 && memoryGB <= 8) {
    monthlyPerInstance = 9.49; // CX43: 8 vCPU, 16 GB (split between 2 containers)
  } else {
    monthlyPerInstance = 17.49; // CX53: 16 vCPU, 32 GB
  }

  // Calculate based on average between min and max replicas
  const avgReplicas = (replicas.min + replicas.max) / 2;

  // Total monthly cost (containers share underlying servers)
  // For simplicity: 2 containers per server on average
  const serversNeeded = Math.ceil(avgReplicas / 2);
  
  return Math.round(serversNeeded * monthlyPerInstance);
}

function calculateDatabaseCost(cpu: string, memory: string, storage: string, replicas: string): number {
  const cpuCores = parseFloat(cpu);
  const memoryGB = parseFloat(memory);
  
  // Convert storage to GB (handle TB suffix)
  let storageGB: number;
  if (storage.includes('TB')) {
    storageGB = parseFloat(storage) * 1000;
  } else {
    storageGB = parseFloat(storage);
  }

  // Map to Hetzner CX instance type based on CPU and memory resources
  let computeCost: number;
  
  if (cpuCores <= 1 && memoryGB <= 2) {
    computeCost = 4.99; // CX22: 2 vCPU, 4 GB
  } else if (cpuCores <= 2 && memoryGB <= 4) {
    computeCost = 5.49; // CX33: 4 vCPU, 8 GB
  } else if (cpuCores <= 4 && memoryGB <= 8) {
    computeCost = 9.49; // CX43: 8 vCPU, 16 GB
  } else if (cpuCores <= 8 && memoryGB <= 16) {
    computeCost = 17.49; // CX53: 16 vCPU, 32 GB
  } else {
    computeCost = 34.49; // CX63: 32 vCPU, 64 GB
  }

  // Storage cost: Hetzner Block Storage @ €0.044/GB/month
  const storageCost = storageGB * 0.044;

  // Add cost for HA standby (doubles compute)
  if (replicas.includes('HA') || replicas.includes('Multi-region')) {
    computeCost *= 2;
  }

  return Math.round((computeCost + storageCost) * 100) / 100;
}

function calculateCacheCost(memory: string): number {
  const memoryMB = parseFloat(memory.replace('MB', '').replace('GB', '')) * (memory.includes('GB') ? 1024 : 1);
  
  // Redis runs as container on shared server
  // Small cache (< 1GB): Share with app server, no extra cost
  // Medium cache (1-2GB): CX22 instance €4.99/month
  // Large cache (> 2GB): CX33 instance €5.49/month
  
  if (memoryMB < 1024) {
    return 0; // Shared with application containers
  } else if (memoryMB <= 2048) {
    return 4.99;
  } else {
    return 5.49;
  }
}

function estimateBandwidth(traffic: string): number {
  switch (traffic) {
    case 'global':
      return 25;
    case 'burst':
      return 15;
    case 'steady':
      return 10;
    case 'regional':
      return 8;
    default:
      return 10;
  }
}

// Calculate monthly cost impact for resource changes
export function calculateContainerCostImpact(
  currentCpu: string,
  currentMemory: string,
  currentReplicas: { min: number; max: number },
  newCpu: string,
  newMemory: string,
  newReplicas: { min: number; max: number }
): number {
  const currentCost = calculateApplicationCost(currentReplicas, currentCpu, currentMemory);
  const newCost = calculateApplicationCost(newReplicas, newCpu, newMemory);
  return Math.round((newCost - currentCost) * 100) / 100;
}

export function calculateDatabaseCostImpact(
  currentDb: { cpu: string; memory: string; storage: string; replicas: string },
  newDb: { cpu: string; memory: string; storage: string; replicas: string }
): number {
  const currentCost = calculateDatabaseCost(currentDb.cpu, currentDb.memory, currentDb.storage, currentDb.replicas);
  const newCost = calculateDatabaseCost(newDb.cpu, newDb.memory, newDb.storage, newDb.replicas);
  return Math.round((newCost - currentCost) * 100) / 100;
}

export function calculateCacheCostImpact(
  currentMemory: string,
  newMemory: string
): number {
  const currentCost = calculateCacheCost(currentMemory);
  const newCost = calculateCacheCost(newMemory);
  return Math.round((newCost - currentCost) * 100) / 100;
}
