/**
 * Shrinks headline text until it fits its box.
 *
 * Bengali headlines vary wildly in length; a fixed 52px size silently
 * overflowed the crimson panel on long ones. Each `.card-fit-text` starts at
 * its template's `--fit-base` (times the user's Text Size multiplier) and is
 * binary-searched down until it no longer overflows `.card-fit-box`.
 */
window.PC = window.PC || {};

PC.autofit = (function () {
    'use strict';

    const MIN_RATIO = 0.5;   // never shrink below half the template's base size
    const TOLERANCE = 1;     // px of allowed overflow before we shrink further

    function boxFor(textEl) {
        return textEl.closest('.card-fit-box') || textEl.parentElement;
    }

    function overflows(textEl, box) {
        if (!box) return false;
        const boxStyle = getComputedStyle(box);
        const available = box.clientHeight
            - parseFloat(boxStyle.paddingTop || 0)
            - parseFloat(boxStyle.paddingBottom || 0);
        if (available <= 0) return false;
        return (textEl.scrollHeight - available) > TOLERANCE
            || (textEl.scrollWidth - box.clientWidth) > TOLERANCE;
    }

    /**
     * @param {HTMLElement} root container holding one rendered card
     * @param {object} st current state (uses `autoFit` and `headingScale`)
     */
    function applyAutoFit(root, st) {
        const scale = Number(st.headingScale) || 1;

        root.querySelectorAll('.card-fit-text').forEach(textEl => {
            const card = textEl.closest('.template-wrapper');
            const baseRaw = card ? getComputedStyle(card).getPropertyValue('--fit-base') : '';
            const base = parseFloat(baseRaw) || 52;
            const target = base * scale;

            // User-scaled size first; auto-fit only ever reduces from here.
            textEl.style.setProperty('--fit-size', `${target}px`);

            if (st.autoFit === false) return;

            const box = boxFor(textEl);
            if (!box || !overflows(textEl, box)) return;

            let low = target * MIN_RATIO;
            let high = target;
            let best = low;

            for (let i = 0; i < 12 && (high - low) > 0.5; i++) {
                const mid = (low + high) / 2;
                textEl.style.setProperty('--fit-size', `${mid}px`);
                if (overflows(textEl, box)) {
                    high = mid;
                } else {
                    best = mid;
                    low = mid;
                }
            }

            textEl.style.setProperty('--fit-size', `${Math.floor(best)}px`);
        });
    }

    /**
     * Does the headline still overflow after auto-fit bottomed out?
     * Drives the "headline too long" warning in the sidebar.
     */
    function measureOverflow(root) {
        let worst = 0;
        root.querySelectorAll('.card-fit-text').forEach(textEl => {
            const box = boxFor(textEl);
            if (!box) return;
            const excess = textEl.scrollHeight - box.clientHeight;
            if (excess > worst) worst = excess;
        });
        return worst;
    }

    return { applyAutoFit, measureOverflow };
})();
