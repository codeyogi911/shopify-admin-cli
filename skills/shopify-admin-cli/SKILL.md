---
name: shopify-admin-cli
description: Drive end-to-end workflows on the Shopify Admin GraphQL API via shopify-admin-cli. Use whenever the user asks to list, get, create, update, delete, search, refund, fulfill, upload files, introspect schema, or run bulk operations against Shopify products, orders, customers, inventory, collections, discounts, metafields, returns, webhooks, or raw GraphQL. Also use when the user needs auth setup, scope guidance, or Shopify-specific gotchas before making changes.
allowed-tools:
  - Bash
  - Read
  - Write
---

# shopify-admin-cli

Use `shopify-admin-cli` as the agent-facing wrapper around the Shopify Admin
GraphQL API. The CLI uses `@shopify/shopify-api` in custom-app mode with a
static admin token. One resource x one action maps to one GraphQL operation.

## When to use

Use this skill whenever the user asks to:

- manage Shopify `products`, `orders`, `customers`, `inventory`,
  `collections`, `discounts`, `metafields`, `fulfillment`, `refunds`,
  `draft-orders`, `returns`, `files`, or `webhooks`
- run a Shopify bulk query or bulk mutation workflow
- introspect the Shopify Admin GraphQL schema
- run raw Shopify GraphQL
- configure auth, scopes, token rotation, or troubleshoot 401/403 failures
- explain Shopify-specific gotchas before or during a workflow

## Setup

Authenticate with a custom-app admin API access token:

```bash
export SHOPIFY_STORE_URL=your-store.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...
shopify-admin-cli shop info --json
```

Read [references/auth.md](references/auth.md) when the user needs token minting,
scope selection, persisted login behavior, API-version notes, or rotation help.

## Required safety pass before mutations

Before running any mutating command, read every file in
`references/knowledge/`. These files capture Shopify rules the CLI does not
enforce for you, including:

- cost-based throttling and rate-limit retry behavior
- global ID formats
- refund idempotency
- `productSet` vs `productUpdate`
- three-phase order edits
- staged uploads
- bulk-operation lifecycle
- B2B Plus-only gating
- `created_at:` search timezone behavior

Treat those bundled files as the source of truth for mutation safety.

## Workflow

1. If the user needs auth help, read `references/auth.md` first.
2. Before any mutation, read every file under `references/knowledge/`.
3. Validate auth with:

   ```bash
   shopify-admin-cli shop info --json
   ```

4. If you need the command surface or GraphQL mapping, read
   [references/resources.md](references/resources.md).
5. Prefer the purpose-built CLI action over explaining raw API docs when the
   CLI already supports the task.
6. Use `--dry-run` before risky or complex writes.
7. Use `--verbose` when you need `extensions.cost` or deprecation details.
8. Use `--all` for connection pagination, or switch to bulk operations for very
   large reads.

## Quick reference

Read [references/resources.md](references/resources.md) for the full resource x
action catalogue. Common entry points:

- `shopify-admin-cli shop info --json`
- `shopify-admin-cli products list --json`
- `shopify-admin-cli orders list --query "name:#1234" --json`
- `shopify-admin-cli customers search --email customer@example.com --json`
- `shopify-admin-cli files upload --file ./hero.jpg --alt "Product hero shot"`
- `shopify-admin-cli bulk query --query-file ./bulk-orders.graphql --json`
- `shopify-admin-cli introspect type --name Order --json`
- `shopify-admin-cli gql run --query 'query { shop { name } }' --json`

## Mutation guardrails

- Always pass full Shopify GIDs such as `gid://shopify/Order/123456789`.
- Always use `--idempotency-key` for `refunds create`.
- Use `products update` for partial changes; reserve `products set` for
  full-document replacement.
- Use the order-edit flow `edit-begin` -> `edit-stage` -> `edit-commit` for
  line-item changes.
- Use the staged upload flow for file creation instead of inventing your own
  upload sequence.
- Check plan and scope assumptions before using B2B features.

## Schema discovery

When the right operation shape is unclear, prefer live schema discovery:

```bash
shopify-admin-cli introspect type --name Order --json
shopify-admin-cli introspect mutations --json
shopify-admin-cli introspect queries --json
```

## Maintaining the bundled references

This published skill is intentionally self-contained. Its bundled reference
files live under `references/`.

When the repo-root knowledge or helper skills change, refresh this published
copy from the repository root with:

```bash
npm run sync:published-skill
```
