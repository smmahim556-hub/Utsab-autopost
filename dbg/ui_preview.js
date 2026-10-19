/**
 * Preview stage: scales the 1080px-class card down to fit the viewport and
 * shows a loading veil while long operations run.
 */
window.PC = window.PC || {};

PC.preview = (function () {
    'use strict';

    /** Breathing room around the card; tighter on narrow screens. */
    function paddingFor(width) {
        return width < 700 ? 28 : 80;
    }

    /**
     * Extra height kept clear at the bottom for the hint bar, so the card is
     * never sat on by it. On phones the action buttons live in their own bar
     * outside the stage, so only the hint needs room.
     */
    function bottomGutterFor(width) {
        return width < 900 ? 30 : 44;
    }

    function fitPreview() {
        const el = PC.dom.el;
        const wrapper = el.canvasWrapper;
        if (!wrapper) return;
        const container = wrapper.parentElement;
        if (!container) return;

        const ratio = PC.ratios.getRatio(PC.state.get('aspectRatio'));
        wrapper.style.width = `${ratio.width}px`;
        wrapper.style.height = `${ratio.height}px`;

        const boxWidth = container.clientWidth;
        const boxHeight = container.clientHeight;

        // Called before the stage has been laid out (early startup, or while the
        // sidebar is still opening). Committing a guess here would stick until
        // the next resize, so retry on the next frame instead.
        if (boxWidth < 2 || boxHeight < 2) {
            requestAnimationFrame(fitPreview);
            return;
        }

        const padding = paddingFor(boxWidth);
        const gutter = bottomGutterFor(boxWidth);
        const scale = Math.min(
            (boxWidth - padding) / ratio.width,
            (boxHeight - padding - gutter) / ratio.height
        );
        const safe = Math.min(Math.max(scale, 0.02), 5);

        // translate(-50%, -50%) re-centres the absolutely positioned wrapper;
        // scale() then shrinks it around that centre. The centre is nudged up
        // by half the gutter so the freed space all lands below the card.
        wrapper.style.top = `calc(50% - ${gutter / 2}px)`;
        wrapper.style.transform = `translate(-50%, -50%) scale(${safe})`;
    }

    /**
     * Keep the card fitted whenever the stage changes size — window resize,
     * sidebar opening on mobile, device rotation, or the late reflow that
     * follows a web font loading.
     */
    function observePreview() {
        const container = PC.dom.el.previewArea;
        if (!container) return;

        if (typeof ResizeObserver === 'function') {
            new ResizeObserver(() => fitPreview()).observe(container);
        }

        window.addEventListener('load', fitPreview);
        window.addEventListener('orientationchange', fitPreview);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(fitPreview).catch(() => {});
        }
    }

    function setPreviewBusy(busy, message) {
        const node = PC.dom.el.previewLoading;
        if (!node) return;
        node.textContent = message || 'Working…';
        node.style.display = busy ? 'flex' : 'none';
    }

    return { fitPreview, observePreview, setPreviewBusy };
})();
