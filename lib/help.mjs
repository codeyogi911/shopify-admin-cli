// Help text generators for shopify-admin-cli. Each command file declares
// a registry entry whose actions are GraphQL operations: { kind, query,
// description, flags }. A few commands declare REST-shaped actions for
// staged uploads. The generator handles both shapes.
const CLI = "shopify-admin-cli";

export function showRootHelp(version, registry) {
  let out = `${CLI} ${version}\nCLI for the Shopify Admin GraphQL API.\n\nUsage:\n  ${CLI} <resource> <action> [flags]\n  ${CLI} login [--token <t>] [--status]\n\nGlobal flags:\n  --json           Force JSON output\n  --dry-run        Print request without sending\n  --verbose        Print response extensions/cost to stderr\n  --all            Auto-paginate list actions (cursor via pageInfo)\n  --version, -v    Print version\n  --help, -h       Show this help\n\nResources:\n`;
  for (const r of Object.keys(registry).sort()) {
    out += `  ${r.padEnd(18)} ${Object.keys(registry[r]).join(", ")}\n`;
  }
  out += `\nUse '${CLI} <resource> --help' for actions, or '<resource> <action> --help' for flags.\n`;
  return out;
}

function describeAction(def) {
  if (def.kind === "graphql") return `GraphQL ${def.opType || "query"}`;
  if (def.kind === "rest") return `${def.method} ${def.path}`;
  if (def.method && def.path) return `${def.method} ${def.path}`;
  return "(graphql)";
}

export function showResourceHelp(resource, registry) {
  const actions = registry[resource];
  let out = `${CLI} ${resource}\n\nActions:\n`;
  for (const [name, def] of Object.entries(actions)) {
    out += `  ${name.padEnd(18)} ${describeAction(def)}\n`;
  }
  out += `\nUse '${CLI} ${resource} <action> --help' for flags.\n`;
  return out;
}

export function showActionHelp(resource, action, registry) {
  const def = registry[resource][action];
  let out = `${CLI} ${resource} ${action}\n\n${describeAction(def)}\n\n`;
  if (def.description) out += `${def.description}\n\n`;
  out += `Flags:\n`;
  const entries = Object.entries(def.flags || {});
  if (entries.length === 0) out += `  (none)\n`;
  for (const [name, spec] of entries) {
    const req = spec.required ? "required" : "optional";
    const desc = spec.description || "";
    out += `  --${name.padEnd(20)} ${(spec.type || "string").padEnd(8)} ${req.padEnd(8)} ${desc}\n`;
  }
  return out;
}
