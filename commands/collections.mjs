// `collections` resource — Shopify Admin GraphQL.
const COLLECTION_FIELDS = `id title handle descriptionHtml updatedAt
  productsCount { count precision }
  ruleSet { rules { column relation condition } appliedDisjunctively }`;

export default {
  name: "collections",
  actions: {
    list: {
      kind: "graphql",
      description: "List collections.",
      paginatePath: "collections",
      query: `query Collections($first: Int!, $after: String, $query: String) {
        collections(first: $first, after: $after, query: $query) {
          nodes { ${COLLECTION_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
        query: { type: "string", description: "Shopify search-syntax filter" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.collections,
    },
    get: {
      kind: "graphql",
      description: "Fetch a single collection by GID.",
      query: `query Collection($id: ID!) {
        collection(id: $id) {
          ${COLLECTION_FIELDS}
          products(first: 50) { nodes { id title handle } }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "Collection GID" } },
      project: (d) => d.collection,
    },
    create: {
      kind: "graphql",
      description: "Create a collection.",
      query: `mutation CollectionCreate($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection { ${COLLECTION_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", description: "Raw JSON CollectionInput" },
        title: { type: "string" },
        descriptionHtml: { type: "string" },
      },
      variables: (v) => ({ input: { title: v.title, descriptionHtml: v.descriptionHtml } }),
    },
    update: {
      kind: "graphql",
      description: "Update a collection.",
      query: `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { ${COLLECTION_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Collection GID" },
        body: { type: "string", description: "Raw JSON CollectionInput" },
        title: { type: "string" },
        descriptionHtml: { type: "string" },
      },
      variables: (v) => ({ input: { id: v.id, title: v.title, descriptionHtml: v.descriptionHtml } }),
    },
    "products-add": {
      kind: "graphql",
      description: "Add products to a manual collection.",
      query: `mutation CollectionAddProductsV2($id: ID!, $productIds: [ID!]!) {
        collectionAddProductsV2(id: $id, productIds: $productIds) {
          job { id done }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Collection GID" },
        productIds: { type: "string", required: true, description: "Comma-separated Product GIDs" },
      },
      variables: (v) => ({ id: v.id, productIds: v.productIds.split(",").map((s) => s.trim()) }),
    },
    "products-remove": {
      kind: "graphql",
      description: "Remove products from a manual collection.",
      query: `mutation CollectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
        collectionRemoveProducts(id: $id, productIds: $productIds) {
          job { id done }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Collection GID" },
        productIds: { type: "string", required: true, description: "Comma-separated Product GIDs" },
      },
      variables: (v) => ({ id: v.id, productIds: v.productIds.split(",").map((s) => s.trim()) }),
    },
  },
};
