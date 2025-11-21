'use client';

import { useState } from 'react';
import { Environment } from '@/lib/context/DeploymentContext';

interface PromoteApplicationModalProps {
  application: { id: string; name: string; envId: string };
  availableTargets: Environment[];
  onClose: () => void;
  onConfirm: (targetEnvId: string) => void;
}

export default function PromoteApplicationModal({ application, availableTargets, onClose, onConfirm }: PromoteApplicationModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>(availableTargets[0]?.id || '');
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = () => {
    if (!selectedTarget) return;
    setIsPromoting(true);
    setTimeout(() => {
      onConfirm(selectedTarget);
      setIsPromoting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Promote Application</h2>
          <p className="text-slate-600 mt-1">
            Promote <span className="font-semibold">{application.name}</span> to another environment.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Environment
            </label>
            {availableTargets.length === 0 ? (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                No other environments available. Create a new environment first.
              </div>
            ) : (
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {availableTargets.map(env => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({env.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="flex-1 text-sm text-blue-900">
                This will copy the application configuration (image, resources, env vars) to the target environment.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPromoting}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePromote}
            disabled={isPromoting || !selectedTarget}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isPromoting ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Promoting...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Promote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
