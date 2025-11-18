export type TrafficBucket = '<1k' | '1k-10k' | '10k-100k' | '100k-1m' | '1m+';
export type LatencyBucket = '<50ms' | '50-200ms' | '200-500ms' | '>500ms';
export type WorkloadType = 'cpu' | 'memory' | 'io' | 'balanced';
export type StartupBucket = '<5s' | '5-15s' | '15-30s' | '>30s';
export type Spikiness = 'steady' | 'daily' | 'weekly' | 'unpredictable';

export interface QuestionnaireAnswers {
  traffic: TrafficBucket;
  latency: LatencyBucket;
  workload: WorkloadType;
  startup: StartupBucket;
  spikiness: Spikiness;
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

function cpuMemFromLatency(latency: LatencyBucket): { cpu: number; memGB: number; threshold: number } {
  switch (latency) {
    case '<50ms':
      return { cpu: 2, memGB: 4, threshold: 50 };
    case '50-200ms':
      return { cpu: 1, memGB: 2, threshold: 70 };
    case '200-500ms':
      return { cpu: 0.5, memGB: 1, threshold: 80 };
    case '>500ms':
    default:
      return { cpu: 0.5, memGB: 1, threshold: 85 };
  }
}

function cpuMemFromWorkload(workload: WorkloadType): { cpu: number; memGB: number } {
  switch (workload) {
    case 'cpu':
      return { cpu: 4, memGB: 2 };
    case 'memory':
      return { cpu: 1, memGB: 8 };
    case 'io':
      return { cpu: 1, memGB: 2 };
    case 'balanced':
    default:
      return { cpu: 2, memGB: 4 };
  }
}

function baseReplicasFromTraffic(traffic: TrafficBucket): number {
  switch (traffic) {
    case '<1k':
      return 1;
    case '1k-10k':
      return 1;
    case '10k-100k':
      return 2;
    case '100k-1m':
      return 5;
    case '1m+':
    default:
      return 8; // Custom/high scale baseline (will be explained in rationale)
  }
}

function hpaMinMaxFromSpikiness(
  spikiness: Spikiness,
  base: number,
  startup: StartupBucket
): { min: number; max: number } {
  let min = base;
  let multiplier = 2;

  if (spikiness === 'daily') {
    min = Math.max(1, Math.min(2, base));
    multiplier = 3;
  } else if (spikiness === 'weekly') {
    min = Math.max(1, Math.min(2, base));
    multiplier = 5;
  } else if (spikiness === 'unpredictable') {
    min = Math.max(2, Math.min(3, base));
    multiplier = 10;
  }

  // Adjust for slow startups: keep min higher to avoid cold-start impact
  if (startup === '>30s') {
    min = Math.max(min, base);
  } else if (startup === '15-30s') {
    min = Math.max(min, 2);
  }

  return { min, max: min * multiplier };
}

function cooldownFromStartup(startup: StartupBucket): number {
  switch (startup) {
    case '<5s':
      return 2;
    case '5-15s':
      return 5;
    case '15-30s':
      return 10;
    case '>30s':
    default:
      return 15;
  }
}

function formatCpu(cpu: number): string {
  return `${cpu % 1 === 0 ? cpu.toFixed(0) : cpu} vCPU`;
}

function formatMem(memGB: number): string {
  return `${memGB}GB`;
}

export function generateRecommendations(a: QuestionnaireAnswers): Recommendations {
  const base = baseReplicasFromTraffic(a.traffic);
  const lat = cpuMemFromLatency(a.latency);
  const wl = cpuMemFromWorkload(a.workload);

  const cpu = Math.max(lat.cpu, wl.cpu);
  const mem = Math.max(lat.memGB, wl.memGB);

  const { min, max } = hpaMinMaxFromSpikiness(a.spikiness, base, a.startup);
  const cooldown = cooldownFromStartup(a.startup);

  const rationale = `${a.spikiness} traffic + ${a.latency} latency and ${a.workload} workload ⇒ ${formatCpu(cpu)} / ${formatMem(mem)} per replica with HPA ${min}–${max}, scale at ${lat.threshold}% CPU, ${cooldown}m cooldown.`;

  return {
    replicasBase: base,
    cpuPerReplica: formatCpu(cpu),
    memoryPerReplica: formatMem(mem),
    hpaMin: min,
    hpaMax: max,
    hpaThreshold: lat.threshold,
    hpaCooldown: cooldown,
    rationale,
  };
}
