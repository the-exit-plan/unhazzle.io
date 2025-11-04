'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';

// Mock GitHub Container Registry images
const MOCK_GHCR_IMAGES = [
  {
    name: 'acme/ecommerce-shop',
    tag: 'v2.1.0',
    size: '324 MB',
    lastUpdated: '2024-10-28T14:30:00Z',
    description: 'Main e-commerce application with Next.js frontend'
  },
  {
    name: 'acme/api-gateway',
    tag: 'v1.5.2',
    size: '156 MB',
    lastUpdated: '2024-10-25T09:15:00Z',
    description: 'GraphQL API gateway service'
  },
  {
    name: 'acme/payment-processor',
    tag: 'v3.0.1',
    size: '89 MB',
    lastUpdated: '2024-10-30T16:45:00Z',
    description: 'Payment processing microservice'
  },
  {
    name: 'acme/notification-service',
    tag: 'v2.3.0',
    size: '112 MB',
    lastUpdated: '2024-10-29T11:20:00Z',
    description: 'Email and SMS notification handler'
  },
  {
    name: 'acme/background-worker',
    tag: 'v1.8.4',
    size: '78 MB',
    lastUpdated: '2024-10-27T13:10:00Z',
    description: 'Background job processing worker'
  }
];

interface PublicImageInput {
  url: string;
  customName: string;
}

export default function ApplicationSetup() {
  const router = useRouter();
  const { state, updateApplication, addContainer } = useDeployment();
  
  // GitHub PAT
  const [githubPAT, setGithubPAT] = useState('');
  const [patSaved, setPatSaved] = useState(false);
  
  // Private images (GitHub)
  const [selectedPrivateImages, setSelectedPrivateImages] = useState<string[]>([]);
  const [privateImageNames, setPrivateImageNames] = useState<Record<string, string>>({});
  
  // Public images
  const [publicImages, setPublicImages] = useState<PublicImageInput[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Load PAT from localStorage on mount
  useEffect(() => {
    const savedPAT = localStorage.getItem('github_pat');
    if (savedPAT) {
      setGithubPAT(savedPAT);
      setPatSaved(true);
    }
  }, []);

  const handleSavePAT = () => {
    if (!githubPAT.trim()) {
      alert('Please enter a GitHub Personal Access Token');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('github_pat', githubPAT);
    setPatSaved(true);
  };

  const handleClearPAT = () => {
    localStorage.removeItem('github_pat');
    setGithubPAT('');
    setPatSaved(false);
  };

  const togglePrivateImage = (imageName: string) => {
    const totalSelected = selectedPrivateImages.length + publicImages.filter(p => p.url.trim()).length;
    
    if (selectedPrivateImages.includes(imageName)) {
      // Deselect
      setSelectedPrivateImages(selectedPrivateImages.filter(img => img !== imageName));
      const newNames = { ...privateImageNames };
      delete newNames[imageName];
      setPrivateImageNames(newNames);
    } else {
      // Select
      if (totalSelected >= 5) {
        alert('Maximum 5 containers allowed');
        return;
      }
      setSelectedPrivateImages([...selectedPrivateImages, imageName]);
      // Auto-generate name
      const autoName = imageName.split('/').pop()?.split(':')[0] || 'app';
      setPrivateImageNames({
        ...privateImageNames,
        [imageName]: autoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      });
    }
  };

  const updatePrivateImageName = (imageName: string, newName: string) => {
    setPrivateImageNames({
      ...privateImageNames,
      [imageName]: newName
    });
  };

  const addPublicImageInput = () => {
    const totalSelected = selectedPrivateImages.length + publicImages.filter(p => p.url.trim()).length;
    if (totalSelected >= 5) {
      alert('Maximum 5 containers allowed');
      return;
    }
    setPublicImages([...publicImages, { url: '', customName: '' }]);
  };

  const removePublicImageInput = (index: number) => {
    setPublicImages(publicImages.filter((_, i) => i !== index));
  };

  const updatePublicImage = (index: number, field: 'url' | 'customName', value: string) => {
    const updated = [...publicImages];
    updated[index][field] = value;
    setPublicImages(updated);
  };

  const handleContinue = () => {
    const totalContainers = selectedPrivateImages.length + publicImages.filter(p => p.url.trim()).length;
    
    if (totalContainers === 0) {
      alert('Please select at least one application image');
      return;
    }

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      // Clear existing containers
      // Note: We'll need to add clearContainers to context, for now we'll just add
      
      // Add private images from GitHub
      selectedPrivateImages.forEach((imageName, index) => {
        const imageData = MOCK_GHCR_IMAGES.find(img => `${img.name}:${img.tag}` === imageName);
        const fullImageUrl = `ghcr.io/${imageName}`;
        const containerName = privateImageNames[imageName] || `app-${index + 1}`;
        
        addContainer({
          id: `container-${Date.now()}-${index}`,
          name: containerName,
          imageUrl: fullImageUrl,
          registryToken: githubPAT,
          port: 3000,
          healthCheck: {
            protocol: 'HTTP',
            port: 3000,
            path: '/health',
            interval: '30s',
            timeout: '5s',
            retries: 3
          },
          exposure: 'public',
          resources: {
            cpu: '1 vCPU',
            memory: '2GB',
            replicas: { min: 2, max: 10 }
          },
          serviceAccess: {
            database: state.resources?.database ? true : false,
            cache: state.resources?.cache ? true : false
          },
          environmentVariables: []
        });
      });

      // Add public images
      publicImages
        .filter(p => p.url.trim())
        .forEach((pubImage, index) => {
          const containerName = pubImage.customName.trim() || 
            pubImage.url.split('/').pop()?.split(':')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 
            `public-app-${index + 1}`;
          
          addContainer({
            id: `container-public-${Date.now()}-${index}`,
            name: containerName,
            imageUrl: pubImage.url,
            port: 3000,
            healthCheck: {
              protocol: 'HTTP',
              port: 3000,
              path: '/health',
              interval: '30s',
              timeout: '5s',
              retries: 3
            },
            exposure: 'public',
            resources: {
              cpu: '1 vCPU',
              memory: '2GB',
              replicas: { min: 2, max: 10 }
            },
            serviceAccess: {
              database: state.resources?.database ? true : false,
              cache: state.resources?.cache ? true : false
            },
            environmentVariables: []
          });
        });

      // Save first container to legacy application field for backward compatibility
      const firstImage = selectedPrivateImages[0] || publicImages.find(p => p.url.trim())?.url;
      if (firstImage) {
        updateApplication({
          imageUrl: selectedPrivateImages[0] ? `ghcr.io/${selectedPrivateImages[0]}` : publicImages[0].url,
          registryToken: selectedPrivateImages[0] ? githubPAT : undefined,
          port: 3000,
          healthCheck: '/health'
        });
      }

      setIsProcessing(false);
      router.push('/resources');
    }, 1500);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const totalSelected = selectedPrivateImages.length + publicImages.filter(p => p.url.trim()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
            Select Your Application Images
          </h1>
          <p className="text-lg text-slate-600">
            Choose from private GitHub images or add public registry URLs (up to 5 applications)
          </p>
          {totalSelected > 0 && (
            <p className="text-sm text-purple-600 font-medium mt-2">
              {totalSelected} of 5 applications selected
            </p>
          )}
        </div>

        {/* Section 1: Private GitHub Images */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">🔒</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Private GitHub Container Registry</h2>
              <p className="text-sm text-slate-600">Access your private images from ghcr.io</p>
            </div>
          </div>

          {/* GitHub PAT Input */}
          {!patSaved ? (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                GitHub Personal Access Token (PAT) *
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={githubPAT}
                  onChange={(e) => setGithubPAT(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                />
                <button
                  onClick={handleSavePAT}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
                >
                  Connect
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">
                  � How to generate a GitHub PAT:
                </h4>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal ml-4">
                  <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                  <li>Click "Generate new token (classic)"</li>
                  <li>Select scope: <strong>read:packages</strong></li>
                  <li>Copy the token and paste it above</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              {/* PAT Saved - Show Images */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <p className="font-semibold text-green-900">Connected to GitHub</p>
                    <p className="text-xs text-green-700">Token saved (ghp...{githubPAT.slice(-4)})</p>
                  </div>
                </div>
                <button
                  onClick={handleClearPAT}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect
                </button>
              </div>

              {/* Image List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Select images to deploy ({selectedPrivateImages.length} selected):
                </h3>
                {MOCK_GHCR_IMAGES.map((image) => {
                  const imageName = `${image.name}:${image.tag}`;
                  const isSelected = selectedPrivateImages.includes(imageName);
                  
                  return (
                    <div
                      key={imageName}
                      className={`p-4 border-2 rounded-lg transition cursor-pointer ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      onClick={() => togglePrivateImage(imageName)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePrivateImage(imageName)}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-mono text-sm font-semibold text-slate-900">
                                ghcr.io/{imageName}
                              </h4>
                              <p className="text-xs text-slate-600 mt-1">{image.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs text-slate-500">{image.size}</div>
                              <div className="text-xs text-slate-400">{formatDate(image.lastUpdated)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Section 2: Public Registry Images */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">🌍</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Public Registries</h2>
              <p className="text-sm text-slate-600">Add images from Docker Hub, public registries, etc.</p>
            </div>
          </div>

          {publicImages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No public images added yet</p>
              <button
                onClick={addPublicImageInput}
                disabled={totalSelected >= 5}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>+</span>
                <span>Add Public Image</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {publicImages.map((pubImage, index) => (
                <div key={index} className="p-4 border-2 border-slate-200 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Image URL *
                      </label>
                      <input
                        type="text"
                        value={pubImage.url}
                        onChange={(e) => updatePublicImage(index, 'url', e.target.value)}
                        placeholder="e.g., nginx:latest, docker.io/library/redis:7"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removePublicImageInput(index)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addPublicImageInput}
                disabled={totalSelected >= 5}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Another Public Image
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-100">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>�</span>
            <span>Next Steps:</span>
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">→</span>
              <span>Configure resources (CPU, memory, replicas) for each application</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">→</span>
              <span>Set environment variables per application</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">→</span>
              <span>Configure health checks and service access</span>
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
            disabled={isProcessing || totalSelected === 0}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing {totalSelected} application{totalSelected > 1 ? 's' : ''}...</span>
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
