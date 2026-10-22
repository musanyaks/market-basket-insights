"use client";

import type { AnalysisConfig } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

interface ConfigPanelProps {
  config: AnalysisConfig;
  onChange: (config: AnalysisConfig) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasDataset: boolean;
}

export function ConfigPanel({
  config,
  onChange,
  onAnalyze,
  isAnalyzing,
  hasDataset,
}: ConfigPanelProps) {
  return (
    <Card title="Analysis configuration" subtitle="Tune thresholds for your dataset">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Algorithm</label>
          <div className="grid grid-cols-2 gap-2">
            {(["apriori", "fp-growth"] as const).map((algo) => (
              <button
                key={algo}
                onClick={() => onChange({ ...config, algorithm: algo })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  config.algorithm === algo
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {algo === "apriori" ? "Apriori" : "FP-Growth"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            FP-Growth is faster on dense datasets; Apriori is easier to inspect level-by-level.
          </p>
        </div>

        <SliderControl
          label="Minimum support"
          value={config.minSupport}
          min={0.001}
          max={0.5}
          step={0.001}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          onChange={(v) => onChange({ ...config, minSupport: v })}
          hint="Fraction of transactions that must contain the itemset"
        />

        <SliderControl
          label="Minimum confidence"
          value={config.minConfidence}
          min={0.05}
          max={1}
          step={0.01}
          format={(v) => `${(v * 100).toFixed(0)}%`}
          onChange={(v) => onChange({ ...config, minConfidence: v })}
          hint="Likelihood the consequent appears given the antecedent"
        />

        <SliderControl
          label="Minimum lift"
          value={config.minLift}
          min={0.5}
          max={10}
          step={0.1}
          format={(v) => v.toFixed(1)}
          onChange={(v) => onChange({ ...config, minLift: v })}
          hint="Strength over random chance; values above 1 are meaningful"
        />

        <Button onClick={onAnalyze} disabled={!hasDataset || isAnalyzing} className="w-full">
          <Settings2 className="h-4 w-4" />
          {isAnalyzing ? "Mining patterns..." : "Run market basket analysis"}
        </Button>
      </div>
    </Card>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  hint?: string;
}

function SliderControl({ label, value, min, max, step, format, onChange, hint }: SliderControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
