"use client";

import type { AssociationRule } from "@/types";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

interface ScatterChartProps {
  rules: AssociationRule[];
}

export function RuleScatterChart({ rules }: ScatterChartProps) {
  const data = rules.map((rule) => ({
    support: Number((rule.support * 100).toFixed(2)),
    confidence: Number((rule.confidence * 100).toFixed(2)),
    lift: Number(rule.lift.toFixed(2)),
    name: `${rule.antecedent.join(", ")} → ${rule.consequent.join(", ")}`,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="support"
            name="Support"
            unit="%"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="confidence"
            name="Confidence"
            unit="%"
            tick={{ fontSize: 12 }}
          />
          <ZAxis type="number" dataKey="lift" range={[40, 400]} name="Lift" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Scatter name="Rules" data={data} fill="#4f46e5" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
