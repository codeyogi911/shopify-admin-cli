---
name: shopify-admin-cli-workflow
description: Drive end-to-end workflows on the Shopify Admin GraphQL API via shopify-admin-cli — products, orders, customers, inventory, collections, discounts, metafields, fulfillment, refunds, draft-orders, returns, files, webhooks, bulk, gql, introspect, shop. Use whenever the user asks to list/get/create/update/delete Shopify entities, look up an order by name or email, segment customers, attach files via staged uploads, run a bulk query, or send raw GraphQL. Triggers on "Shopify", "Admin API", "GraphQL", "products/orders/customers", "store management", "introspect schema", "bulk operations", "shopify-admin-cli".
metadata:
  internal: true
allowed-tools:
  - Bash
  - Read
  - Write
---

# shopify-admin-cli-workflow

Wrap the [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql) via `shopify-admin-cli`. The CLI uses [`@shopify/shopify-api`](https://www.npmjs.com/package/@shopify/shopify-api) in custom-app mode — static admin API access token, no OAuth, no session storage. Every action is a GraphQL operation; one resource × one action = one wire call.

**Before running any command, read every file in `knowledge/`.** The Shopify gotchas (cost-throttling, GID format, idempotent refunds, productSet vs productUpdate, three-phase order edits, staged uploads) are non-obvious and the CLI does not enforce them.

## Triggers

- User says `/shopify-admin-cli` or any phrasing involving the Shopify Admin API
- User asks to manipulate `products`, `orders`, `customers`, `inventory`, `collections`, `discounts`, `metafields`, `fulfillment`, `refunds`, `draft-orders`, `returns`, `files`, or `webhooks`
- User asks to introspect the Shopify schema
- User asks to run a bulk operation
- User asks for a raw GraphQL query/mutation against Shopify

## Setup

```bash
export SHOPIFY_STORE_URL=your-store.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...
shopify-admin-cli shop info --json   # smoke test
```

For integration tests, set `SHOPIFY_ADMIN_BASE_URL=http://127.0.0.1:<port>` to redirect the SDK at a mock server. See `knowledge/why-official-sdk.md` for the SDK choice rationale.

## Quick reference

| Resource | Actions | Notes |
|---|---|---|
| `products` | list, get, create, update, set, delete | Use `set` (productSet) for full replaces, `update` for partial. See `knowledge/productset-vs-productupdate.md` |
| `orders` | list, get, cancel, close, reopen, edit-begin, edit-stage, edit-commit | Three-phase order editing. See `knowledge/order-editing-three-phase.md` |
| `customers` | list, get, search, create, update, delete, segments-list | `search --email` for the common email-lookup case |
| `inventory` | levels-list, locations-list, adjust, set | `adjust` is delta; `set` is absolute |
| `collections` | list, get, create, update, products-add, products-remove | |
| `discounts` | list, get, create-code, create-automatic, deactivate | Both flavours under DiscountNode |
| `metafields` | list, get, set, delete | `metafieldsSet` upserts in batches |
| `fulfillment` | create, update-tracking, cancel, hold, release | `fulfillmentCreate` (post-2025-04 shape) |
| `refunds` | preview, create | `--idempotency-key` is mandatory; see `knowledge/idempotency-refunds.md` |
| `draft-orders` | list, get, create, update, complete, send-invoice | |
| `returns` | list, request, approve, decline, refund | |
| `files` | list, upload, delete | `upload` runs the three-step staged-uploads flow with `FormData` |
| `webhooks` | list, create, delete | HTTP/EventBridge/PubSub endpoints |
| `bulk` | query, query-status, query-cancel, mutation, mutation-status | Async lifecycle. See `knowledge/bulk-operations.md` |
| `gql` | run | Generic escape hatch — `--query` or `--query-file` |
| `introspect` | full, type, queries, mutations | Schema discovery |
| `shop` | info, scopes, rate-limit | First call when validating auth |

## Global flags

- `--json` — force JSON output (auto when piped)
- `--dry-run` — print the GraphQL operation + variables without sending
- `--verbose` — print `response.extensions` (cost throttling info) to stderr
- `--all` — auto-paginate list actions via `pageInfo.endCursor`
- `--version`, `-v`
- `--help`, `-h`

## Knowledge system

Read every file in `knowledge/` before issuing commands. Knowledge files capture API quirks, business rules, and Shopify-specific patterns. After learning something new from a live run, append a new file `knowledge/<short-topic>.md` with frontmatter `type:` set to `gotcha`, `pattern`, `shortcut`, `quirk`, or `business-rule`.

## Common workflows

### 1. Look up an order by name (support flow)

```
shopify-admin-cli orders list --query "name:#1234" --first 1 --json
```

### 2. Segment marketing-opted customers

```
shopify-admin-cli customers list --query "email_marketing_state:SUBSCRIBED" --all --json
```

### 3. Refund with idempotency

```
shopify-admin-cli refunds create \
  --idempotency-key "REFUND-$(uuidgen)" \
  --body "$(cat refund-input.json)"
```

The `--idempotency-key` is forwarded to the GraphQL request as the variable `$idempotencyKey` so callers can reference it via `@idempotent(key: $idempotencyKey)` or in the input shape. See `knowledge/idempotency-refunds.md`.

### 4. Attach a file to a product (staged upload)

```
shopify-admin-cli files upload --file ./hero.jpg --alt "Product hero shot"
```

The CLI runs `stagedUploadsCreate` → `multipart/form-data` POST (FormData) to the staged URL → `fileCreate`. See `knowledge/staged-uploads.md`.

### 5. Run a bulk query

```
shopify-admin-cli bulk query --query-file ./bulk-orders.graphql --json
shopify-admin-cli bulk query-status --json   # poll until status:COMPLETED
```

See `knowledge/bulk-operations.md` for polling cadence and JSONL parsing.

### 6. Generic GraphQL

```
shopify-admin-cli gql run \
  --query 'query { shop { name plan { displayName } } }' \
  --json
```

### 7. Schema introspection

```
shopify-admin-cli introspect type --name Order --json | jq '.fields[].name'
```
