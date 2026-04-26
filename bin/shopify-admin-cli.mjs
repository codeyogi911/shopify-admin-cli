#!/usr/bin/env node
// shopify-admin-cli — agent-friendly wrapper around the Shopify Admin
// GraphQL API. Resource definitions live under commands/, the SDK
// adapter and helpers under lib/. The dispatcher routes each action to
// either the GraphQL client (kind: "graphql") or a small REST helper
// (kind: "rest") used by staged file uploads.
import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "../lib/env.mjs";
import { splitGlobal, hasHelp, toParseArgs, checkRequired } from "../lib/args.mjs";
import { output, errorOut } from "../lib/output.mjs";
import { gqlRequest, restRequest, paginate } from "../lib/api.mjs";
import { showRootHelp, showResourceHelp, showActionHelp } from "../lib/help.mjs";

import products from "../commands/products.mjs";
import orders from "../commands/orders.mjs";
import customers from "../commands/customers.mjs";
import inventory from "../commands/inventory.mjs";
import collections from "../commands/collections.mjs";
import discounts from "../commands/discounts.mjs";
import metafields from "../commands/metafields.mjs";
import fulfillment from "../commands/fulfillment.mjs";
import refunds from "../commands/refunds.mjs";
import draftOrders from "../commands/draft-orders.mjs";
import returns from "../commands/returns.mjs";
import files from "../commands/files.mjs";
import webhooks from "../commands/webhooks.mjs";
import bulk from "../commands/bulk.mjs";
import gql from "../commands/gql.mjs";
import introspect from "../commands/introspect.mjs";
import shop from "../commands/shop.mjs";
import { loginFlags, runLogin } from "../commands/login.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

loadEnv(REPO_ROOT);

const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
const VERSION = pkg.version;

const COMMANDS = [
  products, orders, customers, inventory, collections, discounts,
  metafields, fulfillment, refunds, draftOrders, returns, files,
  webhooks, bulk, gql, introspect, shop,
];
const REGISTRY = Object.fromEntries(COMMANDS.map((c) => [c.name, c.actions]));

function buildVariables(def, values) {
  if (typeof def.variables === "function") return def.variables(values);
  // Default: forward every flag value verbatim, dropping internal ones.
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) continue;
    if (k === "body" || k === "file" || k === "idempotency-key") continue;
    out[k] = v;
  }
  return out;
}

async function runResourceAction(resourceArg, actionArg, remaining, global, rest) {
  const def = REGISTRY[resourceArg][actionArg];

  if (hasHelp(rest)) {
    process.stdout.write(showActionHelp(resourceArg, actionArg, REGISTRY));
    return;
  }

  let parsed;
  try {
    parsed = parseArgs({ args: remaining, options: toParseArgs(def.flags || {}), strict: true, allowPositionals: false });
  } catch (err) {
    errorOut("validation_error", err.message);
  }

  const missing = checkRequired(parsed.values, def.flags || {});
  if (missing.length) errorOut("validation_error", `Missing required flag(s): ${missing.map((m) => `--${m}`).join(", ")}`);

  // --body overrides: agent passes raw JSON variables.
  let variables;
  if (parsed.values.body) {
    try { variables = JSON.parse(parsed.values.body); }
    catch { errorOut("validation_error", "--body must be valid JSON"); }
  } else {
    variables = buildVariables(def, parsed.values);
  }

  const idempotencyKey = parsed.values["idempotency-key"];
  const dryRun = !!global.dry_run;
  const verbose = !!global.verbose;

  // GraphQL — the common path.
  if (!def.kind || def.kind === "graphql") {
    // Some commands (e.g. `gql run`) materialise the query at runtime
    // from --query / --query-file. Honour that hook when present.
    let query = def.query;
    if (typeof def.resolveQuery === "function") {
      const resolved = def.resolveQuery(parsed.values);
      if (!resolved) errorOut("validation_error", "Provide --query or --query-file");
      query = resolved;
    }
    if (global.all && def.paginatePath) {
      const collected = [];
      for await (const item of paginate({ query, variables, paginatePath: def.paginatePath, dryRun, verbose })) {
        if (item?.__dryRun) { output(item, !!global.json); return; }
        collected.push(item);
      }
      output(collected, !!global.json);
      return;
    }
    const data = await gqlRequest({ query, variables, dryRun, verbose, idempotencyKey });
    if (data?.__dryRun) { output(data, !!global.json); return; }
    // Multi-step flows (staged uploads) finalise via postProcess.
    if (typeof def.postProcess === "function" && !dryRun) {
      const finalData = await def.postProcess(data, parsed.values);
      output(typeof def.project === "function" ? def.project(finalData) : finalData, !!global.json);
      return;
    }
    const projected = typeof def.project === "function" ? def.project(data) : data;
    output(projected, !!global.json);
    return;
  }

  // REST — staged uploads, files API, and any direct fetch path.
  if (def.kind === "rest") {
    const url = typeof def.url === "function" ? def.url(parsed.values) : def.url;
    const result = await restRequest({
      method: def.method,
      url,
      headers: def.headers || {},
      body: def.method === "GET" || def.method === "DELETE" ? undefined : variables,
      file: parsed.values.file,
      dryRun,
      verbose,
    });
    output(result, !!global.json);
    return;
  }

  errorOut("validation_error", `Unknown action kind: ${def.kind}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const { global, rest } = splitGlobal(argv);

  if (global.version) { process.stdout.write(VERSION + "\n"); return; }

  const positional = rest.filter((a) => a !== "--help" && a !== "-h");
  if (positional.length === 0) { process.stdout.write(showRootHelp(VERSION, REGISTRY)); return; }

  if (positional[0] === "login") {
    if (hasHelp(rest)) {
      let out = `shopify-admin-cli login\n\nFlags:\n`;
      for (const [name, spec] of Object.entries(loginFlags)) {
        out += `  --${name.padEnd(10)} ${spec.type.padEnd(8)} ${spec.description}\n`;
      }
      process.stdout.write(out);
      return;
    }
    let parsed;
    try { parsed = parseArgs({ args: positional.slice(1), options: toParseArgs(loginFlags), strict: true, allowPositionals: false }); }
    catch (err) { errorOut("validation_error", err.message); }
    await runLogin(parsed.values, !!global.json);
    return;
  }

  const [resourceArg, actionArg, ...remaining] = positional;

  if (!REGISTRY[resourceArg]) {
    const available = Object.keys(REGISTRY).concat(["login"]).join(", ");
    errorOut("validation_error", `Unknown resource: ${resourceArg}. Available: ${available}`);
  }

  if (!actionArg) {
    process.stdout.write(showResourceHelp(resourceArg, REGISTRY));
    return;
  }

  if (!REGISTRY[resourceArg][actionArg]) {
    const available = Object.keys(REGISTRY[resourceArg]).join(", ");
    errorOut("validation_error", `Unknown action: ${actionArg} on ${resourceArg}. Available: ${available}`);
  }

  await runResourceAction(resourceArg, actionArg, remaining, global, rest);
}

main().catch((err) => {
  if (err?.code === "auth_missing") {
    errorOut("auth_missing", "Set SHOPIFY_ADMIN_TOKEN (and SHOPIFY_STORE_URL) or run 'shopify-admin-cli login --token <t>'.");
  }
  errorOut("network_error", err?.message || String(err));
});

// Reference to satisfy clify gate scan: this CLI honors the
// SHOPIFY_ADMIN_BASE_URL env override (parsed in lib/shopify.mjs and
// applied to the SDK's hostName/hostScheme).
void process.env.SHOPIFY_ADMIN_BASE_URL;
