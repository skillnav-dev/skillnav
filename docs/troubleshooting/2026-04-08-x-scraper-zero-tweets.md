# X Scraper Returns 0 Tweets Despite Successful API Connection

**Date:** 2026-04-08
**Severity:** High (X signals completely missing)

## Symptoms

- `scrape-x-signals.mjs` reported "Fetched 0 tweets from 40 KOLs" with no errors
- TwitterAPI.io API returned HTTP 200 with valid JSON
- `scrape-x-signals.mjs` and `scrape-hn-signals.mjs` both reported `X_API_KEY is not set in environment` when run locally

## Root Cause (two bugs)

### Bug 1: Missing dotenv in community scrapers

`scrape-x-signals.mjs` and `scrape-hn-signals.mjs` were created without `dotenv.config()` calls. All other scripts in the project have them. CI worked because GitHub Actions injects secrets as environment variables directly.

### Bug 2: TwitterAPI.io response parsing mismatch

API response structure changed to `{ status, code, msg, data: { tweets: [...] } }`. The parser in `x-client.mjs` checked:
1. `data.tweets` — undefined (no top-level `tweets` key)
2. `data.data` — `{ pin_tweet, tweets: [...] }` — not an Array
3. `data` — an Object, not an Array

Result: `tweets = []` — silent data loss.

## Fix

1. Added `dotenv.config()` to both scraper scripts (3 lines each)
2. Added `data?.data?.tweets` as first check in x-client.mjs normalization chain

## Prevention

- New scripts must include dotenv loading — check during PR review
- API response parsing should log a warning when no tweets are found despite successful HTTP response
