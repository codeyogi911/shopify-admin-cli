# shopify-admin-cli

Agent-friendly CLI for the [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql). Wraps [`@shopify/shopify-api`](https://www.npmjs.com/package/@shopify/shopify-api) in custom-app mode — static admin token, no OAuth, no session storage. One resource × one action = one GraphQL operation.

## Agent skill (recommended entry point)

Everything agents need is bundled in **one** umbrella skill under [`skills/shopify-admin-cli/`](skills/shopify-admin-cli/).

### Install the skill with `npx skills`

Use the **[`skills` npm package](https://www.npmjs.com/package/skills)** (open-source CLI: [vercel-labs/skills](https://github.com/vercel-labs/skills)). `npx` downloads and runs that package; you do **not** clone this repo first.

```bash
npx --yes skills@latest add codeyogi911/shopify-admin-cli --skill shopify-admin-cli
```

```bash
npx --yes skills@latest add https://github.com/codeyogi911/shopify-admin-cli/tree/main/skills/shopify-admin-cli
```

That skill ships `references/knowledge/`, `references/auth.md`, and `references/resources.md`, so it stands alone once installed into your agent’s skills directory.

### Install the CLI (after the skill)

The **`shopify-admin-cli` binary is not** on the public npm registry; install it from the **same GitHub repo** as the skill:

```bash
# Global (persistent `shopify-admin-cli` on PATH)
npm install -g "git+https://github.com/codeyogi911/shopify-admin-cli.git"
```

```bash
# One-off / sandbox (downloads on first use)
npx --yes --package="git+https://github.com/codeyogi911/shopify-admin-cli.git" shopify-admin-cli --help
```

Forks or mirrors should substitute `<owner>/<repo>` in the `npx skills add …` lines and use their own `git+https://github.com/<owner>/<repo>.git` URL for the CLI install commands above.

## Install from a clone (contributors)

```bash
git clone https://github.com/codeyogi911/shopify-admin-cli.git && cd shopify-admin-cli
npm install
node bin/shopify-admin-cli.mjs --help
# optional: npm link   # makes `shopify-admin-cli` available globally from this checkout
```

## Authenticate

```bash
export SHOPIFY_STORE_URL=your-store.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...        # Custom-app admin API access token
shopify-admin-cli shop info --json          # smoke test
```

Token minting, scopes, and persisted login are documented in the skill’s [`references/auth.md`](skills/shopify-admin-cli/references/auth.md). Maintainer-facing source for that file lives at [`skills/.internal/shopify-admin-cli-auth/SKILL.md`](skills/.internal/shopify-admin-cli-auth/SKILL.md) (refresh the published copy with `npm run sync:published-skill`).

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

The repo-root `knowledge/` directory remains the source of truth. To refresh the
bundled copies shipped inside the published skill, run:

```bash
npm run sync:published-skill
```

Maintainer-only shards under `skills/.internal/` (auth + resources prose) feed
that sync; they are not separate installable skills.

## Testing

```bash
npm test
```

Tests run against an in-process GraphQL mock (`test/_mock-server.mjs`) — no live Shopify calls. Set `SHOPIFY_ADMIN_BASE_URL=http://127.0.0.1:<port>` to redirect the SDK at the mock.

## Built with

- [`@shopify/shopify-api`](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api) — official Node SDK, custom-app mode
- Generated with [clify](https://github.com/codeyogi911/clify) 0.3.0 from the exemplar template
- Validates with `clify validate ./` (gate categories: manifest, schema, secrets, coverage, structural, nuances, ci, tests)
