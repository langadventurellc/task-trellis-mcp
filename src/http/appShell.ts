import { escapeHtml } from "./escapeHtml";

const SVG_SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-chev" viewBox="0 0 10 10"><path d="M3 1.5 L7 5 L3 8.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-plus" viewBox="0 0 14 14"><path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-edit" viewBox="0 0 14 14"><path d="M9 2.5l2.5 2.5L5 11.5H2.5V9L9 2.5z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></symbol>
<symbol id="i-trash" viewBox="0 0 14 14"><path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M4 4l.5 7.5a1 1 0 001 .9h3a1 1 0 001-.9L10 4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-search" viewBox="0 0 14 14"><circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
<symbol id="i-alert" viewBox="0 0 18 18"><path d="M9 2L2 15h14L9 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7v4M9 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-sun" viewBox="0 0 14 14"><circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M7 1.5v1.5M7 11v1.5M1.5 7H3M11 7h1.5M3.1 3.1l1 1M9.9 9.9l1 1M3.1 10.9l1-1M9.9 4.1l1-1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></symbol>
<symbol id="i-moon" viewBox="0 0 14 14"><path d="M11 8.5A4.5 4.5 0 015.5 3a4.5 4.5 0 104.8 5.8c-.4-.2 0-.2-.3-.3z" fill="currentColor"/></symbol>
<symbol id="i-filter-on" viewBox="0 0 14 14"><path d="M2 3h10l-3.8 4.4V11.5l-2.4-.9V7.4L2 3z" fill="currentColor"/></symbol>
<symbol id="i-filter-off" viewBox="0 0 14 14"><path d="M2 3h10l-3.8 4.4V11.5l-2.4-.9V7.4L2 3z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></symbol>
</defs></svg>`;

const INLINE_SCRIPT = `(function(){
  var saved;
  try { saved = localStorage.getItem('tt-theme') || 'dark'; } catch(e) { saved = 'dark'; }
  document.documentElement.setAttribute('data-theme', saved);
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('tt-theme', t); } catch(e) {}
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var light = btn.querySelector('.theme-icon-light');
    var dark = btn.querySelector('.theme-icon-dark');
    if (light) light.style.display = t === 'dark' ? 'none' : '';
    if (dark) dark.style.display = t === 'dark' ? '' : 'none';
  }
  function treeKey(){
    var nav = document.getElementById('issue-tree');
    var k = nav && nav.dataset.projectKey;
    return k ? 'tt-tree:' + k + ':open' : null;
  }
  function filterKey(){
    var nav = document.getElementById('issue-tree');
    var k = nav && nav.dataset.projectKey;
    return k ? 'tt-tree:' + k + ':hideDone' : null;
  }
  function loadHideDone(){
    try {
      var key = filterKey();
      if (!key) return true;
      var raw = localStorage.getItem(key);
      return raw === null ? true : raw === '1';
    } catch(e) { return true; }
  }
  function saveHideDone(val){
    try {
      var key = filterKey();
      if (!key) return;
      localStorage.setItem(key, val ? '1' : '0');
    } catch(e) {}
  }
  function applyFilter(hideDone){
    var btn = document.getElementById('filter-toggle');
    if (!btn) return;
    var on = btn.querySelector('.filter-icon-on');
    var off = btn.querySelector('.filter-icon-off');
    if (on) on.style.display = hideDone ? '' : 'none';
    if (off) off.style.display = hideDone ? 'none' : '';
  }
  function loadOpenSet(){
    try {
      var key = treeKey();
      if (!key) return null;
      var raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : null;
    } catch(e) { return null; }
  }
  function saveOpenSet(set){
    try {
      var key = treeKey();
      if (!key) return;
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch(e) {}
  }
  function indentOf(el){
    var v = el.style.getPropertyValue('--indent') || '0';
    return parseInt(v, 10) || 0;
  }
  function toggleSubtree(row){
    var opened = row.classList.toggle('open');
    var indent = indentOf(row);
    var el = row.nextElementSibling;
    while (el && el.classList && el.classList.contains('row')) {
      var ei = indentOf(el);
      if (ei <= indent) break;
      if (opened) {
        if (ei === indent + 20) el.hidden = false;
      } else {
        el.hidden = true;
        el.classList.remove('open');
      }
      el = el.nextElementSibling;
    }
    var id = row.dataset.id;
    if (id) {
      var set = loadOpenSet() || new Set();
      if (opened) { set.add(id); } else { set.delete(id); }
      saveOpenSet(set);
    }
  }
  function wire(root){
    root = root || document;
    root.querySelectorAll('.row').forEach(function(row){
      if (row.dataset.ttWired) return;
      row.dataset.ttWired = '1';
      row.addEventListener('click', function(e){
        if (e.target.closest('.chev:not(.hidden)')) return;
        document.querySelectorAll('.row.selected').forEach(function(r){ r.classList.remove('selected'); });
        row.classList.add('selected');
      });
      var chev = row.querySelector('.chev:not(.hidden)');
      if (chev) {
        chev.addEventListener('click', function(e){
          e.stopPropagation();
          toggleSubtree(row);
        });
      }
    });
    var tt = root.getElementById && root.getElementById('theme-toggle');
    if (tt && !tt.dataset.ttWired) {
      tt.dataset.ttWired = '1';
      tt.addEventListener('click', function(){
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
    var ft = root.getElementById && root.getElementById('filter-toggle');
    if (ft && !ft.dataset.ttWired) {
      ft.dataset.ttWired = '1';
      ft.addEventListener('click', function(){
        var next = !loadHideDone();
        saveHideDone(next);
        applyFilter(next);
        htmx.trigger(document.body, 'refreshTree');
      });
    }
  }
  function applyStoredOpenSet(){
    var set = loadOpenSet();
    if (!set) return;
    document.querySelectorAll('#issue-tree .row[data-id]').forEach(function(row){
      var id = row.dataset.id;
      var hasChev = !!row.querySelector('.chev:not(.hidden)');
      var isOpen = row.classList.contains('open');
      var shouldBeOpen = set.has(id) && hasChev;
      var indent = indentOf(row);
      if (shouldBeOpen && !isOpen) {
        row.classList.add('open');
        var el = row.nextElementSibling;
        while (el && el.classList && el.classList.contains('row')) {
          var ei = indentOf(el);
          if (ei <= indent) break;
          if (ei === indent + 20) el.hidden = false;
          el = el.nextElementSibling;
        }
      } else if (!shouldBeOpen && isOpen) {
        row.classList.remove('open');
        var el = row.nextElementSibling;
        while (el && el.classList && el.classList.contains('row')) {
          var ei = indentOf(el);
          if (ei <= indent) break;
          el.hidden = true;
          el.classList.remove('open');
          el = el.nextElementSibling;
        }
      }
    });
  }
  document.addEventListener('DOMContentLoaded', function(){
    applyTheme(saved);
    var hideDone = loadHideDone();
    applyFilter(hideDone);
    wire(document);
    applyStoredOpenSet();
    if (!hideDone) htmx.trigger(document.body, 'refreshTree');
  });
  document.addEventListener('htmx:afterSwap', function(evt){
    wire(document);
    if (evt.detail && evt.detail.target && evt.detail.target.id === 'issue-tree') {
      try {
        var key = treeKey();
        if (!key) return;
        var raw = localStorage.getItem(key);
        if (!raw) return;
        var stored = JSON.parse(raw);
        var presentIds = new Set();
        document.querySelectorAll('#issue-tree [data-id]').forEach(function(el){
          presentIds.add(el.dataset.id);
        });
        var pruned = stored.filter(function(id){ return presentIds.has(id); });
        localStorage.setItem(key, JSON.stringify(pruned));
      } catch(e) {}
    }
  });
  document.addEventListener('htmx:configRequest', function(evt){
    if (evt.detail && evt.detail.target && evt.detail.target.id === 'issue-tree') {
      try {
        var key = treeKey();
        if (key) {
          var raw = localStorage.getItem(key);
          if (raw !== null) {
            var ids = JSON.parse(raw);
            if (ids) evt.detail.parameters['open'] = ids.join(',');
          }
        }
      } catch(e) {}
      evt.detail.parameters['hideDone'] = loadHideDone() ? '1' : '0';
    }
  });
})();`;

/** Returns a full HTML document with designer stylesheet, SVG sprite, HTMX, and theme/tree scripts. */
export function appShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/_styles.css">
<script src="/_htmx.js"></script>
<script>${INLINE_SCRIPT}</script>
</head>
<body data-state="view">
${SVG_SPRITE}
${body}
</body>
</html>`;
}
