/**
 * Auto import: pull headline, featured image and publish date out of a news URL.
 *
 * Fetch order is own PHP proxy first (reliable, no third party sees the
 * traffic), then public CORS relays as a fallback when it is unavailable.
 * The own proxy is skipped when the page is opened from disk, where /api does
 * not exist.
 *
 * Everything extracted is plain text and escaped again at render time. Values
 * taken from DOM attributes and textContent were already entity-decoded by the
 * parser and are never decoded twice; values taken from JSON-LD were not, so
 * those go through decodeEntities.
 */
window.PC = window.PC || {};

PC.scrape = (function () {
    'use strict';

    const RELAYS = [
        { build: (u) => u, type: 'text' },
        { build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, type: 'text' },
        { build: (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`, type: 'text' },
        { build: (u) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`, type: 'text' },
        { build: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, type: 'json' },
        { build: (u) => `https://whateverorigin.org/get?url=${encodeURIComponent(u)}`, type: 'json' }
    ];

    const OWN_PROXY = { build: (u) => `api/proxy.php?url=${encodeURIComponent(u)}`, type: 'text' };

    let currentFetchId = 0;

    function sources() {
        return PC.util.isFileProtocol() ? RELAYS : [OWN_PROXY].concat(RELAYS);
    }

    async function fetchPageHtml(url) {
        for (const source of sources()) {
            try {
                const res = await PC.util.fetchWithTimeout(source.build(url), { referrerPolicy: 'no-referrer' }, 12000);
                if (!res.ok) continue;

                const html = source.type === 'json'
                    ? ((await res.json()) || {}).contents
                    : await res.text();

                if (html && html.length > 200 && /<\/?[a-z]/i.test(html)) return html;
            } catch (e) {
                // Next source.
            }
        }
        throw new Error('All HTML fetch strategies failed');
    }

    /* -------------------------------------------------------- extraction */

    function collectJsonLd(doc) {
        const nodes = [];
        doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            try {
                const parsed = JSON.parse(script.textContent.trim());
                const list = Array.isArray(parsed) ? parsed : [parsed];
                list.forEach(entry => {
                    if (!entry) return;
                    if (Array.isArray(entry['@graph'])) nodes.push(...entry['@graph']);
                    else nodes.push(entry);
                });
            } catch (e) {
                // Malformed JSON-LD on the page; ignore it.
            }
        });
        return nodes;
    }

    function jsonLdImage(value) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return jsonLdImage(value[0]);
        if (typeof value === 'object') return value.url || value.contentUrl || '';
        return '';
    }

    /** Drop a trailing " - Site Name" / " | Site Name" from a <title>. */
    function stripSiteSuffix(title, siteName) {
        if (!title) return '';
        let out = title.trim();
        if (siteName) {
            const escaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            out = out.replace(new RegExp(`\\s*[|\\-–—·]\\s*${escaped}\\s*$`, 'i'), '');
        }
        return out.replace(/\s*[|\-–—·]\s*[^|\-–—·]{2,30}$/, (match) => (out.length > 45 ? '' : match)).trim();
    }

    function parseArticleMeta(html, baseUrl) {
        const normalize = PC.util.normalizeText;
        // JSON-LD comes through JSON.parse, which leaves HTML entities intact,
        // so those values need decoding. DOM attributes and textContent were
        // already decoded by the parser and must not be decoded twice.
        const fromJsonLd = PC.util.decodeEntities;

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const meta = (selector) => {
            const node = doc.querySelector(selector);
            return node ? normalize(node.getAttribute('content')) : '';
        };

        const article = collectJsonLd(doc).find(node => {
            const type = node['@type'];
            const types = Array.isArray(type) ? type : [type];
            return types.some(t => /article|newsarticle|blogposting/i.test(String(t || '')));
        }) || {};

        const siteName = meta('meta[property="og:site_name"]');

        // Headline
        let heading = fromJsonLd(article.headline || article.name || '')
            || meta('meta[property="og:title"]')
            || meta('meta[name="twitter:title"]');
        if (!heading) {
            const h1 = doc.querySelector('article h1, .post-header h1, h1');
            if (h1) heading = PC.util.textOf(h1);
        }
        if (!heading) {
            const titleTag = doc.querySelector('title');
            if (titleTag) heading = PC.util.textOf(titleTag);
        }
        heading = stripSiteSuffix(heading, siteName);

        // Featured image
        let image = fromJsonLd(jsonLdImage(article.image))
            || meta('meta[property="og:image"]')
            || meta('meta[property="og:image:url"]')
            || meta('meta[name="twitter:image"]');
        if (!image) {
            const img = doc.querySelector('.post-featured-image, article img, .post-content img, img');
            if (img) image = img.getAttribute('src') || img.getAttribute('data-src') || '';
        }
        image = PC.util.absoluteUrl(image, baseUrl);

        // Published date
        let rawDate = article.datePublished
            || meta('meta[property="article:published_time"]')
            || meta('meta[itemprop="datePublished"]')
            || meta('meta[name="publish-date"]')
            || meta('meta[name="date"]');
        if (!rawDate) {
            const timeEl = doc.querySelector('time[datetime]');
            if (timeEl) rawDate = timeEl.getAttribute('datetime');
        }
        if (!rawDate) {
            const timeText = doc.querySelector('time');
            if (timeText) rawDate = PC.util.textOf(timeText);
        }

        const parts = PC.bengali.isoDatePartsFrom(rawDate);
        const date = parts ? PC.bengali.formatBengaliDate(parts.y, parts.m, parts.d) : '';

        const summary = meta('meta[property="og:description"]') || meta('meta[name="description"]');

        return { heading, image, date, summary, siteName };
    }

    /** Fetch + parse only — used by batch mode, which applies the result itself. */
    async function scrapeArticle(url) {
        const html = await fetchPageHtml(url);
        return parseArticleMeta(html, url);
    }

    /* --------------------------------------------------------------- UI */

    function showArticleStatus(type, message) {
        const node = PC.dom.el.articleStatusHint;
        if (!node) return;
        node.className = `url-status-hint ${type}`;
        node.textContent = message;
        node.style.display = 'flex';
    }

    function hideArticleStatus() {
        const node = PC.dom.el.articleStatusHint;
        if (!node) return;
        node.style.display = 'none';
        node.textContent = '';
    }

    async function importFromArticleUrl(rawUrl) {
        const el = PC.dom.el;
        const url = String(rawUrl || '').trim();

        if (!url) {
            hideArticleStatus();
            return;
        }
        if (!PC.util.isHttpUrl(url)) {
            showArticleStatus('error', 'অনুগ্রহ করে http:// বা https:// দিয়ে শুরু হওয়া সঠিক নিউজ লিংক দিন।');
            return;
        }

        const fetchId = ++currentFetchId;
        PC.state.set('articleUrl', url, { silent: true });

        showArticleStatus('loading', '⏳ নিউজ লিংক থেকে তথ্য আনা হচ্ছে...');
        if (el.fetchArticleBtn) {
            el.fetchArticleBtn.disabled = true;
            el.fetchArticleBtn.textContent = '...';
        }

        try {
            const meta = await scrapeArticle(url);
            if (fetchId !== currentFetchId) return;

            const wantHeading = !el.scrapeHeading || el.scrapeHeading.checked;
            const wantImage = !el.scrapeImage || el.scrapeImage.checked;
            const wantDate = !el.scrapeDate || el.scrapeDate.checked;

            const got = [];
            const values = {};
            if (wantHeading && meta.heading) {
                values.heading = meta.heading;
                if (PC.state.get('quote') !== undefined) values.quote = meta.heading;
                got.push('হেডলাইন');
            }
            if (wantDate && meta.date) {
                values.date = meta.date;
                got.push('তারিখ');
            }
            if (Object.keys(values).length) PC.state.patch(values, { source: 'scrape', full: true });

            if (wantImage && meta.image) {
                if (el.imageUrl) el.imageUrl.value = meta.image;
                got.push('ছবি');
                showArticleStatus('loading', `✓ ${got.join(', ')} পাওয়া গেছে — ছবি লোড হচ্ছে...`);
                await PC.imaging.processImageUrl(meta.image, { quiet: true });
            }

            if (fetchId !== currentFetchId) return;

            if (got.length) showArticleStatus('success', `✓ সফলভাবে আনা হয়েছে: ${got.join(', ')}`);
            else showArticleStatus('error', '⚠️ লিংক থেকে কোনো তথ্য পাওয়া যায়নি। ম্যানুয়ালি লিখুন।');
        } catch (err) {
            if (fetchId !== currentFetchId) return;
            console.warn('Article scrape failed:', err);
            showArticleStatus('error', '⚠️ নিউজ পেজটি লোড করা যায়নি। লিংক ঠিক আছে কিনা দেখুন বা আবার চেষ্টা করুন।');
        } finally {
            if (fetchId === currentFetchId && el.fetchArticleBtn) {
                el.fetchArticleBtn.disabled = false;
                el.fetchArticleBtn.textContent = 'Fetch';
            }
        }
    }

    return {
        fetchPageHtml, parseArticleMeta, scrapeArticle,
        showArticleStatus, hideArticleStatus, importFromArticleUrl
    };
})();
