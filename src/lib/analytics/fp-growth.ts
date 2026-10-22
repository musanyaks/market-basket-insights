import type { FrequentItemset } from "@/types";
import { itemsetToKey, keyToItemset } from "./utils";

interface FPNode {
  item: string;
  count: number;
  children: Map<string, FPNode>;
  parent: FPNode | null;
  next: FPNode | null;
}

interface HeaderEntry {
  head: FPNode | null;
  tail: FPNode | null;
  support: number;
}

export function runFPGrowth(
  transactions: string[][],
  minSupport: number,
): FrequentItemset[] {
  const totalTransactions = transactions.length;
  const minCount = minSupport * totalTransactions;

  // Pass 1: count item frequencies
  const itemCounts = new Map<string, number>();
  for (const tx of transactions) {
    for (const item of tx) {
      itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
    }
  }

  // Filter and sort frequent items by support descending
  const frequentItems = [...itemCounts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);

  const itemRank = new Map(frequentItems.map((item, idx) => [item, idx]));
  const headers = new Map<string, HeaderEntry>();
  for (const item of frequentItems) {
    headers.set(item, { head: null, tail: null, support: itemCounts.get(item) ?? 0 });
  }

  const root: FPNode = {
    item: "",
    count: 0,
    children: new Map(),
    parent: null,
    next: null,
  };

  // Pass 2: build FP-tree
  for (const tx of transactions) {
    const orderedItems = tx
      .filter((item) => itemRank.has(item))
      .sort((a, b) => (itemRank.get(a) ?? 0) - (itemRank.get(b) ?? 0));

    if (orderedItems.length === 0) continue;

    insertTransaction(root, orderedItems, 1, headers);
  }

  const frequentItemsets: FrequentItemset[] = frequentItems.map((item) => ({
    items: [item],
    support: (itemCounts.get(item) ?? 0) / totalTransactions,
    count: itemCounts.get(item) ?? 0,
    length: 1,
  }));

  // Mine the FP-tree
  mineTree(root, headers, [], minCount, totalTransactions, frequentItemsets);

  return frequentItemsets;
}

function insertTransaction(
  node: FPNode,
  items: string[],
  count: number,
  headers: Map<string, HeaderEntry>,
): void {
  if (items.length === 0) return;

  const [first, ...rest] = items;
  let child = node.children.get(first);

  if (!child) {
    child = {
      item: first,
      count: 0,
      children: new Map(),
      parent: node,
      next: null,
    };
    node.children.set(first, child);

    const header = headers.get(first);
    if (header) {
      if (!header.head) {
        header.head = child;
        header.tail = child;
      } else {
        header.tail!.next = child;
        header.tail = child;
      }
    }
  }

  child.count += count;
  insertTransaction(child, rest, count, headers);
}

function mineTree(
  treeRoot: FPNode,
  headers: Map<string, HeaderEntry>,
  prefix: string[],
  minCount: number,
  totalTransactions: number,
  result: FrequentItemset[],
): void {
  // If tree is a single path, enumerate all combinations
  const singlePath = getSinglePath(treeRoot);
  if (singlePath) {
    const pathItems = singlePath.filter((node) => node.item !== "");
    if (pathItems.length > 0) {
      generateCombinations(pathItems, prefix, totalTransactions, result);
    }
    return;
  }

  // Process items in reverse support order (bottom-up)
  const sortedItems = [...headers.entries()].sort((a, b) => a[1].support - b[1].support);

  for (const [item, header] of sortedItems) {
    if (header.support < minCount) continue;

    const newPrefix = [...prefix, item];
    const support = header.support / totalTransactions;
    result.push({
      items: [...newPrefix].sort(),
      support,
      count: Math.round(header.support),
      length: newPrefix.length,
    });

    // Build conditional pattern base
    const conditionalTransactions: string[][] = [];
    let node = header.head;
    while (node) {
      const path = getPathFromRoot(node);
      const prefixPath = path.slice(0, -1);
      if (prefixPath.length > 0) {
        for (let i = 0; i < node.count; i++) {
          conditionalTransactions.push(prefixPath);
        }
      }
      node = node.next;
    }

    if (conditionalTransactions.length === 0) continue;

    // Build conditional FP-tree
    const conditional = buildConditionalFPTree(conditionalTransactions, minCount);
    if (conditional.root.children.size > 0) {
      mineTree(conditional.root, conditional.headers, newPrefix, minCount, totalTransactions, result);
    }
  }
}

function getSinglePath(root: FPNode): FPNode[] | null {
  const path: FPNode[] = [root];
  let current = root;

  while (current.children.size > 0) {
    if (current.children.size > 1) return null;
    const child = current.children.values().next().value as FPNode;
    path.push(child);
    current = child;
  }

  return path;
}

function generateCombinations(
  pathItems: FPNode[],
  prefix: string[],
  totalTransactions: number,
  result: FrequentItemset[],
): void {
  const n = pathItems.length;

  for (let mask = 1; mask < 1 << n; mask++) {
    const combo: string[] = [];
    let minCount = Infinity;

    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        combo.push(pathItems[i].item);
        minCount = Math.min(minCount, pathItems[i].count);
      }
    }

    const items = [...prefix, ...combo].sort();
    if (items.length > prefix.length) {
      result.push({
        items,
        support: minCount / totalTransactions,
        count: minCount,
        length: items.length,
      });
    }
  }
}

function getPathFromRoot(node: FPNode): string[] {
  const path: string[] = [];
  let current: FPNode | null = node;
  while (current) {
    if (current.item) {
      path.unshift(current.item);
    }
    current = current.parent;
  }
  return path;
}

interface ConditionalFPTree {
  root: FPNode;
  headers: Map<string, HeaderEntry>;
}

function buildConditionalFPTree(
  transactions: string[][],
  minCount: number,
): ConditionalFPTree {
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

  const itemRank = new Map(frequentItems.map((item, idx) => [item, idx]));
  const headers = new Map<string, HeaderEntry>();
  for (const item of frequentItems) {
    headers.set(item, { head: null, tail: null, support: itemCounts.get(item) ?? 0 });
  }

  const root: FPNode = {
    item: "",
    count: 0,
    children: new Map(),
    parent: null,
    next: null,
  };

  for (const tx of transactions) {
    const orderedItems = tx
      .filter((item) => itemRank.has(item))
      .sort((a, b) => (itemRank.get(a) ?? 0) - (itemRank.get(b) ?? 0));

    if (orderedItems.length === 0) continue;
    insertTransaction(root, orderedItems, 1, headers);
  }

  return { root, headers };
}
