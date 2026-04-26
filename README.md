# shopify-admin-cli

A hand-crafted, fictional CLI used as the **stencil** for the [clify](https://github.com/codeyogi911/clify) scaffolder.

`shopify-admin-cli` is structurally inspired by [google/agents-cli](https://github.com/google/agents-cli):

- Hierarchical subcommands (`<resource> <action>`).
- One file per resource under `commands/`.
- Shared HTTP, auth, output, and config layers under `lib/`.
- A first-class `login` command with `--status`.
- Modular skills under `skills/<cli>-<role>/`.
- Fully tested against an in-repo mock server — no network needed for `npm test`.

The "Shopify Admin API" is fictional. The clify scaffolder copies this whole tree, mechanically renames `shopify-admin` / `SHOPIFY_ADMIN` / `Shopify Admin` to the target API's name, and an LLM substitutes the resource registry, knowledge files, and tests to match.

## Layout

```
shopify-admin-cli/
├── bin/shopify-admin-cli.mjs          thin dispatcher
├── lib/
│   ├── api.mjs                   apiRequest + cursor pagination
│   ├── auth.mjs                  pluggable auth (bearer)
│   ├── config.mjs                ~/.config/shopify-admin-cli/credentials.json
│   ├── env.mjs                   .env loader
│   ├── args.mjs                  splitGlobal, parseArgs adapters
│   ├── help.mjs                  --help generators
│   └── output.mjs                output, errorOut
├── commands/
│   ├── items.mjs                 list/get/create/update/delete (+ idempotency, if-match)
│   ├── item-variants.mjs         sub-resource of items
│   ├── orders.mjs                list/get/create/upload (multipart)
│   └── login.mjs                 token persistence + --status
├── skills/                       modular, four files
├── knowledge/                    business rules + patterns
├── test/
│   ├── _helpers.mjs              spawn-CLI helper
│   ├── _mock-server.mjs          zero-dep HTTP mock
│   ├── smoke.test.mjs            structural tests
│   ├── integration.test.mjs      mock-driven CRUD + pagination + multipart
│   └── auth.test.mjs             bearer wiring + login --status
├── .clify.json                   metadata read by the validator
├── coverage.json                 every endpoint, included or dropped
├── .env.example                  SHOPIFY_ADMIN_API_KEY + SHOPIFY_ADMIN_BASE_URL
└── .github/workflows/test.yml    Node 20 + 22 CI
```

## Use

```
SHOPIFY_ADMIN_API_KEY=test shopify-admin-cli items list --all
shopify-admin-cli items create --name Widget --sku W-001 --price 9.99 --idempotency-key "$(uuidgen)"
shopify-admin-cli orders upload --id ord-1 --file ./receipt.pdf
```

## Test

```
npm test
```

Runs smoke (no network), integration (against `test/_mock-server.mjs`), and auth tests on the current Node version. CI runs the same on Node 20 and 22.

## Why a fictional API

Real APIs come with real quirks, real auth flows, and real onboarding requirements. A stencil tied to one real API would teach the scaffolder that API's idiosyncrasies as universal patterns. By staying fictional, this shopify-admin keeps the structural lessons (how resources are split into files, how auth is pluggable, how pagination is library-level) free of any API's specific shape.
