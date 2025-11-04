'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { CostBreakdown } from '@/lib/context/DeploymentContext';

export default function ReviewAndDeploy() {
  const router = useRouter();
  const { state, updateCost, updateContainer, updateResources } = useDeployment();
  
  const [cost, setCost] = useState<CostBreakdown | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Calculate costs for all containers
  useEffect(() => {
    if (!state.resources || !state.questionnaire) {
      router.push('/');
      return;
    }

    // Small delay to ensure state has propagated from context
    const timer = setTimeout(() => {
      recalculateCost();
    }, 10);

    return () => clearTimeout(timer);
  }, [state.resources, state.questionnaire, state.containers, router]);

  // Helper to parse CPU values (handles numeric strings and " vCPU" suffix)
  const parseCPU = (cpu: string | number): number => {
    if (typeof cpu === 'number') {
      return cpu;
    }
    
    const cleanCPU = cpu.trim().replace(' vCPU', '').replace('vCPU', '');
    const value = parseFloat(cleanCPU);
    
    if (isNaN(value)) {
      console.error('Invalid CPU value:', cpu);
      return 0;
    }
    
    return value;
  };

  // Helper to parse memory values with units (MB, GB)
  const parseMemoryToGB = (memory: string): number => {
    const cleanMemory = memory.trim();
    const value = parseFloat(cleanMemory);
    
    if (isNaN(value)) {
      console.error('Invalid memory value:', memory);
      return 0;
    }
    
    if (cleanMemory.includes('MB')) {
      return value / 1024; // Convert MB to GB
    }
    // Remove 'GB' suffix if present and return the numeric value
    return value;
  };

  // Helper to parse storage values with units (GB, TB)
  const parseStorageToGB = (storage: string | number): number => {
    if (typeof storage === 'number') {
      return storage; // Already a number in GB
    }
    
    const cleanStorage = storage.trim();
    const value = parseFloat(cleanStorage);
    
    if (isNaN(value)) {
      console.error('Invalid storage value:', storage);
      return 0;
    }
    
    if (cleanStorage.includes('TB')) {
      return value * 1000; // Convert TB to GB (1TB = 1000GB)
    }
    // Remove 'GB' suffix if present and return the numeric value
    return value;
  };

  // Helper to calculate container cost (used both in display and total calculation)
  const calculateContainerCost = (container: any) => {
    const cpuValue = parseCPU(container.resources.cpu);
    const cpuCost = cpuValue * 7.0; // €7/vCPU
    const memoryGB = parseMemoryToGB(container.resources.memory);
    const memoryCost = memoryGB * 3.5; // €3.5/GB
    const replicaCost = (cpuCost + memoryCost) * container.resources.replicas.min;
    
    // Volume cost: storage + backups
    let volumeCost = 0;
    if (container.volume) {
      const storageGB = parseStorageToGB(container.volume.sizeGB);
      const storageCost = storageGB * 0.044; // €0.044/GB/month
      const backupCost = container.volume.backupFrequency !== 'disabled' 
        ? replicaCost * 0.20 
        : 0;
      volumeCost = storageCost + backupCost;
    }
    
    return replicaCost + volumeCost;
  };

  const recalculateCost = () => {
    if (!state.resources) return;

    console.log('=== COST CALCULATION START ===');
    
    // Calculate total cost across all containers
    let totalApplicationCost = 0;
    
    state.containers.forEach((container, index) => {
      const containerCost = calculateContainerCost(container);
      console.log(`Container ${index + 1}:`, {
        cpu: container.resources.cpu,
        memory: container.resources.memory,
        replicas: container.resources.replicas.min,
        volume: container.volume?.sizeGB,
        cost: containerCost.toFixed(2)
      });
      totalApplicationCost += containerCost;
    });

    console.log('Total Application Cost:', totalApplicationCost.toFixed(2));

    // Database and cache costs (shared resources)
    let databaseCost = 0;
    if (state.resources.database) {
      const dbCPU = parseCPU(state.resources.database.cpu);
      const dbMemory = parseMemoryToGB(state.resources.database.memory);
      const dbStorageGB = parseStorageToGB(state.resources.database.storage);
      
      databaseCost = (dbCPU * 10) + (dbMemory * 4) + (dbStorageGB * 0.10);
      
      console.log('Database:', {
        cpu: state.resources.database.cpu,
        cpuParsed: dbCPU,
        memory: state.resources.database.memory,
        memoryGB: dbMemory.toFixed(2),
        storage: state.resources.database.storage,
        storageGB: dbStorageGB.toFixed(2),
        cost: databaseCost.toFixed(2)
      });
    }

    let cacheCost = 0;
    if (state.resources.cache) {
      const cacheMemoryGB = parseMemoryToGB(state.resources.cache.memory);
      cacheCost = cacheMemoryGB * 5.0;
      
      console.log('Cache:', {
        memory: state.resources.cache.memory,
        memoryGB: cacheMemoryGB.toFixed(2),
        cost: cacheCost.toFixed(2)
      });
    }

    const loadBalancerCost = 10.0;

    const calculatedCost: CostBreakdown = {
      application: totalApplicationCost,
      database: state.resources.database ? databaseCost : undefined,
      cache: state.resources.cache ? cacheCost : undefined,
      loadBalancer: loadBalancerCost,
      bandwidth: 0,
      total: totalApplicationCost + databaseCost + cacheCost + loadBalancerCost
    };

    console.log('=== FINAL COST ===', {
      application: calculatedCost.application.toFixed(2),
      database: calculatedCost.database?.toFixed(2),
      cache: calculatedCost.cache?.toFixed(2),
      loadBalancer: calculatedCost.loadBalancer.toFixed(2),
      total: calculatedCost.total.toFixed(2)
    });

    setCost(calculatedCost);
    updateCost(calculatedCost);
  };

  const recalculateAndUpdateCost = () => {
    // Just show the loading state; the useEffect will trigger recalculation
    // when state.resources or state.containers updates
    setIsRecalculating(true);
    
    // Clear the loading state after a short delay
    setTimeout(() => {
      setIsRecalculating(false);
    }, 150);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      router.push('/deploying');
    }, 500);
  };

  if (!cost || !state.resources) {
    return null;
  }

  const resources = state.resources;
  const containerCount = state.containers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>📊</span>
            <span>Review & Edit Configuration</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Ready to Deploy
          </h1>
          <p className="text-lg text-slate-600">
            Review and adjust resources before deployment
          </p>
        </div>

        {/* Cost Summary - Hero Section */}
        <div className={`bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 mb-6 text-white transition-opacity duration-150 ${isRecalculating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="text-center mb-6">
            <p className="text-purple-100 text-sm font-medium mb-2">ESTIMATED MONTHLY COST</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-bold">€{cost.total.toFixed(2)}</span>
              <span className="text-2xl text-purple-100">/month</span>
            </div>
            <p className="text-purple-100 text-sm mt-3">
              💡 {isRecalculating ? 'Recalculating...' : 'Adjust resources below to see price updates'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Application</p>
                  <p className="text-2xl font-bold">€{cost.application.toFixed(2)}</p>
                  <p className="text-purple-200 text-xs mt-1">{containerCount} app{containerCount > 1 ? 's' : ''}</p>
                </div>
                <div className="text-3xl">🚀</div>
              </div>
            </div>
            {cost.database !== undefined && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Database</p>
                    <p className="text-2xl font-bold">€{cost.database.toFixed(2)}</p>
                  </div>
                  <div className="text-3xl">🐘</div>
                </div>
              </div>
            )}
            {cost.cache !== undefined && cost.cache > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Cache</p>
                    <p className="text-2xl font-bold">€{cost.cache.toFixed(2)}</p>
                  </div>
                  <div className="text-3xl">⚡</div>
                </div>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Load Balancer & SSL</p>
                  <p className="text-2xl font-bold">€{cost.loadBalancer.toFixed(2)}</p>
                </div>
                <div className="text-3xl">⚖️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Container Cards (Dynamic - one per container) */}
          {state.containers.map((container, index) => {
            const totalContainerCost = calculateContainerCost(container);

            return (
              <div key={container.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>🚀</span>
                    <span>{container.name}</span>
                  </h3>
                  <button
                    onClick={() => router.push(`/resources#container-${container.id}`)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-2 py-1 rounded hover:bg-purple-50 transition"
                  >
                    Edit Resources
                  </button>
                </div>
                
                {/* Public Endpoint Info */}
                {container.exposure === 'public' && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 text-lg">ℹ️</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Public Endpoint Available</p>
                        <p className="text-xs text-blue-700 mt-1">
                          A secure public domain will be automatically provisioned after deployment
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">CPU</span>
                    <select
                      value={container.resources.cpu}
                      onChange={(e) => {
                        updateContainer(container.id, {
                          resources: { ...container.resources, cpu: e.target.value }
                        });
                        recalculateAndUpdateCost();
                      }}
                      disabled={isRecalculating}
                      className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="0.25">0.25 vCPU</option>
                      <option value="0.5">0.5 vCPU</option>
                      <option value="1">1 vCPU</option>
                      <option value="2">2 vCPU</option>
                      <option value="4">4 vCPU</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Memory</span>
                    <select
                      value={container.resources.memory}
                      onChange={(e) => {
                        updateContainer(container.id, {
                          resources: { ...container.resources, memory: e.target.value }
                        });
                        recalculateAndUpdateCost();
                      }}
                      disabled={isRecalculating}
                      className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="0.5GB">0.5GB</option>
                      <option value="1GB">1GB</option>
                      <option value="2GB">2GB</option>
                      <option value="4GB">4GB</option>
                      <option value="8GB">8GB</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Replicas</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={container.resources.replicas.min}
                      onChange={(e) => {
                        const newMin = parseInt(e.target.value) || 1;
                        if (newMin > 0 && newMin <= 10) {
                          updateContainer(container.id, {
                            resources: {
                              ...container.resources,
                              replicas: {
                                ...container.resources.replicas,
                                min: newMin
                              }
                            }
                          });
                          recalculateAndUpdateCost();
                        }
                      }}
                      disabled={isRecalculating}
                      className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm font-semibold hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {container.volume && (
                    <>
                      <div className="border-t border-slate-200 my-3 pt-3">
                        <div className="flex items-center gap-1 mb-2">
                          <span>💾</span>
                          <span className="text-slate-700 font-semibold text-xs">Persistent Volume</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Size</span>
                        <select
                          value={container.volume.sizeGB}
                          onChange={(e) => {
                            updateContainer(container.id, {
                              volume: {
                                ...container.volume!,
                                sizeGB: parseInt(e.target.value)
                              }
                            });
                            recalculateAndUpdateCost();
                          }}
                          disabled={isRecalculating}
                          className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value={10}>10GB</option>
                          <option value={20}>20GB</option>
                          <option value={50}>50GB</option>
                          <option value={100}>100GB</option>
                          <option value={250}>250GB</option>
                          <option value={500}>500GB</option>
                        </select>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Mount path</span>
                        <code className="text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                          {container.volume.mountPath}
                        </code>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Exposure</span>
                    <span className="font-semibold">
                      {container.exposure === 'public' ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Port</span>
                    <code className="bg-slate-100 px-2 py-1 rounded text-slate-900 font-mono text-xs">
                      {container.port}
                    </code>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between font-semibold">
                      <span className="text-purple-600">App Cost:</span>
                      <span className="text-purple-900">€{totalContainerCost.toFixed(2)}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Database Card */}
          {resources.database && (() => {
            const dbCPU = parseCPU(resources.database.cpu);
            const dbMemory = parseMemoryToGB(resources.database.memory);
            const dbStorageGB = parseStorageToGB(resources.database.storage);
            const databaseCost = (dbCPU * 10) + (dbMemory * 4) + (dbStorageGB * 0.10);
            
            return (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>🐘</span>
                    <span>Database ({resources.database.engine.toUpperCase()})</span>
                  </h3>
                  <button
                    onClick={() => router.push('/resources#database')}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-2 py-1 rounded hover:bg-purple-50 transition"
                  >
                    Edit Resources
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">CPU</span>
                    <select
                      value={resources.database.cpu}
                      onChange={(e) => {
                        updateResources({
                          ...resources,
                          database: { ...resources.database!, cpu: e.target.value }
                        });
                        recalculateAndUpdateCost();
                      }}
                      disabled={isRecalculating}
                      className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="1 vCPU">1 vCPU</option>
                      <option value="2 vCPU">2 vCPU</option>
                      <option value="4 vCPU">4 vCPU</option>
                      <option value="8 vCPU">8 vCPU</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Memory</span>
                    <select
                      value={resources.database.memory}
                      onChange={(e) => {
                        updateResources({
                          ...resources,
                          database: { ...resources.database!, memory: e.target.value }
                        });
                        recalculateAndUpdateCost();
                      }}
                      disabled={isRecalculating}
                      className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="2GB">2GB</option>
                      <option value="4GB">4GB</option>
                      <option value="8GB">8GB</option>
                      <option value="16GB">16GB</option>
                      <option value="32GB">32GB</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Storage</span>
                    <select
                      value={resources.database.storage}
                      onChange={(e) => {
                        updateResources({
                          ...resources,
                          database: { ...resources.database!, storage: e.target.value }
                        });
                        recalculateAndUpdateCost();
                      }}
                      disabled={isRecalculating}
                      className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="10GB">10GB</option>
                      <option value="20GB">20GB</option>
                      <option value="50GB">50GB</option>
                      <option value="100GB">100GB</option>
                      <option value="250GB">250GB</option>
                      <option value="500GB">500GB</option>
                      <option value="1TB">1TB</option>
                    </select>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between font-semibold">
                      <span className="text-green-600">Database Cost:</span>
                      <span className="text-green-900">€{databaseCost.toFixed(2)}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cache Card */}
          {resources.cache && (() => {
            const cacheMemoryGB = parseMemoryToGB(resources.cache.memory);
            const cacheCost = cacheMemoryGB * 5.0;
            
            return (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>⚡</span>
                    <span>Cache ({resources.cache.engine})</span>
                  </h3>
                  <button
                    onClick={() => router.push('/resources#cache')}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-2 py-1 rounded hover:bg-purple-50 transition"
                  >
                    Edit Resources
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Memory</span>
                    <select
                      value={resources.cache.memory}
                      onChange={(e) => {
                        updateResources({
                          ...resources,
                          cache: { ...resources.cache!, memory: e.target.value }
                        });
                        recalculateAndUpdateCost();
                      }}
                      disabled={isRecalculating}
                      className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="256MB">256MB</option>
                      <option value="512MB">512MB</option>
                      <option value="1GB">1GB</option>
                      <option value="2GB">2GB</option>
                      <option value="4GB">4GB</option>
                      <option value="8GB">8GB</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Persistence</span>
                    <span className="text-slate-900 font-semibold">{resources.cache.persistence}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between font-semibold">
                      <span className="text-red-600">Cache Cost:</span>
                      <span className="text-red-900">€{cacheCost.toFixed(2)}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* What's Included */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>✨</span>
            <span>Benefit from these built-in unhazzle features</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Infrastructure</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Hetzner enterprise servers (Germany)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>NVMe SSD storage (RAID 10)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>10 Gbit/s network</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>20 TB bandwidth included</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">High Availability</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Auto-scaling (min-max replicas)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Zero-downtime deployments</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Health check monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Automatic failover</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Security & Compliance</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Free SSL certificates</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>DDoS protection</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Secrets encryption (AES-256)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>GDPR compliant (EU data)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>💰</span>
            <span>Transparent pricing</span>
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            This estimate is based on your current configuration. Your actual costs may vary based on:
          </p>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• <strong>Infrastructure costs:</strong> Powered by Hetzner Cloud (Germany)</li>
            <li>• <strong>Margin included:</strong> Total price includes our 30% service margin for platform management</li>
            <li>• <strong>Auto-scaling:</strong> Costs increase only when traffic demands more replicas</li>
            <li>• <strong>Bandwidth:</strong> First 20 TB included, then €1.00/TB in EU</li>
            <li>• <strong>Storage:</strong> Database and volumes billed at €0.044/GB/month</li>
            <li>• <strong>No hidden fees:</strong> What you see is what you pay</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/resources')}
            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            ← Back to Resources
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-10 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Deploy Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
