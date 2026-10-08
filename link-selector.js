// ==UserScript==
// @name         Link Text Selector
// @namespace    https://ct106.com/
// @version      1.2
// @description  Press Shift to temporarily turn hovered links into selectable text. Click elsewhere to restore.
// @author       Chen Tao
// @copyright    Copyright (c) 2026 Chen Tao. All rights reserved.
// @license      MIT
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/*
 * Link Text Selector
 * Copyright (c) 2026 Chen Tao
 * Licensed under the MIT License.
 *
 * Press Shift while hovering over a link to make its text selectable.
 * Click elsewhere or press Escape to restore the original link.
 */

(function () {
    'use strict';

    let activeLink = null;
    let placeholder = null;

    // Restore the original link
    function restore() {
        if (!activeLink || !placeholder) return;

        if (placeholder.isConnected) {
            placeholder.replaceWith(activeLink);
        }

        activeLink = null;
        placeholder = null;
    }

    // Convert a link into selectable text
    function convert(link) {
        if (!link || !link.isConnected) return;

        restore();

        const span = document.createElement('span');
        const style = getComputedStyle(link);

        // Preserve appearance and highlight selectable state
        span.style.cssText = `
            color: ${style.color};
            font: ${style.font};
            font-size: ${style.fontSize};
            font-weight: ${style.fontWeight};
            line-height: ${style.lineHeight};
            letter-spacing: ${style.letterSpacing};
            text-decoration: ${style.textDecoration};

            cursor: text !important;
            user-select: text !important;
            -webkit-user-select: text !important;

            background: #fff3a3 !important;
            outline: 1px dashed #e6a800 !important;
            border-radius: 3px;
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
        `;

        // Clone content while preserving the original element
        span.append(...Array.from(link.childNodes, node => node.cloneNode(true)));

        activeLink = link;
        placeholder = span;

        link.replaceWith(span);
    }

    // Block original link events while allowing text selection
    function blockLinkEvents(event) {
        if (!placeholder) return;

        if (placeholder === event.target || placeholder.contains(event.target)) {
            event.stopImmediatePropagation();

            if (
                event.type === 'click' ||
                event.type === 'auxclick' ||
                event.type === 'dblclick'
            ) {
                event.preventDefault();
            }
        }
    }

    [
        'pointerdown',
        'pointerup',
        'mousedown',
        'mouseup',
        'click',
        'auxclick',
        'dblclick'
    ].forEach(type => {
        document.addEventListener(type, blockLinkEvents, true);
    });

    // Activate when Shift is pressed over a link
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Shift' || event.repeat) return;
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        const hovered = document.querySelectorAll(':hover');
        let link = null;

        for (let i = hovered.length - 1; i >= 0; i--) {
            if (hovered[i].matches?.('a[href]')) {
                link = hovered[i];
                break;
            }
        }

        if (link) {
            event.preventDefault();
            convert(link);
        }
    }, true);

    // Restore when clicking outside the converted text
    document.addEventListener('pointerdown', (event) => {
        if (!placeholder) return;

        if (!placeholder.contains(event.target)) {
            restore();
        }
    }, true);

    // Restore when Escape is pressed
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            restore();
        }
    }, true);

})();