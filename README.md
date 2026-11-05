# carry-share

Static page for the carry Telegram notifier's "Details" button. Opened as a
Telegram Mini App via a direct link (`https://t.me/<bot>/<app>?startapp=…`); the
position's summary is packed into `startapp` (base64url of raw-deflated
compact JSON, see `notify/share-link.mjs` in carry-web). The notifier writes
format version 2; the page still reads version 1 for links already sent.
Close cards link to the closed position; opening cards link to an open
position snapshot (version 2 with `st: 'o'`).
Nothing is fetched or stored: the page only decodes and renders what the link
carries. Open `index.html?d=<payload>` (or `#d=`) to view outside Telegram.

The page is a compact report: symbol, position number and ID, Net and Net
return on notional, venues and directions, planned capital and leverage,
holding time, actual funding, entry and exit spread against the recorded
signal (or the exit's planned close prices), timestamps in Pacific time and
the close reason. Entry and scale rollbacks get the panic art and a short note
whatever the sign of Net; values the record does not hold show a dash.

The open snapshot uses the same layout with the light harbour art and an
OPEN status: expected net (excluding funding) and expected return on margin
or notional, forecast holding time and funding, the entry spread against the
signal, and the exit target frozen at open with the exit marked as still open.
These forecasts are frozen at entry and leave out later scale-ins.

`assets/` holds the artwork (recompressed from carry-web `share-cards/assets`)
and Latin subsets of Manrope and Kaushan Script with their licenses.

Tests: `node --test test/` (renders real links with the page's own decoder;
the last tests also run the notifier's encoders when `../carry-web` exists).

Rollout: publish this page before deploying a notifier that writes version 2.
The new page opens links from the old notifier, but the old page cannot read
version 2 links.

Publish this page before deploying a notifier that sends open links from the
opening card. The old page does not know `st: 'o'` and would render an open
snapshot as a closed position.
