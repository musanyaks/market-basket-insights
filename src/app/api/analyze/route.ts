import { db } from "@/db";
import { analyses } from "@/db/schema";
import { analyzeDataset } from "@/lib/analytics/engine";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const analyzeSchema = z.object({
  dataset: z.object({
    name: z.string(),
    transactions: z.array(z.array(z.string())),
    itemCount: z.number().int().nonnegative(),
    transactionCount: z.number().int().nonnegative(),
    hasMargins: z.boolean().default(false),
    margins: z.record(z.string(), z.number()).optional(),
  }),
  config: z.object({
    algorithm: z.enum(["apriori", "fp-growth"]),
    minSupport: z.number().min(0).max(1),
    minConfidence: z.number().min(0).max(1),
    minLift: z.number().min(0),
  }),
  projectId: z.number().int().positive().optional(),
  save: z.boolean().default(false),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { dataset, config, projectId, save } = parsed.data;
  const result = analyzeDataset(dataset, config);

  if (save && projectId) {
    await db.insert(analyses).values({
      projectId,
      datasetId: null,
      algorithm: config.algorithm,
      minSupport: config.minSupport,
      minConfidence: config.minConfidence,
      minLift: config.minLift,
      rules: result.rules,
      frequentItemsets: result.frequentItemsets,
      summary: result.summary,
    });
  }

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId || Number.isNaN(Number(projectId))) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.projectId, Number(projectId)))
    .orderBy(desc(analyses.createdAt));

  return NextResponse.json(rows);
}
