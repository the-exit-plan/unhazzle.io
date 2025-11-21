'use client';

interface DeleteApplicationModalProps {
  applicationName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteApplicationModal({ applicationName, onClose, onConfirm }: DeleteApplicationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🗑️</div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Remove Application</h2>
              <p className="text-red-100 text-sm">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-slate-900">
              Are you sure you want to remove the application <span className="font-semibold text-red-700">"{applicationName}"</span>?
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <div className="font-medium text-amber-900 mb-1 text-sm">Warning</div>
                <div className="text-xs text-amber-700 space-y-1">
                  <div>• All application configurations will be lost</div>
                  <div>• Environment variables will be removed</div>
                  <div>• This change takes effect immediately in demo mode</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex items-center justify-between bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition shadow-lg"
          >
            Remove Application
          </button>
        </div>
      </div>
    </div>
  );
}
