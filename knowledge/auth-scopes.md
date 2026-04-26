---
title: "Admin API access scopes"
type: pattern
source: shopify-docs
discovered: 2026-04-26
---

**What.** Every Shopify Admin GraphQL operation requires one or more scopes on the access token. The token is minted with a fixed scope set in the admin UI; the CLI inherits that.

**How to apply.**

1. Pick the minimum scopes for your use case (see table below).
2. Mint the token: Admin → Apps → Develop apps → app → Configure Admin API scopes → Install → Reveal token.
3. Inspect the granted scopes:
   ```bash
   shopify-admin-cli shop scopes --json
   ```

**Recommended starting set.**

| Scope | Lets you |
|---|---|
| `read_products`, `write_products` | Products, variants, media |
| `read_orders`, `write_orders` | Orders, transactions, refunds |
| `read_customers`, `write_customers` | Customers, addresses, segments |
| `read_inventory`, `write_inventory` | Inventory levels, adjustments |
| `read_locations` | Location list |
| `read_fulfillments`, `write_fulfillments` | Fulfillment + tracking |
| `read_shipping` | Carrier services, delivery profiles |
| `read_discounts`, `write_discounts` | Code + automatic discounts |
| `read_files`, `write_files` | Files API + staged uploads |
| `read_returns`, `write_returns` | Returns + return refunds |

For B2B work add `read_companies`, `read_payment_terms`, `read_companies_catalog` (Plus only — see `b2b-plus-only.md`).

**Symptoms of missing scope.** `forbidden` (HTTP 403) with the error message naming the scope. The CLI maps this to `{ code: "forbidden" }` — no auto-retry.

**Rotation.** Reinstalling the app generates a new token; the previous one keeps working until you uninstall.
