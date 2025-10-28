'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';

type TabType = 'overview' | 'logs' | 'metrics' | 'events' | 'settings' | 'nextSteps';

export default function Dashboard() {
  const router = useRouter();
  const { state } = useDeployment();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [uptime, setUptime] = useState(99.98);
  const [cpuUsage, setCpuUsage] = useState(42);
  const [memoryUsage, setMemoryUsage] = useState(58);
  const [requestsPerMinute, setRequestsPerMinute] = useState(1240);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect if not deployed
  useEffect(() => {
    if (!state.deployed) {
      router.push('/');
    }
  }, [state.deployed, router]);

  // Simulate live metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.max(15, Math.min(80, prev + (Math.random() - 0.5) * 10)));
      setMemoryUsage(prev => Math.max(30, Math.min(85, prev + (Math.random() - 0.5) * 8)));
      setRequestsPerMinute(prev => Math.max(800, Math.min(2000, prev + (Math.random() - 0.5) * 200)));
      setUptime(99.95 + Math.random() * 0.05);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!state.deployed) {
    return null;
  }

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value > thresholds.critical) return 'text-red-600';
    if (value > thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Your Application
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  Deployed to: <code className="bg-white px-2 py-1 rounded text-xs font-mono">{state.domain?.defaultSubdomain}</code>
                </span>
                <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
            >
              ← New Deployment
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Uptime */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Uptime</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{uptime.toFixed(2)}%</p>
            <p className="text-xs text-green-600 mt-2">✓ Excellent</p>
          </div>

          {/* CPU Usage */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">CPU Usage</span>
              <span className="text-2xl">⚡</span>
            </div>
            <p className={`text-3xl font-bold ${getMetricColor(cpuUsage, { warning: 70, critical: 85 })}`}>
              {cpuUsage.toFixed(0)}%
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
              <div 
                className={`h-2 rounded-full transition-all ${
                  cpuUsage > 85 ? 'bg-red-600' : cpuUsage > 70 ? 'bg-yellow-600' : 'bg-green-600'
                }`}
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Memory Usage</span>
              <span className="text-2xl">💾</span>
            </div>
            <p className={`text-3xl font-bold ${getMetricColor(memoryUsage, { warning: 75, critical: 90 })}`}>
              {memoryUsage.toFixed(0)}%
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
              <div 
                className={`h-2 rounded-full transition-all ${
                  memoryUsage > 90 ? 'bg-red-600' : memoryUsage > 75 ? 'bg-yellow-600' : 'bg-green-600'
                }`}
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
          </div>

          {/* Requests/min */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 font-medium">Requests/min</span>
              <span className="text-2xl">📡</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{Math.round(requestsPerMinute)}</p>
            <p className="text-xs text-slate-500 mt-2">Current traffic</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-slate-200 flex">
            {(['overview', 'logs', 'metrics', 'events', 'settings', 'nextSteps'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 font-medium transition text-center relative ${
                  tab === 'nextSteps'
                    ? activeTab === tab
                      ? 'border-b-2 border-amber-500 text-amber-600 bg-amber-50'
                      : 'border-b-2 border-transparent text-amber-600 hover:text-amber-700 bg-gradient-to-b from-amber-50 to-transparent'
                    : activeTab === tab
                    ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {tab === 'nextSteps' ? (
                    <>
                      <span>Next Steps</span>
                      <span className="animate-pulse text-lg">→</span>
                      <span className="inline-block px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">
                        IMPORTANT
                      </span>
                    </>
                  ) : (
                    tab.charAt(0).toUpperCase() + tab.slice(1)
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Deployment Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Container Image</p>
                      <code className="text-sm font-mono text-slate-900">{state.application?.imageUrl}</code>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Auto-scaling</p>
                      <p className="text-sm font-mono text-slate-900">
                        {state.resources?.replicas.min}-{state.resources?.replicas.max} replicas
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Database</p>
                      <p className="text-sm font-mono text-slate-900">
                        {state.resources?.database ? 
                          `${state.resources.database.engine.toUpperCase()} (${state.resources.database.storage})` 
                          : 'None'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Cache</p>
                      <p className="text-sm font-mono text-slate-900">
                        {state.resources?.cache ? `${state.resources.cache.engine} (${state.resources.cache.memory})` : 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Health Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-900">Application</span>
                      <span className="text-green-600 font-semibold">✓ Healthy</span>
                    </div>
                    {state.resources?.database && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-green-900">Database</span>
                        <span className="text-green-600 font-semibold">✓ Connected</span>
                      </div>
                    )}
                    {state.resources?.cache && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-green-900">Cache</span>
                        <span className="text-green-600 font-semibold">✓ Connected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Logs</h3>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 space-y-1 max-h-96 overflow-y-auto">
                  <div>[2025-10-21 14:32:15] Application started successfully</div>
                  <div>[2025-10-21 14:32:16] ✓ Database connection established</div>
                  <div>[2025-10-21 14:32:16] ✓ Redis cache connected</div>
                  <div>[2025-10-21 14:32:17] → HTTP server listening on port 3000</div>
                  <div>[2025-10-21 14:32:18] ✓ Health check passed</div>
                  <div>[2025-10-21 14:32:19] → Replica 1 reporting healthy</div>
                  <div>[2025-10-21 14:32:20] → Replica 2 reporting healthy</div>
                  <div>[2025-10-21 14:35:42] GET /api/products 200 45ms</div>
                  <div>[2025-10-21 14:35:43] POST /api/cart 201 52ms</div>
                  <div>[2025-10-21 14:35:44] GET /api/checkout 200 38ms</div>
                  <div>[2025-10-21 14:35:45] POST /api/orders 201 127ms</div>
                  <div>[2025-10-21 14:35:46] GET / 200 15ms (cached)</div>
                </div>
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Performance Metrics</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-3">Average Response Time</p>
                    <div className="text-4xl font-bold text-purple-600">45ms</div>
                    <p className="text-xs text-slate-500 mt-1">↓ 12% from yesterday</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-3">Error Rate</p>
                    <div className="text-4xl font-bold text-green-600">0.02%</div>
                    <p className="text-xs text-slate-500 mt-1">Excellent reliability</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-3">99th Percentile (p99)</p>
                    <div className="text-4xl font-bold text-blue-600">234ms</div>
                    <p className="text-xs text-slate-500 mt-1">Well within SLA</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-3">Requests Today</p>
                    <div className="text-4xl font-bold text-slate-900">1.8M</div>
                    <p className="text-xs text-slate-500 mt-1">↑ 23% from yesterday</p>
                  </div>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Events</h3>
                <div className="space-y-3">
                  <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-2xl">📤</span>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Deployment Completed</p>
                      <p className="text-sm text-blue-700">All replicas healthy and serving traffic</p>
                      <p className="text-xs text-blue-600 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-2xl">📊</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Auto-scaling triggered</p>
                      <p className="text-sm text-slate-600">Scaled from 2 to 4 replicas due to high traffic</p>
                      <p className="text-xs text-slate-500 mt-1">45 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-2xl">🔄</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Database backup completed</p>
                      <p className="text-sm text-slate-600">Automatic daily backup successful (5.2 GB)</p>
                      <p className="text-xs text-slate-500 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-medium text-green-900">SSL certificate renewed</p>
                      <p className="text-sm text-green-700">Auto-renewal for HTTPS certificate successful</p>
                      <p className="text-xs text-green-600 mt-1">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Configuration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-900">Auto-scaling</p>
                        <p className="text-sm text-slate-600">Automatically scale based on demand</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-900">Auto-deployment on push</p>
                        <p className="text-sm text-slate-600">Deploy on GitHub push to main</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-900">Email alerts</p>
                        <p className="text-sm text-slate-600">Get notified of deployment and issues</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Danger Zone</h3>
                  <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                    🗑️ Delete Deployment
                  </button>
                </div>
              </div>
            )}

            {/* Next Steps Tab */}
            {activeTab === 'nextSteps' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span>🚀</span>
                    <span>Enable Continuous Deployment</span>
                  </h3>
                  <p className="text-slate-600">
                    Your application is now live! The next step is to enable automatic deployments from your GitHub repository using the Unhazzle CLI and GitHub Actions.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a
                      href="/unhazzle.io/cli-demo/cli-guide.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Experience the Unhazzle CLI
                      <span aria-hidden="true">↗</span>
                    </a>
                    <span className="text-sm text-slate-600">Simulate the same deployment flow directly from your terminal.</span>
                  </div>
                </div>

                {/* Step 1: YAML Export */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Export Your Infrastructure Configuration</h4>
                  </div>
                  <p className="text-slate-600 ml-11">
                    Below is your infrastructure configuration in YAML format. This file describes all your resources, environment variables, and settings. Copy it to your repository for version control and CI/CD integration.
                  </p>
                  
                  <div className="ml-11 space-y-3">
                    <div className="bg-slate-900 rounded-lg overflow-hidden">
                      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                        <span className="text-white font-mono text-sm">unhazzle.yaml</span>
                        <button
                          onClick={() => {
                            const yaml = generateYAML(state);
                            navigator.clipboard.writeText(yaml);
                            alert('YAML copied to clipboard!');
                          }}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="p-4 text-white font-mono text-xs overflow-x-auto max-h-72">
                        <code>{generateYAML(state)}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Step 2: Add to Repository */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Add YAML to Your Repository</h4>
                  </div>
                  <p className="text-slate-600 ml-11">
                    Commit the unhazzle.yaml file to the root of your repository:
                  </p>
                  <div className="ml-11 bg-slate-100 rounded-lg p-4 font-mono text-sm space-y-1">
                    <div className="text-slate-700">$ git add unhazzle.yaml</div>
                    <div className="text-slate-700">$ git commit -m "Add Unhazzle deployment config"</div>
                    <div className="text-slate-700">$ git push origin main</div>
                  </div>
                </div>

                {/* Step 3: GitHub Actions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Set Up GitHub Actions Workflow</h4>
                  </div>
                  <p className="text-slate-600 ml-11">
                    Create a GitHub Actions workflow to automatically deploy on every push:
                  </p>
                  
                  <div className="ml-11 space-y-3">
                    <div className="bg-slate-900 rounded-lg overflow-hidden">
                      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                        <span className="text-white font-mono text-sm">.github/workflows/deploy.yml</span>
                        <button
                          onClick={() => {
                            const workflow = generateGitHubActions();
                            navigator.clipboard.writeText(workflow);
                            alert('Workflow copied to clipboard!');
                          }}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="p-4 text-white font-mono text-xs overflow-x-auto max-h-72">
                        <code>{generateGitHubActions()}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Step 4: CLI Setup */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Install Unhazzle CLI</h4>
                  </div>
                  <p className="text-slate-600 ml-11">
                    Install the Unhazzle CLI locally for development and debugging:
                  </p>
                  <div className="ml-11 bg-slate-100 rounded-lg p-4 font-mono text-sm space-y-1">
                    <div className="text-slate-700">$ npm install -g @unhazzle/cli</div>
                    <div className="text-slate-700 mt-3"># Or authenticate with GitHub</div>
                    <div className="text-slate-700">$ unhazzle auth login</div>
                  </div>
                </div>

                {/* Step 5: Deploy on Push */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      5
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">All Set! Continuous Deployment Enabled</h4>
                  </div>
                  <p className="text-slate-600 ml-11">
                    From now on, every time you push to your main branch:
                  </p>
                  <div className="ml-11 space-y-2 text-slate-600">
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span>GitHub Actions picks up the unhazzle.yaml file</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span>Unhazzle CLI automatically deploys your app with the exact configuration</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span>No manual steps, no configuration drift, fully automated</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span>Deployment status is reflected in your GitHub PR</span>
                    </div>
                  </div>
                </div>

                {/* Useful Commands */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-900">🔧 Useful CLI Commands</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-mono text-slate-700 mb-1">$ unhazzle status</p>
                      <p className="text-slate-600">Check application health and metrics</p>
                    </div>
                    <div>
                      <p className="font-mono text-slate-700 mb-1">$ unhazzle logs --follow</p>
                      <p className="text-slate-600">Stream real-time application logs</p>
                    </div>
                    <div>
                      <p className="font-mono text-slate-700 mb-1">$ unhazzle env set KEY=VALUE</p>
                      <p className="text-slate-600">Update environment variables on the fly</p>
                    </div>
                    <div>
                      <p className="font-mono text-slate-700 mb-1">$ unhazzle deploy --config unhazzle.yaml</p>
                      <p className="text-slate-600">Manual deployment using your YAML config</p>
                    </div>
                  </div>
                </div>

                {/* Documentation Link */}
                <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <p className="text-slate-600 mb-4">Want to learn more about continuous deployment?</p>
                  <a
                    href="https://docs.unhazzle.io/cli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    Read the CLI Documentation →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function generateYAML(state: any): string {
  const appType = state.questionnaire?.appType || 'web';
  const hasDatabase = state.resources?.database;
  const hasCache = state.resources?.cache;
  
  // Generate realistic environment variables
  const autoEnv = state.environment?.autogenerated || {};
  const userEnv = state.environment?.userSecrets || {};
  
  let envSection = 'environment:\n';
  
  // Auto-generated database/cache URLs
  if (hasDatabase) {
    envSection += `  DATABASE_URL: \${{ secrets.DATABASE_URL }}\n`;
  }
  if (hasCache) {
    envSection += `  REDIS_URL: \${{ secrets.REDIS_URL }}\n`;
  }
  
  // User-provided secrets
  if (Object.keys(userEnv).length > 0) {
    Object.keys(userEnv).forEach(key => {
      envSection += `  ${key}: \${{ secrets.${key} }}\n`;
    });
  }
  
  // App-specific environment variables based on type
  if (appType === 'ecommerce') {
    envSection += `  NODE_ENV: production\n`;
    envSection += `  STRIPE_PUBLIC_KEY: \${{ secrets.STRIPE_PUBLIC_KEY }}\n`;
    envSection += `  STRIPE_SECRET_KEY: \${{ secrets.STRIPE_SECRET_KEY }}\n`;
    envSection += `  STRIPE_WEBHOOK_SECRET: \${{ secrets.STRIPE_WEBHOOK_SECRET }}\n`;
    envSection += `  NEXTAUTH_URL: https://${state.domain?.customDomain || state.domain?.defaultSubdomain}\n`;
    envSection += `  NEXTAUTH_SECRET: \${{ secrets.NEXTAUTH_SECRET }}\n`;
  } else if (appType === 'saas') {
    envSection += `  NODE_ENV: production\n`;
    envSection += `  API_KEY: \${{ secrets.API_KEY }}\n`;
    envSection += `  JWT_SECRET: \${{ secrets.JWT_SECRET }}\n`;
    envSection += `  APP_URL: https://${state.domain?.customDomain || state.domain?.defaultSubdomain}\n`;
  } else {
    envSection += `  NODE_ENV: production\n`;
    envSection += `  LOG_LEVEL: info\n`;
  }

  return `# Unhazzle Deployment Configuration
# Generated from your application setup
# Reference: https://docs.unhazzle.io/yaml-config

project: ${state.user?.name?.toLowerCase().replace(/\s+/g, '-') || 'my-app'}
environment: production

application:
  image: ${state.application?.imageUrl || 'ghcr.io/yourorg/your-app:latest'}
  type: ${appType}
  port: 3000
  healthcheck:
    endpoint: /health
    interval: 30s
    timeout: 10s
    unhealthy_threshold: 3

domain: ${state.domain?.customDomain || state.domain?.defaultSubdomain || 'your-app.unhazzle.io'}
ssl: true  # Auto-provisioned with Let's Encrypt

resources:
  replicas:
    min: ${state.resources?.replicas.min || 2}
    max: ${state.resources?.replicas.max || 10}
  cpu: ${state.resources?.cpu || 1}
  memory: ${state.resources?.memory || '2GB'}
  auto_scaling:
    enabled: true
    target_cpu: 70
    target_memory: 80

${hasDatabase ? `services:
  database:
    type: ${state.resources.database.engine}
    version: "${state.resources.database.engine === 'postgres' ? '16' : '8.0'}"
    storage: ${state.resources.database.storage}
    backups:
      enabled: true
      retention_days: 30
      frequency: daily
      time: "02:00"  # 2 AM UTC
    ha_replica: true
    connection_pooling: true
` : 'services: {}  # No database services\n'}
${hasCache ? `  cache:
    type: ${state.resources.cache.engine}
    version: "${state.resources.cache.engine === 'redis' ? '7.2' : 'latest'}"
    memory: ${state.resources.cache.memory}
    persistence: true
    eviction_policy: allkeys-lru
` : ''}

${envSection}

# Monitoring and alerting
monitoring:
  enabled: true
  metrics_retention: 90d
  alerts:
    - name: high_cpu
      threshold: 85%
      duration: 5m
    - name: high_memory
      threshold: 90%
      duration: 5m
    - name: deployment_failure
      threshold: any
      duration: 1m

# Security
security:
  auto_https: true
  hsts_enabled: true
  cors_origins:
    - https://${state.domain?.customDomain || state.domain?.defaultSubdomain}

# For more information, visit: https://docs.unhazzle.io/yaml-configuration
`;
}

function generateGitHubActions(): string {
  return `name: Deploy to Unhazzle

on:
  push:
    branches:
      - main
    paths:
      - 'unhazzle.yaml'
      - 'src/**'
      - 'package.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Install Unhazzle CLI
        run: npm install -g @unhazzle/cli
      
      - name: Authenticate with Unhazzle
        env:
          UNHAZZLE_TOKEN: \${{ secrets.UNHAZZLE_TOKEN }}
        run: unhazzle auth token \$UNHAZZLE_TOKEN
      
      - name: Deploy application
        run: unhazzle deploy --config unhazzle.yaml
      
      - name: Wait for deployment
        run: unhazzle status --wait

      - name: Run health checks
        run: unhazzle health-check

      - name: Comment PR with deployment info
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const deploymentStatus = await exec('unhazzle status --json');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: \`✅ Deployed to Unhazzle!\n\nView your app: ${ 'https://app.unhazzle.io' }\`
            });
`;
}
