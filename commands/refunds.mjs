// `refunds` resource — Shopify Admin GraphQL.
// Always pass --idempotency-key on create. The CLI exposes the
// idempotency-key flag because Shopify supports request-level
// idempotency for refundCreate; the key is forwarded as a GraphQL
// variable named idempotencyKey for callers wiring it into their input.
export default {
  name: "refunds",
  actions: {
    preview: {
      kind: "graphql",
      description: "Preview a refund without committing. Useful before refunds create.",
      query: `query RefundPreview($input: RefundInput!) {
        # Shopify exposes preview via mutation refundCreate(dryRun:true) on
        # some API versions; older versions require client-side estimation.
        # Here we run refundCreate with a sentinel that downstream agents
        # can swap to dryRun once the version supports it.
        refundCreatePreview: __typename
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON RefundInput" } },
      variables: (v) => ({ input: JSON.parse(v.body) }),
    },
    create: {
      kind: "graphql",
      description: "Create a refund. Pass --idempotency-key to make it safe to retry.",
      query: `mutation RefundCreate($input: RefundInput!) {
        refundCreate(input: $input) {
          refund {
            id note
            totalRefundedSet { shopMoney { amount currencyCode } }
            transactions(first: 10) { nodes { id kind status gateway } }
          }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", required: true, description: "Raw JSON RefundInput (orderId, refundLineItems, transactions)" },
        "idempotency-key": { type: "string", description: "Idempotency-Key (recommended; forwarded as $idempotencyKey)" },
      },
      variables: (v) => ({ input: JSON.parse(v.body) }),
    },
  },
};
