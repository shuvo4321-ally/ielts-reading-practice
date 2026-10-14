(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ================================================================ saved state (this browser only) */
var KEY = 'ielts-reading-lab-v1';
function fresh() { return { a: {}, open: {}, hl: {}, uh: {}, test: { submitted: false }, timer: { start: null } }; }
var S = fresh();
try { var raw = localStorage.getItem(KEY); if (raw) { var got = JSON.parse(raw); for (var k in S) if (got[k]) S[k] = got[k]; } } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ================================================================ marking */
function variants(s) {
  return s.toLowerCase().replace(/[‘’]/g, "'").replace(/[‐-—-]/g, ' ').replace(/[.,;:!?"]/g, ' ')
    .replace(/\s+/g, ' ').trim()
    .replace(/(\w{3,}[^aeiou\s])re(s?)\b/g, '$1er$2')      // kilometres = kilometers
    .replace(/(\w{2,})our\b/g, '$1or')                     // colour = color
    .replace(/(\w{3,})is(e|ed|es|ing|ation)\b/g, '$1iz$2'); // organise = organize
}
function lev(a, b) {
  var m = a.length, n = b.length, d = [], i, j;
  for (i = 0; i <= m; i++) d[i] = [i];
  for (j = 1; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function letters(v) {
  var t = String(v || '').toUpperCase().split(/[^A-Z]+/).filter(function (x) { return x && x !== 'AND'; });
  if (t.length === 1 && t[0].length === 2) t = t[0].split('');
  return t;
}
function info(qa) { return { id: qa.dataset.q, kind: qa.dataset.kind, acc: JSON.parse(qa.dataset.acc), pick: qa.dataset.pick }; }
function shown(v) { return Array.isArray(v) ? v.join(' and ') : String(v || ''); }
/* status: ok | bad | mid | blank */
function mark(qa) {
  var q = info(qa), v = S.a[q.id];
  if (v == null || (Array.isArray(v) ? !v.length : !String(v).trim())) return { st: 'blank' };
  if (q.kind === 'tf') return { st: v === q.acc[0] ? 'ok' : 'bad' };
  if (q.kind === 'letter') {
    var roman = /^[ivx]+$/.test(q.acc[0]);
    var x = String(v).trim().replace(/[^A-Za-z]/g, '');
    return { st: (roman ? x.toLowerCase() === q.acc[0] : x.toUpperCase() === q.acc[0]) ? 'ok' : 'bad' };
  }
  if (q.kind === 'two') {
    var mine = Array.isArray(v) ? v : letters(v), hit = mine.filter(function (l) { return q.acc.indexOf(l) >= 0; }).length;
    if (mine.length > 2) return { st: 'bad', note: 'More than two letters scores zero.' };
    return { st: hit === 2 ? 'ok' : hit === 1 ? 'mid' : 'bad', note: hit === 1 ? 'One of the two is right: one mark of two.' : '' };
  }
  var mv = variants(String(v));
  for (var i = 0; i < q.acc.length; i++) if (variants(q.acc[i]) === mv) return { st: 'ok' };
  var close = q.acc.some(function (a) { var av = variants(a); return av.length >= 5 && lev(av, mv) <= 2; });
  return { st: 'bad', note: close ? 'Very close, but a misspelled answer scores zero. Copy the word exactly from the passage.' : '' };
}
var LABEL = { ok: '✓ correct', bad: '✗ wrong', mid: '½ one of two', blank: 'not answered' };
function badge(qa) {
  var r = mark(qa), res = $('.res', qa), yours = $('.yours', qa), v = S.a[qa.dataset.q];
  var cls = r.st === 'ok' ? 'r-ok' : r.st === 'mid' ? 'r-mid' : 'r-bad';
  res.className = 'res ' + cls; res.textContent = LABEL[r.st];
  yours.hidden = false; yours.className = 'yours ' + cls;
  yours.innerHTML = r.st === 'blank' ? 'You did not answer. In the exam, always write something: a blank always scores zero.' :
    'Your answer: <b>' + esc(shown(v)) + '</b>. ' + (r.st === 'ok' ? 'Correct.' : r.st === 'mid' ? '' : 'Not correct.') + (r.note ? ' ' + r.note : '');
}
function unbadge(qa) { var res = $('.res', qa); res.className = 'res'; res.textContent = ''; $('.yours', qa).hidden = true; }

/* ================================================================ controls */
var QAS = $$('.qa[data-q]');
function isExam(qa) { return qa.dataset.q.charAt(0) === 'T'; }
function paint(qa) {
  var v = S.a[qa.dataset.q];
  $$('.ch', qa).forEach(function (b) { b.classList.toggle('on', Array.isArray(v) ? v.indexOf(b.dataset.v) >= 0 : v === b.dataset.v); });
  var inp = $('.ain', qa); if (inp) inp.value = v == null ? '' : v;
}
function refresh(qa) { if ($('details.afold', qa).open || (isExam(qa) && S.test.submitted)) badge(qa); }
QAS.forEach(function (qa) {
  paint(qa);
  var det = $('details.afold', qa);
  if (S.open[qa.dataset.q]) det.open = true;
  refresh(qa);
});
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.qa .ch'); if (!b || b.disabled) return;
  var qa = b.closest('.qa'), id = qa.dataset.q, hint = $('[data-hint]', qa);
  if (qa.dataset.pick === '2') {
    var cur = (S.a[id] || []).slice(), i = cur.indexOf(b.dataset.v);
    if (i >= 0) cur.splice(i, 1);
    else if (cur.length >= 2) { hint.textContent = 'Choose TWO only. Untick one first: three letters score zero.'; hint.className = 'hint bad'; return; }
    else cur.push(b.dataset.v);
    hint.textContent = ''; S.a[id] = cur.sort();
  } else {
    S.a[id] = S.a[id] === b.dataset.v ? '' : b.dataset.v;
  }
  save(); paint(qa); refresh(qa); updateToc();
});
document.addEventListener('input', function (e) {
  var t = e.target; if (!t.classList || !t.classList.contains('ain')) return;
  var qa = t.closest('.qa'); S.a[qa.dataset.q] = t.value; save(); refresh(qa); updateToc();
});
document.addEventListener('toggle', function (e) {
  var d = e.target; if (!d.classList || !d.classList.contains('afold')) return;
  var qa = d.closest('.qa'), id = qa.dataset.q;
  if (d.open) { S.open[id] = true; badge(qa); }
  else { delete S.open[id]; if (!(isExam(qa) && S.test.submitted)) unbadge(qa); }
  save(); updateToc();
}, true);

/* ================================================================ highlights */
var PSGS = $$('.psg');
PSGS.forEach(function (p, i) {
  var btn = $('[data-hl]', p); if (!btn) return;
  function set(on) { p.classList.toggle('hl-off', !on); btn.textContent = on ? 'Hide highlights' : 'Show highlights'; btn.setAttribute('aria-pressed', String(on)); }
  set(!!S.hl[i]);
  btn.addEventListener('click', function () { S.hl[i] = p.classList.contains('hl-off'); if (!S.hl[i]) delete S.hl[i]; save(); set(!!S.hl[i]); });
  p._setHl = function (on) { if (on) S.hl[i] = true; else delete S.hl[i]; set(on); };
});

/* ================================================================ your own highlighter
   Select words in a passage, pick a colour. Marks are stored as character offsets in the passage text
   (the controls row is skipped), so they come back exactly after a reload. */
if (!S.uh) S.uh = {};
var COLORS = [['y', 'Yellow'], ['g', 'Green'], ['p', 'Pink'], ['b', 'Blue']];
var BAR = document.createElement('div');
BAR.className = 'hlbar'; BAR.hidden = true; BAR.setAttribute('role', 'toolbar'); BAR.setAttribute('aria-label', 'Highlight');
document.body.appendChild(BAR);
function textNodes(psg) {
  var out = [], w = document.createTreeWalker(psg, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
    return n.parentNode.closest('.hlrow, button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
  while (w.nextNode()) out.push(w.currentNode);
  return out;
}
function offsetOf(psg, node, off) {
  var pre = document.createRange(), pos = 0;
  pre.setStart(psg, 0); pre.setEnd(node, off);
  textNodes(psg).forEach(function (n) { if (n === node) pos += off; else if (pre.intersectsNode(n)) pos += n.length; });
  return pos;
}
function unpaint(psg) {
  $$('mark.uh', psg).forEach(function (m) { var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
}
function paintUser(psg) {
  unpaint(psg);
  var items = S.uh[psg.dataset.pi] || [];
  items.forEach(function (it) {
    var pos = 0;
    textNodes(psg).forEach(function (n) {
      var a = pos, b = pos + n.length; pos = b;
      if (b <= it.s || a >= it.e || !n.nodeValue.trim() || n.parentNode === psg) return;
      var from = Math.max(it.s - a, 0), to = Math.min(it.e - a, n.length);
      if (to <= from) return;
      var mid = n; if (from > 0) mid = n.splitText(from);
      if (to - from < mid.length) mid.splitText(to - from);
      var m = document.createElement('mark'); m.className = 'uh uh-' + it.c; m.dataset.u = it.id; m.title = 'Your highlight: tap to remove';
      mid.parentNode.insertBefore(m, mid); m.appendChild(mid);
    });
  });
  var c = $('.uclear', psg); if (c) { c.hidden = !items.length; var cc = $('.uconfirm', psg); if (cc) cc.remove(); }
}
var PSGS_U = $$('.psg');
PSGS_U.forEach(function (p, i) { p.dataset.pi = i; paintUser(p); });
var pending = null, removing = null;
function placeBar(rect) {
  BAR.hidden = false;
  var w = BAR.offsetWidth, x = Math.min(Math.max(rect.left + rect.width / 2 - w / 2 + window.scrollX, window.scrollX + 8), window.scrollX + document.documentElement.clientWidth - w - 8);
  BAR.style.left = x + 'px'; BAR.style.top = (rect.bottom + window.scrollY + 10) + 'px';
}
function hideBar() { BAR.hidden = true; pending = null; removing = null; }
function showColours(range, psg) {
  pending = { range: range.cloneRange(), psg: psg }; removing = null;
  BAR.innerHTML = COLORS.map(function (c) { return '<button type="button" class="sw uh-' + c[0] + '" data-c="' + c[0] + '" aria-label="' + c[1] + '" title="' + c[1] + '"></button>'; }).join('');
  placeBar(range.getBoundingClientRect());
}
var selTimer = null;
document.addEventListener('selectionchange', function () {
  clearTimeout(selTimer);
  selTimer = setTimeout(function () {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { if (pending) hideBar(); return; }
    var r = sel.getRangeAt(0), anc = r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentNode : r.commonAncestorContainer;
    var psg = anc.closest && anc.closest('.psg');
    if (!psg || anc.closest('.hlrow') || !r.toString().trim()) { if (pending) hideBar(); return; }
    showColours(r, psg);
  }, 180);
});
BAR.addEventListener('pointerdown', function (e) { e.preventDefault(); });   // keep the selection while tapping a colour
BAR.addEventListener('mousedown', function (e) { e.preventDefault(); });
BAR.addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  if (b.dataset.c && pending) {
    var psg = pending.psg, r = pending.range;
    var s = offsetOf(psg, r.startContainer, r.startOffset), en = offsetOf(psg, r.endContainer, r.endOffset);
    var full = textNodes(psg).map(function (n) { return n.nodeValue; }).join('');
    while (s < en && /\s/.test(full.charAt(s))) s++;
    while (en > s && /\s/.test(full.charAt(en - 1))) en--;
    if (s >= 0 && en > s) {
      var k = psg.dataset.pi; (S.uh[k] = S.uh[k] || []).push({ s: s, e: en, c: b.dataset.c, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5) });
      save(); paintUser(psg);
    }
    window.getSelection().removeAllRanges(); hideBar();
  } else if (b.dataset.rm && removing) {
    var p2 = removing.psg, k2 = p2.dataset.pi;
    S.uh[k2] = (S.uh[k2] || []).filter(function (it) { return it.id !== removing.id; });
    if (!S.uh[k2].length) delete S.uh[k2];
    save(); paintUser(p2); hideBar();
  }
});
document.addEventListener('click', function (e) {
  var m = e.target.closest && e.target.closest('mark.uh');
  if (m && window.getSelection().isCollapsed) {
    removing = { psg: m.closest('.psg'), id: m.dataset.u }; pending = null;
    BAR.innerHTML = '<button type="button" class="ghost sm" data-rm="1">Remove highlight</button>';
    placeBar(m.getBoundingClientRect()); return;
  }
  if (!BAR.hidden && !e.target.closest('.hlbar') && window.getSelection().isCollapsed) hideBar();
  var cb = e.target.closest && e.target.closest('[data-uclear]');
  if (cb) {
    var box = cb.closest('.uclear');
    if ($('.uconfirm', box)) return;
    var span = document.createElement('span'); span.className = 'uconfirm';
    span.innerHTML = ' Clear all your highlights in this passage? <button type="button" class="danger sm" data-uyes>Clear</button> <button type="button" class="ghost sm" data-uno>Keep</button>';
    box.appendChild(span);
  }
  var y = e.target.closest && e.target.closest('[data-uyes]');
  if (y) { var ps = y.closest('.psg'); delete S.uh[ps.dataset.pi]; save(); paintUser(ps); }
  var no = e.target.closest && e.target.closest('[data-uno]');
  if (no) no.closest('.uconfirm').remove();
});
function clearUser(psg) { delete S.uh[psg.dataset.pi]; paintUser(psg); }

/* ================================================================ per-pattern buttons */
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-showall], [data-clear]'); if (!b) return;
  var sec = document.getElementById(b.dataset.showall || b.dataset.clear);
  if (b.dataset.showall) {
    $$('details', sec).forEach(function (d) { d.open = true; });
    $$('.psg', sec).forEach(function (p) { if (p._setHl) p._setHl(true); });
  } else {
    $$('.qa[data-q]', sec).forEach(function (qa) { delete S.a[qa.dataset.q]; delete S.open[qa.dataset.q]; paint(qa); $('details.afold', qa).open = false; unbadge(qa); var h = $('[data-hint]', qa); h.textContent = ''; });
    $$('details.fold', sec).forEach(function (d) { d.open = false; });
    $$('.psg', sec).forEach(function (p) { if (p._setHl) p._setHl(false); });
  }
  save(); updateToc();
});

/* ================================================================ contents status */
var EXAM = QAS.filter(isExam), RANGES = [[1, 13], [14, 26], [27, 40]];
function num(qa) { return +qa.dataset.q.slice(1); }
function score() {
  var got = 0, per = [0, 0, 0];
  EXAM.forEach(function (qa) { if (mark(qa).st === 'ok') { got++; per[num(qa) <= 13 ? 0 : num(qa) <= 26 ? 1 : 2]++; } });
  return { got: got, per: per };
}
function band(n) {
  var t = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4]];
  for (var i = 0; i < t.length; i++) if (n >= t[i][0]) return t[i][1].toFixed(1);
  return 'below 4';
}
function updateToc() {
  RANGES.forEach(function (r, i) {
    var el = document.getElementById('toc-psg-' + (i + 1)); if (!el) return;
    var n = EXAM.filter(function (qa) { var x = num(qa); return x >= r[0] && x <= r[1] && mark(qa).st !== 'blank'; }).length;
    el.textContent = n ? n + '/' + (r[1] - r[0] + 1) + ' answered' : '';
  });
  var ts = document.getElementById('toc-score');
  if (ts) { if (S.test.submitted) { var s = score(); ts.textContent = s.got + '/40 · band ' + band(s.got); } else ts.textContent = ''; }
  $$('.sheetpage[id^="pat-"]').forEach(function (sec) {
    var el = document.getElementById('toc-' + sec.id); if (!el) return;
    var qs = $$('.qa[data-q]', sec), opened = qs.filter(function (qa) { return S.open[qa.dataset.q]; }).length;
    el.textContent = qs.length && opened === qs.length ? '✓ done' : '';
  });
}

/* ================================================================ full test: marking */
var AREA = $('#markarea');
function lockExam(on) { EXAM.forEach(function (qa) { $$('.ch, .ain', qa).forEach(function (x) { x.disabled = on; }); }); }
function renderMarking() {
  if (!S.test.submitted) {
    AREA.innerHTML = '<div class="actions"><button type="button" class="primary" id="markit">Mark the test</button></div><div id="markconfirm"></div>';
    $('#markit').addEventListener('click', function () {
      var blank = EXAM.filter(function (qa) { return mark(qa).st === 'blank'; }).length;
      $('#markconfirm').innerHTML = '<div class="confirm">' + (blank ? '<b>' + blank + ' answer' + (blank > 1 ? 's are' : ' is') + ' blank.</b> In the exam you would guess: a blank always scores zero. ' : 'All 40 answered. ') +
        '<button type="button" class="primary sm" id="mark-yes">Mark the test</button> <button type="button" class="ghost sm" id="mark-no">Keep going</button></div>';
      $('#mark-yes').addEventListener('click', function () {
        if (S.timer.start) { S.test.time = Math.min(3600, Math.round((Date.now() - S.timer.start) / 1000)); S.timer.start = null; showTimer(); }
        S.test.submitted = true; save(); lockExam(true); EXAM.forEach(badge); examHl(true); renderMarking(); updateToc();
        document.getElementById('result-head').scrollIntoView();
      });
      $('#mark-no').addEventListener('click', function () { $('#markconfirm').innerHTML = ''; });
    });
    return;
  }
  var s = score();
  var wrong = EXAM.filter(function (qa) { return mark(qa).st !== 'ok'; });
  AREA.innerHTML = '<div class="result" id="result"><div class="rscore"><div class="big">' + s.got + '<span>/40</span></div><div>Band <b>' + band(s.got) +
    '</b> <span class="small">Academic Reading, indicative</span>' + (S.test.time ? '<br><span class="small">Time taken: ' + clock(S.test.time) + '</span>' : '') + '</div></div>' +
    RANGES.map(function (r, i) { var m = r[1] - r[0] + 1; return '<div class="rp"><span>Passage ' + (i + 1) + '</span><div class="rbar"><i style="width:' + Math.round(s.per[i] / m * 100) + '%"></i></div><span>' + s.per[i] + '/' + m + '</span></div>'; }).join('') +
    (wrong.length ? '<p style="margin:0">Review these: ' + wrong.map(function (qa) { return '<a href="#q-' + qa.dataset.q + '">' + num(qa) + '</a>'; }).join(', ') +
      '. Each answer fold names the pattern in Part 3 that takes that question type apart.</p>' : '<p style="margin:0"><b>Full marks.</b></p>') +
    '<div class="actions" style="margin:0"><button type="button" class="ghost sm" id="retake">Take the test again</button><span id="retake-confirm"></span></div></div>';
  $('#retake').addEventListener('click', function () {
    $('#retake-confirm').innerHTML = ' Clear all 40 answers and your highlights in the three passages? <button type="button" class="danger sm" id="retake-yes">Clear and restart</button> <button type="button" class="ghost sm" id="retake-no">Keep them</button>';
    $('#retake-yes').addEventListener('click', function () {
      EXAM.forEach(function (qa) { delete S.a[qa.dataset.q]; delete S.open[qa.dataset.q]; paint(qa); $('details.afold', qa).open = false; unbadge(qa); });
      S.test = { submitted: false }; examHl(false); [1, 2, 3].forEach(function (i) { clearUser(document.getElementById('passage-' + i)); }); save(); lockExam(false); renderMarking(); updateToc();
      document.getElementById('passage-1').scrollIntoView();
    });
    $('#retake-no').addEventListener('click', function () { $('#retake-confirm').innerHTML = ''; });
  });
}

function examHl(on) { [1, 2, 3].forEach(function (i) { var p = document.getElementById('passage-' + i); if (p && p._setHl) p._setHl(on); }); }

/* ================================================================ optional 60-minute timer */
var TIMER = $('#timer'), TT = $('#timer-t'), TSTART = $('#timer-start'), tick = null;
function clock(sec) { sec = Math.max(0, sec); return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); }
function showTimer() {
  clearInterval(tick);
  var running = !!S.timer.start;
  TIMER.hidden = !running;
  if (TSTART) { TSTART.disabled = running; TSTART.textContent = running ? 'Timer running (bottom left)' : 'Start the 60-minute timer'; }
  if (!running) return;
  function draw() {
    var left = 3600 - Math.floor((Date.now() - S.timer.start) / 1000);
    TT.textContent = left > 0 ? clock(left) : 'Time is up';
    TIMER.classList.toggle('low', left <= 300);
  }
  draw(); tick = setInterval(draw, 1000);
}
if (TSTART) TSTART.addEventListener('click', function () { S.timer.start = Date.now(); save(); showTimer(); document.getElementById('passage-1').scrollIntoView(); });
$('#timer-stop').addEventListener('click', function () { S.timer.start = null; save(); showTimer(); });

/* ================================================================ boot */
if (S.test.submitted) { lockExam(true); EXAM.forEach(badge); }
renderMarking(); showTimer(); updateToc();
var totop = $('#totop');
function tt() { totop.hidden = window.scrollY < 900; }
window.addEventListener('scroll', tt, { passive: true }); tt();
})();
