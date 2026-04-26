// Shopify SDK initialiser for custom-app (private/admin-token) mode.
// Wraps @shopify/shopify-api with the minimum config for a CLI:
// no OAuth, no session storage, no webhook validation — just an
// authenticated GraphQL client driven by a static admin API access token.
//
// Two env knobs:
//   SHOPIFY_STORE_URL       — required (e.g. fixcoffee.myshopify.com)
//   SHOPIFY_ADMIN_TOKEN     — required (custom-app admin API access token)
//   SHOPIFY_ADMIN_BASE_URL  — optional override; when set, the SDK is
//                             pointed at this URL instead of the live store.
//                             Used by integration tests to intercept the
//                             GraphQL POST without hitting Shopify.
import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import { authStatus } from "./auth.mjs";

export const API_VERSION = ApiVersion.January26;
export const GRAPHQL_PATH = `/admin/api/${API_VERSION}/graphql.json`;

let _shopify = null;
let _session = null;

function parseBaseOverride(raw) {
  // Accept "http://host:port" or "host:port"; return { hostName, hostScheme }.
  if (!raw) return null;
  let s = raw.trim();
  let scheme = "https";
  if (s.startsWith("http://")) { scheme = "http"; s = s.slice(7); }
  else if (s.startsWith("https://")) { s = s.slice(8); }
  s = s.replace(/\/+$/, "");
  return { hostName: s, hostScheme: scheme };
}

export function initShopify() {
  if (_shopify) return { shopify: _shopify, session: _session };
  const status = authStatus();
  if (!status.authenticated) {
    const err = new Error("auth_missing");
    err.code = "auth_missing";
    throw err;
  }
  const storeUrl = process.env.SHOPIFY_STORE_URL || "fixcoffee.myshopify.com";
  const override = parseBaseOverride(process.env.SHOPIFY_ADMIN_BASE_URL);
  const hostName = override ? override.hostName : storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const hostScheme = override ? override.hostScheme : "https";

  _shopify = shopifyApi({
    apiSecretKey: process.env.SHOPIFY_API_SECRET || "unused-for-custom-app",
    apiVersion: API_VERSION,
    isCustomStoreApp: true,
    adminApiAccessToken: status.token,
    isEmbeddedApp: false,
    hostName,
    hostScheme,
    logger: { level: 0 },
  });
  // The session domain must match the real store (the SDK validates),
  // even when the request is intercepted via SHOPIFY_ADMIN_BASE_URL.
  _session = _shopify.session.customAppSession(storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, ""));
  return { shopify: _shopify, session: _session };
}

export function gqlClient() {
  const { shopify, session } = initShopify();
  return new shopify.clients.Graphql({ session });
}
