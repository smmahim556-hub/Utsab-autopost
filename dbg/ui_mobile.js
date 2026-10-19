/**
 * Phone layout. On narrow screens the news link sits in a bar above the card
 * and Share / Download / Settings in a bar below it, so fetching and exporting
 * a card needs no trip into the Settings sheet.
 *
 * The real controls are moved, not copied: ids and listeners stay intact, and
 * each node goes back to its original spot in the sidebar when the screen
 * widens again.
 */
window.PC = window.PC || {};

PC.mobile = (function () {
    'use strict';

    const QUERY = '(max-width: 900px)';

    /** [node, target bar id] — moved in this order. */
    function slots() {
        return [
            [document.getElementById('newsLinkGroup'), 'mobileTop'],
            [document.querySelector('.sidebar .actions-row'), 'mobileBottom'],
            [document.getElementById('toggleSettings'), 'mobileBottom']
        ].filter(([node]) => node);
    }

    function initMobileLayout() {
        if (!window.matchMedia) return;

        // A comment marks where each node lives on desktop so it can return.
        const moves = slots().map(([node, barId]) => {
            const marker = document.createComment('mobile-slot');
            node.parentNode.insertBefore(marker, node);
            return { node, marker, bar: document.getElementById(barId) };
        }).filter((m) => m.bar);

        const mq = window.matchMedia(QUERY);

        function apply() {
            moves.forEach(({ node, marker, bar }) => {
                if (mq.matches) bar.appendChild(node);
                else marker.parentNode.insertBefore(node, marker.nextSibling);
            });
        }

        apply();
        if (mq.addEventListener) mq.addEventListener('change', apply);
        else if (mq.addListener) mq.addListener(apply);
    }

    return { initMobileLayout };
})();
