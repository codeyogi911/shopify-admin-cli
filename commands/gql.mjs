// `gql` — generic escape hatch. Run any Admin GraphQL query/mutation
// without going through a pre-baked resource action. Useful for
// experimentation, ad-hoc lookups, and operations the CLI doesn't yet
// expose. Variables can be supplied inline (--variables) or by file.
import { readFileSync } from "node:fs";

export default {
  name: "gql",
  actions: {
    run: {
      kind: "graphql",
      description: "Send a raw GraphQL operation. Provide --query OR --query-file; optionally --variables / --variables-file.",
      query: "REPLACED_AT_RUNTIME",
      flags: {
        query: { type: "string", description: "Inline GraphQL query/mutation string" },
        "query-file": { type: "string", description: "Path to .graphql file" },
        variables: { type: "string", description: "Inline JSON variables" },
        "variables-file": { type: "string", description: "Path to JSON variables file" },
      },
      variables: (v) => v.variables ? JSON.parse(v.variables)
        : v["variables-file"] ? JSON.parse(readFileSync(v["variables-file"], "utf8"))
        : ({}),
      resolveQuery(values) {
        if (values.query) return values.query;
        if (values["query-file"]) return readFileSync(values["query-file"], "utf8");
        return null;
      },
    },
  },
};
