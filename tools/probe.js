// One-off: which entertainment feeds answer from the Actions runner. Writes state/ent-probe.json.
const fs = require('fs');
const feeds = {
  gnews_bd_ent: 'https://news.google.com/rss/search?q=%E0%A6%AC%E0%A6%BF%E0%A6%A8%E0%A7%8B%E0%A6%A6%E0%A6%A8&hl=bn&gl=BD&ceid=BD:bn',
  gnews_topic_ent_bn: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=bn&gl=BD&ceid=BD:bn',
  gnews_topic_ent_in_bn: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=bn&gl=IN&ceid=IN:bn',
  prothomalo: 'https://www.prothomalo.com/feed/entertainment',
  prothomalo_all: 'https://www.prothomalo.com/feed/',
  jugantor: 'https://www.jugantor.com/feed/rss.xml',
  kalerkantho: 'https://www.kalerkantho.com/rss.xml',
  bdnews24: 'https://bangla.bdnews24.com/?widgetName=rssfeed&widgetId=1151&getXmlFeed=true',
  samakal: 'https://samakal.com/feed',
  anandabazar_ent: 'https://www.anandabazar.com/entertainment/rss',
  banglanews24: 'https://www.banglanews24.com/rss/rss.xml',
  dhakapost: 'https://www.dhakapost.com/rss/rss.xml',
  jagonews: 'https://www.jagonews24.com/rss/rss.xml',
  bbc_bangla: 'https://feeds.bbci.co.uk/bengali/rss.xml',
};
(async () => {
  const out = {};
  for (const [k, u] of Object.entries(feeds)) {
    try {
      const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' } });
      const t = await r.text();
      const items = [...t.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6).map(m => {
        const g = tag => (m[1].match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)) || [])[1];
        return { title: g('title'), link: g('link'), cat: g('category'), img: (m[1].match(/(?:url|src)="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) || [])[1] };
      });
      out[k] = { status: r.status, n: (t.match(/<item>/g) || []).length, items, head: items.length ? undefined : t.slice(0, 200) };
    } catch (e) { out[k] = { error: e.message }; }
  }
  fs.writeFileSync('state/ent-probe.json', JSON.stringify(out, null, 2));
})();
