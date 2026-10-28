# YouTube Auto-Copy সেটআপের নিয়ম

মূল চ্যানেলে ভিডিও Public করুন, আর একই ভিডিও ফাইলটা Google Drive-এর একটা ফোল্ডারে রাখুন। ১৫ মিনিটের মধ্যে সেটা নিজে থেকে দ্বিতীয় চ্যানেলে আপলোড হবে। (YouTube GitHub-এর সার্ভার থেকে ভিডিও ডাউনলোড করতে দেয় না, তাই ফাইলটা Drive থেকে নেওয়া হয়।) নতুন title, description আর tags AI বানাবে, আর thumbnail মূল ভিডিওরটাই বসবে। সবকিছু GitHub Actions-এ চলে, তাই PC চালু রাখতে হবে না।

সব কাজ মোবাইল থেকেও করা যায়। Chrome-এর মেনু থেকে **Desktop site** চালু করে নিন।

> ⚠️ Client Secret, Refresh Token আর API Key পাসওয়ার্ডের মতো। এগুলো চ্যাটে বা অন্য কোথাও পাঠাবেন না, শুধু GitHub Secrets-এ রাখবেন (ধাপ ৬)।

## ১. Google Cloud Project বানান
1. https://console.cloud.google.com এ যেকোনো একটা Gmail দিয়ে ঢুকুন।
2. উপরের project list থেকে **New Project** বানান, নাম দিন যেমন `YouTube Copy`।
3. https://console.cloud.google.com/apis/library/youtube.googleapis.com খুলে **Enable** চাপুন।
4. https://console.cloud.google.com/apis/library/drive.googleapis.com খুলে **Google Drive API**-ও **Enable** করুন।

## ২. OAuth consent screen
1. **APIs & Services → OAuth consent screen** (বা **Google Auth Platform**) খুলুন, **Get started** চাপুন।
2. App name দিন, নিজের Gmail দিন, Audience **External** বাছুন, তারপর Create।
3. **Audience** পাতায় গিয়ে **Publish app** চাপুন, যাতে status **In production** হয়।
   এটা জরুরি। "Testing" অবস্থায় থাকলে token ৭ দিন পর বাতিল হয়ে যায়।
   Google verify করতে বললে এখন স্কিপ করুন, নিজের ব্যবহারের জন্য লাগবে না।

## ৩. OAuth Client বানান
1. **Credentials → Create credentials → OAuth client ID** (বা **Clients → Create client**)।
2. Application type: **Web application**।
3. **Authorized redirect URIs**-এ এটা যোগ করুন:
   `https://developers.google.com/oauthplayground`
4. Create চাপলে **Client ID** আর **Client Secret** পাবেন। দুটোই কপি করে রাখুন।

## ৪. দুই চ্যানেলের Refresh Token নিন
প্রতিটা চ্যানেলের জন্য একবার করে করতে হবে। দ্বিতীয়টার জন্য Incognito/Private ট্যাব ব্যবহার করুন, যাতে অন্য Gmail দিয়ে লগইন করা যায়।

1. https://developers.google.com/oauthplayground খুলুন।
2. ডানদিকে ⚙️ (settings) চাপুন, **Use your own OAuth credentials** টিক দিন, ধাপ ৩-এর Client ID আর Secret বসান।
3. বামদিকে নিচের ঘরে এটা লিখুন, তারপর **Authorize APIs** চাপুন:
   - মূল চ্যানেলের জন্য (YouTube + Drive পড়ার অনুমতি, মাঝে একটা space):
     `https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/drive.readonly`
   - দ্বিতীয় চ্যানেলের জন্য: `https://www.googleapis.com/auth/youtube`
4. সেই চ্যানেলের Gmail দিয়ে লগইন করুন। একাধিক চ্যানেল থাকলে সঠিক চ্যানেলটা বাছুন।
   "Google hasn't verified this app" দেখালে **Advanced → Go to ... (unsafe)** চাপুন। এটা আপনার নিজের app, তাই সমস্যা নেই।
5. **Exchange authorization code for tokens** চাপুন। **Refresh token** কপি করুন।

মূল চ্যানেলের token = `YT_MAIN_REFRESH_TOKEN`, দ্বিতীয় চ্যানেলের token = `YT_TARGET_REFRESH_TOKEN`।

## ৪.৫ Drive ফোল্ডার বানান
1. মূল চ্যানেলের Gmail দিয়ে https://drive.google.com খুলুন, **New → Folder**, নাম দিন `YouTube Copy`।
2. ফোল্ডারটা খুলুন। লিংকের শেষে `folders/` এর পরের অংশটা ফোল্ডার ID (যেমন `1AbC...xyz`)। এটা `DRIVE_FOLDER_ID`।
3. প্রতিটা ভিডিও মূল চ্যানেলে দেওয়ার সময় একই ফাইলটা এই ফোল্ডারে আপলোড করুন। ফাইলের নাম ভিডিওর title-এর মতো হলে ভালো, না হলে সবচেয়ে পুরনো নতুন ফাইলটা নেওয়া হয়।
   ৩ দিনের মধ্যে ফাইল না পেলে সেই ভিডিওটা বাদ দেওয়া হয়।

## ৫. AI-এর জন্য ফ্রি Gemini API Key
1. https://aistudio.google.com/apikey খুলুন, **Create API key** চাপুন, কপি করুন।
   (Claude ব্যবহার করতে চাইলে `GEMINI_API_KEY`-এর বদলে `ANTHROPIC_API_KEY` দিন।
   কোনো key না দিলে মূল ভিডিওর title/description/tags-ই বসবে।)

## ৬. GitHub Secrets-এ রাখুন
Repo → **Settings → Secrets and variables → Actions → New repository secret**। এই নামগুলোতে রাখুন:

| Secret | কী বসাবেন |
|---|---|
| `YT_CLIENT_ID` | ধাপ ৩-এর Client ID |
| `YT_CLIENT_SECRET` | ধাপ ৩-এর Client Secret |
| `YT_MAIN_REFRESH_TOKEN` | মূল চ্যানেলের refresh token |
| `YT_TARGET_REFRESH_TOKEN` | দ্বিতীয় চ্যানেলের refresh token |
| `GEMINI_API_KEY` | ধাপ ৫-এর key |
| `DRIVE_FOLDER_ID` | ধাপ ৪.৫-এর ফোল্ডার ID |

ভবিষ্যতে তৃতীয় চ্যানেল যোগ করতে চাইলে `YT_TARGET_REFRESH_TOKEN_2` যোগ করুন।

## ৭. পরীক্ষা করুন
1. Repo → **Actions → YouTube copy → Run workflow**, **check** টিক দিয়ে চালান।
   শেষ হলে `state/youtube-check.json` খুলে দেখুন দুই চ্যানেলের নাম ঠিক আছে কি না।
2. এবার কিছু টিক না দিয়ে একবার চালান। প্রথমবার শুধু পুরনো ভিডিওগুলো মনে রাখে, কিছু আপলোড করে না।
3. একটা নির্দিষ্ট ভিডিও দিয়ে পরীক্ষা করতে **video_id**-এ ভিডিওর id দিন (`youtu.be/` এর পরের অংশ)।
   শুধু SEO দেখতে চাইলে সাথে **dry_run** টিক দিন। ফল দেখা যাবে `state/youtube-events.json`-এ।

## জেনে রাখুন
- **Private থেকে যাওয়া:** Google-এর verify না করা app দিয়ে আপলোড করা ভিডিও YouTube নিজে থেকে Private করে রাখে।
  Public করতে https://support.google.com/youtube/contact/yt_api_form এ "YouTube API Services - Audit and Quota Extension" ফর্ম জমা দিন।
- **Quota:** প্রতিদিন ফ্রি ১০,০০০ unit। একটা আপলোডে ~১৬৫০ লাগে, মানে দিনে প্রায় ৬টা ভিডিও। বাকিগুলো পরের দিন যায়।
- **Duplicate content:** একই ভিডিও দুই চ্যানেলে দিলে YouTube "reused content" ধরতে পারে, monetization-এ সমস্যা হতে পারে।
- **Thumbnail:** দ্বিতীয় চ্যানেলে custom thumbnail দিতে চ্যানেলটা phone verified হতে হবে (https://www.youtube.com/verify)।
