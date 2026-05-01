---
title: "Global IDs (GIDs)"
type: pattern
source: shopify-docs
discovered: 2026-04-26
---

Every Shopify Admin GraphQL id is a Global ID:

```
gid://shopify/Order/123456789
gid://shopify/Product/987654321
gid://shopify/Customer/111222333
gid://shopify/InventoryItem/444555666
gid://shopify/Location/777888999
```

Always pass the **full GID**, not just the numeric suffix. The CLI does not auto-prefix.

Common types you'll encounter:

- `Order`, `OrderTransaction`, `Refund`
- `Product`, `ProductVariant`, `Collection`
- `Customer`, `CustomerAddress`, `Segment`
- `InventoryItem`, `InventoryLevel`, `Location`, `FulfillmentOrder`, `Fulfillment`
- `DraftOrder`, `LineItem`
- `DiscountNode`, `DiscountCodeNode`
- `Metafield`
- `WebhookSubscription`
- `BulkOperation`
- `MediaImage`, `Video`, `GenericFile`

Inverse (numeric → GID): `gid://shopify/<Type>/<numeric>`. Inverse (GID → numeric): split on `/` and take the last segment.

Helpful jq snippet:

```
shopify-admin-cli orders list --first 5 --json \
  | jq '[.nodes[] | {gid: .id, num: (.id | split("/") | last)}]'
```
