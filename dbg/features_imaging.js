/**
 * Everything to do with the card's photo: file upload, remote URL loading,
 * CORS-safe conversion to a data URL, drag-to-pan and wheel zoom.
 *
 * Remote images must end up as same-origin data URLs or html2canvas produces a
 * tainted canvas and export fails. Strategies are tried in order: own PHP
 * proxy, public image CDN, direct fetch, then in-memory <img> decoding. The own
 * proxy is skipped when the page is opened from disk, where /api does not exist.
 */
window.PC = window.PC || {};

PC.imaging = (function () {
    'use strict';

    const OWN_PROXY = 'api/image.php?url=';
    const WESERV = 'https://images.weserv.nl/?url=';

    let currentFetchId = 0;

    /* ------------------------------------------------------------ status */

    function showUrlStatus(type, message) {
        const node = PC.dom.el.urlStatusHint;
        if (!node) return;
        node.className = `url-status-hint ${type}`;
        node.textContent = message;
        node.style.display = 'flex';
    }

    function hideUrlStatus() {
        const node = PC.dom.el.urlStatusHint;
        if (!node) return;
        node.style.display = 'none';
        node.textContent = '';
    }

    /* -------------------------------------------------------- conversion */

    function loadImageElement(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.referrerPolicy = 'no-referrer';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => reject(new Error('Image element failed to load'));
            img.src = src;
        });
    }

    async function tryFetchAsDataUrl(url, timeout) {
        const res = await PC.util.fetchWithTimeout(url, {
            referrerPolicy: 'no-referrer',
            headers: { Accept: 'image/*' }
        }, timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (blob.size <= 80) throw new Error('Empty image response');
        return PC.util.blobToDataUrl(blob);
    }

    /** Resolve any remote image URL to a same-origin data URL. */
    async function fetchImageAsDataUrl(url) {
        const attempts = [];

        if (!PC.util.isFileProtocol()) {
            attempts.push(() => tryFetchAsDataUrl(OWN_PROXY + encodeURIComponent(url), 12000));
        }
        attempts.push(
            () => tryFetchAsDataUrl(`${WESERV}${encodeURIComponent(url)}&default=1`, 8000),
            () => tryFetchAsDataUrl(url, 6000),
            () => loadImageElement(`${WESERV}${encodeURIComponent(url)}&default=1`),
            () => loadImageElement(url)
        );

        for (const attempt of attempts) {
            try {
                return await attempt();
            } catch (e) {
                // Try the next strategy.
            }
        }
        throw new Error('All image load strategies failed');
    }

    /* ---------------------------------------------------------- handlers */

    function setLoadBtnBusy(busy) {
        const btn = PC.dom.el.loadUrlBtn;
        if (!btn) return;
        btn.disabled = busy;
        btn.textContent = busy ? '...' : 'Load';
    }

    async function processImageUrl(rawUrl, options) {
        const quiet = !!(options && options.quiet);
        const url = String(rawUrl || '').trim();

        if (!url) {
            PC.state.patch({ imageUrl: '', image: '' }, { source: 'image' });
            hideUrlStatus();
            return;
        }

        if (!PC.util.isHttpUrl(url) && !url.startsWith('data:')) {
            if (!quiet) showUrlStatus('error', 'অনুগ্রহ করে http:// বা https:// দিয়ে শুরু হওয়া সঠিক ইমেজ লিংক দিন।');
            return;
        }

        const fetchId = ++currentFetchId;
        if (!quiet) showUrlStatus('loading', '⏳ ইমেজ লোড করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...');
        setLoadBtnBusy(true);

        try {
            const dataUrl = url.startsWith('data:') ? url : await fetchImageAsDataUrl(url);
            if (fetchId !== currentFetchId) return;

            PC.state.patch({ imageUrl: url, image: dataUrl }, { source: 'image' });
            if (!quiet) showUrlStatus('success', '✓ ইমেজ সফলভাবে লোড হয়েছে!');
        } catch (err) {
            if (fetchId !== currentFetchId) return;
            console.warn('Image fetch failed, falling back to direct URL:', err);
            // Preview still works; export may fail on a tainted canvas.
            PC.state.patch({ imageUrl: url, image: url }, { source: 'image' });
            if (!quiet) {
                showUrlStatus('error', '⚠️ সরাসরি ইমেজ ডাটা লোড করা যায়নি। প্রিভিউ দেখা গেলেও ডাউনলোডে সমস্যা হলে ছবিটি আপলোড করুন।');
            }
        } finally {
            if (fetchId === currentFetchId) setLoadBtnBusy(false);
        }
    }

    function handleImageUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            PC.state.patch({ image: e.target.result, imageUrl: '' }, { source: 'image' });
            hideUrlStatus();
        };
        reader.readAsDataURL(file);
    }

    function handleLogoUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => PC.state.set('logo', e.target.result, { source: 'logo' });
        reader.readAsDataURL(file);
    }

    function resetLogo() {
        PC.state.set('logo', PC.state.DEFAULT_LOGO, { source: 'logo' });
    }

    /* ----------------------------------------------- drag-to-pan / zoom */

    /**
     * Direct manipulation on the preview. The pointer delta is divided by the
     * preview's display scale so one screen pixel moves the photo one card pixel.
     */
    function enablePhotoManipulation() {
        const target = PC.dom.el.renderTarget;
        if (!target) return;

        let dragging = false;
        let startX = 0;
        let startY = 0;
        let originX = 0;
        let originY = 0;

        const previewScale = () => {
            const wrapper = PC.dom.el.canvasWrapper;
            if (!wrapper) return 1;
            const match = /scale\(([\d.]+)\)/.exec(wrapper.style.transform || '');
            return match ? parseFloat(match[1]) || 1 : 1;
        };

        target.addEventListener('pointerdown', (e) => {
            // Text editing wins over panning.
            if (e.target.closest('[contenteditable="true"]')) return;
            if (!target.querySelector('[data-main-image="true"]')) return;

            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            originX = Number(PC.state.get('imageX')) || 0;
            originY = Number(PC.state.get('imageY')) || 0;
            target.setPointerCapture(e.pointerId);
            target.classList.add('is-dragging');
        });

        target.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const scale = previewScale() * (Number(PC.state.get('imageScale')) || 1);
            const dx = Math.round((e.clientX - startX) / scale);
            const dy = Math.round((e.clientY - startY) / scale);
            PC.state.patch({ imageX: originX + dx, imageY: originY + dy }, { source: 'drag' });
        });

        const endDrag = (e) => {
            if (!dragging) return;
            dragging = false;
            target.classList.remove('is-dragging');
            try { target.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
        };
        target.addEventListener('pointerup', endDrag);
        target.addEventListener('pointercancel', endDrag);

        target.addEventListener('wheel', (e) => {
            if (e.target.closest('[contenteditable="true"]')) return;
            e.preventDefault();
            const step = e.deltaY > 0 ? -0.05 : 0.05;
            const next = PC.util.clamp((Number(PC.state.get('imageScale')) || 1) + step, 0.1, 4);
            PC.state.set('imageScale', Math.round(next * 100) / 100, { source: 'zoom' });
        }, { passive: false });
    }

    /** Keep the preview in sync without a full re-render while dragging. */
    function fastApplyTransform() {
        const target = PC.dom.el.renderTarget;
        const photo = target && target.querySelector('[data-main-image="true"]');
        if (!photo) {
            PC.render.renderPreview();
            return;
        }
        const st = PC.state.getState();
        photo.style.transform = `scale(${st.imageScale || 1}) translate(${st.imageX || 0}px, ${st.imageY || 0}px)`;
    }

    return {
        showUrlStatus, hideUrlStatus, fetchImageAsDataUrl, processImageUrl,
        handleImageUpload, handleLogoUpload, resetLogo,
        enablePhotoManipulation, fastApplyTransform
    };
})();
