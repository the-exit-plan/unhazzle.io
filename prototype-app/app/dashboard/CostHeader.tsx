'use client';

import { Environment } from '@/lib/context/DeploymentContext';
import { calculateEnvironmentCost } from '@/lib/utils/costCalculator';
import { useState } from 'react';

interface CostHeaderProps {
  environment: Environment;
}

export default function CostHeader({ environment }: CostHeaderProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const { current, max, breakdown } = calculateEnvironmentCost(environment);

  // Determine color based on max cost
  const getCostColor = (cost: number) => {
    if (cost < 50) return 'text-green-600';
    if (cost < 200) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const costColor = getCostColor(max);

  return (
    <div className="relative">
      <div
        className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm cursor-pointer hover:shadow-md transition"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-slate-600 font-medium mb-1">Monthly Cost</div>
              <div className={`text-2xl font-bold ${costColor}`}>
                €{current.toFixed(2)}
              </div>
            </div>
            {max !== current && (
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1">Max (scaled)</div>
                <div className={`text-lg font-semibold ${costColor}`}>
                  €{max.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {environment.type === 'prod' && (
              <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-medium">
                PRODUCTION
              </span>
            )}
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Breakdown Tooltip */}
      {showBreakdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Cost Breakdown</h4>
          
          {/* Applications */}
          {breakdown.applications && breakdown.applications.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-slate-600 mb-2">Applications</div>
              {breakdown.applications.map((app: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-700">{app.name}</span>
                  <span className="font-mono text-slate-900">
                    €{app.current.toFixed(2)}
                    {app.max !== app.current && (
                      <span className="text-slate-500"> - €{app.max.toFixed(2)}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Database */}
          {breakdown.database && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-slate-600 mb-2">Database</div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-700">PostgreSQL</span>
                <span className="font-mono text-slate-900">€{breakdown.database.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Cache */}
          {breakdown.cache && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-slate-600 mb-2">Cache</div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-700">Redis</span>
                <span className="font-mono text-slate-900">€{breakdown.cache.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Infrastructure */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-slate-600 mb-2">Infrastructure</div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-700">Load Balancer + SSL</span>
              <span className="font-mono text-slate-900">€{breakdown.loadBalancer.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-700">Bandwidth (estimated)</span>
              <span className="font-mono text-slate-900">€{breakdown.bandwidth.toFixed(2)}</span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-slate-200 pt-2 mt-2">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-slate-900">Total</span>
              <span className={`font-mono ${costColor}`}>
                €{current.toFixed(2)} - €{max.toFixed(2)}/mo
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            💡 Prices based on Hetzner Cloud instances in Germany
          </div>
        </div>
      )}
    </div>
  );
}
