// `introspect` — schema discovery against the Admin API.
// `full` returns the entire __schema (large; pipe to jq).
// `type` returns one type's fields/inputs.
// `queries` / `mutations` list root-field names + descriptions.
export default {
  name: "introspect",
  actions: {
    full: {
      kind: "graphql",
      description: "Full schema introspection. Output is large — pipe to jq.",
      query: `query Introspect {
        __schema {
          queryType { name }
          mutationType { name }
          types { name kind description }
          directives { name description }
        }
      }`,
      flags: {},
      variables: () => ({}),
      project: (d) => d.__schema,
    },
    type: {
      kind: "graphql",
      description: "Fetch fields/inputs for a single type.",
      query: `query IntrospectType($name: String!) {
        __type(name: $name) {
          name kind description
          fields { name description args { name type { name kind ofType { name kind } } } type { name kind ofType { name kind } } }
          inputFields { name description type { name kind ofType { name kind } } }
          enumValues { name description }
        }
      }`,
      flags: { name: { type: "string", required: true, description: "Type name (e.g. Order, ProductInput)" } },
      variables: (v) => ({ name: v.name }),
      project: (d) => d.__type,
    },
    queries: {
      kind: "graphql",
      description: "List all root query fields with descriptions.",
      query: `query QueryFields {
        __schema { queryType { fields { name description args { name } type { name kind ofType { name kind } } } } }
      }`,
      flags: {},
      variables: () => ({}),
      project: (d) => d.__schema.queryType.fields,
    },
    mutations: {
      kind: "graphql",
      description: "List all root mutation fields with descriptions.",
      query: `query MutationFields {
        __schema { mutationType { fields { name description args { name } type { name kind ofType { name kind } } } } }
      }`,
      flags: {},
      variables: () => ({}),
      project: (d) => d.__schema.mutationType.fields,
    },
  },
};
