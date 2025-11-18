'use client';

import { useRouter } from 'next/navigation';

export default function DemoBanner() {
  const router = useRouter();

  const handleReset = () => {
    if (confirm('Are you sure you want to clear all data and reset the demo?')) {
      localStorage.clear();
      window.location.href = '/unhazzle.io/demo';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 px-4 flex items-center justify-center gap-4 text-sm font-medium z-50 shadow-lg">
      <div className="flex items-center">
        <span className="mr-2">🎬</span>
        <strong>Demo Mode:</strong>&nbsp;Experience unhazzle with a sample e-commerce application
      </div>
      <button
        onClick={handleReset}
        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition border border-white/30"
        title="Clear local storage and restart"
      >
        Reset Demo
      </button>
    </div>
  );
}
