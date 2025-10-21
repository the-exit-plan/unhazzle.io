'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { calculateCost } from '@/lib/utils/costCalculator';
import { CostBreakdown } from '@/lib/context/DeploymentContext';

export default function ReviewAndDeploy() {
  const router = useRouter();
  const { state, updateCost, markDeployed } = useDeployment();
  
  const [cost, setCost] = useState<CostBreakdown | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

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

    const calculatedCost = calculateCost(state.resources, state.questionnaire);
    setCost(calculatedCost);
    updateCost(calculatedCost);
  }, [state.domain, state.resources, state.questionnaire, router]); // Removed updateCost from deps

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>📊</span>
            <span>Review your configuration</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Ready to Deploy
          </h1>
          <p className="text-lg text-slate-600">
            Review your setup and estimated costs before deploying
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
              💡 Pay only for what you use • No minimum contract • Cancel anytime
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Servers & Compute</p>
                  <p className="text-2xl font-bold">€{cost.application.toFixed(2)}</p>
                </div>
                <div className="text-3xl">🚀</div>
              </div>
            </div>
            {cost.database !== undefined && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Database Storage</p>
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
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Bandwidth (20TB incl.)</p>
                  <p className="text-2xl font-bold">€{cost.bandwidth.toFixed(2)}</p>
                </div>
                <div className="text-3xl">📡</div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Application */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🚀</span>
              <span>Application</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Image</span>
                <code className="text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                  {state.application?.imageUrl.split('/').pop()}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Auto-scaling</span>
                <span className="text-slate-900 font-semibold">
                  {state.resources.replicas.min}-{state.resources.replicas.max} replicas
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Resources/replica</span>
                <span className="text-slate-900 font-semibold">
                  {state.resources.cpu}, {state.resources.memory}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Health check</span>
                <span className="text-slate-900">{state.application?.healthCheck}</span>
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🏗️</span>
              <span>Infrastructure</span>
            </h3>
            <div className="space-y-3 text-sm">
              {state.resources.database && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Database</span>
                  <span className="text-slate-900 font-semibold">
                    {state.resources.database.engine.toUpperCase()} {state.resources.database.storage}
                  </span>
                </div>
              )}
              {state.resources.cache && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Cache</span>
                  <span className="text-slate-900 font-semibold">
                    {state.resources.cache.engine} {state.resources.cache.memory}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Traffic pattern</span>
                <span className="text-slate-900 font-semibold capitalize">{state.questionnaire?.traffic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Region</span>
                <span className="text-slate-900">Germany (FSN1)</span>
              </div>
            </div>
          </div>

          {/* Domain */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🌐</span>
              <span>Domain</span>
            </h3>
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
            <span>What&apos;s included in your plan</span>
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
