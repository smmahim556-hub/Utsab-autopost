/**
 * Output sizes. `className` is applied to the card wrapper so each template's
 * CSS can retune its layout per ratio.
 */
window.PC = window.PC || {};

PC.ratios = (function () {
    'use strict';

    const ASPECT_RATIOS = {
        '1:1':  { width: 1080, height: 1080, label: '1:1',  desc: 'Square',    className: 'ratio-1-1' },
        '4:5':  { width: 1080, height: 1350, label: '4:5',  desc: 'Portrait',  className: 'ratio-4-5' },
        '16:9': { width: 1920, height: 1080, label: '16:9', desc: 'Landscape', className: 'ratio-16-9' },
        '9:16': { width: 1080, height: 1920, label: '9:16', desc: 'Story',     className: 'ratio-9-16' }
    };

    const DEFAULT_RATIO = '1:1';

    function getRatio(key) {
        return ASPECT_RATIOS[key] || ASPECT_RATIOS[DEFAULT_RATIO];
    }

    return { ASPECT_RATIOS, DEFAULT_RATIO, getRatio };
})();
