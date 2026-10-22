import Papa from "papaparse";
import type { DatasetMargins, ParsedDataset } from "@/types";

interface CsvRow {
  transaction_id?: string | number;
  invoice?: string | number;
  invoice_no?: string | number;
  order?: string | number;
  basket?: string | number;
  item?: string;
  product?: string;
  product_name?: string;
  description?: string;
  sku?: string;
  margin?: string | number;
  profit?: string | number;
  [key: string]: unknown;
}

export function parseTransactionCsv(
  fileContent: string,
  options: { name: string } = { name: "Imported dataset" },
): ParsedDataset {
  const parseResult = Papa.parse<CsvRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
    throw new Error("Failed to parse CSV: " + parseResult.errors[0]?.message);
  }

  const transactionsMap = new Map<string, string[]>();
  const margins = new Map<string, number>();
  let hasMargins = false;

  for (const row of parseResult.data) {
    const txId = String(
      row.transaction_id ?? row.invoice ?? row.invoice_no ?? row.order ?? row.basket ?? ""
    );
    const itemName = String(
      row.item ?? row.product ?? row.product_name ?? row.description ?? row.sku ?? ""
    ).trim();

    if (!itemName) continue;

    const normalizedItem = itemName.toLowerCase();
    const items = transactionsMap.get(txId) ?? [];
    if (!items.includes(normalizedItem)) {
      items.push(normalizedItem);
    }
    transactionsMap.set(txId, items);

    const marginValue = Number(row.margin ?? row.profit ?? NaN);
    if (!Number.isNaN(marginValue)) {
      const existing = margins.get(normalizedItem);
      if (existing === undefined) {
        margins.set(normalizedItem, marginValue);
      } else {
        margins.set(normalizedItem, (existing + marginValue) / 2);
      }
      hasMargins = true;
    }
  }

  const transactions = [...transactionsMap.values()].filter((tx) => tx.length > 0);

  if (transactions.length === 0) {
    // Fallback: treat each row as a single-item transaction
    for (const row of parseResult.data) {
      const itemName = String(
        row.item ?? row.product ?? row.product_name ?? row.description ?? row.sku ?? ""
      ).trim();
      if (itemName) {
        transactions.push([itemName.toLowerCase()]);
      }
    }
  }

  const uniqueItems = new Set<string>();
  for (const tx of transactions) {
    for (const item of tx) uniqueItems.add(item);
  }

  const marginRecord: DatasetMargins = {};
  for (const [item, margin] of margins.entries()) {
    marginRecord[item] = Number(margin.toFixed(2));
  }

  return {
    name: options.name,
    transactions,
    itemCount: uniqueItems.size,
    transactionCount: transactions.length,
    margins: hasMargins ? marginRecord : undefined,
    hasMargins,
  };
}

export function parseCompactCsv(
  fileContent: string,
  options: { name: string } = { name: "Imported dataset" },
): ParsedDataset {
  const lines = fileContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const transactions = lines.map((line) =>
    line
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

  const uniqueItems = new Set<string>();
  for (const tx of transactions) {
    for (const item of tx) uniqueItems.add(item);
  }

  return {
    name: options.name,
    transactions,
    itemCount: uniqueItems.size,
    transactionCount: transactions.length,
    hasMargins: false,
  };
}
