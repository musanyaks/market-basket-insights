import type {
  AnalysisConfig,
  AnalysisResult,
  AnalysisSummary,
  AssociationRule,
  FrequentItemset,
  ParsedDataset,
} from "@/types";
import { runApriori } from "./apriori";
import { runFPGrowth } from "./fp-growth";
import { enrichWithBusinessMetrics, generateAssociationRules } from "./utils";

export function analyzeDataset(
  dataset: ParsedDataset,
  config: AnalysisConfig,
): AnalysisResult {
  const startTime = performance.now();
  const transactions = dataset.transactions;
  const totalTransactions = transactions.length;

  const frequentItemsets =
    config.algorithm === "fp-growth"
      ? runFPGrowth(transactions, config.minSupport)
      : runApriori(transactions, config.minSupport);

  const rules = generateAssociationRules(frequentItemsets, totalTransactions)
    .filter((rule) => rule.confidence >= config.minConfidence)
    .filter((rule) => rule.lift >= config.minLift);

  const enrichedRules = enrichWithBusinessMetrics(
    rules,
    totalTransactions,
    dataset.margins,
  );

  const sortedRules = enrichedRules.sort((a, b) => b.lift - a.lift);

  const durationMs = Math.round(performance.now() - startTime);
  const totalRules = sortedRules.length;
  const avgLift = totalRules > 0
    ? sortedRules.reduce((sum, r) => sum + r.lift, 0) / totalRules
    : 0;
  const maxLift = totalRules > 0 ? Math.max(...sortedRules.map((r) => r.lift)) : 0;
  const avgConfidence = totalRules > 0
    ? sortedRules.reduce((sum, r) => sum + r.confidence, 0) / totalRules
    : 0;

  const uniqueItems = new Set<string>();
  for (const tx of transactions) {
    for (const item of tx) uniqueItems.add(item);
  }

  return {
    rules: sortedRules,
    frequentItemsets,
    summary: {
      totalTransactions,
      uniqueItems: uniqueItems.size,
      totalRules,
      avgLift: Number(avgLift.toFixed(4)),
      maxLift: Number(maxLift.toFixed(4)),
      avgConfidence: Number(avgConfidence.toFixed(4)),
      topRule: sortedRules[0] ?? null,
      algorithm: config.algorithm,
      durationMs,
    },
  };
}
