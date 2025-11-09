'use client';

import { Environment, Project } from '@/lib/context/DeploymentContext';
import { useEffect, useState } from 'react';

interface EnvironmentNavigatorProps {
  project: Project;
  selected: { kind: 'container' | 'database' | 'cache' | 'architecture' | 'environment' | 'project-settings'; id?: string; envId?: string };
  onSelect: (selection: { kind: 'container' | 'database' | 'cache' | 'architecture' | 'environment' | 'project-settings'; id?: string; envId?: string }) => void;
}

export default function EnvironmentNavigator({ project, selected, onSelect }: EnvironmentNavigatorProps) {
  // Track which environment is expanded (only one at a time)
  const [expandedEnvId, setExpandedEnvId] = useState<string | null>(null);

  // Calculate time remaining for PR environments
  const getTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return '';
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Real-time timer updates for PR environments
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (env: Environment) => {
    if (env.status === 'provisioning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
          <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-pulse"></span>
          Provisioning
        </span>
      );
    }
    if (env.status === 'paused') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
          Paused
        </span>
      );
    }
    if (env.status === 'deleting') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          Deleting
        </span>
      );
    }
    if (env.status === 'deleted' || env.status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">
          <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
          {env.status === 'expired' ? 'Expired' : 'Deleted'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
        Live
      </span>
    );
  };

  const getTypeBadge = (env: Environment) => {
    if (env.type === 'pr') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
          PR #{env.prSource?.prNumber || '?'}
        </span>
      );
    }
    return null;
  };

  // Filter out deleted/expired environments
  const activeEnvironments = project.environments.filter(e => e.status !== 'deleted' && e.status !== 'expired');
  const standardEnvs = activeEnvironments.filter(e => e.type === 'standard');
  const prEnvs = activeEnvironments.filter(e => e.type === 'pr');

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 space-y-4 sticky top-4 border border-slate-200">
      {/* Project Header */}
      <button
        onClick={() => onSelect({ kind: 'project-settings' })}
        className={`w-full bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:bg-slate-50 transition text-left ${
          selected.kind === 'project-settings' ? 'ring-2 ring-purple-500' : ''
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📦</span>
          <h3 className="font-bold text-slate-900 text-lg">{project.name}</h3>
          <span className="ml-auto">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          <div>{activeEnvironments.length} environment{activeEnvironments.length !== 1 ? 's' : ''}</div>
          {prEnvs.length > 0 && (
            <div className="text-blue-600 font-medium">
              {prEnvs.length}/{project.prEnvs.maxEnvs} PR environments
            </div>
          )}
        </div>
      </button>

      {/* Standard Environments */}
      {standardEnvs.map((env: Environment) => {
        const containers = env.containers || [];
        const hasDatabase = !!env.database;
        const hasCache = !!env.cache;
        const isEnvSelected = selected.kind === 'environment' && selected.envId === env.id;
        const isExpanded = expandedEnvId === env.id;

        return (
          <div key={env.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Environment Header */}
            <button
              onClick={() => {
                // Toggle expansion
                if (isExpanded) {
                  setExpandedEnvId(null);
                } else {
                  setExpandedEnvId(env.id);
                }
                // Select environment for right panel
                onSelect({ kind: 'environment', envId: env.id });
              }}
              className={`w-full bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 hover:from-purple-100 hover:to-blue-100 transition text-left ${
                isEnvSelected ? 'ring-2 ring-purple-500 ring-inset' : ''
              } ${!isExpanded ? 'border-b-0' : 'border-b border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <svg 
                    className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-lg">🔧</span>
                  <span className="font-bold text-slate-900">{env.name}</span>
                </div>
                {getStatusBadge(env)}
              </div>
              <div className="text-xs text-slate-600 ml-6">
                {env.baseDomain}
              </div>
            </button>

            {/* Resources - Only show when expanded */}
            {isExpanded && (
              <div className="p-3 space-y-3 border-t border-slate-200">
              {/* Containers */}
              {containers.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <span>🚀</span>
                    <span>Containers ({containers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {containers.map((container: any, idx: number) => {
                      const displayName = container.name || container.imageUrl.split('/').pop()?.split(':')[0] || `app-${idx + 1}`;
                      const isSelected = selected.kind === 'container' && selected.id === container.id;

                      return (
                        <button
                          key={container.id}
                          onClick={() => onSelect({ kind: 'container', id: container.id, envId: env.id })}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                            isSelected
                              ? 'border-purple-400 bg-purple-50 shadow-sm'
                              : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-sm font-medium text-slate-900 truncate">{displayName}</div>
                          {container.exposure === 'public' && (
                            <div className="text-xs text-slate-500">Public</div>
                          )}
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
                    onClick={() => onSelect({ kind: 'database', envId: env.id })}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                      selected.kind === 'database' && selected.envId === env.id
                        ? 'border-green-400 bg-green-50 shadow-sm'
                        : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-900">
                      {env.database?.engine === 'postgres' ? 'PostgreSQL' : env.database?.engine}
                    </div>
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
                    onClick={() => onSelect({ kind: 'cache', envId: env.id })}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                      selected.kind === 'cache' && selected.envId === env.id
                        ? 'border-red-400 bg-red-50 shadow-sm'
                        : 'border-slate-200 hover:border-red-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-900">
                      {env.cache?.engine === 'redis' ? 'Redis' : env.cache?.engine}
                    </div>
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        );
      })}

      {/* PR Environments */}
      {prEnvs.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600 px-2 flex items-center gap-2">
            <span>⚡</span>
            <span>PR Environments</span>
          </div>
          {prEnvs.map((env: Environment) => {
            const isEnvSelected = selected.kind === 'environment' && selected.envId === env.id;
            const isExpanded = expandedEnvId === env.id;
            const timeRemaining = getTimeRemaining(env.expiresAt);

            return (
              <div key={env.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <button
                  onClick={() => {
                    // Toggle expansion
                    if (isExpanded) {
                      setExpandedEnvId(null);
                    } else {
                      setExpandedEnvId(env.id);
                    }
                    // Select environment for right panel
                    onSelect({ kind: 'environment', envId: env.id });
                  }}
                  className={`w-full text-left p-3 hover:bg-blue-50 transition ${
                    isEnvSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg 
                        className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium text-slate-900 truncate">{env.name}</span>
                    </div>
                    {getTypeBadge(env)}
                  </div>
                  <div className="flex items-center justify-between text-xs ml-6">
                    {getStatusBadge(env)}
                    {env.expiresAt && env.status === 'active' && (
                      <span className="text-slate-600">
                        ⏱️ {timeRemaining}
                      </span>
                    )}
                  </div>
                  {env.prSource && !isExpanded && (
                    <div className="text-xs text-slate-600 mt-2 truncate ml-6">
                      {env.prSource.repository} • {env.prSource.branchName}
                    </div>
                  )}
                </button>
                
                {/* PR Details - Only show when expanded */}
                {isExpanded && env.prSource && (
                  <div className="px-3 pb-3 space-y-2 border-t border-slate-200 pt-2">
                    <div className="text-xs">
                      <div className="text-slate-600">Repository</div>
                      <div className="font-medium text-slate-900">{env.prSource.repository}</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-slate-600">Branch</div>
                      <div className="font-medium text-slate-900">{env.prSource.branchName}</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-slate-600">PR Title</div>
                      <div className="font-medium text-slate-900">{env.prSource.prTitle}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Architecture Diagram Option */}
      <button
        onClick={() => onSelect({ kind: 'architecture' })}
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
  );
}
