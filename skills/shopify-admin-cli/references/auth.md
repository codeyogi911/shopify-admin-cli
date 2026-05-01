# shopify-admin-cli-auth

`shopify-admin-cli` authenticates via the **custom-app admin API access token** flow. No OAuth, no session storage, no embedded-app machinery. The token is a long-lived secret minted from the Shopify admin UI; the CLI sends it as the `X-Shopify-Access-Token` header on every request.

## How to mint a token

1. Shopify admin → **Settings → Apps and sales channels → Develop apps**.
2. Create an app (or select an existing one). The app does not need to be installable; it is "private" / "custom" to the store.
3. **Configure Admin API scopes** — pick the minimum set the CLI will need (see "Scopes" below).
4. **Install app** → click **Reveal token once** → copy `shpat_...`. Store in your password manager; you will not see it again.

## Configure the CLI

```bash
export SHOPIFY_STORE_URL=your-store.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...
shopify-admin-cli shop info --json
```

If the token is valid you see the shop name + plan. If not, you'll get one of:

| Error code | Cause | Fix |
|---|---|---|
| `auth_missing` | Env var unset and no persisted credentials | Set `SHOPIFY_ADMIN_TOKEN` |
| `auth_invalid` | Token expired/revoked or wrong store | Re-mint token; verify `SHOPIFY_STORE_URL` matches |
| `forbidden` | Token lacks the scope the operation needs | Reinstall the app with the missing scope |

## Persisted credentials

Alternatively, `shopify-admin-cli login --token shpat_...` stores the token at `~/.config/shopify-admin-cli/credentials.json` (mode 0600). The env var always wins over the persisted token.

```bash
shopify-admin-cli login --token shpat_xxxxx
shopify-admin-cli login --status --json
# { "scheme":"api-key-header","envVar":"SHOPIFY_ADMIN_TOKEN","header":"X-Shopify-Access-Token","fromEnv":false,"fromConfig":true,"authenticated":true }
```

## Scopes

The CLI does not introspect what scopes you need — Shopify enforces them per operation. Useful starting set for typical e-commerce automation:

- `read_products`, `write_products`
- `read_orders`, `write_orders`
- `read_customers`, `write_customers`
- `read_inventory`, `write_inventory`
- `read_locations`
- `read_fulfillments`, `write_fulfillments`
- `read_shipping`
- `read_discounts`, `write_discounts`
- `read_files`, `write_files`
- `read_returns`, `write_returns`

Add `read_marketing_events`, `read_customer_events`, `read_metaobjects`, `write_metaobjects` if you're working with those surfaces. For B2B Plus features, scopes are gated on the Plus plan.

To check what your token actually has:

```bash
shopify-admin-cli shop scopes --json
```

## API version pinning

The CLI pins to API version `2026-01` (in `lib/shopify.mjs`). To bump:

1. Check Shopify's deprecation calendar at https://shopify.dev/docs/api/usage/versioning
2. Edit `lib/shopify.mjs` → `API_VERSION = ApiVersion.April26` (or the next stable identifier from `@shopify/shopify-api`).
3. Update `.clify.json.defaults.apiVersion`.
4. Run integration tests against the new version.

See `references/knowledge/api-versions.md` for the cadence.

## Why a static token (and not OAuth)

The CLI runs from a developer's laptop or a CI/cron context — there's no browser to complete an OAuth callback, no embedded-app frame, no merchant-installation flow. Custom-app tokens are exactly the right shape: long-lived, scope-gated, revocable from the admin UI. See `references/knowledge/why-official-sdk.md` for context on how `@shopify/shopify-api` handles this.

## Rotation

1. Mint a new token in the admin UI (Develop apps → app → Reveal token).
2. Update `SHOPIFY_ADMIN_TOKEN` in your env / `.env` / secret store.
3. The previous token can stay alive for a grace period; revoke from the same UI when the new one is verified.

## Cloud / scheduled triggers

For agents running in a cloud sandbox (no `.env` file present), inject `SHOPIFY_STORE_URL` and `SHOPIFY_ADMIN_TOKEN` as process env vars. The CLI's loader is env-first — see `lib/env.mjs` and the project-level `CLAUDE.md` "Environment and credentials" section.
