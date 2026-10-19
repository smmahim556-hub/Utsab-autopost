/**
 * Small shared helpers. No DOM state, no side effects.
 *
 * Classic script, not an ES module: the app must run when index.html is opened
 * straight from disk (file://), where browsers block module imports.
 */
window.PC = window.PC || {};

PC.util = (function () {
    'use strict';

    /**
     * Escape a string so it can be injected into innerHTML safely.
     * Critical: headline/date/credit text may come from a scraped third-party
     * page, so it must never be treated as markup.
     */
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /** Escape, then turn newlines into <br> for multi-line card text. */
    function escapeMultiline(value) {
        return escapeHtml(value).replace(/\n/g, '<br>');
    }

    /** Collapse whitespace on text that is already decoded (attributes, textContent). */
    function normalizeText(str) {
        return String(str == null ? '' : str).replace(/\s+/g, ' ').trim();
    }

    /**
     * Decode HTML entities in a string that the HTML parser never saw.
     *
     * Needed for JSON-LD values: those arrive through JSON.parse, which leaves
     * `&#039;` and friends untouched, so a headline would render the raw entity.
     * Do NOT use this on DOM attributes or textContent — the parser already
     * decoded those, and a second pass would mangle a literal "&amp;".
     */
    function decodeEntities(str) {
        const text = String(str == null ? '' : str);
        // Nothing to decode and no markup to strip — skip the parser.
        if (text.indexOf('&') === -1 && text.indexOf('<') === -1) return normalizeText(text);

        const doc = new DOMParser().parseFromString(`<!doctype html><body>${text}`, 'text/html');
        doc.body.querySelectorAll('script, style, template, noscript').forEach(n => n.remove());
        return normalizeText(doc.body.textContent);
    }

    /**
     * Plain text from an element's subtree, with script/style/template contents
     * dropped first — otherwise an inline script's source ends up concatenated
     * into an extracted headline.
     */
    function textOf(node) {
        if (!node) return '';
        const clone = node.cloneNode(true);
        clone.querySelectorAll('script, style, template, noscript').forEach(n => n.remove());
        return normalizeText(clone.textContent);
    }

    function debounce(fn, wait) {
        let timer = null;
        return function debounced() {
            const args = arguments;
            const self = this;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(self, args), wait || 250);
        };
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function absoluteUrl(src, baseUrl) {
        if (!src) return '';
        try {
            return new URL(src, baseUrl).href;
        } catch (e) {
            return src;
        }
    }

    function isHttpUrl(url) {
        return /^https?:\/\//i.test(String(url || '').trim());
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /** Load an external script once; resolves when ready. */
    const scriptCache = new Map();
    function loadScript(src) {
        if (scriptCache.has(src)) return scriptCache.get(src);
        const promise = new Promise((resolve, reject) => {
            const tag = document.createElement('script');
            tag.src = src;
            tag.async = true;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error('Failed to load script: ' + src));
            document.head.appendChild(tag);
        });
        scriptCache.set(src, promise);
        return promise;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    function timestampSlug() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    }

    /** Fetch with an abort timeout. */
    async function fetchWithTimeout(url, options, ms) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms || 10000);
        try {
            return await fetch(url, Object.assign({}, options || {}, { signal: controller.signal }));
        } finally {
            clearTimeout(timer);
        }
    }

    /** True when the page cannot reach same-origin endpoints (opened from disk). */
    function isFileProtocol() {
        return location.protocol === 'file:';
    }

    return {
        escapeHtml, escapeMultiline, normalizeText, decodeEntities, textOf,
        debounce, clamp, absoluteUrl, isHttpUrl,
        blobToDataUrl, loadScript, downloadBlob, timestampSlug,
        fetchWithTimeout, isFileProtocol
    };
})();
