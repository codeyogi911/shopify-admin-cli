// `fulfillment` resource — Shopify Admin GraphQL.
// fulfillmentCreate replaces the legacy fulfillmentCreateV2 mutation
// (deprecated as of 2025-04). It accepts a FulfillmentInput tying an
// order's line items + tracking info together.
const FULFILLMENT_FIELDS = `id status name createdAt updatedAt
  trackingInfo { number url company }
  fulfillmentLineItems(first: 50) { nodes { id quantity lineItem { id title sku } } }`;

export default {
  name: "fulfillment",
  actions: {
    create: {
      kind: "graphql",
      description: "Create a fulfillment. Pass --body for the full FulfillmentInput.",
      query: `mutation FulfillmentCreate($fulfillment: FulfillmentInput!) {
        fulfillmentCreate(fulfillment: $fulfillment) {
          fulfillment { ${FULFILLMENT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: { body: { type: "string", required: true, description: "Raw JSON FulfillmentInput" } },
      variables: (v) => ({ fulfillment: JSON.parse(v.body) }),
    },
    "update-tracking": {
      kind: "graphql",
      description: "Update tracking info on an existing fulfillment.",
      query: `mutation FulfillmentTrackingInfoUpdate($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean) {
        fulfillmentTrackingInfoUpdate(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput, notifyCustomer: $notifyCustomer) {
          fulfillment { ${FULFILLMENT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "Fulfillment GID" },
        number: { type: "string", description: "Tracking number" },
        company: { type: "string", description: "Carrier (e.g. 'India Post')" },
        url: { type: "string", description: "Tracking URL" },
        notifyCustomer: { type: "boolean", description: "Email customer with the update" },
      },
      variables: (v) => ({
        fulfillmentId: v.id,
        trackingInfoInput: { number: v.number, company: v.company, url: v.url },
        notifyCustomer: !!v.notifyCustomer,
      }),
    },
    cancel: {
      kind: "graphql",
      description: "Cancel a fulfillment.",
      query: `mutation FulfillmentCancel($id: ID!) {
        fulfillmentCancel(id: $id) {
          fulfillment { ${FULFILLMENT_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "Fulfillment GID" } },
      variables: (v) => ({ id: v.id }),
    },
    hold: {
      kind: "graphql",
      description: "Place a fulfillment-order on hold.",
      query: `mutation FulfillmentOrderHold($id: ID!, $fulfillmentHold: FulfillmentOrderHoldInput!) {
        fulfillmentOrderHold(id: $id, fulfillmentHold: $fulfillmentHold) {
          fulfillmentOrder { id status }
          userErrors { field message }
        }
      }`,
      flags: {
        id: { type: "string", required: true, description: "FulfillmentOrder GID" },
        reason: { type: "string", description: "Reason (e.g. AWAITING_PAYMENT, INCORRECT_ADDRESS)" },
        notifyMerchant: { type: "boolean", description: "Notify merchant of the hold" },
      },
      variables: (v) => ({ id: v.id, fulfillmentHold: { reason: v.reason || "OTHER", notifyMerchant: !!v.notifyMerchant } }),
    },
    release: {
      kind: "graphql",
      description: "Release a held fulfillment-order.",
      query: `mutation FulfillmentOrderReleaseHold($id: ID!) {
        fulfillmentOrderReleaseHold(id: $id) {
          fulfillmentOrder { id status }
          userErrors { field message }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "FulfillmentOrder GID" } },
      variables: (v) => ({ id: v.id }),
    },
  },
};
