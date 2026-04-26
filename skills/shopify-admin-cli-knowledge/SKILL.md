---
name: shopify-admin-cli-knowledge
description: Capture and consult Shopify-specific business rules, gotchas, and patterns while using shopify-admin-cli. Use when the user asks "what are the gotchas with this API?", "how does cost throttling work?", "why is my refund failing idempotency?", or wants to record a new finding from a live Shopify run. Triggers on "shopify gotcha", "shopify quirk", "shopify cost", "shopify deprecated", "shopify business rule".
allowed-tools:
  - Read
  - Write
---

# shopify-admin-cli-knowledge

Knowledge base for Shopify Admin GraphQL API quirks, business rules, and patterns. Knowledge files live in `knowledge/` at the repo root.

## Read these before mutating anything

| File | Topic |
|---|---|
| `knowledge/cost-based-throttling.md` | GraphQL leaky-bucket rate limiting; `extensions.cost`; retry with backoff |
| `knowledge/cursor-pagination.md` | `pageInfo.endCursor` + `hasNextPage` traversal |
| `knowledge/gid-format.md` | All ids are global IDs (`gid://shopify/Order/12345`) |
| `knowledge/idempotency-refunds.md` | `--idempotency-key` on refunds; double-refund risk on retry |
| `knowledge/productset-vs-productupdate.md` | Full replace vs partial — silent field drop on misuse |
| `knowledge/order-editing-three-phase.md` | begin → stage → commit; never raw `orderUpdate` for line items |
| `knowledge/staged-uploads.md` | `stagedUploadsCreate` → multipart POST → `fileCreate` |
| `knowledge/bulk-operations.md` | Async lifecycle; JSONL output; one bulk op per query/mutation type at a time |
| `knowledge/b2b-plus-only.md` | B2B features (companies, catalogs, payment terms) require Plus |
| `knowledge/api-versions.md` | Quarterly release cadence; deprecation calendar; how to bump |
| `knowledge/why-official-sdk.md` | Why this CLI uses `@shopify/shopify-api` instead of zero-dep fetch |
| `knowledge/rate-limit.md` | Generic rate-limit primer (legacy stencil) |
| `knowledge/idempotency-keys.md` | Generic idempotency primer (legacy stencil) |
| `knowledge/composite-orders.md` | Generic composite-resource pattern (legacy stencil) |

## How to add a new knowledge file

When you discover a new gotcha or pattern from a live run, append a new file with this frontmatter:

```yaml
---
title: "Short title"
type: gotcha | pattern | shortcut | quirk | business-rule
discovered: YYYY-MM-DD
sources:
  - url-or-doc-reference
---
```

Then a tight body:
- **What**: one-sentence summary
- **Why**: the underlying cause
- **How to apply**: when this rule kicks in and what to do

Keep files <100 lines. Link related files via relative paths.

## Schema discovery

When you don't know the right GraphQL shape, run:

```bash
shopify-admin-cli introspect type --name <TypeName> --json | jq '.fields[] | {name, type: .type.name}'
shopify-admin-cli introspect queries --json | jq '.[] | select(.name | startswith("order"))'
```

Faster than reading docs for one-off lookups; always up-to-date with the live schema.
