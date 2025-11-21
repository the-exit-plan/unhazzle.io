'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImageInfo {
  name: string;
  tag: string;
  size?: string;
  lastUpdated?: string;
  description?: string;
}

interface AddApplicationModalProps {
  onClose: () => void;
  onAdd: (appData: {
    name: string;
    imageUrl: string;
    exposure: 'public' | 'private';
  }) => void;
  availableImages?: ImageInfo[];
  githubPAT?: string;
}

export default function AddApplicationModal({ onClose, onAdd, availableImages = [], githubPAT }: AddApplicationModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceType, setSourceType] = useState<'public' | 'github'>(githubPAT ? 'github' : 'public');
  const [errors, setErrors] = useState<{ name?: string; imageUrl?: string }>({});

  const validateName = (value: string): string | undefined => {
    if (!value) return 'Application name is required';
    if (value.length < 3 || value.length > 63) return 'Name must be 3-63 characters';
    if (!/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(value)) {
      return 'Name must be lowercase alphanumeric with hyphens, start and end with alphanumeric';
    }
    return undefined;
  };

  const validateImageUrl = (value: string): string | undefined => {
    if (!value) return 'Image URL is required';
    // Basic validation - should look like a Docker image reference
    if (!/^[a-z0-9\.\-\/]+:[a-z0-9\.\-]+$/i.test(value)) {
      return 'Image URL must be in format: registry/image:tag or image:tag';
    }
    return undefined;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const error = validateName(value);
    setErrors(prev => ({ ...prev, name: error }));
  };

  const handleImageUrlChange = (value: string) => {
    setImageUrl(value);
    const error = validateImageUrl(value);
    setErrors(prev => ({ ...prev, imageUrl: error }));

    // Auto-fill name if empty and value matches a known image
    if (!name && availableImages.length > 0) {
      const matchedImage = availableImages.find(img => 
        `ghcr.io/${img.name}:${img.tag}` === value || 
        `${img.name}:${img.tag}` === value
      );
      
      if (matchedImage) {
        const autoName = matchedImage.name.split('/').pop()?.split(':')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-') || '';
        if (autoName) {
          setName(autoName);
          // Clear name error if any
          setErrors(prev => ({ ...prev, name: undefined }));
        }
      }
    }
  };



  const handleSubmit = () => {
    const nameError = validateName(name);
    const imageUrlError = validateImageUrl(imageUrl);
    
    if (nameError || imageUrlError) {
      setErrors({ name: nameError, imageUrl: imageUrlError });
      return;
    }

    onAdd({ name, imageUrl, exposure: 'private' });
    onClose();
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Add Application</h2>
              <p className="text-purple-100 text-sm">Deploy a new application from any image</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Image Source
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSourceType('public')}
                className={`p-4 border-2 rounded-lg transition text-left ${
                  sourceType === 'public'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900 mb-1">Public Registry</div>
                <div className="text-xs text-slate-600">Docker Hub, Quay.io, etc.</div>
              </button>
              <button
                onClick={() => setSourceType('github')}
                className={`p-4 border-2 rounded-lg transition text-left ${
                  sourceType === 'github'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900 mb-1">Private GitHub</div>
                <div className="text-xs text-slate-600">ghcr.io (Requires PAT)</div>
              </button>
            </div>
          </div>

          {sourceType === 'github' && !githubPAT ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex gap-4">
                <div className="text-2xl">🔒</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-2">Registry Not Connected</h3>
                  <p className="text-sm text-amber-800 mb-4">
                    You need to connect your GitHub Container Registry to access private images. 
                    You can either connect your registry or use a public image instead.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSourceType('public')}
                      className="px-4 py-2 bg-white text-amber-900 border border-amber-300 rounded-lg text-sm font-medium hover:bg-amber-50 transition"
                    >
                      Use Public Image
                    </button>
                    <button
                      onClick={() => {
                        router.push('/dashboard?selection=project-settings&tab=registry');
                        onClose();
                      }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                    >
                      Connect Registry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Image URL Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Image URL
                </label>
                {sourceType === 'github' ? (
                  <select
                    value={imageUrl}
                    onChange={(e) => {
                      const value = e.target.value;
                      setImageUrl(value);
                      setErrors(prev => ({ ...prev, imageUrl: undefined }));
                      
                      // Auto-fill name
                      const img = availableImages.find(i => `ghcr.io/${i.name}:${i.tag}` === value);
                      if (img) {
                        const autoName = img.name.split('/').pop()?.split(':')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-') || '';
                        if (autoName) {
                          setName(autoName);
                          setErrors(prev => ({ ...prev, name: undefined }));
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                      errors.imageUrl ? 'border-red-300' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select an image...</option>
                    {availableImages.map((img, idx) => (
                      <option key={idx} value={`ghcr.io/${img.name}:${img.tag}`}>
                        {img.name}:{img.tag}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="nginx:alpine"
                    className={`w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                      errors.imageUrl ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                )}
                {errors.imageUrl && (
                  <p className="mt-2 text-sm text-red-600">{errors.imageUrl}</p>
                )}
              </div>

              {/* Application Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Application Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="my-api-service"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-slate-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  3-63 characters, lowercase alphanumeric with hyphens
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-xl">💡</span>
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 mb-1 text-sm">Smart Defaults</div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>• Resources: 1 vCPU, 2GB RAM, 2-10 replicas</div>
                      <div>• Health check: HTTP on port 3000</div>
                      <div>• Applications are private by default (change later)</div>
                      <div>• Private applications accessible via internal DNS</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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
            onClick={handleSubmit}
            disabled={!!errors.name || !!errors.imageUrl || !name || !imageUrl || (sourceType === 'github' && !githubPAT)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Application
          </button>
        </div>
      </div>
    </div>
  );
}
