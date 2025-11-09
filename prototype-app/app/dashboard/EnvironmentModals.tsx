'use client';

import { Environment } from '@/lib/context/DeploymentContext';
import { useState } from 'react';

// Clone Environment Modal
interface CloneModalProps {
  sourceEnvironment: Environment;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}

export function CloneModal({ sourceEnvironment, onClose, onConfirm }: CloneModalProps) {
  const [newName, setNewName] = useState(`${sourceEnvironment.name}-copy`);
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = () => {
    if (!newName.trim()) return;
    setIsCloning(true);
    setTimeout(() => {
      onConfirm(newName.trim());
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

          {/* What will be cloned */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-3">What will be cloned:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-green-600">✓</span>
                <span>{sourceEnvironment.containers.length} container{sourceEnvironment.containers.length !== 1 ? 's' : ''} (configuration only)</span>
              </div>
              {sourceEnvironment.database && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-green-600">✓</span>
                  <span>Database ({sourceEnvironment.database.storage})</span>
                </div>
              )}
              {sourceEnvironment.cache && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-green-600">✓</span>
                  <span>Cache ({sourceEnvironment.cache.memory})</span>
                </div>
              )}
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

// Promote Environment Modal
interface PromoteModalProps {
  sourceEnvironment: Environment;
  availableTargets: Environment[];
  onClose: () => void;
  onConfirm: (targetEnvId: string) => void;
}

export function PromoteModal({ sourceEnvironment, availableTargets, onClose, onConfirm }: PromoteModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = () => {
    if (!selectedTarget) return;
    setIsPromoting(true);
    setTimeout(() => {
      onConfirm(selectedTarget);
      setIsPromoting(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Promote Environment</h2>
          <p className="text-slate-600 mt-1">Copy configuration to another environment</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Source */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Source Environment</div>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <div className="font-semibold text-slate-900">{sourceEnvironment.name}</div>
              <div className="text-sm text-slate-600 mt-1">{sourceEnvironment.baseDomain}</div>
            </div>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Environment
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select target environment...</option>
              {availableTargets.map(env => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>

          {/* Changes Preview */}
          {selectedTarget && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-3">Changes to be applied:</div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                <div>
                  <div className="text-sm font-medium text-slate-900 mb-2">Containers:</div>
                  <div className="space-y-1">
                    {sourceEnvironment.containers.map((container, idx) => (
                      <div key={container.id} className="text-sm text-slate-700 pl-4">
                        • {container.name || `Container ${idx + 1}`}: Image will be updated
                      </div>
                    ))}
                  </div>
                </div>

                {sourceEnvironment.database && (
                  <div>
                    <div className="text-sm font-medium text-slate-900 mb-2">Database:</div>
                    <div className="text-sm text-slate-700 pl-4">
                      • Configuration will be updated ({sourceEnvironment.database.storage} storage)
                    </div>
                  </div>
                )}

                {sourceEnvironment.cache && (
                  <div>
                    <div className="text-sm font-medium text-slate-900 mb-2">Cache:</div>
                    <div className="text-sm text-slate-700 pl-4">
                      • Configuration will be updated ({sourceEnvironment.cache.memory})
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <div className="font-medium text-yellow-900 mb-1">Warning</div>
                <div className="text-sm text-yellow-800">
                  This will redeploy the target environment with the source configuration. 
                  The target environment will experience downtime during the update.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPromoting}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePromote}
            disabled={isPromoting || !selectedTarget}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isPromoting ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Promoting...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Promote to {availableTargets.find(e => e.id === selectedTarget)?.name || 'Target'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Environment Modal
interface DeleteModalProps {
  environment: Environment;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ environment, onClose, onConfirm }: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isPR = environment.type === 'pr';
  const requiresConfirmation = !isPR; // Standard envs require typing name
  const canDelete = isPR || confirmText === environment.name;

  const handleDelete = () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      onConfirm();
      setIsDeleting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 bg-red-50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h2 className="text-2xl font-bold text-red-900">Delete Environment</h2>
              <p className="text-red-700 mt-1">
                {isPR ? 'Delete this PR environment?' : `Delete "${environment.name}" environment?`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* What will be deleted */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-3">This will permanently delete:</div>
            <div className="space-y-2 bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 text-sm text-red-900">
                <span>•</span>
                <span>{environment.containers.length} container{environment.containers.length !== 1 ? 's' : ''}</span>
              </div>
              {environment.database && (
                <div className="flex items-center gap-2 text-sm text-red-900">
                  <span>•</span>
                  <span>Database ({environment.database.storage})</span>
                </div>
              )}
              {environment.cache && (
                <div className="flex items-center gap-2 text-sm text-red-900">
                  <span>•</span>
                  <span>Cache ({environment.cache.memory})</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-red-900">
                <span>•</span>
                <span>All environment variables</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-900">
                <span>•</span>
                <span>Persistent volumes (if configured)</span>
              </div>
            </div>
          </div>

          {/* Cost savings */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-1">Cost Savings</div>
            <div className="text-2xl font-bold text-slate-900">
              {isPR ? '€0.08/2 hours' : '€169/month'}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-xl">❌</span>
              <div className="flex-1">
                <div className="font-bold text-red-900 mb-1">This action cannot be undone</div>
                <div className="text-sm text-red-800">
                  All data in this environment will be permanently lost. Make sure you have backups if needed.
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation for standard environments */}
          {requiresConfirmation && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type <code className="bg-slate-100 px-2 py-0.5 rounded text-red-600 font-bold">{environment.name}</code> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder={environment.name}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !canDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:bg-slate-400 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Delete Environment</span>
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
  onConfirm: () => void;
}

export function PauseModal({ environment, onClose, onConfirm }: PauseModalProps) {
  const [isPausing, setIsPausing] = useState(false);

  const handlePause = () => {
    setIsPausing(true);
    setTimeout(() => {
      onConfirm();
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
                  <strong>Containers:</strong> Scale all replicas to 0 (no running instances)
                </div>
              </div>
              {environment.database && (
                <div className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-lg">💾</span>
                  <div>
                    <strong>Database:</strong> Stop compute instances (data preserved in storage)
                  </div>
                </div>
              )}
              {environment.cache && (
                <div className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-lg">⚡</span>
                  <div>
                    <strong>Cache:</strong> Stop cache service (data will be lost)
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-lg">🌐</span>
                <div>
                  <strong>Domain:</strong> Will return 503 Service Unavailable
                </div>
              </div>
            </div>
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
                  <li>Database data is safe in persistent storage</li>
                  <li>Cache data will be cleared when paused</li>
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
                  <strong>Containers:</strong> Scale replicas back to configured values
                </div>
              </div>
              {environment.database && (
                <div className="flex items-start gap-2 text-sm text-green-900">
                  <span className="text-lg">💾</span>
                  <div>
                    <strong>Database:</strong> Start compute instances (data restored from storage)
                  </div>
                </div>
              )}
              {environment.cache && (
                <div className="flex items-start gap-2 text-sm text-green-900">
                  <span className="text-lg">⚡</span>
                  <div>
                    <strong>Cache:</strong> Start cache service (empty, will warm up gradually)
                  </div>
                </div>
              )}
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
                  <strong>10-20s:</strong> Starting database and cache services
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                <div className="flex-1 text-sm text-slate-700">
                  <strong>20-30s:</strong> Deploying containers
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

