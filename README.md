# fsgreen — SabreFlexx Investment Dashboard
#
React + Vite + Tailwind dashboard over the SabreFlexx investment ledger,
fed from a private Google Sheet.

```
npm install
npm run dev
npm run verify        # golden-master + proxy transform checks
```

With no sheet configured the dashboard runs off the bundled snapshot in
[`src/data/raw.js`](src/data/raw.js) — nothing to set up to work on the UI.

## Architecture

Every figure on screen is **derived**, never transcribed. The sheet holds only
source records; totals, buckets and rollups are computed client-side.

```
Google Sheet ──▶ apps-script/Code.gs ──▶ source.js ──▶ normalize.js ──▶ derive.js ──▶ UI
   4 tabs         tab → JSON             fetch+cache    coerce+validate    selectors
```

| Module | Responsibility |
|---|---|
| [`data/source.js`](src/data/source.js) | The only module that knows where data physically lives. Fetch, timeout, localStorage cache, write-back. |
| [`data/normalize.js`](src/data/normalize.js) | Coerces loose sheet cells to typed objects. Bad rows are skipped **and reported**, never dropped silently. |
| [`data/derive.js`](src/data/derive.js) | Pure selectors — buckets, realtor rollups, KPIs, available pool. No I/O, no React. |
| [`hooks/useDashboardData.js`](src/hooks/useDashboardData.js) | Load, poll, refetch-on-focus, stale-while-revalidate. |
| [`components/`](src/components/) | Presentation only. Sections own their own filter state; charts are lazy-loaded. |

Recharts is ~380 kB and nothing above the fold needs it, so both chart
components sit behind `React.lazy` ([`charts/lazy.js`](src/components/charts/lazy.js)).
Every KPI, table and total paints without it — the entry chunk is 59 kB gzipped
against 170 kB when the charts were bundled in.

`days_left` and `bucket` are **not** sheet columns. They are computed from
`maturity_date` against `meta.as_of`, so the maturity schedule re-rolls itself
as time passes without anyone editing the sheet.

## Sheet schema

Four tabs. The header row is the contract — column order doesn't matter, and
headers are matched case-insensitively with spaces collapsed to underscores.

**`investments`**
```
customer | realtor | invested | at_maturity | start_date | maturity_date | status
```

**`cash`** — `account | type | balance` (`type` is `Bank` or `Placement`)

**`projects`** — `name | budget | status`

**`meta`** — one row: `as_of | currency | deposit_count`

Currency cells may be plain numbers or formatted (`₦50,000,000.00`); dates may
be real date cells, ISO text, or `DD/MM/YYYY`. All are handled.

## Sample data

```
npm run sample:csv
```

Writes four ready-to-paste CSVs into [`sample-data/`](sample-data/) — one per
tab, matching the schema above. Paste each into the correspondingly named tab
(Sheets will split on commas automatically) and the dashboard works end to end.

The ledger is **a complete 82 rows generated to hit the four bucket totals
exactly**, so the sample sheet reconciles against the same golden-master
figures as the real data:

```
₦1,868,015,000 invested · ₦2,486,560,650 payable · 82 deposits
```

Because it is complete, pasting it in retires the transcribed fallback in
`raw.js` and every headline figure becomes ledger-derived — which is the
cleanest way to confirm the whole pipeline works before real data goes in.

The generator self-verifies: it round-trips its own CSVs back through
`normalize.js` and `derive.js` and refuses to write anything if the totals
don't reconcile. It is seeded, so re-running produces identical files.

The seven ledger rows that were legible in the source export appear verbatim;
the other 75 customers are synthetic. In `cash.csv`, BROADVIEW and SKY CAPITAL
carry `estimated = TRUE` because those balances really were reconstructed —
set them to `FALSE` once you enter the actual figures.

## Connecting the sheet

1. **Build the tabs** above from the source export.
2. **Add the script** — in the spreadsheet, Extensions → Apps Script, and paste
   [`apps-script/Code.gs`](apps-script/Code.gs). Set `SHEET_ID` and `TOKEN`
   (`openssl rand -hex 24`).
3. **Deploy** — Deploy → New deployment → Web app, *Execute as: Me*,
   *Who has access: Anyone*. Copy the `/exec` URL.
4. **Point the app at it** — `cp .env.example .env` and fill in
   `VITE_SHEET_ENDPOINT` and `VITE_SHEET_TOKEN`. Restart `npm run dev`.

That's the whole switch. No code changes.

> **"Anyone" does not make the spreadsheet public.** It means anyone holding
> the URL can call *the script*, which reads the still-private sheet on your
> behalf and returns only the four tabs above.

### Security

The token rides in the query string, so it lands in browser history and
Google's request logs. It stops URL discovery; it is **not** authentication.
Treat the deployed URL as a password — keep it out of commits, rotate it by
redeploying if it leaks.

This matters because the sheet holds named individuals and their deposit
amounts. That is also why publish-to-web CSV and API-key access were rejected:
both require making the sheet readable by anyone with the link.

There is no OAuth flow to implement anywhere in this project — deploying the
script involves a one-time "authorize" click in the Apps Script editor, and
that is the whole of it. If the audience for this dashboard ever widens beyond
a trusted internal group, put the endpoint behind something that authenticates
*people* rather than URLs; only `VITE_SHEET_ENDPOINT` would change.

## Write-back (optional, off by default)

Project budgets can be pushed back to the sheet. Two switches, both off:

- `VITE_ENABLE_WRITEBACK=true` — shows the "Save to sheet" button
- `ALLOW_WRITES = true` in [`apps-script/Code.gs`](apps-script/Code.gs) — lets
  the endpoint accept a POST

> **Think before enabling.** Reads and writes share one credential — the token
> in the query string. With writes on, a leaked URL stops being a data-exposure
> problem and becomes "anyone can rewrite the sheet". Blast radius is capped to
> the `projects` tab; `investments` and `cash` are never writable at any
> setting, and that is enforced server-side rather than by the request.

Concurrent saves are serialised with `LockService`, so two people pressing Save
at once cannot interleave a clear with a write and leave the tab half-empty.

## Data integrity

`npm run verify` asserts the five identities that held across the original
hand-typed figures:

```
bucket principals  → Total Investments Collected   ₦1,868,015,000
bucket payables    → Total Payable at Maturity     ₦2,486,560,650
cash rows          → Total Cash Balances             ₦843,921,924
cash − <30d payable → Available to Spend             ₦212,748,174
bucket counts      → deposit count                            82
```

Run it after any change to the data layer, and after a large sheet edit.

### The 82-row caveat

Only 7 of 82 ledger rows survived the source export. Deriving 82 deposits'
worth of totals from 7 rows would understate every headline figure by ~90%, so
while `investments.length < meta.deposit_count` the bucket and realtor rollups
fall back to the transcribed `aggregates` block in `raw.js`, and the UI flags
the affected figures with an `est.` badge.

**This retires itself.** Once the sheet carries all 82 rows the fallback stops
firing, the badges disappear, and every figure becomes ledger-derived. No code
change needed. If the sheet is only partly populated *and* has no fallback, the
dashboard says so in a banner rather than rendering a plausible-looking lie.
