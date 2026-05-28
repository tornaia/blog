# FOLLOWUPS.md template

A drop-in template for tracking PostHog-driven fixes through to verification. One entry per fix. Append entries below the **Pending** heading; move them under **Resolved** once the verification query confirms the fix held.

The full pattern is described in the [accompanying blog post](https://andrastornai.com/2026/05/28/the-follow-up-file/).

---

## <n> - <short identifying title>

- **Found via:** What PostHog signal / query first surfaced the issue. Include date
  and a one-line description of the volume / scope ("171 events / 13 users since
  2026-04-08").
- **Hypothesis:** Why we believe this is happening. Include the relevant code paths
  (file:line).
- **Fix applied:** What changed. File + line for each touch, and the commit hash if
  already merged.
- **Fix date:** YYYY-MM-DD (the day the code change landed locally).
- **Deploy date:** YYYY-MM-DD (when it reached production - backfill once deployed;
  the verify-by clock starts here).
- **Verify by:** YYYY-MM-DD (default deploy_date + 7 days; widen if the affected event
  is low-volume).
- **Verification query:** Exact PostHog / HogQL query to re-run. Must be self-contained
  and reproducible.
- **Expected outcome:** What "fixed" looks like in the query result, AND a sanity-check
  condition that proves the absence isn't just "no traffic" (e.g. "0 anomalies AND at
  least one new spectator join in the window").
- **Resolution:** _pending_ → fill in `YYYY-MM-DD - verified clean, removed` or
  `YYYY-MM-DD - still firing, see ...` once checked.

---

## How to use

1. Create a `FOLLOWUPS.md` at the root of your project with a `## Pending` section and a `## Resolved` section.
2. Each time you ship a PostHog-driven fix, add one entry under **Pending** the same day. Ten minutes per entry is the right cost; if it takes longer, your template is too heavy.
3. On the verify-by date - which should be on your calendar - run the **Verification query** and compare against the **Expected outcome**. Check both clauses: the success clause AND the sanity-check clause.
4. If both clauses pass, move the entry under **Resolved** with the date and a one-line summary. Do not delete it: the resolved log is a record of what was learned, and you will want to read it again next quarter.
5. If only the success clause passes (zero anomalies, but no traffic to test against), do not mark the entry resolved. Widen the verify-by date, or instrument a fresh signal that proves the affected flow ran.
