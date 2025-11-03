'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { generateResourceConfig } from '@/lib/utils/configGenerator';
import { ResourceConfig } from '@/lib/context/DeploymentContext';

export default function Resources() {
  const router = useRouter();
  const { state, updateResources, updateEnvironment, updateContainer } = useDeployment();
  
  const [config, setConfig] = useState<ResourceConfig | null>(null);
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set());

  // Scroll to top on mount, or to hash target if present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2');
          }, 2000);
        }
      }, 300);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Generate intelligent defaults on mount
  useEffect(() => {
    if (state.questionnaire) {
      const generatedConfig = generateResourceConfig(state.questionnaire);
      setConfig(generatedConfig);
      
      // Expand first container by default
      if (state.containers.length > 0) {
        setExpandedContainers(new Set([state.containers[0].id]));
      }
    } else {
      router.push('/');
    }
  }, [state.questionnaire, router, state.containers.length]);

  const toggleContainer = (containerId: string) => {
    setExpandedContainers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(containerId)) {
        newSet.delete(containerId);
      } else {
        newSet.add(containerId);
      }
      return newSet;
    });
  };

  const updateContainerResource = (containerId: string, field: string, value: any) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;

    if (field.startsWith('resources.')) {
      const resourceField = field.split('.')[1];
      if (resourceField === 'replicas.min' || resourceField === 'replicas.max') {
        const replicasField = resourceField.split('.')[1];
        updateContainer(containerId, {
          resources: {
            ...container.resources,
            replicas: {
              ...container.resources.replicas,
              [replicasField]: value
            }
          }
        });
      } else {
        updateContainer(containerId, {
          resources: {
            ...container.resources,
            [resourceField]: value
          }
        });
      }
    } else if (field.startsWith('healthCheck.')) {
      const healthField = field.split('.')[1];
      updateContainer(containerId, {
        healthCheck: {
          ...container.healthCheck,
          [healthField]: value
        }
      });
    } else if (field === 'serviceAccess') {
      updateContainer(containerId, { serviceAccess: value });
    } else {
      updateContainer(containerId, { [field]: value });
    }
  };

  const addEnvironmentVariable = (containerId: string) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;
    
    updateContainer(containerId, {
      environmentVariables: [...container.environmentVariables, { key: '', value: '', masked: false }]
    });
  };

  const updateEnvironmentVariable = (containerId: string, index: number, field: 'key' | 'value' | 'masked', value: string | boolean) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;
    
    const updated = [...container.environmentVariables];
    updated[index] = { ...updated[index], [field]: value };
    updateContainer(containerId, { environmentVariables: updated });
  };

  const removeEnvironmentVariable = (containerId: string, index: number) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;
    
    updateContainer(containerId, {
      environmentVariables: container.environmentVariables.filter((_, i) => i !== index)
    });
  };

  const handleServiceAccessChange = (containerId: string, service: 'database' | 'cache', enabled: boolean) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;

    const envVarKey = service === 'database' ? 'UNHAZZLE_POSTGRES_URL' : 'UNHAZZLE_REDIS_URL';
    let updatedEnvVars = [...container.environmentVariables];

    if (enabled) {
      // Add the infrastructure env var if it doesn't exist
      const exists = updatedEnvVars.some(v => v.key === envVarKey);
      if (!exists) {
        updatedEnvVars.push({
          key: envVarKey,
          value: '', // Will be set at deployment
          masked: false
        });
      }
    } else {
      // Remove the infrastructure env var
      updatedEnvVars = updatedEnvVars.filter(v => v.key !== envVarKey);
    }

    // Update both service access and environment variables
    updateContainer(containerId, {
      serviceAccess: {
        ...container.serviceAccess,
        [service]: enabled
      },
      environmentVariables: updatedEnvVars
    });
  };

  const handleContinue = () => {
    if (config) {
      updateResources(config);
      
      // Auto-generate environment variables based on selected resources
      const autoGenerated: { key: string; value: string; readOnly: boolean }[] = [];
      
      const dbPassword = `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`.toUpperCase();
      const redisPassword = `${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`.toUpperCase();
      const dbHost = `db-${Math.random().toString(36).substring(2, 9)}.unhazzle.io`;
      const cacheHost = `cache-${Math.random().toString(36).substring(2, 9)}.unhazzle.io`;

      if (config.database) {
        autoGenerated.push({
          key: 'DATABASE_URL',
          value: `postgresql://unhazzle_user:${dbPassword}@${dbHost}:5432/${state.questionnaire?.appType || 'app'}_prod`,
          readOnly: true
        });
        autoGenerated.push({
          key: 'DATABASE_PASSWORD',
          value: dbPassword,
          readOnly: true
        });
      }

      if (config.cache) {
        autoGenerated.push({
          key: 'REDIS_URL',
          value: `redis://default:${redisPassword}@${cacheHost}:6379`,
          readOnly: true
        });
        autoGenerated.push({
          key: 'REDIS_PASSWORD',
          value: redisPassword,
          readOnly: true
        });
      }
      
      updateEnvironment({
        autoGenerated,
        userSecrets: []
      });
      
      router.push('/domain');
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Generating intelligent configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>✨</span>
            <span>Smart defaults configured • {state.containers.length} container{state.containers.length > 1 ? 's' : ''} selected</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Configure Container Resources
          </h1>
          <p className="text-lg text-slate-600">
            Set resources, health checks, and environment variables for each container
          </p>
        </div>

        {/* Container Configuration Sections */}
        {state.containers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-6 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Containers Selected</h2>
            <p className="text-slate-600 mb-6">Please go back and select at least one container image</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
            >
              ← Back to Application
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {state.containers.map((container, index) => {
              const isExpanded = expandedContainers.has(container.id);
              const displayName = container.imageUrl.split('/').pop() || `Container ${index + 1}`;
              
              return (
                <div key={container.id} id={index === 0 ? "application" : undefined} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleContainer(container.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg">
                        🚀
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-slate-900">{displayName}</h3>
                        <p className="text-sm text-slate-600 font-mono">{container.imageUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                        Container #{index + 1}
                      </span>
                      <svg 
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="p-6 pt-0 border-t border-slate-200">
                      {/* Compute Resources - First Row */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Compute Resources</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-2">CPU per replica</label>
                            <select
                              value={container.resources.cpu}
                              onChange={(e) => updateContainerResource(container.id, 'resources.cpu', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            >
                              <option value="0.5 vCPU">0.5 vCPU</option>
                              <option value="1 vCPU">1 vCPU</option>
                              <option value="2 vCPU">2 vCPU</option>
                              <option value="4 vCPU">4 vCPU</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-2">Memory per replica</label>
                            <select
                              value={container.resources.memory}
                              onChange={(e) => updateContainerResource(container.id, 'resources.memory', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            >
                              <option value="512MB">512MB</option>
                              <option value="1GB">1GB</option>
                              <option value="2GB">2GB</option>
                              <option value="4GB">4GB</option>
                              <option value="8GB">8GB</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-2">Replicas</label>
                            <div className="flex gap-2">
                              <div className="w-1/2">
                                <input
                                  type="number"
                                  value={container.resources.replicas.min}
                                  onChange={(e) => updateContainerResource(container.id, 'resources.replicas.min', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                  min="1"
                                  max="10"
                                  placeholder="Desired"
                                />
                                <p className="text-xs text-slate-500 mt-1">Desired</p>
                              </div>
                              <div className="w-1/2">
                                <input
                                  type="number"
                                  value={container.resources.replicas.max}
                                  onChange={(e) => updateContainerResource(container.id, 'resources.replicas.max', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                  min="1"
                                  max="20"
                                  placeholder="Max"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Port, Exposure & Health Check - Second Row */}
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm">🔍</span>
                          <p className="text-xs text-blue-800">
                            <strong>Auto-detected from image metadata</strong> • Port and health check path have been detected from your container image
                          </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-2">Port</label>
                            <input
                              type="number"
                              value={container.port}
                              onChange={(e) => updateContainerResource(container.id, 'port', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                              min="1"
                              max="65535"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-2">Exposure</label>
                            <select
                              value={container.exposure}
                              onChange={(e) => updateContainerResource(container.id, 'exposure', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                            >
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-2">Health Check Path</label>
                            <input
                              type="text"
                              value={container.healthCheck.path || '/health'}
                              onChange={(e) => updateContainerResource(container.id, 'healthCheck.path', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono"
                              placeholder="/health"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Service Access */}
                      {(config.database || config.cache) && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Service Access</h4>
                          <p className="text-xs text-slate-600 mb-3">
                            Enable this container to connect to infrastructure services. Networking and credentials will be automatically configured.
                          </p>
                          <div className="space-y-3">
                            {config.database && (
                              <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                <input
                                  type="checkbox"
                                  checked={container.serviceAccess.database}
                                  onChange={(e) => handleServiceAccessChange(container.id, 'database', e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                />
                                <div className="flex-1">
                                  <span className="text-sm text-slate-900 font-medium">Database Access</span>
                                  <p className="text-xs text-slate-600 mt-1">
                                    Container can connect to PostgreSQL • Connection URL injected as <code className="text-purple-600 bg-purple-50 px-1 rounded">UNHAZZLE_POSTGRES_URL</code>
                                  </p>
                                </div>
                              </label>
                            )}
                            {config.cache && (
                              <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                <input
                                  type="checkbox"
                                  checked={container.serviceAccess.cache}
                                  onChange={(e) => handleServiceAccessChange(container.id, 'cache', e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                />
                                <div className="flex-1">
                                  <span className="text-sm text-slate-900 font-medium">Cache Access</span>
                                  <p className="text-xs text-slate-600 mt-1">
                                    Container can connect to Redis • Connection URL injected as <code className="text-purple-600 bg-purple-50 px-1 rounded">UNHAZZLE_REDIS_URL</code>
                                  </p>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Environment Variables */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-900">Environment Variables</h4>
                          <button
                            onClick={() => addEnvironmentVariable(container.id)}
                            className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium"
                          >
                            + Add Variable
                          </button>
                        </div>
                        {container.environmentVariables.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">No environment variables configured</p>
                        ) : (
                          <div className="space-y-2">
                            {container.environmentVariables.map((envVar, envIndex) => {
                              const isInfraVar = envVar.key.startsWith('UNHAZZLE_');
                              
                              return (
                                <div key={envIndex} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={envVar.key}
                                    onChange={(e) => updateEnvironmentVariable(container.id, envIndex, 'key', e.target.value)}
                                    placeholder="KEY"
                                    readOnly={isInfraVar}
                                    className={`w-1/3 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono ${isInfraVar ? 'bg-purple-50 text-purple-700' : ''}`}
                                  />
                                  <input
                                    type={envVar.masked ? 'password' : 'text'}
                                    value={envVar.value}
                                    onChange={(e) => updateEnvironmentVariable(container.id, envIndex, 'value', e.target.value)}
                                    placeholder={isInfraVar ? "🔮 Will be set at deployment" : "value"}
                                    readOnly={isInfraVar}
                                    className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono ${isInfraVar ? 'bg-slate-50 text-slate-500 italic' : ''}`}
                                  />
                                  {!isInfraVar && (
                                    <label className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                                      <input
                                        type="checkbox"
                                        checked={envVar.masked}
                                        onChange={(e) => updateEnvironmentVariable(container.id, envIndex, 'masked', e.target.checked)}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-xs text-slate-600">🔒</span>
                                    </label>
                                  )}
                                  {!isInfraVar && (
                                    <button
                                      onClick={() => removeEnvironmentVariable(container.id, envIndex)}
                                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
                                    >
                                      ✕
                                    </button>
                                  )}
                                  {isInfraVar && (
                                    <div className="px-3 py-2 text-purple-600 text-sm flex items-center gap-1">
                                      <span>⚡</span>
                                      <span className="text-xs font-medium">Auto</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Database Configuration */}
        {config.database && (
          <div id="database" className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center text-white text-xl">
                  🐘
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Database ({config.database.engine.toUpperCase()})
                  </h2>
                  <p className="text-sm text-slate-600">Persistent storage with automatic backups</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs text-slate-600 mb-2">CPU</label>
                <select
                  value={config.database.cpu || '2 vCPU'}
                  onChange={(e) => setConfig({...config, database: config.database ? {...config.database, cpu: e.target.value} : config.database})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="1 vCPU">1 vCPU</option>
                  <option value="2 vCPU">2 vCPU</option>
                  <option value="4 vCPU">4 vCPU</option>
                  <option value="8 vCPU">8 vCPU</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-2">Memory</label>
                <select
                  value={config.database.memory || '4GB'}
                  onChange={(e) => setConfig({...config, database: config.database ? {...config.database, memory: e.target.value} : config.database})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="2GB">2GB</option>
                  <option value="4GB">4GB</option>
                  <option value="8GB">8GB</option>
                  <option value="16GB">16GB</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-2">Storage</label>
                <select
                  value={config.database.storage}
                  onChange={(e) => setConfig({...config, database: config.database ? {...config.database, storage: e.target.value} : config.database})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
              <div>
                <label className="block text-xs text-slate-600 mb-2">Backup Retention</label>
                <select
                  value={config.database.backups.retention}
                  onChange={(e) => setConfig({
                    ...config,
                    database: config.database ? {
                      ...config.database,
                      backups: {...config.database.backups, retention: e.target.value}
                    } : config.database
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="3 days">3 days</option>
                  <option value="7 days">7 days</option>
                  <option value="14 days">14 days</option>
                  <option value="30 days">30 days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Cache Configuration */}
        {config.cache && (
          <div id="cache" className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center text-white text-xl">
                  ⚡
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Cache ({config.cache.engine})
                  </h2>
                  <p className="text-sm text-slate-600">High-speed in-memory storage</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-slate-600 mb-2">Memory</label>
                <select
                  value={config.cache.memory}
                  onChange={(e) => setConfig({...config, cache: config.cache ? {...config.cache, memory: e.target.value} : config.cache})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="256MB">256MB</option>
                  <option value="512MB">512MB</option>
                  <option value="1GB">1GB</option>
                  <option value="2GB">2GB</option>
                  <option value="4GB">4GB</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-2">Persistence</label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-700">{config.cache.persistence}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <span>Continue to Domain Setup</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
