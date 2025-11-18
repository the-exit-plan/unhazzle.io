"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDeployment } from "@/lib/context/DeploymentContext";
import type { RegionInfo, SmartQuestionnaireAnswers, Recommendations } from "@/lib/context/DeploymentContext";
import { generateRecommendations } from "@/lib/utils/recommendations";
import { calculateCost } from "@/lib/utils/costCalculator";

export default function ProjectSetup() {
  const router = useRouter();
  const { state, updateState } = useDeployment();

  const [projectName, setProjectName] = useState(state.projectName || "");
  const [region, setRegion] = useState<RegionInfo | undefined>(state.region);
  const [expanded, setExpanded] = useState(false);
  const [qa, setQa] = useState<SmartQuestionnaireAnswers | null>(state.smartQuestionnaire || null);
  const [reco, setReco] = useState<Recommendations | null>(state.recommendations || null);

  const nameValid = useMemo(() => {
    // Allow 3-63 chars: start/end alphanumeric, hyphens in middle
    const re = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    return projectName.length === 0 || (projectName.length >= 3 && projectName.length <= 63 && re.test(projectName));
  }, [projectName]);

  const countries: { country: string; flag: string; locations: RegionInfo[] }[] = [
    {
      country: "Germany",
      flag: "🇩🇪",
      locations: [
        { code: "fsn1", label: "Falkenstein (fsn1)", country: "Germany", flag: "🇩🇪" },
        { code: "nbg1", label: "Nuremberg (nbg1)", country: "Germany", flag: "🇩🇪" },
      ],
    },
    {
      country: "Finland",
      flag: "🇫🇮",
      locations: [{ code: "hel1", label: "Helsinki (hel1)", country: "Finland", flag: "🇫🇮" }],
    },
  ];

  const canApply = qa && qa.traffic && qa.latency && qa.workload && qa.startup && qa.spikiness;

  // Auto-generate recommendations when all questions answered
  useEffect(() => {
    if (canApply && qa) {
      const rec = generateRecommendations(qa);
      setReco(rec);
      updateState({ smartQuestionnaire: qa, recommendations: rec });
    }
  }, [qa?.traffic, qa?.latency, qa?.workload, qa?.startup, qa?.spikiness]);

  const onReset = () => {
    setQa(null);
    setReco(null);
    updateState({ smartQuestionnaire: null, recommendations: null });
  };

  const onContinue = () => {
    if (!projectName || !region) return;
    
    // Migrate GitHub PAT from localStorage to project
    const githubPAT = typeof window !== 'undefined' ? localStorage.getItem('github_pat') || undefined : undefined;
    
    // Create empty project
    const timestamp = Date.now();
    const projectSlug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const now = new Date().toISOString();
    
    updateState({
      projectName,
      region,
      smartQuestionnaire: qa,
      recommendations: reco,
      project: {
        id: `proj-${timestamp}`,
        name: projectName,
        slug: projectSlug,
        description: '',
        githubPAT,
        createdAt: now,
        updatedAt: now,
        environments: [], // Start with no environments
        envCount: 0,
        prEnvCount: 0,
        standardEnvCount: 0,
        prEnvs: {
          enabled: true,
          maxEnvs: 3,
          lifetimeHours: 2,
          autoDeleteOnPRClose: true
        }
      }
    });
    
    router.push("/dashboard");
  };

  // Cost preview using recommendations range
  const costPreview = useMemo(() => {
    if (!reco) return null;
    const resourcesMin = {
      replicas: { min: reco.hpaMin, max: reco.hpaMin },
      cpu: reco.cpuPerReplica,
      memory: reco.memoryPerReplica,
    } as any;
    const resourcesMax = {
      replicas: { min: reco.hpaMax, max: reco.hpaMax },
      cpu: reco.cpuPerReplica,
      memory: reco.memoryPerReplica,
    } as any;
    // Map spikiness to legacy traffic for bandwidth estimate
    const trafficMap: Record<SmartQuestionnaireAnswers["spikiness"], "steady" | "burst" | "regional" | "global"> = {
      steady: "steady",
      daily: "regional",
      weekly: "regional",
      unpredictable: "burst",
    };
    const mappedSpikiness = qa ? trafficMap[qa.spikiness] : "steady";
    const answers = {
      appType: "api",
      traffic: mappedSpikiness,
      database: "none",
      cache: "none",
    } as any;
    const min = calculateCost(resourcesMin, answers).total;
    const max = calculateCost(resourcesMax, answers).total;
    return { min, max };
  }, [reco, qa]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span role="img" aria-label="waving hand">👋</span>
            <span>Welcome{state.user?.name ? `, ${state.user.name}` : ''}!</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Create your project</h1>
          <p className="text-lg text-slate-600">Name it, pick a region. Smart assistance is optional.</p>
        </div>

        {/* Project Basics */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Project basics</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Project name</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value.trim())}
                placeholder="my-awesome-project"
                className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  nameValid ? "border-slate-300" : "border-red-500"
                }`}
              />
              {!nameValid && (
                <p className="mt-2 text-sm text-red-600">3–63 chars, lowercase letters, numbers, hyphens; start/end with alphanumeric.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Region</label>
              <div className="space-y-4">
                {countries.map((c) => (
                  <div key={c.country}>
                    <div className="text-slate-900 font-semibold mb-2 flex items-center gap-2">
                      <span role="img" aria-label={c.country}>{c.flag}</span>
                      <span>{c.country}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {c.locations.map((loc) => {
                        const selected = region?.code === loc.code;
                        return (
                          <button
                            key={loc.code}
                            type="button"
                            onClick={() => setRegion(loc)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              selected ? "border-purple-600 bg-purple-50 shadow" : "border-slate-200 hover:border-purple-300"
                            }`}
                            aria-pressed={selected}
                          >
                            <div className="flex items-center gap-3">
                              <span role="img" aria-label={loc.country}>{loc.flag}</span>
                              <div>
                                <div className="font-medium text-slate-900">{loc.label}</div>
                                <div className="text-xs text-slate-500">{loc.country}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Assistance Accordion */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div>
              <div className="text-slate-900 font-bold text-xl">Auto-configure resources (optional)</div>
              <div className="text-slate-600 mt-1">
                Tell us about your app's traffic and performance needs. We'll recommend CPU, memory, and scaling settings so you don't have to guess.
              </div>
            </div>
            <svg
              className={`w-6 h-6 text-slate-900 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded && (
            <div className="p-6 pt-0">
              {/* Questions */}
              <div className="space-y-6">
                {/* Traffic volume */}
                <div>
                  <div className="font-semibold text-slate-900 mb-2">What’s your peak hourly request volume?</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { v: "<1k", l: "<1K requests/hour" },
                      { v: "1k-10k", l: "1K-10K req/hour" },
                      { v: "10k-100k", l: "10K-100K req/hour" },
                      { v: "100k-1m", l: "100K-1M req/hour" },
                      { v: "1m+", l: "1M+ req/hour" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        className={`p-4 rounded-xl border-2 text-left text-slate-900 ${qa?.traffic === (o.v as any) ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:border-purple-300"}`}
                        onClick={() => setQa({ ...(qa || ({} as any)), traffic: o.v as any })}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Latency */}
                <div>
                  <div className="font-semibold text-slate-900 mb-2">What’s acceptable response time under load?</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { v: "<50ms", l: "<50ms" },
                      { v: "50-200ms", l: "50-200ms" },
                      { v: "200-500ms", l: "200-500ms" },
                      { v: ">500ms", l: ">500ms" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        className={`p-4 rounded-xl border-2 text-left text-slate-900 ${qa?.latency === (o.v as any) ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:border-purple-300"}`}
                        onClick={() => setQa({ ...(qa || ({} as any)), latency: o.v as any })}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workload */}
                <div>
                  <div className="font-semibold text-slate-900 mb-2">What does your app do most?</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { v: "cpu", l: "CPU-heavy" },
                      { v: "memory", l: "Memory-heavy" },
                      { v: "io", l: "I/O-heavy" },
                      { v: "balanced", l: "Balanced" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        className={`p-4 rounded-xl border-2 text-left text-slate-900 ${qa?.workload === (o.v as any) ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:border-purple-300"}`}
                        onClick={() => setQa({ ...(qa || ({} as any)), workload: o.v as any })}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Startup */}
                <div>
                  <div className="font-semibold text-slate-900 mb-2">How long does your app take to start?</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { v: "<5s", l: "<5 seconds" },
                      { v: "5-15s", l: "5-15 seconds" },
                      { v: "15-30s", l: "15-30 seconds" },
                      { v: ">30s", l: ">30 seconds" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        className={`p-4 rounded-xl border-2 text-left text-slate-900 ${qa?.startup === (o.v as any) ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:border-purple-300"}`}
                        onClick={() => setQa({ ...(qa || ({} as any)), startup: o.v as any })}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spikiness */}
                <div>
                  <div className="font-semibold text-slate-900 mb-2">How predictable is your traffic?</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { v: "steady", l: "Steady" },
                      { v: "daily", l: "Daily pattern" },
                      { v: "weekly", l: "Weekly pattern" },
                      { v: "unpredictable", l: "Unpredictable spikes" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        className={`p-4 rounded-xl border-2 text-left text-slate-900 ${qa?.spikiness === (o.v as any) ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:border-purple-300"}`}
                        onClick={() => setQa({ ...(qa || ({} as any)), spikiness: o.v as any })}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onReset}
                    className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Reset
                  </button>
                  {reco && (
                    <span className="text-sm text-slate-600">
                      Clear answers and configure manually later
                    </span>
                  )}
                </div>
              </div>

              {/* Preview */}
              {reco && (
                <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <div className="flex-1">
                      <div className="text-green-900 font-semibold text-sm mb-1">
                        We'll use these settings as defaults
                      </div>
                      <div className="text-slate-900 font-medium">
                        {reco.replicasBase} replicas start · HPA {reco.hpaMin}–{reco.hpaMax} · Scale at {reco.hpaThreshold}% CPU · {reco.hpaCooldown}m cooldown
                      </div>
                      <div className="text-slate-600 text-sm mt-1">{reco.rationale}</div>
                      <div className="text-slate-500 text-xs mt-2">
                        You can adjust these in the next step if needed
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Continue */}
        <div className="text-center">
          <button
            disabled={!projectName || !region || !nameValid}
            onClick={onContinue}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold shadow text-lg ${
              projectName && region && nameValid
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            <span>Continue to Application Setup</span>
            <span>→</span>
          </button>
          <p className="text-sm text-slate-500 mt-4">You can edit everything later in Resources & Review</p>
        </div>
      </div>
    </div>
  );
}
