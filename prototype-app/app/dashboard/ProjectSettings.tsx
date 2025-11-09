'use client';

import { useState } from 'react';
import { Project } from '@/lib/context/DeploymentContext';

interface ProjectSettingsProps {
  project: Project;
  onSave: (updates: Partial<Project>) => void;
}

export default function ProjectSettings({ project, onSave }: ProjectSettingsProps) {
  // General settings
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description || '');
  
  // Repository integration
  const [repoUrl, setRepoUrl] = useState(project.repository?.url || '');
  const [branch, setBranch] = useState(project.repository?.branch || 'main');
  const [configPath, setConfigPath] = useState(project.repository?.configPath || 'unhazzle.yaml');
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(project.repository?.autoDeployEnabled ?? true);
  
  // PR environments
  const [prEnvsEnabled, setPrEnvsEnabled] = useState(project.prEnvironmentSettings?.enabled ?? false);
  const [prAutoCreate, setPrAutoCreate] = useState(project.prEnvironmentSettings?.autoCreateOnPR ?? true);
  const [prAutoDelete, setPrAutoDelete] = useState(project.prEnvironmentSettings?.autoDeleteOnMerge ?? true);
  const [prExpirationHours, setPrExpirationHours] = useState(project.prEnvironmentSettings?.expirationHours ?? 72);
  const [prNameTemplate, setPrNameTemplate] = useState(project.prEnvironmentSettings?.nameTemplate || 'pr-{number}');
  
  const [activeSection, setActiveSection] = useState<'general' | 'repository' | 'pr-environments'>('general');
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    onSave({
      name,
      slug,
      description,
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

          {activeSection === 'pr-environments' && (
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="pr-enabled"
                  checked={prEnvsEnabled}
                  onChange={(e) => {
                    setPrEnvsEnabled(e.target.checked);
                    setHasChanges(true);
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="pr-enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Enable PR Environments
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically create ephemeral environments for pull requests
                  </p>
                </div>
              </div>

              {prEnvsEnabled && (
                <>
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="pr-auto-create"
                      checked={prAutoCreate}
                      onChange={(e) => {
                        setPrAutoCreate(e.target.checked);
                        setHasChanges(true);
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="pr-auto-create" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Auto-create on PR Open
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Create environment automatically when a pull request is opened
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="pr-auto-delete"
                      checked={prAutoDelete}
                      onChange={(e) => {
                        setPrAutoDelete(e.target.checked);
                        setHasChanges(true);
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="pr-auto-delete" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Auto-delete on PR Merge
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Delete environment automatically when pull request is merged or closed
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Time
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        value={prExpirationHours}
                        onChange={(e) => {
                          setPrExpirationHours(parseInt(e.target.value) || 72);
                          setHasChanges(true);
                        }}
                        min="1"
                        max="720"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">hours</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PR environments expire after this many hours of inactivity
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name Template
                    </label>
                    <input
                      type="text"
                      value={prNameTemplate}
                      onChange={(e) => {
                        setPrNameTemplate(e.target.value);
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="pr-{number}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {'{number}'} for PR number, {'{branch}'} for branch name
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-amber-900 mb-2">Cost Estimate</h4>
                      <p className="text-xs text-gray-600">
                        Each PR environment costs approximately <span className="font-semibold">€0.08/2 hours</span> or{' '}
                        <span className="font-semibold">€0.96/day</span> when active.
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        With expiration set to {prExpirationHours}h, maximum cost per PR is{' '}
                        <span className="font-semibold">€{((prExpirationHours / 2) * 0.08).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
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
