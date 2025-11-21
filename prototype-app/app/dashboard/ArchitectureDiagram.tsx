'use client';

import { DeploymentState } from '@/lib/context/DeploymentContext';

export default function ArchitectureDiagram({ state }: { state: DeploymentState }) {
  const env = state.project?.environments.find(e => e.id === state.activeEnvironmentId) || state.project?.environments[0];

  if (!env) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
        <p className="text-slate-500">No environment selected to visualize.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 overflow-x-auto">
      <div className="min-w-[600px] flex flex-col items-center gap-8">
        {/* Internet */}
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-2">☁️</div>
          <div className="text-sm font-bold text-slate-600">Internet</div>
          <div className="h-8 w-0.5 bg-slate-300 my-2"></div>
        </div>

        {/* Load Balancer */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm w-64 text-center relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
            Load Balancer
          </div>
          <div className="text-2xl mb-1">⚖️</div>
          <div className="font-mono text-xs text-slate-500 truncate">
            {env.baseDomain}
          </div>
        </div>

        <div className="h-8 w-0.5 bg-slate-300"></div>

        {/* Applications */}
        <div className="flex gap-6 justify-center flex-wrap">
          {env.applications.map((app, idx) => (
            <div key={app.id} className="flex flex-col items-center">
              <div className={`bg-white border-2 ${app.exposure === 'public' ? 'border-purple-200' : 'border-slate-200'} rounded-lg p-4 shadow-sm w-48 text-center relative`}>
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${app.exposure === 'public' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'} text-xs px-2 py-0.5 rounded-full font-medium`}>
                  {app.exposure === 'public' ? 'Public App' : 'Private App'}
                </div>
                <div className="text-2xl mb-1">🚀</div>
                <div className="font-bold text-slate-900 text-sm truncate">{app.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {app.resources.replicas.min} replicas
                </div>
              </div>
              
              {/* Connections to DB/Cache */}
              {(app.serviceAccess.database || app.serviceAccess.cache) && (
                <div className="h-8 w-0.5 bg-slate-300 my-2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Data Layer */}
        {(env.database || env.cache) && (
          <div className="flex gap-6 justify-center border-t-2 border-dashed border-slate-300 pt-8 w-full">
            {env.database && (
              <div className="bg-white border-2 border-green-200 rounded-lg p-4 shadow-sm w-48 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  Database
                </div>
                <div className="text-2xl mb-1">🐘</div>
                <div className="font-bold text-slate-900 text-sm">PostgreSQL</div>
              </div>
            )}
            
            {env.cache && (
              <div className="bg-white border-2 border-red-200 rounded-lg p-4 shadow-sm w-48 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  Cache
                </div>
                <div className="text-2xl mb-1">⚡</div>
                <div className="font-bold text-slate-900 text-sm">Redis</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
