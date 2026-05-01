---
title: "Order editing — three phases (begin → stage → commit)"
type: pattern
source: shopify-docs
discovered: 2026-04-26
applies-to: ["orders.edit-begin", "orders.edit-stage", "orders.edit-commit"]
---

**What.** Editing an existing order's line items requires a transactional flow:

1. `orderEditBegin(id)` → returns a `calculatedOrder` GID.
2. `orderEditAddVariant`, `orderEditAddCustomItem`, `orderEditSetQuantity`, `orderEditRemoveLineItem`, etc., all called against the `calculatedOrder` GID. None of these mutations modify the real order yet.
3. `orderEditCommit(id, notifyCustomer, staffNote)` finalises the staged edits onto the real order.

**Why.** Order edits affect tax calculation, fulfilment status, payment authorisations, and the customer's invoice. Shopify needs a staging area to recompute totals atomically before committing.

**How to apply.**

```bash
# Phase 1 — begin
CALC=$(shopify-admin-cli orders edit-begin --id "gid://shopify/Order/123" --json | jq -r .orderEditBegin.calculatedOrder.id)

# Phase 2 — stage (one or more)
shopify-admin-cli orders edit-stage --id "$CALC" --variantId "gid://shopify/ProductVariant/456" --quantity 1

# Phase 3 — commit
shopify-admin-cli orders edit-commit --id "$CALC" --notifyCustomer --staffNote "Added missing item per support ticket #4321"
```

**Anti-patterns.**

- ❌ Calling `orderUpdate` to add a line item — `orderUpdate` only handles metadata (note, tags, customer, shipping address).
- ❌ Discarding the calculatedOrder GID without committing — the staged edits silently abandon after a timeout.
- ❌ Committing without `notifyCustomer` when the financial total changed — the customer should know.

**Limits.** Order editing is restricted on certain order states (cancelled, archived, refunded above a threshold). Check `order.canEdit` before beginning.
