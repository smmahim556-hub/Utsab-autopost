/**
 * Optional one-click publish to a connected Facebook Page.
 *
 * The page token lives only on the server (api/publish.php). The button stays
 * hidden unless that endpoint reports it is configured, so a default
 * deployment — or the app opened straight from disk — shows no half-working
 * control.
 */
window.PC = window.PC || {};

PC.publish = (function () {
    'use strict';

    let configuredCache = null;

    async function isPublishConfigured() {
        if (configuredCache !== null) return configuredCache;
        if (PC.util.isFileProtocol()) {
            configuredCache = false;
            return false;
        }
        try {
            const res = await PC.util.fetchWithTimeout('api/publish.php', {}, 6000);
            configuredCache = res.ok ? !!(await res.json()).configured : false;
        } catch (e) {
            configuredCache = false;
        }
        return configuredCache;
    }

    /**
     * @param {Blob} blob rendered card
     * @param {string} caption post text
     */
    async function publishCard(blob, caption) {
        const image = await PC.util.blobToDataUrl(blob);

        const res = await PC.util.fetchWithTimeout('api/publish.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image, caption: caption || '' })
        }, 60000);

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    }

    return { isPublishConfigured, publishCard };
})();
