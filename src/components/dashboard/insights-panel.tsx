"use client";

import type { AnalysisSummary, AssociationRule } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Package, ShoppingCart, TrendingUp } from "lucide-react";

interface InsightsPanelProps {
  rules: AssociationRule[];
  summary: AnalysisSummary;
}

export function InsightsPanel({ rules, summary }: InsightsPanelProps) {
  const bundlingRules = [...rules]
    .filter((rule) => rule.lift > 1.5 && rule.confidence > 0.4)
    .slice(0, 5);

  const crossSellRules = [...rules]
    .filter((rule) => rule.confidence > 0.5 && rule.lift > 1.2)
    .slice(0, 5);

  const placementRules = [...rules]
    .filter((rule) => rule.support > 0.02 && rule.lift > 1.3)
    .slice(0, 5);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card
        title="Bundle opportunities"
        subtitle="High-lift pairs that work well as bundles"
        className="lg:col-span-1"
      >
        <div className="space-y-3">
          {bundlingRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {rule.antecedent.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
                <span className="text-slate-400">+</span>
                {rule.consequent.map((item) => (
                  <Badge key={item} variant="success">
                    {item}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Lift {rule.lift.toFixed(2)} · Confidence {(rule.confidence * 100).toFixed(1)}%
                {rule.revenueImpact !== undefined && (
                  <span className="ml-2 text-emerald-600">
                    Est. +${rule.revenueImpact.toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          ))}
          {bundlingRules.length === 0 && (
            <p className="text-sm text-slate-500">No strong bundle opportunities found.</p>
          )}
        </div>
      </Card>

      <Card
        title="Cross-sell prompts"
        subtitle="Recommendations to show at checkout"
        className="lg:col-span-1"
      >
        <div className="space-y-3">
          {crossSellRules.map((rule) => (
            <div key={rule.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <ShoppingCart className="mt-0.5 h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  When cart has <span className="text-indigo-600">{rule.antecedent.join(", ")}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Suggest <span className="font-medium">{rule.consequent.join(", ")}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {(rule.confidence * 100).toFixed(1)}% conversion likelihood
                </p>
              </div>
            </div>
          ))}
          {crossSellRules.length === 0 && (
            <p className="text-sm text-slate-500">No cross-sell prompts found.</p>
          )}
        </div>
      </Card>

      <Card
        title="Shelf placement"
        subtitle="Frequent pairings to place near each other"
        className="lg:col-span-1"
      >
        <div className="space-y-3">
          {placementRules.map((rule) => (
            <div key={rule.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <Package className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm text-slate-700">
                  Place <span className="font-medium text-slate-900">{rule.antecedent.join(", ")}</span>{" "}
                  near <span className="font-medium text-slate-900">{rule.consequent.join(", ")}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Appear together in {(rule.support * 100).toFixed(2)}% of transactions
                </p>
              </div>
            </div>
          ))}
          {placementRules.length === 0 && (
            <p className="text-sm text-slate-500">No placement recommendations found.</p>
          )}
        </div>
      </Card>

      <Card title="Executive summary" className="lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="Average lift"
            value={summary.avgLift.toFixed(2)}
          />
          <SummaryItem
            icon={<Lightbulb className="h-5 w-5 text-amber-600" />}
            label="Actionable rules"
            value={summary.totalRules.toString()}
          />
          <SummaryItem
            icon={<ShoppingCart className="h-5 w-5 text-indigo-600" />}
            label="Transactions analyzed"
            value={summary.totalTransactions.toLocaleString()}
          />
          <SummaryItem
            icon={<Package className="h-5 w-5 text-slate-600" />}
            label="Unique products"
            value={summary.uniqueItems.toString()}
          />
        </div>
      </Card>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
      <div className="rounded-lg bg-white p-2 shadow-sm">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
