# `created_at:` and friends are interpreted in shop timezone, not UTC

## TL;DR

Shopify's search-syntax date comparators (`created_at:>X`, `updated_at:>=X`,
`processed_at:<X`, etc.) interpret `X` in the **shop's IANA timezone**, even
when you give it a UTC `Z` suffix or an explicit offset. Pass timestamps that
are already converted to shop-local time, and treat the cutoff as inclusive
on both ends if you want a calendar day.

## What this looks like in practice

For a shop on `Asia/Kolkata` (UTC+05:30), this query

```text
created_at:>2026-04-25T18:30:00Z
```

returns orders created from **2026-04-25T18:30:00 in IST onward** — i.e. it
treats `18:30:00` as local time and ignores the `Z`. So you also get orders
from the early hours of 2026-04-25 IST that you didn't want, while orders
from the first 18 hours of 2026-04-26 IST appear normally.

## How to query "today" or "yesterday" reliably

1. Compute the desired cutoff in the shop's timezone (Asia/Kolkata for
   Fix Coffee). For "today since midnight":

   ```bash
   today_local="$(TZ=Asia/Kolkata date +%Y-%m-%dT00:00:00)"
   ```

2. Pass that local-time string with **no offset suffix** to the query:

   ```bash
   shopify-admin-cli orders list \
     --query "created_at:>=${today_local}" \
     --first 50
   ```

3. Post-filter the JSON in your script if you need an exact local-day
   boundary, since the API still returns ordering by `created_at` and you
   may want to discard a stray late-night straggler from the previous day.

## Why this exists

The search index Shopify uses for `created_at:` lookups stores values in the
shop's local timezone. The `Z`/offset is parsed and converted, but only for
the timestamp components; the comparison still happens in the shop tz. The
admin REST/GraphQL filters that take `createdAtMin` / `createdAtMax`
arguments (e.g. `orders(query:..., createdAtMin: $iso)`) **do** respect UTC,
so use them when you can.

## Mental model

- Search-syntax comparator (`created_at:>X` inside `--query`) → shop tz.
- GraphQL connection arg (`createdAtMin: $iso`) → UTC.
- ISO timestamp on the response (`createdAt: "2026-04-26T12:06:45Z"`) → UTC.

When in doubt, post-filter in code with a real timezone-aware datetime
library (`zoneinfo`, `tzdata`) to get a deterministic answer.

## Worked example: Fix Coffee orders for "today" (IST)

```python
from datetime import datetime, timezone, timedelta
ist = timezone(timedelta(hours=5, minutes=30))
today = datetime.now(ist).date()
todays = [o for o in orders
          if datetime.fromisoformat(o["createdAt"].replace("Z","+00:00"))
                     .astimezone(ist).date() == today]
```

The CLI's `--query` gets you a small candidate set; the post-filter pins
the exact boundary.
