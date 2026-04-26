// `products` resource — Shopify Admin GraphQL.
// Use `set` (productSet) for full replaces and `update` (productUpdate)
// for partial mutations. See knowledge/productset-vs-productupdate.md.
const PRODUCT_FIELDS = `id title handle status vendor productType tags createdAt updatedAt`;

export default {
  name: "products",
  actions: {
    list: {
      kind: "graphql",
      description: "List products. Pass --query for filtering (Shopify search syntax).",
      paginatePath: "products",
      query: `query Products($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          nodes { ${PRODUCT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor for next page" },
        query: { type: "string", description: 'Shopify search-syntax query (e.g. "vendor:Acme")' },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.products,
    },
    get: {
      kind: "graphql",
      description: "Fetch a single product by GID.",
      query: `query Product($id: ID!) {
        product(id: $id) {
          ${PRODUCT_FIELDS}
          variants(first: 100) { nodes { id title sku price barcode inventoryQuantity } }
          media(first: 50) { nodes { id alt mediaContentType ... on MediaImage { image { url width height } } } }
          metafields(first: 50) { nodes { id namespace key value type } }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "Product GID (gid://shopify/Product/...)" } },
      project: (d) => d.product,
    },
    create: {
      kind: "graphql",
      description: "Create a product. Pass --body for full input shape.",
      query: `mutation ProductCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product { ${PRODUCT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", description: "Raw JSON ProductInput (overrides flags)" },
        title: { type: "string", description: "Product title" },
        vendor: { type: "string", description: "Vendor" },
        productType: { type: "string", description: "Product type" },
        status: { type: "string", description: "ACTIVE | DRAFT | ARCHIVED" },
      },
      variables: (v) => ({ input: { title: v.title, vendor: v.vendor, productType: v.productType, status: v.status } }),
    },
    update: {
      kind: "graphql",
      description: "Partial update of a product. Use --body for arbitrary ProductInput.",
      query: `mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product { ${PRODUCT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Product GID" },
        body: { type: "string", description: "Raw JSON ProductInput (recommended)" },
        title: { type: "string", description: "Product title" },
        status: { type: "string", description: "ACTIVE | DRAFT | ARCHIVED" },
      },
      variables: (v) => ({ input: { id: v.id, title: v.title, status: v.status } }),
    },
    set: {
      kind: "graphql",
      description: "Full replace via productSet — pass complete ProductSetInput in --body. Drops omitted fields.",
      query: `mutation ProductSet($input: ProductSetInput!) {
        productSet(input: $input) {
          product { ${PRODUCT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON ProductSetInput (full document)" } },
      variables: (v) => ({ input: JSON.parse(v.body) }),
    },
    delete: {
      kind: "graphql",
      description: "Delete a product.",
      query: `mutation ProductDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "Product GID" } },
      variables: (v) => ({ input: { id: v.id } }),
    },
  },
};
