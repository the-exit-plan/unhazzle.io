'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { generateResourceConfig } from '@/lib/utils/configGenerator';
import { ResourceConfig } from '@/lib/context/DeploymentContext';

export default function Resources() {
  const router = useRouter();
  const { state, updateResources } = useDeployment();
  
  const [config, setConfig] = useState<ResourceConfig | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Generate intelligent defaults on mount
  useEffect(() => {
    if (state.questionnaire) {
      const generatedConfig = generateResourceConfig(state.questionnaire);
      setConfig(generatedConfig);
    } else {
      // If no questionnaire data, redirect to start
      router.push('/');
    }
  }, [state.questionnaire, router]);

  const handleContinue = () => {
    if (config) {
      updateResources(config);
      router.push('/environment');
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
            <span>Smart defaults configured based on your answers</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Review Resource Configuration
          </h1>
          <p className="text-lg text-slate-600">
            We&apos;ve configured everything based on your e-commerce app with burst traffic. Adjust if needed.
          </p>
        </div>

        {/* Application Resources */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                🚀
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Application Resources</h2>
                <p className="text-sm text-slate-600">Container compute and scaling</p>
              </div>
            </div>
            <div className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
              AUTO-CONFIGURED
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Replicas */}
            <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📊</span>
                <h3 className="font-semibold text-slate-900">Auto-scaling</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-600">Min replicas</label>
                  <input
                    type="number"
                    value={config.replicas.min}
                    onChange={(e) => setConfig({...config, replicas: {...config.replicas, min: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Max replicas</label>
                  <input
                    type="number"
                    value={config.replicas.max}
                    onChange={(e) => setConfig({...config, replicas: {...config.replicas, max: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    min="1"
                    max="20"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                💡 Scales automatically based on CPU usage
              </p>
            </div>

            {/* CPU */}
            <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <h3 className="font-semibold text-slate-900">CPU</h3>
              </div>
              <div>
                <label className="text-xs text-slate-600">Per replica</label>
                <select
                  value={config.cpu}
                  onChange={(e) => setConfig({...config, cpu: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="0.5 vCPU">0.5 vCPU</option>
                  <option value="1 vCPU">1 vCPU</option>
                  <option value="2 vCPU">2 vCPU</option>
                  <option value="4 vCPU">4 vCPU</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                💡 {state.questionnaire?.traffic === 'burst' ? 'Higher CPU for burst traffic' : 'Standard for steady traffic'}
              </p>
            </div>

            {/* Memory */}
            <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💾</span>
                <h3 className="font-semibold text-slate-900">Memory</h3>
              </div>
              <div>
                <label className="text-xs text-slate-600">Per replica</label>
                <select
                  value={config.memory}
                  onChange={(e) => setConfig({...config, memory: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="512MB">512MB</option>
                  <option value="1GB">1GB</option>
                  <option value="2GB">2GB</option>
                  <option value="4GB">4GB</option>
                  <option value="8GB">8GB</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                💡 Sufficient for Node/Python apps with DB connections
              </p>
            </div>
          </div>
        </div>

        {/* Database Configuration */}
        {config.database && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
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
              <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                RECOMMENDED
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💿</span>
                  <h3 className="font-semibold text-slate-900">Storage</h3>
                </div>
                <select
                  value={config.database.storage}
                  onChange={(e) => setConfig({...config, database: config.database ? {...config.database, storage: e.target.value} : undefined})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="10GB">10GB</option>
                  <option value="20GB">20GB</option>
                  <option value="50GB">50GB</option>
                  <option value="100GB">100GB</option>
                  <option value="200GB">200GB</option>
                </select>
                <p className="text-xs text-slate-500 mt-3">
                  💡 Enough for thousands of products and orders
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🔄</span>
                  <h3 className="font-semibold text-slate-900">Backup Retention</h3>
                </div>
                <select
                  value={config.database.backups.retention}
                  onChange={(e) => setConfig({
                    ...config, 
                    database: config.database ? {
                      ...config.database, 
                      backups: {...config.database.backups, retention: e.target.value}
                    } : undefined
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="3 days">3 days</option>
                  <option value="7 days">7 days</option>
                  <option value="14 days">14 days</option>
                  <option value="30 days">30 days</option>
                </select>
                <p className="text-xs text-slate-500 mt-3">
                  💡 Daily backups at 2 AM UTC
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✓ Included:</strong> High availability standby, automated failover, encryption at rest
              </p>
            </div>
          </div>
        )}

        {/* Cache Configuration */}
        {config.cache && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
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
              <div className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                E-COMMERCE
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💨</span>
                  <h3 className="font-semibold text-slate-900">Memory</h3>
                </div>
                <select
                  value={config.cache.memory}
                  onChange={(e) => setConfig({...config, cache: config.cache ? {...config.cache, memory: e.target.value} : undefined})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="256MB">256MB</option>
                  <option value="512MB">512MB</option>
                  <option value="1GB">1GB</option>
                  <option value="2GB">2GB</option>
                  <option value="4GB">4GB</option>
                </select>
                <p className="text-xs text-slate-500 mt-3">
                  💡 For sessions, product data, and API responses
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💾</span>
                  <h3 className="font-semibold text-slate-900">Persistence</h3>
                </div>
                <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-700">{config.cache.persistence}</p>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  💡 {config.cache.persistence !== 'None' ? 'Survives restarts' : 'In-memory only'}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Use cases:</strong> Session storage, shopping carts, product catalogs, rate limiting
              </p>
            </div>
          </div>
        )}

        {/* Why These Defaults */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-100">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>Why we chose these defaults:</span>
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span><strong>2-10 replicas:</strong> Your "burst traffic" pattern needs aggressive scaling for flash sales</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span><strong>{config.cpu} & {config.memory}:</strong> Handles e-commerce workloads with DB connections and API calls</span>
            </li>
            {config.database && (
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span><strong>{config.database.storage} storage:</strong> Sufficient for early-stage e-commerce (thousands of products)</span>
              </li>
            )}
            {config.cache && (
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span><strong>{config.cache.memory} cache:</strong> Optimized for session storage and product catalog caching</span>
              </li>
            )}
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
            onClick={handleContinue}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <span>Continue to Environment Variables</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
