# Facebook Page Token বানানোর নিয়ম

এই কাজগুলো করতে হবে ফেসবুকের সেই অ্যাকাউন্ট দিয়ে, যেটা Utsab TV পেজের **Admin**। কম্পিউটারে করলে সবচেয়ে সহজ হবে।

> ⚠️ Token-টা একটা পাসওয়ার্ডের মতো। এটা চ্যাটে, গ্রুপে বা অন্য কোথাও পাঠাবেন না। এটা শুধু GitHub-এর Secrets-এ রাখা হবে, সেটা ধাপ ৫-এ আছে।

## ১. Facebook App বানান
1. https://developers.facebook.com এ যান। প্রথমবার হলে **Get Started** চাপুন, তাহলে আপনার developer অ্যাকাউন্ট খুলে যাবে।
2. **My Apps → Create App** চাপুন।
3. App-এর নাম দিন, যেমন `Utsab Autopost`।
4. Use case বাছার সময় **"Manage everything on your Page"** বাছুন।
5. Business portfolio চাইলে আপনার পেজের বিজনেস বাছুন, না থাকলে স্কিপ করুন। এরপর **Create App** চাপুন।

## ২. Permission যোগ করুন
1. App-এর ড্যাশবোর্ডে **Use cases → Manage everything on your Page → Customize** খুলুন।
2. এই তিনটা permission **Add** করুন:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_manage_engagement`

আপনি নিজে App আর পেজ দুটোরই অ্যাডমিন, তাই এজন্য App Review জমা দিতে হবে না।

## ৩. Token বানান
1. https://developers.facebook.com/tools/explorer খুলুন।
2. ডানদিকে **Meta App**-এর ঘরে আপনার নতুন App-টা বাছুন।
3. **User or Page** থেকে **Get Page Access Token** বাছুন। একটা লগইন উইন্ডো আসবে। সেখানে **Utsab TV** পেজটা টিক দিন আর সব permission Allow করুন।
4. Permissions-এর ঘরে উপরের তিনটা permission আছে কি না দেখে নিন, তারপর **Generate Access Token** চাপুন।

## ৪. Token-কে স্থায়ী করুন
এখন যে token পেলেন, সেটা মাত্র ১–২ ঘণ্টা কাজ করবে। স্থায়ী token পেতে:
1. Explorer-এ যে token দেখাচ্ছে, তার পাশের **ⓘ** চিহ্নে চাপুন। তারপর **Open in Access Token Tool** চাপুন।
2. নিচের দিকে **Extend Access Token** চাপুন। এবার একটা নতুন, লম্বা মেয়াদের token পাবেন। সেটা কপি করুন।
3. Explorer-এ ফিরে যান। Access Token-এর ঘরে নতুন token-টা পেস্ট করুন, উপরের ঘরে লিখুন `me/accounts`, তারপর **Submit** চাপুন।
4. ফলাফলে Utsab TV পেজের নিচে দুটো জিনিস পাবেন:
   - `id`: এটা আপনার **Page ID**
   - `access_token`: এটাই **Page Token**, যার মেয়াদ কখনো শেষ হয় না

## ৫. Token কোথায় রাখবেন
GitHub রিপোটা বানানো হয়ে গেলে, রিপোর **Settings → Secrets and variables → Actions → New repository secret** থেকে এই দুটো যোগ করুন:
- `FB_PAGE_ID`: আপনার Page ID
- `FB_PAGE_TOKEN`: আপনার Page Token

আমাকে শুধু জানালেই হবে যে এটা করা হয়ে গেছে। Token-টা আমাকে পাঠাতে হবে না।
