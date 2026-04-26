// `draft-orders` resource — Shopify Admin GraphQL.
const DRAFT_FIELDS = `id name status invoiceUrl
  totalPriceSet { shopMoney { amount currencyCode } }
  customer { id email firstName lastName }
  createdAt updatedAt`;

export default {
  name: "draft-orders",
  actions: {
    list: {
      kind: "graphql",
      description: "List draft orders.",
      paginatePath: "draftOrders",
      query: `query DraftOrders($first: Int!, $after: String, $query: String) {
        draftOrders(first: $first, after: $after, query: $query) {
          nodes { ${DRAFT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
        query: { type: "string", description: "Shopify search-syntax filter" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.draftOrders,
    },
    get: {
      kind: "graphql",
      description: "Fetch a draft order by GID.",
      query: `query DraftOrder($id: ID!) {
        draftOrder(id: $id) {
          ${DRAFT_FIELDS}
          lineItems(first: 100) { nodes { id title quantity variant { id title sku } } }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "DraftOrder GID" } },
      project: (d) => d.draftOrder,
    },
    create: {
      kind: "graphql",
      description: "Create a draft order. Pass --body for full DraftOrderInput.",
      query: `mutation DraftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { ${DRAFT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON DraftOrderInput" } },
      variables: (v) => ({ input: JSON.parse(v.body) }),
    },
    update: {
      kind: "graphql",
      description: "Update a draft order.",
      query: `mutation DraftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
        draftOrderUpdate(id: $id, input: $input) {
          draftOrder { ${DRAFT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "DraftOrder GID" },
        body: { type: "string", required: true, description: "Raw JSON DraftOrderInput" },
      },
      variables: (v) => ({ id: v.id, input: JSON.parse(v.body) }),
    },
    complete: {
      kind: "graphql",
      description: "Complete a draft order (creates a real Order).",
      query: `mutation DraftOrderComplete($id: ID!, $paymentPending: Boolean) {
        draftOrderComplete(id: $id, paymentPending: $paymentPending) {
          draftOrder { id status order { id name } }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "DraftOrder GID" },
        paymentPending: { type: "boolean", description: "Mark as pending payment instead of paid" },
      },
      variables: (v) => ({ id: v.id, paymentPending: !!v.paymentPending }),
    },
    "send-invoice": {
      kind: "graphql",
      description: "Email the draft-order invoice to the customer.",
      query: `mutation DraftOrderInvoiceSend($id: ID!, $email: EmailInput) {
        draftOrderInvoiceSend(id: $id, email: $email) {
          draftOrder { id invoiceSentAt }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "DraftOrder GID" },
        body: { type: "string", description: "Raw JSON EmailInput (subject, customMessage, etc.)" },
      },
      variables: (v) => ({ id: v.id, email: v.body ? JSON.parse(v.body) : null }),
    },
  },
};
