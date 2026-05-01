# shopify-admin-cli-resources

Every resource × action and the GraphQL operation it wraps. Use this as a reference when reaching for a specific operation.

The `shopify-admin-cli <resource> <action> --help` command prints the same flag table inline; this file is for offline / overview use.

## Resource catalogue

### `products` — Product catalog

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `products(first, after, query)` | Cursor pagination via `--all`. `--query` accepts Shopify search syntax |
| `get` | `product(id)` | Returns variants, media, metafields |
| `create` | `productCreate(input: ProductInput!)` | Pass `--body` for full input |
| `update` | `productUpdate(input: ProductInput!)` | Partial update — only declared fields change |
| `set` | `productSet(input: ProductSetInput!)` | **Full replace** — omitted fields are dropped |
| `delete` | `productDelete(input: ProductDeleteInput!)` | |

### `orders` — Orders

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `orders(first, after, query)` | Sorted by `createdAt DESC` |
| `get` | `order(id)` | Returns line items, fulfillments, transactions, refunds |
| `cancel` | `orderCancel(orderId, reason, refund, restock, ...)` | Refund + restock by default |
| `close` | `orderClose(input)` | Marks as fulfilled and archived |
| `reopen` | `orderOpen(input)` | Re-opens a closed order |
| `edit-begin` | `orderEditBegin(id)` | Returns calculatedOrder GID for stage/commit |
| `edit-stage` | `orderEditAddVariant(id, variantId, quantity)` | Or pass `--body` for other staging mutations |
| `edit-commit` | `orderEditCommit(id, notifyCustomer, staffNote)` | Finalise the edit |

### `customers` — Customers

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `customers(first, after, query)` | |
| `get` | `customer(id)` | Returns addresses + metafields |
| `search` | `customers(first: 1, query: "email:...")` | Email lookup shortcut |
| `create` | `customerCreate(input)` | |
| `update` | `customerUpdate(input)` | |
| `delete` | `customerDelete(input)` | Redacts the customer |
| `segments-list` | `segments(first, after)` | Marketing segments |

### `inventory` — Inventory levels

| Action | GraphQL operation | Notes |
|---|---|---|
| `levels-list` | `inventoryItem(id) { inventoryLevels { ... } }` | Per-location quantities |
| `locations-list` | `locations(first, after)` | All locations |
| `adjust` | `inventoryAdjustQuantities(input)` | Delta-style |
| `set` | `inventorySetQuantities(input)` | Absolute quantity |

### `collections` — Collections

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `collections(first, after, query)` | |
| `get` | `collection(id)` | Returns products + ruleSet |
| `create` | `collectionCreate(input)` | |
| `update` | `collectionUpdate(input)` | |
| `products-add` | `collectionAddProductsV2(id, productIds)` | Manual collections only |
| `products-remove` | `collectionRemoveProducts(id, productIds)` | Manual collections only |

### `discounts` — Code + automatic discounts

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `discountNodes(first, after, query)` | Both code + automatic |
| `get` | `discountNode(id)` | |
| `create-code` | `discountCodeBasicCreate(basicCodeDiscount)` | Pass `--body` |
| `create-automatic` | `discountAutomaticBasicCreate(automaticBasicDiscount)` | Pass `--body` |
| `deactivate` | `discountCodeDeactivate(id)` | |

### `metafields` — Metafields (any owner)

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `node(ownerId) { ... metafields(first, namespace, key) }` | Owner-typed query |
| `get` | `node(id)` | Single metafield by GID |
| `set` | `metafieldsSet(metafields)` | Batch upsert |
| `delete` | `metafieldsDelete(metafields)` | Batch delete |

### `fulfillment` — Fulfillment + holds

| Action | GraphQL operation | Notes |
|---|---|---|
| `create` | `fulfillmentCreate(fulfillment: FulfillmentInput)` | Post-2025-04 mutation |
| `update-tracking` | `fulfillmentTrackingInfoUpdate(...)` | |
| `cancel` | `fulfillmentCancel(id)` | |
| `hold` | `fulfillmentOrderHold(id, fulfillmentHold)` | Place fulfillment-order on hold |
| `release` | `fulfillmentOrderReleaseHold(id)` | |

### `refunds` — Refunds

| Action | GraphQL operation | Notes |
|---|---|---|
| `preview` | (placeholder; see `references/knowledge/idempotency-refunds.md`) | |
| `create` | `refundCreate(input)` | **Always pass `--idempotency-key`** |

### `draft-orders` — Draft orders

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `draftOrders(first, after, query)` | |
| `get` | `draftOrder(id)` | |
| `create` | `draftOrderCreate(input)` | |
| `update` | `draftOrderUpdate(id, input)` | |
| `complete` | `draftOrderComplete(id, paymentPending)` | Creates a real Order |
| `send-invoice` | `draftOrderInvoiceSend(id, email)` | Email customer |

### `returns` — Returns + return refunds

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `returns(first, after, query)` | |
| `request` | `returnRequest(input)` | |
| `approve` | `returnApproveRequest(input)` | |
| `decline` | `returnDeclineRequest(input)` | |
| `refund` | `returnRefund(returnRefundInput)` | |

### `files` — Files (staged uploads)

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `files(first, after, query)` | |
| `upload` | `stagedUploadsCreate` → multipart POST → `fileCreate` | Three-step flow with FormData |
| `delete` | `fileDelete(fileIds)` | Batch |

### `webhooks` — Webhook subscriptions

| Action | GraphQL operation | Notes |
|---|---|---|
| `list` | `webhookSubscriptions(first, after)` | |
| `create` | `webhookSubscriptionCreate(topic, webhookSubscription)` | HTTP/EventBridge/PubSub |
| `delete` | `webhookSubscriptionDelete(id)` | |

### `bulk` — Bulk operations

| Action | GraphQL operation | Notes |
|---|---|---|
| `query` | `bulkOperationRunQuery(query)` | Pass `--query-file` |
| `query-status` | `currentBulkOperation` | Poll until COMPLETED |
| `query-cancel` | `bulkOperationCancel(id)` | |
| `mutation` | `bulkOperationRunMutation(mutation, stagedUploadPath)` | JSONL upload required first |
| `mutation-status` | `currentBulkOperation` | |

### `gql` — Generic escape hatch

| Action | GraphQL operation | Notes |
|---|---|---|
| `run` | (any) | `--query` or `--query-file`; `--variables` or `--variables-file` |

### `introspect` — Schema discovery

| Action | GraphQL operation | Notes |
|---|---|---|
| `full` | `__schema { types, directives, queryType, mutationType }` | Pipe to jq |
| `type` | `__type(name)` | Single-type fields/inputs/enums |
| `queries` | `__schema.queryType.fields` | All root queries |
| `mutations` | `__schema.mutationType.fields` | All root mutations |

### `shop` — Store metadata

| Action | GraphQL operation | Notes |
|---|---|---|
| `info` | `shop { ... }` | First call to validate auth |
| `scopes` | `currentAppInstallation.accessScopes` | What the token can do |
| `rate-limit` | `shop { id }` (probe) | Use `--verbose` to see cost extensions |
