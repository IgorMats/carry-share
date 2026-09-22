# carry-share

Static page for the carry Telegram notifier's "Подробнее" button. Opened as a
Telegram Mini App via a direct link (`https://t.me/<bot>/<app>?startapp=…`); the
closed position's summary is packed into `startapp` (base64url of raw-deflated
compact JSON, format version 1, see `notify/share-link.mjs` in carry-web).
Nothing is fetched or stored: the page only decodes and renders what the link
carries. Open `index.html?d=<payload>` to view outside Telegram.
