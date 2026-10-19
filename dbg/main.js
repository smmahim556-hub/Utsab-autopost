/**
 * Application entry point.
 *
 * Wires the sidebar to the state store and the state store to the preview.
 * Every module below owns one concern; this file only connects them.
 *
 * Loaded last: every PC.* namespace it uses is defined by the scripts above it
 * in index.html.
 */
window.PC = window.PC || {};

(function () {
    'use strict';

    let lastTemplateId = null;

    /* --------------------------------------------------------- rendering */

    function repaint(options) {
        if (options && options.rebuildInputs) PC.controls.updateDynamicInputs();
        PC.render.renderPreview();
        PC.preview.fitPreview();
        PC.controls.syncControls();
        PC.controls.updateOverflowWarning();
    }

    /** Cheap path for drag/zoom: move the photo without re-rendering the card. */
    const FAST_SOURCES = new Set(['drag', 'zoom', 'imageX', 'imageY', 'imageScale']);

    function onStateChange(st, meta) {
        meta = meta || {};
        const templateChanged = st.templateId !== lastTemplateId;
        lastTemplateId = st.templateId;

        if (!templateChanged && FAST_SOURCES.has(meta.source)) {
            PC.imaging.fastApplyTransform();
            PC.controls.syncControls();
            return;
        }

        // Typing on the canvas already shows the text; re-rendering would move the caret.
        if (meta.source === 'canvas') {
            PC.controls.syncDynamicInputs();
            PC.controls.updateOverflowWarning();
            PC.controls.syncControls();
            return;
        }

        repaint({ rebuildInputs: templateChanged || meta.full === true });
        if (!templateChanged && meta.full) PC.controls.syncDynamicInputs();
    }

    /* ------------------------------------------------------------ canvas */

    /** Edits made directly on the card feed back into state without a re-render. */
    function bindCanvasEditing() {
        const target = PC.dom.el.renderTarget;
        if (!target) return;

        target.addEventListener('input', (e) => {
            const node = e.target.closest('[contenteditable="true"][data-field]');
            if (!node) return;
            PC.state.set(node.dataset.field, node.innerText.replace(/ /g, ' '), { source: 'canvas' });
        });

        // Paste as plain text so pasted markup never enters the card.
        target.addEventListener('paste', (e) => {
            if (!e.target.closest('[contenteditable="true"]')) return;
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // Right-click the preview to copy the rendered card.
        target.addEventListener('contextmenu', (e) => {
            if (e.target.closest('[contenteditable="true"]')) return;
            e.preventDefault();
            PC.share.quickCopyImage();
        });
    }

    /* ----------------------------------------------------------- actions */

    async function doDownload() {
        const el = PC.dom.el;
        if (el.downloadBtn) el.downloadBtn.disabled = true;
        const pending = PC.toast.toast('loading', 'Rendering card…', 0);
        try {
            const canvas = await PC.exporter.renderCurrentCard();
            await PC.exporter.downloadCurrentCard();
            PC.library.recordHistory(canvas);
            pending.update('success', 'Card downloaded.');
        } catch (err) {
            console.error('Download failed:', err);
            pending.update('error', 'Export failed. If the photo came from a URL, upload it instead.', 6000);
        } finally {
            if (el.downloadBtn) el.downloadBtn.disabled = false;
        }
    }

    async function doExportAllRatios() {
        const el = PC.dom.el;
        if (el.exportAllRatiosBtn) el.exportAllRatiosBtn.disabled = true;
        const pending = PC.toast.toast('loading', 'Exporting every ratio…', 0);
        try {
            await PC.exporter.downloadAllRatios((done, total, ratio) => {
                if (ratio) pending.update('loading', `Rendering ${ratio} (${done + 1}/${total})…`, 0);
            });
            pending.update('success', 'All ratios exported.');
        } catch (err) {
            pending.update('error', `Export failed: ${err.message}`, 6000);
        } finally {
            if (el.exportAllRatiosBtn) el.exportAllRatiosBtn.disabled = false;
        }
    }

    async function doSavePreset() {
        try {
            const canvas = await PC.exporter.renderCurrentCard({ scale: 0.4 });
            await PC.library.savePreset(canvas);
        } catch (err) {
            await PC.library.savePreset(null);
        }
    }

    async function doReset() {
        const ok = await PC.toast.confirmDialog(
            'Reset all settings',
            'Content, photo and style options return to their defaults. Saved drafts and history are kept.',
            'Reset'
        );
        if (!ok) return;
        PC.state.resetAll();
        if (PC.dom.el.imageUrl) PC.dom.el.imageUrl.value = '';
        if (PC.dom.el.articleUrl) PC.dom.el.articleUrl.value = '';
        PC.imaging.hideUrlStatus();
        repaint({ rebuildInputs: true });
        PC.toast.toast('success', 'Settings reset.');
    }

    /* -------------------------------------------------------------- init */

    function bindButtons() {
        const el = PC.dom.el;

        if (el.downloadBtn) el.downloadBtn.addEventListener('click', doDownload);
        if (el.shareBtn) el.shareBtn.addEventListener('click', PC.share.openShareModal);
        if (el.resetBtn) el.resetBtn.addEventListener('click', doReset);
        if (el.exportAllRatiosBtn) el.exportAllRatiosBtn.addEventListener('click', doExportAllRatios);

        if (el.undoBtn) el.undoBtn.addEventListener('click', () => { PC.state.undo(); repaint({ rebuildInputs: true }); });
        if (el.redoBtn) el.redoBtn.addEventListener('click', () => { PC.state.redo(); repaint({ rebuildInputs: true }); });
        if (el.themeBtn) el.themeBtn.addEventListener('click', PC.theme.toggleTheme);
        if (el.langBtn) {
            el.langBtn.addEventListener('click', () => {
                const lang = PC.i18n.toggleLanguage();
                el.langBtn.textContent = lang === 'bn' ? 'EN' : 'বাং';
            });
        }

        // Auto import
        if (el.fetchArticleBtn) {
            el.fetchArticleBtn.addEventListener('click', () => PC.scrape.importFromArticleUrl(el.articleUrl && el.articleUrl.value));
        }
        if (el.articleUrl) {
            el.articleUrl.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                PC.scrape.importFromArticleUrl(el.articleUrl.value);
            });
        }

        // Batch
        if (el.batchToggle && el.batchPanel) {
            el.batchToggle.addEventListener('click', () => {
                const open = el.batchPanel.style.display === 'block';
                el.batchPanel.style.display = open ? 'none' : 'block';
                el.batchToggle.classList.toggle('active', !open);
            });
        }
        if (el.batchRunBtn) el.batchRunBtn.addEventListener('click', PC.batch.runBatch);

        // Media
        if (el.loadUrlBtn) el.loadUrlBtn.addEventListener('click', () => PC.imaging.processImageUrl(el.imageUrl && el.imageUrl.value));
        if (el.imageUrl) {
            el.imageUrl.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                PC.imaging.processImageUrl(el.imageUrl.value);
            });
            el.imageUrl.addEventListener('paste', () => {
                setTimeout(() => PC.imaging.processImageUrl(el.imageUrl.value), 60);
            });
        }

        // Library
        if (el.historyBtn) el.historyBtn.addEventListener('click', () => PC.library.openLibrary('history'));
        if (el.presetsBtn) el.presetsBtn.addEventListener('click', () => PC.library.openLibrary('presets'));
        if (el.savePresetBtn) el.savePresetBtn.addEventListener('click', doSavePreset);

        // Share modal
        if (el.closeShareModal) el.closeShareModal.addEventListener('click', PC.share.closeShareModal);
        if (el.shareModal) {
            el.shareModal.addEventListener('click', (e) => {
                if (e.target === el.shareModal) PC.share.closeShareModal();
            });
        }
        if (el.copyBothBtn) el.copyBothBtn.addEventListener('click', PC.share.copyBothImageAndText);
        if (el.copyOnlyTextBtn) el.copyOnlyTextBtn.addEventListener('click', PC.share.copyOnlyText);
        if (el.copyOnlyImageBtn) el.copyOnlyImageBtn.addEventListener('click', PC.share.copyOnlyImage);
        if (el.publishBtn) el.publishBtn.addEventListener('click', PC.share.handlePublish);
        if (el.nativeShareBtn) {
            if (navigator.share) {
                el.nativeShareBtn.style.display = 'inline-flex';
                el.nativeShareBtn.addEventListener('click', PC.share.handleNativeShare);
            } else {
                el.nativeShareBtn.style.display = 'none';
            }
        }

        // Mobile sidebar
        if (el.toggleSettings && el.sidebar) {
            el.toggleSettings.addEventListener('click', () => el.sidebar.classList.add('open'));
        }
        if (el.closeSettings && el.sidebar) {
            el.closeSettings.addEventListener('click', () => el.sidebar.classList.remove('open'));
        }
    }

    function init() {
        PC.dom.initDom();
        PC.mobile.initMobileLayout();
        PC.state.load();
        PC.theme.initTheme();
        PC.i18n.applyLanguage();

        PC.controls.buildTemplateGrid();
        PC.controls.buildRatioGrid();
        PC.controls.buildExportControls();
        PC.controls.updateDynamicInputs();
        PC.controls.bindMediaControls({
            onImageUpload: PC.imaging.handleImageUpload,
            onLogoUpload: PC.imaging.handleLogoUpload,
            onLogoReset: PC.imaging.resetLogo
        });
        PC.controls.bindStyleControls();

        bindButtons();
        bindCanvasEditing();
        PC.library.initLibraryUi();
        PC.imaging.enablePhotoManipulation();

        lastTemplateId = PC.state.get('templateId');
        PC.state.subscribe(onStateChange);

        PC.shortcuts.registerShortcuts({
            onDownload: doDownload,
            onCopy: PC.share.quickCopyImage,
            onShare: PC.share.openShareModal,
            onUndo: () => { PC.state.undo(); repaint({ rebuildInputs: true }); },
            onRedo: () => { PC.state.redo(); repaint({ rebuildInputs: true }); },
            onEscape: () => {
                if (PC.share.isShareModalOpen()) PC.share.closeShareModal();
                else if (PC.library.isLibraryOpen()) PC.library.closeLibrary();
                else if (PC.dom.el.sidebar) PC.dom.el.sidebar.classList.remove('open');
            }
        });

        window.addEventListener('resize', PC.util.debounce(PC.preview.fitPreview, 120));
        PC.preview.observePreview();
        repaint();
        PC.pwa.registerServiceWorker();
    }

    function boot() {
        try {
            init();
        } catch (err) {
            // A silent failure here leaves an empty sidebar with no explanation.
            console.error('Startup failed:', err);
            if (PC.toast && PC.toast.banner) {
                PC.toast.banner(`Startup failed: ${err.message}. Press F12 → Console for details.`);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    PC.main = { init: boot, repaint };
})();
