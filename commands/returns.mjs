// `returns` resource — Shopify Admin GraphQL.
const RETURN_FIELDS = `id name status totalQuantity
  order { id name }
  returnLineItems(first: 50) { nodes { id quantity returnReason returnReasonNote } }
  refunds(first: 10) { nodes { id totalRefundedSet { shopMoney { amount currencyCode } } } }`;

export default {
  name: "returns",
  actions: {
    list: {
      kind: "graphql",
      description: "List returns.",
      paginatePath: "returns",
      query: `query Returns($first: Int!, $after: String, $query: String) {
        returns(first: $first, after: $after, query: $query) {
          nodes { ${RETURN_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
        query: { type: "string", description: "Shopify search-syntax filter" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.returns,
    },
    request: {
      kind: "graphql",
      description: "Request a return. Pass --body for ReturnRequestInput.",
      query: `mutation ReturnRequest($input: ReturnRequestInput!) {
        returnRequest(input: $input) {
          return { ${RETURN_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON ReturnRequestInput" } },
      variables: (v) => ({ input: JSON.parse(v.body) }),
    },
    approve: {
      kind: "graphql",
      description: "Approve a return request.",
      query: `mutation ReturnApproveRequest($input: ReturnApproveRequestInput!) {
        returnApproveRequest(input: $input) {
          return { ${RETURN_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "Return GID" } },
      variables: (v) => ({ input: { id: v.id } }),
    },
    decline: {
      kind: "graphql",
      description: "Decline a return request.",
      query: `mutation ReturnDeclineRequest($input: ReturnDeclineRequestInput!) {
        returnDeclineRequest(input: $input) {
          return { ${RETURN_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Return GID" },
        declineReason: { type: "string", description: "Reason (FINAL_SALE | RETURN_PERIOD_ENDED | OTHER)" },
      },
      variables: (v) => ({ input: { id: v.id, declineReason: v.declineReason || "OTHER" } }),
    },
    refund: {
      kind: "graphql",
      description: "Refund a return. Pass --body for ReturnRefundInput.",
      query: `mutation ReturnRefund($returnRefundInput: ReturnRefundInput!) {
        returnRefund(returnRefundInput: $returnRefundInput) {
          refund { id totalRefundedSet { shopMoney { amount currencyCode } } }
          userErrors { field message }
        }
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON ReturnRefundInput" } },
      variables: (v) => ({ returnRefundInput: JSON.parse(v.body) }),
    },
  },
};
