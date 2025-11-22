'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { calculateApplicationCostImpact, calculateDatabaseCostImpact, calculateCacheCostImpact } from '@/lib/utils/costCalculator';
import EnvironmentNavigator from './EnvironmentNavigator';
import EnvironmentInfo from './EnvironmentInfo';
import ProjectSettings from './ProjectSettings';
import CostHeader from './CostHeader';
import { CloneModal, PauseModal, ResumeModal, CreateEnvironmentModal } from './EnvironmentModals';
import AddApplicationModal from './AddApplicationModal';
import DeleteApplicationModal from './DeleteApplicationModal';
import PromoteApplicationModal from './PromoteApplicationModal';
import PauseApplicationModal from './PauseApplicationModal';
import { generateYAML, generateGitHubActions } from '@/lib/utils/yamlGenerator';
import ArchitectureDiagram from './ArchitectureDiagram';
import DeploymentProgress from './DeploymentProgress';
import type { EnvironmentType } from '@/lib/context/DeploymentContext';



// Component for creating first environment
function CreateFirstEnvironment() {
  const { state, createEnvironment, setActiveEnvironment } = useDeployment();
  const router = useRouter();
  const [envName, setEnvName] = useState('');
  const [envType, setEnvType] = useState<'non-prod' | 'prod'>('non-prod');
  const [isCreating, setIsCreating] = useState(false);

  const nameValid = envName.length >= 3 && envName.length <= 63 && /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$/.test(envName);

  const handleCreate = () => {
    if (!nameValid || !state.project) return;

    setIsCreating(true);
    const newEnv = createEnvironment({
      name: envName,
      type: envType as EnvironmentType,
      deployed: false,
      pendingChanges: false
    });

    // Set as active environment and redirect to Project Settings → Container Registry
    setTimeout(() => {
      setIsCreating(false);
      setActiveEnvironment(newEnv.id);
      router.push('/dashboard?selection=project-settings&tab=registry');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Create Your First Environment
          </h1>
          <p className="text-slate-600">
            Environments isolate your deployments. Start with development, staging, or production.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Environment Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Environment Name *
            </label>
            <input
              type="text"
              value={envName}
              onChange={(e) => setEnvName(e.target.value.toLowerCase())}
              placeholder="development"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {envName && !nameValid && (
              <p className="text-sm text-red-600 mt-1">
                3-63 characters, lowercase alphanumeric + hyphens, start/end with alphanumeric
              </p>
            )}
          </div>

          {/* Environment Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Environment Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setEnvType('non-prod')}
                className={`p-4 border-2 rounded-lg transition ${envType === 'non-prod'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="font-semibold text-slate-900 mb-1">Non-Production</div>
                <div className="text-sm text-slate-600">Development, testing, staging</div>
              </button>
              <button
                onClick={() => setEnvType('prod')}
                className={`p-4 border-2 rounded-lg transition ${envType === 'prod'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="font-semibold text-slate-900 mb-1">Production</div>
                <div className="text-sm text-slate-600">Live, customer-facing</div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-medium mb-1">Naming Recommendation</p>
                <p>
                  Use descriptive names like &quot;production&quot;, &quot;staging&quot;, &quot;development&quot;, or &quot;test&quot;.
                  Environment type helps Unhazzle apply appropriate safeguards (e.g., extra confirmations for production changes).
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={!nameValid || isCreating}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Environment</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Project Info */}
        {state.project && (
          <div className="mt-6 text-center text-sm text-slate-600">
            Project: <span className="font-medium text-slate-900">{state.project.name}</span>
            {state.region && (
              <span className="ml-4">
                <span role="img" aria-label={state.region.country}>{state.region.flag}</span>
                {' '}{state.region.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Mock GitHub Container Registry images
const MOCK_GHCR_IMAGES = [
  {
    name: 'acme/ecommerce-shop',
    tag: 'v2.1.0',
    size: '324 MB',
    lastUpdated: '2024-10-28T14:30:00Z',
    description: 'Main e-commerce application with Next.js frontend'
  },
  {
    name: 'acme/api-gateway',
    tag: 'v1.5.2',
    size: '156 MB',
    lastUpdated: '2024-10-25T09:15:00Z',
    description: 'GraphQL API gateway service'
  },
  {
    name: 'acme/payment-processor',
    tag: 'v3.0.1',
    size: '89 MB',
    lastUpdated: '2024-10-30T16:45:00Z',
    description: 'Payment processing microservice'
  },
  {
    name: 'acme/notification-service',
    tag: 'v2.3.0',
    size: '112 MB',
    lastUpdated: '2024-10-29T11:20:00Z',
    description: 'Email and SMS notification handler'
  },
  {
    name: 'acme/background-worker',
    tag: 'v1.8.4',
    size: '78 MB',
    lastUpdated: '2024-10-27T13:10:00Z',
    description: 'Background job processing worker'
  }
];

// OCI Registry Modal Component  
function OCIRegistryModal() {
  const { state, updateProject, createAppsFromImages, getActiveEnvironment } = useDeployment();
  const router = useRouter();
  const [githubPAT, setGithubPAT] = useState(state.project?.githubPAT || '');
  const [showImages, setShowImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const activeEnv = getActiveEnvironment();

  const handleFetchImages = () => {
    if (!githubPAT.trim()) {
      alert('Please enter a GitHub Personal Access Token');
      return;
    }

    // Save PAT to project
    if (state.project) {
      updateProject({ githubPAT });
    }

    setShowImages(true);
  };

  const toggleImage = (imageName: string) => {
    if (selectedImages.includes(imageName)) {
      setSelectedImages(selectedImages.filter(img => img !== imageName));
    } else {
      if (selectedImages.length >= 5) {
        alert('Maximum 5 images allowed');
        return;
      }
      setSelectedImages([...selectedImages, imageName]);
    }
  };

  const handleContinue = () => {
    if (!activeEnv) return;

    setIsCreating(true);

    const imagesToCreate = selectedImages.map(imgName => {
      const img = MOCK_GHCR_IMAGES.find(i => `${i.name}:${i.tag}` === imgName);
      if (!img) return null;

      const autoName = img.name.split('/').pop()?.split(':')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'app';

      return {
        name: `${img.name}:${img.tag}`,
        url: `ghcr.io/${img.name}:${img.tag}`,
        autoName,
        tag: img.tag,
        description: img.description
      };
    }).filter(Boolean) as Array<{ name: string; url: string; autoName: string; tag?: string; description?: string; exposure?: 'public' | 'private' }>;

    if (imagesToCreate.length > 0) {
      createAppsFromImages(activeEnv.id, imagesToCreate);
    }

    setTimeout(() => {
      setIsCreating(false);
      router.push('/dashboard');
    }, 1000);
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Connect Your Container Registry
          </h1>
          <p className="text-slate-600">
            Connect to GitHub Container Registry to quickly deploy your private images
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {!showImages ? (
            <>
              {/* PAT Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={githubPAT}
                  onChange={(e) => setGithubPAT(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Token needs <code className="bg-slate-100 px-1 rounded">read:packages</code> scope
                </p>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <span className="text-xl">ℹ️</span>
                  <div className="flex-1 text-sm text-blue-900">
                    <p className="font-medium mb-1">Optional Step</p>
                    <p>
                      You can skip this step and add containers manually later. This is just a convenience
                      to quickly import multiple images from ghcr.io.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
                >
                  Skip
                </button>
                <button
                  onClick={handleFetchImages}
                  disabled={!githubPAT.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>Fetch Images</span>
                  <span>→</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Image Selection */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Select Images to Deploy (max 5)
                </h2>
                <div className="space-y-3">
                  {MOCK_GHCR_IMAGES.map(img => {
                    const fullName = `${img.name}:${img.tag}`;
                    const isSelected = selectedImages.includes(fullName);

                    return (
                      <button
                        key={fullName}
                        onClick={() => toggleImage(fullName)}
                        className={`w-full p-4 border-2 rounded-lg text-left transition ${isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-1 ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'
                            }`}>
                            {isSelected && (
                              <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 mb-1">
                              ghcr.io/{img.name}:<span className="text-purple-600">{img.tag}</span>
                            </div>
                            <div className="text-sm text-slate-600 mb-2">{img.description}</div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>{img.size}</span>
                              <span>•</span>
                              <span>Updated {formatDate(img.lastUpdated)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selection Summary */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="text-sm font-medium text-slate-700">
                  {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                  {selectedImages.length > 0 && ' - applications will be auto-configured with smart defaults'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
                >
                  Skip & Add Manually
                </button>
                <button
                  onClick={handleContinue}
                  disabled={selectedImages.length === 0 || isCreating}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin">⚙️</span>
                      <span>Creating Applications...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with {selectedImages.length} Application{selectedImages.length !== 1 ? 's' : ''}</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { state, removeDatabase, removeCache, updateApplicationStatus } = useDeployment();

  const [uptime, setUptime] = useState(99.98);
  const [cpuUsage, setCpuUsage] = useState(42);
  const [memoryUsage, setMemoryUsage] = useState(58);
  const [requestsPerMinute, setRequestsPerMinute] = useState(1240);
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
                Get started by creating your first project. Answer 5 quick questions about your workload,
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

  // If project exists but no environments, show environment creation
  if (state.project && state.project.environments.length === 0) {
    return <CreateFirstEnvironment />;
  }

  // Active environment will be used in tabs
  const activeEnv = state.project?.environments.find(e => e.id === state.activeEnvironmentId) || state.project?.environments[0];

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
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Dashboard
              </h1>
              <div className="flex items-center gap-4">
                {state.domain?.defaultSubdomain && (
                  <span className="text-sm text-slate-600">
                    Deployed to: <code className="bg-white px-2 py-1 rounded text-xs font-mono">{state.domain.defaultSubdomain}</code>
                  </span>
                )}
                {state.region && (
                  <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                    <span role="img" aria-label={state.region.country}>{state.region.flag}</span>
                    <span>{state.region.label}</span>
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
            {activeEnv && (activeEnv.applications?.length || 0) > 0 && (
              <div className="ml-6">
                <CostHeader environment={activeEnv} />
              </div>
            )}
            {!state.project && (
              <button
                onClick={() => router.push('/questionnaire')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                <span>Create Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content - Hybrid view: left panel (hierarchy) + right panel (editing) */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          <HybridOverview project={state.project} state={state} />
        </div>
      </div>
    </div>
  );
}

// ======================
// Hybrid Overview: Left Panel (Hierarchy) + Right Panel (Editing)
// ======================

function HybridOverview({ project, state }: { project: any; state: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateApplicationConfig, updateResources, removeDatabase, removeCache, removeApplication, cloneEnvironment, promoteEnvironment, deleteEnvironment, pauseEnvironment, resumeEnvironment, updateProject, createAppsFromImages, getActiveEnvironment, updateEnvironmentConfig, createEnvironment, promoteApplication, pauseApplication, updateApplicationStatus } = useDeployment();

  type SelectionKind = 'application' | 'database' | 'architecture' | 'environment' | 'project-settings' | 'create-environment' | 'add-application';

  const [selected, setSelected] = useState<{ kind: SelectionKind; id?: string; envId?: string }>({ kind: 'project-settings' });

  // Derive project settings tab from URL
  const tabParam = searchParams.get('tab');
  const projectSettingsTab = (tabParam === 'registry' || tabParam === 'repository' || tabParam === 'pr-environments' || tabParam === 'general')
    ? tabParam
    : 'general';

  // Environment modals state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Add Application/Cache modals state
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [showCreateEnvironmentModal, setShowCreateEnvironmentModal] = useState(false);
  const [showDeleteApplicationModal, setShowDeleteApplicationModal] = useState(false);
  const [showPromoteApplicationModal, setShowPromoteApplicationModal] = useState(false);
  const [showPauseApplicationModal, setShowPauseApplicationModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<{ id: string; name: string; envId: string } | null>(null);
  const [applicationToPromote, setApplicationToPromote] = useState<{ id: string; name: string; envId: string } | null>(null);
  const [applicationToPause, setApplicationToPause] = useState<{ id: string; name: string } | null>(null);

  // Draft state for staged edits
  const [draftApplication, setDraftApplication] = useState<any>(null);
  const [draftDatabase, setDraftDatabase] = useState<any>(null);
  const [draftCache, setDraftCache] = useState<any>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // OCI Registry setup state (inline in dashboard)
  const [githubPAT, setGithubPAT] = useState(state.project?.githubPAT || '');
  const [showImages, setShowImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCreatingApplications, setIsCreatingApplications] = useState(false);
  const [skippedRegistrySetup, setSkippedRegistrySetup] = useState<Record<string, boolean>>({});

  // Get the currently selected resource from project structure
  const getSelectedResource = () => {
    if (!project?.environments) return null;

    if (selected.kind === 'application') {
      for (const env of project.environments) {
        const app = env.applications?.find((c: any) => c.id === selected.id);
        if (app) return { type: 'application', data: app, env };
      }
    } else if (selected.kind === 'database') {
      const env = project.environments.find((e: any) => e.id === selected.envId);
      if (env?.database) return { type: 'database', data: env.database, env };
    }
    return null;
  };

  const selectedResource = getSelectedResource();

  // Sync with URL params when they change
  useEffect(() => {
    const selection = searchParams.get('selection');
    const envId = searchParams.get('env');
    const applicationId = searchParams.get('id');

    if (selection === 'project-settings') {
      setSelected({ kind: 'project-settings' });
    } else if (selection === 'application' && applicationId && envId) {
      setSelected({ kind: 'application', id: applicationId, envId });
    } else if (selection === 'environment' && envId) {
      setSelected({ kind: 'environment', envId });
    }
  }, [searchParams]);

  // Keep draft in sync when selection changes
  useEffect(() => {
    const resource = getSelectedResource();
    if (selected.kind === 'application' && resource?.data) {
      const deep = JSON.parse(JSON.stringify(resource.data));
      if (!Array.isArray(deep.environmentVariables)) deep.environmentVariables = [];
      setDraftApplication(deep);
    } else if (selected.kind === 'database' && resource?.data) {
      const dbData = JSON.parse(JSON.stringify(resource.data));
      if (!dbData.type) dbData.type = 'container'; // Default for existing
      setDraftDatabase(dbData);
      setDraftApplication(null);
    } else {
      setDraftApplication(null);
      setDraftDatabase(null);
      setDraftCache(null);
    }
  }, [selected, project]);

  const hasApplicationChanges = () => {
    if (!selectedResource?.data || !draftApplication || selected.kind !== 'application') return false;

    // If application is new (stopped), allow applying to trigger deployment
    if (selectedResource.data.status === 'stopped') return true;

    return JSON.stringify({
      name: draftApplication.name,
      imageUrl: draftApplication.imageUrl,
      resources: draftApplication.resources,
      healthCheck: draftApplication.healthCheck,
      exposure: draftApplication.exposure,
      serviceAccess: draftApplication.serviceAccess,
      environmentVariables: draftApplication.environmentVariables,
    }) !== JSON.stringify({
      name: selectedResource.data.name,
      imageUrl: selectedResource.data.imageUrl,
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

  const applyApplicationChanges = () => {
    if (!selectedResource?.data || !draftApplication) return;
    setShowConfirmation(false);

    // Update the config first
    updateApplicationConfig(selectedResource.data.id, {
      name: draftApplication.name,
      imageUrl: draftApplication.imageUrl,
      resources: draftApplication.resources,
      healthCheck: draftApplication.healthCheck,
      exposure: draftApplication.exposure,
      serviceAccess: draftApplication.serviceAccess,
      environmentVariables: draftApplication.environmentVariables,
    });

    // Trigger deployment (stay in dashboard)
    updateApplicationStatus(selectedResource.data.id, 'deploying');
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

  // OCI Registry setup handlers
  const handleFetchImages = () => {
    if (!githubPAT.trim()) {
      alert('Please enter a GitHub Personal Access Token');
      return;
    }

    // Save PAT to project
    if (state.project) {
      updateProject({ githubPAT });
    }

    setShowImages(true);
  };

  const toggleImage = (imageName: string) => {
    if (selectedImages.includes(imageName)) {
      setSelectedImages(selectedImages.filter(img => img !== imageName));
    } else {
      if (selectedImages.length >= 5) {
        alert('Maximum 5 images allowed');
        return;
      }
      setSelectedImages([...selectedImages, imageName]);
    }
  };

  const handleCreateApplications = () => {
    const activeEnv = getActiveEnvironment();
    if (!activeEnv) return;

    setIsCreatingApplications(true);

    const imagesToCreate = selectedImages.map(imgName => {
      const img = MOCK_GHCR_IMAGES.find(i => `${i.name}:${i.tag}` === imgName);
      if (!img) return null;

      const autoName = img.name.split('/').pop()?.split(':')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'app';

      return {
        name: `${img.name}:${img.tag}`,
        url: `ghcr.io/${img.name}:${img.tag}`,
        autoName,
        tag: img.tag,
        description: img.description
      };
    }).filter(Boolean) as Array<{ name: string; url: string; autoName: string; tag?: string; description?: string; exposure?: 'public' | 'private' }>;

    if (imagesToCreate.length > 0) {
      createAppsFromImages(activeEnv.id, imagesToCreate);
    }

    setTimeout(() => {
      setIsCreatingApplications(false);
      setShowImages(false);
      setSelectedImages([]);
    }, 1000);
  };

  const formatImageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
        <EnvironmentNavigator
          project={project}
          selected={selected}
          onSelect={(selection) => {
            // Handle modal triggers
            if (selection.kind === 'add-application') {
              setShowAddApplicationModal(true);
              return;
            }
            if (selection.kind === 'create-environment') {
              setShowCreateEnvironmentModal(true);
              return;
            }
            // Normal selection
            setSelected(selection);
          }}
        />
      </div>

      {/* RIGHT PANEL: Resource Editor or Environment Info */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9">
        {/* Project Settings */}
        {selected.kind === 'project-settings' && (
          <ProjectSettings
            project={project}
            initialTab={projectSettingsTab}
            onSave={(updates) => {
              updateProject(updates);
            }}
            onCreateEnvironment={() => {
              setShowCreateEnvironmentModal(true);
            }}
          />
        )}

        {/* Environment Overview */}
        {selected.kind === 'environment' && selected.envId && (() => {
          const selectedEnv = project.environments?.find((e: any) => e.id === selected.envId);
          return selectedEnv ? (
            <>
              <EnvironmentInfo
                environment={selectedEnv}
                onClone={() => setShowCloneModal(true)}
                onPause={() => setShowPauseModal(true)}
                onResume={() => setShowResumeModal(true)}
                onAddApplication={() => {
                  setSelected({ kind: 'add-application', envId: selectedEnv.id });
                  setShowAddApplicationModal(true);
                }}
              />

              {/* Modals */}
              {showCloneModal && (
                <CloneModal
                  sourceEnvironment={selectedEnv}
                  onClose={() => setShowCloneModal(false)}
                  onConfirm={(newName, autoDeploy) => {
                    cloneEnvironment(selectedEnv.id, newName, autoDeploy);
                    setShowCloneModal(false);
                  }}
                />
              )}

              {showPauseModal && (
                <PauseModal
                  environment={selectedEnv}
                  onClose={() => setShowPauseModal(false)}
                  onConfirm={(schedule) => {
                    pauseEnvironment(selectedEnv.id, schedule);
                    setShowPauseModal(false);
                  }}
                />
              )}

              {showResumeModal && (
                <ResumeModal
                  environment={selectedEnv}
                  onClose={() => setShowResumeModal(false)}
                  onConfirm={() => {
                    resumeEnvironment(selectedEnv.id);
                    setShowResumeModal(false);
                  }}
                />
              )}


            </>
          ) : null;
        })()}

        {/* Add Application/Cache Modals */}
        {showAddApplicationModal && selected.envId && (
          <AddApplicationModal
            onClose={() => setShowAddApplicationModal(false)}
            availableImages={state.project?.githubPAT ? MOCK_GHCR_IMAGES : []}
            githubPAT={state.project?.githubPAT}
            onAdd={({ name, imageUrl, exposure }) => {
              const activeEnv = getActiveEnvironment();
              if (!activeEnv) return;

              // Generate the application ID upfront (same logic as in createAppsFromImages)
              const newAppId = `app-${Date.now()}-0`;

              // Create application with the correct signature
              createAppsFromImages(
                activeEnv.id,
                [{
                  name: imageUrl.split('/').pop()?.split(':')[0] || name,
                  url: imageUrl,
                  autoName: name,
                  tag: imageUrl.split(':').pop() || 'latest',
                  description: `${name} application`,
                  exposure: exposure as 'public' | 'private'
                }]
              );

              setShowAddApplicationModal(false);

              // Navigate to the newly created application using the generated ID via URL
              // Use a longer delay to ensure state has updated
              setTimeout(() => {
                router.push(`/dashboard?selection=application&id=${newAppId}&env=${activeEnv.id}`);
              }, 150);
            }}
          />
        )}

        {/* Delete Application Modal */}
        {showDeleteApplicationModal && applicationToDelete && (
          <DeleteApplicationModal
            applicationName={applicationToDelete.name}
            onClose={() => {
              setShowDeleteApplicationModal(false);
              setApplicationToDelete(null);
            }}
            onConfirm={() => {
              removeApplication(applicationToDelete.id, applicationToDelete.envId);
              setShowDeleteApplicationModal(false);
              setApplicationToDelete(null);
              // Navigate back to environment overview
              router.push(`/dashboard?selection=environment&env=${applicationToDelete.envId}`);
            }}
          />
        )}

        {/* Create Environment Modal */}
        {showCreateEnvironmentModal && (
          <CreateEnvironmentModal
            onClose={() => setShowCreateEnvironmentModal(false)}
            onConfirm={(name, type) => {
              const newEnv = createEnvironment({
                name,
                type,
                deployed: false,
                pendingChanges: false
              });
              setShowCreateEnvironmentModal(false);
              // Navigate to the new environment
              router.push(`/dashboard?selection=environment&env=${newEnv.id}`);
            }}
          />
        )}

        {/* Promote Application Modal */}
        {showPromoteApplicationModal && applicationToPromote && (
          <PromoteApplicationModal
            application={applicationToPromote}
            availableTargets={project.environments?.filter((e: any) => e.id !== applicationToPromote.envId && e.status !== 'deleted') || []}
            onClose={() => {
              setShowPromoteApplicationModal(false);
              setApplicationToPromote(null);
            }}
            onConfirm={(targetEnvId: string) => {
              promoteApplication(applicationToPromote.id, targetEnvId);
              setShowPromoteApplicationModal(false);
              setApplicationToPromote(null);
              // Navigate to target environment to see the promoted app
              router.push(`/dashboard?selection=environment&env=${targetEnvId}`);
            }}
          />
        )}

        {/* Pause Application Modal */}
        {showPauseApplicationModal && applicationToPause && (
          <PauseApplicationModal
            applicationName={applicationToPause.name}
            onClose={() => {
              setShowPauseApplicationModal(false);
              setApplicationToPause(null);
            }}
            onConfirm={(schedule) => {
              pauseApplication(applicationToPause.id, schedule);
              setShowPauseApplicationModal(false);
              setApplicationToPause(null);
            }}
          />
        )}

        {/* Application Editor */}
        {selected.kind === 'application' && selectedResource && draftApplication && (
          <ApplicationEditor
            application={selectedResource.data}
            environment={selectedResource.env}
            draftApplication={draftApplication}
            setDraftApplication={setDraftApplication}
            hasChanges={hasApplicationChanges()}
            showChanges={showChanges}
            setShowChanges={setShowChanges}
            onApply={() => setShowConfirmation(true)}
            isApplying={isApplying}
            state={state}
            onRequestRemove={(id: string, name: string, envId: string) => {
              setApplicationToDelete({ id, name, envId });
              setShowDeleteApplicationModal(true);
            }}
            onPromote={(id: string, name: string, envId: string) => {
              setApplicationToPromote({ id, name, envId });
              setShowPromoteApplicationModal(true);
            }}
            onPause={(id: string, name: string) => {
              setApplicationToPause({ id, name });
              setShowPauseApplicationModal(true);
            }}
          />
        )}

        {selected.kind === 'database' && selectedResource && draftDatabase && (
          <DatabaseEditor
            database={selectedResource.data}
            environment={selectedResource.env}
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

        {selected.kind === 'architecture' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span>🏗️</span>
                <span>Architecture Diagram</span>
              </h2>
              <p className="text-slate-600 mb-6">
                Visual representation of your deployed infrastructure, including application connections and internal DNS.
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
          draftApplication={draftApplication}
          draftDatabase={draftDatabase}
          draftCache={draftCache}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => {
            if (selected.kind === 'application') applyApplicationChanges();
            else if (selected.kind === 'database') applyDatabaseChanges();
          }}
        />
      )}
    </div>
  );
}

// ======================
// Application Editor Component
// ======================

function ApplicationEditor({ application, environment, draftApplication, setDraftApplication, hasChanges, showChanges, setShowChanges, onApply, isApplying, state, onRequestRemove, onPromote, onPause }: any) {
  const [showActions, setShowActions] = useState(false);
  const [showDeploymentProgress, setShowDeploymentProgress] = useState(false);

  // Show deployment progress when app starts deploying
  useEffect(() => {
    if (application.status === 'deploying') {
      setShowDeploymentProgress(true);
    }
  }, [application.status]);

  const [activeTab, setActiveTab] = useState<'configuration' | 'logs' | 'metrics' | 'events'>('configuration');

  const handleDeploymentComplete = useCallback(() => {
    // Hide deployment progress after animations complete
    setShowDeploymentProgress(false);
  }, []);

  const handleRemove = () => {
    onRequestRemove(application.id, application.name || 'application', environment.id);
    setShowActions(false);
  };

  const handlePromote = () => {
    onPromote(application.id, application.name || 'application', environment.id);
    setShowActions(false);
  };

  const handlePause = () => {
    onPause(application.id, application.name || 'application');
    setShowActions(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={draftApplication.name}
            onChange={(e) => setDraftApplication({ ...draftApplication, name: e.target.value })}
            className="text-xl font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none bg-transparent w-full"
            placeholder="Application Name"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChanges(true)}
            disabled={!hasChanges || isApplying || application.status === 'deploying'}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${hasChanges ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
              } disabled:opacity-50`}
          >
            Show Changes
          </button>
          <button
            onClick={onApply}
            disabled={!hasChanges || isApplying || application.status === 'deploying'}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isApplying ? 'Applying…' : 'Apply'}
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <span>Actions</span>
              <span className="text-xs">▼</span>
            </button>

            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden">
                  <button
                    onClick={handlePromote}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>🚀</span>
                    <span>Promote</span>
                  </button>
                  <button
                    onClick={handlePause}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>⏸️</span>
                    <span>Pause</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handleRemove}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        {(['configuration', 'logs', 'metrics', 'events'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition border-b-2 ${activeTab === tab
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Deployment Progress */}
      {showDeploymentProgress && (
        <DeploymentProgress
          application={application}
          environmentId={environment.id}
          onComplete={handleDeploymentComplete}
        />
      )}

      {/* Configuration Tab Content */}
      {activeTab === 'configuration' && (
        <div className="space-y-6">

          {/* Section: Application Image */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Application Image</h4>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Image URL</label>
              <input
                type="text"
                value={draftApplication.imageUrl}
                onChange={(e) => setDraftApplication({ ...draftApplication, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                placeholder="ghcr.io/username/image:tag"
              />
            </div>
          </div>

          {/* Section: Resources */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">CPU</label>
                <select
                  value={draftApplication.resources.cpu}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    resources: { ...draftApplication.resources, cpu: e.target.value }
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
                  value={draftApplication.resources.memory}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    resources: { ...draftApplication.resources, memory: e.target.value }
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
                  value={draftApplication.resources.replicas.min}
                  onChange={(e) => {
                    const newMin = Math.max(1, parseInt(e.target.value) || 1);
                    const currentMax = draftApplication.resources.replicas.max;
                    setDraftApplication({
                      ...draftApplication,
                      resources: {
                        ...draftApplication.resources,
                        replicas: {
                          ...draftApplication.resources.replicas,
                          min: newMin,
                          max: Math.max(newMin, currentMax)
                        }
                      }
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Replicas (max)</label>
                <input
                  type="number"
                  min={draftApplication.resources.replicas.min}
                  value={draftApplication.resources.replicas.max}
                  onChange={(e) => {
                    const newMax = Math.max(draftApplication.resources.replicas.min, parseInt(e.target.value) || 1);
                    setDraftApplication({
                      ...draftApplication,
                      resources: {
                        ...draftApplication.resources,
                        replicas: { ...draftApplication.resources.replicas, max: newMax }
                      }
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Storage (Persistent Volumes) */}
          {/* Section: Storage (Persistent Volumes) */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Storage</h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={!!draftApplication.volume}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDraftApplication({
                        ...draftApplication,
                        volume: {
                          mountPath: '/data',
                          sizeGB: 10,
                          autoScale: true,
                          backupFrequency: 'daily',
                          deleteWithContainer: false
                        }
                      });
                    } else {
                      const { volume, ...rest } = draftApplication;
                      setDraftApplication(rest);
                    }
                  }}
                />
                <span className="font-medium text-slate-900">Enable Persistent Volume</span>
              </label>

              {draftApplication.volume && (
                <div className="ml-6 mt-3 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Mount Path</label>
                      <input
                        type="text"
                        value={draftApplication.volume.mountPath}
                        onChange={(e) => setDraftApplication({
                          ...draftApplication,
                          volume: { ...draftApplication.volume!, mountPath: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                        placeholder="/data"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Size</label>
                      <select
                        value={draftApplication.volume.sizeGB}
                        onChange={(e) => setDraftApplication({
                          ...draftApplication,
                          volume: { ...draftApplication.volume!, sizeGB: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="1">1 GB</option>
                        <option value="5">5 GB</option>
                        <option value="10">10 GB</option>
                        <option value="20">20 GB</option>
                        <option value="50">50 GB</option>
                        <option value="100">100 GB</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Backups</label>
                      <select
                        value={draftApplication.volume.backupFrequency}
                        onChange={(e) => setDraftApplication({
                          ...draftApplication,
                          volume: { ...draftApplication.volume!, backupFrequency: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="disabled">Disabled</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={draftApplication.volume.autoScale}
                          onChange={(e) => setDraftApplication({
                            ...draftApplication,
                            volume: { ...draftApplication.volume!, autoScale: e.target.checked }
                          })}
                        />
                        <span className="text-sm text-slate-700">Auto-scale size</span>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Persistent volumes retain data even if the container crashes or restarts.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Dependencies (formerly Application Access) */}
          {environment?.applications?.length >= 1 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Dependencies</h4>
              <div className="space-y-4 text-sm">
                {/* External Database */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={draftApplication.externalDatabase?.enabled || false}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const envVarKey = 'DATABASE_URL';
                        let updatedEnvVars = [...draftApplication.environmentVariables];

                        // Remove existing DATABASE_URL if present to avoid duplicates/conflicts
                        if (!enabled) {
                          updatedEnvVars = updatedEnvVars.filter(v => v.key !== envVarKey);
                        } else {
                          // If enabling, ensure we don't have a duplicate if it was already there manually
                          const exists = updatedEnvVars.some(v => v.key === envVarKey);
                          if (!exists) {
                            updatedEnvVars.push({
                              key: envVarKey,
                              value: draftApplication.externalDatabase?.connectionString || '',
                              masked: true
                            });
                          }
                        }

                        setDraftApplication({
                          ...draftApplication,
                          externalDatabase: {
                            enabled,
                            connectionString: draftApplication.externalDatabase?.connectionString || ''
                          },
                          environmentVariables: updatedEnvVars
                        });
                      }}
                    />
                    <span className="font-medium text-slate-900">Connect to External Database</span>
                  </label>

                  {draftApplication.externalDatabase?.enabled && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Connection String</label>
                        <input
                          type="password"
                          value={draftApplication.externalDatabase.connectionString}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            const envVarKey = 'DATABASE_URL';

                            // Update env var in real-time
                            const updatedEnvVars = draftApplication.environmentVariables.map((v: any) =>
                              v.key === envVarKey ? { ...v, value: newVal } : v
                            );

                            setDraftApplication({
                              ...draftApplication,
                              externalDatabase: {
                                ...draftApplication.externalDatabase,
                                connectionString: newVal
                              },
                              environmentVariables: updatedEnvVars
                            });
                          }}
                          placeholder="postgres://user:pass@host:5432/db"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                        />
                        <p className="text-xs text-slate-500 mt-1">Injected as <code>DATABASE_URL</code></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Resources (if available) */}
                {(state.resources?.database || state.resources?.cache) && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase">Platform Resources</h5>
                    {state.resources?.database && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={draftApplication.serviceAccess.database}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            const envVarKey = 'UNHAZZLE_POSTGRES_URL';
                            let updatedEnvVars = [...draftApplication.environmentVariables];

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

                            setDraftApplication({
                              ...draftApplication,
                              serviceAccess: { ...draftApplication.serviceAccess, database: enabled },
                              environmentVariables: updatedEnvVars
                            });
                          }}
                        />
                        <span className="text-slate-900">Managed PostgreSQL (Platform)</span>
                      </label>
                    )}
                    {state.resources?.cache && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={draftApplication.serviceAccess.cache}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            const envVarKey = 'UNHAZZLE_REDIS_URL';
                            let updatedEnvVars = [...draftApplication.environmentVariables];

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

                            setDraftApplication({
                              ...draftApplication,
                              serviceAccess: { ...draftApplication.serviceAccess, cache: enabled },
                              environmentVariables: updatedEnvVars
                            });
                          }}
                        />
                        <span className="text-slate-900">Managed Redis (Platform)</span>
                      </label>
                    )}
                  </div>
                )}
                {/* Internal Applications */}
                {environment?.applications?.length > 1 && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Internal Applications</h5>
                    <div className="space-y-2">
                      {environment.applications
                        .filter((app: any) => app.id !== application.id)
                        .map((otherApp: any) => {
                          const envVarKey = `${otherApp.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_URL`;
                          const appName = otherApp.name || otherApp.serviceName || `app-${otherApp.id.substring(0, 8)}`;
                          const internalUrl = `http://${appName}.${environment.slug || environment.name}`;

                          // Check if this app is in the allowed list
                          const isConnected = (draftApplication.serviceAccess.applications || []).includes(otherApp.id);

                          return (
                            <label key={otherApp.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isConnected}
                                onChange={(e) => {
                                  const enabled = e.target.checked;
                                  let updatedEnvVars = [...draftApplication.environmentVariables];
                                  let updatedAllowedApps = [...(draftApplication.serviceAccess.applications || [])];

                                  if (enabled) {
                                    // Add to allowed list
                                    if (!updatedAllowedApps.includes(otherApp.id)) {
                                      updatedAllowedApps.push(otherApp.id);
                                    }

                                    // Add env var
                                    const exists = updatedEnvVars.some(v => v.key === envVarKey);
                                    if (!exists) {
                                      updatedEnvVars.push({
                                        key: envVarKey,
                                        value: internalUrl,
                                        masked: false
                                      });
                                    }
                                  } else {
                                    // Remove from allowed list
                                    updatedAllowedApps = updatedAllowedApps.filter(id => id !== otherApp.id);

                                    // Remove env var
                                    updatedEnvVars = updatedEnvVars.filter(v => v.key !== envVarKey);
                                  }

                                  setDraftApplication({
                                    ...draftApplication,
                                    serviceAccess: {
                                      ...draftApplication.serviceAccess,
                                      applications: updatedAllowedApps
                                    },
                                    environmentVariables: updatedEnvVars
                                  });
                                }}
                              />
                              <div>
                                <div className="text-slate-900">{otherApp.name}</div>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500">Connection strings are auto-injected as environment variables.</p>
              </div>
            </div>
          )}

          {/* Section: Environment Variables (editable) */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Environment Variables</h4>
            <div className="space-y-3">
              {draftApplication.environmentVariables.length === 0 && (
                <div className="text-xs text-slate-500">No variables defined yet.</div>
              )}
              {draftApplication.environmentVariables.map((env: any, idx: number) => (
                <div key={idx} className="grid md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-4">
                    <label className="block text-xs text-slate-600 mb-1">Key</label>
                    <input
                      type="text"
                      value={env.key}
                      onChange={(e) => {
                        const next = [...draftApplication.environmentVariables];
                        next[idx] = { ...next[idx], key: e.target.value };
                        setDraftApplication({ ...draftApplication, environmentVariables: next });
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
                          const next = [...draftApplication.environmentVariables];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setDraftApplication({ ...draftApplication, environmentVariables: next });
                        }}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...draftApplication.environmentVariables];
                          const currentMasked = next[idx].masked !== false;
                          next[idx] = { ...next[idx], masked: !currentMasked };
                          setDraftApplication({ ...draftApplication, environmentVariables: next });
                        }}
                        className="p-2 rounded-lg border border-slate-300 hover:bg-slate-200 transition text-sm"
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
                        const next = draftApplication.environmentVariables.filter((_: any, i: number) => i !== idx);
                        setDraftApplication({ ...draftApplication, environmentVariables: next });
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
                      ...draftApplication.environmentVariables,
                      { key: '', value: '', masked: true },
                    ];
                    setDraftApplication({ ...draftApplication, environmentVariables: next });
                  }}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900"
                >
                  + Add variable
                </button>
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
                      checked={draftApplication.exposure === 'public'}
                      onChange={() => setDraftApplication({ ...draftApplication, exposure: 'public' })}
                    />
                    <span className="text-slate-900">Public</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      checked={draftApplication.exposure === 'private'}
                      onChange={() => setDraftApplication({ ...draftApplication, exposure: 'private' })}
                    />
                    <span className="text-slate-900">Private</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Domain</label>
                <div className="text-sm text-slate-900">
                  {`http://${draftApplication.name}.${environment.slug || environment.name}`}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Port</label>
                <div className="text-sm font-mono text-slate-900">{draftApplication.port}</div>
              </div>
            </div>
          </div>

          {/* Public Endpoint (if applicable) */}
          {application.exposure === 'public' && (() => {
            const displayName = application.imageUrl.split('/').pop()?.split(':')[0] || 'app';
            const stableId = application.id.substring(0, 6);
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
                      Port {application.port} • SSL Enabled • CDN Cached
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section: Health Check */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Health Check</h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Protocol</label>
                <select
                  value={draftApplication.healthCheck.protocol}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    healthCheck: { ...draftApplication.healthCheck, protocol: e.target.value as any }
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
                  value={draftApplication.healthCheck.port}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    healthCheck: { ...draftApplication.healthCheck, port: parseInt(e.target.value) || draftApplication.port }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-600 mb-1">Path</label>
                <input
                  type="text"
                  value={draftApplication.healthCheck.path || ''}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    healthCheck: { ...draftApplication.healthCheck, path: e.target.value }
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
                  value={draftApplication.healthCheck.interval}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    healthCheck: { ...draftApplication.healthCheck, interval: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Timeout</label>
                <input
                  type="text"
                  value={draftApplication.healthCheck.timeout}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    healthCheck: { ...draftApplication.healthCheck, timeout: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Retries</label>
                <input
                  type="number"
                  min={0}
                  value={draftApplication.healthCheck.retries}
                  onChange={(e) => setDraftApplication({
                    ...draftApplication,
                    healthCheck: { ...draftApplication.healthCheck, retries: Math.max(0, parseInt(e.target.value) || 0) }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Using recommended values.</p>
          </div>

          {/* Changes Preview */}
          {showChanges && hasChanges && (
            <ChangesPreview
              current={application}
              draft={draftApplication}
              onClose={() => setShowChanges(false)}
            />
          )}
        </div>
      )}

      {/* Logs Tab Content */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 space-y-1 max-h-96 overflow-y-auto">
          {(() => {
            const allLogs: { application: string; message: string }[] = [];

            // Mock logs for the current application
            allLogs.push(
              { application: application.name, message: '[2025-11-02 14:32:15] Application started successfully' },
              { application: application.name, message: `[2025-11-02 14:32:17] → HTTP server listening on port ${application.port}` },
              { application: application.name, message: '[2025-11-02 14:32:18] ✓ Health check passed' },
              { application: application.name, message: `[2025-11-02 14:32:19] → Replica 1 reporting healthy` },
              { application: application.name, message: `[2025-11-02 14:32:20] → Replica 2 reporting healthy` }
            );

            if (application.serviceAccess?.database) {
              allLogs.push({ application: application.name, message: '[2025-11-02 14:32:16] ✓ Database connection established' });
            }
            if (application.serviceAccess?.cache) {
              allLogs.push({ application: application.name, message: '[2025-11-02 14:32:16] ✓ Redis cache connected' });
            }

            if (application.exposure === 'public') {
              allLogs.push(
                { application: application.name, message: '[2025-11-02 14:35:42] GET /api/products 200 45ms' },
                { application: application.name, message: '[2025-11-02 14:35:43] POST /api/cart 201 52ms' },
                { application: application.name, message: '[2025-11-02 14:35:44] GET /api/checkout 200 38ms' },
                { application: application.name, message: '[2025-11-02 14:35:45] POST /api/orders 201 127ms' },
                { application: application.name, message: '[2025-11-02 14:35:46] GET / 200 15ms (cached)' }
              );
            } else {
              allLogs.push(
                { application: application.name, message: '[2025-11-02 14:35:42] Processing background job #1234' },
                { application: application.name, message: '[2025-11-02 14:35:43] → Job completed in 89ms' },
                { application: application.name, message: '[2025-11-02 14:35:44] Handling internal API call' }
              );
            }

            return allLogs.map((log, i) => (
              <div key={i}>
                {log.message}
              </div>
            ));
          })()}
        </div>
      )}

      {/* Metrics Tab Content */}
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

      {/* Events Tab Content */}
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
    </div>
  );
}

// Simplified Changes Preview Component
function ChangesPreview({ current, draft, onClose }: any) {
  // Calculate cost impact
  const costImpact = calculateApplicationCostImpact(
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
function DatabaseEditor({ database, environment, draftDatabase, setDraftDatabase, hasChanges, showChanges, setShowChanges, onApply, isApplying, state, onRemove }: any) {
  const handleRemove = () => {
    // Check if any application is still using the database
    const applications = state.applications || [];
    const inUse = applications.some((app: any) => app.serviceAccess?.database);

    if (inUse) {
      alert('Cannot remove database: one or more applications are still connected. Disable database access in application settings first.');
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
          <p className="text-xs text-slate-500">
            {draftDatabase.type === 'external' ? 'External connection' : `Managed ${draftDatabase.engine} instance`}
          </p>
        </div>
        {environment?.deployed && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChanges(true)}
              disabled={!hasChanges || isApplying}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${hasChanges ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
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
        )}
        {!environment?.deployed && (
          <button
            onClick={handleRemove}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>

      {/* Database Type Toggle */}
      <div className="flex p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setDraftDatabase({ ...draftDatabase, type: 'container' })}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${draftDatabase.type !== 'external' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Container (DIY)
        </button>
        <button
          onClick={() => setDraftDatabase({ ...draftDatabase, type: 'external' })}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${draftDatabase.type === 'external' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          External Database
        </button>
      </div>

      {/* External Database Configuration */}
      {draftDatabase.type === 'external' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-medium mb-1">External Database</p>
                <p>Connect to a managed database provider (e.g., Aiven, Supabase, AWS RDS). We recommend using the same region as your project for best performance.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Connection String</label>
            <div className="relative">
              <input
                type="password"
                value={draftDatabase.externalUrl || ''}
                onChange={(e) => setDraftDatabase({ ...draftDatabase, externalUrl: e.target.value })}
                placeholder="postgres://user:pass@host:5432/db"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Must be a valid PostgreSQL connection URL.</p>
          </div>

          {/* Mock Validation */}
          <div className="flex justify-end">
            <button className="text-sm text-purple-600 font-medium hover:text-purple-700">
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Container Configuration (DIY) */}
      {draftDatabase.type !== 'external' && (
        <>
          {/* Production Warning */}
          {environment?.type === 'prod' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1 text-sm text-amber-900">
                  <p className="font-medium mb-1">Not Recommended for Production</p>
                  <p>Running a database in a container is risky for production data. We strongly recommend using a managed database provider.</p>
                </div>
              </div>
            </div>
          )}

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
                className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
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
        </>
      )}

      {/* Changes Preview */}
      {showChanges && hasChanges && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-amber-900">📝 Pending Changes</h5>
            <button onClick={() => setShowChanges(false)} className="text-xs text-amber-700 underline">Hide</button>
          </div>
          <ul className="text-sm text-amber-900 list-disc ml-5 space-y-1">
            {state.resources?.database && draftDatabase.type !== (state.resources.database.type || 'container') && (
              <li>Type: {state.resources.database.type || 'container'} → {draftDatabase.type}</li>
            )}
            {draftDatabase.type === 'external' && state.resources?.database?.externalUrl !== draftDatabase.externalUrl && (
              <li>Connection URL: Updated</li>
            )}
            {draftDatabase.type !== 'external' && state.resources?.database && draftDatabase.cpu !== state.resources.database.cpu && (
              <li>CPU: {state.resources.database.cpu} → {draftDatabase.cpu}</li>
            )}
            {draftDatabase.type !== 'external' && state.resources?.database && draftDatabase.memory !== state.resources.database.memory && (
              <li>Memory: {state.resources.database.memory} → {draftDatabase.memory}</li>
            )}
            {draftDatabase.type !== 'external' && state.resources?.database && draftDatabase.storage !== state.resources.database.storage && (
              <li>Storage: {state.resources.database.storage} → {draftDatabase.storage}</li>
            )}
            {draftDatabase.type !== 'external' && state.resources?.database && draftDatabase.backups.frequency !== state.resources.database.backups.frequency && (
              <li>Backup frequency: {state.resources.database.backups.frequency} → {draftDatabase.backups.frequency}</li>
            )}
            {draftDatabase.type !== 'external' && state.resources?.database && draftDatabase.backups.retention !== state.resources.database.backups.retention && (
              <li>Backup retention: {state.resources.database.backups.retention} → {draftDatabase.backups.retention}</li>
            )}
            {draftDatabase.type !== 'external' && state.resources?.database && draftDatabase.replicas !== state.resources.database.replicas && (
              <li>Replicas: {state.resources.database.replicas} → {draftDatabase.replicas}</li>
            )}
          </ul>
          <div className="text-xs text-amber-800 mt-3">
            Impact: Storage changes are instant. CPU/Memory changes require brief maintenance window (~3 min). Zero data loss guaranteed.
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified Cache Editor
function CacheEditor({ cache, environment, draftCache, setDraftCache, hasChanges, showChanges, setShowChanges, onApply, isApplying, state, onRemove }: any) {
  const handleRemove = () => {
    // Check if any application is still using the cache
    const applications = state.applications || [];
    const inUse = applications.some((app: any) => app.serviceAccess?.cache);

    if (inUse) {
      alert('Cannot remove cache: one or more applications are still connected. Disable cache access in application settings first.');
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
        {environment?.deployed && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChanges(true)}
              disabled={!hasChanges || isApplying}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${hasChanges ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-400'
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
        )}
        {!environment?.deployed && (
          <button
            onClick={handleRemove}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        )}
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
            className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
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
            {cache.persistence !== draftCache.persistence && (
              <li>Persistence: {cache.persistence} → {draftCache.persistence}</li>
            )}
          </ul>
          <div className="text-xs text-amber-800 mt-3">
            Impact: Memory changes require restart (~30 sec). Data persisted if AOF/RDB enabled.
          </div>
        </div>
      )}
    </div>
  );
}

// Confirmation Modal
function ConfirmationModal({ selected, selectedResource, draftApplication, draftDatabase, draftCache, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Apply Configuration Changes?</h3>

            {/* Application Changes Summary */}
            {selected.kind === 'application' && selectedResource && draftApplication && (
              <>
                <div className="text-sm text-slate-700 mb-4">
                  <p className="font-medium mb-2">Summary:</p>
                  <p className="text-slate-600">Application: <span className="font-mono">{selectedResource.data.name || selectedResource.data.imageUrl.split('/').pop()?.split(':')[0]}</span></p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-slate-600">
                    {selectedResource.data.resources.cpu !== draftApplication.resources.cpu && (
                      <li>CPU: {selectedResource.data.resources.cpu} → {draftApplication.resources.cpu} cores</li>
                    )}
                    {selectedResource.data.resources.memory !== draftApplication.resources.memory && (
                      <li>Memory: {selectedResource.data.resources.memory} → {draftApplication.resources.memory}</li>
                    )}
                    {selectedResource.data.resources.replicas.min !== draftApplication.resources.replicas.min && (
                      <li>Min replicas: {selectedResource.data.resources.replicas.min} → {draftApplication.resources.replicas.min}</li>
                    )}
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-medium text-slate-900">Impact Assessment:</p>
                  <p className="text-slate-600">⚠️ Rolling restart required</p>
                  <p className="text-slate-600">⏱️ Estimated time: ~2 minutes</p>
                  <p className="text-slate-600">✅ No expected traffic disruption</p>
                  {(() => {
                    const costImpact = calculateApplicationCostImpact(
                      selectedResource.data.resources.cpu,
                      selectedResource.data.resources.memory,
                      selectedResource.data.resources.replicas,
                      draftApplication.resources.cpu,
                      draftApplication.resources.memory,
                      draftApplication.resources.replicas
                    );
                    return costImpact !== 0 ? (
                      <p className="text-slate-600 font-medium">
                        💰 Cost impact: {costImpact > 0 ? '+' : ''}€{Math.abs(costImpact).toFixed(2)}/month
                      </p>
                    ) : null;
                  })()}
                </div>
              </>
            )}

            {/* Database Changes Summary */}
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
                    {selectedResource.data.replicas.min !== draftDatabase.replicas.min && (
                      <li>Replicas (min): {selectedResource.data.replicas.min} → {draftDatabase.replicas.min}</li>
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
                        💰 Cost impact: {costImpact > 0 ? '+' : ''}€{Math.abs(costImpact).toFixed(2)}/month
                      </p>
                    ) : null;
                  })()}
                </div>
              </>
            )}

            {/* Cache Changes Summary */}
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
                    {selectedResource.data.evictionPolicy !== draftCache.evictionPolicy && (
                      <li>Eviction Policy: {selectedResource.data.evictionPolicy} → {draftCache.evictionPolicy}</li>
                    )}
                    {selectedResource.data.persistence !== draftCache.persistence && (
                      <li>Persistence: {selectedResource.data.persistence} → {draftCache.persistence}</li>
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
                        💰 Cost impact: {costImpact > 0 ? '+' : ''}€{Math.abs(costImpact).toFixed(2)}/month
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
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
                          const displayName = container.imageUrl.split('/').pop()?.split(':')[0] || `app-${idx + 1}`;
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-sm rounded-full">
                        <span>💾</span>
                        <span>Database</span>
                      </span>
                    )}
                    {resourceData.serviceAccess.cache && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-sm rounded-full">
                        <span>⚡</span>
                        <span>Cache</span>
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

