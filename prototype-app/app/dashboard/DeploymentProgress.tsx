'use client';

import { useState, useEffect, useRef } from 'react';
import { useDeployment, type DeploymentState } from '@/lib/context/DeploymentContext';
import type { ApplicationConfig } from '@/lib/context/DeploymentContext';

interface DeploymentStep {
  id: string;
  label: string;
  description: string;
  duration: number; // seconds
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string[];
}

interface DeploymentProgressProps {
  application: ApplicationConfig;
  environmentId: string;
  onComplete: () => void;
}

// Generate deployment steps for a single application
const generateDeploymentSteps = (app: ApplicationConfig, state: DeploymentState): DeploymentStep[] => {
  const steps: DeploymentStep[] = [];

  // 1. Validation (always included)
  steps.push({
    id: 'validate',
    label: 'Validating configuration',
    description: 'Checking application settings',
    duration: 2,
    status: 'pending',
    logs: []
  });

  // 2. Build/Pull Image
  steps.push({
    id: 'image',
    label: 'Pulling container image',
    description: 'Fetching from registry',
    duration: 5,
    status: 'pending',
    logs: []
  });

  // 3. Database connection (if enabled)
  if (app.serviceAccess.database && state.resources?.database) {
    steps.push({
      id: 'database',
      label: 'Connecting to database',
      description: 'Injecting database credentials',
      duration: 2,
      status: 'pending',
      logs: []
    });
  }

  // 4. Cache connection (if enabled)
  if (app.serviceAccess.cache && state.resources?.cache) {
    steps.push({
      id: 'cache',
      label: 'Connecting to cache',
      description: 'Injecting cache credentials',
      duration: 2,
      status: 'pending',
      logs: []
    });
  }

  // 5. Deploy replicas
  steps.push({
    id: 'deploy',
    label: 'Starting replicas',
    description: `Launching ${app.resources.replicas.min} instance(s)`,
    duration: 6,
    status: 'pending',
    logs: []
  });

  // 6. Health checks
  steps.push({
    id: 'health',
    label: 'Running health checks',
    description: 'Verifying application is responding',
    duration: 4,
    status: 'pending',
    logs: []
  });

  // 7. Complete
  steps.push({
    id: 'complete',
    label: 'Deployment complete',
    description: 'Application is live!',
    duration: 1,
    status: 'pending',
    logs: []
  });

  return steps;
};

// Get logs for each step
const getLogsForStep = (stepId: string, app: ApplicationConfig, state: DeploymentState): string[] => {
  const displayName = app.imageUrl.split('/').pop()?.split(':')[0] || 'application';

  switch (stepId) {
    case 'validate':
      return [
        '✓ Configuration validated',
        '✓ Resource quotas checked',
        `✓ ${app.resources.replicas.min} replica(s) requested`
      ];

    case 'image':
      return [
        '→ Authenticating with registry',
        `→ Pulling image: ${app.imageUrl}`,
        '→ Extracting layers',
        '→ Verifying image signature',
        '✓ Image ready'
      ];

    case 'database':
      return [
        '→ Retrieving database credentials',
        '→ Injecting DATABASE_URL',
        '✓ Database connection configured'
      ];

    case 'cache':
      return [
        '→ Retrieving cache credentials',
        '→ Injecting CACHE_URL',
        '✓ Cache connection configured'
      ];

    case 'deploy':
      const replicaLogs = [
        '→ Scheduling pods',
        '→ Allocating resources'
      ];
      for (let i = 1; i <= app.resources.replicas.min; i++) {
        replicaLogs.push(`→ Starting replica ${i}/${app.resources.replicas.min}`);
      }
      replicaLogs.push(`→ Configuring DNS: ${displayName}.internal`);
      replicaLogs.push('✓ All replicas running');
      return replicaLogs;

    case 'health':
      return [
        '→ Waiting for services to start',
        `→ Checking ${app.healthCheck?.path || '/health'}`,
        '→ Testing connectivity',
        '✓ Health checks passed'
      ];

    case 'complete':
      return ['🎉 Deployment successful!'];

    default:
      return [];
  }
};

export default function DeploymentProgress({ application, environmentId, onComplete }: DeploymentProgressProps) {
  const { state, updateApplicationStatus } = useDeployment();
  const [steps, setSteps] = useState<DeploymentStep[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const deploymentStarted = useRef(false);
  const activeTimers = useRef<NodeJS.Timeout[]>([]);

  // Generate steps on mount
  useEffect(() => {
    if (steps.length === 0) {
      const initialSteps = generateDeploymentSteps(application, state);
      setSteps(initialSteps);
    }
  }, [application, state, steps.length]);

  // Run deployment simulation
  useEffect(() => {
    if (deploymentStarted.current || steps.length === 0 || application.status !== 'deploying') {
      return;
    }

    deploymentStarted.current = true;
    const stepsSnapshot = [...steps];
    let currentIndex = 0;

    const processStep = (index: number) => {
      if (index >= stepsSnapshot.length) {
        // Deployment complete
        updateApplicationStatus(application.id, 'running');
        setIsComplete(true);
        return;
      }

      const step = stepsSnapshot[index];
      setCurrentStepIndex(index);

      // Mark step as running
      setSteps(prev => prev.map((s, i) => 
        i === index ? { ...s, status: 'running' } : s
      ));

      // Generate logs progressively
      const logs = getLogsForStep(step.id, application, state);
      let logIndex = 0;

      const logInterval = setInterval(() => {
        if (logIndex < logs.length) {
          setSteps(prev => prev.map((s, i) => {
            if (i === index) {
              return { ...s, logs: [...s.logs, logs[logIndex]] };
            }
            return s;
          }));
          logIndex++;
        } else {
          clearInterval(logInterval);
        }
      }, Math.max(300, (step.duration * 1000) / (logs.length + 1)));

      activeTimers.current.push(logInterval);

      // Complete step after duration
      const completeTimer = setTimeout(() => {
        setSteps(prev => prev.map((s, i) => 
          i === index ? { ...s, status: 'completed' } : s
        ));
        processStep(index + 1);
      }, step.duration * 1000);

      activeTimers.current.push(completeTimer);
    };

    processStep(0);

    // Cleanup
    return () => {
      activeTimers.current.forEach(timer => clearTimeout(timer));
      activeTimers.current = [];
    };
    // Steps intentionally excluded to prevent re-triggering on state updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length, application.status]);

  // Handle completion animations in separate effect
  useEffect(() => {
    if (!isComplete) return;

    // Wait 2 seconds, collapse accordion
    const collapseTimer = setTimeout(() => {
      setIsExpanded(false);
    }, 2000);

    // Wait 5 seconds total, then hide
    const hideTimer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(collapseTimer);
      clearTimeout(hideTimer);
    };
    // Only run once when isComplete changes to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  if (steps.length === 0) {
    return null;
  }

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalCount = steps.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition"
      >
        <div className="flex items-center gap-3">
          <div className="animate-spin text-blue-600">⚙️</div>
          <div className="text-left">
            <div className="font-semibold text-slate-900">
              Deploying Application
            </div>
            <div className="text-sm text-slate-600">
              {completedCount} of {totalCount} steps completed
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            {Math.round(progressPercent)}%
          </div>
          <span className={`transform transition ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Expandable Steps */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`border rounded-lg transition ${
                step.status === 'running' 
                  ? 'border-blue-400 bg-blue-50'
                  : step.status === 'completed'
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Step Header */}
              <div className="px-3 py-2 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {step.status === 'completed' && (
                    <span className="text-green-600">✓</span>
                  )}
                  {step.status === 'running' && (
                    <span className="animate-spin">⚙️</span>
                  )}
                  {step.status === 'pending' && (
                    <span className="text-slate-400">○</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Step Logs */}
              {step.logs.length > 0 && (
                <div className="px-3 pb-2">
                  <div className="bg-slate-900 rounded p-2 font-mono text-xs text-slate-300 space-y-1">
                    {step.logs.map((log, logIndex) => (
                      <div key={logIndex} className="animate-fadeIn">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
