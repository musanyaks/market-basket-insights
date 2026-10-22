import type { FrequentItemset } from "@/types";
import { countItemsets, itemsetToKey, keyToItemset } from "./utils";

export function runApriori(
  transactions: string[][],
  minSupport: number,
): FrequentItemset[] {
  const totalTransactions = transactions.length;
  const minCount = Math.ceil(minSupport * totalTransactions);

  // Count individual items
  const itemCounts = new Map<string, number>();
  for (const tx of transactions) {
    for (const item of tx) {
      itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
    }
  }

  const frequentItems = [...itemCounts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);

  const frequentItemsets: FrequentItemset[] = frequentItems.map((item) => {
    const count = itemCounts.get(item) ?? 0;
    return {
      items: [item],
      support: count / totalTransactions,
      count,
      length: 1,
    };
  });

  let previousFrequent: string[][] = frequentItems.map((item) => [item]);
  let k = 2;

  while (previousFrequent.length > 0) {
    const candidates = generateCandidates(previousFrequent, k);
    if (candidates.length === 0) break;

    const candidateSets = candidates.map((c) => new Set(c));
    const counts = countItemsets(transactions, candidateSets);

    const newFrequent: string[][] = [];
    for (const [key, count] of counts.entries()) {
      if (count >= minCount) {
        newFrequent.push(keyToItemset(key));
      }
    }

    if (newFrequent.length === 0) break;

    for (const items of newFrequent) {
      const key = itemsetToKey(items);
      const count = counts.get(key) ?? 0;
      frequentItemsets.push({
        items: [...items].sort(),
        support: count / totalTransactions,
        count,
        length: k,
      });
    }

    previousFrequent = newFrequent;
    k++;
  }

  return frequentItemsets;
}

function generateCandidates(previousFrequent: string[][], k: number): string[][] {
  const candidates: string[][] = [];
  const seen = new Set<string>();

  for (let i = 0; i < previousFrequent.length; i++) {
    for (let j = i + 1; j < previousFrequent.length; j++) {
      const a = previousFrequent[i];
      const b = previousFrequent[j];

      // Join step: merge if first k-2 items are identical
      let canJoin = true;
      for (let idx = 0; idx < k - 2; idx++) {
        if (a[idx] !== b[idx]) {
          canJoin = false;
          break;
        }
      }

      if (!canJoin) continue;

      const union = [...new Set([...a, ...b])].sort();
      if (union.length !== k) continue;

      // Prune step: check all (k-1)-subsets are frequent
      const key = itemsetToKey(union);
      if (seen.has(key)) continue;

      const allSubsetsFrequent = hasAllFrequentSubsets(union, previousFrequent);
      if (!allSubsetsFrequent) continue;

      seen.add(key);
      candidates.push(union);
    }
  }

  return candidates;
}

function hasAllFrequentSubsets(itemset: string[], previousFrequent: string[][]): boolean {
  const frequentSet = new Set(previousFrequent.map((items) => itemsetToKey(items)));

  for (let i = 0; i < itemset.length; i++) {
    const subset = [...itemset.slice(0, i), ...itemset.slice(i + 1)];
    if (!frequentSet.has(itemsetToKey(subset))) {
      return false;
    }
  }

  return true;
}
