/**
 * Builds and wires every sidebar control.
 *
 * Content inputs are generated from the active template's `{placeholders}`, so
 * a new field in a template appears here with no extra code.
 */
window.PC = window.PC || {};

PC.controls = (function () {
    'use strict';

    const OVERFLOW_WARNING_PX = 4;

    /* --------------------------------------------------- template picker */

    function buildTemplateGrid() {
        const el = PC.dom.el;
        const h = PC.dom.h;
        if (!el.templateGrid) return;
        el.templateGrid.innerHTML = '';

        PC.templates.TEMPLATES.forEach(template => {
            el.templateGrid.appendChild(
                h('button', {
                    type: 'button',
                    class: 'template-btn',
                    dataset: { template: template.id },
                    title: template.description
                },
                    h('span', { class: 'template-swatch', style: { background: template.accent } }),
                    h('span', { class: 'template-names' },
                        h('span', { class: 'template-name', text: template.name }),
                        h('span', { class: 'template-name-bn', text: template.nameBn })
                    ),
                    h('span', { class: 'template-check', text: '✓' })
                )
            );
        });

        el.templateGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-template]');
            if (!btn) return;
            const id = btn.dataset.template;
            const previousTemplateId = PC.state.get('templateId');
            if (id === previousTemplateId) return;
            PC.state.set('templateId', id, { source: 'template', full: true });
            PC.state.applyTemplateDefaults(id, { previousTemplateId });
            PC.state.notify({ source: 'template', full: true });
        });
    }

    function syncTemplateGrid() {
        const el = PC.dom.el;
        if (!el.templateGrid) return;
        const current = PC.state.get('templateId');
        el.templateGrid.querySelectorAll('[data-template]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.template === current);
        });
    }

    /* ------------------------------------------------------ ratio picker */

    function buildRatioGrid() {
        const el = PC.dom.el;
        const h = PC.dom.h;
        if (!el.ratioSelector) return;
        el.ratioSelector.innerHTML = '';

        Object.keys(PC.ratios.ASPECT_RATIOS).forEach(key => {
            const config = PC.ratios.ASPECT_RATIOS[key];
            el.ratioSelector.appendChild(
                h('button', { type: 'button', class: 'ratio-btn', dataset: { ratio: key } },
                    h('span', { class: `ratio-icon-box ${config.className}` }),
                    h('span', { class: 'ratio-title', text: config.label }),
                    h('span', { class: 'ratio-desc', text: config.desc })
                )
            );
        });

        el.ratioSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-ratio]');
            if (!btn) return;
            PC.state.set('aspectRatio', btn.dataset.ratio, { source: 'ratio', full: true });
        });
    }

    function syncRatioGrid() {
        const el = PC.dom.el;
        if (!el.ratioSelector) return;
        const current = PC.state.get('aspectRatio');
        el.ratioSelector.querySelectorAll('[data-ratio]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === current);
        });
        if (el.zoomHint) {
            const ratio = PC.ratios.getRatio(current);
            el.zoomHint.textContent = `Preview scaled to fit · output ${ratio.width}×${ratio.height}`;
        }
    }

    /* ---------------------------------------------------- content inputs */

    function buildDateControl(field) {
        const h = PC.dom.h;
        const B = PC.bengali;
        const group = h('div', { class: 'control-group' });
        const todayBengali = B.getTodayBengaliDate();
        const todayIso = B.getTodayISODate();

        const badge = h('span', { class: 'bengali-date-badge', text: `📅 ${PC.state.get(field) || todayBengali}` });

        const picker = h('input', {
            type: 'date',
            class: 'calendar-date-input',
            id: 'datePickerInput',
            value: B.parseBengaliDateToISO(PC.state.get(field)) || todayIso
        });

        const openCalendar = () => {
            try {
                if (typeof picker.showPicker === 'function') picker.showPicker();
                else picker.focus();
            } catch (e) {
                picker.focus();
            }
        };

        const calBtn = h('button', {
            type: 'button',
            class: 'calendar-icon-btn',
            title: 'ক্যালেন্ডার খুলুন',
            onClick: openCalendar,
            html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                     <line x1="16" y1="2" x2="16" y2="6"></line>
                     <line x1="8" y1="2" x2="8" y2="6"></line>
                     <line x1="3" y1="10" x2="21" y2="10"></line>
                   </svg><span>ক্যালেন্ডার</span>`
        });

        picker.addEventListener('click', openCalendar);

        const setDate = (value, iso) => {
            PC.state.set(field, value, { source: 'date' });
            badge.textContent = `📅 ${value}`;
            if (iso) picker.value = iso;
        };

        const onPick = (e) => {
            if (!e.target.value) return;
            const parts = e.target.value.split('-').map(Number);
            setDate(B.formatBengaliDate(parts[0], parts[1] - 1, parts[2]));
        };
        picker.addEventListener('change', onPick);
        picker.addEventListener('input', onPick);

        const quickRow = h('div', { class: 'date-quick-row' },
            h('button', { type: 'button', class: 'today-reset-btn', onClick: () => setDate(todayBengali, todayIso) }, 'আজকে'),
            h('button', {
                type: 'button',
                class: 'today-reset-btn',
                onClick: () => setDate(B.getBengaliDateOffset(-1), B.getISODateOffset(-1))
            }, 'গতকাল'),
            h('button', {
                type: 'button',
                class: 'today-reset-btn',
                title: 'Append the current time',
                onClick: () => {
                    const base = (PC.state.get(field) || todayBengali).split(' · ')[0];
                    setDate(`${base} · ${B.getCurrentBengaliTime()}`);
                }
            }, '+ সময়')
        );

        group.append(
            h('label', { text: 'Date (তারিখ)' }),
            h('div', { class: 'calendar-input-row' }, picker, calBtn),
            h('div', { class: 'bengali-date-badge-row' }, badge),
            quickRow
        );
        return group;
    }

    function buildTextControl(field) {
        const h = PC.dom.h;
        const isLong = PC.templates.LONG_TEXT_FIELDS.includes(field);
        const group = h('div', { class: 'control-group' });

        const input = isLong
            ? h('textarea', { rows: 3, dataset: { field } })
            : h('input', { type: 'text', dataset: { field } });
        input.value = PC.state.get(field) || '';

        const counter = h('div', { class: 'field-counter' });
        const updateCounter = () => { counter.textContent = `${input.value.length} chars`; };
        updateCounter();

        input.addEventListener('input', (e) => {
            PC.state.set(field, e.target.value, { source: `field:${field}` });
            updateCounter();
        });

        group.append(h('label', { text: field.charAt(0).toUpperCase() + field.slice(1) }), input);
        if (isLong) group.append(counter);
        return group;
    }

    function updateDynamicInputs() {
        const el = PC.dom.el;
        if (!el.dynamicContent) return;
        const template = PC.templates.getTemplate(PC.state.get('templateId'));
        el.dynamicContent.innerHTML = '';

        PC.templates.contentFieldsOf(template).forEach(field => {
            el.dynamicContent.appendChild(
                field === 'date' ? buildDateControl(field) : buildTextControl(field)
            );
        });

        el.dynamicContent.appendChild(PC.dom.h('div', { class: 'overflow-warning', id: 'overflowWarning' }));
    }

    /** Sync input values after an undo / restore, without rebuilding the DOM. */
    function syncDynamicInputs() {
        const el = PC.dom.el;
        if (!el.dynamicContent) return;
        el.dynamicContent.querySelectorAll('[data-field]').forEach(input => {
            const value = PC.state.get(input.dataset.field) || '';
            if (input.value !== value) input.value = value;
        });
        const badge = el.dynamicContent.querySelector('.bengali-date-badge');
        if (badge) badge.textContent = `📅 ${PC.state.get('date') || ''}`;
    }

    /** Warn when a headline is still too long after auto-fit bottomed out. */
    function updateOverflowWarning() {
        const node = document.getElementById('overflowWarning');
        const target = PC.dom.el.renderTarget;
        if (!node || !target) return;
        const excess = PC.autofit.measureOverflow(target);
        if (excess > OVERFLOW_WARNING_PX) {
            node.textContent = '⚠ Headline is still overflowing its box — shorten it or lower Text Size.';
            node.style.display = 'block';
        } else {
            node.style.display = 'none';
        }
    }

    /* ------------------------------------------------------ media + style */

    function bindRange(input, key, transform) {
        if (!input) return;
        input.addEventListener('input', (e) => {
            PC.state.set(key, (transform || Number)(e.target.value), { source: key });
        });
    }

    function bindMediaControls(handlers) {
        const el = PC.dom.el;
        bindRange(el.imageScale, 'imageScale');
        bindRange(el.imageX, 'imageX', v => parseInt(v, 10) || 0);
        bindRange(el.imageY, 'imageY', v => parseInt(v, 10) || 0);
        bindRange(el.overlay, 'overlay');

        if (el.imageObjectFit) {
            el.imageObjectFit.addEventListener('change', (e) => PC.state.set('imageObjectFit', e.target.value, { source: 'fit' }));
        }
        if (el.image) el.image.addEventListener('change', handlers.onImageUpload);
        if (el.logoInput) el.logoInput.addEventListener('change', handlers.onLogoUpload);
        if (el.logoResetBtn) el.logoResetBtn.addEventListener('click', handlers.onLogoReset);
    }

    function bindStyleControls() {
        const el = PC.dom.el;
        bindRange(el.textSize, 'headingScale');
        bindRange(el.lineHeight, 'lineHeight');

        if (el.textAlign) {
            el.textAlign.addEventListener('change', (e) => PC.state.set('textAlign', e.target.value, { source: 'align' }));
        }
        if (el.textColor) {
            el.textColor.addEventListener('input', (e) => PC.state.set('textColor', e.target.value, { source: 'color' }));
        }
        if (el.textColorReset) {
            el.textColorReset.addEventListener('click', () => PC.state.set('textColor', '', { source: 'color' }));
        }
        if (el.autoFit) {
            el.autoFit.addEventListener('change', (e) => PC.state.set('autoFit', e.target.checked, { source: 'autofit' }));
        }
    }

    function buildExportControls() {
        const el = PC.dom.el;
        const formats = PC.exporter.EXPORT_FORMATS;

        if (el.exportFormat && !el.exportFormat.options.length) {
            Object.keys(formats).forEach(key => {
                el.exportFormat.appendChild(PC.dom.h('option', { value: key, text: formats[key].label }));
            });
        }
        if (el.exportFormat) {
            el.exportFormat.addEventListener('change', (e) => {
                PC.state.set('exportFormat', e.target.value, { source: 'export' });
                syncExportControls();
            });
        }
        if (el.exportQuality) {
            el.exportQuality.addEventListener('input', (e) => PC.state.set('exportQuality', Number(e.target.value), { source: 'export' }));
        }
        if (el.exportScale) {
            el.exportScale.addEventListener('change', (e) => PC.state.set('exportScale', Number(e.target.value), { source: 'export' }));
        }
    }

    function syncExportControls() {
        const el = PC.dom.el;
        const st = PC.state.getState();
        const spec = PC.exporter.EXPORT_FORMATS[st.exportFormat] || PC.exporter.EXPORT_FORMATS.png;
        if (el.exportQualityRow) el.exportQualityRow.style.display = spec.lossy ? 'flex' : 'none';
        if (el.exportFormat) el.exportFormat.value = st.exportFormat;
        if (el.exportQuality) el.exportQuality.value = st.exportQuality;
        if (el.exportScale) el.exportScale.value = String(st.exportScale);
    }

    /* ------------------------------------------------------------ syncing */

    /**
     * Keep a one-line summary on each collapsed panel head, so hiding the
     * controls does not hide what they are currently set to.
     */
    function syncPanelSummaries() {
        const st = PC.state.getState();

        const card = document.getElementById('cardSummary');
        if (card) {
            const template = PC.templates.getTemplate(st.templateId);
            card.textContent = `${template.name} · ${PC.ratios.getRatio(st.aspectRatio).label}`;
        }

        const exportNode = document.getElementById('exportSummary');
        if (exportNode) {
            const spec = PC.exporter.EXPORT_FORMATS[st.exportFormat] || PC.exporter.EXPORT_FORMATS.png;
            exportNode.textContent = `${spec.ext.toUpperCase()} · ${st.exportScale}×`;
        }
    }

    function syncControls() {
        const el = PC.dom.el;
        const st = PC.state.getState();

        if (el.imageScale) el.imageScale.value = st.imageScale;
        if (el.imageX) el.imageX.value = st.imageX;
        if (el.imageY) el.imageY.value = st.imageY;
        if (el.imageObjectFit) el.imageObjectFit.value = st.imageObjectFit;
        if (el.overlay) el.overlay.value = st.overlay;
        if (el.imageUrl && document.activeElement !== el.imageUrl) el.imageUrl.value = st.imageUrl || '';
        if (el.articleUrl && document.activeElement !== el.articleUrl) el.articleUrl.value = st.articleUrl || '';

        if (el.textSize) el.textSize.value = st.headingScale;
        if (el.lineHeight) el.lineHeight.value = st.lineHeight;
        if (el.textAlign) el.textAlign.value = st.textAlign || '';
        if (el.textColor) el.textColor.value = st.textColor || '#ffffff';
        if (el.autoFit) el.autoFit.checked = st.autoFit !== false;

        if (el.undoBtn) el.undoBtn.disabled = !PC.state.canUndo();
        if (el.redoBtn) el.redoBtn.disabled = !PC.state.canRedo();

        syncExportControls();
        syncTemplateGrid();
        syncRatioGrid();
        syncPanelSummaries();
    }

    return {
        buildTemplateGrid, syncTemplateGrid, buildRatioGrid, syncRatioGrid,
        updateDynamicInputs, syncDynamicInputs, updateOverflowWarning,
        syncPanelSummaries,
        bindMediaControls, bindStyleControls, buildExportControls, syncControls
    };
})();
