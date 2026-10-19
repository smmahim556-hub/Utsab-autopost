/**
 * Cached references to the editor chrome. Everything is looked up once at
 * startup; missing nodes stay `null` so features degrade instead of throwing.
 */
window.PC = window.PC || {};

PC.dom = (function () {
    'use strict';

    const byId = (id) => document.getElementById(id);

    /** Populated by initDom(); import-time consumers read it lazily. */
    const el = {};

    function initDom() {
        Object.assign(el, {
            // Shell
            sidebar: document.querySelector('.sidebar'),
            toggleSettings: byId('toggleSettings'),
            closeSettings: byId('closeSettings'),
            themeBtn: byId('themeBtn'),
            langBtn: byId('langBtn'),
            undoBtn: byId('undoBtn'),
            redoBtn: byId('redoBtn'),

            // Template + ratio
            templateGrid: byId('templateGrid'),
            ratioSelector: byId('ratioSelector'),

            // Auto import
            articleUrl: byId('articleUrlInput'),
            fetchArticleBtn: byId('fetchArticleBtn'),
            articleStatusHint: byId('articleStatusHint'),
            scrapeHeading: byId('scrapeHeadingChk'),
            scrapeImage: byId('scrapeImageChk'),
            scrapeDate: byId('scrapeDateChk'),

            // Batch
            batchToggle: byId('batchToggle'),
            batchPanel: byId('batchPanel'),
            batchUrls: byId('batchUrls'),
            batchRunBtn: byId('batchRunBtn'),
            batchProgress: byId('batchProgress'),

            // Content
            dynamicContent: byId('dynamicContent'),

            // Media
            image: byId('imageInput'),
            imageUrl: byId('imageUrlInput'),
            loadUrlBtn: byId('loadUrlBtn'),
            urlStatusHint: byId('urlStatusHint'),
            imageScale: byId('imageScaleInput'),
            imageX: byId('imageXInput'),
            imageY: byId('imageYInput'),
            imageObjectFit: byId('imageObjectFitInput'),
            overlay: byId('overlayInput'),
            logoInput: byId('logoInput'),
            logoResetBtn: byId('logoResetBtn'),

            // Text style
            textSize: byId('textSizeInput'),
            lineHeight: byId('lineHeightInput'),
            textAlign: byId('textAlignInput'),
            textColor: byId('textColorInput'),
            textColorReset: byId('textColorReset'),
            autoFit: byId('autoFitChk'),

            // Export
            exportFormat: byId('exportFormatInput'),
            exportQuality: byId('exportQualityInput'),
            exportQualityRow: byId('exportQualityRow'),
            exportScale: byId('exportScaleInput'),
            exportAllRatiosBtn: byId('exportAllRatiosBtn'),

            // Library
            historyBtn: byId('historyBtn'),
            presetsBtn: byId('presetsBtn'),
            savePresetBtn: byId('savePresetBtn'),
            libraryModal: byId('libraryModal'),
            closeLibraryModal: byId('closeLibraryModal'),
            libraryTabs: byId('libraryTabs'),
            libraryGrid: byId('libraryGrid'),
            libraryEmpty: byId('libraryEmpty'),

            // Actions
            shareBtn: byId('shareBtn'),
            downloadBtn: byId('downloadBtn'),
            resetBtn: byId('resetBtn'),

            // Canvas
            renderTarget: byId('renderTarget'),
            canvasWrapper: document.querySelector('.canvas-wrapper'),
            previewArea: document.querySelector('.preview-area'),
            previewLoading: byId('previewLoading'),
            zoomHint: document.querySelector('.zoom-hint'),

            // Share modal
            shareModal: byId('shareModal'),
            closeShareModal: byId('closeShareModal'),
            sharePreviewImg: byId('sharePreviewImg'),
            shareTextContent: byId('shareTextContent'),
            shareStatusAlert: byId('shareStatusAlert'),
            copyBothBtn: byId('copyBothBtn'),
            copyOnlyImageBtn: byId('copyOnlyImageBtn'),
            copyOnlyTextBtn: byId('copyOnlyTextBtn'),
            nativeShareBtn: byId('nativeShareBtn'),
            publishBtn: byId('publishBtn')
        });
        return el;
    }

    /** Small helper for building elements without long createElement chains. */
    function h(tag, props, ...children) {
        const node = document.createElement(tag);
        Object.entries(props || {}).forEach(([key, value]) => {
            if (value == null || value === false) return;
            if (key === 'class') node.className = value;
            else if (key === 'dataset') Object.assign(node.dataset, value);
            else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
            else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
            else if (key === 'text') node.textContent = value;
            else if (key === 'html') node.innerHTML = value;
            else node.setAttribute(key, value === true ? '' : value);
        });
        children.flat().forEach(child => {
            if (child == null) return;
            node.append(child.nodeType ? child : document.createTextNode(String(child)));
        });
        return node;
    }

    return { el, initDom, h };
})();
