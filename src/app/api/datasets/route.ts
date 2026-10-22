import { db } from "@/db";
import { datasets } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const transactionSchema = z.array(z.string());

const createSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  rawText: z.string().min(1),
  parsedTransactions: z.array(transactionSchema),
  itemCount: z.number().int().nonnegative(),
  transactionCount: z.number().int().nonnegative(),
  hasMargins: z.boolean().default(false),
  margins: z.record(z.string(), z.number()).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId || Number.isNaN(Number(projectId))) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(datasets)
    .where(eq(datasets.projectId, Number(projectId)))
    .orderBy(desc(datasets.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;
  const [row] = await db
    .insert(datasets)
    .values({
      projectId: data.projectId,
      name: data.name,
      rawText: data.rawText,
      parsedTransactions: data.parsedTransactions,
      itemCount: data.itemCount,
      transactionCount: data.transactionCount,
      hasMargins: data.hasMargins,
      margins: data.margins,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
