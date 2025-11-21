'use client';

import { Environment } from '@/lib/context/DeploymentContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnvironmentInfoProps {
  environment: Environment;
  onClone?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onAddApplication?: () => void;
}

export default function EnvironmentInfo({ environment, onClone, onPause, onResume, onAddApplication }: EnvironmentInfoProps) {
  const [showActions, setShowActions] = useState(false);
  const router = useRouter();

  // Calculate environment cost
  const calculateEnvCost = () => {
    if (environment.applications.length === 0) return 0;

    let total = 0;
    
    // Application costs - simplified calculation
    environment.applications.forEach(app => {
      const cpuCores = parseFloat(app.resources.cpu);
      const memoryGB = parseFloat(app.resources.memory);
      const avgReplicas = (app.resources.replicas.min + app.resources.replicas.max) / 2;
      
      // Simplified cost model
      let monthlyPerInstance = 4.99;
      if (cpuCores > 1 || memoryGB > 2) monthlyPerInstance = 5.49;
      if (cpuCores > 2 || memoryGB > 4) monthlyPerInstance = 9.49;
      if (cpuCores > 4 || memoryGB > 8) monthlyPerInstance = 17.49;
      
      const serversNeeded = Math.ceil(avgReplicas / 2);
      total += serversNeeded * monthlyPerInstance;
      
      // Volume cost
      if (app.volume) {
        total += app.volume.sizeGB * 0.044;
      }
    });

    
    // Load balancer + bandwidth estimate
    total += 12; // Load balancer
    total += 10; // Bandwidth estimate
    
    // Apply 30% margin
    total = total * 1.3;
    
    return total;
  };

  const monthlyCost = calculateEnvCost();
  const isPR = environment.type === 'pr';

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
              {environment.publicApplications.length > 0 && (
                <div>
                  {environment.publicApplications.length} public application{environment.publicApplications.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cost Banner */}
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
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Actions */}
        {!isPR && (
          <div className="space-y-3">
            {/* Add Resources Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onAddApplication}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg transition font-medium flex items-center gap-2"
              >
                <span>📦</span>
                <span>Add Application</span>
              </button>
            </div>
            
            {/* Environment Management Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onPause}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition font-medium flex items-center gap-2"
              >
                <span>⏸️</span>
                <span>Pause All Apps</span>
              </button>
              <button
                onClick={onClone}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition font-medium flex items-center gap-2"
              >
                <span>📋</span>
                <span>Clone</span>
              </button>
            </div>
          </div>
        )}

        {/* Environment Information */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Environment Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600 mb-1">Type</div>
              <div className="font-medium text-slate-900">
                {environment.type === 'prod' ? 'Production' : environment.type === 'non-prod' ? 'Non-Production' : environment.type === 'pr' ? 'Pull Request' : 'Standard'}
              </div>
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
                    Application <code className="bg-white px-2 py-0.5 rounded text-sm">{environment.serviceOverride.serviceName}</code> using custom image
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
                <span className="font-medium text-slate-900">Applications</span>
              </div>
              <span className="text-slate-600">{environment.applications.length}</span>
            </div>

          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <div className="font-medium text-blue-900 mb-1">
                {environment.type !== 'pr' ? 'Manage Applications' : 'View Only'}
              </div>
              <div className="text-sm text-blue-700">
                {environment.type !== 'pr'
                  ? 'Click on an application in the sidebar to edit its configuration. Applications can be deployed independently.'
                  : 'PR environments are read-only. To edit configuration, update the unhazzle.yaml manifest.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
