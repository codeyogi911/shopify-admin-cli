---
title: "Bulk operations — async query/mutation lifecycle"
type: pattern
source: shopify-docs
discovered: 2026-04-26
applies-to: ["bulk.query", "bulk.query-status", "bulk.mutation", "bulk.mutation-status"]
---

**What.** The Bulk Operations API runs queries and mutations asynchronously, with no per-query cost budget and no pagination. Output is a JSONL file at a signed URL.

**Lifecycle.**

```
bulk query    → bulkOperation.id, status: CREATED
                ↓
              status: RUNNING
                ↓
              status: COMPLETED  → url (JSONL download)
                or FAILED        → errorCode
                or CANCELED
```

**One at a time.** Only one bulk *query* and one bulk *mutation* can be running per shop at any given time. Calling `bulk query` while another query is RUNNING will fail with `BULK_OPERATION_IN_PROGRESS` — cancel the existing one first or wait for it to finish.

**How to apply.**

```bash
# 1. Kick off
shopify-admin-cli bulk query --query-file ./bulk-orders.graphql --json

# 2. Poll until COMPLETED
while true; do
  STATUS=$(shopify-admin-cli bulk query-status --json | jq -r .status)
  echo "$STATUS"
  [ "$STATUS" = "COMPLETED" ] && break
  [ "$STATUS" = "FAILED" ] && exit 1
  sleep 5
done

# 3. Download + parse JSONL
URL=$(shopify-admin-cli bulk query-status --json | jq -r .url)
curl -s "$URL" > orders.jsonl
jq -c . orders.jsonl | head
```

**Bulk mutation.** The mutation form requires you to first upload a JSONL file via staged uploads, then pass the `resourceUrl` as `--jsonl-staged-url`. See `staged-uploads.md`.

**JSONL parents/children.** Bulk-query output is flat JSONL with `__parentId` linking nested resources. Reassemble client-side or stream-process.
