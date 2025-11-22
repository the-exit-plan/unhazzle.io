'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project, useDeployment } from '@/lib/context/DeploymentContext';
import { calculateEnvironmentCost } from '@/lib/utils/costCalculator';
import { CheckCircle2, Github, Trash2, CreditCard } from 'lucide-react';

interface ProjectSettingsProps {
  project: Project;
  onSave: (updates: Partial<Project>) => void;
  initialTab?: 'general' | 'repository' | 'registry' | 'pr-environments' | 'environments' | 'billing';
  onCreateEnvironment: () => void;
}

export default function ProjectSettings({ project, onSave, initialTab = 'general', onCreateEnvironment }: ProjectSettingsProps) {
  const router = useRouter();
  const { getActiveEnvironment, setActiveEnvironment, deleteEnvironment } = useDeployment();

  // General settings
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description || '');

  // Repository integration
  const [repoUrl, setRepoUrl] = useState(project.repository?.url || '');
  const [branch, setBranch] = useState(project.repository?.branch || 'main');
  const [configPath, setConfigPath] = useState(project.repository?.configPath || 'unhazzle.yaml');
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(project.repository?.autoDeployEnabled ?? true);

  // Container Registry
  const [githubPAT, setGithubPAT] = useState(project.githubPAT || '');
  const [isRegistryConnected, setIsRegistryConnected] = useState(!!project.githubPAT);

  // PR environments
  const [prEnvsEnabled, setPrEnvsEnabled] = useState(project.prEnvironmentSettings?.enabled ?? false);
  const [prAutoCreate, setPrAutoCreate] = useState(project.prEnvironmentSettings?.autoCreateOnPR ?? true);
  const [prAutoDelete, setPrAutoDelete] = useState(project.prEnvironmentSettings?.autoDeleteOnMerge ?? true);
  const [prExpirationHours, setPrExpirationHours] = useState(project.prEnvironmentSettings?.expirationHours ?? 72);
  const [prNameTemplate, setPrNameTemplate] = useState(project.prEnvironmentSettings?.nameTemplate || 'pr-{number}');

  const [activeSection, setActiveSection] = useState<'general' | 'repository' | 'registry' | 'pr-environments' | 'environments' | 'billing'>(initialTab);
  const [hasChanges, setHasChanges] = useState(false);
  const [envToDelete, setEnvToDelete] = useState<{ id: string; name: string } | null>(null);

  // Sync activeSection with initialTab when it changes
  useEffect(() => {
    setActiveSection(initialTab);
  }, [initialTab]);

  const handleSave = () => {
    onSave({
      name,
      slug,
      description,
      githubPAT,
      repository: {
        url: repoUrl,
        branch,
        autoDeployEnabled,
        configPath,
      },
      prEnvironmentSettings: {
        enabled: prEnvsEnabled,
        autoCreateOnPR: prAutoCreate,
        autoDeleteOnMerge: prAutoDelete,
        expirationHours: prExpirationHours,
        nameTemplate: prNameTemplate,
      },
    });
    setHasChanges(false);
  };

  const handleSavePAT = () => {
    if (!githubPAT.trim()) {
      alert('Please enter a GitHub Personal Access Token');
      return;
    }
    onSave({ githubPAT });
    setIsRegistryConnected(true);
    setHasChanges(false);
  };

  const handleContinueToEnv = () => {
    const activeEnv = getActiveEnvironment();
    if (activeEnv) {
      setActiveEnvironment(activeEnv.id);
      router.push(`/dashboard?selection=environment&env=${activeEnv.id}`);
    } else {
      router.push('/dashboard');
    }
  };

  const handleDeleteEnvironment = () => {
    if (!envToDelete) return;

    // Check if environment has production apps or is production type
    const env = project.environments.find(e => e.id === envToDelete.id);
    if (env?.type === 'prod') {
      const confirmed = window.confirm(`WARNING: You are about to delete a PRODUCTION environment (${envToDelete.name}). This action cannot be undone. Are you sure?`);
      if (!confirmed) {
        setEnvToDelete(null);
        return;
      }
    }

    deleteEnvironment(envToDelete.id);
    setEnvToDelete(null);
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

  const handleReset = () => {
    setName(project.name);
    setSlug(project.slug);
    setDescription(project.description || '');
    setRepoUrl(project.repository?.url || '');
    setBranch(project.repository?.branch || 'main');
    setConfigPath(project.repository?.configPath || 'unhazzle.yaml');
    setAutoDeployEnabled(project.repository?.autoDeployEnabled ?? true);
    setPrEnvsEnabled(project.prEnvironmentSettings?.enabled ?? false);
    setPrAutoCreate(project.prEnvironmentSettings?.autoCreateOnPR ?? true);
    setPrAutoDelete(project.prEnvironmentSettings?.autoDeleteOnMerge ?? true);
    setPrExpirationHours(project.prEnvironmentSettings?.expirationHours ?? 72);
    setPrNameTemplate(project.prEnvironmentSettings?.nameTemplate || 'pr-{number}');
    setHasChanges(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure project details, repository integration, and PR environment behavior
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex-none border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveSection('general')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === 'general'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveSection('environments')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === 'environments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Environments
          </button>
          <button
            onClick={() => setActiveSection('repository')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === 'repository'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Repository Integration
          </button>
          <button
            onClick={() => setActiveSection('registry')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === 'registry'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Container Registry
          </button>
          <button
            onClick={() => setActiveSection('pr-environments')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === 'pr-environments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            PR Environments
          </button>
          <button
            onClick={() => setActiveSection('billing')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === 'billing'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Billing
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 max-w-4xl">
          {activeSection === 'environments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Environments</h3>
                <button
                  onClick={onCreateEnvironment}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <span className="text-base">🌍</span>
                  <span>Create Environment</span>
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Cost</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.environments.map((env) => {
                      // Calculate estimated cost using shared utility
                      const { current: cost } = calculateEnvironmentCost(env);

                      return (
                        <tr
                          key={env.id}
                          onClick={() => {
                            setActiveEnvironment(env.id);
                            router.push(`/dashboard?selection=environment&env=${env.id}`);
                          }}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{env.name}</div>
                            <div className="text-xs text-gray-500">{env.baseDomain}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${env.type === 'prod' ? 'bg-purple-100 text-purple-800' :
                              env.type === 'non-prod' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {env.type === 'prod' ? 'Production' : env.type === 'non-prod' ? 'Non-Prod' : 'Standard'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(env.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            €{cost.toFixed(2)}/mo
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEnvToDelete({ id: env.id, name: env.name });
                              }}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete Environment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {envToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Delete Environment?</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete <strong>{envToDelete.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setEnvToDelete(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteEnvironment}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome App"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A friendly name for your project
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="my-awesome-app"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in URLs and CLI commands (lowercase, hyphens only)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="A brief description of your project (optional)"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Danger Zone</h3>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Delete Project</h4>
                      <p className="text-xs text-red-700 mt-1">
                        Permanently delete this project and all its environments
                      </p>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-red-700 border border-red-300 rounded hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'repository' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://github.com/username/repo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  GitHub repository URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="main"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Branch used for production deployments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Config File Path
                </label>
                <input
                  type="text"
                  value={configPath}
                  onChange={(e) => {
                    setConfigPath(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="unhazzle.yaml"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Path to your Unhazzle configuration file in the repository
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="auto-deploy"
                  checked={autoDeployEnabled}
                  onChange={(e) => {
                    setAutoDeployEnabled(e.target.checked);
                    setHasChanges(true);
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="auto-deploy" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Enable Auto-Deploy
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically deploy when changes are pushed to tracked branches
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Connection Status</h4>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">Connected to GitHub</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Last synced: 2 hours ago
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'registry' && (
            <div className="space-y-6">
              {!isRegistryConnected ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                      <Github className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">GitHub Container Registry</h4>
                        <p className="text-xs text-muted-foreground">
                          Generate a Personal Access Token (Classic) with <code>read:packages</code> scope.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="pat-token" className="block text-sm font-medium text-gray-700">Personal Access Token</label>
                      <input
                        id="pat-token"
                        type="password"
                        placeholder="ghp_..."
                        value={githubPAT}
                        onChange={(e) => {
                          setGithubPAT(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={handleSavePAT}
                      disabled={!githubPAT.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Connect Registry
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-in fade-in zoom-in duration-300">
                  <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg">Registry Connected</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto text-gray-500">
                      Your project is now authenticated with GitHub. You can select private images when adding applications.
                    </p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setIsRegistryConnected(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Update Token
                    </button>
                    <button
                      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                      onClick={handleContinueToEnv}
                    >
                      Ready to deploy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'pr-environments' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🚀</span>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Coming Soon</h3>
                  <p className="text-blue-800 mb-4">
                    PR Environments are a high-priority feature for Unhazzle, but they won't be available in the initial MVP release.
                  </p>
                  <p className="text-sm text-blue-700">
                    We're working on a seamless integration with GitHub Actions to automatically spin up ephemeral environments for every pull request. Stay tuned!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="space-y-6">
              {/* Total Cost Card */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-purple-100">Total Project Cost</h3>
                    <div className="text-4xl font-bold mt-1">
                      €{project.environments.reduce((acc, env) => acc + calculateEnvironmentCost(env).current, 0).toFixed(2)}
                      <span className="text-lg font-normal text-purple-200 ml-2">
                        (Max: €{project.environments.reduce((acc, env) => acc + calculateEnvironmentCost(env).max, 0).toFixed(2)})
                      </span>
                      <span className="text-lg font-normal text-purple-200 ml-2">/month</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-sm text-purple-200">Environments</div>
                    <div className="text-xl font-semibold">{project.environments.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-purple-200">Applications</div>
                    <div className="text-xl font-semibold">
                      {project.environments.reduce((acc, env) => acc + env.applications.length, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-purple-200">Storage</div>
                    <div className="text-xl font-semibold">
                      {project.environments.reduce((acc, env) => acc + env.applications.reduce((appAcc, app) => appAcc + (app.volume?.sizeGB || 0), 0), 0)} GB
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Cost Breakdown by Environment</h3>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Environment</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resources</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {project.environments.map((env) => {
                        const { current: cost, breakdown } = calculateEnvironmentCost(env);

                        return (
                          <tr key={env.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">{env.name}</div>
                              <div className="text-xs text-slate-500">{env.baseDomain}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${env.type === 'prod' ? 'bg-purple-100 text-purple-800' :
                                env.type === 'non-prod' ? 'bg-blue-100 text-blue-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                {env.type === 'prod' ? 'Production' : env.type === 'non-prod' ? 'Non-Prod' : 'Standard'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              <div className="flex flex-col gap-1">
                                <span>{env.applications.length} Apps (€{breakdown.applications.reduce((sum: number, app: any) => sum + app.current, 0).toFixed(2)})</span>
                                {env.database && <span>Database (€{breakdown.database?.toFixed(2)})</span>}
                                {env.cache && <span>Cache (€{breakdown.cache?.toFixed(2)})</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                              <div>€{cost.toFixed(2)}</div>
                              <div className="text-xs text-slate-500 font-normal">Max: €{calculateEnvironmentCost(env).max.toFixed(2)}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-slate-900">Total Monthly Estimate</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-purple-600">
                          <div>€{project.environments.reduce((acc, env) => acc + calculateEnvironmentCost(env).current, 0).toFixed(2)}</div>
                          <div className="text-xs text-purple-400 font-normal">Max: €{project.environments.reduce((acc, env) => acc + calculateEnvironmentCost(env).max, 0).toFixed(2)}</div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Billing Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Billing Information</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Unhazzle uses a transparent pricing model based on your resource usage. Costs are estimated based on current configuration and may vary with usage.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>💳</span>
                  <span>Payment method: <span className="font-medium text-slate-900">Visa ending in 4242</span></span>
                  <button className="ml-2 text-blue-600 hover:text-blue-700 font-medium">Update</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
