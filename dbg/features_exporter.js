/**
 * Rasterises a card to a canvas and saves it.
 *
 * html2canvas does not honour `object-fit`, so every cover/contain image is
 * pre-drawn into an equivalent <canvas> before capture. If the source image is
 * cross-origin and taints that canvas we keep the original <img> and let
 * html2canvas try with useCORS instead.
 */
window.PC = window.PC || {};

PC.exporter = (function () {
    'use strict';

    const HTML2CANVAS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    const ENCODE_TIMEOUT_MS = 20000;

    const EXPORT_FORMATS = {
        png:  { mime: 'image/png',  ext: 'png', lossy: false, label: 'PNG (lossless)' },
        jpeg: { mime: 'image/jpeg', ext: 'jpg', lossy: true,  label: 'JPEG (smaller)' },
        webp: { mime: 'image/webp', ext: 'webp', lossy: true, label: 'WebP' }
    };

    async function ensureHtml2Canvas() {
        if (typeof window.html2canvas === 'function') return window.html2canvas;
        await PC.util.loadScript(HTML2CANVAS_CDN);
        if (typeof window.html2canvas !== 'function') throw new Error('html2canvas unavailable');
        return window.html2canvas;
    }

    function waitForImages(root) {
        const images = Array.from(root.querySelectorAll('img'));
        return Promise.all(images.map(img => (
            img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
        )));
    }

    /** Replace object-fit images with pre-composited canvases. */
    function bakeObjectFit(root) {
        root.querySelectorAll('img').forEach(img => {
            const style = window.getComputedStyle(img);
            const fit = style.objectFit;
            if (fit !== 'cover' && fit !== 'contain') return;
            if (!img.naturalWidth || !img.naturalHeight) return;

            const width = img.offsetWidth;
            const height = img.offsetHeight;
            if (!width || !height) return;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.className = img.className;
            Object.assign(canvas.style, {
                width: `${width}px`,
                height: `${height}px`,
                display: style.display,
                position: style.position,
                top: style.top,
                left: style.left,
                right: style.right,
                bottom: style.bottom,
                margin: style.margin,
                borderRadius: style.borderRadius,
                zIndex: style.zIndex,
                opacity: style.opacity,
                filter: style.filter,
                transform: style.transform,
                transformOrigin: style.transformOrigin
            });

            const imgAspect = img.naturalWidth / img.naturalHeight;
            const boxAspect = width / height;
            const fillsWidth = (fit === 'cover') ? (imgAspect <= boxAspect) : (imgAspect > boxAspect);

            let renderW;
            let renderH;
            if (fillsWidth) {
                renderW = width;
                renderH = width / imgAspect;
            } else {
                renderH = height;
                renderW = height * imgAspect;
            }

            try {
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, (width - renderW) / 2, (height - renderH) / 2, renderW, renderH);
                canvas.toDataURL();      // throws if tainted
                img.parentNode.replaceChild(canvas, img);
            } catch (e) {
                // Cross-origin image: leave the <img> for html2canvas + useCORS.
            }
        });
    }

    /**
     * Capture a rendered card element to a canvas.
     * @param {HTMLElement} cardEl
     * @param {{width:number,height:number}} size
     * @param {number} scale output multiplier (1 = native size)
     */
    async function captureElement(cardEl, size, scale) {
        const html2canvas = await ensureHtml2Canvas();
        await document.fonts.ready;

        const host = document.createElement('div');
        host.style.cssText =
            `position:fixed;left:0;top:0;width:${size.width}px;height:${size.height}px;z-index:-9999;opacity:0;pointer-events:none;`;

        const clone = cardEl.cloneNode(true);
        clone.style.width = `${size.width}px`;
        clone.style.height = `${size.height}px`;
        clone.style.transform = 'none';
        clone.querySelectorAll('[contenteditable]').forEach(node => {
            node.removeAttribute('contenteditable');
            node.style.outline = 'none';
        });

        host.appendChild(clone);
        document.body.appendChild(host);

        try {
            await waitForImages(clone);
            bakeObjectFit(clone);
            await new Promise(res => setTimeout(res, 120));

            return await html2canvas(clone, {
                scale: scale || 1,
                useCORS: true,
                allowTaint: false,
                backgroundColor: null,
                logging: false,
                imageTimeout: 15000,
                width: size.width,
                height: size.height,
                scrollX: 0,
                scrollY: 0,
                windowWidth: size.width,
                windowHeight: size.height
            });
        } finally {
            host.remove();
        }
    }

    /** Capture the card currently shown in the preview. */
    async function renderCurrentCard(options) {
        const cardEl = PC.dom.el.renderTarget && PC.dom.el.renderTarget.firstElementChild;
        if (!cardEl) throw new Error('No card element found to render.');
        const st = PC.state.getState();
        const scale = (options && options.scale) || Number(st.exportScale) || 1;
        return captureElement(cardEl, PC.ratios.getRatio(st.aspectRatio), scale);
    }

    /** Capture an arbitrary state snapshot (batch mode, other ratios). */
    async function renderStateToCanvas(snapshot, options) {
        const offscreen = PC.render.renderOffscreen(snapshot);
        try {
            await waitForImages(offscreen.host);
            return await captureElement(
                offscreen.element,
                PC.ratios.getRatio(snapshot.aspectRatio),
                (options && options.scale) || 1
            );
        } finally {
            offscreen.dispose();
        }
    }

    function encode(canvas, mime, quality) {
        return new Promise((resolve, reject) => {
            // Some browsers never invoke the callback for a codec they cannot use
            // on a large canvas, which would leave the UI stuck on "Rendering…".
            const timer = setTimeout(() => reject(new Error(`Encoding to ${mime} timed out`)), ENCODE_TIMEOUT_MS);
            try {
                canvas.toBlob(blob => {
                    clearTimeout(timer);
                    if (blob) resolve(blob);
                    else reject(new Error(`Canvas encoding to ${mime} failed`));
                }, mime, quality);
            } catch (e) {
                clearTimeout(timer);
                reject(e);
            }
        });
    }

    async function canvasToBlob(canvas, format, quality) {
        const spec = EXPORT_FORMATS[format] || EXPORT_FORMATS.png;
        try {
            return await encode(canvas, spec.mime, spec.lossy ? (quality || 0.92) : undefined);
        } catch (e) {
            if (spec.mime === 'image/png') throw e;
            console.warn(`Falling back to PNG: ${e.message}`);
            return encode(canvas, 'image/png', undefined);
        }
    }

    /** Extension that matches the bytes actually produced. */
    function extensionForBlob(blob, format) {
        const byMime = Object.keys(EXPORT_FORMATS)
            .map(key => EXPORT_FORMATS[key])
            .find(spec => spec.mime === blob.type);
        if (byMime) return byMime.ext;
        return (EXPORT_FORMATS[format] || EXPORT_FORMATS.png).ext;
    }

    function buildFilename(st, ratioKey, ext) {
        const ratio = String(ratioKey || st.aspectRatio).replace(':', 'x');
        return `photocard-${st.templateId}-${ratio}-${PC.util.timestampSlug()}.${ext}`;
    }

    /** Download the current card using the user's export preferences. */
    async function downloadCurrentCard() {
        const st = PC.state.getState();
        const format = EXPORT_FORMATS[st.exportFormat] ? st.exportFormat : 'png';
        const canvas = await renderCurrentCard();
        const blob = await canvasToBlob(canvas, format, Number(st.exportQuality) || 0.92);
        PC.util.downloadBlob(blob, buildFilename(st, st.aspectRatio, extensionForBlob(blob, format)));
        return blob;
    }

    /** One click, every ratio — each saved as its own file. */
    async function downloadAllRatios(onProgress) {
        const st = PC.state.exportSnapshot();
        const format = EXPORT_FORMATS[st.exportFormat] ? st.exportFormat : 'png';
        const keys = Object.keys(PC.ratios.ASPECT_RATIOS);
        const files = [];

        for (let i = 0; i < keys.length; i++) {
            const ratioKey = keys[i];
            if (onProgress) onProgress(i, keys.length, ratioKey);
            const canvas = await renderStateToCanvas(
                Object.assign({}, st, { aspectRatio: ratioKey }),
                { scale: Number(st.exportScale) || 1 }
            );
            const blob = await canvasToBlob(canvas, format, Number(st.exportQuality) || 0.92);
            const name = buildFilename(st, ratioKey, extensionForBlob(blob, format));
            PC.util.downloadBlob(blob, name);
            files.push(name);
            await new Promise(res => setTimeout(res, 400)); // browsers throttle rapid downloads
        }

        if (onProgress) onProgress(keys.length, keys.length, null);
        return files;
    }

    return {
        EXPORT_FORMATS, captureElement, renderCurrentCard, renderStateToCanvas,
        canvasToBlob, extensionForBlob, buildFilename,
        downloadCurrentCard, downloadAllRatios
    };
})();
