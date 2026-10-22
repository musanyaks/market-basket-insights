"use client";

import type { AssociationRule } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TopRulesChartProps {
  rules: AssociationRule[];
  limit?: number;
}

export function TopRulesChart({ rules, limit = 10 }: TopRulesChartProps) {
  const data = rules.slice(0, limit).map((rule) => ({
    name: `${rule.antecedent.join(", ")} → ${rule.consequent.join(", ")}`,
    lift: Number(rule.lift.toFixed(2)),
    confidence: Number((rule.confidence * 100).toFixed(1)),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" />
          <YAxis
            dataKey="name"
            type="category"
            width={180}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Bar dataKey="lift" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Lift" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
