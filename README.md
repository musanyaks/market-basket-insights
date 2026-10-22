# BasketIQ — Market Basket Insights Engine

An advanced, full-stack association-rule mining platform for retail teams. Upload transaction data, run Apriori or FP-Growth, and surface actionable shelf-placement, bundling, and cross-sell recommendations.

> Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Drizzle ORM**, and **PostgreSQL**.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Algorithms](#algorithms)
4. [Getting Started](#getting-started)
5. [Usage](#usage)
6. [CSV Format](#csv-format)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Metrics Reference](#metrics-reference)
10. [Development](#development)
11. [License](#license)

---

## Features

- **Dual algorithm engine** — switch between Apriori and FP-Growth without changing your data.
- **Rich association metrics** — support, confidence, lift, leverage, conviction, and Zhang's metric.
- **Business impact estimation** — projected revenue uplift and per-item margin impact.
- **Interactive dashboards** — top-rules chart, support-vs-confidence scatter plot, product network graph.
- **Project workspaces** — organize datasets and analyses into persistent projects.
- **CSV flexibility** — accepts standard retail CSVs or compact one-basket-per-line files.
- **Exportable results** — download discovered rules as CSV for stakeholders.
- **Fully typed** — end-to-end TypeScript with Drizzle ORM.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│   Upload CSV · Configure thresholds · View charts & rules   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     Next.js App Router                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  /api/projects│  │  /api/datasets│  │   /api/analyze   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   Analytics Engine (TS)                     │
│              Apriori  ·  FP-Growth  ·  Metrics              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Drizzle ORM  ·  PostgreSQL                     │
│         projects · datasets · analyses                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Algorithms

### Apriori

A level-wise, candidate-generation algorithm. It discovers frequent itemsets by iteratively joining smaller frequent itemsets and pruning candidates whose subsets are infrequent.

Best for: smaller or sparse datasets, educational inspection of each itemset level.

### FP-Growth

A divide-and-conquer algorithm that compresses transactions into a Frequent Pattern tree (FP-tree) and recursively mines conditional pattern bases. It avoids explicit candidate generation, making it significantly faster on dense datasets.

Best for: larger retail baskets, faster discovery of long itemsets.

### Association Rules

After frequent itemsets are discovered, all non-empty disjoint splits of each itemset are evaluated as candidate rules and filtered by:

- `minSupport`
- `minConfidence`
- `minLift`

Rules are ranked by lift by default.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or the sandbox database provided)
- npm or pnpm

### Installation

```bash
npm install
```

### Database

The project expects `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

Push the schema:

```bash
npx drizzle-kit push
```

### Run

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Usage

1. **Create a project** from the sidebar, or use the default workspace.
2. **Upload a CSV** of transactions. Either format works:
   - Standard retail: `transaction_id,item,margin`
   - Compact baskets: one basket per line, items separated by commas
3. **Choose an algorithm** and tune thresholds:
   - Minimum support
   - Minimum confidence
   - Minimum lift
4. Click **Run market basket analysis**.
5. Explore the **Overview**, **Rules**, and **Network** tabs.
6. **Export rules** as CSV or save datasets back to the project.

---

## CSV Format

### Standard retail CSV

```csv
transaction_id,item,margin
T001,milk,0.30
T001,bread,0.50
T001,butter,0.40
T002,bread,0.50
T002,jam,0.60
T002,milk,0.30
```

If `margin` is provided, BasketIQ estimates the profit impact of each rule.

### Compact baskets

```csv
milk,bread,butter
bread,jam,eggs
milk,eggs
```

Each row is treated as one transaction.

---

## API Reference

### Projects

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a project `{ name, description? }` |
| GET | `/api/projects/[id]` | Get a single project |
| PATCH | `/api/projects/[id]` | Update a project |
| DELETE | `/api/projects/[id]` | Delete a project |

### Datasets

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/datasets?projectId=1` | List datasets for a project |
| POST | `/api/datasets` | Save a parsed dataset |

### Analysis

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analyze?projectId=1` | List saved analyses |
| POST | `/api/analyze` | Run analysis on a dataset |

**Request body**

```json
{
  "dataset": {
    "name": "Q1 Retail",
    "transactions": [["milk", "bread"], ["bread", "butter"]],
    "itemCount": 3,
    "transactionCount": 2,
    "hasMargins": false,
    "margins": { "milk": 0.3, "bread": 0.5, "butter": 0.4 }
  },
  "config": {
    "algorithm": "fp-growth",
    "minSupport": 0.1,
    "minConfidence": 0.3,
    "minLift": 1.0
  },
  "projectId": 1,
  "save": false
}
```

**Response**

```json
{
  "rules": [...],
  "frequentItemsets": [...],
  "summary": {
    "totalTransactions": 2,
    "uniqueItems": 3,
    "totalRules": 1,
    "avgLift": 1.5,
    "maxLift": 1.5,
    "avgConfidence": 0.75,
    "topRule": {...},
    "algorithm": "fp-growth",
    "durationMs": 12
  }
}
```

---

## Database Schema

### `projects`

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Project ID |
| name | text | Project name |
| description | text | Optional description |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update time |

### `datasets`

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Dataset ID |
| projectId | integer FK | Owning project |
| name | text | Dataset name |
| rawText | text | Original CSV content |
| parsedTransactions | jsonb | Parsed baskets |
| itemCount | integer | Unique product count |
| transactionCount | integer | Basket count |
| hasMargins | boolean | Whether margin data exists |
| margins | jsonb | Item-level margin map |
| createdAt | timestamp | Creation time |

### `analyses`

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Analysis ID |
| projectId | integer FK | Owning project |
| datasetId | integer FK | Source dataset (optional) |
| algorithm | text | Algorithm used |
| minSupport | real | Support threshold |
| minConfidence | real | Confidence threshold |
| minLift | real | Lift threshold |
| rules | jsonb | Discovered rules |
| frequentItemsets | jsonb | Frequent itemsets |
| summary | jsonb | Analysis summary |
| createdAt | timestamp | Creation time |

---

## Metrics Reference

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| **Support** | P(A ∪ B) | Frequency of the itemset in all transactions |
| **Confidence** | P(B \| A) = support(A ∪ B) / support(A) | Likelihood of B given A |
| **Lift** | confidence / support(B) | Strength over random chance; > 1 is meaningful |
| **Leverage** | support(A ∪ B) − support(A) · support(B) | Difference from independence |
| **Conviction** | (1 − support(B)) / (1 − confidence) | Implication strength; higher is stronger |
| **Zhang's Metric** | leverage / max(...) | Normalized association/disassociation (−1 to 1) |

---

## Development

### Type checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

### Run production build

```bash
npm run build
npm run start
```

---

## License

MIT — free to use, modify, and distribute.
