---
title: "Cost-based throttling — deep dive"
type: pattern
source: shopify-docs
discovered: 2026-04-26
---

Every Admin GraphQL response carries `extensions.cost`. Treat this as the source of truth for what your token's budget looks like — not the request count.

```
extensions.cost.throttleStatus = {
  maximumAvailable: 1000,        // bucket size
  currentlyAvailable: 991,       // remaining now
  restoreRate: 50                // units/second refilled
}
```

Strategy:

- **Backoff on 429.** `Retry-After` (seconds) is set on 429 responses. The CLI maps 429 → `{ code: "rate_limited", retryable: true, retryAfter: N }`. The CLI does NOT auto-retry; callers should sleep `retryAfter` and re-issue.
- **Pre-flight cost.** For complex queries, request `extensions.cost.requestedQueryCost` from a low-cost probe before committing — it's deterministic.
- **Page size.** Default `--first 50` keeps `requestedQueryCost` ~50–150 for most resources. Larger pages save round-trips at the cost of bucket depth.
- **Bulk operations.** For >1000 unit queries, use `bulk query` — no cost budget.

Plus stores get a higher bucket (default 2000 with 100/s restore). Custom-app rate limits respect the store's plan.
