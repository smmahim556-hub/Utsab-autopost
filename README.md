# Utsab TV autopost

Every 5 minutes (GitHub Actions cron):
1. Reads https://utsabtv.com/ and finds news links not in `state/seen.json`.
2. Opens https://card.utsabtv.com/, pastes the link, clicks Fetch, then Download (Playwright).
3. Posts the card to each Facebook Page with the headline as caption, then comments the news link.

- First run only records the current links, so old news is not posted.
- Live since 2026-10-19: `DRY_RUN` defaults to `0` (posts for real). Set the `DRY_RUN` repository variable to `1` for a test mode that only makes cards (committed to `preview/`) and posts nothing.
- Secrets: `FB_PAGE_ID` and optionally `FB_PAGE_ID_2`, plus `FB_USER_TOKEN` (a long-lived user token; Page tokens are looked up from it and never expire). `FB_PAGE_TOKEN` / `FB_PAGE_TOKEN_2` work instead when no user token is set.
- Run the workflow by hand with **check** ticked to test the tokens without posting; the result is written to `state/check.json`. (see FACEBOOK-TOKEN-GUIDE.md).
- A failed item stays unseen and is retried next run; at most `MAX_PER_RUN` (3) posts per run.

Local run: `npm install && npx playwright install chromium && DRY_RUN=1 node autopost.js`

# YouTube upload

`youtube.js` (workflow **YouTube upload**, every 15 minutes) uploads each new video file put in a Google Drive folder to every channel (main + targets), with AI-written title/description/tags per channel (Gemini or Claude) and an optional thumbnail. A `.txt` with the same name gives the topic (first line) and notes; a `.jpg`/`.png` with the same name is the thumbnail. The file comes from Drive because YouTube blocks downloads from GitHub's servers.

- Setup and secrets: see YOUTUBE-SETUP-GUIDE.md.
- First run only records the videos already in the folder. Run by hand with **check** to test the tokens and folder (`state/youtube-check.json`), or with **file_name** (and **dry_run**) to test one file.
- Outcomes are written to `state/youtube-events.json`. A failed video is retried up to 3 times; at most `MAX_PER_RUN` (1) video per run because of the daily API quota.
