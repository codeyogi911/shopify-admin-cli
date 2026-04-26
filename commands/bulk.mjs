// `bulk` resource — Shopify Admin GraphQL Bulk Operations API.
// Async query/mutation lifecycle:
//   query    -> bulkOperationRunQuery  (returns op id; poll until COMPLETED)
//   mutation -> bulkOperationRunMutation (uploads JSONL via stagedUploadsCreate)
//   status   -> currentBulkOperation
//   cancel   -> bulkOperationCancel
import { readFileSync } from "node:fs";

const BULK_OP_FIELDS = `id status errorCode createdAt completedAt objectCount fileSize url partialDataUrl`;

export default {
  name: "bulk",
  actions: {
    query: {
      kind: "graphql",
      description: "Kick off a bulk query. Pass --query-file with the GraphQL document.",
      query: `mutation BulkOperationRunQuery($query: String!) {
        bulkOperationRunQuery(query: $query) {
          bulkOperation { ${BULK_OP_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        "query-file": { type: "string", required: true, description: "Path to .graphql query file" },
      },
      variables: (v) => ({ query: readFileSync(v["query-file"], "utf8") }),
    },
    "query-status": {
      kind: "graphql",
      description: "Check the current bulk-query status.",
      query: `query CurrentBulkOperation { currentBulkOperation { ${BULK_OP_FIELDS} } }`,
      flags: {},
      variables: () => ({}),
      project: (d) => d.currentBulkOperation,
    },
    "query-cancel": {
      kind: "graphql",
      description: "Cancel the current bulk operation.",
      query: `mutation BulkOperationCancel($id: ID!) {
        bulkOperationCancel(id: $id) {
          bulkOperation { ${BULK_OP_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: { id: { type: "string", required: true, description: "BulkOperation GID" } },
      variables: (v) => ({ id: v.id }),
    },
    mutation: {
      kind: "graphql",
      description: "Kick off a bulk mutation with a JSONL file. Pass --mutation-file and --jsonl-staged-url.",
      query: `mutation BulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
        bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath) {
          bulkOperation { ${BULK_OP_FIELDS} }
          userErrors { field message }
        }
      }`,
      flags: {
        "mutation-file": { type: "string", required: true, description: "Path to .graphql mutation file" },
        "jsonl-staged-url": { type: "string", required: true, description: "stagedUploadsCreate resourceUrl from a JSONL upload" },
      },
      variables: (v) => ({
        mutation: readFileSync(v["mutation-file"], "utf8"),
        stagedUploadPath: v["jsonl-staged-url"],
      }),
    },
    "mutation-status": {
      kind: "graphql",
      description: "Same as query-status; reports current bulk-mutation state.",
      query: `query CurrentBulkOperation { currentBulkOperation { ${BULK_OP_FIELDS} } }`,
      flags: {},
      variables: () => ({}),
      project: (d) => d.currentBulkOperation,
    },
  },
};
