# Agent instructions for shopify-admin-cli

You are working with `shopify-admin-cli`, an agent-friendly CLI over the [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql). It wraps [`@shopify/shopify-api`](https://www.npmjs.com/package/@shopify/shopify-api) in custom-app mode — static admin token, no OAuth.

## Before you act

1. **Read every file in `knowledge/`** before issuing mutations. The Shopify-specific gotchas (cost throttling, GID format, idempotent refunds, productSet vs productUpdate, three-phase order edits, staged uploads, bulk operations, B2B Plus-only) are non-obvious and the CLI does not enforce them.
2. **Authenticate** via `SHOPIFY_STORE_URL` + `SHOPIFY_ADMIN_TOKEN` env vars (or `shopify-admin-cli login --token shpat_...`).
3. **Validate auth** with `shopify-admin-cli shop info --json` before any mutation.

## Shape

Every resource lives in `commands/<resource>.mjs` and default-exports `{ name, actions }`. Each action declares:

```js
{
  kind: "graphql",                          // most actions
  description: "...",
  query: `query/mutation string`,
  flags: { /* parseArgs options */ },
  variables: (values) => ({ /* GraphQL variables */ }),
  paginatePath: "products",                 // optional — for --all support
  project: (data) => data.products,         // optional — narrow the response
  postProcess: async (data, values) => ...  // optional — multi-step flows
}
```

The dispatcher in `bin/shopify-admin-cli.mjs` handles the rest.

## Adding a new action

1. Decide if it fits an existing resource or needs a new file under `commands/`.
2. Look up the GraphQL operation via `shopify-admin-cli introspect type --name <ResourceName>` or `introspect mutations | jq '.[] | select(.name | contains("XYZ"))'`.
3. Write the action object. Test with `--dry-run` first.
4. Add the new action to `coverage.json` (`endpoints[]`).
5. Run `npm test` and `clify validate ./`.

## Error handling

The CLI normalises every Shopify error into the structured-error shape:

```json
{ "type": "error", "code": "...", "message": "...", "retryable": false }
```

Codes: `auth_missing`, `auth_invalid`, `forbidden`, `not_found`, `conflict`, `validation_error`, `rate_limited`, `server_error`, `network_error`, `timeout`.

When `retryable: true` and `retryAfter: N`, sleep N seconds and re-issue. The CLI does not auto-retry.

## Don't

- Don't bypass the SDK to hand-roll fetch calls — `lib/shopify.mjs` is the only init path.
- Don't hardcode store URLs or tokens. Always env-var or `shopify-admin-cli login`.
- Don't skip `--idempotency-key` on `refunds create`.
- Don't use `productSet` for partial edits; use `productUpdate`.
- Don't use raw `orderUpdate` for line-item changes; use the three-phase order-edit flow.
- Don't reach for a knowledge file's prose when the CLI has the action — execute, don't recite.

## Validation

Before declaring a change "done":

```bash
npm test                                  # unit + integration
node bin/shopify-admin-cli.mjs --help    # smoke
clify validate ./                         # gate (8 categories)
```
