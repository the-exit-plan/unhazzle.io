'use client';

import { Environment } from '@/lib/context/DeploymentContext';
import { useState } from 'react';

// Clone Environment Modal
interface CloneModalProps {
  sourceEnvironment: Environment;
  onClose: () => void;
  onConfirm: (newName: string, autoDeploy: boolean) => void;
}

export function CloneModal({ sourceEnvironment, onClose, onConfirm }: CloneModalProps) {
  const [newName, setNewName] = useState(`${sourceEnvironment.name}-copy`);
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = () => {
    if (!newName.trim()) return;
    setIsCloning(true);
    setTimeout(() => {
      onConfirm(newName.trim(), autoDeploy);
      setIsCloning(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Clone Environment</h2>
          <p className="text-slate-600 mt-1">Create a copy of this environment's configuration</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Source */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Source Environment</div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="font-semibold text-slate-900">{sourceEnvironment.name}</div>
              <div className="text-sm text-slate-600 mt-1">{sourceEnvironment.baseDomain}</div>
            </div>
          </div>

          {/* New Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Environment Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="staging"
              autoFocus
            />
            <div className="text-xs text-slate-500 mt-1">
              Lowercase letters, numbers, and hyphens only. 3-63 characters.
            </div>
          </div>

          {/* Auto Deploy Option */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              id="autoDeploy"
              checked={autoDeploy}
              onChange={(e) => setAutoDeploy(e.target.checked)}
              className="mt-1 h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
            <div>
              <label htmlFor="autoDeploy" className="text-sm font-medium text-slate-900 block">
                Auto-deploy after cloning
              </label>
              <p className="text-xs text-slate-600 mt-1">
                If checked, the new environment will be deployed immediately. Otherwise, it will be created in a 'provisioning' state waiting for deployment.
              </p>
            </div>
          </div>

          {/* What will be cloned */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-3">What will be cloned:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-green-600">✓</span>
                <span>{sourceEnvironment.applications.length} application{sourceEnvironment.applications.length !== 1 ? 's' : ''} (configuration only)</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-green-600">✓</span>
                <span>Environment variables</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="flex-1 text-sm text-blue-900">
                <strong>Note:</strong> Only configuration is cloned. Runtime data, logs, and metrics are not copied.
              </div>
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-medium text-slate-700 mb-1">Estimated Monthly Cost</div>
            <div className="text-2xl font-bold text-slate-900">€169<span className="text-lg font-normal text-slate-600">/month</span></div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCloning}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={isCloning || !newName.trim()}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isCloning ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Cloning...</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Clone Environment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}





// Pause Environment Modal
interface PauseModalProps {
  environment: Environment;
  onClose: () => void;
  onConfirm: (schedule?: string) => void;
}

export function PauseModal({ environment, onClose, onConfirm }: PauseModalProps) {
  const [isPausing, setIsPausing] = useState(false);
  const [schedule, setSchedule] = useState('');
  const [useSchedule, setUseSchedule] = useState(false);

  const handlePause = () => {
    setIsPausing(true);
    setTimeout(() => {
      onConfirm(useSchedule ? schedule : undefined);
      setIsPausing(false);
    }, 1000);
  };

  // Calculate cost savings (full environment cost becomes $0)
  const calculateMonthlySavings = () => {
    // Simplified calculation - in reality would sum all resources
    return 169; // Example monthly cost
  };

  const monthlySavings = calculateMonthlySavings();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏸️</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Pause Environment</h2>
              <p className="text-slate-600 mt-1">
                Temporarily stop "{environment.name}" to save costs
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* What happens */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-3">When paused, this environment will:</div>
            <div className="space-y-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-lg">📦</span>
                <div>
                  <strong>Applications:</strong> Scale all replicas to 0 (no running instances)
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-lg">🌐</span>
                <div>
                  <strong>Domain:</strong> Will return 503 Service Unavailable
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Option */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useSchedule"
                checked={useSchedule}
                onChange={(e) => setUseSchedule(e.target.checked)}
                className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="useSchedule" className="text-sm font-medium text-slate-900">
                Set Pause Schedule (Cron)
              </label>
            </div>
            
            {useSchedule && (
              <div>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="0 18 * * 1-5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Example: <code>0 18 * * 1-5</code> (Every weekday at 6 PM)
                </p>
              </div>
            )}
          </div>

          {/* Cost Savings Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-green-900">Estimated Monthly Savings</div>
              <span className="text-4xl">💰</span>
            </div>
            <div className="text-4xl font-bold text-green-900">
              €{monthlySavings}
              <span className="text-lg font-normal text-green-700 ml-2">/month</span>
            </div>
            <div className="text-sm text-green-700 mt-2">
              Pay only for persistent storage (~€{(monthlySavings * 0.05).toFixed(2)}/month)
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1">
                <div className="font-medium text-yellow-900 mb-1">Good to know:</div>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Configuration is preserved - you can resume anytime</li>
                  <li>Application data in volumes is safe in persistent storage</li>
                  <li>Environment URLs will be unavailable until resumed</li>
                  <li>Resume takes ~30 seconds to restore services</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPausing}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePause}
            disabled={isPausing}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isPausing ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Pausing...</span>
              </>
            ) : (
              <>
                <span>⏸️</span>
                <span>Pause Environment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Resume Environment Modal
interface ResumeModalProps {
  environment: Environment;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResumeModal({ environment, onClose, onConfirm }: ResumeModalProps) {
  const [isResuming, setIsResuming] = useState(false);

  const handleResume = () => {
    setIsResuming(true);
    setTimeout(() => {
      onConfirm();
      setIsResuming(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">▶️</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Resume Environment</h2>
              <p className="text-slate-600 mt-1">
                Restore "{environment.name}" to active state
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* What will happen */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-3">Resuming will:</div>
            <div className="space-y-2 bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-2 text-sm text-green-900">
                <span className="text-lg">📦</span>
                <div>
                  <strong>Applications:</strong> Scale replicas back to configured values
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-green-900">
                <span className="text-lg">🌐</span>
                <div>
                  <strong>Domain:</strong> Will be accessible after ~30 seconds
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-3">Resume Timeline:</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">1</div>
                <div className="flex-1 text-sm text-slate-700">
                  <strong>0-10s:</strong> Provisioning infrastructure
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">2</div>
                <div className="flex-1 text-sm text-slate-700">
                  <strong>10-20s:</strong> Preparing application services
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                <div className="flex-1 text-sm text-slate-700">
                  <strong>20-30s:</strong> Deploying applications
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">✓</div>
                <div className="flex-1 text-sm font-medium text-green-700">
                  Environment ready!
                </div>
              </div>
            </div>
          </div>

          {/* Cost Impact */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-1">Cost Impact</div>
            <div className="text-2xl font-bold text-slate-900">
              €169<span className="text-lg font-normal text-slate-600">/month</span>
            </div>
            <div className="text-sm text-slate-600 mt-1">
              Billing resumes immediately upon starting services
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isResuming}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResume}
            disabled={isResuming}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isResuming ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Resuming...</span>
              </>
            ) : (
              <>
                <span>▶️</span>
                <span>Resume Environment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Environment Modal
interface CreateEnvironmentModalProps {
  onClose: () => void;
  onConfirm: (name: string, type: 'prod' | 'non-prod') => void;
}

export function CreateEnvironmentModal({ onClose, onConfirm }: CreateEnvironmentModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'prod' | 'non-prod'>('non-prod');
  const [isCreating, setIsCreating] = useState(false);

  const nameValid = name.length >= 3 && name.length <= 63 && /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$/.test(name);

  const handleCreate = () => {
    if (!nameValid) return;
    setIsCreating(true);
    setTimeout(() => {
      onConfirm(name, type);
      setIsCreating(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Create Environment</h2>
          <p className="text-slate-600 mt-1">Add a new environment to your project</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Environment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="staging"
              autoFocus
            />
            {name && !nameValid && (
              <p className="text-sm text-red-600 mt-1">
                3-63 characters, lowercase alphanumeric + hyphens, start/end with alphanumeric
              </p>
            )}
            <div className="text-xs text-slate-500 mt-1">
              Lowercase letters, numbers, and hyphens only.
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Environment Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setType('non-prod')}
                className={`p-4 border-2 rounded-lg transition text-left ${
                  type === 'non-prod'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900 mb-1">Non-Production</div>
                <div className="text-sm text-slate-600">Development, testing, staging</div>
              </button>
              <button
                onClick={() => setType('prod')}
                className={`p-4 border-2 rounded-lg transition text-left ${
                  type === 'prod'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900 mb-1">Production</div>
                <div className="text-sm text-slate-600">Live, customer-facing</div>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !nameValid}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Create Environment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

