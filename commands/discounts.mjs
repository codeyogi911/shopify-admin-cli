// `discounts` resource — Shopify Admin GraphQL.
// Discounts come in two flavours: code-based (discountCodeBasic) and
// automatic (discountAutomaticBasic). Both wrap a DiscountAutomaticApp /
// DiscountCodeApp node — list returns DiscountNode unions.
const DISCOUNT_NODE_FIELDS = `id
  discount {
    __typename
    ... on DiscountCodeBasic { title summary status startsAt endsAt
      codes(first: 5) { nodes { id code } }
      customerSelection { ... on DiscountCustomerAll { allCustomers } }
    }
    ... on DiscountAutomaticBasic { title summary status startsAt endsAt }
  }`;

export default {
  name: "discounts",
  actions: {
    list: {
      kind: "graphql",
      description: "List discount nodes (both code and automatic).",
      paginatePath: "discountNodes",
      query: `query Discounts($first: Int!, $after: String, $query: String) {
        discountNodes(first: $first, after: $after, query: $query) {
          nodes { ${DISCOUNT_NODE_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
        query: { type: "string", description: "Shopify search-syntax filter" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.discountNodes,
    },
    get: {
      kind: "graphql",
      description: "Fetch a single discount node.",
      query: `query Discount($id: ID!) {
        discountNode(id: $id) { ${DISCOUNT_NODE_FIELDS} }
      }`,
      flags: { id: { type: "string", required: true, description: "DiscountNode GID" } },
      project: (d) => d.discountNode,
    },
    "create-code": {
      kind: "graphql",
      description: "Create a code-based discount. Pass --body for a complete DiscountCodeBasicInput.",
      query: `mutation DiscountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode { id }
          userErrors { field message }
        }
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON DiscountCodeBasicInput" } },
      variables: (v) => ({ basicCodeDiscount: JSON.parse(v.body) }),
    },
    "create-automatic": {
      kind: "graphql",
      description: "Create an automatic discount. Pass --body for a complete DiscountAutomaticBasicInput.",
      query: `mutation DiscountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
          automaticDiscountNode { id }
          userErrors { field message }
        }
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON DiscountAutomaticBasicInput" } },
      variables: (v) => ({ automaticBasicDiscount: JSON.parse(v.body) }),
    },
    deactivate: {
      kind: "graphql",
      description: "Deactivate a discount by setting endsAt to now.",
      query: `mutation DiscountCodeDeactivate($id: ID!) {
        discountCodeDeactivate(id: $id) {
          codeDiscountNode { id }
          userErrors { field message }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "DiscountNode GID" } },
      variables: (v) => ({ id: v.id }),
    },
  },
};
