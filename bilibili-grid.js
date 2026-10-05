// ==UserScript==
// @name         Bilibili 动态页 - 关注视频网格
// @namespace    https://t.bilibili.com/
// @version      3.1
// @description  将 B 站动态页改造成类似首页的关注视频 Feed
// @author       chentao1006
// @copyright    Copyright (c) 2026 Tao (chentao1006)
// @license      MIT
// @match        https://t.bilibili.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CARD_CLASS = 'ct-video-card';
    const PROCESSED = 'ctVideoGridProcessed';

    const style = document.createElement('style');

    style.textContent = `
        body {
            background: #f5f6f7 !important;
        }

        .ct-grid-expand {
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            flex: 1 1 auto !important;
        }

        .ct-grid-main {
            width: calc(100vw - 64px) !important;
            max-width: 1720px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            box-sizing: border-box !important;
        }

        .ct-grid-sidebar {
            display: none !important;
        }

        .bili-dyn-publishing,
        [class*="dyn-publishing"],
        [class*="publish-panel"] {
            display: none !important;
        }

        .bili-dyn-up-list,
        [class*="dyn-up-list"] {
            display: none !important;
        }

        .bili-dyn-list-tabs,
        [class*="dyn-list-tabs"] {
            width: 100% !important;
            max-width: none !important;
            margin-top: 0 !important;
            box-sizing: border-box !important;
            border-radius: 8px !important;
        }

        .bili-dyn-list__items {
            display: grid !important;
            grid-template-columns:
                repeat(auto-fill, minmax(240px, 1fr)) !important;
            gap: 28px 20px !important;
            width: 100% !important;
            max-width: none !important;
            margin: 22px 0 50px !important;
            padding: 0 !important;
            align-items: start !important;
        }

        .bili-dyn-list__item {
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
        }

        .bili-dyn-list__item.ct-hide-item {
            display: none !important;
        }

        .bili-dyn-list__item.ct-video-item > :not(.${CARD_CLASS}) {
            display: none !important;
        }

        .${CARD_CLASS} {
            display: block;
            width: 100%;
            min-width: 0;
            background: transparent;
            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                "PingFang SC",
                "Microsoft YaHei",
                sans-serif;
        }

        .${CARD_CLASS} .ct-cover {
            position: relative;
            display: block;
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
            border-radius: 7px;
            background: #e3e5e7;
        }

        .${CARD_CLASS} .ct-cover img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition:
                transform .2s ease,
                filter .2s ease;
        }

        .${CARD_CLASS} .ct-cover:hover img {
            transform: scale(1.025);
            filter: brightness(.92);
        }

        .${CARD_CLASS} .ct-duration {
            position: absolute;
            right: 6px;
            bottom: 6px;
            padding: 1px 5px;
            border-radius: 4px;
            background: rgba(0, 0, 0, .66);
            color: white;
            font-size: 12px;
            line-height: 18px;
        }

        .${CARD_CLASS} .ct-title {
            display: -webkit-box;
            margin-top: 9px;
            overflow: hidden;
            color: #18191c;
            font-size: 15px;
            font-weight: 500;
            line-height: 22px;
            text-decoration: none;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }

        .${CARD_CLASS} .ct-title:hover {
            color: #00aeec;
        }

        .${CARD_CLASS} .ct-meta {
            display: flex;
            align-items: center;
            min-width: 0;
            margin-top: 5px;
            color: #9499a0;
            font-size: 13px;
            line-height: 20px;
        }

        .${CARD_CLASS} .ct-author {
            max-width: 65%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .${CARD_CLASS} .ct-dot {
            flex: none;
            margin: 0 6px;
        }

        .${CARD_CLASS} .ct-time {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        @media (max-width: 1200px) {
            .ct-grid-main {
                width: calc(100vw - 40px) !important;
            }

            .bili-dyn-list__items {
                grid-template-columns:
                    repeat(auto-fill, minmax(220px, 1fr)) !important;
            }
        }

        @media (max-width: 700px) {
            .ct-grid-main {
                width: calc(100vw - 24px) !important;
            }

            .bili-dyn-list__items {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr)) !important;
                gap: 20px 12px !important;
            }
        }

        @media (max-width: 480px) {
            .bili-dyn-list__items {
                grid-template-columns: 1fr !important;
            }
        }
    `;

    document.head.appendChild(style);

    function text(el) {
        return (el?.innerText || el?.textContent || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeUrl(url) {
        if (!url) {
            return '';
        }

        if (url.startsWith('//')) {
            return 'https:' + url;
        }

        return url;
    }

    function findVideoLink(item) {
        const links = [
            ...item.querySelectorAll('a[href]')
        ];

        return links.find(a => {
            const href = a.href || '';

            return (
                /bilibili\.com\/video\/BV/i.test(href) ||
                /bilibili\.com\/video\/av/i.test(href)
            );
        });
    }

    function findCover(item) {
        const selectors = [
            '.bili-dyn-card-video img',
            '.bili-dyn-card-video__cover img',
            'a[href*="/video/"] img',
            'img'
        ];

        for (const selector of selectors) {
            const imgs = [
                ...item.querySelectorAll(selector)
            ];

            let best = null;
            let bestArea = 0;

            for (const img of imgs) {
                const rect =
                    img.getBoundingClientRect();

                const width =
                    rect.width ||
                    img.naturalWidth ||
                    0;

                const height =
                    rect.height ||
                    img.naturalHeight ||
                    0;

                const area =
                    width * height;

                if (
                    width > 120 &&
                    height > 60 &&
                    area > bestArea
                ) {
                    best = img;
                    bestArea = area;
                }
            }

            if (best) {
                return best;
            }
        }

        return null;
    }

    function findTitle(item, videoLink) {
        const selectors = [
            '.bili-dyn-card-video__title',
            '.bili-dyn-card-video__title-content',
            '.bili-dyn-card-video__title-text',
            '[class*="video"][class*="title"]',
            '[class*="video"] [class*="title"]'
        ];

        for (const selector of selectors) {
            const value =
                text(item.querySelector(selector));

            if (value) {
                return value;
            }
        }

        const value =
            text(videoLink);

        if (
            value &&
            value.length > 2
        ) {
            return value;
        }

        return '视频';
    }

    function findAuthor(item) {
        const selectors = [
            '.bili-dyn-title__text',
            '.bili-dyn-title__text a',
            '[class*="dyn-title"] a',
            '[class*="author"]'
        ];

        for (const selector of selectors) {
            const value =
                text(item.querySelector(selector));

            if (value) {
                return value;
            }
        }

        return '';
    }

    function findTime(item) {
        const selectors = [
            '.bili-dyn-time',
            '.bili-dyn-time__text',
            '[class*="dyn-time"]'
        ];

        for (const selector of selectors) {
            const value =
                text(item.querySelector(selector));

            if (value) {
                return value;
            }
        }

        return '';
    }

    function findDuration(item) {
        const candidates = [
            ...item.querySelectorAll(
                '[class*="duration"], span'
            )
        ];

        for (const el of candidates) {
            const value =
                text(el);

            if (
                /^\d{1,3}:\d{2}(?::\d{2})?$/.test(value)
            ) {
                return value;
            }
        }

        return '';
    }

    function createCard(data) {
        const card =
            document.createElement('div');

        card.className =
            CARD_CLASS;

        const cover =
            document.createElement('a');

        cover.className =
            'ct-cover';

        cover.href =
            data.url;

        cover.target =
            '_blank';

        cover.rel =
            'noopener noreferrer';

        const img =
            document.createElement('img');

        img.src =
            data.cover;

        img.loading =
            'lazy';

        img.alt =
            data.title;

        cover.appendChild(img);

        if (data.duration) {
            const duration =
                document.createElement('span');

            duration.className =
                'ct-duration';

            duration.textContent =
                data.duration;

            cover.appendChild(duration);
        }

        const title =
            document.createElement('a');

        title.className =
            'ct-title';

        title.href =
            data.url;

        title.target =
            '_blank';

        title.rel =
            'noopener noreferrer';

        title.textContent =
            data.title;

        const meta =
            document.createElement('div');

        meta.className =
            'ct-meta';

        if (data.author) {
            const author =
                document.createElement('span');

            author.className =
                'ct-author';

            author.textContent =
                data.author;

            meta.appendChild(author);
        }

        if (
            data.author &&
            data.time
        ) {
            const dot =
                document.createElement('span');

            dot.className =
                'ct-dot';

            dot.textContent =
                '·';

            meta.appendChild(dot);
        }

        if (data.time) {
            const time =
                document.createElement('span');

            time.className =
                'ct-time';

            time.textContent =
                data.time;

            meta.appendChild(time);
        }

        card.append(
            cover,
            title,
            meta
        );

        return card;
    }

    function processItem(item) {
        if (item.dataset[PROCESSED]) {
            return;
        }

        const videoLink =
            findVideoLink(item);

        if (!videoLink) {
            item.classList.add(
                'ct-hide-item'
            );

            item.dataset[PROCESSED] =
                '1';

            return;
        }

        const img =
            findCover(item);

        if (!img) {
            return;
        }

        const coverUrl =
            normalizeUrl(
                img.currentSrc ||
                img.src ||
                img.dataset.src ||
                img.dataset.lazySrc
            );

        if (!coverUrl) {
            return;
        }

        const data = {
            url:
                videoLink.href,

            cover:
                coverUrl,

            title:
                findTitle(
                    item,
                    videoLink
                ),

            author:
                findAuthor(item),

            time:
                findTime(item),

            duration:
                findDuration(item)
        };

        item.appendChild(
            createCard(data)
        );

        item.classList.add(
            'ct-video-item'
        );

        item.dataset[PROCESSED] =
            '1';
    }

    function fixLayout() {
        const list =
            document.querySelector(
                '.bili-dyn-list__items'
            );

        if (!list) {
            return;
        }

        let node =
            list.parentElement;

        let level = 0;

        while (
            node &&
            node !== document.body &&
            level < 7
        ) {
            node.classList.add(
                'ct-grid-expand'
            );

            const parent =
                node.parentElement;

            if (parent) {
                const siblings = [
                    ...parent.children
                ];

                for (const sibling of siblings) {
                    if (sibling === node) {
                        continue;
                    }

                    const rect =
                        sibling.getBoundingClientRect();

                    if (
                        rect.width >= 180 &&
                        rect.width <= 380 &&
                        rect.height > 200
                    ) {
                        sibling.classList.add(
                            'ct-grid-sidebar'
                        );
                    }
                }
            }

            node =
                parent;

            level++;
        }

        let main =
            list;

        for (
            let i = 0;
            i < 5 && main.parentElement;
            i++
        ) {
            main =
                main.parentElement;
        }

        if (
            main &&
            main !== document.body
        ) {
            main.classList.add(
                'ct-grid-main'
            );
        }
    }

    function scan() {
        fixLayout();

        document
            .querySelectorAll(
                '.bili-dyn-list__item'
            )
            .forEach(processItem);
    }

    scan();

    let timer;

    const observer =
        new MutationObserver(() => {
            clearTimeout(timer);

            timer =
                setTimeout(
                    scan,
                    120
                );
        });

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

    window.addEventListener(
        'resize',
        () => {
            clearTimeout(timer);

            timer =
                setTimeout(
                    scan,
                    100
                );
        }
    );
})();