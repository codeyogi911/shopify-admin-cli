# shopify-admin-cli

Agent-friendly CLI for the [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql). Wraps [`@shopify/shopify-api`](https://www.npmjs.com/package/@shopify/shopify-api) in custom-app mode — static admin token, no OAuth, no session storage. One resource × one action = one GraphQL operation.

## Install

```bash
git clone <this-repo> && cd shopify-admin-cli
npm install
node bin/shopify-admin-cli.mjs --help
```

Or symlink into your PATH:

```bash
ln -sf "$(pwd)/bin/shopify-admin-cli.mjs" /usr/local/bin/shopify-admin-cli
```

## Authenticate

```bash
export SHOPIFY_STORE_URL=your-store.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...        # Custom-app admin API access token
shopify-admin-cli shop info --json          # smoke test
```

See [`skills/shopify-admin-cli-auth/SKILL.md`](skills/shopify-admin-cli-auth/SKILL.md) for token minting + scopes.

## What it covers

17 resources × 77 actions:

| Resource | Actions |
|---|---|
| products | list, get, create, update, set, delete |
| orders | list, get, cancel, close, reopen, edit-begin, edit-stage, edit-commit |
| customers | list, get, search, create, update, delete, segments-list |
| inventory | levels-list, locations-list, adjust, set |
| collections | list, get, create, update, products-add, products-remove |
| discounts | list, get, create-code, create-automatic, deactivate |
| metafields | list, get, set, delete |
| fulfillment | create, update-tracking, cancel, hold, release |
| refunds | preview, create |
| draft-orders | list, get, create, update, complete, send-invoice |
| returns | list, request, approve, decline, refund |
| files | list, upload, delete |
| webhooks | list, create, delete |
| bulk | query, query-status, query-cancel, mutation, mutation-status |
| gql | run (raw GraphQL escape hatch) |
| introspect | full, type, queries, mutations |
| shop | info, scopes, rate-limit |

Help: `shopify-admin-cli <resource> --help`, then `shopify-admin-cli <resource> <action> --help`.

## Examples

```bash
# Look up an order by name
shopify-admin-cli orders list --query "name:#1234" --first 1 --json

# Walk every customer that opted in to marketing
shopify-admin-cli customers list --query "email_marketing_state:SUBSCRIBED" --all --json

# Idempotent refund
shopify-admin-cli refunds create \
  --idempotency-key "FCS-REFUND-$(uuidgen)" \
  --body "$(cat refund-input.json)"

# Generic GraphQL
shopify-admin-cli gql run \
  --query 'query { shop { name plan { displayName } } }' \
  --json

# Schema discovery
shopify-admin-cli introspect type --name Order --json | jq '.fields[].name'
```

## Knowledge files

`knowledge/` contains Shopify-specific gotchas: cost-based throttling, GID format, idempotent refunds, productSet vs productUpdate, three-phase order edits, staged uploads, bulk operations, B2B Plus-only gating, API version cadence, and why this CLI uses the official SDK over zero-dep fetch. Read these before mutating anything.

## Testing

```bash
npm test
```

Tests run against an in-process GraphQL mock (`test/_mock-server.mjs`) — no live Shopify calls. Set `SHOPIFY_ADMIN_BASE_URL=http://127.0.0.1:<port>` to redirect the SDK at the mock.

## Built with

- [`@shopify/shopify-api`](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api) — official Node SDK, custom-app mode
- Generated with [clify](https://github.com/codeyogi911/clify) 0.3.0 from the exemplar template
- Validates with `clify validate ./` (gate categories: manifest, schema, secrets, coverage, structural, nuances, ci, tests)
