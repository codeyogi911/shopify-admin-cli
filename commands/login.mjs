// `login` is the auth-management command — not a resource. It persists
// a custom-app admin API access token to ~/.config/shopify-admin-cli/
// credentials.json. The env var SHOPIFY_ADMIN_TOKEN always wins over
// the persisted token; --status reports which source is providing auth.
import { saveCredentials, credentialsPath } from "../lib/config.mjs";
import { authStatus } from "../lib/auth.mjs";
import { output, errorOut } from "../lib/output.mjs";

export const loginFlags = {
  token: { type: "string", description: "Admin API access token (shpat_...) to persist" },
  status: { type: "boolean", description: "Show current auth source without changing it" },
};

export async function runLogin(values, jsonRequested) {
  if (values.status) {
    const s = authStatus();
    // Don't leak the token itself.
    output({ scheme: s.scheme, envVar: s.envVar, header: s.header, fromEnv: s.fromEnv, fromConfig: s.fromConfig, authenticated: s.authenticated }, jsonRequested);
    return;
  }
  let token = values.token;
  if (!token) token = (process.env.SHOPIFY_ADMIN_LOGIN_TOKEN || "").trim();
  if (!token) {
    errorOut("validation_error", "Pass --token <value>, set SHOPIFY_ADMIN_LOGIN_TOKEN, or set SHOPIFY_ADMIN_TOKEN in your environment.");
  }
  saveCredentials({ token, savedAt: new Date().toISOString() });
  output({ ok: true, path: credentialsPath() }, jsonRequested);
}
