---
title: "productSet vs productUpdate — full replace vs partial"
type: gotcha
source: shopify-docs
discovered: 2026-04-26
applies-to: ["products.update", "products.set"]
---

**What.** `productSet` is a full-document replace: omitted fields are *dropped*, including variants and media. `productUpdate` is partial — only declared fields change.

**Why.** The two mutations exist for different workflows:

- `productSet` was added for catalogue-rebuild use cases where you have the entire product spec in hand and want atomic replacement (variants, options, media, all together).
- `productUpdate` is the day-to-day partial-edit mutation.

If you call `productSet` with only `{ id, title }`, Shopify will keep the title and **delete every variant and image** the product had.

**How to apply.**

| Use case | Mutation |
|---|---|
| "Change title from X to Y" | `productUpdate` |
| "Tag this product as new-arrival" | `productUpdate` |
| "Update the description" | `productUpdate` |
| "Sync the entire catalogue from a CSV/spec" | `productSet` (with full input) |
| "Replace all variants atomically" | `productSet` (with full variants array) |
| "Migrate to a new options shape" | `productSet` (with full options + variants) |

If you're not sure: use `productUpdate`. The exemplar default is `update`; `set` requires `--body` so it's harder to misuse accidentally.

**Verification.** Run `--dry-run` first and inspect the input. If `variants` is missing from a `productSet` call but the product has variants, abort.
