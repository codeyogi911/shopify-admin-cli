// `customers` resource — Shopify Admin GraphQL.
const CUSTOMER_FIELDS = `id firstName lastName email phone numberOfOrders amountSpent { amount currencyCode }
  emailMarketingConsent { marketingState marketingOptInLevel consentUpdatedAt }
  smsMarketingConsent { marketingState marketingOptInLevel consentUpdatedAt }
  tags createdAt updatedAt`;

export default {
  name: "customers",
  actions: {
    list: {
      kind: "graphql",
      description: "List customers. Use --query for Shopify search syntax (e.g. 'email_marketing_state:SUBSCRIBED').",
      paginatePath: "customers",
      query: `query Customers($first: Int!, $after: String, $query: String) {
        customers(first: $first, after: $after, query: $query) {
          nodes { ${CUSTOMER_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
        query: { type: "string", description: "Shopify search-syntax filter" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.customers,
    },
    get: {
      kind: "graphql",
      description: "Fetch a single customer by GID.",
      query: `query Customer($id: ID!) {
        customer(id: $id) {
          ${CUSTOMER_FIELDS}
          defaultAddress { address1 address2 city province zip country phone company }
          addresses(first: 25) { id address1 city province zip country }
          metafields(first: 50) { nodes { id namespace key value type } }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "Customer GID" } },
      project: (d) => d.customer,
    },
    search: {
      kind: "graphql",
      description: "Find a customer by email (returns the first match).",
      query: `query CustomerSearch($query: String!) {
        customers(first: 1, query: $query) { nodes { ${CUSTOMER_FIELDS} } }
      }`,
      flags: { email: { type: "string", required: true, description: "Customer email" } },
      variables: (v) => ({ query: `email:${v.email}` }),
      project: (d) => d.customers.nodes[0] || null,
    },
    create: {
      kind: "graphql",
      description: "Create a customer. Pass --body for arbitrary CustomerInput.",
      query: `mutation CustomerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { ${CUSTOMER_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", description: "Raw JSON CustomerInput" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
      },
      variables: (v) => ({ input: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone } }),
    },
    update: {
      kind: "graphql",
      description: "Partial update of a customer.",
      query: `mutation CustomerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer { ${CUSTOMER_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Customer GID" },
        body: { type: "string", description: "Raw JSON CustomerInput" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
      },
      variables: (v) => ({ input: { id: v.id, firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone } }),
    },
    delete: {
      kind: "graphql",
      description: "Delete (redact) a customer.",
      query: `mutation CustomerDelete($input: CustomerDeleteInput!) {
        customerDelete(input: $input) { deletedCustomerId userErrors { field message } }
      }`,
      flags: { id: { type: "string", required: true, description: "Customer GID" } },
      variables: (v) => ({ input: { id: v.id } }),
    },
    "segments-list": {
      kind: "graphql",
      description: "List customer segments. Use the GraphQL query language for segment definitions.",
      paginatePath: "segments",
      query: `query Segments($first: Int!, $after: String) {
        segments(first: $first, after: $after) {
          nodes { id name query lastEditDate creationDate }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after }),
      project: (d) => d.segments,
    },
  },
};
