---
title: "Refund idempotency — always set --idempotency-key"
type: business-rule
source: shopify-docs
discovered: 2026-04-26
applies-to: ["refunds.create"]
---

**What.** Every `refunds create` call MUST carry `--idempotency-key`. Without it, a transient network error followed by a retry creates a *second* refund — Shopify will charge the customer twice on the wrong direction.

**Why.** `refundCreate` is a money-moving mutation. Network errors in the response path (e.g., 504 from a load balancer after the refund is already booked) leave the client unsure whether it succeeded. Without an idempotency key, retrying re-creates the refund.

**How to apply.**

1. Generate a deterministic key tied to the source event:
   ```
   FCS-REFUND-<order-gid>      # for Fix Coffee
   <ticket-id>-<line-item-id>  # for support-driven refunds
   ```
2. Pass it via `--idempotency-key`. The CLI forwards the value as the GraphQL variable `$idempotencyKey`. For mutations that support `@idempotent(key:)`, embed `@idempotent(key: $idempotencyKey)`. For mutations that take an `idempotencyKey` field on the input shape, reference it from `--body`.
3. Re-running the same key returns the same refund record (Shopify dedupes by key).
4. Keep keys for at least 24 hours; Shopify retains the dedupe window roughly that long.

**Example.**

```bash
KEY="FCS-REFUND-$(echo $ORDER_GID | tr '/' '_')"
shopify-admin-cli refunds create \
  --idempotency-key "$KEY" \
  --body "$(jq -n --arg oid "$ORDER_GID" --arg key "$KEY" '
    { orderId: $oid,
      note: "Customer return — full refund",
      transactions: [{ orderId: $oid, kind: "REFUND", amount: "1500.00", parentId: "<gid>", gateway: "razorpay" }],
      refundLineItems: [{ lineItemId: "<gid>", quantity: 1, restockType: "RETURN" }]
    }')"
```

**Anti-patterns.**

- ❌ Auto-generating a fresh UUID for the key on each call.
- ❌ Skipping the key because "the call usually succeeds".
- ❌ Reusing a key across different refunds (collision yields stale response).
