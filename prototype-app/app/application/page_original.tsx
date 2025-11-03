'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment, ContainerConfig } from '@/lib/context/DeploymentContext';

export default function ApplicationSetup() {
  const router = useRouter();
  const { state, addContainer, updateContainer, removeContainer } = useDeployment();
  
  const [containers, setContainers] = useState<Array<{
    id: string;
    name: string;
    imageUrl: string;
    needsAuth: boolean;
    registryUsername: string;
    registryToken: string;
  }>>([{
    id: '1',
    name: 'frontend',
    imageUrl: 'ghcr.io/acme/ecommerce-shop:v2.1.0',
    needsAuth: true,
    registryUsername: '',
    registryToken: ''
  }]);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Load existing containers from state on mount
  useEffect(() => {
    if (state.containers.length > 0) {
      setContainers(state.containers.map(c => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        needsAuth: !c.imageUrl.startsWith('docker.io/') && !c.imageUrl.startsWith('public.ecr.aws/'),
        registryUsername: c.registryUsername || '',
        registryToken: c.registryToken || ''
      })));
    }
  }, []);

  const addNewContainer = () => {
    if (containers.length >= 5) {
      alert('Maximum 5 containers per project');
      return;
    }
    setContainers([...containers, {
      id: Date.now().toString(),
      name: '',
      imageUrl: '',
      needsAuth: true,
      registryUsername: '',
      registryToken: ''
    }]);
  };

  const updateContainerField = (id: string, field: string, value: string | boolean) => {
    setContainers(containers.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        // Auto-detect registry type when imageUrl changes
        if (field === 'imageUrl' && typeof value === 'string') {
          updated.needsAuth = !value.startsWith('docker.io/') && !value.startsWith('public.ecr.aws/');
        }
        return updated;
      }
      return c;
    }));
  };

  const removeContainerAtIndex = (id: string) => {
    if (containers.length === 1) {
      alert('At least one container is required');
      return;
    }
    setContainers(containers.filter(c => c.id !== id));
  };

  const handleContinue = () => {
    // Validate all containers
    for (const container of containers) {
      if (!container.imageUrl.trim()) {
        alert(`Please enter a container image URL for ${container.name || 'container'}`);
        return;
      }
      if (!container.name.trim()) {
        alert(`Please enter a name for the container with image ${container.imageUrl}`);
        return;
      }
      if (container.needsAuth && !container.registryToken.trim()) {
        alert(`Please provide a registry token for ${container.name}`);
        return;
      }
    }

    // Check for duplicate names
    const names = containers.map(c => c.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      alert('Container names must be unique');
      return;
    }

    // Show detecting state
    setIsDetecting(true);

    // Simulate detection delay
    setTimeout(() => {
      setIsDetecting(false);
      
      // Clear existing containers and add new ones
      state.containers.forEach(c => removeContainer(c.id));
      
      // Save each container to context
      containers.forEach(container => {
        const containerConfig: ContainerConfig = {
          id: container.id,
          name: container.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          imageUrl: container.imageUrl,
          registryUsername: container.registryUsername || undefined,
          registryToken: container.registryToken || undefined,
          port: 3000, // Will be detected
          healthCheck: {
            protocol: 'HTTP',
            port: 3000,
            path: '/health',
            interval: '30s',
            timeout: '5s',
            retries: 3
          },
          exposure: 'public', // Default, will be configured in resources
          resources: {
            cpu: '1 vCPU',
            memory: '2GB',
            replicas: { min: 2, max: 10 }
          },
          serviceAccess: {
            database: false,
            cache: false
          },
          environmentVariables: []
        };
        addContainer(containerConfig);
      });

      // Navigate to resources
      router.push('/resources');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">✓</div>
            <div className="text-xs text-slate-500 ml-2">Sign In</div>
          </div>
          <div className="w-12 h-0.5 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">✓</div>
            <div className="text-xs text-slate-500 ml-2">Questions</div>
          </div>
          <div className="w-12 h-0.5 bg-purple-500"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">3</div>
            <div className="text-xs text-slate-700 ml-2 font-medium">Application</div>
          </div>
          <div className="w-12 h-0.5 bg-slate-200"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm font-bold">4</div>
            <div className="text-xs text-slate-400 ml-2">Resources</div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Add Your Application
          </h1>
          <p className="text-lg text-slate-600">
            Enter your container image URL. We&apos;ll auto-detect port and health check.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Container Image URL */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Container Image URL *
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="e.g., ghcr.io/your-org/app:v1.0.0"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              💡 Supported: Docker Hub, GitHub Container Registry (ghcr.io), Google Container Registry (gcr.io), AWS ECR
            </p>
          </div>

          {/* Registry Detection */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {needsAuth ? '🔒' : '🌍'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  {needsAuth ? 'Private Registry Detected' : 'Public Registry Detected'}
                </h3>
                <p className="text-sm text-slate-600">
                  {needsAuth 
                    ? 'This appears to be a private registry. Please provide authentication credentials below.'
                    : 'This looks like a public registry. No authentication required!'}
                </p>
              </div>
            </div>
          </div>

          {/* Registry Credentials (Conditional) */}
          {needsAuth && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Registry Authentication
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={registryUsername}
                    onChange={(e) => setRegistryUsername(e.target.value)}
                    placeholder="registry-username"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Some registries use email or username
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Access Token / Password *
                  </label>
                  <input
                    type="password"
                    value={registryToken}
                    onChange={(e) => setRegistryToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or password"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    🔐 Securely encrypted and never logged
                  </p>
                </div>

                {/* Help Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">
                    📖 How to generate tokens:
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>GitHub (ghcr.io):</strong> Settings → Developer settings → Personal access tokens → Generate with read:packages scope</li>
                    <li>• <strong>Docker Hub:</strong> Account Settings → Security → New Access Token</li>
                    <li>• <strong>AWS ECR:</strong> Use AWS CLI: aws ecr get-login-password</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auto-Detection Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-100">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>🔍</span>
            <span>What we&apos;ll auto-detect from your image:</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600">🔌</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Exposed Port</p>
                <p className="text-xs text-slate-600">From Dockerfile EXPOSE directive</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600">❤️</span>
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Health Check</p>
                <p className="text-xs text-slate-600">From Dockerfile HEALTHCHECK or default /health</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Don&apos;t worry - you can override these in the next step if needed
          </p>
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
            disabled={isDetecting}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isDetecting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Detecting image metadata...</span>
              </>
            ) : (
              <>
                <span>Continue to Resources</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
