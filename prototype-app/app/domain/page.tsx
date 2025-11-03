'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';

export default function DomainSetup() {
  const router = useRouter();
  const { state, updateDomain } = useDeployment();
  
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [defaultSubdomain, setDefaultSubdomain] = useState('');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect if no resources configured
  useEffect(() => {
    if (!state.resources) {
      router.push('/');
      return;
    }

    // Generate default subdomain from app name
    const appName = state.application?.imageUrl.split('/').pop()?.split(':')[0] || 'app';
    const cleanName = appName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    setDefaultSubdomain(`${cleanName}-${Math.random().toString(36).substring(2, 6)}.unhazzle.app`);
  }, [state.resources, state.application, router]);

  const handleContinue = () => {
    // Save domain configuration
    updateDomain({
      defaultSubdomain,
      customDomain: useCustomDomain ? customDomain : undefined,
      dnsInstructions: useCustomDomain ? getDnsInstructions() : undefined
    });

    router.push('/review');
  };

  const getDnsInstructions = () => {
    return `Add these DNS records to your domain provider:
    
CNAME ${customDomain} → ${defaultSubdomain}
TXT _acme-challenge.${customDomain} → [Will be provided after deployment]`;
  };

  if (!state.resources) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>🌐</span>
            <span>Your app will be accessible worldwide</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Domain Configuration
          </h1>
          <p className="text-lg text-slate-600">
            Choose how users will access your application
          </p>
        </div>

        {/* Default Domain */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center text-white text-xl">
                ✓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Default unhazzle Domain</h2>
                <p className="text-sm text-slate-600">Free subdomain, ready instantly</p>
              </div>
            </div>
            <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
              INCLUDED
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-600 font-medium">Your application URL:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-semibold">HTTPS</span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-semibold">AUTO SSL</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <code className="flex-1 text-xl font-bold text-slate-900 bg-white px-4 py-3 rounded-lg border border-green-200">
                https://{defaultSubdomain}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(`https://${defaultSubdomain}`)}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                📋 Copy
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>🔒</span>
              <span>SSL certificate auto-provisioned via Let&apos;s Encrypt</span>
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-green-600">✓</span>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-green-600">✓</span>
              <span>Global CDN</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-green-600">✓</span>
              <span>DDoS protection</span>
            </div>
          </div>
        </div>

        {/* Custom Domain Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                🎯
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Custom Domain</h2>
                <p className="text-sm text-slate-600">Use your own domain name (optional)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomDomain}
                onChange={(e) => setUseCustomDomain(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {useCustomDomain && (
            <div className="space-y-6 pt-6 border-t border-slate-200">
              {/* Domain Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Your Domain
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                  placeholder="www.your-store.com or your-store.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 You can use the root domain or a subdomain (e.g., app.yourdomain.com)
                </p>
              </div>

              {/* DNS Instructions */}
              {customDomain && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <span>📋</span>
                    <span>DNS Configuration Required</span>
                  </h3>
                  <p className="text-sm text-blue-800 mb-4">
                    After deployment, add this CNAME record to your DNS provider:
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
                    <div className="grid grid-cols-3 gap-4 text-xs font-mono mb-2">
                      <div>
                        <span className="text-slate-500 block mb-1">Type</span>
                        <span className="font-bold text-slate-900">CNAME</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Name</span>
                        <span className="font-bold text-slate-900">{customDomain.startsWith('www.') ? 'www' : '@'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Value</span>
                        <span className="font-bold text-slate-900">{defaultSubdomain}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-blue-800">
                    <p>• <strong>Propagation time:</strong> DNS changes typically take 5-30 minutes</p>
                    <p>• <strong>SSL certificate:</strong> Automatically issued once DNS is verified</p>
                    <p>• <strong>Need help?</strong> We&apos;ll show these instructions again in your dashboard</p>
                  </div>
                </div>
              )}

              {/* Common DNS Providers */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Popular DNS providers:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Cloudflare', 'Namecheap', 'GoDaddy', 'Google Domains', 'Route 53', 'Vercel DNS'].map(provider => (
                    <span key={provider} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-700">
                      {provider}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-100">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>Domain best practices:</span>
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span><strong>Start with default:</strong> Use the unhazzle domain while building, add custom domain later</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span><strong>Change anytime:</strong> You can add, update, or remove custom domains without redeployment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span><strong>Multiple domains:</strong> After launch, point multiple domains to the same app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span><strong>Automatic HTTPS:</strong> All domains get free SSL certificates with auto-renewal</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={useCustomDomain && !customDomain.trim()}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span>Continue to Review & Deploy</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
