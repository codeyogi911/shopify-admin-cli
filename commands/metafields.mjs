// `metafields` resource — works against any owner type via metafieldsSet.
// Owner-type-specific reads use the parent's `metafields(first:)` connection.
export default {
  name: "metafields",
  actions: {
    list: {
      kind: "graphql",
      description: "List metafields on an owner. Pass --ownerId (Product, Customer, Order, etc.).",
      query: `query OwnerMetafields($ownerId: ID!, $first: Int!, $namespace: String, $key: String) {
        node(id: $ownerId) {
          id
          ... on Product { metafields(first: $first, namespace: $namespace, key: $key) { nodes { id namespace key value type updatedAt } } }
          ... on Customer { metafields(first: $first, namespace: $namespace, key: $key) { nodes { id namespace key value type updatedAt } } }
          ... on Order { metafields(first: $first, namespace: $namespace, key: $key) { nodes { id namespace key value type updatedAt } } }
          ... on Collection { metafields(first: $first, namespace: $namespace, key: $key) { nodes { id namespace key value type updatedAt } } }
          ... on ProductVariant { metafields(first: $first, namespace: $namespace, key: $key) { nodes { id namespace key value type updatedAt } } }
        }
      }`,
      flags: {
        ownerId: { type: "string", required: true, description: "Owner GID (Product/Customer/Order/...)" },
        first: { type: "string", description: "Page size (default 50)" },
        namespace: { type: "string", description: "Filter by namespace" },
        key: { type: "string", description: "Filter by key (requires namespace)" },
      },
      variables: (v) => ({ ownerId: v.ownerId, first: v.first ? Number(v.first) : 50, namespace: v.namespace, key: v.key }),
      project: (d) => d.node,
    },
    get: {
      kind: "graphql",
      description: "Fetch a single metafield by GID.",
      query: `query Metafield($id: ID!) {
        node(id: $id) { ... on Metafield { id namespace key value type ownerType updatedAt } }
      }`,
      flags: { id: { type: "string", required: true, description: "Metafield GID" } },
      project: (d) => d.node,
    },
    set: {
      kind: "graphql",
      description: "Upsert one or more metafields. Pass --body for the full array, or --ownerId/--namespace/--key/--type/--value for one.",
      query: `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key value type }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", description: "Raw JSON [MetafieldsSetInput]" },
        ownerId: { type: "string", description: "Owner GID" },
        namespace: { type: "string", description: "Metafield namespace" },
        key: { type: "string", description: "Metafield key" },
        type: { type: "string", description: "Metafield type (e.g. single_line_text_field)" },
        value: { type: "string", description: "Metafield value" },
      },
      variables: (v) => v.body ? { metafields: JSON.parse(v.body) } : ({
        metafields: [{ ownerId: v.ownerId, namespace: v.namespace, key: v.key, type: v.type, value: v.value }],
      }),
    },
    delete: {
      kind: "graphql",
      description: "Delete a metafield.",
      query: `mutation MetafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields { ownerId namespace key }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", description: "Raw JSON [MetafieldIdentifierInput]" },
        ownerId: { type: "string", description: "Owner GID" },
        namespace: { type: "string", description: "Namespace" },
        key: { type: "string", description: "Key" },
      },
      variables: (v) => v.body ? { metafields: JSON.parse(v.body) } : ({
        metafields: [{ ownerId: v.ownerId, namespace: v.namespace, key: v.key }],
      }),
    },
  },
};
