---
name: shopify-admin-cli
description: >-
  Runs Shopify Admin GraphQL workflows via the shopify-admin-cli binary (custom-app admin token, no OAuth): products, orders, customers, inventory, collections, discounts, metafields, fulfillment, refunds, draft-orders, returns, files, webhooks, bulk operations, raw gql, schema introspection, and shop metadata. Use for Shopify store automation, Admin API tasks, CLI usage, token/scopes help, or mutation safety (throttling, GIDs, refunds, order edits, staged uploads).
---

# shopify-admin-cli

Machine-facing CLI over the [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql): `@shopify/shopify-api` in custom-app mode. One resource × one action → one GraphQL call.

**Commands:** `products`, `orders`, `customers`, `inventory`, `collections`, `discounts`, `metafields`, `fulfillment`, `refunds`, `draft-orders`, `returns`, `files`, `webhooks`, `bulk`, `gql`, `introspect`, `shop`.

## Install skill

Published installer: [`skills` on npm](https://www.npmjs.com/package/skills) · [vercel-labs/skills](https://github.com/vercel-labs/skills).

```bash
npx --yes skills@latest add codeyogi911/shopify-admin-cli --skill shopify-admin-cli
```

```bash
npx --yes skills@latest add https://github.com/codeyogi911/shopify-admin-cli/tree/main/skills/shopify-admin-cli
```

Forks: use the same `<owner>/<repo>` and GitHub URLs consistently across skill + CLI steps below.

## Install CLI

The binary is **not** on the public npm registry; install from the **same Git repository** as this skill.

```bash
shopify-admin-cli --version 2>/dev/null || npm install -g "git+https://github.com/codeyogi911/shopify-admin-cli.git"
```

Ephemeral use:

```bash
npx --yes --package="git+https://github.com/codeyogi911/shopify-admin-cli.git" shopify-admin-cli shop info --json
```

Full checkout: `npm install` at repo root, then `node bin/shopify-admin-cli.mjs` or `./node_modules/.bin/shopify-admin-cli`.

## Authenticate

```bash
export SHOPIFY_STORE_URL=your-store.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...
shopify-admin-cli shop info --json
```

Token minting, scopes, persisted login, rotation: [references/auth.md](references/auth.md).

## Safety before mutations

Read **every** file in `references/knowledge/` before any write. The CLI does not enforce Shopify rules (cost throttling, GIDs, refund idempotency, `productSet` vs `productUpdate`, three-phase order edits, staged uploads, bulk lifecycle, B2B Plus gates, query timezone quirks).

## Workflow

1. Auth questions → [references/auth.md](references/auth.md).
2. Writes → full pass over `references/knowledge/`.
3. Smoke-test: `shopify-admin-cli shop info --json`.
4. Command surface / GraphQL mapping → [references/resources.md](references/resources.md).
5. Prefer an existing CLI action over bespoke GraphQL when available.
6. Risky changes → `--dry-run`; cost data → `--verbose`; long lists → `--all` or `bulk` flows.

**Hard rules:** Shopify GIDs only; `--idempotency-key` on `refunds create`; partial products → `products update` (reserve `products set` for full replace); line items → `orders edit-begin` → `edit-stage` → `edit-commit`; file uploads → follow staged-upload flow in knowledge.

Uncertain schema shape → `shopify-admin-cli introspect type|queries|mutations`.

## Examples

```bash
shopify-admin-cli shop info --json
shopify-admin-cli orders list --query "name:#1234" --first 1 --json
shopify-admin-cli gql run --query 'query { shop { name } }' --json
```

Full catalogue and flags: [references/resources.md](references/resources.md).

## Maintainers (upstream repo only)

Sync repo-root `knowledge/` into bundled `references/knowledge/`:

```bash
npm run sync:published-skill
```

Edit `references/auth.md` and `references/resources.md` directly when docs drift from the CLI.
