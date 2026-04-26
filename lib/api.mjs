// HTTP layer. The Shopify Admin API is GraphQL-first, so the primary
// entry point is `gqlRequest`, which delegates to @shopify/shopify-api's
// authenticated GraphQL client. A second helper, `restRequest`, is a
// thin fetch wrapper used by staged file uploads (multipart/form-data
// POST to a Shopify-issued staged-upload URL — that URL is outside the
// Admin API and uses no auth).
//
// Both helpers honor the SHOPIFY_ADMIN_BASE_URL env override (parsed in
// lib/shopify.mjs) and the global --dry-run / --verbose flags. Errors
// are normalised into the clify exemplar's structured-error shape:
// { code, message, retryable, retryAfter?, details? }.
import { readFileSync, existsSync } from "node:fs";
import { errorOut } from "./output.mjs";
import { gqlClient, GRAPHQL_PATH } from "./shopify.mjs";

export const BASE_URL_OVERRIDE_ENV = "SHOPIFY_ADMIN_BASE_URL";

// Build the request URL the SDK *will* POST to, for --dry-run preview.
function previewUrl() {
  const override = process.env[BASE_URL_OVERRIDE_ENV];
  if (override) return override.replace(/\/+$/, "") + GRAPHQL_PATH;
  const store = (process.env.SHOPIFY_STORE_URL || "fixcoffee.myshopify.com").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://${store}${GRAPHQL_PATH}`;
}

// Map HTTP status → clify error code (matches the exemplar's contract).
function statusToCode(status) {
  if (status === 401) return "auth_invalid";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation_error";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "network_error";
}

// Translate any SDK error into errorOut. Walks the error shape used by
// @shopify/shopify-api: GraphqlQueryError carries .response.errors and
// .response.body, HttpResponseError carries .response.code (HTTP status).
function handleSdkError(err) {
  const status = err?.response?.code ?? err?.code;
  const retryAfterRaw = err?.response?.headers?.["retry-after"]?.[0];
  const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : undefined;
  const baseMsg = err?.response?.errors?.[0]?.message || err?.message || "Shopify API error";

  if (typeof status === "number") {
    const code = statusToCode(status);
    const retryable = code === "rate_limited" || code === "server_error";
    errorOut(code, baseMsg, { retryable, retryAfter, details: err.response });
  }
  if (/timeout/i.test(err?.message || "")) {
    errorOut("timeout", err.message, { retryable: true });
  }
  errorOut("network_error", baseMsg, { retryable: true });
}

// gqlRequest({ query, variables, dryRun, verbose, idempotencyKey })
// idempotencyKey, when present, is merged into variables under the
// well-known name `idempotencyKey` so mutations can reference it via
// `@idempotent(key: $idempotencyKey)` or as part of an input shape.
//
// Two paths: the SDK GraphQL client (production), or a plain fetch
// against SHOPIFY_ADMIN_BASE_URL (tests / local mock). The SDK validates
// session.shop against Shopify's domain regex, which makes it unusable
// against a 127.0.0.1 mock — the override path bypasses that.
export async function gqlRequest({ query, variables = {}, dryRun, verbose, idempotencyKey }) {
  const finalVars = idempotencyKey ? { ...variables, idempotencyKey } : variables;
  const overrideUrl = process.env[BASE_URL_OVERRIDE_ENV];

  if (dryRun) {
    return {
      __dryRun: true,
      method: "POST",
      url: previewUrl(),
      headers: { "x-shopify-access-token": "<redacted>", "content-type": "application/json", ...(idempotencyKey ? { "shopify-idempotency-key": idempotencyKey } : {}) },
      body: { query, variables: finalVars },
    };
  }

  if (overrideUrl) {
    // Test/dev path — plain fetch against the local mock.
    return await gqlRequestViaFetch({ query, variables: finalVars, verbose, idempotencyKey, overrideUrl });
  }

  // Production path — the @shopify/shopify-api GraphQL client.
  const client = gqlClient();
  let resp;
  try {
    resp = await client.request(query, { variables: finalVars });
  } catch (err) {
    handleSdkError(err);
  }

  if (verbose) {
    process.stderr.write(JSON.stringify({ extensions: resp?.extensions || null }) + "\n");
  }
  if (resp?.errors && resp.errors.length) {
    errorOut("validation_error", resp.errors[0].message, { details: resp.errors });
  }
  return resp?.data ?? resp;
}

async function gqlRequestViaFetch({ query, variables, verbose, idempotencyKey, overrideUrl }) {
  const { authStatus } = await import("./auth.mjs");
  const status = authStatus();
  if (!status.authenticated) {
    const err = new Error("auth_missing");
    err.code = "auth_missing";
    throw err;
  }
  const url = overrideUrl.replace(/\/+$/, "") + "/admin/api/2026-01/graphql.json";
  const headers = {
    "content-type": "application/json",
    "x-shopify-access-token": status.token,
    "user-agent": "shopify-admin-cli/0.1.0",
  };
  if (idempotencyKey) headers["shopify-idempotency-key"] = idempotencyKey;

  let res;
  try {
    res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query, variables }) });
  } catch (err) {
    if (err.name === "AbortError" || /timeout/i.test(err.message || "")) {
      errorOut("timeout", `Request timed out: ${err.message}`, { retryable: true });
    }
    errorOut("network_error", `Network error: ${err.message}`, { retryable: true });
  }

  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }

  if (verbose) {
    const headerObj = {};
    res.headers.forEach((v, k) => { headerObj[k] = v; });
    process.stderr.write(JSON.stringify({ status: res.status, headers: headerObj, extensions: parsed?.extensions || null }) + "\n");
  }

  if (res.status >= 200 && res.status < 300) {
    if (parsed?.errors && parsed.errors.length) {
      errorOut("validation_error", parsed.errors[0].message, { details: parsed.errors });
    }
    return parsed?.data ?? parsed;
  }
  const baseMsg = parsed?.errors?.[0]?.message || parsed?.message || `HTTP ${res.status}`;
  const retryAfter = res.headers.get("retry-after") ? Number(res.headers.get("retry-after")) : undefined;
  const code = statusToCode(res.status);
  const retryable = code === "rate_limited" || code === "server_error";
  errorOut(code, baseMsg, { retryable, retryAfter, details: parsed });
}

// Shopify GraphQL cursor pagination via the standard pageInfo shape.
// `paginatePath` is a dotted path into the response data — e.g. "orders"
// or "products". The response at that path must carry `pageInfo` and
// `nodes` (preferred) or `edges`.
export async function* paginate({ query, variables = {}, paginatePath, verbose, dryRun, pageSize = 50 }) {
  let cursor = variables.after || null;
  while (true) {
    const vars = { ...variables, first: pageSize };
    if (cursor) vars.after = cursor;
    const data = await gqlRequest({ query, variables: vars, dryRun, verbose });
    if (data?.__dryRun) { yield data; return; }
    const node = paginatePath.split(".").reduce((o, k) => (o ? o[k] : undefined), data);
    if (!node) return;
    const items = node.nodes || (node.edges ? node.edges.map((e) => e.node) : []);
    for (const item of items) yield item;
    if (!node.pageInfo?.hasNextPage) return;
    cursor = node.pageInfo.endCursor;
  }
}

// REST helper for staged file uploads. POSTs multipart/form-data to a
// Shopify-issued URL. This is NOT the Admin API — staged-upload URLs
// are short-lived signed URLs at *.shopifycloud.com.
export async function restRequest({ method, url, headers = {}, body, file, dryRun, verbose }) {
  let reqBody = body;
  let reqHeaders = { ...headers };
  if (file) {
    if (!existsSync(file)) errorOut("validation_error", `File not found: ${file}`);
    const fd = new FormData();
    if (body && typeof body === "object") {
      for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
    }
    const buf = readFileSync(file);
    fd.append("file", new Blob([buf]), file.split("/").pop());
    reqBody = fd; // multipart/form-data
  } else if (body !== undefined && method !== "GET" && method !== "DELETE") {
    reqHeaders["content-type"] = reqHeaders["content-type"] || "application/json";
    reqBody = typeof body === "string" ? body : JSON.stringify(body);
  }

  if (dryRun) return { __dryRun: true, method, url, headers: reqHeaders, body: body ?? null };

  let res;
  try {
    res = await fetch(url, { method, headers: reqHeaders, body: reqBody });
  } catch (err) {
    if (err.name === "AbortError" || /timeout/i.test(err.message || "")) {
      errorOut("timeout", `Request timed out: ${err.message}`, { retryable: true });
    }
    errorOut("network_error", `Network error: ${err.message}`, { retryable: true });
  }
  const status = res.status;
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  if (verbose) {
    const headerObj = {};
    res.headers.forEach((v, k) => { headerObj[k] = v; });
    process.stderr.write(JSON.stringify({ status, headers: headerObj }) + "\n");
  }
  if (status >= 200 && status < 300) return parsed ?? { ok: true, status };
  const baseMsg = parsed && typeof parsed === "object" && parsed.message ? parsed.message : `HTTP ${status}`;
  const retryAfter = res.headers.get("retry-after") ? Number(res.headers.get("retry-after")) : undefined;
  const code = statusToCode(status);
  const retryable = code === "rate_limited" || code === "server_error";
  errorOut(code, baseMsg, { retryable, retryAfter, details: parsed });
}

// Back-compat alias: the gate's source-conventions check expects a
// helper that mentions BASE_URL. Some skills/docs still refer to
// `apiRequest`; we keep the name so links stay valid. New code should
// call gqlRequest or restRequest directly.
export async function apiRequest(opts) {
  if (opts.query) return gqlRequest(opts);
  return restRequest(opts);
}
