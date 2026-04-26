// `inventory` resource — Shopify Admin GraphQL.
// inventoryAdjustQuantities (delta) and inventorySetQuantities (absolute).
// `name` for the quantity is "available" by default; use "on_hand" for
// scheduled/incoming adjustments.
export default {
  name: "inventory",
  actions: {
    "levels-list": {
      kind: "graphql",
      description: "List inventory levels for an inventory item across locations.",
      query: `query InventoryItem($id: ID!) {
        inventoryItem(id: $id) {
          id sku
          inventoryLevels(first: 50) {
            nodes {
              id
              location { id name }
              quantities(names: ["available", "on_hand", "committed", "incoming", "reserved"]) { name quantity }
            }
          }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "InventoryItem GID" } },
      variables: (v) => ({ id: v.id }),
      project: (d) => d.inventoryItem,
    },
    "locations-list": {
      kind: "graphql",
      description: "List locations.",
      paginatePath: "locations",
      query: `query Locations($first: Int!, $after: String) {
        locations(first: $first, after: $after) {
          nodes { id name address { address1 city province zip country } isActive shipsInventory }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after }),
      project: (d) => d.locations,
    },
    adjust: {
      kind: "graphql",
      description: "Adjust inventory by a delta. Pass --body for batch adjustments.",
      query: `mutation InventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          inventoryAdjustmentGroup { id reason }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", description: "Raw JSON InventoryAdjustQuantitiesInput" },
        inventoryItemId: { type: "string", description: "InventoryItem GID (single-line shortcut)" },
        locationId: { type: "string", description: "Location GID (single-line shortcut)" },
        delta: { type: "string", description: "Delta (positive or negative)" },
        reason: { type: "string", description: "Reason (default 'correction')" },
      },
      variables: (v) => v.body ? { input: JSON.parse(v.body) } : ({
        input: {
          reason: v.reason || "correction",
          name: "available",
          changes: [{ inventoryItemId: v.inventoryItemId, locationId: v.locationId, delta: Number(v.delta) }],
        },
      }),
    },
    set: {
      kind: "graphql",
      description: "Set inventory to an absolute quantity.",
      query: `mutation InventorySetQuantities($input: InventorySetQuantitiesInput!) {
        inventorySetQuantities(input: $input) {
          inventoryAdjustmentGroup { id reason }
          userErrors { field message }
        }
      }`,
      flags: {
        body: { type: "string", description: "Raw JSON InventorySetQuantitiesInput" },
        inventoryItemId: { type: "string", description: "InventoryItem GID" },
        locationId: { type: "string", description: "Location GID" },
        quantity: { type: "string", description: "Absolute quantity" },
        reason: { type: "string", description: "Reason (default 'correction')" },
      },
      variables: (v) => v.body ? { input: JSON.parse(v.body) } : ({
        input: {
          reason: v.reason || "correction",
          name: "available",
          quantities: [{ inventoryItemId: v.inventoryItemId, locationId: v.locationId, quantity: Number(v.quantity) }],
        },
      }),
    },
  },
};
