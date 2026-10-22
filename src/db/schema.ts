import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  rawText: text("raw_text").notNull(),
  parsedTransactions: jsonb("parsed_transactions").notNull().$type<string[][]>(),
  itemCount: integer("item_count").notNull(),
  transactionCount: integer("transaction_count").notNull(),
  hasMargins: boolean("has_margins").default(false).notNull(),
  margins: jsonb("margins").$type<Record<string, number>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  datasetId: integer("dataset_id").references(() => datasets.id, { onDelete: "cascade" }),
  algorithm: text("algorithm").notNull(),
  minSupport: real("min_support").notNull(),
  minConfidence: real("min_confidence").notNull(),
  minLift: real("min_lift").notNull(),
  rules: jsonb("rules").notNull(),
  frequentItemsets: jsonb("frequent_itemsets").notNull(),
  summary: jsonb("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
