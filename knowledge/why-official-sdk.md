---
title: "Why this CLI uses @shopify/shopify-api"
type: quirk
source: shopify-docs
discovered: 2026-04-26
---

**What.** Unlike the clify exemplar (zero-dep, hand-rolled `apiRequest` over `fetch`), this CLI depends on `@shopify/shopify-api` and uses its custom-app GraphQL client.

**Why this choice.**

1. **Auto API-version handling.** The SDK exposes `ApiVersion.January26`-style constants and updates with each Shopify quarterly release. The CLI bumps versions by changing one constant.
2. **Cost-throttling response shape.** The SDK normalises `extensions.cost` and surfaces `GraphqlQueryError` with structured fields, so the CLI doesn't have to parse Shopify-specific error envelopes by hand.
3. **Deprecation warnings.** Future Shopify deprecations land in the SDK's response handling; the CLI inherits that.
4. **Future-proofing.** If we later need session/OAuth/webhooks for an installable app variant, the same SDK supports it without a rewrite.

**Why this might be a wrong choice (acknowledged tradeoff).**

- Adds one runtime dependency (and its transitive deps: `jose`, `isbot`, `tslib`, `lossless-json`, `compare-versions`, `@shopify/admin-api-client`, `@shopify/graphql-client`, `@shopify/storefront-api-client`).
- Breaks the clify exemplar's zero-dep contract. Declared as a nuance (`.clify.json.nuances.officialSdk: true`).
- Heavier install (~5 MB vs ~0).

**Alternative considered.** `@shopify/admin-api-client` directly — strictly smaller. Not chosen because the user explicitly asked for `@shopify/shopify-api`.

**SDK config used.**

```js
shopifyApi({
  apiSecretKey: "unused-for-custom-app",
  apiVersion: ApiVersion.January26,
  isCustomStoreApp: true,
  adminApiAccessToken: <token>,
  isEmbeddedApp: false,
  hostName: <store-or-test-host>,
  hostScheme: "https",
});
```

`isCustomStoreApp: true` + `customAppSession()` is the documented pattern for static-token CLI use. No OAuth callback, no session storage backend.
