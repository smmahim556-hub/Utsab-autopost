# Utsab TV autopost

Every 5 minutes (GitHub Actions cron):
1. Reads https://utsabtv.com/ and finds news links not in `state/seen.json`.
2. Opens https://card.utsabtv.com/, pastes the link, clicks Fetch, then Download (Playwright).
3. Posts the card to each Facebook Page with the headline as caption, then comments the news link.

- First run only records the current links, so old news is not posted.
- `DRY_RUN` repository variable defaults to `1`: cards are made and uploaded as the `cards` run artifact but nothing is posted; each card is also committed to `preview/` for checking. Set it to `0` to go live.
- Secrets: `FB_PAGE_ID`, `FB_PAGE_TOKEN`, and optionally `FB_PAGE_ID_2`, `FB_PAGE_TOKEN_2` for a second Page (see FACEBOOK-TOKEN-GUIDE.md).
- A failed item stays unseen and is retried next run; at most `MAX_PER_RUN` (3) posts per run.

Local run: `npm install && npx playwright install chromium && DRY_RUN=1 node autopost.js`
