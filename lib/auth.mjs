// Auth resolver. Shopify Admin custom apps authenticate with a static
// access token sent as the X-Shopify-Access-Token header. This resolver
// preserves the same {applyAuth, authStatus} surface as the clify
// exemplar so help/login/status flows keep working — but the actual
// header injection happens inside @shopify/shopify-api, not here.
//
// Schemes the validation gate accepts: bearer | api-key-header | basic | none.
// We use api-key-header (custom header is X-Shopify-Access-Token).
import { loadCredentials } from "./config.mjs";

const SCHEME = "api-key-header";
const ENV_VAR = "SHOPIFY_ADMIN_TOKEN";
const HEADER = "X-Shopify-Access-Token";

export function resolveToken() {
  if (process.env[ENV_VAR]) return process.env[ENV_VAR];
  const creds = loadCredentials();
  return creds?.token || null;
}

export function applyAuth(headers) {
  const token = resolveToken();
  if (!token) return { ok: false, reason: "auth_missing" };
  headers[HEADER.toLowerCase()] = token;
  return { ok: true };
}

export function authStatus() {
  const token = resolveToken();
  const fromEnv = !!process.env[ENV_VAR];
  const fromConfig = !fromEnv && !!loadCredentials()?.token;
  return {
    scheme: SCHEME,
    envVar: ENV_VAR,
    header: HEADER,
    fromEnv,
    fromConfig,
    authenticated: !!token,
    token,
  };
}
