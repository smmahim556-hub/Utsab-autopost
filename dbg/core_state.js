/**
 * Single source of truth for the card being edited.
 *
 * - Flat shape: template content fields live directly on the state object, so a
 *   new `{placeholder}` in a template needs no state plumbing.
 * - Persisted to localStorage (image data dropped first if the quota is hit).
 * - Every mutation pushes an undo snapshot (coalesced by a short timer so
 *   typing does not create one entry per keystroke).
 */
window.PC = window.PC || {};

PC.state = (function () {
    'use strict';

    const STORAGE_KEY = 'photoCardState';
    const UNDO_LIMIT = 60;
    const COALESCE_MS = 400;

    const DEFAULT_LOGO = 'assets/img/logo-utsab.webp';

    /**
     * Templates whose background needs the alternate logo. The obituary card is
     * a light memorial panel, so the standard logo disappears into it.
     * Only applies while the user has not uploaded a logo of their own.
     */
    const TEMPLATE_LOGOS = {
        obituary: 'assets/img/logo-utsab-dark.webp'
    };

    /** Logo to actually render: a user upload always wins over the per-template one. */
    function resolveLogo(st) {
        const isCustom = st.logo && st.logo !== DEFAULT_LOGO && !Object.keys(TEMPLATE_LOGOS)
            .some(id => TEMPLATE_LOGOS[id] === st.logo);
        if (isCustom) return st.logo;
        return TEMPLATE_LOGOS[st.templateId] || DEFAULT_LOGO;
    }

    const defaultState = {
        templateId: 'utsab',
        aspectRatio: PC.ratios.DEFAULT_RATIO,

        // Content (template placeholders)
        heading: '',
        date: '',

        // Media
        image: '',          // data URL used for render/export
        imageUrl: '',       // original remote URL, kept for re-fetch
        articleUrl: '',
        logo: DEFAULT_LOGO,
        imageScale: 1,
        imageX: 0,
        imageY: 0,
        imageObjectFit: 'cover',
        overlay: 0,         // 0..1 photo shade

        // Typography overrides
        font: 'Noto Serif Bengali Condensed',
        headingScale: 1,    // multiplies the template's --fit-base
        lineHeight: 1.4,
        textAlign: '',      // '' = template default
        textColor: '',      // '' = template default

        // Export prefs
        exportFormat: 'png',
        exportQuality: 0.92,
        exportScale: 1,

        // App prefs
        theme: 'light',
        lang: 'en',
        autoFit: true
    };

    let state = Object.assign({}, defaultState);

    const listeners = new Set();
    let undoStack = [];
    let redoStack = [];
    let coalesceTimer = null;
    let pendingSnapshot = null;
    let suspendHistory = false;

    /* ------------------------------------------------------------- read */

    function getState() { return state; }
    function get(key) { return state[key]; }

    /* -------------------------------------------------------- listeners */

    function subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    function emit(meta) {
        listeners.forEach(fn => {
            try {
                fn(state, meta);
            } catch (e) {
                console.error('State listener failed:', e);
            }
        });
    }

    /* ---------------------------------------------------------- history */

    function snapshot() {
        const copy = Object.assign({}, state);
        delete copy.image;
        return JSON.stringify(copy);
    }

    function pushHistory() {
        if (suspendHistory || pendingSnapshot === null) return;
        if (undoStack[undoStack.length - 1] === pendingSnapshot) {
            pendingSnapshot = null;
            return;
        }
        undoStack.push(pendingSnapshot);
        if (undoStack.length > UNDO_LIMIT) undoStack.shift();
        redoStack = [];
        pendingSnapshot = null;
    }

    function markHistory(before) {
        if (suspendHistory) return;
        if (pendingSnapshot === null) pendingSnapshot = before;
        if (coalesceTimer) clearTimeout(coalesceTimer);
        coalesceTimer = setTimeout(pushHistory, COALESCE_MS);
    }

    function canUndo() { return undoStack.length > 0 || pendingSnapshot !== null; }
    function canRedo() { return redoStack.length > 0; }

    function undo() {
        if (coalesceTimer) { clearTimeout(coalesceTimer); coalesceTimer = null; }
        pushHistory();
        if (!undoStack.length) return false;

        redoStack.push(snapshot());
        const restored = JSON.parse(undoStack.pop());
        suspendHistory = true;
        state = Object.assign({}, state, restored);
        suspendHistory = false;
        save();
        emit({ source: 'undo', full: true });
        return true;
    }

    function redo() {
        if (!redoStack.length) return false;
        undoStack.push(snapshot());
        const restored = JSON.parse(redoStack.pop());
        suspendHistory = true;
        state = Object.assign({}, state, restored);
        suspendHistory = false;
        save();
        emit({ source: 'redo', full: true });
        return true;
    }

    /* ------------------------------------------------------------ write */

    /** Update one key. `meta.silent` skips notifying listeners. */
    function set(key, value, meta) {
        meta = meta || {};
        if (state[key] === value) return;
        markHistory(snapshot());
        state[key] = value;
        save();
        if (!meta.silent) emit(Object.assign({ source: meta.source || key, key }, meta));
    }

    /** Update several keys as one history entry. */
    function patch(values, meta) {
        meta = meta || {};
        const before = snapshot();
        let changed = false;
        Object.keys(values).forEach(key => {
            if (state[key] !== values[key]) {
                state[key] = values[key];
                changed = true;
            }
        });
        if (!changed) return;
        markHistory(before);
        save();
        if (!meta.silent) emit(Object.assign({ source: meta.source || 'patch', full: true }, meta));
    }

    /** Replace the whole card (used by library restore and presets). */
    function replaceAll(values, meta) {
        meta = meta || {};
        markHistory(snapshot());
        state = Object.assign({}, defaultState, values);
        save();
        emit({ source: meta.source || 'replace', full: true });
    }

    function notify(meta) {
        emit(Object.assign({ source: 'manual', full: true }, meta || {}));
    }

    /* --------------------------------------------------------- persist */

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Quota is usually blown by the base64 image; keep everything else.
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign({}, state, { image: '' })));
            } catch (err) {
                console.warn('State could not be persisted:', err);
            }
        }
    }

    /**
     * Seed content fields from a template's defaults.
     *
     * Content lives in one flat object, so templates that reuse a field name
     * (`badge` belongs to both Breaking News and Live, `heading` to most) would
     * otherwise carry the previous template's text across. The rule here is
     * "defaults don't leak, edits do": a field still holding the previous
     * template's placeholder is replaced by the new template's own, while
     * anything the user typed or scraped is left alone.
     *
     * @param {string} templateId template being switched to
     * @param {{force?: boolean, previousTemplateId?: string}} options
     */
    function applyTemplateDefaults(templateId, options) {
        options = options || {};
        const defaults = PC.templates.getTemplate(templateId).defaults || {};
        const previousDefaults = options.previousTemplateId
            ? (PC.templates.getTemplate(options.previousTemplateId).defaults || {})
            : {};

        const values = {};
        Object.keys(defaults).forEach(key => {
            const current = state[key];
            const isEmpty = !current;
            const isStalePlaceholder = previousDefaults[key] !== undefined
                && current === previousDefaults[key]
                && defaults[key] !== previousDefaults[key];

            if (options.force || isEmpty || isStalePlaceholder) values[key] = defaults[key];
        });

        if (!state.date || options.force) values.date = PC.bengali.getTodayBengaliDate();
        if (Object.keys(values).length) patch(values, { source: 'template-defaults' });
    }

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) state = Object.assign({}, state, JSON.parse(saved));
        } catch (e) {
            console.warn('Saved state could not be read:', e);
        }

        if (!PC.templates.TEMPLATES.some(t => t.id === state.templateId)) state.templateId = 'utsab';
        if (!PC.ratios.ASPECT_RATIOS[state.aspectRatio]) state.aspectRatio = PC.ratios.DEFAULT_RATIO;
        if (!state.logo) state.logo = DEFAULT_LOGO;

        // The card is a daily product: always open on today's date.
        state.date = PC.bengali.getTodayBengaliDate();

        suspendHistory = true;
        applyTemplateDefaults(state.templateId);
        suspendHistory = false;

        undoStack = [];
        redoStack = [];
    }

    function resetAll() {
        localStorage.removeItem(STORAGE_KEY);
        state = Object.assign({}, defaultState);
        undoStack = [];
        redoStack = [];
        load();
        emit({ source: 'reset', full: true });
    }

    /** Serializable copy for presets / saved drafts. */
    function exportSnapshot() {
        return JSON.parse(JSON.stringify(state));
    }

    return {
        DEFAULT_LOGO, TEMPLATE_LOGOS, resolveLogo, defaultState,
        getState, get, subscribe,
        set, patch, replaceAll, notify,
        canUndo, canRedo, undo, redo,
        save, load, resetAll, exportSnapshot, applyTemplateDefaults
    };
})();
