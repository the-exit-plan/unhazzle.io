'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployment } from '@/lib/context/DeploymentContext';

interface DeploymentStep {
  id: string;
  label: string;
  description: string;
  duration: number; // in seconds
  status: 'pending' | 'running' | 'completed' | 'error';
  logs?: string[];
}

export default function Deploying() {
  const router = useRouter();
  const { state, markDeployed } = useDeployment();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<DeploymentStep[]>([
    {
      id: 'validate',
      label: 'Validating configuration',
      description: 'Checking resources and dependencies',
      duration: 2,
      status: 'pending',
      logs: []
    },
    {
      id: 'provision',
      label: 'Provisioning infrastructure',
      description: 'Setting up servers and networking',
      duration: 8,
      status: 'pending',
      logs: []
    },
    {
      id: 'database',
      label: 'Configuring database',
      description: 'Creating PostgreSQL instance with backups',
      duration: 6,
      status: 'pending',
      logs: []
    },
    {
      id: 'cache',
      label: 'Setting up cache',
      description: 'Deploying Redis with persistence',
      duration: 4,
      status: 'pending',
      logs: []
    },
    {
      id: 'container',
      label: 'Pulling container image',
      description: 'Fetching and verifying image layers',
      duration: 5,
      status: 'pending',
      logs: []
    },
    {
      id: 'deploy',
      label: 'Deploying application',
      description: 'Starting containers across replicas',
      duration: 7,
      status: 'pending',
      logs: []
    },
    {
      id: 'loadbalancer',
      label: 'Configuring load balancer',
      description: 'Setting up SSL and routing rules',
      duration: 4,
      status: 'pending',
      logs: []
    },
    {
      id: 'health',
      label: 'Running health checks',
      description: 'Verifying application is responding',
      duration: 5,
      status: 'pending',
      logs: []
    },
    {
      id: 'complete',
      label: 'Deployment complete',
      description: 'Your application is live!',
      duration: 1,
      status: 'pending',
      logs: []
    }
  ]);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isDeploymentComplete, setIsDeploymentComplete] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect if no cost calculated
  useEffect(() => {
    if (!state.cost) {
      router.push('/');
    }
  }, [state.cost, router]);

  // Deployment progress simulation with clear stopping condition
  useEffect(() => {
    if (!state.cost || isDeploymentComplete) return;

    let stepTimers: NodeJS.Timeout[] = [];
    let logTimers: NodeJS.Timeout[] = [];
    let elapsedTimer: NodeJS.Timeout;

    const runDeployment = async () => {
      for (let index = 0; index < steps.length; index++) {
        await new Promise<void>((resolve) => {
          // Mark current step as running
          setSteps(prev => prev.map((step, i) => {
            if (i === index) return { ...step, status: 'running' };
            if (i < index) return { ...step, status: 'completed' };
            return step;
          }));

          setCurrentStepIndex(index);

          // Get all logs for this step
          const allLogs = Array.from({ length: getLogCountForStep(steps[index].id) }, (_, i) => 
            getLogForStep(steps[index].id, i)
          );

          // Add logs at intervals
          let logIndex = 0;
          const logInterval = setInterval(() => {
            if (logIndex < allLogs.length) {
              setSteps(prev => prev.map((step, i) => {
                if (i === index && step.status === 'running') {
                  return { ...step, logs: allLogs.slice(0, logIndex + 1) };
                }
                return step;
              }));
              logIndex++;
            }
          }, 600);

          logTimers.push(logInterval);

          // Complete step after duration
          const stepTimer = setTimeout(() => {
            clearInterval(logInterval);
            setSteps(prev => prev.map((step, i) => 
              i === index ? { ...step, status: 'completed' } : step
            ));
            resolve();
          }, steps[index].duration * 1000);

          stepTimers.push(stepTimer);
        });
      }

      // All steps complete
      setIsDeploymentComplete(true);
      markDeployed();
    };

    // Start elapsed timer
    elapsedTimer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Start deployment
    runDeployment();

    return () => {
      stepTimers.forEach(t => clearTimeout(t));
      logTimers.forEach(t => clearInterval(t));
      clearInterval(elapsedTimer);
    };
  }, [state.cost, isDeploymentComplete, markDeployed]);

  const getLogCountForStep = (stepId: string): number => {
    const logs: Record<string, string[]> = {
      validate: [
        '✓ Configuration schema validated',
        '✓ Resource quotas checked',
        '✓ Dependencies resolved',
        '✓ Security policies verified'
      ],
      provision: [
        '→ Allocating compute resources in FSN1',
        '→ Creating virtual private network',
        '→ Configuring firewall rules',
        '✓ Infrastructure provisioned (CX43 instances)',
        '✓ Network topology established'
      ],
      database: [
        '→ Creating PostgreSQL 16 instance',
        '→ Allocating 20GB block storage',
        '→ Enabling automated backups (7-day retention)',
        '→ Configuring HA standby replica',
        '✓ Database ready: postgresql://...unhazzle.io:5432'
      ],
      cache: [
        '→ Deploying Redis 7.2 container',
        '→ Configuring 512MB memory limit',
        '→ Enabling daily persistence (AOF)',
        '✓ Cache ready: redis://...unhazzle.io:6379'
      ],
      container: [
        '→ Authenticating with ghcr.io',
        '→ Pulling image layers (3/3)',
        '→ Verifying image signature',
        '✓ Image pulled: ghcr.io/acme/ecommerce-shop:v2.1.0'
      ],
      deploy: [
        '→ Injecting environment variables',
        '→ Starting replica 1/2',
        '→ Starting replica 2/2',
        '→ Configuring auto-scaling (2-10 replicas)',
        '✓ All replicas running and healthy'
      ],
      loadbalancer: [
        '→ Creating load balancer',
        '→ Provisioning SSL certificate',
        '→ Configuring health check: GET /health',
        '✓ Load balancer active with HTTPS'
      ],
      health: [
        '→ Waiting for application to be ready',
        '→ Health check passed (200 OK)',
        '→ Testing SSL certificate',
        '→ Verifying DNS resolution',
        '✓ All health checks passed'
      ],
      complete: [
        '🎉 Deployment successful!'
      ]
    };

    return (logs[stepId] || []).length;
  };

  const getLogForStep = (stepId: string, logIndex: number): string => {
    const logs: Record<string, string[]> = {
      validate: [
        '✓ Configuration schema validated',
        '✓ Resource quotas checked',
        '✓ Dependencies resolved',
        '✓ Security policies verified'
      ],
      provision: [
        '→ Allocating compute resources in FSN1',
        '→ Creating virtual private network',
        '→ Configuring firewall rules',
        '✓ Infrastructure provisioned (CX43 instances)',
        '✓ Network topology established'
      ],
      database: [
        '→ Creating PostgreSQL 16 instance',
        '→ Allocating 20GB block storage',
        '→ Enabling automated backups (7-day retention)',
        '→ Configuring HA standby replica',
        '✓ Database ready: postgresql://...unhazzle.io:5432'
      ],
      cache: [
        '→ Deploying Redis 7.2 container',
        '→ Configuring 512MB memory limit',
        '→ Enabling daily persistence (AOF)',
        '✓ Cache ready: redis://...unhazzle.io:6379'
      ],
      container: [
        '→ Authenticating with ghcr.io',
        '→ Pulling image layers (3/3)',
        '→ Verifying image signature',
        '✓ Image pulled: ghcr.io/acme/ecommerce-shop:v2.1.0'
      ],
      deploy: [
        '→ Injecting environment variables',
        '→ Starting replica 1/2',
        '→ Starting replica 2/2',
        '→ Configuring auto-scaling (2-10 replicas)',
        '✓ All replicas running and healthy'
      ],
      loadbalancer: [
        '→ Creating load balancer',
        '→ Provisioning SSL certificate',
        '→ Configuring health check: GET /health',
        '✓ Load balancer active with HTTPS'
      ],
      health: [
        '→ Waiting for application to be ready',
        '→ Health check passed (200 OK)',
        '→ Testing SSL certificate',
        '→ Verifying DNS resolution',
        '✓ All health checks passed'
      ],
      complete: [
        '🎉 Deployment successful!'
      ]
    };

    const stepLogs = logs[stepId] || [];
    return stepLogs[Math.min(logIndex, stepLogs.length - 1)] || '...';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-600">✓</span>;
      case 'running':
        return (
          <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'error':
        return <span className="text-red-600">✗</span>;
      default:
        return <span className="text-slate-300">○</span>;
    }
  };

  if (!state.cost) {
    return null;
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>🚀</span>
            <span>Deployment in progress</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Deploying Your Application
          </h1>
          <p className="text-lg text-slate-600">
            Sit back and relax. This typically takes 40-50 seconds.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏱️</span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {completedSteps === totalSteps ? 'Complete!' : 'Deploying...'}
                </h3>
                <p className="text-sm text-slate-600">
                  {completedSteps} of {totalSteps} steps completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{formatTime(elapsedTime)}</p>
              <p className="text-xs text-slate-500">elapsed</p>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-sm text-slate-600 mt-2">{Math.round(progress)}%</p>
        </div>

        {/* Deployment Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>📋</span>
            <span>Deployment Steps</span>
          </h3>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className={`absolute left-[11px] top-8 w-0.5 h-full ${
                    step.status === 'completed' ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                )}

                {/* Step */}
                <div className={`relative flex gap-4 p-4 rounded-lg transition-all ${
                  step.status === 'running' ? 'bg-purple-50 border-2 border-purple-600' :
                  step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                  'bg-slate-50 border border-slate-200'
                }`}>
                  {/* Icon */}
                  <div className="flex-shrink-0 w-6 h-6 mt-1">
                    {getStatusIcon(step.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold ${
                        step.status === 'running' ? 'text-purple-900' :
                        step.status === 'completed' ? 'text-green-900' :
                        'text-slate-700'
                      }`}>
                        {step.label}
                      </h4>
                      {step.status === 'running' && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{step.description}</p>

                    {/* Logs */}
                    {step.logs && step.logs.length > 0 && (
                      <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs mt-3">
                        {step.logs.map((log, i) => (
                          <div key={i} className="text-green-400 mb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100 mb-6">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>What&apos;s happening behind the scenes</span>
          </h4>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Spinning up enterprise-grade Hetzner servers in Germany</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Configuring high-availability database with automated backups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Setting up auto-scaling from {state.resources?.replicas.min} to {state.resources?.replicas.max} replicas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Provisioning free SSL certificate for HTTPS</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Deploying to: <code className="bg-white px-2 py-0.5 rounded text-xs">{state.domain?.defaultSubdomain}</code></span>
            </li>
          </ul>
        </div>

        {/* Next Steps */}
        {isDeploymentComplete && (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-6">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Deployment Complete!</h2>
              <p className="text-green-700 mb-6">
                Your application is now live and running
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                View Operations Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
