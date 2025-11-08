'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { calculateContainerCostImpact, calculateDatabaseCostImpact, calculateCacheCostImpact } from '@/lib/utils/costCalculator';

type TabType = 'overview' | 'logs' | 'metrics' | 'events' | 'settings' | 'nextSteps';

export default function Dashboard() {
  const router = useRouter();
  const { state, removeDatabase, removeCache } = useDeployment();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [uptime, setUptime] = useState(99.98);
  const [cpuUsage, setCpuUsage] = useState(42);
  const [memoryUsage, setMemoryUsage] = useState(58);
  const [requestsPerMinute, setRequestsPerMinute] = useState(1240);
  const [selectedContainer, setSelectedContainer] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Ensure client-only render to avoid SSR/client hydration mismatch from localStorage-backed context
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated (no user)
  useEffect(() => {
    if (mounted && !state.user) {
      router.push('/');
    }
  }, [mounted, state.user, router]);

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

  if (!mounted) {
    return null;
  }

  // If authenticated but no project, show empty state
  if (!state.project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-slate-600">
                  Welcome, {state.user?.name}!
                </p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                No Projects Yet
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Get started by creating your first project. Answer 4 quick questions about your application, 
                and we&apos;ll automatically configure production-ready infrastructure for you.
              </p>
              <button
                onClick={() => router.push('/questionnaire')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg inline-flex items-center gap-3"
              >
                <span className="text-2xl">+</span>
                <span>Create Your First Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
                Dashboard
              </h1>
              <div className="flex items-center gap-4">
                {state.domain?.defaultSubdomain && (
                  <span className="text-sm text-slate-600">
                    Deployed to: <code className="bg-white px-2 py-1 rounded text-xs font-mono">{state.domain.defaultSubdomain}</code>
                  </span>
                )}
                {state.deployed && (
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/questionnaire')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Create Project</span>
            </button>
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
              <div className="p-6">
                {/* Overview Tab - Hybrid view: left panel (hierarchy) + right panel (editing) */}
                {activeTab === 'overview' && (
                  <HybridOverview project={state.project} state={state} />
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-600">Application:</label>
                      <select
                        value={selectedContainer}
                        onChange={(e) => setSelectedContainer(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                      >
                        <option value="all">All Applications</option>
                        {state.containers.map((container, index) => {
                          return (
                            <option key={container.id} value={container.id}>{container.name}</option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 space-y-1 max-h-96 overflow-y-auto">
                      {(() => {
                        const allLogs: { container: string; message: string }[] = [];

                        state.containers.forEach((container, index) => {
                          if (selectedContainer === 'all' || selectedContainer === container.id) {
                            allLogs.push(
                              { container: container.name, message: '[2025-11-02 14:32:15] Application started successfully' },
                              { container: container.name, message: `[2025-11-02 14:32:17] → HTTP server listening on port ${container.port}` },
                              { container: container.name, message: '[2025-11-02 14:32:18] ✓ Health check passed' },
                              { container: container.name, message: `[2025-11-02 14:32:19] → Replica 1 reporting healthy` },
                              { container: container.name, message: `[2025-11-02 14:32:20] → Replica 2 reporting healthy` }
                            );

                            if (container.serviceAccess.database) {
                              allLogs.push({ container: container.name, message: '[2025-11-02 14:32:16] ✓ Database connection established' });
                            }
                            if (container.serviceAccess.cache) {
                              allLogs.push({ container: container.name, message: '[2025-11-02 14:32:16] ✓ Redis cache connected' });
                            }

                            if (container.exposure === 'public') {
                              allLogs.push(
                                { container: container.name, message: '[2025-11-02 14:35:42] GET /api/products 200 45ms' },
                                { container: container.name, message: '[2025-11-02 14:35:43] POST /api/cart 201 52ms' },
                                { container: container.name, message: '[2025-11-02 14:35:44] GET /api/checkout 200 38ms' },
                                { container: container.name, message: '[2025-11-02 14:35:45] POST /api/orders 201 127ms' },
                                { container: container.name, message: '[2025-11-02 14:35:46] GET / 200 15ms (cached)' }
                              );
                            } else {
                              allLogs.push(
                                { container: container.name, message: '[2025-11-02 14:35:42] Processing background job #1234' },
                                { container: container.name, message: '[2025-11-02 14:35:43] → Job completed in 89ms' },
                                { container: container.name, message: '[2025-11-02 14:35:44] Handling internal API call' }
                              );
                            }
                          }
                        });

                        return allLogs.map((log, i) => (
                          <div key={i}>
                            {selectedContainer === 'all' && (
                              <span className="text-purple-400">[{log.container}] </span>
                            )}
                            {log.message}
                          </div>
                        ));
                      })()}
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
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Settings moved to Overview</h3>
                  <p className="text-slate-700 mb-4">
                    Edit your current deployment configuration in the Overview tab. Use the left sidebar to pick a resource and the right panel to edit. You can preview and apply staged changes.
                  </p>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    Go to Overview
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Looking for advanced settings? We’ll surface them here soon. For now, everything configurable is available in Overview.
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

// ======================
// Hybrid Overview: Left Panel (Hierarchy) + Right Panel (Editing)
// ======================

function HybridOverview({ project, state }: { project: any; state: any }) {
  const { updateContainer, updateResources, removeDatabase, removeCache, removeContainer } = useDeployment();
  const [selected, setSelected] = useState<{ kind: 'container' | 'database' | 'cache' | 'architecture'; id?: string; envId?: string }>(() => {
    // Default to first container if available
    if (project?.environments?.[0]?.containers?.[0]) {
      return {
        kind: 'container',
        id: project.environments[0].containers[0].id,
        envId: project.environments[0].id
      };
    }
    return { kind: 'architecture' };
  });

  // Draft state for staged edits
  const [draftContainer, setDraftContainer] = useState<any>(null);
  const [draftDatabase, setDraftDatabase] = useState<any>(null);
  const [draftCache, setDraftCache] = useState<any>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Get the currently selected resource from project structure
  const getSelectedResource = () => {
    if (!project?.environments) return null;
    
    if (selected.kind === 'container') {
      for (const env of project.environments) {
        const container = env.containers?.find((c: any) => c.id === selected.id);
        if (container) return { type: 'container', data: container, env };
      }
    } else if (selected.kind === 'database') {
      const env = project.environments.find((e: any) => e.id === selected.envId);
      if (env?.database) return { type: 'database', data: env.database, env };
    } else if (selected.kind === 'cache') {
      const env = project.environments.find((e: any) => e.id === selected.envId);
      if (env?.cache) return { type: 'cache', data: env.cache, env };
    }
    return null;
  };

  const selectedResource = getSelectedResource();

  // Keep draft in sync when selection changes
  useEffect(() => {
    const resource = getSelectedResource();
    if (selected.kind === 'container' && resource?.data) {
      const deep = JSON.parse(JSON.stringify(resource.data));
      if (!Array.isArray(deep.environmentVariables)) deep.environmentVariables = [];
      setDraftContainer(deep);
    } else if (selected.kind === 'database' && resource?.data) {
      setDraftDatabase(JSON.parse(JSON.stringify(resource.data)));
      setDraftContainer(null);
    } else if (selected.kind === 'cache' && resource?.data) {
      setDraftCache(JSON.parse(JSON.stringify(resource.data)));
      setDraftContainer(null);
    } else {
      setDraftContainer(null);
      setDraftDatabase(null);
      setDraftCache(null);
    }
  }, [selected, project]);

  const hasContainerChanges = () => {
    if (!selectedResource?.data || !draftContainer || selected.kind !== 'container') return false;
    return JSON.stringify({
      resources: draftContainer.resources,
      healthCheck: draftContainer.healthCheck,
      exposure: draftContainer.exposure,
      serviceAccess: draftContainer.serviceAccess,
      environmentVariables: draftContainer.environmentVariables,
    }) !== JSON.stringify({
      resources: selectedResource.data.resources,
      healthCheck: selectedResource.data.healthCheck,
      exposure: selectedResource.data.exposure,
      serviceAccess: selectedResource.data.serviceAccess,
      environmentVariables: selectedResource.data.environmentVariables,
    });
  };

  const hasDatabaseChanges = () => {
    if (!selectedResource?.data || !draftDatabase || selected.kind !== 'database') return false;
    return JSON.stringify(draftDatabase) !== JSON.stringify(selectedResource.data);
  };

  const hasCacheChanges = () => {
    if (!selectedResource?.data || !draftCache || selected.kind !== 'cache') return false;
    return JSON.stringify(draftCache) !== JSON.stringify(selectedResource.data);
  };

  const applyContainerChanges = () => {
    if (!selectedResource?.data || !draftContainer) return;
    setShowConfirmation(false);
    setIsApplying(true);
    setTimeout(() => {
      updateContainer(selectedResource.data.id, {
        resources: draftContainer.resources,
        healthCheck: draftContainer.healthCheck,
        exposure: draftContainer.exposure,
        serviceAccess: draftContainer.serviceAccess,
        environmentVariables: draftContainer.environmentVariables,
      });
      setIsApplying(false);
    }, 800);
  };

  const applyDatabaseChanges = () => {
    if (!draftDatabase || !state.resources) return;
    const res = state.resources;
    setShowConfirmation(false);
    setIsApplying(true);
    setTimeout(() => {
      updateResources({
        replicas: res.replicas,
        cpu: res.cpu,
        memory: res.memory,
        database: draftDatabase,
        cache: res.cache,
      });
      setIsApplying(false);
    }, 800);
  };

  const applyCacheChanges = () => {
    if (!draftCache || !state.resources) return;
    const res = state.resources;
    setShowConfirmation(false);
    setIsApplying(true);
    setTimeout(() => {
      updateResources({
        replicas: res.replicas,
        cpu: res.cpu,
        memory: res.memory,
        database: res.database,
        cache: draftCache,
      });
      setIsApplying(false);
    }, 800);
  };

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">No Projects Yet</h3>
        <p className="text-slate-600 mb-6">Create your first project to get started with Unhazzle</p>
        <button
          onClick={() => window.location.href = '/questionnaire'}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold"
        >
          Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* LEFT PANEL: Hierarchical Navigation */}
      <div className="col-span-12 lg:col-span-4 xl:col-span-3">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 space-y-4 sticky top-4 border border-slate-200">
          {/* Project Header */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📦</span>
              <h3 className="font-bold text-slate-900 text-lg">{project.name}</h3>
            </div>
            <div className="text-xs text-slate-600">
              {project.environments?.length || 0} environment{project.environments?.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Environments */}
          {project.environments?.map((env: any) => {
            const containers = env.containers || [];
            const hasDatabase = !!env.database;
            const hasCache = !!env.cache;

            return (
              <div key={env.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Environment Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔧</span>
                    <span className="font-bold text-slate-900">{env.name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Live
                    </span>
                  </div>
                </div>

                {/* Resources */}
                <div className="p-3 space-y-3">
                  {/* Containers */}
                  {containers.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <span>🚀</span>
                        <span>Containers ({containers.length})</span>
                      </div>
                      <div className="space-y-1">
                        {containers.map((container: any, idx: number) => {
                          const displayName = container.imageUrl.split('/').pop()?.split(':')[0] || `app-${idx + 1}`;
                          const isSelected = selected.kind === 'container' && selected.id === container.id;
                          const hasDbAccess = container.serviceAccess?.database;
                          const hasCacheAccess = container.serviceAccess?.cache;

                          return (
                            <button
                              key={container.id}
                              onClick={() => setSelected({ kind: 'container', id: container.id, envId: env.id })}
                              className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                                isSelected
                                  ? 'border-purple-400 bg-purple-50 shadow-sm'
                                  : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="text-sm font-medium text-slate-900 truncate">{displayName}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Database */}
                  {hasDatabase && (
                    <div>
                      <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <span>💾</span>
                        <span>Database</span>
                      </div>
                      <button
                        onClick={() => setSelected({ kind: 'database', envId: env.id })}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                          selected.kind === 'database' && selected.envId === env.id
                            ? 'border-green-400 bg-green-50 shadow-sm'
                            : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-slate-900">PostgreSQL</div>
                      </button>
                    </div>
                  )}

                  {/* Cache */}
                  {hasCache && (
                    <div>
                      <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <span>⚡</span>
                        <span>Cache</span>
                      </div>
                      <button
                        onClick={() => setSelected({ kind: 'cache', envId: env.id })}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                          selected.kind === 'cache' && selected.envId === env.id
                            ? 'border-red-400 bg-red-50 shadow-sm'
                            : 'border-slate-200 hover:border-red-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-slate-900">Redis</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Architecture Diagram Option */}
          <button
            onClick={() => setSelected({ kind: 'architecture' })}
            className={`w-full text-left px-4 py-3 rounded-lg border transition ${
              selected.kind === 'architecture'
                ? 'border-purple-400 bg-purple-50 shadow-sm'
                : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="text-xl">🏗️</span>
              <span>Architecture Diagram</span>
            </div>
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Resource Editor */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9">
        {selected.kind === 'container' && selectedResource && draftContainer && (
          <ContainerEditor
            container={selectedResource.data}
            draftContainer={draftContainer}
            setDraftContainer={setDraftContainer}
            hasChanges={hasContainerChanges()}
            showChanges={showChanges}
            setShowChanges={setShowChanges}
            onApply={() => setShowConfirmation(true)}
            isApplying={isApplying}
            state={state}
            onRemove={removeContainer}
          />
        )}

        {selected.kind === 'database' && selectedResource && draftDatabase && (
          <DatabaseEditor
            database={selectedResource.data}
            draftDatabase={draftDatabase}
            setDraftDatabase={setDraftDatabase}
            hasChanges={hasDatabaseChanges()}
            showChanges={showChanges}
            setShowChanges={setShowChanges}
            onApply={() => setShowConfirmation(true)}
            isApplying={isApplying}
            state={state}
            onRemove={removeDatabase}
          />
        )}

        {selected.kind === 'cache' && selectedResource && draftCache && (
          <CacheEditor
            cache={selectedResource.data}
            draftCache={draftCache}
            setDraftCache={setDraftCache}
            hasChanges={hasCacheChanges()}
            showChanges={showChanges}
            setShowChanges={setShowChanges}
            onApply={() => setShowConfirmation(true)}
            isApplying={isApplying}
            state={state}
            onRemove={removeCache}
          />
        )}

        {selected.kind === 'architecture' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span>🏗️</span>
                <span>Architecture Diagram</span>
              </h2>
              <p className="text-slate-600 mb-6">
                Visual representation of your deployed infrastructure, including container connections and internal DNS.
              </p>
            </div>
            <ArchitectureDiagram state={state} />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          selected={selected}
          selectedResource={selectedResource}
          draftContainer={draftContainer}
          draftDatabase={draftDatabase}
          draftCache={draftCache}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => {
            if (selected.kind === 'container') applyContainerChanges();
            else if (selected.kind === 'database') applyDatabaseChanges();
            else if (selected.kind === 'cache') applyCacheChanges();
          }}
        />
      )}
    </div>
  );
}

// ======================
// Container Editor Component
// ======================

function ContainerEditor({ container, draftContainer, setDraftContainer, hasChanges, showChanges, setShowChanges, onApply, isApplying, state, onRemove }: any) {
  const handleRemove = () => {
    const containers = state.containers || [];
    
    // Check if this is the last container
    if (containers.length <= 1) {
      alert('Cannot remove the last container. Your project must have at least one container.');
      return;
    }
    
    const confirmed = window.confirm(`Remove container "${container.name || 'container'}"? This action cannot be undone in demo mode.`);
    if (confirmed) {
      onRemove(container.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{container.name || 'Application Container'}</h3>
          <p className="text-xs text-slate-500">Image: {container.imageUrl}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChanges(true)}
            disabled={!hasChanges || isApplying}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              hasChanges ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
            } disabled:opacity-50`}
          >
            Show Changes
          </button>
          <button
            onClick={onApply}
            disabled={!hasChanges || isApplying}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isApplying ? 'Applying…' : 'Apply'}
          </button>
          <button
            onClick={handleRemove}
            disabled={isApplying}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Public Endpoint (if applicable) */}
      {container.exposure === 'public' && (() => {
        const displayName = container.imageUrl.split('/').pop()?.split(':')[0] || 'app';
        const stableId = container.id.substring(0, 6);
        const domain = `${displayName}-${stableId}.unhazzle.app`;
        
        return (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-600 uppercase">Public Endpoint</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-purple-600 font-mono">
                    https://{domain}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${domain}`);
                    }}
                    className="p-1 hover:bg-slate-200 rounded transition text-sm"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Port {container.port} • SSL Enabled • CDN Cached
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Section: Resources */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">CPU</label>
            <select
              value={draftContainer.resources.cpu}
              onChange={(e) => setDraftContainer({
                ...draftContainer,
                resources: { ...draftContainer.resources, cpu: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="0.25">0.25</option>
              <option value="0.5">0.5</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Memory</label>
            <select
              value={draftContainer.resources.memory}
              onChange={(e) => setDraftContainer({
                ...draftContainer,
                resources: { ...draftContainer.resources, memory: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="0.5GB">0.5GB</option>
              <option value="1GB">1GB</option>
              <option value="2GB">2GB</option>
              <option value="4GB">4GB</option>
              <option value="8GB">8GB</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Replicas (min)</label>
            <input
              type="number"
              min={1}
              value={draftContainer.resources.replicas.min}
              onChange={(e) => setDraftContainer({
                ...draftContainer,
                resources: {
                  ...draftContainer.resources,
                  replicas: { ...draftContainer.resources.replicas, min: Math.max(1, parseInt(e.target.value) || 1) }
                }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Set min=max for fixed scaling. Different values enable auto-scaling.</p>
      </div>

      {/* Section: Environment Variables (editable) */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Environment Variables</h4>
        <div className="space-y-3">
          {draftContainer.environmentVariables.length === 0 && (
            <div className="text-xs text-slate-500">No variables defined yet.</div>
          )}
          {draftContainer.environmentVariables.map((env: any, idx: number) => (
            <div key={idx} className="grid md:grid-cols-12 gap-3 items-start">
              <div className="md:col-span-4">
                <label className="block text-xs text-slate-600 mb-1">Key</label>
                <input
                  type="text"
                  value={env.key}
                  onChange={(e) => {
                    const next = [...draftContainer.environmentVariables];
                    next[idx] = { ...next[idx], key: e.target.value };
                    setDraftContainer({ ...draftContainer, environmentVariables: next });
                  }}
                  placeholder="KEY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>
              <div className="md:col-span-6">
                <label className="block text-xs text-slate-600 mb-1">Value</label>
                <div className="flex items-center gap-2">
                  <input
                    type={env.masked === false ? 'text' : 'password'}
                    value={env.value}
                    onChange={(e) => {
                      const next = [...draftContainer.environmentVariables];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setDraftContainer({ ...draftContainer, environmentVariables: next });
                    }}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...draftContainer.environmentVariables];
                      const currentMasked = next[idx].masked !== false;
                      next[idx] = { ...next[idx], masked: !currentMasked };
                      setDraftContainer({ ...draftContainer, environmentVariables: next });
                    }}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900"
                    aria-label={env.masked === false ? 'Hide value' : 'Show value'}
                    title={env.masked === false ? 'Hide value' : 'Show value'}
                  >
                    {env.masked === false ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs mb-1 invisible">Action</label>
                <button
                  type="button"
                  onClick={() => {
                    const next = draftContainer.environmentVariables.filter((_: any, i: number) => i !== idx);
                    setDraftContainer({ ...draftContainer, environmentVariables: next });
                  }}
                  className="w-full md:w-auto px-3 py-2 text-xs rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>🔐</span>
              <span>Values are masked by default and stored encrypted.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...draftContainer.environmentVariables,
                  { key: '', value: '', masked: true },
                ];
                setDraftContainer({ ...draftContainer, environmentVariables: next });
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900"
            >
              + Add variable
            </button>
          </div>
        </div>
      </div>

      {/* Section: Health Check */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Health Check</h4>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Protocol</label>
            <select
              value={draftContainer.healthCheck.protocol}
              onChange={(e) => setDraftContainer({
                ...draftContainer,
                healthCheck: { ...draftContainer.healthCheck, protocol: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="HTTP">HTTP</option>
              <option value="TCP">TCP</option>
              <option value="gRPC">gRPC</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Port</label>
            <input
              type="number"
              value={draftContainer.healthCheck.port}
              onChange={(e) => setDraftContainer({
                ...draftContainer,
                healthCheck: { ...draftContainer.healthCheck, port: parseInt(e.target.value) || draftContainer.port }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-600 mb-1">Path</label>
            <input
              type="text"
              value={draftContainer.healthCheck.path || ''}
              onChange={(e) => setDraftContainer({
                ...draftContainer,
                healthCheck: { ...draftContainer.healthCheck, path: e.target.value }
              })}
              placeholder="/health"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Section: Networking */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Networking</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Visibility</label>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={draftContainer.exposure === 'public'}
                  onChange={() => setDraftContainer({ ...draftContainer, exposure: 'public' })}
                />
                <span className="text-slate-900">Public</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={draftContainer.exposure === 'private'}
                  onChange={() => setDraftContainer({ ...draftContainer, exposure: 'private' })}
                />
                <span className="text-slate-900">Private</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Domain</label>
            <div className="text-sm text-slate-900">
              {state.domain?.customDomain || `${state.domain?.defaultSubdomain}.unhazzle.app`}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Port</label>
            <div className="text-sm font-mono text-slate-900">{draftContainer.port}</div>
          </div>
        </div>
      </div>

      {/* Section: Service Access */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Service Access</h4>
        <div className="space-y-2 text-sm">
          {state.resources?.database && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draftContainer.serviceAccess.database}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  const envVarKey = 'UNHAZZLE_POSTGRES_URL';
                  let updatedEnvVars = [...draftContainer.environmentVariables];

                  if (enabled) {
                    const exists = updatedEnvVars.some(v => v.key === envVarKey);
                    if (!exists) {
                      updatedEnvVars.push({
                        key: envVarKey,
                        value: '',
                        masked: false
                      });
                    }
                  } else {
                    updatedEnvVars = updatedEnvVars.filter(v => v.key !== envVarKey);
                  }

                  setDraftContainer({
                    ...draftContainer,
                    serviceAccess: { ...draftContainer.serviceAccess, database: enabled },
                    environmentVariables: updatedEnvVars
                  });
                }}
              />
              <span className="text-slate-900">PostgreSQL</span>
            </label>
          )}
          {state.resources?.cache && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draftContainer.serviceAccess.cache}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  const envVarKey = 'UNHAZZLE_REDIS_URL';
                  let updatedEnvVars = [...draftContainer.environmentVariables];

                  if (enabled) {
                    const exists = updatedEnvVars.some(v => v.key === envVarKey);
                    if (!exists) {
                      updatedEnvVars.push({
                        key: envVarKey,
                        value: '',
                        masked: false
                      });
                    }
                  } else {
                    updatedEnvVars = updatedEnvVars.filter(v => v.key !== envVarKey);
                  }

                  setDraftContainer({
                    ...draftContainer,
                    serviceAccess: { ...draftContainer.serviceAccess, cache: enabled },
                    environmentVariables: updatedEnvVars
                  });
                }}
              />
              <span className="text-slate-900">Redis</span>
            </label>
          )}
          <p className="text-xs text-slate-500">Connection strings are auto-injected as environment variables.</p>
        </div>
      </div>

      {/* Changes Preview */}
      {showChanges && hasChanges && (
        <ChangesPreview
          current={container}
          draft={draftContainer}
          onClose={() => setShowChanges(false)}
        />
      )}
    </div>
  );
}

// Simplified Changes Preview Component
function ChangesPreview({ current, draft, onClose }: any) {
  // Calculate cost impact
  const costImpact = calculateContainerCostImpact(
    current.resources.cpu,
    current.resources.memory,
    current.resources.replicas,
    draft.resources.cpu,
    draft.resources.memory,
    draft.resources.replicas
  );

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-semibold text-amber-900">📝 Pending Changes</h5>
        <button onClick={onClose} className="text-xs text-amber-700 underline">Hide</button>
      </div>
      <ul className="text-sm text-amber-900 list-disc ml-5 space-y-1">
        {current.resources.cpu !== draft.resources.cpu && (
          <li>CPU: {current.resources.cpu} → {draft.resources.cpu}</li>
        )}
        {current.resources.memory !== draft.resources.memory && (
          <li>Memory: {current.resources.memory} → {draft.resources.memory}</li>
        )}
        {current.resources.replicas.min !== draft.resources.replicas.min && (
          <li>Replicas (min): {current.resources.replicas.min} → {draft.resources.replicas.min}</li>
        )}
        {current.exposure !== draft.exposure && (
          <li>Visibility: {current.exposure} → {draft.exposure}</li>
        )}
        {JSON.stringify(current.environmentVariables) !== JSON.stringify(draft.environmentVariables) && (
          <li>Environment variables updated</li>
        )}
      </ul>
      <div className="text-xs text-amber-800 mt-3">
        Impact: CPU/RAM changes require rolling restart. Estimated duration: ~2 minutes. Zero-downtime ensured.
        {costImpact !== 0 && (
          <div className="font-semibold mt-1">
            💰 Cost impact: {costImpact > 0 ? '+' : ''}${Math.abs(costImpact).toFixed(2)}/month
          </div>
        )}
      </div>
    </div>
  );
}

// Simplified Database Editor
function DatabaseEditor({ database, draftDatabase, setDraftDatabase, hasChanges, showChanges, setShowChanges, onApply, isApplying, state, onRemove }: any) {
  const handleRemove = () => {
    // Check if any container is still using the database
    const containers = state.containers || [];
    const inUse = containers.some((c: any) => c.serviceAccess?.database);
    
    if (inUse) {
      alert('Cannot remove database: one or more containers are still connected. Disable database access in container settings first.');
      return;
    }
    
    const confirmed = window.confirm('Remove database from deployed configuration? This action cannot be undone in demo mode.');
    if (confirmed) {
      onRemove();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">PostgreSQL Database</h3>
          <p className="text-xs text-slate-500">Managed {draftDatabase.engine} instance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChanges(true)}
            disabled={!hasChanges || isApplying}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              hasChanges ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
            } disabled:opacity-50`}
          >
            Show Changes
          </button>
          <button
            onClick={onApply}
            disabled={!hasChanges || isApplying}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isApplying ? 'Applying…' : 'Apply'}
          </button>
          <button
            onClick={handleRemove}
            disabled={isApplying}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Resources */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">CPU</label>
            <select
              value={draftDatabase.cpu}
              onChange={(e) => setDraftDatabase({ ...draftDatabase, cpu: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="0.5">0.5</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="8">8</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Memory</label>
            <select
              value={draftDatabase.memory}
              onChange={(e) => setDraftDatabase({ ...draftDatabase, memory: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="1GB">1GB</option>
              <option value="2GB">2GB</option>
              <option value="4GB">4GB</option>
              <option value="8GB">8GB</option>
              <option value="16GB">16GB</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Storage</label>
            <select
              value={draftDatabase.storage}
              onChange={(e) => setDraftDatabase({ ...draftDatabase, storage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="10GB">10GB</option>
              <option value="20GB">20GB</option>
              <option value="50GB">50GB</option>
              <option value="100GB">100GB</option>
              <option value="200GB">200GB</option>
              <option value="500GB">500GB</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backups */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Backups</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Frequency</label>
            <select
              value={draftDatabase.backups.frequency}
              onChange={(e) => setDraftDatabase({
                ...draftDatabase,
                backups: { ...draftDatabase.backups, frequency: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Retention</label>
            <select
              value={draftDatabase.backups.retention}
              onChange={(e) => setDraftDatabase({
                ...draftDatabase,
                backups: { ...draftDatabase.backups, retention: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="7 days">7 days</option>
              <option value="14 days">14 days</option>
              <option value="30 days">30 days</option>
              <option value="90 days">90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Enabled</label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={draftDatabase.backups.enabled}
                onChange={(e) => setDraftDatabase({
                  ...draftDatabase,
                  backups: { ...draftDatabase.backups, enabled: e.target.checked }
                })}
              />
              <span className="text-sm text-slate-900">Automatic backups</span>
            </label>
          </div>
        </div>
      </div>

      {/* Changes Preview */}
      {showChanges && hasChanges && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-amber-900">📝 Pending Changes</h5>
            <button onClick={() => setShowChanges(false)} className="text-xs text-amber-700 underline">Hide</button>
          </div>
          <ul className="text-sm text-amber-900 list-disc ml-5 space-y-1">
            {database.cpu !== draftDatabase.cpu && (
              <li>CPU: {database.cpu} → {draftDatabase.cpu}</li>
            )}
            {database.memory !== draftDatabase.memory && (
              <li>Memory: {database.memory} → {draftDatabase.memory}</li>
            )}
            {database.storage !== draftDatabase.storage && (
              <li>Storage: {database.storage} → {draftDatabase.storage}</li>
            )}
          </ul>
          <div className="text-xs text-amber-800 mt-3">
            Impact: Storage changes are instant. CPU/Memory changes require brief maintenance window (~3 min).
            {(() => {
              const costImpact = calculateDatabaseCostImpact(database, draftDatabase);
              return costImpact !== 0 ? (
                <div className="font-semibold mt-1">
                  💰 Cost impact: {costImpact > 0 ? '+' : ''}${Math.abs(costImpact).toFixed(2)}/month
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified Cache Editor
function CacheEditor({ cache, draftCache, setDraftCache, hasChanges, showChanges, setShowChanges, onApply, isApplying, state, onRemove }: any) {
  const handleRemove = () => {
    // Check if any container is still using the cache
    const containers = state.containers || [];
    const inUse = containers.some((c: any) => c.serviceAccess?.cache);
    
    if (inUse) {
      alert('Cannot remove cache: one or more containers are still connected. Disable cache access in container settings first.');
      return;
    }
    
    const confirmed = window.confirm('Remove cache from deployed configuration? This action cannot be undone in demo mode.');
    if (confirmed) {
      onRemove();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Redis Cache</h3>
          <p className="text-xs text-slate-500">Managed {draftCache.engine} instance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChanges(true)}
            disabled={!hasChanges || isApplying}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              hasChanges ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
            } disabled:opacity-50`}
          >
            Show Changes
          </button>
          <button
            onClick={onApply}
            disabled={!hasChanges || isApplying}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isApplying ? 'Applying…' : 'Apply'}
          </button>
          <button
            onClick={handleRemove}
            disabled={isApplying}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Resources */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Memory</label>
            <select
              value={draftCache.memory}
              onChange={(e) => setDraftCache({ ...draftCache, memory: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="256MB">256MB</option>
              <option value="512MB">512MB</option>
              <option value="1GB">1GB</option>
              <option value="2GB">2GB</option>
              <option value="4GB">4GB</option>
              <option value="8GB">8GB</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Version</label>
            <select
              value={draftCache.version}
              onChange={(e) => setDraftCache({ ...draftCache, version: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="7.2">7.2 (Latest)</option>
              <option value="7.0">7.0</option>
              <option value="6.2">6.2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Configuration</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Eviction Policy</label>
            <select
              value={draftCache.evictionPolicy}
              onChange={(e) => setDraftCache({ ...draftCache, evictionPolicy: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="allkeys-lru">allkeys-lru (Recommended)</option>
              <option value="volatile-lru">volatile-lru</option>
              <option value="allkeys-lfu">allkeys-lfu</option>
              <option value="volatile-lfu">volatile-lfu</option>
              <option value="noeviction">noeviction</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Persistence</label>
            <select
              value={draftCache.persistence}
              onChange={(e) => setDraftCache({ ...draftCache, persistence: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="aof">AOF (Append-only file)</option>
              <option value="rdb">RDB (Snapshots)</option>
              <option value="both">Both (AOF + RDB)</option>
              <option value="none">None (In-memory only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Changes Preview */}
      {showChanges && hasChanges && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-amber-900">📝 Pending Changes</h5>
            <button onClick={() => setShowChanges(false)} className="text-xs text-amber-700 underline">Hide</button>
          </div>
          <ul className="text-sm text-amber-900 list-disc ml-5 space-y-1">
            {cache.memory !== draftCache.memory && (
              <li>Memory: {cache.memory} → {draftCache.memory}</li>
            )}
            {cache.version !== draftCache.version && (
              <li>Version: {cache.version} → {draftCache.version}</li>
            )}
            {cache.evictionPolicy !== draftCache.evictionPolicy && (
              <li>Eviction Policy: {cache.evictionPolicy} → {draftCache.evictionPolicy}</li>
            )}
          </ul>
          <div className="text-xs text-amber-800 mt-3">
            Impact: Memory changes require restart (~30 sec). Data persisted if AOF/RDB enabled.
            {(() => {
              const costImpact = calculateCacheCostImpact(cache.memory, draftCache.memory);
              return costImpact !== 0 ? (
                <div className="font-semibold mt-1">
                  💰 Cost impact: {costImpact > 0 ? '+' : ''}${Math.abs(costImpact).toFixed(2)}/month
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Confirmation Modal
function ConfirmationModal({ selected, selectedResource, draftContainer, draftDatabase, draftCache, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Apply Configuration Changes?</h3>
            
            {selected.kind === 'container' && selectedResource && draftContainer && (
              <>
                <div className="text-sm text-slate-700 mb-4">
                  <p className="font-medium mb-2">Summary:</p>
                  <p className="text-slate-600">Container: <span className="font-mono">{selectedResource.data.name || selectedResource.data.imageUrl.split('/').pop()?.split(':')[0]}</span></p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-600">
                    {selectedResource.data.resources.cpu !== draftContainer.resources.cpu && (
                      <li>CPU: {selectedResource.data.resources.cpu} → {draftContainer.resources.cpu} cores</li>
                    )}
                    {selectedResource.data.resources.memory !== draftContainer.resources.memory && (
                      <li>Memory: {selectedResource.data.resources.memory} → {draftContainer.resources.memory}</li>
                    )}
                    {selectedResource.data.resources.replicas.min !== draftContainer.resources.replicas.min && (
                      <li>Min replicas: {selectedResource.data.resources.replicas.min} → {draftContainer.resources.replicas.min}</li>
                    )}
                  </ul>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-medium text-slate-900">Impact Assessment:</p>
                  <p className="text-slate-600">⚠️ Rolling restart required</p>
                  <p className="text-slate-600">⏱️ Estimated time: ~2 minutes</p>
                  <p className="text-slate-600">✅ No expected traffic disruption</p>
                  {(() => {
                    const costImpact = calculateContainerCostImpact(
                      selectedResource.data.resources.cpu,
                      selectedResource.data.resources.memory,
                      selectedResource.data.resources.replicas,
                      draftContainer.resources.cpu,
                      draftContainer.resources.memory,
                      draftContainer.resources.replicas
                    );
                    return costImpact !== 0 ? (
                      <p className="text-slate-600 font-medium">
                        💰 Cost impact: {costImpact > 0 ? '+' : ''}${Math.abs(costImpact).toFixed(2)}/month
                      </p>
                    ) : null;
                  })()}
                </div>
              </>
            )}

            {selected.kind === 'database' && selectedResource && draftDatabase && (
              <>
                <div className="text-sm text-slate-700 mb-4">
                  <p className="font-medium mb-2">Summary:</p>
                  <p className="text-slate-600">Resource: <span className="font-mono">PostgreSQL Database</span></p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-600">
                    {selectedResource.data.cpu !== draftDatabase.cpu && (
                      <li>CPU: {selectedResource.data.cpu} → {draftDatabase.cpu} cores</li>
                    )}
                    {selectedResource.data.memory !== draftDatabase.memory && (
                      <li>Memory: {selectedResource.data.memory} → {draftDatabase.memory}</li>
                    )}
                    {selectedResource.data.storage !== draftDatabase.storage && (
                      <li>Storage: {selectedResource.data.storage} → {draftDatabase.storage}</li>
                    )}
                  </ul>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-medium text-slate-900">Impact Assessment:</p>
                  <p className="text-slate-600">⚠️ Maintenance window required for CPU/Memory changes</p>
                  <p className="text-slate-600">⏱️ Estimated time: ~3 minutes</p>
                  <p className="text-slate-600">✅ Zero data loss guaranteed</p>
                  {(() => {
                    const costImpact = calculateDatabaseCostImpact(
                      selectedResource.data,
                      draftDatabase
                    );
                    return costImpact !== 0 ? (
                      <p className="text-slate-600 font-medium">
                        💰 Cost impact: {costImpact > 0 ? '+' : ''}${Math.abs(costImpact).toFixed(2)}/month
                      </p>
                    ) : null;
                  })()}
                </div>
              </>
            )}

            {selected.kind === 'cache' && selectedResource && draftCache && (
              <>
                <div className="text-sm text-slate-700 mb-4">
                  <p className="font-medium mb-2">Summary:</p>
                  <p className="text-slate-600">Resource: <span className="font-mono">Redis Cache</span></p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-600">
                    {selectedResource.data.memory !== draftCache.memory && (
                      <li>Memory: {selectedResource.data.memory} → {draftCache.memory}</li>
                    )}
                    {selectedResource.data.version !== draftCache.version && (
                      <li>Version: {selectedResource.data.version} → {draftCache.version}</li>
                    )}
                  </ul>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-medium text-slate-900">Impact Assessment:</p>
                  <p className="text-slate-600">⚠️ Restart required (~30 seconds)</p>
                  <p className="text-slate-600">✅ Data persisted if AOF/RDB enabled</p>
                  {(() => {
                    const costImpact = calculateCacheCostImpact(
                      selectedResource.data.memory,
                      draftCache.memory
                    );
                    return costImpact !== 0 ? (
                      <p className="text-slate-600 font-medium">
                        💰 Cost impact: {costImpact > 0 ? '+' : ''}${Math.abs(costImpact).toFixed(2)}/month
                      </p>
                    ) : null;
                  })()}
                </div>
              </>
            )}

            <p className="text-sm text-slate-600 mt-4">Are you sure you want to apply these changes?</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================
// Project & Environment Overview (Old standalone version - kept for reference)
// ======================

function ProjectEnvironmentOverview({ project, state }: { project: any; state: any }) {
  const [expandedEnvironments, setExpandedEnvironments] = useState<Record<string, boolean>>({ 'env-dev': true });
  const [selectedResource, setSelectedResource] = useState<{ type: 'container' | 'database' | 'cache'; id?: string } | null>(null);

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">No Projects Yet</h3>
        <p className="text-slate-600 mb-6">Create your first project to get started with Unhazzle</p>
        <button
          onClick={() => window.location.href = '/questionnaire'}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold"
        >
          Create Project
        </button>
      </div>
    );
  }

  const toggleEnvironment = (envId: string) => {
    setExpandedEnvironments(prev => ({ ...prev, [envId]: !prev[envId] }));
  };

  // Calculate project total cost
  const calculateProjectCost = () => {
    let total = 0;
    project.environments?.forEach((env: any) => {
      total += calculateEnvironmentCost(env);
    });
    return total;
  };

  const calculateEnvironmentCost = (env: any) => {
    let total = 0;
    
    // Container costs
    env.containers?.forEach((container: any) => {
      const cpuCores = parseFloat(container.resources.cpu);
      const memoryGB = parseFloat(container.resources.memory);
      const avgReplicas = (container.resources.replicas.min + container.resources.replicas.max) / 2;
      
      // Simplified cost calculation
      let costPerInstance = 5;
      if (cpuCores > 2 || memoryGB > 4) costPerInstance = 10;
      if (cpuCores > 4 || memoryGB > 8) costPerInstance = 18;
      
      total += costPerInstance * avgReplicas;
    });
    
    // Database cost
    if (env.database) {
      total += 45; // Base database cost
    }
    
    // Cache cost
    if (env.cache) {
      total += 15; // Base cache cost
    }
    
    return Math.round(total * 1.3); // 30% margin
  };

  const calculateContainerCost = (container: any) => {
    const cpuCores = parseFloat(container.resources.cpu);
    const memoryGB = parseFloat(container.resources.memory);
    const avgReplicas = (container.resources.replicas.min + container.resources.replicas.max) / 2;
    
    let costPerInstance = 5;
    if (cpuCores > 2 || memoryGB > 4) costPerInstance = 10;
    if (cpuCores > 4 || memoryGB > 8) costPerInstance = 18;
    
    return Math.round(costPerInstance * avgReplicas * 1.3);
  };

  const projectCost = calculateProjectCost();

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span>📦</span>
              <span>{project.name}</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {project.environments?.length || 0} environment{project.environments?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">
              €{projectCost}/mo
            </div>
            <div className="text-xs text-slate-600">Total project cost</div>
          </div>
        </div>
      </div>

      {/* Environments List */}
      <div className="space-y-4">
        {project.environments?.map((env: any) => {
          const isExpanded = expandedEnvironments[env.id] !== false;
          const envCost = calculateEnvironmentCost(env);
          const containers = env.containers || [];
          const hasDatabase = !!env.database;
          const hasCache = !!env.cache;

          return (
            <div key={env.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Environment Header */}
              <button
                onClick={() => toggleEnvironment(env.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>🔧</span>
                      <span>{env.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                        Running
                      </span>
                    </h3>
                    <p className="text-sm text-slate-600">
                      {containers.length} container{containers.length !== 1 ? 's' : ''}
                      {hasDatabase && ', database'}
                      {hasCache && ', cache'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">€{envCost}/mo</div>
                  <div className="text-xs text-slate-600">Environment cost</div>
                </div>
              </button>

              {/* Environment Resources (expandable) */}
              {isExpanded && (
                <div className="border-t border-slate-200 p-6 space-y-6">
                  {/* Containers */}
                  {containers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <span>🚀</span>
                        <span>Containers ({containers.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {containers.map((container: any, idx: number) => {
                          const displayName = container.imageUrl.split('/').pop()?.split(':')[0] || `container-${idx + 1}`;
                          const containerCost = calculateContainerCost(container);
                          const hasDbAccess = container.serviceAccess?.database;
                          const hasCacheAccess = container.serviceAccess?.cache;

                          return (
                            <div
                              key={container.id}
                              className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
                              onClick={() => setSelectedResource({ type: 'container', id: container.id })}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-lg">🐳</span>
                                    <div>
                                      <div className="font-semibold text-slate-900">{displayName}</div>
                                      <div className="text-xs text-slate-600">
                                        {container.resources.cpu} CPU • {container.resources.memory} RAM • {container.resources.replicas.min} replica{container.resources.replicas.min !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>
                                  {(hasDbAccess || hasCacheAccess) && (
                                    <div className="flex items-center gap-2 ml-8">
                                      <span className="text-xs text-slate-500">Connected to:</span>
                                      {hasDbAccess && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                          <span>💾</span>
                                          <span>Database</span>
                                        </span>
                                      )}
                                      {hasCacheAccess && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                          <span>⚡</span>
                                          <span>Cache</span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-slate-900">€{containerCost}/mo</div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                    Running
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Database */}
                  {hasDatabase && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <span>💾</span>
                        <span>Database</span>
                      </h4>
                      <div
                        className="bg-green-50 rounded-lg p-4 hover:bg-green-100 transition cursor-pointer border border-green-200"
                        onClick={() => setSelectedResource({ type: 'database' })}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">PostgreSQL</div>
                            <div className="text-xs text-slate-600 mt-1">
                              {env.database.cpu} CPU • {env.database.memory} RAM • {env.database.storage} storage
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">€45/mo</div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              Connected
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cache */}
                  {hasCache && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <span>⚡</span>
                        <span>Cache</span>
                      </h4>
                      <div
                        className="bg-red-50 rounded-lg p-4 hover:bg-red-100 transition cursor-pointer border border-red-200"
                        onClick={() => setSelectedResource({ type: 'cache' })}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">Redis</div>
                            <div className="text-xs text-slate-600 mt-1">
                              {env.cache.memory} memory • {env.cache.version}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">€15/mo</div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              Connected
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          project={project}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}

// Simple Resource Detail Modal
function ResourceDetailModal({ resource, project, onClose }: any) {
  // Find the resource data
  let resourceData = null;
  let resourceName = '';
  
  if (resource.type === 'container') {
    project.environments?.forEach((env: any) => {
      const container = env.containers?.find((c: any) => c.id === resource.id);
      if (container) {
        resourceData = container;
        resourceName = container.imageUrl.split('/').pop()?.split(':')[0] || 'Container';
      }
    });
  } else if (resource.type === 'database') {
    resourceData = project.environments?.[0]?.database;
    resourceName = 'PostgreSQL Database';
  } else if (resource.type === 'cache') {
    resourceData = project.environments?.[0]?.cache;
    resourceName = 'Redis Cache';
  }

  if (!resourceData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-slate-900">{resourceName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {resource.type === 'container' && (
            <>
              <div>
                <div className="text-sm font-semibold text-slate-600 mb-1">Image</div>
                <div className="text-sm text-slate-900 font-mono bg-slate-50 p-2 rounded">{resourceData.imageUrl}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">CPU</div>
                  <div className="text-sm text-slate-900">{resourceData.resources.cpu} cores</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Memory</div>
                  <div className="text-sm text-slate-900">{resourceData.resources.memory}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Replicas</div>
                  <div className="text-sm text-slate-900">{resourceData.resources.replicas.min} - {resourceData.resources.replicas.max}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Port</div>
                  <div className="text-sm text-slate-900">{resourceData.port}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-600 mb-1">Exposure</div>
                <div className="text-sm text-slate-900 capitalize">{resourceData.exposure}</div>
              </div>
              {(resourceData.serviceAccess?.database || resourceData.serviceAccess?.cache) && (
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-2">Service Access</div>
                  <div className="flex gap-2">
                    {resourceData.serviceAccess.database && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        💾 Database
                      </span>
                    )}
                    {resourceData.serviceAccess.cache && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        ⚡ Cache
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {resource.type === 'database' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Engine</div>
                  <div className="text-sm text-slate-900">{resourceData.engine}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Version</div>
                  <div className="text-sm text-slate-900">{resourceData.version}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">CPU</div>
                  <div className="text-sm text-slate-900">{resourceData.cpu} cores</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Memory</div>
                  <div className="text-sm text-slate-900">{resourceData.memory}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Storage</div>
                  <div className="text-sm text-slate-900">{resourceData.storage}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Backups</div>
                  <div className="text-sm text-slate-900">{resourceData.backups.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
            </>
          )}

          {resource.type === 'cache' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Engine</div>
                  <div className="text-sm text-slate-900">{resourceData.engine}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Version</div>
                  <div className="text-sm text-slate-900">{resourceData.version}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Memory</div>
                  <div className="text-sm text-slate-900">{resourceData.memory}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Eviction Policy</div>
                  <div className="text-sm text-slate-900 font-mono text-xs">{resourceData.evictionPolicy}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================
// Overview Config Panel (Legacy - kept for Settings redirect)
// ======================

type ResourceKind = 'application' | 'database' | 'cache' | 'architecture';

function OverviewConfig() {
  const { state, updateContainer, updateResources, removeDatabase, removeCache } = useDeployment();
  const [selected, setSelected] = useState<{ kind: ResourceKind; id?: string }>(() => ({
    kind: 'application',
    id: state.containers[0]?.id,
  }));

  // Draft state for staged edits (per selected resource)
  const selectedContainer = selected.kind === 'application'
    ? state.containers.find(c => c.id === selected.id)
    : undefined;

  const [draftContainer, setDraftContainer] = useState<typeof selectedContainer | null>(selectedContainer || null);
  const [draftDatabase, setDraftDatabase] = useState<any>(state.resources?.database || null);
  const [draftCache, setDraftCache] = useState<any>(state.resources?.cache || null);
  const [showChanges, setShowChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Keep draft in sync when selection changes
  useEffect(() => {
    if (selected.kind === 'application') {
      const c = state.containers.find(x => x.id === selected.id);
      if (c) {
        const deep = JSON.parse(JSON.stringify(c));
        if (!Array.isArray(deep.environmentVariables)) deep.environmentVariables = [];
        setDraftContainer(deep);
      } else {
        setDraftContainer(null);
      }
    } else if (selected.kind === 'database') {
      setDraftContainer(null);
      setDraftDatabase(state.resources?.database ? JSON.parse(JSON.stringify(state.resources.database)) : null);
    } else if (selected.kind === 'cache') {
      setDraftContainer(null);
      setDraftCache(state.resources?.cache ? JSON.parse(JSON.stringify(state.resources.cache)) : null);
    } else {
      setDraftContainer(null);
    }
  }, [selected, state.containers, state.resources]);

  const hasContainerChanges = () => {
    if (!selectedContainer || !draftContainer) return false;
    return JSON.stringify({
      resources: draftContainer.resources,
      healthCheck: draftContainer.healthCheck,
      exposure: draftContainer.exposure,
      serviceAccess: draftContainer.serviceAccess,
      environmentVariables: draftContainer.environmentVariables,
    }) !== JSON.stringify({
      resources: selectedContainer.resources,
      healthCheck: selectedContainer.healthCheck,
      exposure: selectedContainer.exposure,
      serviceAccess: selectedContainer.serviceAccess,
      environmentVariables: selectedContainer.environmentVariables,
    });
  };

  const hasDatabaseChanges = () => {
    if (!state.resources?.database || !draftDatabase) return false;
    return JSON.stringify(draftDatabase) !== JSON.stringify(state.resources.database);
  };

  const hasCacheChanges = () => {
    if (!state.resources?.cache || !draftCache) return false;
    return JSON.stringify(draftCache) !== JSON.stringify(state.resources.cache);
  };

  const initiateContainerApply = () => {
    setShowConfirmation(true);
    setShowChanges(false);
  };

  const applyContainerChanges = () => {
    if (!selectedContainer || !draftContainer) return;
    setShowConfirmation(false);
    setIsApplying(true);
    setTimeout(() => {
      updateContainer(selectedContainer.id, {
        resources: draftContainer.resources,
        healthCheck: draftContainer.healthCheck,
        exposure: draftContainer.exposure,
        serviceAccess: draftContainer.serviceAccess,
        environmentVariables: draftContainer.environmentVariables,
      });
      setIsApplying(false);
    }, 800);
  };

  const initiateDatabaseApply = () => {
    setShowConfirmation(true);
    setShowChanges(false);
  };

  const applyDatabaseChanges = () => {
    if (!draftDatabase || !state.resources) return;
    const res = state.resources;
    setShowConfirmation(false);
    setIsApplying(true);
    setTimeout(() => {
      updateResources({
        replicas: res.replicas,
        cpu: res.cpu,
        memory: res.memory,
        database: draftDatabase,
        cache: res.cache,
      });
      setIsApplying(false);
    }, 800);
  };

  const initiateCacheApply = () => {
    setShowConfirmation(true);
    setShowChanges(false);
  };

  const applyCacheChanges = () => {
    if (!draftCache || !state.resources) return;
    const res = state.resources;
    setShowConfirmation(false);
    setIsApplying(true);
    setTimeout(() => {
      updateResources({
        replicas: res.replicas,
        cpu: res.cpu,
        memory: res.memory,
        database: res.database,
        cache: draftCache,
      });
      setIsApplying(false);
    }, 800);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Sidebar */}
      <div className="col-span-12 lg:col-span-4 xl:col-span-3">
        <div className="bg-white rounded-xl shadow-lg p-4 space-y-5 sticky top-4">
          {/* Applications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900">Applications</h4>
              <span className="text-xs text-slate-500">{state.containers.length}</span>
            </div>
            <div className="space-y-2">
              {state.containers.map((c, idx) => {
                const displayName = c.imageUrl.split('/').pop()?.split(':')[0] || `container-${idx + 1}`;
                const isSelected = selected.kind === 'application' && selected.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected({ kind: 'application', id: c.id })}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-center justify-between ${
                      isSelected ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{displayName}</div>
                      <div className="text-xs text-slate-500">{c.resources.replicas.min}/{c.resources.replicas.min} replicas</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Running
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Databases */}
          {state.resources?.database && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Databases</h4>
              <button
                onClick={() => setSelected({ kind: 'database' })}
                className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                  selected.kind === 'database' ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">PostgreSQL</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Connected</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{state.resources.database.storage} storage</div>
              </button>
              <button
                onClick={() => {
                  const inUse = state.containers.some(c => c.serviceAccess.database);
                  if (inUse) {
                    alert('Cannot remove database: one or more applications are still connected. Disable access first in application settings.');
                    return;
                  }
                  const confirmed = window.confirm('Remove database from deployed configuration? This simulates deprovisioning.');
                  if (!confirmed) return;
                  removeDatabase();
                }}
                className="mt-2 w-full text-left text-xs text-red-600 hover:text-red-700 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                Remove Database
              </button>
            </div>
          )}

          {/* Caches */}
          {state.resources?.cache && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Caches</h4>
              <button
                onClick={() => setSelected({ kind: 'cache' })}
                className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                  selected.kind === 'cache' ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">Redis</span>
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Connected</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{state.resources.cache.memory} memory</div>
              </button>
              <button
                onClick={() => {
                  const inUse = state.containers.some(c => c.serviceAccess.cache);
                  if (inUse) {
                    alert('Cannot remove cache: one or more applications are still connected. Disable access first in application settings.');
                    return;
                  }
                  const confirmed = window.confirm('Remove cache from deployed configuration? This simulates deprovisioning.');
                  if (!confirmed) return;
                  removeCache();
                }}
                className="mt-2 w-full text-left text-xs text-red-600 hover:text-red-700 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                Remove Cache
              </button>
            </div>
          )}

          {/* Architecture Diagram */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Documentation</h4>
            <button
              onClick={() => setSelected({ kind: 'architecture' })}
              className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                selected.kind === 'architecture' ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <span className="text-xl">🏗️</span>
                <span>Architecture Diagram</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">View infrastructure topology</div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {selected.kind === 'application' && selectedContainer && draftContainer && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedContainer.name || 'Application Container'}</h3>
                  <p className="text-xs text-slate-500">Image: {selectedContainer.imageUrl}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowChanges(true)}
                    disabled={!hasContainerChanges() || isApplying}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                      hasContainerChanges() ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
                    } disabled:opacity-50`}
                  >
                    Show Changes
                  </button>
                  <button
                    onClick={initiateContainerApply}
                    disabled={!hasContainerChanges() || isApplying}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isApplying ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Public Endpoint (if applicable) */}
              {selectedContainer.exposure === 'public' && (() => {
                // Generate stable endpoint ID from container ID
                const displayName = selectedContainer.imageUrl.split('/').pop()?.split(':')[0] || 'app';
                const stableId = selectedContainer.id.substring(0, 6);
                const domain = `${displayName}-${stableId}.unhazzle.app`;
                
                return (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-600 uppercase">Public Endpoint</span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Live</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-purple-600 font-mono">
                            https://{domain}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`https://${domain}`);
                            }}
                            className="p-1 hover:bg-slate-200 rounded transition text-sm"
                            title="Copy to clipboard"
                          >
                            📋
                          </button>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Port {selectedContainer.port} • SSL Enabled • CDN Cached
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section: Resources */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">CPU</label>
                    <select
                      value={draftContainer.resources.cpu}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        resources: { ...draftContainer.resources, cpu: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="0.25">0.25</option>
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Memory</label>
                    <select
                      value={draftContainer.resources.memory}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        resources: { ...draftContainer.resources, memory: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="0.5GB">0.5GB</option>
                      <option value="1GB">1GB</option>
                      <option value="2GB">2GB</option>
                      <option value="4GB">4GB</option>
                      <option value="8GB">8GB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Replicas (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={draftContainer.resources.replicas.min}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        resources: {
                          ...draftContainer.resources,
                          replicas: { ...draftContainer.resources.replicas, min: Math.max(1, parseInt(e.target.value) || 1) }
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Set min=max for fixed scaling. Different values enable auto-scaling.</p>
              </div>

              {/* Section: Environment Variables (editable) */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Environment Variables</h4>
                <div className="space-y-3">
                  {draftContainer.environmentVariables.length === 0 && (
                    <div className="text-xs text-slate-500">No variables defined yet.</div>
                  )}
                  {draftContainer.environmentVariables.map((env, idx) => (
                    <div key={idx} className="grid md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-4">
                        <label className="block text-xs text-slate-600 mb-1">Key</label>
                        <input
                          type="text"
                          value={env.key}
                          onChange={(e) => {
                            const next = [...draftContainer.environmentVariables];
                            next[idx] = { ...next[idx], key: e.target.value };
                            setDraftContainer({ ...draftContainer, environmentVariables: next });
                          }}
                          placeholder="KEY"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block text-xs text-slate-600 mb-1">Value</label>
                        <div className="flex items-center gap-2">
                          <input
                            type={env.masked === false ? 'text' : 'password'}
                            value={env.value}
                            onChange={(e) => {
                              const next = [...draftContainer.environmentVariables];
                              next[idx] = { ...next[idx], value: e.target.value };
                              setDraftContainer({ ...draftContainer, environmentVariables: next });
                            }}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...draftContainer.environmentVariables];
                              const currentMasked = next[idx].masked !== false; // treat undefined as masked=true
                              next[idx] = { ...next[idx], masked: !currentMasked };
                              setDraftContainer({ ...draftContainer, environmentVariables: next });
                            }}
                            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900"
                            aria-label={env.masked === false ? 'Hide value' : 'Show value'}
                            title={env.masked === false ? 'Hide value' : 'Show value'}
                          >
                            {env.masked === false ? (
                              // Eye-off icon
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <ellipse cx="12" cy="12" rx="9" ry="6" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                                <line x1="4" y1="20" x2="20" y2="4" />
                              </svg>
                            ) : (
                              // Eye icon
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <ellipse cx="12" cy="12" rx="9" ry="6" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs mb-1 invisible">Action</label>
                        <button
                          type="button"
                          onClick={() => {
                            const next = draftContainer.environmentVariables.filter((_, i) => i !== idx);
                            setDraftContainer({ ...draftContainer, environmentVariables: next });
                          }}
                          className="w-full md:w-auto px-3 py-2 text-xs rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>🔐</span>
                      <span>Values are masked by default and stored encrypted.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [
                          ...draftContainer.environmentVariables,
                          { key: '', value: '', masked: true },
                        ];
                        setDraftContainer({ ...draftContainer, environmentVariables: next });
                      }}
                      className="px-3 py-2 text-xs rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900"
                    >
                      + Add variable
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Health Check */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Health Check</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Protocol</label>
                    <select
                      value={draftContainer.healthCheck.protocol}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        healthCheck: { ...draftContainer.healthCheck, protocol: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="HTTP">HTTP</option>
                      <option value="TCP">TCP</option>
                      <option value="gRPC">gRPC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Port</label>
                    <input
                      type="number"
                      value={draftContainer.healthCheck.port}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        healthCheck: { ...draftContainer.healthCheck, port: parseInt(e.target.value) || draftContainer.port }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">Path</label>
                    <input
                      type="text"
                      value={draftContainer.healthCheck.path || ''}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        healthCheck: { ...draftContainer.healthCheck, path: e.target.value }
                      })}
                      placeholder="/health"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Interval</label>
                    <input
                      type="text"
                      value={draftContainer.healthCheck.interval}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        healthCheck: { ...draftContainer.healthCheck, interval: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Timeout</label>
                    <input
                      type="text"
                      value={draftContainer.healthCheck.timeout}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        healthCheck: { ...draftContainer.healthCheck, timeout: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Retries</label>
                    <input
                      type="number"
                      min={0}
                      value={draftContainer.healthCheck.retries}
                      onChange={(e) => setDraftContainer({
                        ...draftContainer,
                        healthCheck: { ...draftContainer.healthCheck, retries: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Using recommended values.</p>
              </div>

              {/* Section: Networking */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Networking</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Visibility</label>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          checked={draftContainer.exposure === 'public'}
                          onChange={() => setDraftContainer({ ...draftContainer, exposure: 'public' })}
                        />
                        <span className="text-slate-900">Public</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          checked={draftContainer.exposure === 'private'}
                          onChange={() => setDraftContainer({ ...draftContainer, exposure: 'private' })}
                        />
                        <span className="text-slate-900">Private</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Domain</label>
                    <div className="text-sm text-slate-900">
                      {state.domain?.customDomain || `${state.domain?.defaultSubdomain}.unhazzle.app`}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Port</label>
                    <div className="text-sm font-mono text-slate-900">{draftContainer.port}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Internal DNS is auto-configured.</p>
              </div>

              {/* Section: Service Access */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Service Access</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draftContainer.serviceAccess.database}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const envVarKey = 'UNHAZZLE_POSTGRES_URL';
                        let updatedEnvVars = [...draftContainer.environmentVariables];

                        if (enabled) {
                          // Add the infrastructure env var if it doesn't exist
                          const exists = updatedEnvVars.some(v => v.key === envVarKey);
                          if (!exists) {
                            updatedEnvVars.push({
                              key: envVarKey,
                              value: '',
                              masked: false
                            });
                          }
                        } else {
                          // Remove the infrastructure env var
                          updatedEnvVars = updatedEnvVars.filter(v => v.key !== envVarKey);
                        }

                        setDraftContainer({
                          ...draftContainer,
                          serviceAccess: { ...draftContainer.serviceAccess, database: enabled },
                          environmentVariables: updatedEnvVars
                        });
                      }}
                    />
                    <span className="text-slate-900">PostgreSQL</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draftContainer.serviceAccess.cache}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const envVarKey = 'UNHAZZLE_REDIS_URL';
                        let updatedEnvVars = [...draftContainer.environmentVariables];

                        if (enabled) {
                          // Add the infrastructure env var if it doesn't exist
                          const exists = updatedEnvVars.some(v => v.key === envVarKey);
                          if (!exists) {
                            updatedEnvVars.push({
                              key: envVarKey,
                              value: '',
                              masked: false
                            });
                          }
                        } else {
                          // Remove the infrastructure env var
                          updatedEnvVars = updatedEnvVars.filter(v => v.key !== envVarKey);
                        }

                        setDraftContainer({
                          ...draftContainer,
                          serviceAccess: { ...draftContainer.serviceAccess, cache: enabled },
                          environmentVariables: updatedEnvVars
                        });
                      }}
                    />
                    <span className="text-slate-900">Redis</span>
                  </label>
                  <p className="text-xs text-slate-500">Connection strings are auto-injected as environment variables.</p>
                </div>
              </div>

              {/* Changes Preview */}
              {showChanges && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-amber-900">📝 Pending Changes</h5>
                    <button onClick={() => setShowChanges(false)} className="text-xs text-amber-700 underline">Hide</button>
                  </div>
                  <ul className="text-sm text-amber-900 list-disc ml-5 space-y-1">
                    {selectedContainer.resources.cpu !== draftContainer.resources.cpu && (
                      <li>CPU: {selectedContainer.resources.cpu} → {draftContainer.resources.cpu}</li>
                    )}
                    {selectedContainer.resources.memory !== draftContainer.resources.memory && (
                      <li>Memory: {selectedContainer.resources.memory} → {draftContainer.resources.memory}</li>
                    )}
                    {selectedContainer.resources.replicas.min !== draftContainer.resources.replicas.min && (
                      <li>Replicas (min): {selectedContainer.resources.replicas.min} → {draftContainer.resources.replicas.min}</li>
                    )}
                    {selectedContainer.healthCheck.protocol !== draftContainer.healthCheck.protocol && (
                      <li>Health Check Protocol: {selectedContainer.healthCheck.protocol} → {draftContainer.healthCheck.protocol}</li>
                    )}
                    {selectedContainer.healthCheck.port !== draftContainer.healthCheck.port && (
                      <li>Health Check Port: {selectedContainer.healthCheck.port} → {draftContainer.healthCheck.port}</li>
                    )}
                    {(selectedContainer.healthCheck.path || '') !== (draftContainer.healthCheck.path || '') && (
                      <li>Health Check Path: {selectedContainer.healthCheck.path || '—'} → {draftContainer.healthCheck.path || '—'}</li>
                    )}
                    {selectedContainer.exposure !== draftContainer.exposure && (
                      <li>Visibility: {selectedContainer.exposure} → {draftContainer.exposure}</li>
                    )}
                    {selectedContainer.serviceAccess.database !== draftContainer.serviceAccess.database && (
                      <li>PostgreSQL access: {selectedContainer.serviceAccess.database ? 'On' : 'Off'} → {draftContainer.serviceAccess.database ? 'On' : 'Off'}</li>
                    )}
                    {selectedContainer.serviceAccess.cache !== draftContainer.serviceAccess.cache && (
                      <li>Redis access: {selectedContainer.serviceAccess.cache ? 'On' : 'Off'} → {draftContainer.serviceAccess.cache ? 'On' : 'Off'}</li>
                    )}
                    {JSON.stringify(selectedContainer.environmentVariables) !== JSON.stringify(draftContainer.environmentVariables) && (
                      <li>Environment variables updated</li>
                    )}
                  </ul>
                  <div className="text-xs text-amber-800 mt-3">
                    Impact: CPU/RAM changes require rolling restart. Estimated duration: ~2 minutes. Zero-downtime ensured.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database Panel */}
          {selected.kind === 'database' && draftDatabase && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">PostgreSQL Database</h3>
                  <p className="text-xs text-slate-500">Managed {draftDatabase.engine} instance</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowChanges(true)}
                    disabled={!hasDatabaseChanges() || isApplying}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                      hasDatabaseChanges() ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
                    } disabled:opacity-50`}
                  >
                    Show Changes
                  </button>
                  <button
                    onClick={initiateDatabaseApply}
                    disabled={!hasDatabaseChanges() || isApplying}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isApplying ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Connection URL */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Connection URL</h4>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 flex items-center justify-between">
                  <code className="break-all">postgres://unhazzle_user:***@db-prod-{state.domain?.defaultSubdomain || 'app'}.internal:5432/main</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`postgres://unhazzle_user:secret@db-prod-${state.domain?.defaultSubdomain || 'app'}.internal:5432/main`);
                      alert('Connection URL copied to clipboard!');
                    }}
                    className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Injected as DATABASE_URL environment variable.</p>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">CPU</label>
                    <select
                      value={draftDatabase.cpu}
                      onChange={(e) => setDraftDatabase({ ...draftDatabase, cpu: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                      <option value="8">8</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Memory</label>
                    <select
                      value={draftDatabase.memory}
                      onChange={(e) => setDraftDatabase({ ...draftDatabase, memory: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="1GB">1GB</option>
                      <option value="2GB">2GB</option>
                      <option value="4GB">4GB</option>
                      <option value="8GB">8GB</option>
                      <option value="16GB">16GB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Storage</label>
                    <select
                      value={draftDatabase.storage}
                      onChange={(e) => setDraftDatabase({ ...draftDatabase, storage: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="10GB">10GB</option>
                      <option value="20GB">20GB</option>
                      <option value="50GB">50GB</option>
                      <option value="100GB">100GB</option>
                      <option value="200GB">200GB</option>
                      <option value="500GB">500GB</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Backups */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Backups</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Frequency</label>
                    <select
                      value={draftDatabase.backups.frequency}
                      onChange={(e) => setDraftDatabase({
                        ...draftDatabase,
                        backups: { ...draftDatabase.backups, frequency: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Retention</label>
                    <select
                      value={draftDatabase.backups.retention}
                      onChange={(e) => setDraftDatabase({
                        ...draftDatabase,
                        backups: { ...draftDatabase.backups, retention: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="7 days">7 days</option>
                      <option value="14 days">14 days</option>
                      <option value="30 days">30 days</option>
                      <option value="90 days">90 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Enabled</label>
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={draftDatabase.backups.enabled}
                        onChange={(e) => setDraftDatabase({
                          ...draftDatabase,
                          backups: { ...draftDatabase.backups, enabled: e.target.checked }
                        })}
                      />
                      <span className="text-sm text-slate-900">Automatic backups</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Point-in-time recovery available for all plans.</p>
              </div>

              {/* High Availability */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">High Availability</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Replicas</label>
                    <select
                      value={draftDatabase.replicas}
                      onChange={(e) => setDraftDatabase({ ...draftDatabase, replicas: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="none">None (Single instance)</option>
                      <option value="1">1 Standby Replica</option>
                      <option value="2">2 Standby Replicas</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="text-xs text-slate-600">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">✓ Connection pooling enabled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes Preview */}
              {showChanges && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-amber-900">📝 Pending Changes</h5>
                    <button onClick={() => setShowChanges(false)} className="text-xs text-amber-700 underline">Hide</button>
                  </div>
                  <ul className="text-sm text-amber-900 list-disc ml-5 space-y-1">
                    {state.resources?.database && draftDatabase.cpu !== state.resources.database.cpu && (
                      <li>CPU: {state.resources.database.cpu} → {draftDatabase.cpu}</li>
                    )}
                    {state.resources?.database && draftDatabase.memory !== state.resources.database.memory && (
                      <li>Memory: {state.resources.database.memory} → {draftDatabase.memory}</li>
                    )}
                    {state.resources?.database && draftDatabase.storage !== state.resources.database.storage && (
                      <li>Storage: {state.resources.database.storage} → {draftDatabase.storage}</li>
                    )}
                    {state.resources?.database && draftDatabase.backups.frequency !== state.resources.database.backups.frequency && (
                      <li>Backup frequency: {state.resources.database.backups.frequency} → {draftDatabase.backups.frequency}</li>
                    )}
                    {state.resources?.database && draftDatabase.backups.retention !== state.resources.database.backups.retention && (
                      <li>Backup retention: {state.resources.database.backups.retention} → {draftDatabase.backups.retention}</li>
                    )}
                    {state.resources?.database && draftDatabase.replicas !== state.resources.database.replicas && (
                      <li>Replicas: {state.resources.database.replicas} → {draftDatabase.replicas}</li>
                    )}
                  </ul>
                  <div className="text-xs text-amber-800 mt-3">
                    Impact: Storage changes are instant. CPU/Memory changes require brief maintenance window (~3 min). Zero data loss guaranteed.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cache (Redis) Panel */}
          {selected.kind === 'cache' && draftCache && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Redis Cache</h3>
                  <p className="text-xs text-slate-500">Managed {draftCache.engine} instance</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowChanges(true)}
                    disabled={!hasCacheChanges() || isApplying}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                      hasCacheChanges() ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
                    } disabled:opacity-50`}
                  >
                    Show Changes
                  </button>
                  <button
                    onClick={initiateCacheApply}
                    disabled={!hasCacheChanges() || isApplying}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isApplying ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Connection URL */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Connection URL</h4>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 flex items-center justify-between">
                  <code className="break-all">redis://:***@redis-prod-{state.domain?.defaultSubdomain || 'app'}.internal:6379/0</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`redis://:secret@redis-prod-${state.domain?.defaultSubdomain || 'app'}.internal:6379/0`);
                      alert('Connection URL copied to clipboard!');
                    }}
                    className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Injected as REDIS_URL environment variable.</p>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Memory</label>
                    <select
                      value={draftCache.memory}
                      onChange={(e) => setDraftCache({ ...draftCache, memory: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="256MB">256MB</option>
                      <option value="512MB">512MB</option>
                      <option value="1GB">1GB</option>
                      <option value="2GB">2GB</option>
                      <option value="4GB">4GB</option>
                      <option value="8GB">8GB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Version</label>
                    <select
                      value={draftCache.version}
                      onChange={(e) => setDraftCache({ ...draftCache, version: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="7.2">7.2 (Latest)</option>
                      <option value="7.0">7.0</option>
                      <option value="6.2">6.2</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Configuration</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Eviction Policy</label>
                    <select
                      value={draftCache.evictionPolicy}
                      onChange={(e) => setDraftCache({ ...draftCache, evictionPolicy: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="allkeys-lru">allkeys-lru (Recommended)</option>
                      <option value="volatile-lru">volatile-lru</option>
                      <option value="allkeys-lfu">allkeys-lfu</option>
                      <option value="volatile-lfu">volatile-lfu</option>
                      <option value="noeviction">noeviction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Persistence</label>
                    <select
                      value={draftCache.persistence}
                      onChange={(e) => setDraftCache({ ...draftCache, persistence: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="aof">AOF (Append-only file)</option>
                      <option value="rdb">RDB (Snapshots)</option>
                      <option value="both">Both (AOF + RDB)</option>
                      <option value="none">None (In-memory only)</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">AOF persistence recommended for durability.</p>
              </div>

              {/* Changes Preview */}
              {showChanges && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-amber-900">📝 Pending Changes</h5>
                    <button onClick={() => setShowChanges(false)} className="text-xs text-amber-700 underline">Hide</button>
                  </div>
                  <ul className="text-sm text-amber-900 list-disc ml-5 space-y-1">
                    {state.resources?.cache && draftCache.memory !== state.resources.cache.memory && (
                      <li>Memory: {state.resources.cache.memory} → {draftCache.memory}</li>
                    )}
                    {state.resources?.cache && draftCache.version !== state.resources.cache.version && (
                      <li>Version: {state.resources.cache.version} → {draftCache.version}</li>
                    )}
                    {state.resources?.cache && draftCache.evictionPolicy !== state.resources.cache.evictionPolicy && (
                      <li>Eviction Policy: {state.resources.cache.evictionPolicy} → {draftCache.evictionPolicy}</li>
                    )}
                    {state.resources?.cache && draftCache.persistence !== state.resources.cache.persistence && (
                      <li>Persistence: {state.resources.cache.persistence} → {draftCache.persistence}</li>
                    )}
                  </ul>
                  <div className="text-xs text-amber-800 mt-3">
                    Impact: Memory changes require restart (~30 sec). Data persisted if AOF/RDB enabled.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Architecture Diagram View */}
          {selected.kind === 'architecture' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span>🏗️</span>
                  <span>Architecture Diagram</span>
                </h2>
                <p className="text-slate-600">
                  Visual representation of your deployed infrastructure, including container connections and internal DNS.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <p className="text-sm text-blue-900 font-semibold mb-1">
                      Read-Only Reference
                    </p>
                    <p className="text-sm text-blue-800">
                      This diagram shows your <strong>deployed</strong> infrastructure. 
                      To edit resources, use the configuration panels in the left sidebar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Architecture Visualization */}
              <ArchitectureDiagram state={state} />

              {/* Internal DNS Reference Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🔗</span>
                  <span>Internal DNS Names</span>
                </h3>

                <div className="space-y-3 text-sm">
                  <p className="text-slate-600 mb-4">
                    Use these hostnames for container-to-container communication:
                  </p>

                  {/* Container DNS entries */}
                  {state.containers.map((container: any, index: number) => {
                    const displayName = container.imageUrl.split('/').pop()?.split(':')[0] || `container-${index + 1}`;
                    const serviceName = container.serviceName || `container-${container.id.substring(0, 8)}`;
                    return (
                      <div key={container.id} className="flex items-center justify-between py-2 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🚀</span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              Container {index + 1}
                            </p>
                            <p className="text-xs text-slate-500">
                              {displayName}
                            </p>
                          </div>
                        </div>
                        <code className="bg-white px-3 py-1 rounded border border-slate-300 font-mono text-xs">
                          {serviceName}.internal
                        </code>
                      </div>
                    );
                  })}

                  {/* Database DNS */}
                  {state.resources?.database && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🐘</span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            PostgreSQL Database
                          </p>
                          <p className="text-xs text-slate-500">
                            Internal network only
                          </p>
                        </div>
                      </div>
                      <code className="bg-white px-3 py-1 rounded border border-slate-300 font-mono text-xs">
                        postgres.internal
                      </code>
                    </div>
                  )}

                  {/* Cache DNS */}
                  {state.resources?.cache && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">⚡</span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Redis Cache
                          </p>
                          <p className="text-xs text-slate-500">
                            Internal network only
                          </p>
                        </div>
                      </div>
                      <code className="bg-white px-3 py-1 rounded border border-slate-300 font-mono text-xs">
                        redis.internal
                      </code>
                    </div>
                  )}
                </div>

                {/* Usage Example */}
                <div className="mt-6 bg-white border border-slate-300 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Example Connection String:
                  </p>
                  <code className="text-xs font-mono text-slate-900 block">
                    postgresql://user:pass@postgres.internal:5432/dbname
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Apply Configuration Changes?</h3>
                
                {/* Container Changes Summary */}
                {selected.kind === 'application' && selectedContainer && draftContainer && (
                  <>
                    <div className="text-sm text-slate-700 mb-4">
                      <p className="font-medium mb-2">Summary:</p>
                      <p className="text-slate-600">Container: <span className="font-mono">{selectedContainer.name || selectedContainer.imageUrl.split('/').pop()?.split(':')[0]}</span></p>
                      <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-600">
                        {selectedContainer.resources.cpu !== draftContainer.resources.cpu && (
                          <li>CPU: {selectedContainer.resources.cpu} → {draftContainer.resources.cpu} cores</li>
                        )}
                        {selectedContainer.resources.memory !== draftContainer.resources.memory && (
                          <li>Memory: {selectedContainer.resources.memory} → {draftContainer.resources.memory}</li>
                        )}
                        {selectedContainer.resources.replicas.min !== draftContainer.resources.replicas.min && (
                          <li>Min replicas: {selectedContainer.resources.replicas.min} → {draftContainer.resources.replicas.min}</li>
                        )}
                        {JSON.stringify(selectedContainer.environmentVariables) !== JSON.stringify(draftContainer.environmentVariables) && (
                          <li>Environment variables updated</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                      <p className="font-medium text-slate-900">Impact Assessment:</p>
                      <p className="text-slate-600">⚠️ Rolling restart required</p>
                      <p className="text-slate-600">⏱️ Estimated time: ~2 minutes</p>
                      <p className="text-slate-600">✅ No expected traffic disruption</p>
                      {(() => {
                        const costImpact = calculateContainerCostImpact(
                          selectedContainer.resources.cpu,
                          selectedContainer.resources.memory,
                          selectedContainer.resources.replicas,
                          draftContainer.resources.cpu,
                          draftContainer.resources.memory,
                          draftContainer.resources.replicas
                        );
                        return costImpact !== 0 ? (
                          <p className="text-slate-600 font-medium">
                            📊 Cost impact: {costImpact > 0 ? '+' : ''}€{Math.abs(costImpact)}/month
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </>
                )}

                {/* Database Changes Summary */}
                {selected.kind === 'database' && state.resources?.database && draftDatabase && (
                  <>
                    <div className="text-sm text-slate-700 mb-4">
                      <p className="font-medium mb-2">Summary:</p>
                      <p className="text-slate-600">Resource: <span className="font-mono">PostgreSQL Database</span></p>
                      <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-600">
                        {state.resources.database.cpu !== draftDatabase.cpu && (
                          <li>CPU: {state.resources.database.cpu} → {draftDatabase.cpu} cores</li>
                        )}
                        {state.resources.database.memory !== draftDatabase.memory && (
                          <li>Memory: {state.resources.database.memory} → {draftDatabase.memory}</li>
                        )}
                        {state.resources.database.storage !== draftDatabase.storage && (
                          <li>Storage: {state.resources.database.storage} → {draftDatabase.storage}</li>
                        )}
                        {state.resources.database.replicas !== draftDatabase.replicas && (
                          <li>Replicas: {state.resources.database.replicas} → {draftDatabase.replicas}</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                      <p className="font-medium text-slate-900">Impact Assessment:</p>
                      <p className="text-slate-600">⚠️ Maintenance window required for CPU/Memory changes</p>
                      <p className="text-slate-600">⏱️ Estimated time: ~3 minutes</p>
                      <p className="text-slate-600">✅ Zero data loss guaranteed</p>
                      {(() => {
                        const costImpact = calculateDatabaseCostImpact(
                          state.resources.database,
                          draftDatabase
                        );
                        return costImpact !== 0 ? (
                          <p className="text-slate-600 font-medium">
                            📊 Cost impact: {costImpact > 0 ? '+' : ''}€{Math.abs(costImpact)}/month
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </>
                )}

                {/* Cache Changes Summary */}
                {selected.kind === 'cache' && state.resources?.cache && draftCache && (
                  <>
                    <div className="text-sm text-slate-700 mb-4">
                      <p className="font-medium mb-2">Summary:</p>
                      <p className="text-slate-600">Resource: <span className="font-mono">Redis Cache</span></p>
                      <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-600">
                        {state.resources.cache.memory !== draftCache.memory && (
                          <li>Memory: {state.resources.cache.memory} → {draftCache.memory}</li>
                        )}
                        {state.resources.cache.version !== draftCache.version && (
                          <li>Version: {state.resources.cache.version} → {draftCache.version}</li>
                        )}
                        {state.resources.cache.evictionPolicy !== draftCache.evictionPolicy && (
                          <li>Eviction policy: {state.resources.cache.evictionPolicy} → {draftCache.evictionPolicy}</li>
                        )}
                        {state.resources.cache.persistence !== draftCache.persistence && (
                          <li>Persistence: {state.resources.cache.persistence} → {draftCache.persistence}</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                      <p className="font-medium text-slate-900">Impact Assessment:</p>
                      <p className="text-slate-600">⚠️ Restart required (~30 seconds)</p>
                      <p className="text-slate-600">✅ Data persisted if AOF/RDB enabled</p>
                      {(() => {
                        const costImpact = calculateCacheCostImpact(
                          state.resources.cache.memory,
                          draftCache.memory
                        );
                        return costImpact !== 0 ? (
                          <p className="text-slate-600 font-medium">
                            📊 Cost impact: {costImpact > 0 ? '+' : ''}€{Math.abs(costImpact)}/month
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </>
                )}

                <p className="text-sm text-slate-600 mt-4">Are you sure you want to apply these changes?</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selected.kind === 'application') applyContainerChanges();
                  else if (selected.kind === 'database') applyDatabaseChanges();
                  else if (selected.kind === 'cache') applyCacheChanges();
                }}
                className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================
// Architecture Diagram Component
// ======================

function ArchitectureDiagram({ state }: { state: any }) {
  const publicContainers = state.containers.filter((c: any) => c.exposure === 'public');
  const privateContainers = state.containers.filter((c: any) => c.exposure === 'private');
  const hasLoadBalancer = publicContainers.length > 0;
  const hasDatabase = Boolean(state.resources?.database);
  const hasCache = Boolean(state.resources?.cache);

  const getDisplayName = (imageUrl: string) => {
    return imageUrl.split('/').pop()?.split(':')[0] || 'container';
  };

  const getServiceName = (container: any) => {
    return container.serviceName || `container-${container.id.substring(0, 8)}`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200">
      <div className="flex flex-col items-center space-y-8">
        
        {/* Load Balancer (if public containers exist) */}
        {hasLoadBalancer && (
          <>
            <div className="bg-purple-500 text-white rounded-lg p-6 shadow-lg text-center min-w-[200px]">
              <div className="text-3xl mb-2">⚖️</div>
              <div className="font-bold">Load Balancer</div>
              <div className="text-sm opacity-90 mt-1">
                {state.domain?.customDomain || `${state.domain?.defaultSubdomain}.unhazzle.io`}
              </div>
            </div>
            
            {/* Arrow down */}
            <div className="text-slate-400">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <line x1="20" y1="0" x2="20" y2="30" stroke="currentColor" strokeWidth="3"/>
                <polygon points="20,40 15,30 25,30" fill="currentColor"/>
              </svg>
            </div>
          </>
        )}
        
        {/* Public Containers Row */}
        {publicContainers.length > 0 && (
          <div className="flex gap-6 flex-wrap justify-center">
            {publicContainers.map((container: any, index: number) => {
              const displayName = getDisplayName(container.imageUrl);
              const serviceName = getServiceName(container);
              const containerIndex = state.containers.indexOf(container) + 1;
              return (
                <div 
                  key={container.id}
                  className="bg-blue-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]"
                >
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-bold text-sm">Container {containerIndex}</div>
                  <div className="text-xs opacity-90 mt-1">
                    {displayName}
                  </div>
                  <div className="text-xs opacity-75 mt-2">
                    :{container.port}
                  </div>
                  <div className="text-xs font-mono bg-blue-600 rounded px-2 py-1 mt-2">
                    {serviceName}.internal
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Private Containers Row */}
        {privateContainers.length > 0 && (
          <>
            {publicContainers.length > 0 && (
              <div className="text-slate-400 text-sm">Internal Network</div>
            )}
            
            <div className="flex gap-6 flex-wrap justify-center">
              {privateContainers.map((container: any, index: number) => {
                const displayName = getDisplayName(container.imageUrl);
                const serviceName = getServiceName(container);
                const containerIndex = state.containers.indexOf(container) + 1;
                return (
                  <div 
                    key={container.id}
                    className="bg-slate-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]"
                  >
                    <div className="text-2xl mb-2">🔒</div>
                    <div className="font-bold text-sm">Container {containerIndex}</div>
                    <div className="text-xs opacity-90 mt-1">
                      {displayName}
                    </div>
                    <div className="text-xs opacity-75 mt-2">
                      :{container.port}
                    </div>
                    <div className="text-xs font-mono bg-slate-600 rounded px-2 py-1 mt-2">
                      {serviceName}.internal
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        
        {/* Database & Cache Row */}
        {(hasDatabase || hasCache) && (
          <>
            <div className="text-slate-400 text-sm">Backend Services</div>
            
            <div className="flex gap-6">
              {hasDatabase && (
                <div className="bg-green-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]">
                  <div className="text-2xl mb-2">🐘</div>
                  <div className="font-bold text-sm">PostgreSQL</div>
                  <div className="text-xs opacity-90 mt-1">
                    {state.resources.database.cpu} CPU
                  </div>
                  <div className="text-xs font-mono bg-green-600 rounded px-2 py-1 mt-2">
                    postgres.internal
                  </div>
                </div>
              )}
              
              {hasCache && (
                <div className="bg-red-500 text-white rounded-lg p-4 shadow-lg text-center min-w-[160px]">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-bold text-sm">Redis</div>
                  <div className="text-xs opacity-90 mt-1">
                    {state.resources.cache.memory} RAM
                  </div>
                  <div className="text-xs font-mono bg-red-600 rounded px-2 py-1 mt-2">
                    redis.internal
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
      </div>
      
      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-slate-300 flex flex-wrap gap-4 justify-center text-sm">
        {hasLoadBalancer && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-slate-700">Public Internet</span>
          </div>
        )}
        {publicContainers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-slate-700">Public Container</span>
          </div>
        )}
        {privateContainers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-500 rounded"></div>
            <span className="text-slate-700">Private Container</span>
          </div>
        )}
        {hasDatabase && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-slate-700">Database</span>
          </div>
        )}
        {hasCache && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-slate-700">Cache</span>
          </div>
        )}
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
  
  // Generate containers section
  let containersSection = '';
  if (state.containers && state.containers.length > 0) {
    containersSection = 'containers:\n';
    state.containers.forEach((container: any, index: number) => {
      const containerName = container.imageUrl.split('/').pop()?.split(':')[0] || `container-${index + 1}`;
      containersSection += `  - name: ${containerName}\n`;
      containersSection += `    image: ${container.imageUrl}\n`;
      containersSection += `    port: ${container.port}\n`;
      containersSection += `    exposure: ${container.exposure}\n`;
      containersSection += `    resources:\n`;
      containersSection += `      cpu: ${container.resources.cpu}\n`;
      containersSection += `      memory: ${container.resources.memory}\n`;
      containersSection += `      replicas:\n`;
      containersSection += `        min: ${container.resources.replicas.min}\n`;
      containersSection += `        max: ${container.resources.replicas.max}\n`;
      
      if (container.volume) {
        containersSection += `    volume:\n`;
        containersSection += `      mount_path: ${container.volume.mountPath}\n`;
        containersSection += `      size: ${container.volume.sizeGB}GB\n`;
        containersSection += `      auto_scale: ${container.volume.autoScale}\n`;
        containersSection += `      backup_frequency: ${container.volume.backupFrequency}\n`;
        containersSection += `      delete_with_container: ${container.volume.deleteWithContainer}\n`;
      }
      
      containersSection += '\n';
    });
  }

  return `# Unhazzle Deployment Configuration
# Generated from your application setup
# Reference: https://docs.unhazzle.io/yaml-config

project: ${state.user?.name?.toLowerCase().replace(/\s+/g, '-') || 'my-app'}
environment: production

domain: ${state.domain?.customDomain || state.domain?.defaultSubdomain || 'your-app.unhazzle.io'}
ssl: true  # Auto-provisioned with Let's Encrypt

${containersSection}${hasDatabase ? `services:
  database:
    type: ${state.resources.database.engine}
    version: "${state.resources.database.engine === 'postgres' ? '16' : '8.0'}"
    cpu: ${state.resources.database.cpu}
    memory: ${state.resources.database.memory}
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
