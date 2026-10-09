// ==UserScript==
// @name         Link Text Selector
// @namespace    https://ct106.com/
// @version      1.4
// @description  Press Shift to temporarily turn hovered links, buttons, or inputs into selectable text. Click elsewhere to restore.
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
 * Press Shift while hovering over a link, button, or input to make its text selectable.
 * Click elsewhere or press Escape to restore the original element.
 */

(function () {
    'use strict';

    let activeElement = null;
    let placeholder = null;
    const convertibleSelector = 'a[href], button, input';

    // Restore the original element
    function restore() {
        if (!activeElement || !placeholder) return;

        if (placeholder.isConnected) {
            placeholder.replaceWith(activeElement);
        }

        activeElement = null;
        placeholder = null;
    }

    function getInputText(input) {
        switch (input.type) {
            case 'password':
                return '\u2022'.repeat(input.value.length);
            case 'file':
                return Array.from(input.files || [], file => file.name).join(', ');
            case 'checkbox':
            case 'radio': {
                const value = input.value === 'on' ? '' : input.value;
                return `[${input.checked ? 'x' : ' '}]${value ? ` ${value}` : ''}`;
            }
            case 'image':
                return input.alt || input.value;
            default:
                return input.value || input.placeholder;
        }
    }

    // Convert a link or form control into selectable text
    function convert(element) {
        if (!element || !element.isConnected) return;

        restore();

        const span = document.createElement('span');
        const style = getComputedStyle(element);

        // Keep the highlighted text legible on light and dark-themed pages.
        span.style.cssText = `
            color: #202124 !important;
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

        if (element instanceof HTMLInputElement) {
            span.textContent = getInputText(element);
        } else {
            span.append(...Array.from(element.childNodes, node => node.cloneNode(true)));
        }

        activeElement = element;
        placeholder = span;

        element.replaceWith(span);
    }

    // Block original element events while allowing text selection
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

    // Activate when Shift is pressed over a link or form control
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Shift' || event.repeat) return;
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        const hovered = document.querySelectorAll(':hover');
        let element = null;

        for (let i = hovered.length - 1; i >= 0; i--) {
            if (hovered[i].matches?.(convertibleSelector)) {
                element = hovered[i];
                break;
            }
        }

        if (element) {
            event.preventDefault();
            convert(element);
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