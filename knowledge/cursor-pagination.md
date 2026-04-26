---
title: "Cursor pagination via pageInfo"
type: pattern
source: shopify-docs
discovered: 2026-04-26
applies-to: ["products.list", "orders.list", "customers.list", "collections.list", "draft-orders.list", "returns.list", "files.list", "discounts.list", "webhooks.list", "inventory.locations-list", "customers.segments-list"]
---

Shopify Admin GraphQL paginates connection fields via `pageInfo`:

```graphql
products(first: 50, after: $cursor) {
  nodes { id title }
  pageInfo { hasNextPage endCursor }
}
```

The CLI's `--all` flag walks all pages by feeding back `pageInfo.endCursor` as the next `after` until `hasNextPage` is false. The combined array is emitted at the end.

For very large datasets, use `bulk query` instead — the Bulk Operations API runs the query asynchronously and returns a JSONL file with no pagination at all. See `bulk-operations.md`.

Cursors are not stable across API version upgrades. Treat them as ephemeral within a session.
