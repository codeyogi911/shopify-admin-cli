// Structural tests for shopify-admin-cli — no network, no auth.
// Verifies CLI shape: --version, --help, --dry-run, error semantics.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { run, runJson, REPO_ROOT } from "./_helpers.mjs";

const RESOURCES = [
  "products", "orders", "customers", "inventory", "collections", "discounts",
  "metafields", "fulfillment", "refunds", "draft-orders", "returns", "files",
  "webhooks", "bulk", "gql", "introspect", "shop",
];

test("--version prints package.json version", async () => {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  const r = await run(["--version"]);
  assert.equal(r.exitCode, 0);
  assert.equal(r.stdout.trim(), pkg.version);
});

test("--help lists every resource", async () => {
  const r = await run(["--help"]);
  assert.equal(r.exitCode, 0);
  for (const res of RESOURCES) assert.match(r.stdout, new RegExp(`\\b${res}\\b`));
  assert.match(r.stdout, /\blogin\b/);
});

test("orders --help lists every action", async () => {
  const r = await run(["orders", "--help"]);
  assert.equal(r.exitCode, 0);
  for (const a of ["list", "get", "cancel", "close", "reopen", "edit-begin", "edit-stage", "edit-commit"]) {
    assert.match(r.stdout, new RegExp(`\\b${a}\\b`));
  }
});

test("products create --help shows flag table", async () => {
  const r = await run(["products", "create", "--help"]);
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /Flags:/);
  assert.match(r.stdout, /--title/);
});

test("refunds create --help mentions --idempotency-key", async () => {
  const r = await run(["refunds", "create", "--help"]);
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /--idempotency-key/);
});

test("unknown resource → validation_error", async () => {
  const r = await runJson(["nope", "list"], { env: { SHOPIFY_ADMIN_TOKEN: "test", SHOPIFY_STORE_URL: "test.myshopify.com" } });
  assert.equal(r.exitCode, 1);
  assert.equal(r.errJson.code, "validation_error");
});

test("unknown action → validation_error listing available", async () => {
  const r = await runJson(["orders", "frobnicate"], { env: { SHOPIFY_ADMIN_TOKEN: "test", SHOPIFY_STORE_URL: "test.myshopify.com" } });
  assert.equal(r.exitCode, 1);
  assert.equal(r.errJson.code, "validation_error");
  assert.match(r.errJson.message, /list|get|cancel/);
});

test("required flag missing → validation_error", async () => {
  const r = await runJson(["orders", "get"], { env: { SHOPIFY_ADMIN_TOKEN: "test", SHOPIFY_STORE_URL: "test.myshopify.com" } });
  assert.equal(r.exitCode, 1);
  assert.equal(r.errJson.code, "validation_error");
  assert.match(r.errJson.message, /--id/);
});

test("auth missing → auth_missing", async () => {
  const r = await runJson(["orders", "list"]);
  assert.equal(r.exitCode, 1);
  assert.equal(r.errJson.code, "auth_missing");
});

test("--dry-run does not make network requests", async () => {
  const r = await runJson(["orders", "list", "--dry-run"], {
    env: { SHOPIFY_ADMIN_TOKEN: "test", SHOPIFY_STORE_URL: "test.myshopify.com", SHOPIFY_ADMIN_BASE_URL: "http://127.0.0.1:1" },
  });
  assert.equal(r.exitCode, 0, r.stderr);
  assert.equal(r.json.__dryRun, true);
  assert.equal(r.json.method, "POST");
  assert.match(r.json.url, /\/admin\/api\/.+\/graphql\.json$/);
});

test("source has no hardcoded secrets", () => {
  const src = readFileSync(join(REPO_ROOT, "bin/shopify-admin-cli.mjs"), "utf8");
  const PATTERNS = [/sk_live_[A-Za-z0-9]{20,}/, /ghp_[A-Za-z0-9]{20,}/, /Bearer\s+[A-Za-z0-9_\-]{30,}/, /xoxb-[A-Za-z0-9-]{20,}/];
  for (const p of PATTERNS) assert.ok(!p.test(src), `secret pattern ${p} matched`);
});

test("login --help describes login flags", async () => {
  const r = await run(["login", "--help"]);
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /--token/);
  assert.match(r.stdout, /--status/);
});
