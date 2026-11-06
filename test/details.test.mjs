// Renders real Details links with the page's own decoder and renderer
// (the CarryDetails module inside index.html). Run: node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';

const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = /const CarryDetails = \(\(\) => \{[\s\S]*?\n\}\)\(\);/.exec(page)[0];
const CarryDetails = new Function(source + '\nreturn CarryDetails;')();
const encode = data => zlib.deflateRawSync(Buffer.from(JSON.stringify(data)), { level: 9 }).toString('base64url');
const open = async encoded => CarryDetails.render(CarryDetails.normalize(await CarryDetails.decode(encoded)));
const words = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const attr = (html, name) => new RegExp(name + '="([^"]*)"').exec(html)?.[1];

// Version 1 links captured from the notifier before version 2 (exact strings).
const LEGACY = {
  "profit": "XU_LTsMwEPyXPW-DH3Hi-Fg4cms5RVXlOC5YchMUuxUI8e-sQ7hw8c7sjmd2v-AOhiOEEQz4D-929pbnHddMKSEAIVF_f3x8eDk8HU15qHelXgx3X8aZsItz8iOxCYysRI2wgGEVY02tCZN8usWIMFzAiEoLhEuZ1wRmSm872Yq2aYm6jUrVdZIo-cBgU0jnbJdXn8-Lt-5tzbqOf7bOvoNRjFFA8VcIkY6i789getiHyU6u7MoZ7cQ3oABZJZBh8TghHFbt5xDyJtByA03zT5oori_nabpgrbxdK1fdb9VFRbf0p-8f",
  "loss": "XU9BbsMgEPzLnrELOBjMMe2xt6QnK4ocTFIkjKPaiVpV_XsHx730ws4Mszu733QnKxiFniz5T--K7jaPhTBcKSmJ0QR9u39-etu97G1-oA3QYrj7_D0DuzhOvgdLZItNaWpGH0C85LzREgQN6RYjo9OZrCwNtPNiEEAjFtBNpaWus9mttFJNU4FiEr2PsQ_pcpzD4I8-dtdH3ND_zXXdlaziHAk5QDGKuAvtr2Rb2obUJZfXFRxLiRUoYryUjLM848Bot3i_TmFeDaZaQV3_s06Ia_N9ZgM1V6GXKlTzqCa7cEt7-PkF",
  "rollback": "VU9BbsIwEPzLnJ107eDG8ZH2yA16ihByHCNFmAQlARVV_XvXlBy4rGZnRzOzP7jBSoGuhUX4Dj5z13nIpCGtlYLAxPx69_H2tf3c2TSYOzMXu1tI55mxj8MUWt562IxyaQRG2P4aI4PzgpojrMqNEjgu1MDZZVWUqnwvmffPtdBVVfDKJri4ce5cPIR-Hu-HcYixcf6USrSLi3cXWE3EESlBC0R-ig02sDXWXe96n7pKopzkE2gIypUgkTz2AtuH9t50Mx7U_3iRTBxTswWZlXrREEmT7ty_3v_-AQ",
  "escaping": "XU9BTsMwEPxKtSeQVsFO4sSx2h44c-MYVZXjuMWSk1S2qUCIv7MO4cJpZ7SzMztfcAfFEdwICvZuuu5iMIeP3TLbEJZw0N6G9MAfj4AQsySa4G7pOOhx_7RhWk208u5usyoRNn6JdiQ2g6qKskYIoFjBWFNLwiSf371HGC6gykKWCJe8rwks9E_bVW3ZNi1Rs9FKdF1FlHxg0NHFc9LhatM5WG3e1qxp_LM1-gZKMEYB2V8geKpJ5y-genh2s55N_pUz-olvQACyokSG2eOE8LpqPweXNoGsNtA0_6SR4vpcT1KDdfJ2nVx0v1NmFXXpT98_"
};

// A version 2 summary as notify/share-link.mjs writes it.
const v2 = extra => ({ v: 2, id: 'exec-auto-1805522', s: 'BTC/USDT:USDT', m: 'live', cr: 'basis_target_reached',
  n: 3.24, r: 0.00648, f: 0.42, cap: 500, lv: 3, o: 1793727672, e: 1793727674, c: 1793735993,
  L: 'Binance', S: 'Bybit', g: [0.00842, 0.00816, 0.0018, 0.00164], x: 'p', ...extra });

test('legacy v1 profit link still opens, without a fabricated exit signal', async () => {
  const html = await open(LEGACY.profit), text = words(html);
  assert.equal(attr(html, 'data-event'), 'profit');
  assert.match(text, /BTC \/ USDT/); assert.match(html, /#1\u2009805\u2009522/); assert.match(text, /exec-auto-1805522/);
  assert.match(text, /\+3\.2400 USDT/); assert.match(text, /\+0\.648% on notional/);
  assert.match(text, /Signal 0\.842% Actual 0\.817% .*0\.025 pp worse vs signal/);
  assert.match(text, /Exit Signal \u2014 Actual 0\.159% .*No recorded signal Unavailable/);
  assert.ok(!text.includes('0.180%'), 'the frozen target never stands in for an exit signal');
  assert.match(text, /Holding time 2h 18m 41s/); assert.match(text, /Funding · actual \+0\.4200 USDT/);
  assert.match(text, /Capital · planned 500\.00 USDT/); assert.match(text, /Leverage 3×/);
  assert.match(text, /Spread target reached/); assert.match(text, /Net includes recorded funding/);
  for (const removed of ['Model', 'Fees', 'Base', 'Status', 'Scale-ins', 'Target', 'Net before funding', 'Return on margin']) assert.ok(!text.includes(removed), removed);
});

test('legacy v1 loss and rollback keep their states', async () => {
  const loss = await open(LEGACY.loss), lossText = words(loss);
  assert.equal(attr(loss, 'data-event'), 'loss'); assert.equal(attr(loss, 'data-result'), 'negative');
  assert.match(loss, /cd-amount cd-negative">\u22124\.8600/); assert.match(loss, /cd-negative">\u22120\.972%/);
  assert.match(lossText, /Holding time elapsed/);

  const rollback = await open(LEGACY.rollback), text = words(rollback);
  assert.equal(attr(rollback, 'data-event'), 'rollback');
  assert.match(text, /ROLLBACK · LIVE/); assert.match(text, /Entry rolled back The entry did not form a hedged pair\./);
  assert.match(text, /Net return \u2014 No paired position/);
  assert.match(text, /LONG Binance Filled · closed back/); assert.match(text, /Bybit SHORT No fill price recorded/);
  assert.ok(!/Not filled/.test(text), 'a v1 link cannot prove the leg did not fill');
  assert.match(text, /No paired entry/); assert.match(text, /No paired exit/);
  assert.match(text, /Leverage · planned 3×/); assert.match(text, /Time to unwind \u2014/);
  assert.match(text, /Entry attempt/); assert.ok(!text.includes('Holding time'));
  assert.match(text, /Funding not fully recorded/);
});

test('legacy v1 hostile text is escaped', async () => {
  const html = await open(LEGACY.escaping);
  assert.ok(!html.includes('<img') && !html.includes('<script'));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('v2 ordinary gain and loss: colours follow sign; spread quality is separate from profit', async () => {
  const gain = await open(encode(v2())), text = words(gain);
  assert.equal(attr(gain, 'data-event'), 'profit');
  assert.match(gain, /cd-positive">\+0\.6480%/);
  // Entry fill below the signal: worse, even on a profitable close.
  assert.match(text, /Entry Signal 0\.842% Actual 0\.816% .*0\.026 pp worse vs signal/);
  assert.match(text, /Exit Plan 0\.180% Actual 0\.164% .*0\.016 pp better vs plan/);
  assert.match(text, /Signal or plan → actual fill/);
  assert.match(text, /Opened \d\d:\d\d:\d\d \d\d \w{3} 20\d\d · P[SD]T/);

  const loss = await open(encode(v2({ n: -4.86, r: -0.00972, f: -0.12, cr: 'max_holding_elapsed', g: [0.00842, 0.0087, 0.0142, 0.01466], x: 's' })));
  const lossText = words(loss);
  assert.equal(attr(loss, 'data-event'), 'loss');
  assert.match(loss, /cd-negative">\u22120\.9720%/); assert.match(loss, /cd-negative">\u22120\.1200/);
  assert.match(lossText, /0\.028 pp better vs signal/, 'a favourable entry on a losing trade stays green');
  assert.match(lossText, /Exit Signal 1\.420% Actual 1\.466% .*0\.046 pp worse vs signal/);
  assert.match(lossText, /Maximum holding time reached/);
});

test('v2 entry rollback: panic art by reason even with a profit, real leg states, no paired values', async () => {
  const data = v2({ cr: 'partial_entry_rollback', n: 0.012, r: null, f: 0, e: null, u: 1793727673, c: 1793727687, g: [0.00842, null, null, null], q: [7, 1] });
  delete data.x;
  const html = await open(encode(data)), text = words(html);
  assert.equal(attr(html, 'data-event'), 'rollback'); assert.equal(attr(html, 'data-result'), 'positive');
  assert.match(text, /\+0\.0120 USDT/); assert.match(text, /Net return \u2014 No paired position/);
  assert.match(text, /LONG Binance Filled · closed back/); assert.match(text, /Bybit SHORT Not filled/);
  assert.match(text, /Time to unwind 14s/); assert.match(text, /Funding · actual 0\.0000 USDT/);
  assert.match(text, /Entry Signal 0\.842% Actual \u2014 .*No paired entry/);
  assert.ok(!text.includes('Recorded Net'), 'the callout does not repeat the Net');
  const partial = words(await open(encode({ ...data, q: [6, 2], u: undefined })));
  assert.match(partial, /Partly filled · closed back/); assert.match(partial, /Bybit SHORT Partly filled/);
  assert.match(partial, /Time to unwind \u2014/);
});

test('v2 scale rollback: a real position closed by the rollback', async () => {
  const html = await open(encode(v2({ cr: 'scale_rollback_failed', n: -2.18, r: -0.00436, k: 1, ns: 2 })));
  const text = words(html);
  assert.equal(attr(html, 'data-event'), 'rollback');
  assert.match(text, /SCALE ROLLBACK · LIVE/); assert.match(text, /Scale-in rolled back A scale-in could not be hedged/);
  assert.match(text, /Holding time 2h 18m 39s/); assert.match(text, /Actual · first lot/); assert.match(html, /cd-negative">\u22120\.4360%/);
  assert.match(text, /Leverage 3×/); assert.ok(!text.includes('No paired'));
});

test('v2 unknowns are dashes, never zero or a substitute', async () => {
  const data = v2({ n: null, r: null, f: null, cap: null, lv: null, e: null, g: [null, 0.008, null, 0.0016], xp: 3, cr: null });
  delete data.x;
  const html = await open(encode(data)), text = words(html);
  // Unknown Net: no profit art, no check mark, neutral status.
  assert.equal(attr(html, 'data-event'), 'unknown'); assert.equal(attr(html, 'data-result'), 'unknown');
  assert.ok(!html.includes("<path d=\"M20 6 9 17l-5-5\"/>"), 'no check mark');
  assert.match(text, /Net result \u2014 USDT/); assert.match(text, /Net return \u2014 Not recorded/);
  assert.match(text, /Capital · planned \u2014/); assert.match(text, /Leverage \u2014/); assert.match(text, /Funding · actual \u2014/);
  // A paired close without an entry time is not called unpaired.
  assert.match(text, /Holding time \u2014/); assert.match(text, /Entry started/); assert.ok(!text.includes('No paired'));
  assert.match(text, /Exit Signal \u2014 Actual 0\.160% .*No recorded signal/);
  assert.match(text, /Close reason \u2014/); assert.match(text, /Funding not fully recorded/);
  assert.ok(!/0\.0000/.test(text));

  const rollbackNull = await open(encode(v2({ cr: 'partial_entry_rollback', n: null, e: null, q: [3, 0] })));
  assert.equal(attr(rollbackNull, 'data-event'), 'rollback', 'rollback art follows the reason with an unknown Net');
  assert.match(words(rollbackNull), /LONG Binance Filled Bybit SHORT Entry/);
});

test('long figures step down instead of overflowing', async () => {
  const html = await open(encode(v2({ n: -123456.789, r: -1.234567 })));
  assert.match(html, /cd-amount cd-negative cd-wide cd-wider">\u2212123456\.7890/);
  assert.match(html, /cd-negative cd-wide">\u2212123\.4567%/);
  assert.match(await open(encode(v2({ n: -1234.5 }))), /cd-amount cd-negative cd-wide">\u22121234\.5000/);
});

test('malformed or unsupported data is refused or reduced to unknown', async () => {
  await assert.rejects(open(encode({ v: 3 })), /Unsupported link version/);
  await assert.rejects(open('not-a-link'));
  const text = words(await open(encode(v2({ n: '5', cap: 'x', lv: 2.5, o: -1, g: 'bad', q: 'bad', L: { a: 1 } }))));
  assert.match(text, /Net result \u2014/); assert.match(text, /Capital · planned \u2014/); assert.match(text, /Leverage \u2014/);
});

// An open snapshot as notify/share-link.mjs writes it for the opening card.
const openV2 = extra => ({ v: 2, st: 'o', id: 'exec-auto-1805522', s: 'BTC/USDT:USDT', m: 'live', cap: 500, lv: 3,
  o: 1793727672, e: 1793727674, L: 'Binance', S: 'Bybit', n: 2.85, r: 0.0057, f: 0.31, h: 1.5,
  g: [0.00842, 0.00816, 0.0018, null], x: 't', ...extra });

test('open snapshot: forecasts, frozen target, still open', async () => {
  const html = await open(encode(openV2())), text = words(html);
  assert.equal(attr(html, 'data-event'), 'open'); assert.equal(attr(html, 'data-result'), 'positive');
  assert.match(text, /OPEN · LIVE/); assert.match(text, /BTC \/ USDT/); assert.match(html, /#1\u2009805\u2009522/);
  assert.match(text, /Expected net \+2\.8500 USDT Forecast · excl\. funding/);
  assert.match(text, /Expected return \+0\.5700% on notional/); assert.match(html, /cd-positive">\+0\.5700%/);
  assert.match(text, /Capital · planned 500\.00 USDT/); assert.match(text, /Leverage 3×/);
  assert.match(text, /Holding · forecast 1h 30m/); assert.match(text, /Funding · forecast \+0\.3100 USDT/);
  assert.match(text, /Signal or target → actual fill/);
  assert.match(text, /Entry Signal 0\.842% Actual 0\.816% .*0\.026 pp worse vs signal/);
  assert.match(text, /Exit Target 0\.180% Actual \u2014 .*Position still open Pending/);
  const exit = /<section class="cd-fill" aria-label="Exit[\s\S]*?<\/section>/.exec(html)[0];
  assert.ok(!/better|worse|cd-positive|cd-negative|vs /.test(words(exit) + exit), 'the open exit is neutral');
  assert.match(text, /Opened \d\d:\d\d:\d\d \d\d \w{3} 20\d\d · P[SD]T/); assert.match(text, /Closed Still open/);
  assert.match(text, /Status Open at notification/);
  assert.match(text, /Forecast frozen at entry · excludes later scale-ins/); assert.match(text, /Snapshot at opening · P[SD]T/);
  for (const absent of ['Close reason', 'rolled back', 'Net result', 'Net return', 'Funding · actual', 'Holding time', 'Plan', 'Exit Signal', 'Net includes'])
    assert.ok(!text.includes(absent), absent);
});

test('open snapshot: forecast tones, return basis, short holding', async () => {
  const loss = await open(encode(openV2({ n: -1.2, r: -0.0024, f: -0.05, rb: 'm', h: 0.25 }))), text = words(loss);
  assert.equal(attr(loss, 'data-event'), 'open'); assert.equal(attr(loss, 'data-result'), 'negative');
  assert.match(loss, /cd-amount cd-negative">\u22121\.2000/); assert.match(loss, /cd-negative">\u22120\.2400%/);
  assert.match(loss, /cd-negative">\u22120\.0500/);
  assert.match(text, /\u22120\.2400% on margin/); assert.ok(!text.includes('on notional'));
  assert.match(text, /Holding · forecast 15m/);
  assert.match(words(await open(encode(openV2({ h: 1 })))), /Holding · forecast 1h /);
  assert.match(words(await open(encode(openV2({ h: 26.5 })))), /Holding · forecast 1d 2h 30m/);
});

test('open snapshot: unknowns are dashes, never zero', async () => {
  const html = await open(encode(openV2({ n: null, r: null, f: null, h: null, cap: null, lv: null, e: null, g: [null, null, null, null], x: undefined })));
  const text = words(html);
  assert.equal(attr(html, 'data-event'), 'open'); assert.equal(attr(html, 'data-result'), 'unknown');
  assert.match(text, /Expected net \u2014 USDT Not forecast/); assert.match(text, /Expected return \u2014 Not forecast/);
  assert.match(text, /Capital · planned \u2014/); assert.match(text, /Leverage \u2014/);
  assert.match(text, /Holding · forecast \u2014/); assert.match(text, /Funding · forecast \u2014/);
  assert.match(text, /Entry Signal \u2014 Actual \u2014 .*Not recorded/); assert.match(text, /Exit Target \u2014 Actual \u2014 .*Position still open/);
  assert.match(text, /Entry started \d\d:\d\d/, 'falls back to the entry start when the hedged entry time is missing');
  assert.ok(!/0\.0000|0\.000%/.test(text));
  // Without x:'t' the third gap is not a target and is not shown.
  const noTarget = words(await open(encode(openV2({ x: undefined }))));
  assert.match(noTarget, /Exit Target \u2014/); assert.ok(!noTarget.includes('0.180%'));
  // Malformed values become unknown; a stray close reason never surfaces.
  const bad = words(await open(encode(openV2({ n: '5', h: -2, f: 'x', r: Infinity, rb: 'x', cr: 'partial_entry_rollback', k: 1 }))));
  assert.match(bad, /Expected net \u2014/); assert.match(bad, /Holding · forecast \u2014/); assert.match(bad, /Funding · forecast \u2014/);
  assert.match(bad, /Actual · first lot/); assert.ok(!/rolled back|Entry hedge not completed/.test(bad));
  const huge = words(await open(encode(openV2({ h: 1e308 }))));
  assert.match(huge, /Holding · forecast —/); assert.ok(!huge.includes('Infinity'));
  // Any other st value reads as a closed link.
  assert.equal(attr(await open(encode(v2({ st: 'z' }))), 'data-event'), 'profit');
});

// End to end with the notifier's encoder when the sibling carry-web checkout is present.
const notifier = new URL('../../carry-web/notify/share-link.mjs', import.meta.url);
test('notifier payloads render', { skip: !fs.existsSync(notifier) && 'carry-web checkout not found' }, async () => {
  const { shareLink } = await import(notifier);
  const p = { id: 'exec-auto-77', symbol: 'ETH/USDT:USDT', execution_mode: 'live', close_reason: 'partial_entry_rollback',
    opened_at: '2026-11-03T17:41:12Z', closed_at: '2026-11-03T17:41:30Z', net_profit: '-0.31', net_return: '-0.0006', funding_earned: '0', capital_basis: '500', base_quantity: '1', margin: { leverage: 5 },
    long: { exchange: 'OKX' }, short: { exchange: 'BingX' }, entry_calculation: { long_mid_price: '3000', short_mid_price: '3010' },
    execution: { entered_at: null, entry_sequence: { first_filled_at: '2026-11-03T17:41:13Z' },
      long: { filled_base: '1', remaining_base: '0', funding_complete: true, orders: [] }, short: { filled_base: '0', remaining_base: '0', funding_complete: true, orders: [] } } };
  const link = shareLink(p, { bot: 'b', app: 'share', kind: 'miniApp' });
  const text = words(await open(link.url.split('startapp=')[1]));
  assert.match(text, /LONG OKX Filled · closed back/); assert.match(text, /BingX SHORT Not filled/);
  assert.match(text, /\u22120\.3100 USDT/); assert.match(text, /Time to unwind 17s/); assert.match(text, /Signal 0\.333%/);
});

// The open encoder round trip, once the notifier exports openSharePayload.
const openEncoder = fs.existsSync(notifier) ? await import(notifier) : {};
test('notifier open payloads render', { skip: typeof openEncoder.openSharePayload !== 'function' && 'notifier has no openSharePayload yet' }, async () => {
  const p = { id: 'exec-auto-78', symbol: 'ETH/USDT:USDT', execution_mode: 'live', capital_basis: '500', margin: { leverage: 5 },
    opened_at: '2026-11-03T17:41:12Z', long: { exchange: 'OKX' }, short: { exchange: 'BingX' },
    execution: { entered_at: '2026-11-03T17:41:14Z' } };
  const data = openEncoder.openSharePayload(p);
  assert.equal(data.st, 'o');
  const text = words(await open(encode(data)));
  assert.match(text, /OPEN · LIVE/); assert.match(text, /LONG OKX/); assert.match(text, /BingX SHORT/);
  assert.match(text, /Closed Still open/); assert.ok(!text.includes('Close reason'));
  if (typeof openEncoder.shareLink === 'function') {
    const link = openEncoder.shareLink(p, { bot: 'b', app: 'share', kind: 'miniApp', open: true });
    assert.match(words(await open(link.url.split('startapp=')[1])), /OPEN · LIVE/);
  }
});

test('capital shows the actual entry notional when the link carries it, planned otherwise', async () => {
  const closedText = words(await open(encode(v2({ cap: undefined, ca: 502.1 }))));
  assert.match(closedText, /Capital · actual 502\.10 USDT/); assert.ok(!closedText.includes('Capital · planned'));
  const openText = words(await open(encode(openV2({ cap: undefined, ca: 119.19 }))));
  assert.match(openText, /Capital · actual 119\.19 USDT/);
  assert.match(words(await open(encode(openV2({ ca: 'x' })))), /Capital · planned 500\.00 USDT/, 'a malformed actual falls back to the planned figure');
});

test('a refreshed open link shows the current gap as the exit Actual, and the actual exit once closed', async () => {
  const live = words(await open(encode(openV2({ cg: [0.0018, 0.0031], ct: 1793735993 }))));
  assert.match(live, /Exit Target 0\.180% Actual 0\.310% .*0\.130 pp to target as of \d\d:\d\d/);
  assert.ok(!/worse vs target|better vs target/.test(live), 'an open gap is a distance, not a result');
  assert.match(live, /Closed Still open/); assert.match(live, /Status Open /); assert.match(live, /Updated \d\d:\d\d · P[SD]T/);
  assert.match(words(await open(encode(openV2({ cg: [0.0018, 0.0015], ct: 1793735993 })))), /Target reached as of/);
  const closed = words(await open(encode(openV2({ cg: [0.0018, 0.0016], ct: 1793735993, cs: 'c' }))));
  assert.match(closed, /Exit Target 0\.180% Actual 0\.160% .*0\.020 pp better vs target/);
  assert.match(closed, /Closed \d\d:\d\d:\d\d/); assert.match(closed, /Status Closed/); assert.match(closed, /Updated at close/);
  // Without a time the gap is not trusted; older links keep the dash.
  assert.match(words(await open(encode(openV2({ cg: [0.0018, 0.0031] })))), /Actual \u2014 .*Position still open/);
});

test('the target is reached on unrounded values, never by rounding', async () => {
  const near = words(await open(encode(openV2({ cg: [0.0018, 0.001801], ct: 1793735993 }))));
  assert.ok(!near.includes('Target reached')); assert.match(near, /0\.000 pp to target/);
});

test('equal rounded gaps read as reached only with the notifier mark', async () => {
  assert.ok(!words(await open(encode(openV2({ cg: [0.0018, 0.0018], ct: 1793735993 })))).includes('Target reached'));
  assert.match(words(await open(encode(openV2({ cg: [0.0018, 0.0018], ct: 1793735993, cx: 1 })))), /Target reached/);
});
