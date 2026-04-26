// GraphQL-aware mock server for shopify-admin-cli integration tests.
// Routes:
//   - POST /admin/api/<version>/graphql.json    — handler dispatched by operation name match
//   - POST <stagedUploadUrl>                    — multipart catch-all for staged uploads
import { createServer } from "node:http";

export async function mockGraphql(handlers, opts = {}) {
  const { stagedUploadHandler } = opts;
  const requests = [];

  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks);
    const ct = (req.headers["content-type"] || "").toLowerCase();

    let body = raw.toString("utf8");
    if (ct.includes("application/json") && body) {
      try { body = JSON.parse(body); } catch {}
    }

    const captured = {
      method: req.method,
      path: req.url,
      headers: { ...req.headers },
      body,
      raw,
      contentType: ct,
    };
    requests.push(captured);

    // Staged-upload catch-all (multipart/form-data target).
    if (req.method === "POST" && ct.includes("multipart/form-data") && stagedUploadHandler) {
      const result = await stagedUploadHandler(captured);
      res.writeHead(result.status ?? 201, { "content-type": "application/xml" });
      res.end(result.body || "<PostResponse></PostResponse>");
      return;
    }

    // GraphQL endpoint.
    if (req.method === "POST" && req.url.includes("/graphql.json")) {
      const op = typeof body === "object" ? body.query : "";
      const handler = pickHandler(handlers, op);
      if (!handler) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: "no mock handler matched" }] }));
        return;
      }
      const result = typeof handler === "function" ? await handler(captured) : handler;
      const status = result.status ?? 200;
      const headers = { "content-type": "application/json", ...(result.headers || {}) };
      res.writeHead(status, headers);
      res.end(typeof result.body === "string" ? result.body : JSON.stringify(result.body ?? null));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "unmatched route", method: req.method, path: req.url }));
  });

  await new Promise((r, rj) => {
    server.once("error", rj);
    server.listen(0, "127.0.0.1", () => { server.removeListener("error", rj); r(); });
  });

  const addr = server.address();
  return {
    url: `http://127.0.0.1:${addr.port}`,
    requests,
    async close() { server.closeAllConnections?.(); await new Promise((r) => server.close(() => r())); },
  };
}

// Pick a handler by trying each pattern as a substring of the GraphQL
// operation. First match wins. Patterns can be operation names ("Orders"),
// mutation names ("RefundCreate"), or any unique substring.
function pickHandler(handlers, query) {
  if (!query) return null;
  for (const [pattern, handler] of Object.entries(handlers)) {
    if (query.includes(pattern)) return handler;
  }
  return handlers["__default__"] || null;
}

// Back-compat: the old mockApi shape (REST per-route) is kept so existing
// tests can be migrated incrementally. New tests should use mockGraphql.
export { mockGraphql as mockApi };
