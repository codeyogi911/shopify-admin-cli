---
title: "GraphQL cost-based rate limiting"
type: pattern
source: shopify-docs
discovered: 2026-04-26
---

Shopify Admin GraphQL uses a **leaky-bucket cost model**, not request-count throttling. Each request returns:

```json
{ "extensions": { "cost": { "requestedQueryCost": 11, "actualQueryCost": 9, "throttleStatus": { "maximumAvailable": 1000, "currentlyAvailable": 991, "restoreRate": 50 } } } }
```

- **Bucket**: 1000 cost units (default).
- **Restore rate**: 50 units/second.
- **Per-query cap**: a single request can cost up to 1000 units.
- **HTTP 429** when the bucket is empty; `Retry-After` header tells you when to retry.

Implications:

1. The CLI prints `extensions.cost` to stderr when `--verbose` is set — useful for tuning page sizes.
2. `--all` paginates serially; even with 50-result pages, you'll rarely run out of budget unless the schema selection is huge.
3. Bulk Operations have no cost budget — use them for large queries (`shopify-admin-cli bulk query`).
4. Mutations cost more than queries. A `productUpdate` is around 10 units; a heavy nested mutation can be 50+.

See `cost-based-throttling.md` for the deeper version.
