---
title: "API version pinning + bump cadence"
type: pattern
source: shopify-docs
discovered: 2026-04-26
---

**What.** Shopify ships an Admin API version every quarter. Each version is supported for at least 12 months from release.

**Versions visible in 2026.**

| Version | Released | Supported until |
|---|---|---|
| `2025-01` | 2025-01 | ~2026-01 (deprecated) |
| `2025-04` | 2025-04 | ~2026-04 |
| `2025-07` | 2025-07 | ~2026-07 |
| `2025-10` | 2025-10 | ~2026-10 |
| `2026-01` | 2026-01 | ~2027-01 — **CLI default** |

**How to apply.**

1. Pinned in `lib/shopify.mjs` as `API_VERSION = ApiVersion.January26`.
2. To bump:
   - Read the [release notes](https://shopify.dev/docs/api/release-notes) for breaking changes.
   - Update `lib/shopify.mjs` and `.clify.json.defaults.apiVersion`.
   - Re-run integration tests.
   - Run `clify sync-check` to baseline doc drift.
3. Don't pin `unstable` — it changes daily.

**Per-request override.** The SDK builds the path from `API_VERSION`. If you need to test a specific version, set `API_VERSION` for one run via env-injection or a temporary edit.

**Deprecation.** Operations that are deprecated within the supported version surface in `extensions.deprecations` on every response. Watch stderr with `--verbose`.
