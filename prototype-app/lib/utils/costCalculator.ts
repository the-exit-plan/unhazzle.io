// Utility to calculate cost based on resource configuration
import { ResourceConfig, CostBreakdown, QuestionnaireAnswers } from '../context/DeploymentContext';

export function calculateCost(
  resources: ResourceConfig,
  answers: QuestionnaireAnswers
): CostBreakdown {
  // Base application cost (per replica range)
  const applicationCost = calculateApplicationCost(resources.replicas, resources.cpu, resources.memory);

  // Database cost
  const databaseCost = resources.database
    ? calculateDatabaseCost(resources.database.storage, resources.database.replicas)
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

function calculateDatabaseCost(storage: string, replicas: string): number {
  const storageGB = parseFloat(storage);

  // Database runs as container on shared server
  // CX22 (2 vCPU, 4 GB) for small DB: €4.99/month
  // CX33 (4 vCPU, 8 GB) for medium DB: €5.49/month
  let computeCost = storageGB >= 50 ? 5.49 : 4.99;

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
