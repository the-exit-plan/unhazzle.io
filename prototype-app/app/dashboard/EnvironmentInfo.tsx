'use client';

import { Environment } from '@/lib/context/DeploymentContext';
import { useState } from 'react';

interface EnvironmentInfoProps {
  environment: Environment;
  onClone?: () => void;
  onPromote?: () => void;
  onDelete?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export default function EnvironmentInfo({ environment, onClone, onPromote, onDelete, onPause, onResume }: EnvironmentInfoProps) {
  const [showActions, setShowActions] = useState(false);

  // Calculate environment cost
  const calculateEnvCost = () => {
    let total = 0;
    
    // Container costs - simplified calculation
    environment.containers.forEach(container => {
      const cpuCores = parseFloat(container.resources.cpu);
      const memoryGB = parseFloat(container.resources.memory);
      const avgReplicas = (container.resources.replicas.min + container.resources.replicas.max) / 2;
      
      // Simplified cost model
      let monthlyPerInstance = 4.99;
      if (cpuCores > 1 || memoryGB > 2) monthlyPerInstance = 5.49;
      if (cpuCores > 2 || memoryGB > 4) monthlyPerInstance = 9.49;
      if (cpuCores > 4 || memoryGB > 8) monthlyPerInstance = 17.49;
      
      const serversNeeded = Math.ceil(avgReplicas / 2);
      total += serversNeeded * monthlyPerInstance;
      
      // Volume cost
      if (container.volume) {
        total += container.volume.sizeGB * 0.044;
      }
    });
    
    // Database cost
    if (environment.database) {
      const cpuCores = parseFloat(environment.database.cpu);
      const memoryGB = parseFloat(environment.database.memory);
      let storageGB = parseFloat(environment.database.storage);
      if (environment.database.storage.includes('TB')) {
        storageGB *= 1000;
      }
      
      let computeCost = 4.99;
      if (cpuCores > 1 || memoryGB > 2) computeCost = 5.49;
      if (cpuCores > 2 || memoryGB > 4) computeCost = 9.49;
      if (cpuCores > 4 || memoryGB > 8) computeCost = 17.49;
      if (cpuCores > 8 || memoryGB > 16) computeCost = 34.49;
      
      const storageCost = storageGB * 0.044;
      
      if (environment.database.replicas.includes('HA') || environment.database.replicas.includes('Multi-region')) {
        computeCost *= 2;
      }
      
      total += computeCost + storageCost;
    }
    
    // Cache cost
    if (environment.cache) {
      const memoryMB = parseFloat(environment.cache.memory.replace('MB', '').replace('GB', '')) * 
                       (environment.cache.memory.includes('GB') ? 1024 : 1);
      
      if (memoryMB < 1024) {
        // Shared with app, no extra cost
      } else if (memoryMB <= 2048) {
        total += 4.99;
      } else {
        total += 5.49;
      }
    }
    
    // Load balancer + bandwidth estimate
    total += 12; // Load balancer
    total += 10; // Bandwidth estimate
    
    // Apply 30% margin
    total = total * 1.3;
    
    return total;
  };

  const monthlyCost = calculateEnvCost();
  const isPR = environment.type === 'pr';
  const isDeleted = environment.status === 'deleted' || environment.status === 'expired';

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time remaining for PR envs
  const getTimeRemaining = () => {
    if (!environment.expiresAt) return null;
    const now = new Date().getTime();
    const expiry = new Date(environment.expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold">{environment.name}</h2>
              {isPR && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium">
                  PR #{environment.prSource?.prNumber}
                </span>
              )}
            </div>
            <div className="text-purple-100 text-sm space-y-1">
              <div>{environment.baseDomain}</div>
              {environment.status === 'active' && environment.publicContainers.length > 0 && (
                <div>
                  {environment.publicContainers.length} public container{environment.publicContainers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <div>
            {environment.status === 'active' && (
              <span className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
            {environment.status === 'paused' && (
              <span className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-amber-300 rounded-full"></span>
                Paused
              </span>
            )}
            {environment.status === 'provisioning' && (
              <span className="inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
                Provisioning
              </span>
            )}
            {environment.status === 'deleting' && (
              <span className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-red-300 rounded-full"></span>
                Deleting
              </span>
            )}
          </div>
        </div>

        {/* Cost Banner */}
        {!isDeleted && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-sm mb-1">Estimated Cost</div>
                <div className="text-3xl font-bold">
                  €{isPR ? '0.08' : monthlyCost.toFixed(2)}
                  <span className="text-lg font-normal text-purple-100 ml-2">
                    /{isPR ? '2 hours' : 'month'}
                  </span>
                </div>
              </div>
              {isPR && environment.expiresAt && (
                <div className="text-right">
                  <div className="text-purple-100 text-sm mb-1">Expires In</div>
                  <div className="text-2xl font-bold">
                    {getTimeRemaining()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Actions */}
        {!isDeleted && !isPR && environment.status === 'active' && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onPause}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>⏸️</span>
              <span>Pause</span>
            </button>
            <button
              onClick={onClone}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>📋</span>
              <span>Clone</span>
            </button>
            <button
              onClick={onPromote}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>🚀</span>
              <span>Promote</span>
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        )}

        {!isDeleted && !isPR && environment.status === 'paused' && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onResume}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-900 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>▶️</span>
              <span>Resume</span>
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        )}

        {!isDeleted && isPR && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Environment Information */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Environment Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600 mb-1">Type</div>
              <div className="font-medium text-slate-900">
                {environment.type === 'standard' ? 'Standard' : 'Pull Request'}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Status</div>
              <div className="font-medium text-slate-900 capitalize">{environment.status}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Created</div>
              <div className="font-medium text-slate-900">{formatDate(environment.createdAt)}</div>
            </div>
            {isPR && environment.expiresAt && (
              <div>
                <div className="text-sm text-slate-600 mb-1">Expires</div>
                <div className="font-medium text-slate-900">{formatDate(environment.expiresAt)}</div>
              </div>
            )}
          </div>
        </div>

        {/* PR Metadata */}
        {isPR && environment.prSource && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Pull Request Details</h3>
            <div className="space-y-3 bg-blue-50 rounded-lg p-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Repository</div>
                <div className="font-medium text-slate-900">{environment.prSource.repository}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">PR Title</div>
                <div className="font-medium text-slate-900">{environment.prSource.prTitle}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Branch</div>
                  <div className="font-mono text-sm text-slate-900 bg-white px-2 py-1 rounded">{environment.prSource.branchName}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Commit</div>
                  <div className="font-mono text-sm text-slate-900 bg-white px-2 py-1 rounded">{environment.prSource.commitSha.substring(0, 7)}</div>
                </div>
              </div>
              {environment.serviceOverride && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">Override</div>
                  <div className="font-medium text-slate-900">
                    Container <code className="bg-white px-2 py-0.5 rounded text-sm">{environment.serviceOverride.serviceName}</code> using custom image
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources Summary */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Resources</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <span className="font-medium text-slate-900">Containers</span>
              </div>
              <span className="text-slate-600">{environment.containers.length}</span>
            </div>
            
            {environment.database && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💾</span>
                  <span className="font-medium text-slate-900">Database</span>
                </div>
                <span className="text-slate-600">
                  {environment.database.engine === 'postgres' ? 'PostgreSQL' : environment.database.engine} • {environment.database.storage}
                </span>
              </div>
            )}
            
            {environment.cache && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-medium text-slate-900">Cache</span>
                </div>
                <span className="text-slate-600">
                  {environment.cache.engine === 'redis' ? 'Redis' : environment.cache.engine} • {environment.cache.memory}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <div className="font-medium text-blue-900 mb-1">
                {environment.type === 'standard' ? 'Edit Resources' : 'View Only'}
              </div>
              <div className="text-sm text-blue-700">
                {environment.type === 'standard' 
                  ? 'Click on a resource in the sidebar to edit its configuration.'
                  : 'PR environments are read-only. To edit configuration, update the unhazzle.yaml manifest.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
