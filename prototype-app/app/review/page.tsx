'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { calculateCost } from '@/lib/utils/costCalculator';
import { CostBreakdown } from '@/lib/context/DeploymentContext';

export default function ReviewAndDeploy() {
  const router = useRouter();
  const { state, updateCost, updateResources, updateContainer } = useDeployment();
  
  const [cost, setCost] = useState<CostBreakdown | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Calculate costs for all containers
  useEffect(() => {
    if (!state.domain || !state.resources || !state.questionnaire) {
      router.push('/');
      return;
    }

    // Calculate total cost across all containers
    let totalApplicationCost = 0;
    
    state.containers.forEach(container => {
      // Base cost per container based on resources
      const cpuCost = parseFloat(container.resources.cpu) * 7.0; // €7/vCPU
      const memoryGB = parseFloat(container.resources.memory);
      const memoryCost = memoryGB * 3.5; // €3.5/GB
      const replicaCost = (cpuCost + memoryCost) * container.resources.replicas.min;
      
      // Volume cost if exists
      const volumeCost = container.volume ? container.volume.sizeGB * 0.044 : 0;
      
      totalApplicationCost += replicaCost + volumeCost;
    });

    // Database and cache costs (shared resources)
    let databaseCost = 0;
    if (state.resources.database) {
      const dbCPU = parseFloat(state.resources.database.cpu || '2');
      const dbMemory = parseFloat(state.resources.database.memory || '4');
      let dbStorageGB = parseFloat(state.resources.database.storage);
      
      if (state.resources.database.storage.includes('TB')) {
        dbStorageGB = parseFloat(state.resources.database.storage) * 1000;
      }
      
      databaseCost = (dbCPU * 10) + (dbMemory * 4) + (dbStorageGB * 0.10);
    }

    let cacheCost = 0;
    if (state.resources.cache) {
      // Convert cache memory to GB (handle MB suffix)
      const memoryValue = parseFloat(state.resources.cache.memory);
      const cacheMemoryGB = state.resources.cache.memory.includes('MB') ? memoryValue / 1024 : memoryValue;
      cacheCost = cacheMemoryGB * 5.0;
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

    setCost(calculatedCost);
    updateCost(calculatedCost);
  }, [state.domain, state.resources, state.questionnaire, state.containers, router]);

  const recalculateAndUpdateCost = (newConfig: typeof state.resources) => {
    if (!state.questionnaire || !newConfig) return;
    
    setIsRecalculating(true);
    
    setTimeout(() => {
      // Recalculate with new config
      let totalApplicationCost = 0;
      
      state.containers.forEach(container => {
        const cpuCost = parseFloat(container.resources.cpu) * 7.0;
        const memoryGB = parseFloat(container.resources.memory);
        const memoryCost = memoryGB * 3.5;
        const replicaCost = (cpuCost + memoryCost) * container.resources.replicas.min;
        const volumeCost = container.volume ? container.volume.sizeGB * 0.044 : 0;
        totalApplicationCost += replicaCost + volumeCost;
      });

      let databaseCost = 0;
      if (newConfig.database) {
        const dbCPU = parseFloat(newConfig.database.cpu || '2');
        const dbMemory = parseFloat(newConfig.database.memory || '4');
        let dbStorageGB = parseFloat(newConfig.database.storage);
        
        if (newConfig.database.storage.includes('TB')) {
          dbStorageGB = parseFloat(newConfig.database.storage) * 1000;
        }
        
        databaseCost = (dbCPU * 10) + (dbMemory * 4) + (dbStorageGB * 0.10);
      }

      let cacheCost = 0;
      if (newConfig.cache) {
        // Convert cache memory to GB (handle MB suffix)
        const memoryValue = parseFloat(newConfig.cache.memory);
        const cacheMemoryGB = newConfig.cache.memory.includes('MB') ? memoryValue / 1024 : memoryValue;
        cacheCost = cacheMemoryGB * 5.0;
      }

      const loadBalancerCost = 10.0;

      const newCost: CostBreakdown = {
        application: totalApplicationCost,
        database: newConfig.database ? databaseCost : undefined,
        cache: newConfig.cache ? cacheCost : undefined,
        loadBalancer: loadBalancerCost,
        bandwidth: 0,
        total: totalApplicationCost + databaseCost + cacheCost + loadBalancerCost
      };
      
      setCost(newCost);
      updateCost(newCost);
      updateResources(newConfig);
      
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>📊</span>
            <span>Review Multi-Container Architecture • {containerCount} Container{containerCount > 1 ? 's' : ''}</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Ready to Deploy
          </h1>
          <p className="text-lg text-slate-600">
            Review your multi-container architecture and cost breakdown
          </p>
        </div>

        {/* Cost Summary - Hero Section */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
          <div className="text-center mb-6">
            <p className="text-purple-100 text-sm font-medium mb-2">ESTIMATED MONTHLY COST</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-bold">€{cost.total.toFixed(2)}</span>
              <span className="text-2xl text-purple-100">/month</span>
            </div>
            <p className="text-purple-100 text-sm mt-3">
              💡 Go back to Resources to adjust configuration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Containers ({containerCount})</p>
                  <p className="text-2xl font-bold">€{cost.application.toFixed(2)}</p>
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
                  <p className="text-purple-100 text-sm">Load Balancer</p>
                  <p className="text-2xl font-bold">€{cost.loadBalancer.toFixed(2)}</p>
                </div>
                <div className="text-3xl">⚖️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>🏗️</span>
            <span>Architecture Overview</span>
          </h2>
          
          {/* Visual Architecture */}
          <div className="space-y-4">
            {/* Internet Layer */}
            <div className="flex items-center justify-center">
              <div className="px-6 py-3 bg-slate-100 border-2 border-slate-300 rounded-lg text-slate-700 font-medium">
                🌐 Internet Traffic
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-slate-300"></div>
            </div>

            {/* Load Balancer */}
            <div className="flex items-center justify-center">
              <div className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white font-semibold shadow-lg">
                ⚖️ Load Balancer + SSL
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-slate-300"></div>
            </div>

            {/* Containers Layer */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <span>🚀</span>
                <span>Application Containers ({containerCount})</span>
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.containers.map((container, index) => {
                  const displayName = container.imageUrl.split('/').pop()?.split(':')[0] || `container-${index + 1}`;
                  const cpuCost = parseFloat(container.resources.cpu) * 7.0;
                  const memoryGB = parseFloat(container.resources.memory);
                  const memoryCost = memoryGB * 3.5;
                  const replicaCost = (cpuCost + memoryCost) * container.resources.replicas.min;
                  const volumeCost = container.volume ? container.volume.sizeGB * 0.044 : 0;
                  const totalContainerCost = replicaCost + volumeCost;

                  return (
                    <div key={container.id} className={`bg-white border-2 border-purple-300 rounded-lg p-4 transition ${isRecalculating ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">{displayName}</h4>
                          <p className="text-xs text-slate-500">{container.exposure === 'public' ? '🌐 Public' : '🔒 Private'}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">CPU:</span>
                          <select
                            value={container.resources.cpu}
                            onChange={(e) => {
                              updateContainer(container.id, {
                                resources: { ...container.resources, cpu: e.target.value }
                              });
                              const updatedContainers = state.containers.map(c => 
                                c.id === container.id 
                                  ? { ...c, resources: { ...c.resources, cpu: e.target.value } }
                                  : c
                              );
                              const newConfig = { ...resources, application: { containers: updatedContainers } };
                              recalculateAndUpdateCost(newConfig);
                            }}
                            disabled={isRecalculating}
                            className="px-1.5 py-0.5 border border-purple-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                          >
                            <option value="0.25">0.25</option>
                            <option value="0.5">0.5</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="4">4</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Memory:</span>
                          <select
                            value={container.resources.memory}
                            onChange={(e) => {
                              updateContainer(container.id, {
                                resources: { ...container.resources, memory: e.target.value }
                              });
                              const updatedContainers = state.containers.map(c => 
                                c.id === container.id 
                                  ? { ...c, resources: { ...c.resources, memory: e.target.value } }
                                  : c
                              );
                              const newConfig = { ...resources, application: { containers: updatedContainers } };
                              recalculateAndUpdateCost(newConfig);
                            }}
                            disabled={isRecalculating}
                            className="px-1.5 py-0.5 border border-purple-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                          >
                            <option value="0.5GB">0.5GB</option>
                            <option value="1GB">1GB</option>
                            <option value="2GB">2GB</option>
                            <option value="4GB">4GB</option>
                            <option value="8GB">8GB</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Replicas:</span>
                          <select
                            value={container.resources.replicas.min}
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value);
                              updateContainer(container.id, {
                                resources: { 
                                  ...container.resources, 
                                  replicas: { 
                                    ...container.resources.replicas,
                                    min: newMin
                                  } 
                                }
                              });
                              const updatedContainers = state.containers.map(c => 
                                c.id === container.id 
                                  ? { 
                                      ...c, 
                                      resources: { 
                                        ...c.resources, 
                                        replicas: { 
                                          ...c.resources.replicas,
                                          min: newMin
                                        } 
                                      } 
                                    }
                                  : c
                              );
                              const newConfig = { ...resources, application: { containers: updatedContainers } };
                              recalculateAndUpdateCost(newConfig);
                            }}
                            disabled={isRecalculating}
                            className="px-1.5 py-0.5 border border-purple-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Port:</span>
                          <span className="font-mono text-slate-900">{container.port}</span>
                        </div>
                        {container.volume && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Volume:</span>
                            <span className="font-mono text-slate-900">{container.volume.sizeGB}GB</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-purple-200 mt-2">
                          <div className="flex justify-between font-semibold">
                            <span className="text-purple-600">Cost:</span>
                            <span className="text-purple-900">€{totalContainerCost.toFixed(2)}/mo</span>
                          </div>
                        </div>
                      </div>
                      {/* Service Access Badges */}
                      {(container.serviceAccess.database || container.serviceAccess.cache) && (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <p className="text-xs text-slate-600 mb-2">Connected to:</p>
                          <div className="flex flex-wrap gap-1">
                            {container.serviceAccess.database && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🐘 DB</span>
                            )}
                            {container.serviceAccess.cache && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚡ Cache</span>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Edit Button */}
                      <button
                        onClick={() => router.push('/resources')}
                        className="mt-3 w-full text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-3 py-1.5 rounded hover:bg-purple-50 transition"
                      >
                        Edit Configuration
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Infrastructure Services */}
            {(resources.database || resources.cache) && (
              <>
                <div className="flex justify-center gap-4">
                  {resources.database && <div className="w-0.5 h-8 bg-slate-300"></div>}
                  {resources.cache && <div className="w-0.5 h-8 bg-slate-300"></div>}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {resources.database && (
                    <div className={`bg-green-50 border-2 border-green-200 rounded-xl p-6 transition ${isRecalculating ? 'opacity-50' : ''}`}>
                      <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <span>🐘</span>
                        <span>PostgreSQL Database</span>
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">CPU:</span>
                          <select
                            value={resources.database.cpu}
                            onChange={(e) => {
                              const newConfig = {
                                ...resources,
                                database: resources.database ? { ...resources.database, cpu: e.target.value } : undefined
                              };
                              recalculateAndUpdateCost(newConfig);
                            }}
                            disabled={isRecalculating}
                            className="px-2 py-1 border border-green-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <option value="1 vCPU">1 vCPU</option>
                            <option value="2 vCPU">2 vCPU</option>
                            <option value="4 vCPU">4 vCPU</option>
                            <option value="8 vCPU">8 vCPU</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Memory:</span>
                          <select
                            value={resources.database.memory}
                            onChange={(e) => {
                              const newConfig = {
                                ...resources,
                                database: resources.database ? { ...resources.database, memory: e.target.value } : undefined
                              };
                              recalculateAndUpdateCost(newConfig);
                            }}
                            disabled={isRecalculating}
                            className="px-2 py-1 border border-green-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <option value="2GB">2GB</option>
                            <option value="4GB">4GB</option>
                            <option value="8GB">8GB</option>
                            <option value="16GB">16GB</option>
                            <option value="32GB">32GB</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Storage:</span>
                          <select
                            value={resources.database.storage}
                            onChange={(e) => {
                              const newConfig = {
                                ...resources,
                                database: resources.database ? { ...resources.database, storage: e.target.value } : undefined
                              };
                              recalculateAndUpdateCost(newConfig);
                            }}
                            disabled={isRecalculating}
                            className="px-2 py-1 border border-green-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
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
                        <div className="flex justify-between">
                          <span className="text-slate-600">Backups:</span>
                          <span className="font-semibold text-slate-900">{resources.database.backups.retention}</span>
                        </div>
                        <div className="pt-2 border-t border-green-200 flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Cost:</span>
                          <span className="font-bold text-green-900">€{(cost.database || 0).toFixed(2)}/mo</span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/resources')}
                        className="mt-4 w-full text-sm text-green-600 hover:text-green-700 font-medium border border-green-200 px-3 py-2 rounded-lg hover:bg-green-50 transition"
                      >
                        Edit Configuration
                      </button>
                    </div>
                  )}
                  {resources.cache && (
                    <div className={`bg-red-50 border-2 border-red-200 rounded-xl p-6 transition ${isRecalculating ? 'opacity-50' : ''}`}>
                      <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <span>⚡</span>
                        <span>Redis Cache</span>
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Memory:</span>
                          <select
                            value={resources.cache.memory}
                            onChange={(e) => {
                              const newConfig = {
                                ...resources,
                                cache: resources.cache ? { ...resources.cache, memory: e.target.value } : undefined
                              };
                              recalculateAndUpdateCost(newConfig);
                            }}
                            disabled={isRecalculating}
                            className="px-2 py-1 border border-red-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <option value="256MB">256MB</option>
                            <option value="512MB">512MB</option>
                            <option value="1GB">1GB</option>
                            <option value="2GB">2GB</option>
                            <option value="4GB">4GB</option>
                          </select>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Persistence:</span>
                          <span className="font-semibold text-slate-900">{resources.cache.persistence}</span>
                        </div>
                        <div className="pt-2 border-t border-red-200 flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Cost:</span>
                          <span className="font-bold text-red-900">€{(cost.cache || 0).toFixed(2)}/mo</span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/resources')}
                        className="mt-4 w-full text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition"
                      >
                        Edit Configuration
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Domain Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🌐</span>
              <span>Domain</span>
            </h3>
            <button
              onClick={() => router.push('/domain')}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-2 py-1 rounded hover:bg-purple-50 transition"
            >
              Edit Domain
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {state.domain?.customDomain ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">Custom Domain</span>
                  <code className="text-slate-900 font-mono font-semibold">{state.domain.customDomain}</code>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  ✓ SSL certificate will be automatically provisioned
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">Unhazzle Subdomain</span>
                  <code className="text-slate-900 font-mono font-semibold">{state.domain?.defaultSubdomain}.unhazzle.app</code>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  ✓ Free SSL included
                </div>
              </>
            )}
          </div>
        </div>

        {/* What's Included Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-100">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>✨</span>
            <span>Benefit from these built-in unhazzle features</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600">🔒</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">SSL/TLS Certificates</p>
                <p className="text-xs text-slate-600">Automatic HTTPS with Let's Encrypt</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600">⚡</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Auto-scaling</p>
                <p className="text-xs text-slate-600">Scales based on CPU/memory usage</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600">❤️</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Health Monitoring</p>
                <p className="text-xs text-slate-600">Automatic health checks and restarts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600">📊</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Observability</p>
                <p className="text-xs text-slate-600">Logs, metrics, and performance insights</p>
              </div>
            </div>
          </div>
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
                <span>Deploy Now</span>
                <span>🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
