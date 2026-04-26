// `shop` — store-level metadata. The first thing you should call to
// validate auth is `shop info`, since it requires only `read_products`
// scope (which every custom-app token has).
export default {
  name: "shop",
  actions: {
    info: {
      kind: "graphql",
      description: "Shop metadata — name, plan, primary domain, currency, timezone.",
      query: `query Shop {
        shop {
          id name email myshopifyDomain primaryDomain { url host }
          ianaTimezone currencyCode billingAddress { country province city }
          plan { displayName partnerDevelopment shopifyPlus }
          features { storefront branding }
        }
      }`,
      flags: {},
      variables: () => ({}),
      project: (d) => d.shop,
    },
    scopes: {
      kind: "graphql",
      description: "Access scopes granted to the current admin token.",
      query: `query AccessScopes { currentAppInstallation { accessScopes { handle } } }`,
      flags: {},
      variables: () => ({}),
      project: (d) => d.currentAppInstallation?.accessScopes,
    },
    "rate-limit": {
      kind: "graphql",
      description: "GraphQL leaky-bucket budget (cost-throttling state).",
      query: `query RateLimit { shop { id } }`,
      flags: {},
      variables: () => ({}),
      // Cost extensions are surfaced via response.extensions; --verbose prints them.
      project: (d) => ({ note: "Cost extensions shown via --verbose; see knowledge/cost-based-throttling.md", probe: d.shop }),
    },
  },
};
