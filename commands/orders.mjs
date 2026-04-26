// `orders` resource — Shopify Admin GraphQL. Order edits are
// transactional: begin → stage (add/remove/set) → commit.
const ORDER_FIELDS = `id name email phone displayFinancialStatus displayFulfillmentStatus
  totalPriceSet { shopMoney { amount currencyCode } }
  customer { id email firstName lastName }
  shippingAddress { name company address1 address2 city province zip country phone }
  createdAt cancelledAt closedAt`;

export default {
  name: "orders",
  actions: {
    list: {
      kind: "graphql",
      description: "List orders. Pass --query for Shopify search syntax (e.g. 'name:#1001').",
      paginatePath: "orders",
      query: `query Orders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
          nodes { ${ORDER_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor for next page" },
        query: { type: "string", description: "Shopify search-syntax query" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.orders,
    },
    get: {
      kind: "graphql",
      description: "Fetch a single order by GID.",
      query: `query Order($id: ID!) {
        order(id: $id) {
          ${ORDER_FIELDS}
          lineItems(first: 100) { nodes { id title quantity sku variant { id title } originalUnitPriceSet { shopMoney { amount currencyCode } } } }
          fulfillments(first: 50) { id status trackingInfo { number url company } }
          transactions(first: 50) { id kind status gateway amountSet { shopMoney { amount currencyCode } } }
          refunds(first: 50) { id totalRefundedSet { shopMoney { amount currencyCode } } }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "Order GID (gid://shopify/Order/...)" } },
      project: (d) => d.order,
    },
    cancel: {
      kind: "graphql",
      description: "Cancel an order. Refund + restock inventory by flag.",
      query: `mutation OrderCancel($notifyCustomer: Boolean, $orderId: ID!, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!, $staffNote: String) {
        orderCancel(notifyCustomer: $notifyCustomer, orderId: $orderId, reason: $reason, refund: $refund, restock: $restock, staffNote: $staffNote) {
          job { id done }
          orderCancelUserErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Order GID" },
        reason: { type: "string", description: "CUSTOMER | DECLINED | FRAUD | INVENTORY | OTHER (default OTHER)" },
        refund: { type: "boolean", description: "Refund the order (default true)" },
        restock: { type: "boolean", description: "Restock inventory (default true)" },
        notifyCustomer: { type: "boolean", description: "Send cancellation email" },
        staffNote: { type: "string", description: "Internal staff note" },
      },
      variables: (v) => ({
        orderId: v.id,
        reason: v.reason || "OTHER",
        refund: v.refund !== false,
        restock: v.restock !== false,
        notifyCustomer: !!v.notifyCustomer,
        staffNote: v.staffNote,
      }),
    },
    close: {
      kind: "graphql",
      description: "Close an order (mark as fulfilled and archived).",
      query: `mutation OrderClose($input: OrderCloseInput!) {
        orderClose(input: $input) { order { id closedAt } userErrors { field message } }
      }`,
      flags: { id: { type: "string", required: true, description: "Order GID" } },
      variables: (v) => ({ input: { id: v.id } }),
    },
    reopen: {
      kind: "graphql",
      description: "Re-open a closed order.",
      query: `mutation OrderOpen($input: OrderOpenInput!) {
        orderOpen(input: $input) { order { id closedAt } userErrors { field message } }
      }`,
      flags: { id: { type: "string", required: true, description: "Order GID" } },
      variables: (v) => ({ input: { id: v.id } }),
    },
    "edit-begin": {
      kind: "graphql",
      description: "Begin a transactional order edit. Returns a calculatedOrder id used by stage/commit.",
      query: `mutation OrderEditBegin($id: ID!) {
        orderEditBegin(id: $id) { calculatedOrder { id } userErrors { field message } }
      }`,
      flags: { id: { type: "string", required: true, description: "Order GID" } },
      variables: (v) => ({ id: v.id }),
    },
    "edit-stage": {
      kind: "graphql",
      description: "Stage an edit (add/remove variant). Pass --body for the full input.",
      query: `mutation OrderEditAddVariant($id: ID!, $variantId: ID!, $quantity: Int!) {
        orderEditAddVariant(id: $id, variantId: $variantId, quantity: $quantity) {
          calculatedOrder { id }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "calculatedOrder GID from edit-begin" },
        variantId: { type: "string", required: true, description: "ProductVariant GID to add" },
        quantity: { type: "string", required: true, description: "Quantity to add" },
        body: { type: "string", description: "Raw JSON variables for advanced edits" },
      },
      variables: (v) => ({ id: v.id, variantId: v.variantId, quantity: Number(v.quantity) }),
    },
    "edit-commit": {
      kind: "graphql",
      description: "Commit a staged edit.",
      query: `mutation OrderEditCommit($id: ID!, $notifyCustomer: Boolean, $staffNote: String) {
        orderEditCommit(id: $id, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
          order { id }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "calculatedOrder GID" },
        notifyCustomer: { type: "boolean", description: "Email customer with the change" },
        staffNote: { type: "string", description: "Internal staff note" },
      },
      variables: (v) => ({ id: v.id, notifyCustomer: !!v.notifyCustomer, staffNote: v.staffNote }),
    },
  },
};
