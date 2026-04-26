// `webhooks` resource — Shopify Admin GraphQL.
const SUB_FIELDS = `id topic createdAt updatedAt format
  endpoint {
    __typename
    ... on WebhookHttpEndpoint { callbackUrl }
    ... on WebhookEventBridgeEndpoint { arn }
    ... on WebhookPubSubEndpoint { pubSubProject pubSubTopic }
  }`;

export default {
  name: "webhooks",
  actions: {
    list: {
      kind: "graphql",
      description: "List webhook subscriptions.",
      paginatePath: "webhookSubscriptions",
      query: `query WebhookSubscriptions($first: Int!, $after: String) {
        webhookSubscriptions(first: $first, after: $after) {
          nodes { ${SUB_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after }),
      project: (d) => d.webhookSubscriptions,
    },
    create: {
      kind: "graphql",
      description: "Create an HTTP webhook subscription.",
      query: `mutation WebhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription { ${SUB_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        topic: { type: "string", required: true, description: "WebhookSubscriptionTopic enum (e.g. ORDERS_CREATE)" },
        callbackUrl: { type: "string", required: true, description: "HTTPS callback URL" },
        format: { type: "string", description: "JSON (default) | XML" },
      },
      variables: (v) => ({
        topic: v.topic,
        webhookSubscription: { callbackUrl: v.callbackUrl, format: v.format || "JSON" },
      }),
    },
    delete: {
      kind: "graphql",
      description: "Delete a webhook subscription.",
      query: `mutation WebhookSubscriptionDelete($id: ID!) {
        webhookSubscriptionDelete(id: $id) {
          deletedWebhookSubscriptionId
          userErrors { field message }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "WebhookSubscription GID" } },
      variables: (v) => ({ id: v.id }),
    },
  },
};
