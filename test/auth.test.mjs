// Auth-specific paths: X-Shopify-Access-Token header injection, 401/403
// mapping, and login --status reflection. Splits out of integration.test.mjs
// to keep responsibilities per-file.
import test from "node:test";
import assert from "node:assert/strict";
import { mockGraphql } from "./_mock-server.mjs";
import { run, runJson } from "./_helpers.mjs";

test("X-Shopify-Access-Token header is sent when SHOPIFY_ADMIN_TOKEN is set", async () => {
  const server = await mockGraphql({
    "query Shop": { status: 200, body: { data: { shop: { id: "gid://shopify/Shop/1", name: "Test", myshopifyDomain: "test.myshopify.com" } } } },
  });
  try {
    await runJson(["shop", "info"], {
      env: { SHOPIFY_ADMIN_TOKEN: "shpat_test_token_xyz", SHOPIFY_STORE_URL: "test.myshopify.com", SHOPIFY_ADMIN_BASE_URL: server.url },
    });
    const gqlReq = server.requests.find((r) => (r.path || "").includes("/graphql.json"));
    assert.ok(gqlReq, "no graphql request reached the mock");
    assert.equal(gqlReq.headers["x-shopify-access-token"], "shpat_test_token_xyz");
  } finally { await server.close(); }
});

test("401 → auth_invalid", async () => {
  const server = await mockGraphql({
    "query Shop": { status: 401, body: { errors: [{ message: "[API] Invalid API key or access token" }] } },
  });
  try {
    const r = await runJson(["shop", "info"], {
      env: { SHOPIFY_ADMIN_TOKEN: "wrong", SHOPIFY_STORE_URL: "test.myshopify.com", SHOPIFY_ADMIN_BASE_URL: server.url },
    });
    assert.equal(r.exitCode, 1);
    assert.equal(r.errJson.code, "auth_invalid");
  } finally { await server.close(); }
});

test("403 → forbidden", async () => {
  const server = await mockGraphql({
    "query Shop": { status: 403, body: { errors: [{ message: "Access denied for this resource" }] } },
  });
  try {
    const r = await runJson(["shop", "info"], {
      env: { SHOPIFY_ADMIN_TOKEN: "scoped", SHOPIFY_STORE_URL: "test.myshopify.com", SHOPIFY_ADMIN_BASE_URL: server.url },
    });
    assert.equal(r.exitCode, 1);
    assert.equal(r.errJson.code, "forbidden");
  } finally { await server.close(); }
});

test("login --status reports auth source", async () => {
  const r = await runJson(["login", "--status"], { env: { SHOPIFY_ADMIN_TOKEN: "live" } });
  assert.equal(r.exitCode, 0, r.stderr);
  assert.equal(r.json.authenticated, true);
  assert.equal(r.json.fromEnv, true);
  assert.equal(r.json.scheme, "api-key-header");
});
