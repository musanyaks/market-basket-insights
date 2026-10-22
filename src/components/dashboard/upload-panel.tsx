"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import type { ParsedDataset } from "@/types";
import { parseCompactCsv, parseTransactionCsv } from "@/lib/csv-parser";

interface UploadPanelProps {
  onDatasetParsed: (dataset: ParsedDataset) => void;
}

const SAMPLE_DATA = `milk,bread,butter
bread,butter,jam,milk
milk,bread
butter,jam
milk,bread,butter,jam
eggs,bread,milk
milk,butter
bread,jam
milk,bread,butter
cheese,bread,wine`;

export function UploadPanel({ onDatasetParsed }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    const text = await file.text();
    setFileName(file.name);

    try {
      const dataset = parseTransactionCsv(text, { name: file.name });
      onDatasetParsed(dataset);
    } catch {
      const fallback = parseCompactCsv(text, { name: file.name });
      onDatasetParsed(fallback);
    }
  };

  const loadSample = () => {
    setFileName("sample-baskets.csv");
    const dataset = parseCompactCsv(SAMPLE_DATA, { name: "sample-baskets.csv" });
    onDatasetParsed(dataset);
  };

  return (
    <Card title="Upload transaction data" subtitle="CSV with transaction_id and item columns, or one basket per line">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="rounded-full bg-white p-3 shadow-sm">
          <Upload className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-900">
          Drop a CSV file here, or{" "}
          <label className="cursor-pointer text-indigo-600 hover:underline">
            browse
            <input
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-slate-500">Supports standard retail CSVs or compact baskets</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={loadSample}>
          Load sample data
        </Button>
        {fileName && (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {fileName}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText className="h-4 w-4" />
          Expected formats
        </div>
        <div className="mt-2 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-medium">Standard retail CSV</p>
            <p>transaction_id,item,margin</p>
          </div>
          <div>
            <p className="font-medium">Compact baskets</p>
            <p>milk,bread,butter</p>
            <p>bread,jam,eggs</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
