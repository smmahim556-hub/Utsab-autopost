/**
 * Batch mode: paste many news links, get one ZIP of finished cards.
 *
 * Each link is scraped, rendered off-screen with the current template, ratio and
 * styling, then added to the archive. Failures are collected and reported
 * instead of aborting the run.
 */
window.PC = window.PC || {};

PC.batch = (function () {
    'use strict';

    const JSZIP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    const MAX_LINKS = 40;

    async function ensureJsZip() {
        if (typeof window.JSZip === 'function') return window.JSZip;
        await PC.util.loadScript(JSZIP_CDN);
        if (typeof window.JSZip !== 'function') throw new Error('JSZip unavailable');
        return window.JSZip;
    }

    function parseUrls(text) {
        return String(text || '')
            .split(/[\n\s,]+/)
            .map(s => s.trim())
            .filter(PC.util.isHttpUrl)
            .slice(0, MAX_LINKS);
    }

    function setProgress(message) {
        const node = PC.dom.el.batchProgress;
        if (!node) return;
        node.textContent = message;
        node.style.display = message ? 'block' : 'none';
    }

    /** Slug a headline into a safe, short filename stem. */
    function slugFor(heading, index) {
        const clean = String(heading || '')
            .replace(/[\\/:*?"<>|]+/g, '')
            .trim()
            .slice(0, 40);
        return `${String(index + 1).padStart(2, '0')}-${clean || 'card'}`;
    }

    async function runBatch() {
        const el = PC.dom.el;
        const urls = parseUrls(el.batchUrls && el.batchUrls.value);

        if (!urls.length) {
            PC.toast.toast('error', 'Paste at least one news link (one per line).');
            return;
        }

        const base = PC.state.exportSnapshot();
        const formats = PC.exporter.EXPORT_FORMATS;
        const format = formats[base.exportFormat] ? base.exportFormat : 'png';

        if (el.batchRunBtn) el.batchRunBtn.disabled = true;
        const pending = PC.toast.toast('loading', `Generating ${urls.length} cards…`, 0);

        const failures = [];
        let added = 0;

        try {
            const JSZip = await ensureJsZip();
            const zip = new JSZip();

            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                setProgress(`${i + 1} / ${urls.length} — ${url}`);
                pending.update('loading', `Card ${i + 1} of ${urls.length}…`, 0);

                try {
                    const meta = await PC.scrape.scrapeArticle(url);
                    const snapshot = Object.assign({}, base, { articleUrl: url });

                    if (meta.heading) {
                        snapshot.heading = meta.heading;
                        if (base.quote !== undefined) snapshot.quote = meta.heading;
                    }
                    if (meta.date) snapshot.date = meta.date;
                    if (meta.image) {
                        try {
                            snapshot.image = await PC.imaging.fetchImageAsDataUrl(meta.image);
                        } catch (e) {
                            snapshot.image = meta.image;   // preview-quality fallback
                        }
                    }

                    const canvas = await PC.exporter.renderStateToCanvas(snapshot, { scale: Number(base.exportScale) || 1 });
                    const blob = await PC.exporter.canvasToBlob(canvas, format, Number(base.exportQuality) || 0.92);
                    zip.file(`${slugFor(meta.heading, i)}.${PC.exporter.extensionForBlob(blob, format)}`, blob);
                    added++;
                } catch (err) {
                    console.warn('Batch item failed:', url, err);
                    failures.push(url);
                }
            }

            if (!added) throw new Error('No cards could be generated');

            if (failures.length) zip.file('FAILED-LINKS.txt', failures.join('\n'));

            pending.update('loading', 'Packing ZIP…', 0);
            const archive = await zip.generateAsync({ type: 'blob' });
            PC.util.downloadBlob(archive, `photocards-${PC.util.timestampSlug()}.zip`);

            pending.update(
                failures.length ? 'info' : 'success',
                failures.length
                    ? `${added} cards ready · ${failures.length} link(s) failed (listed in the ZIP).`
                    : `${added} cards ready.`,
                6000
            );
        } catch (err) {
            console.error('Batch run failed:', err);
            pending.update('error', `Batch failed: ${err.message}`, 6000);
        } finally {
            setProgress('');
            if (el.batchRunBtn) el.batchRunBtn.disabled = false;
        }
    }

    return { runBatch };
})();
