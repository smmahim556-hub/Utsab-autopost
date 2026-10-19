/**
 * Turns a state object into card markup and paints it into the preview.
 *
 * Security: every content value is escaped before it reaches innerHTML.
 * Headlines can arrive from a scraped third-party page, so raw injection here
 * would be a cross-site scripting hole.
 */
window.PC = window.PC || {};

PC.render = (function () {
    'use strict';

    const PLACEHOLDER_IMAGE =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0iI2YzZjRmNiI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5JTUFHRTwvdGV4dD48L3N2Zz4=';

    /** Fields the user edits through a dedicated control, not on the canvas. */
    const NON_EDITABLE_FIELDS = new Set(['date']);

    /**
     * Build the card's HTML for a given state snapshot.
     * @param {object} st
     * @param {{editable?: boolean}} options
     */
    function buildCardHtml(st, options) {
        const editable = !options || options.editable !== false;
        const esc = PC.util.escapeHtml;
        const template = PC.templates.getTemplate(st.templateId);
        const ratio = PC.ratios.getRatio(st.aspectRatio);
        let html = template.html;

        PC.templates.extractPlaceholders(template.html).forEach(field => {
            if (PC.templates.SYSTEM_FIELDS.includes(field)) return;

            const value = PC.util.escapeMultiline(st[field] || '');
            const pattern = new RegExp(`\\{${field}\\}`, 'g');
            const attrs = (editable && !NON_EDITABLE_FIELDS.has(field))
                ? ` contenteditable="true" data-field="${esc(field)}"`
                : ` data-field="${esc(field)}"`;

            html = html.replace(
                pattern,
                `<span${attrs} class="card-field" style="outline:none;display:block;width:100%;line-height:inherit;">${value}</span>`
            );
        });

        // System placeholders
        html = html.replace(/\{font\}/g, esc(st.font || 'Noto Serif Bengali Condensed'));
        html = html.replace(/\{ratio_class\}/g, ratio.className);
        html = html.replace(/\{overlay\}/g, String(Number(st.overlay) || 0));

        const mainImage = esc(st.image || PLACEHOLDER_IMAGE);
        html = html.replace(
            /\{image\}/g,
            `${mainImage}" data-main-image="true" crossorigin="anonymous" referrerpolicy="no-referrer`
        );
        html = html.replace(/\{logo\}/g, esc(PC.state.resolveLogo(st)));

        return html;
    }

    /** Apply image transform and per-card typography overrides to a rendered card. */
    function applyCardStyles(root, st) {
        const card = root.querySelector('.template-wrapper') || root.firstElementChild;
        if (!card) return;

        const mainImg = root.querySelector('[data-main-image="true"]');
        if (mainImg) {
            mainImg.style.transform =
                `scale(${st.imageScale || 1}) translate(${st.imageX || 0}px, ${st.imageY || 0}px)`;
            mainImg.style.objectFit = st.imageObjectFit || 'cover';
        }

        if (st.lineHeight) card.style.setProperty('--card-line-height', String(st.lineHeight));
        else card.style.removeProperty('--card-line-height');

        if (st.textAlign) card.style.setProperty('--card-text-align', st.textAlign);
        else card.style.removeProperty('--card-text-align');

        if (st.textColor) card.style.setProperty('--card-text-color', st.textColor);
        else card.style.removeProperty('--card-text-color');
    }

    /** Paint the live preview. */
    function renderPreview() {
        const el = PC.dom.el;
        if (!el.renderTarget) return;
        const st = PC.state.getState();

        el.renderTarget.innerHTML = buildCardHtml(st, { editable: true });
        applyCardStyles(el.renderTarget, st);
        PC.autofit.applyAutoFit(el.renderTarget, st);
    }

    /**
     * Render a card for an arbitrary state off-screen (batch jobs, multi-ratio
     * export). Caller must call the returned `dispose()`.
     */
    function renderOffscreen(st) {
        const ratio = PC.ratios.getRatio(st.aspectRatio);

        const host = document.createElement('div');
        host.style.cssText =
            `position:fixed;left:0;top:0;width:${ratio.width}px;height:${ratio.height}px;z-index:-9999;opacity:0;pointer-events:none;`;
        host.innerHTML = buildCardHtml(st, { editable: false });
        document.body.appendChild(host);

        applyCardStyles(host, st);
        PC.autofit.applyAutoFit(host, st);

        return {
            element: host.firstElementChild,
            host,
            dispose: () => host.remove()
        };
    }

    return { PLACEHOLDER_IMAGE, buildCardHtml, applyCardStyles, renderPreview, renderOffscreen };
})();
