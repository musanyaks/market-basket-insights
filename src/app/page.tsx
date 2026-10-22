"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { ConfigPanel } from "@/components/dashboard/config-panel";
import { RulesTable } from "@/components/dashboard/rules-table";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { ProjectManager } from "@/components/dashboard/project-manager";
import { TopRulesChart } from "@/components/charts/top-rules-chart";
import { RuleScatterChart } from "@/components/charts/scatter-chart";
import { NetworkGraph } from "@/components/charts/network-graph";
import type { AnalysisConfig, AnalysisResult, ParsedDataset } from "@/types";
import type { Project } from "@/db/schema";
import { BarChart3, Database, Sparkles, Zap } from "lucide-react";

const DEFAULT_CONFIG: AnalysisConfig = {
  algorithm: "fp-growth",
  minSupport: 0.1,
  minConfidence: 0.3,
  minLift: 1.0,
};

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "network">("overview");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data = (await res.json()) as Project[];
    setProjects(data);
    if (data.length > 0 && !selectedProject) {
      setSelectedProject(data[0]);
    }
  };

  const createProject = async (name: string, description?: string) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const project = (await res.json()) as Project;
    setProjects((prev) => [project, ...prev]);
    setSelectedProject(project);
  };

  const deleteProject = async (id: number) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const handleAnalyze = async () => {
    if (!dataset) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset,
          config,
          projectId: selectedProject?.id,
          save: false,
        }),
      });

      const data = (await res.json()) as AnalysisResult;
      setResult(data);
      setActiveTab("overview");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveDataset = async () => {
    if (!dataset || !selectedProject) return;
    await fetch("/api/datasets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProject.id,
        name: dataset.name,
        rawText: "",
        parsedTransactions: dataset.transactions,
        itemCount: dataset.itemCount,
        transactionCount: dataset.transactionCount,
        hasMargins: dataset.hasMargins,
        margins: dataset.margins,
      }),
    });
    alert("Dataset saved to project.");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">BasketIQ</h1>
              <p className="text-xs text-slate-500">Market basket insights engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dataset && (
              <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
                <Database className="h-4 w-4" />
                {dataset.transactionCount.toLocaleString()} baskets · {dataset.itemCount} items
              </div>
            )}
            {result && (
              <Badge variant="info">
                <Zap className="mr-1 h-3 w-3" />
                {result.summary.algorithm}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <ProjectManager
              projects={projects}
              selectedProject={selectedProject}
              onSelect={setSelectedProject}
              onCreate={createProject}
              onDelete={deleteProject}
            />
          </aside>

          {/* Main content */}
          <div className="space-y-6 lg:col-span-9">
            <section className="grid gap-6 md:grid-cols-2">
              <UploadPanel onDatasetParsed={setDataset} />
              <ConfigPanel
                config={config}
                onChange={setConfig}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                hasDataset={!!dataset}
              />
            </section>

            {dataset && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {dataset.hasMargins ? "Margin data detected" : "Upload margin column for profit impact"}
                  </span>
                </div>
                {selectedProject && (
                  <Button size="sm" variant="secondary" onClick={saveDataset}>
                    Save dataset to project
                  </Button>
                )}
              </div>
            )}

            {result && (
              <section className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {(["overview", "rules", "network"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <InsightsPanel rules={result.rules} summary={result.summary} />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card title="Top rules by lift" subtitle={`Best ${Math.min(result.rules.length, 10)} associations`}>
                        <TopRulesChart rules={result.rules} />
                      </Card>
                      <Card title="Support vs Confidence" subtitle="Bubble size = lift">
                        <RuleScatterChart rules={result.rules} />
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === "rules" && (
                  <Card title="Association rules" subtitle={`${result.rules.length} rules found`}>
                    <RulesTable rules={result.rules} />
                  </Card>
                )}

                {activeTab === "network" && (
                  <Card title="Product association network" subtitle="Thicker edges = stronger lift">
                    <NetworkGraph rules={result.rules} />
                  </Card>
                )}
              </section>
            )}

            {!result && !isAnalyzing && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                  <BarChart3 className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No analysis yet</h3>
                <p className="mt-2 max-w-md mx-auto text-sm text-slate-500">
                  Upload a transaction CSV and click "Run market basket analysis" to discover product associations,
                  bundling opportunities, and cross-sell recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
