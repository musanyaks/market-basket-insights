"use client";

import type { AssociationRule } from "@/types";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RulesTableProps {
  rules: AssociationRule[];
}

export function RulesTable({ rules }: RulesTableProps) {
  const [sortKey, setSortKey] = useState<keyof AssociationRule>("lift");
  const [sortDesc, setSortDesc] = useState(true);
  const [filter, setFilter] = useState("");

  const sortedRules = [...rules]
    .filter(
      (rule) =>
        rule.antecedent.some((item) => item.includes(filter.toLowerCase())) ||
        rule.consequent.some((item) => item.includes(filter.toLowerCase())),
    )
    .sort((a, b) => {
      const aValue = a[sortKey] ?? 0;
      const bValue = b[sortKey] ?? 0;
      return sortDesc ? (bValue as number) - (aValue as number) : (aValue as number) - (bValue as number);
    });

  const toggleSort = (key: keyof AssociationRule) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Antecedent",
      "Consequent",
      "Antecedent Support",
      "Consequent Support",
      "Support",
      "Confidence",
      "Lift",
      "Leverage",
      "Conviction",
      "Zhang's Metric",
    ];
    const rows = sortedRules.map((rule) => [
      rule.antecedent.join("; "),
      rule.consequent.join("; "),
      rule.antecedentSupport,
      rule.consequentSupport,
      rule.support,
      rule.confidence,
      rule.lift,
      rule.leverage,
      rule.conviction,
      rule.zhangsMetric,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "association-rules.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Filter rules by item..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-72"
        />
        <Button variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {[
                { key: "antecedent", label: "If customers bought" },
                { key: "consequent", label: "They also bought" },
                { key: "support", label: "Support" },
                { key: "confidence", label: "Confidence" },
                { key: "lift", label: "Lift" },
                { key: "conviction", label: "Conviction" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="cursor-pointer px-4 py-3 font-semibold hover:bg-slate-100"
                  onClick={() => toggleSort(column.key as keyof AssociationRule)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortKey === column.key && (
                      <span className="text-indigo-600">{sortDesc ? "↓" : "↑"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRules.slice(0, 100).map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {rule.antecedent.map((item) => (
                      <Badge key={item}>{item}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {rule.consequent.map((item) => (
                      <Badge key={item} variant="success">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{(rule.support * 100).toFixed(2)}%</td>
                <td className="px-4 py-3 text-slate-600">{(rule.confidence * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 font-semibold text-indigo-600">{rule.lift.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-600">{rule.conviction.toFixed(2)}</td>
              </tr>
            ))}
            {sortedRules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No rules match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sortedRules.length > 100 && (
        <p className="text-center text-sm text-slate-500">
          Showing top 100 of {sortedRules.length} rules. Export to see all.
        </p>
      )}
    </div>
  );
}
