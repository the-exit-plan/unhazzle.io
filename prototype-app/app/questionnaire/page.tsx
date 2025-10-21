'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';
import { QuestionnaireAnswers } from '@/lib/context/DeploymentContext';

export default function Questionnaire() {
  const router = useRouter();
  const { state, updateQuestionnaire } = useDeployment();
  
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    appType: 'ecommerce',
    traffic: 'burst',
    database: 'postgres',
    cache: 'redis',
  });

  const handleSubmit = () => {
    updateQuestionnaire(answers);
    router.push('/application');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>👋</span>
            <span>Welcome, {state.user?.name}!</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Tell us about your application
          </h1>
          <p className="text-xl text-slate-600">
            Answer 4 quick questions. We&apos;ll configure everything else automatically.
          </p>
        </div>

        {/* Question 1: Application Type */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                What type of application are you deploying?
              </h2>
              <p className="text-slate-600">
                This helps us configure the right infrastructure pattern
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: 'ecommerce', icon: '🛒', label: 'E-commerce', desc: 'Online stores, marketplaces, shopping platforms', recommended: true },
              { value: 'saas', icon: '💼', label: 'SaaS Platform', desc: 'Business apps, dashboards, collaboration tools' },
              { value: 'api', icon: '🔄', label: 'API/Microservices', desc: 'REST APIs, GraphQL, backend services' },
              { value: 'content', icon: '📰', label: 'Content Platform', desc: 'Blogs, media sites, publishing platforms' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setAnswers({ ...answers, appType: option.value as any })}
                className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                  answers.appType === option.value
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {option.recommended && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                )}
                <div className="text-4xl mb-3">{option.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{option.label}</h3>
                <p className="text-sm text-slate-600">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Traffic Pattern */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                What&apos;s your expected traffic pattern?
              </h2>
              <p className="text-slate-600">
                Defines auto-scaling behavior and resource allocation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: 'steady', icon: '📊', label: 'Steady', desc: 'Consistent traffic throughout the day' },
              { value: 'burst', icon: '⚡', label: 'High Burst Periods', desc: 'Flash sales, campaigns, peak hours', recommended: true },
              { value: 'global', icon: '🌍', label: 'Global 24/7', desc: 'International users, always active' },
              { value: 'regional', icon: '📍', label: 'Regional', desc: 'Business hours in specific timezone' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setAnswers({ ...answers, traffic: option.value as any })}
                className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                  answers.traffic === option.value
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {option.recommended && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                )}
                <div className="text-4xl mb-3">{option.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{option.label}</h3>
                <p className="text-sm text-slate-600">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Question 3: Database */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Do you need a database?
              </h2>
              <p className="text-slate-600">
                For persistent data like users, orders, or content
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: 'postgres', icon: '🐘', label: 'PostgreSQL', desc: 'Relational, ACID compliant, best for structured data', recommended: true },
              { value: 'mysql', icon: '🐬', label: 'MySQL', desc: 'Fast, reliable, great for web applications' },
              { value: 'mongodb', icon: '🍃', label: 'MongoDB', desc: 'Document store, flexible schemas, JSON-like' },
              { value: 'none', icon: '❌', label: 'No Database', desc: 'Stateless app or external data source' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setAnswers({ ...answers, database: option.value as any })}
                className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                  answers.database === option.value
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {option.recommended && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                )}
                <div className="text-4xl mb-3">{option.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{option.label}</h3>
                <p className="text-sm text-slate-600">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Question 4: Caching */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              4
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Enable high-speed caching?
              </h2>
              <p className="text-slate-600">
                Recommended for e-commerce: sessions, product data, and API responses
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: 'redis', icon: '⚡', label: 'Yes, with Redis', desc: 'In-memory cache for blazing fast performance', recommended: true },
              { value: 'memcached', icon: '💨', label: 'Yes, with Memcached', desc: 'Simple, high-performance caching' },
              { value: 'none', icon: '➡️', label: 'Skip for Now', desc: 'Can add later if needed' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setAnswers({ ...answers, cache: option.value as any })}
                className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                  answers.cache === option.value
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {option.recommended && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                )}
                <div className="text-4xl mb-3">{option.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{option.label}</h3>
                <p className="text-sm text-slate-600">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg text-lg"
          >
            <span>Continue to Application Setup</span>
            <span>→</span>
          </button>
          <p className="text-sm text-slate-500 mt-4">
            Takes ~30 seconds • You can adjust resources in the next steps
          </p>
        </div>
      </div>
    </div>
  );
}
