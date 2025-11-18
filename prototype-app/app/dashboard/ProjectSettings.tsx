'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project, useDeployment } from '@/lib/context/DeploymentContext';

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

interface ProjectSettingsProps {
  project: Project;
  onSave: (updates: Partial<Project>) => void;
  initialTab?: 'general' | 'repository' | 'registry' | 'pr-environments' | 'environments';
  onCreateEnvironment: () => void;
}

export default function ProjectSettings({ project, onSave, initialTab = 'general', onCreateEnvironment }: ProjectSettingsProps) {
  const router = useRouter();
  const { createAppsFromImages, getActiveEnvironment, setActiveEnvironment } = useDeployment();
  
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
  const [showImages, setShowImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // PR environments
  const [prEnvsEnabled, setPrEnvsEnabled] = useState(project.prEnvironmentSettings?.enabled ?? false);
  const [prAutoCreate, setPrAutoCreate] = useState(project.prEnvironmentSettings?.autoCreateOnPR ?? true);
  const [prAutoDelete, setPrAutoDelete] = useState(project.prEnvironmentSettings?.autoDeleteOnMerge ?? true);
  const [prExpirationHours, setPrExpirationHours] = useState(project.prEnvironmentSettings?.expirationHours ?? 72);
  const [prNameTemplate, setPrNameTemplate] = useState(project.prEnvironmentSettings?.nameTemplate || 'pr-{number}');
  
  const [activeSection, setActiveSection] = useState<'general' | 'repository' | 'registry' | 'pr-environments' | 'environments'>(initialTab);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleFetchImages = () => {
    if (!githubPAT.trim()) {
      alert('Please enter a GitHub Personal Access Token');
      return;
    }
    onSave({ githubPAT });
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

  const handleContinueWithContainers = () => {
    const activeEnv = getActiveEnvironment();
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
    }).filter(Boolean) as Array<{name: string; url: string; autoName: string; tag?: string; description?: string}>;
    
    if (imagesToCreate.length > 0) {
      createAppsFromImages(activeEnv.id, imagesToCreate);
    }
    
    setTimeout(() => {
      setIsCreating(false);
      setActiveEnvironment(activeEnv.id);
      router.push(`/dashboard?selection=environment&env=${activeEnv.id}`);
    }, 1000);
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
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveSection('environments')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'environments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Environments
          </button>
          <button
            onClick={() => setActiveSection('repository')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'repository'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Repository Integration
          </button>
          <button
            onClick={() => setActiveSection('registry')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'registry'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Container Registry
          </button>
          <button
            onClick={() => setActiveSection('pr-environments')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'pr-environments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            PR Environments
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 max-w-2xl">
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.environments.map((env) => {
                      // Calculate estimated cost (simplified logic from EnvironmentInfo)
                      let cost = 0;
                      if (env.containers.length > 0) {
                        env.containers.forEach(c => {
                          const cpu = parseFloat(c.resources.cpu);
                          const mem = parseFloat(c.resources.memory);
                          const replicas = (c.resources.replicas.min + c.resources.replicas.max) / 2;
                          let base = 4.99;
                          if (cpu > 1 || mem > 2) base = 5.49;
                          if (cpu > 2 || mem > 4) base = 9.49;
                          if (cpu > 4 || mem > 8) base = 17.49;
                          cost += Math.ceil(replicas / 2) * base;
                          if (c.volume) cost += c.volume.sizeGB * 0.044;
                        });
                        cost += 22; // LB + Bandwidth
                        cost *= 1.3; // Margin
                      }

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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              env.type === 'prod' ? 'bg-purple-100 text-purple-800' : 
                              env.type === 'non-prod' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {env.type === 'prod' ? 'Production' : env.type === 'non-prod' ? 'Non-Prod' : 'Standard'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              env.status === 'active' ? 'bg-green-100 text-green-800' :
                              env.status === 'provisioning' ? 'bg-yellow-100 text-yellow-800' :
                              env.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {env.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            €{cost.toFixed(2)}/mo
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
              {!showImages ? (
                <>
                  {/* PAT Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Personal Access Token
                    </label>
                    <input
                      type="password"
                      value={githubPAT}
                      onChange={(e) => {
                        setGithubPAT(e.target.value);
                        setHasChanges(true);
                      }}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Token needs <code className="bg-gray-100 px-1 rounded">read:packages</code> scope to access ghcr.io
                    </p>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <span className="text-xl">ℹ️</span>
                      <div className="flex-1 text-sm text-blue-900">
                        <p className="font-medium mb-1">Connect to GitHub Container Registry</p>
                        <p>
                          Link your GitHub account to quickly import container images from ghcr.io. 
                          This is optional - you can always add containers manually.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={handleFetchImages}
                      disabled={!githubPAT.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Fetch Images
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Image Selection */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Select Images to Deploy (max 5)
                    </h3>
                    <div className="space-y-3">
                      {MOCK_GHCR_IMAGES.map(img => {
                        const fullName = `${img.name}:${img.tag}`;
                        const isSelected = selectedImages.includes(fullName);
                        
                        return (
                          <button
                            key={fullName}
                            onClick={() => toggleImage(fullName)}
                            className={`w-full p-4 border-2 rounded-lg text-left transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-1 ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 mb-1">
                                  ghcr.io/{img.name}:<span className="text-blue-600">{img.tag}</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">{img.description}</div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
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
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700">
                      {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                      {selectedImages.length > 0 && ' - containers will be auto-configured with smart defaults'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition font-medium text-gray-700"
                    >
                      Skip & Add Manually
                    </button>
                    <button
                      onClick={handleContinueWithContainers}
                      disabled={selectedImages.length === 0 || isCreating}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <span className="animate-spin">⚙️</span>
                          <span>Creating Containers...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue with {selectedImages.length} Container{selectedImages.length !== 1 ? 's' : ''}</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
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
        </div>
      </div>

      {/* Footer with Save/Cancel */}
      {hasChanges && (
        <div className="flex-none border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
