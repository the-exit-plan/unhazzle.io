'use client';

import { useState } from 'react';

interface PauseApplicationModalProps {
  applicationName: string;
  onClose: () => void;
  onConfirm: (schedule?: string) => void;
}

export default function PauseApplicationModal({ applicationName, onClose, onConfirm }: PauseApplicationModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏸️</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pause Application</h2>
              <p className="text-slate-600 mt-1">
                Stop <span className="font-semibold">{applicationName}</span> to save resources.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-900">
              This will scale the application to 0 replicas. It will not be accessible until resumed.
            </div>
          </div>

          {/* Schedule Option */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useScheduleApp"
                checked={useSchedule}
                onChange={(e) => setUseSchedule(e.target.checked)}
                className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="useScheduleApp" className="text-sm font-medium text-slate-900">
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
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPausing}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePause}
            disabled={isPausing}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isPausing ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Pausing...</span>
              </>
            ) : (
              <>
                <span>⏸️</span>
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
