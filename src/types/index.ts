export interface AssociationRule {
  id: string;
  antecedent: string[];
  consequent: string[];
  antecedentSupport: number;
  consequentSupport: number;
  support: number;
  confidence: number;
  lift: number;
  leverage: number;
  conviction: number;
  zhangsMetric: number;
  expectedLift?: number;
  revenueImpact?: number;
  marginImpact?: number;
}

export interface FrequentItemset {
  items: string[];
  support: number;
  count: number;
  length: number;
}

export interface AnalysisResult {
  rules: AssociationRule[];
  frequentItemsets: FrequentItemset[];
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  totalTransactions: number;
  uniqueItems: number;
  totalRules: number;
  avgLift: number;
  maxLift: number;
  avgConfidence: number;
  topRule: AssociationRule | null;
  algorithm: "apriori" | "fp-growth";
  durationMs: number;
}

export interface DatasetMargins {
  [item: string]: number;
}

export interface ParsedDataset {
  name: string;
  transactions: string[][];
  itemCount: number;
  transactionCount: number;
  margins?: DatasetMargins;
  hasMargins: boolean;
}

export interface AnalysisConfig {
  algorithm: "apriori" | "fp-growth";
  minSupport: number;
  minConfidence: number;
  minLift: number;
  maxAntecedentLength?: number;
  maxConsequentLength?: number;
}
