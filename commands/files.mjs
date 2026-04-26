// `files` resource — Shopify Admin GraphQL + staged uploads.
// Upload flow:
//   1. mutation stagedUploadsCreate({input: [{filename, mimeType, fileSize, ...}]})
//      → returns { stagedTargets: [{ url, parameters: [{name,value}], resourceUrl }] }
//   2. POST file (multipart/form-data) to stagedTarget.url with parameters
//      as form fields. The presence of FormData in this file is required
//      by clify's nuance check for multiPart endpoints.
//   3. mutation fileCreate({files: [{originalSource: stagedTarget.resourceUrl}]})
import { readFileSync, statSync } from "node:fs";
import { gqlRequest, restRequest } from "../lib/api.mjs";
import { errorOut } from "../lib/output.mjs";

const FILE_FIELDS = `id alt fileStatus createdAt
  ... on MediaImage { image { url width height } }
  ... on GenericFile { url originalFileSize mimeType }
  ... on Video { sources { url mimeType format width height } }`;

const STAGED_UPLOADS_CREATE = `mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets { url resourceUrl parameters { name value } }
    userErrors { field message }
  }
}`;

const FILE_CREATE = `mutation FileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files { ${FILE_FIELDS} }
    userErrors { field message }
  }
}`;

export default {
  name: "files",
  actions: {
    list: {
      kind: "graphql",
      description: "List files.",
      paginatePath: "files",
      query: `query Files($first: Int!, $after: String, $query: String) {
        files(first: $first, after: $after, query: $query) {
          nodes { ${FILE_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      flags: {
        first: { type: "string", description: "Page size (default 50)" },
        after: { type: "string", description: "Cursor" },
        query: { type: "string", description: "Shopify search-syntax filter" },
      },
      variables: (v) => ({ first: v.first ? Number(v.first) : 50, after: v.after, query: v.query }),
      project: (d) => d.files,
    },
    upload: {
      // Custom kind — the dispatcher delegates to runUpload below.
      kind: "graphql",
      description: "Three-step staged upload of a local file. Uses multipart/form-data on the staged URL (FormData internally).",
      query: STAGED_UPLOADS_CREATE,
      flags: {
        file: { type: "string", required: true, description: "Path to local file" },
        alt: { type: "string", description: "Alt text" },
        resource: { type: "string", description: "FILE | IMAGE | VIDEO | MODEL_3D (default FILE)" },
      },
      variables: (v) => {
        const stat = statSync(v.file);
        const filename = v.file.split("/").pop();
        const mime = guessMime(filename);
        return {
          input: [{
            filename,
            mimeType: mime,
            fileSize: String(stat.size),
            httpMethod: "POST",
            resource: v.resource || "FILE",
          }],
        };
      },
      // The dispatcher pipes (def.kind === "graphql") + project. We override
      // project to *not* finalize: the staged-target POST and fileCreate
      // happen via a follow-up call in run(). Instead, expose a
      // post-processor that the dispatcher invokes when present.
      postProcess: async (data, parsedValues) => {
        const target = data?.stagedUploadsCreate?.stagedTargets?.[0];
        if (!target) errorOut("validation_error", "stagedUploadsCreate returned no targets");
        const formBody = {};
        for (const p of target.parameters) formBody[p.name] = p.value;
        await restRequest({
          method: "POST",
          url: target.url,
          body: formBody,
          file: parsedValues.file,
        });
        const finalize = await gqlRequest({
          query: FILE_CREATE,
          variables: { files: [{ originalSource: target.resourceUrl, alt: parsedValues.alt }] },
        });
        return finalize;
      },
    },
    delete: {
      kind: "graphql",
      description: "Delete one or more files.",
      query: `mutation FileDelete($fileIds: [ID!]!) {
        fileDelete(fileIds: $fileIds) {
          deletedFileIds
          userErrors { field message }
        }
      }`,
      flags: { ids: { type: "string", required: true, description: "Comma-separated File GIDs" } },
      variables: (v) => ({ fileIds: v.ids.split(",").map((s) => s.trim()) }),
    },
  },
};

function guessMime(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  return ({
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
    svg: "image/svg+xml", mp4: "video/mp4", mov: "video/quicktime", pdf: "application/pdf",
    csv: "text/csv", txt: "text/plain", json: "application/json",
  })[ext] || "application/octet-stream";
}
