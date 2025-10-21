'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';

export default function SignIn() {
  const [name, setName] = useState('');
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const router = useRouter();
  const { updateUser } = useDeployment();

  const handleStartBuilding = () => {
    if (!name.trim()) {
      alert('Please enter your name to continue');
      return;
    }
    setShowGitHubModal(true);
  };

  const handleGitHubAuth = () => {
    // Simulate GitHub OAuth (identity only)
    const githubUsername = name.toLowerCase().replace(/\s+/g, '-');
    
    updateUser({
      name,
      githubUsername,
    });

    // Simulate OAuth delay
    setTimeout(() => {
      router.push('/questionnaire');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              unhazzle
            </h1>
            <p className="text-slate-600 mt-2 text-lg">Infrastructure without the hassle</p>
          </div>

          {/* Value Prop */}
          <div className="mb-8 text-center">
            <p className="text-slate-700 leading-relaxed">
              Deploy production-grade infrastructure in minutes. Answer 4 questions, 
              we&apos;ll configure everything else automatically.
            </p>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              onKeyPress={(e) => e.key === 'Enter' && handleStartBuilding()}
            />
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStartBuilding}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Building →
          </button>

          {/* Terms */}
          <p className="text-center text-xs text-slate-500 mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-purple-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
          </p>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              🇪🇺 European infrastructure • GDPR compliant by default
            </p>
          </div>
        </div>
      </div>

      {/* GitHub OAuth Modal */}
      {showGitHubModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 text-center">
              <h2 className="text-xl font-semibold mb-1">Authorize unhazzle</h2>
              <p className="text-slate-400 text-sm">Connect your GitHub account</p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* App Info */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                  U
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">unhazzle</h3>
                  <p className="text-sm text-slate-600">Infrastructure without the hassle</p>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-slate-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-sm text-slate-900 mb-3">This will allow unhazzle to:</h4>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong>Read</strong> your public profile information</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong>Verify</strong> your identity</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">✗</span>
                    <span className="text-slate-500"><strong>No repository access</strong> required</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGitHubModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGitHubAuth}
                  className="flex-1 px-4 py-3 bg-[#24292e] text-white rounded-lg font-medium hover:bg-[#1b1f23] transition flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
