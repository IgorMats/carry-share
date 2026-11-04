# carry-share

Static page for the carry Telegram notifier's "Details" button. Opened as a
Telegram Mini App via a direct link (`https://t.me/<bot>/<app>?startapp=…`); the
closed position's summary is packed into `startapp` (base64url of raw-deflated
compact JSON, see `notify/share-link.mjs` in carry-web). The notifier writes
format version 2; the page still reads version 1 for links already sent.
Nothing is fetched or stored: the page only decodes and renders what the link
carries. Open `index.html?d=<payload>` (or `#d=`) to view outside Telegram.

The page is a compact report: symbol, position number and ID, Net and Net
return on notional, venues and directions, planned capital and leverage,
holding time, actual funding, entry and exit spread against the recorded
signal (or the exit's planned close prices), timestamps in Pacific time and
the close reason. Entry and scale rollbacks get the panic art and a short note
whatever the sign of Net; values the record does not hold show a dash.

`assets/` holds the artwork (recompressed from carry-web `share-cards/assets`)
and Latin subsets of Manrope and Kaushan Script with their licenses.

Tests: `node --test test/` (renders real links with the page's own decoder;
the last test also runs the notifier's encoder when `../carry-web` exists).

Rollout: publish this page before deploying a notifier that writes version 2.
The new page opens links from the old notifier, but the old page cannot read
version 2 links.
