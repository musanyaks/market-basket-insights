import type { AssociationRule, FrequentItemset } from "@/types";

export function itemsetToKey(items: string[]): string {
  return [...items].sort().join("||");
}

export function keyToItemset(key: string): string[] {
  return key.split("||").filter(Boolean);
}

export function getSubsets<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length === 0) return [];
  const [first, ...rest] = items;
  const withFirst = getSubsets(rest, size - 1).map((subset) => [first, ...subset]);
  const withoutFirst = getSubsets(rest, size);
  return [...withFirst, ...withoutFirst];
}

export function countItemsets(
  transactions: string[][],
  candidates: Set<string>[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tx of transactions) {
    const txSet = new Set(tx);
    for (const candidate of candidates) {
      let includesAll = true;
      for (const item of candidate) {
        if (!txSet.has(item)) {
          includesAll = false;
          break;
        }
      }
      if (includesAll) {
        const key = itemsetToKey([...candidate]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
}

export function generateAssociationRules(
  frequentItemsets: FrequentItemset[],
  totalTransactions: number,
): AssociationRule[] {
  const rules: AssociationRule[] = [];
  const supportMap = new Map(frequentItemsets.map((fi) => [itemsetToKey(fi.items), fi.support]));

  for (const itemset of frequentItemsets) {
    if (itemset.length < 2) continue;

    const itemsetSupport = itemset.support;
    const items = itemset.items;

    for (let i = 1; i < items.length; i++) {
      const antecedentSubsets = getSubsets(items, i);
      for (const antecedent of antecedentSubsets) {
        const consequent = items.filter((item) => !antecedent.includes(item));
        if (consequent.length === 0) continue;

        const antecedentKey = itemsetToKey(antecedent);
        const consequentKey = itemsetToKey(consequent);
        const antecedentSupport = supportMap.get(antecedentKey) ?? 0;
        const consequentSupport = supportMap.get(consequentKey) ?? 0;

        if (antecedentSupport === 0) continue;

        const confidence = itemsetSupport / antecedentSupport;
        const lift = antecedentSupport > 0 && consequentSupport > 0
          ? confidence / consequentSupport
          : 0;
        const leverage = itemsetSupport - antecedentSupport * consequentSupport;
        const conviction = confidence < 1
          ? (1 - consequentSupport) / (1 - confidence)
          : Infinity;

        const numerator = itemsetSupport - antecedentSupport * consequentSupport;
        const denominator = Math.max(
          itemsetSupport * (1 - antecedentSupport),
          antecedentSupport * (consequentSupport - itemsetSupport),
        );
        const zhangsMetric = denominator === 0 ? 0 : numerator / denominator;

        rules.push({
          id: crypto.randomUUID(),
          antecedent: [...antecedent].sort(),
          consequent: [...consequent].sort(),
          antecedentSupport,
          consequentSupport,
          support: itemsetSupport,
          confidence,
          lift,
          leverage,
          conviction: Number.isFinite(conviction) ? conviction : 9999,
          zhangsMetric,
        });
      }
    }
  }

  return rules;
}

export function enrichWithBusinessMetrics(
  rules: AssociationRule[],
  totalTransactions: number,
  margins?: Record<string, number>,
): AssociationRule[] {
  return rules.map((rule) => {
    const antecedentTransactions = Math.round(rule.antecedentSupport * totalTransactions);
    const consequentTransactions = Math.round(rule.consequentSupport * totalTransactions);
    const ruleTransactions = Math.round(rule.support * totalTransactions);

    const avgOrderValue = 50;
    const conversionUplift = Math.min((rule.lift - 1) * 0.1, 0.25);
    const revenueImpact = antecedentTransactions * avgOrderValue * conversionUplift;

    let marginImpact: number | undefined;
    if (margins) {
      const antecedentMargin = rule.antecedent.reduce((sum, item) => sum + (margins[item] ?? 0), 0);
      const consequentMargin = rule.consequent.reduce((sum, item) => sum + (margins[item] ?? 0), 0);
      marginImpact =
        ruleTransactions * (consequentMargin + antecedentMargin) * (1 + conversionUplift);
    }

    return {
      ...rule,
      revenueImpact: Number(revenueImpact.toFixed(2)),
      marginImpact: marginImpact !== undefined ? Number(marginImpact.toFixed(2)) : undefined,
    };
  });
}
