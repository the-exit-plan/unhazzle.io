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

  // Calculate costs
  useEffect(() => {
    if (!state.domain || !state.resources || !state.questionnaire) {
      router.push('/');
      return;
    }

    // Get volume config from first container if exists
    const volumeConfig = state.containers?.[0]?.volume;
    const calculatedCost = calculateCost(state.resources, state.questionnaire, volumeConfig);
    setCost(calculatedCost);
    updateCost(calculatedCost);
  }, [state.domain, state.resources, state.questionnaire, state.containers, router]); // Removed updateCost from deps

  const recalculateAndUpdateCost = (newConfig: typeof state.resources) => {
    if (!state.questionnaire || !newConfig) return;
    
    setIsRecalculating(true);
    
    // Use setTimeout to ensure the blur effect is visible
    setTimeout(() => {
      const volumeConfig = state.containers?.[0]?.volume;
      const newCost = calculateCost(newConfig, state.questionnaire!, volumeConfig);
      
      setCost(newCost);
      updateCost(newCost);
      updateResources(newConfig);
      
      setIsRecalculating(false);
    }, 150);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    // Navigate to deployment progress page
    setTimeout(() => {
      router.push('/deploying');
    }, 500);
  };

  if (!cost || !state.resources) {
    return null;
  }

  // Extract resources to avoid null checks
  const resources = state.resources;

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
            Review and adjust resources to optimize your configuration
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Application</p>
                  <p className="text-2xl font-bold">€{cost.application.toFixed(2)}</p>
                  {state.containers?.[0]?.volume && (
                    <p className="text-purple-200 text-xs mt-1">Includes {state.containers[0].volume.sizeGB}GB volume</p>
                  )}
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
                    {resources.database && (
                      <p className="text-purple-200 text-xs mt-1">Includes {resources.database.storage} storage</p>
                    )}
                  </div>
                  <div className="text-3xl">🐘</div>
                </div>
              </div>
            )}
            {cost.cache !== undefined && cost.cache > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Cache (Redis)</p>
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

        {/* Configuration Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Application - Editable */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>🚀</span>
                <span>Application</span>
              </h3>
              <button
                onClick={() => router.push('/resources#application')}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-2 py-1 rounded hover:bg-purple-50 transition"
              >
                Edit Resources
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">CPU</span>
                <div className="flex items-center gap-2">
                  <select
                    value={resources.cpu}
                    onChange={(e) => {
                      const newConfig = {
                        replicas: resources.replicas,
                        cpu: e.target.value,
                        memory: resources.memory,
                        database: resources.database,
                        cache: resources.cache
                      };
                      recalculateAndUpdateCost(newConfig);
                    }}
                    disabled={isRecalculating}
                    className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="0.5 vCPU">0.5 vCPU</option>
                    <option value="1 vCPU">1 vCPU</option>
                    <option value="2 vCPU">2 vCPU</option>
                    <option value="4 vCPU">4 vCPU</option>
                    <option value="8 vCPU">8 vCPU</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Memory</span>
                <div className="flex items-center gap-2">
                  <select
                    value={resources.memory}
                    onChange={(e) => {
                      const newConfig = {
                        replicas: resources.replicas,
                        cpu: resources.cpu,
                        memory: e.target.value,
                        database: resources.database,
                        cache: resources.cache
                      };
                      recalculateAndUpdateCost(newConfig);
                    }}
                    disabled={isRecalculating}
                    className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="512MB">512MB</option>
                    <option value="1GB">1GB</option>
                    <option value="2GB">2GB</option>
                    <option value="4GB">4GB</option>
                    <option value="8GB">8GB</option>
                    <option value="16GB">16GB</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Replicas</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={resources.replicas.min}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value) || 1;
                    if (newMin > 0 && newMin <= 50) {
                      const newConfig = {
                        replicas: { min: newMin, max: Math.max(newMin, resources.replicas.max) },
                        cpu: resources.cpu,
                        memory: resources.memory,
                        database: resources.database,
                        cache: resources.cache
                      };
                      recalculateAndUpdateCost(newConfig);
                    }
                  }}
                  disabled={isRecalculating}
                  className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-sm font-semibold hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {state.containers?.[0]?.volume && (
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
                      value={state.containers[0].volume.sizeGB}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value);
                        const container = state.containers![0];
                        updateContainer(container.id, {
                          volume: {
                            ...container.volume!,
                            sizeGB: newSize
                          }
                        });
                        
                        // Recalculate cost with new volume size
                        const newConfig = {
                          replicas: resources.replicas,
                          cpu: resources.cpu,
                          memory: resources.memory,
                          database: resources.database,
                          cache: resources.cache
                        };
                        recalculateAndUpdateCost(newConfig);
                      }}
                      disabled={isRecalculating}
                      className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value={10}>10GB</option>
                      <option value={20}>20GB</option>
                      <option value={50}>50GB</option>
                      <option value={100}>100GB</option>
                      <option value={200}>200GB</option>
                      <option value={500}>500GB</option>
                      <option value={1000}>1TB</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mount path</span>
                    <code className="text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {state.containers[0].volume.mountPath}
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Database - Editable */}
          {resources.database && (
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
                      const newConfig = {
                        replicas: resources.replicas,
                        cpu: resources.cpu,
                        memory: resources.memory,
                        database: { ...resources.database!, cpu: e.target.value },
                        cache: resources.cache
                      };
                      recalculateAndUpdateCost(newConfig);
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
                      const newConfig = {
                        replicas: resources.replicas,
                        cpu: resources.cpu,
                        memory: resources.memory,
                        database: { ...resources.database!, memory: e.target.value },
                        cache: resources.cache
                      };
                      recalculateAndUpdateCost(newConfig);
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
                      const newConfig = {
                        replicas: resources.replicas,
                        cpu: resources.cpu,
                        memory: resources.memory,
                        database: { ...resources.database!, storage: e.target.value },
                        cache: resources.cache
                      };
                      recalculateAndUpdateCost(newConfig);
                    }}
                    disabled={isRecalculating}
                    className="text-slate-900 font-semibold px-2 py-1 border border-slate-200 rounded hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="10GB">10GB</option>
                    <option value="20GB">20GB</option>
                    <option value="50GB">50GB</option>
                    <option value="100GB">100GB</option>
                    <option value="200GB">200GB</option>
                    <option value="500GB">500GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Cache - Editable */}
          {resources.cache && (
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
                      const newConfig = {
                        replicas: resources.replicas,
                        cpu: resources.cpu,
                        memory: resources.memory,
                        database: resources.database,
                        cache: { ...resources.cache!, memory: e.target.value }
                      };
                      recalculateAndUpdateCost(newConfig);
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
              </div>
            </div>
          )}

          {/* Domain */}
          <div className="bg-white rounded-xl shadow-lg p-6">
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
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-600 block mb-1">Default URL</span>
                <code className="text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded block">
                  https://{state.domain?.defaultSubdomain}
                </code>
              </div>
              {state.domain?.customDomain && (
                <div>
                  <span className="text-slate-600 block mb-1">Custom domain</span>
                  <code className="text-slate-900 font-mono text-xs bg-purple-100 px-2 py-1 rounded block">
                    https://{state.domain.customDomain}
                  </code>
                </div>
              )}
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded">
                <span>🔒</span>
                <span>SSL auto-provisioned</span>
              </div>
            </div>
          </div>

          {/* Environment */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🔐</span>
              <span>Environment</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Auto-generated vars</span>
                <span className="text-slate-900 font-semibold">
                  {state.environment?.autoGenerated.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">User secrets</span>
                <span className="text-slate-900 font-semibold">
                  {state.environment?.userSecrets.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-2 rounded">
                <span>🔐</span>
                <span>AES-256 encrypted</span>
              </div>
            </div>
          </div>
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
            onClick={() => router.back()}
            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            ← Back
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg px-12 py-4 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
