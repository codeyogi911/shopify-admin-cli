---
title: "B2B features — Shopify Plus only"
type: gotcha
source: shopify-docs
discovered: 2026-04-26
---

**What.** B2B GraphQL types and mutations are gated to Shopify Plus stores:

- `Company`, `CompanyContact`, `CompanyLocation`
- `Catalog`, `CatalogContext`
- `PriceList`
- `PaymentTerms`, `PaymentSchedule`
- B2B-specific `Customer.companyContactProfiles`

On non-Plus stores, queries against these types return `null` or omit the fields entirely from introspection. Mutations fail with a `forbidden` or schema-not-found error.

**Why.** Shopify monetises B2B as a Plus-only feature. The schema is exposed to all stores so apps can be schema-aware, but execution is gated.

**How to apply.**

1. Check the store's plan first: `shopify-admin-cli shop info --json | jq .plan`.
   - `displayName: "Shopify Plus"` or `shopifyPlus: true` → B2B available.
2. Don't try to use B2B mutations on non-Plus stores — the error message ("Field not found on type Mutation") is misleading.
3. For Fix Coffee specifically: not Plus → no B2B mutations.

**Bypass.** None. Upgrade the plan or model B2B as regular orders with metafields.
