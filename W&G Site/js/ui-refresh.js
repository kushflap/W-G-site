/* Kousha's Table — UI refresh enhancements (additive; does not touch app state).
 * 1. Navigation: wraps labels so they can collapse responsively, adds tooltips,
 *    a hamburger/drawer for small screens, Escape / scrim / link-click to close.
 * 2. Home: a read-only "table status" strip (counts) above the page cards.
 * Both observe the DOM, so they keep working when app.js re-renders the nav/home.
 */
(function () {
  'use strict';
  var STATE_KEY = 'wrath-glory-campaign-v4';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- Navigation ---------- */
  function enhanceNav() {
    var nav = document.getElementById('main-navigation');
    if (!nav) return;

    nav.querySelectorAll('.nav-button').forEach(function (btn) {
      if (btn.dataset.uiEnhanced) return;
      var label = '';
      Array.prototype.slice.call(btn.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          label = n.textContent.trim();
          var span = document.createElement('span');
          span.className = 'nav-label';
          span.textContent = label;
          btn.replaceChild(span, n);
        }
      });
      if (label) { btn.setAttribute('title', label); btn.setAttribute('aria-label', label); }
      btn.dataset.uiEnhanced = '1';
    });

    if (!nav.querySelector('.nav-toggle')) {
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'nav-toggle';
      t.setAttribute('aria-label', 'Open menu');
      t.setAttribute('aria-expanded', 'false');
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'ic'); svg.setAttribute('aria-hidden', 'true');
      var use = document.createElementNS(NS, 'use');
      use.setAttribute('href', '#i-menu');
      svg.appendChild(use); t.appendChild(svg);
      nav.insertBefore(t, nav.firstChild);
    }
    syncActiveAria(nav);
  }

  function syncActiveAria(nav) {
    nav.querySelectorAll('.nav-button').forEach(function (b) {
      if (b.classList.contains('active')) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  function setNavOpen(open) {
    var nav = document.getElementById('main-navigation');
    document.body.classList.toggle('nav-open', open);
    if (nav) {
      var t = nav.querySelector('.nav-toggle');
      if (t) { t.setAttribute('aria-expanded', open ? 'true' : 'false'); t.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
      if (open) {
        var left = nav.querySelector('.nav-left');
        document.documentElement.style.setProperty('--nav-left-h', (left ? left.offsetHeight : 0) + 'px');
      }
    }
    var scrim = document.getElementById('nav-scrim');
    if (open && !scrim) {
      scrim = document.createElement('div'); scrim.id = 'nav-scrim';
      scrim.addEventListener('click', function () { setNavOpen(false); });
      document.body.appendChild(scrim);
    }
  }

  document.addEventListener('click', function (e) {
    var tgl = e.target.closest && e.target.closest('#main-navigation .nav-toggle');
    if (tgl) { setNavOpen(!document.body.classList.contains('nav-open')); return; }
    if (document.body.classList.contains('nav-open') && e.target.closest && e.target.closest('#main-navigation .nav-button')) {
      // let app.js navigate first, then close
      setTimeout(function () { setNavOpen(false); }, 0);
    }
  }, true); // capture: app.js re-renders the nav on click, which detaches the target before bubbling reaches us
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) setNavOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 899 && document.body.classList.contains('nav-open')) setNavOpen(false);
  });

  /* ---------- Home status strip ---------- */
  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; } catch (e) { return {}; }
  }
  function tile(value, label, page, live) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'home-stat' + (live ? ' is-live' : '');
    b.dataset.statPage = page;
    var v = document.createElement('b'); v.textContent = value;
    var l = document.createElement('span'); l.textContent = label;
    b.appendChild(v); b.appendChild(l);
    b.addEventListener('click', function () {
      var target = document.querySelector('#main-navigation [data-page="' + page + '"]');
      if (target) target.click();
    });
    return b;
  }
  function enhanceHome() {
    var hero = document.querySelector('#home-section .home-hero');
    if (!hero || document.querySelector('#home-section .home-status')) return;
    var s = readState();
    var combat = s.combat || {};
    var count = function (a) { return Array.isArray(a) ? a.length : 0; };
    var strip = document.createElement('div');
    strip.className = 'home-status';
    strip.setAttribute('role', 'group');
    strip.setAttribute('aria-label', 'Table status');
    var encValue = combat.active ? 'Round ' + (combat.round || 1) : 'Idle';
    var encLabel = (combat.name || 'Encounter') + ' · ' + count(combat.combatants) + ' combatant' + (count(combat.combatants) === 1 ? '' : 's');
    strip.appendChild(tile(encValue, encLabel, 'combat', !!combat.active));
    strip.appendChild(tile(String(count(s.characters)), 'Characters', 'characters', false));
    strip.appendChild(tile(String(count(s.maps)), 'Maps', 'map-library', false));
    strip.appendChild(tile(String(count(s.tokenLibrary)), 'Tokens', 'token-library', false));
    hero.parentNode.insertBefore(strip, hero.nextSibling);
  }

  /* ---------- Game Room header: collapsible button labels ---------- */
  function enhanceMapHeader() {
    document.querySelectorAll('#map-section > .section-header .toolbar button').forEach(function (btn) {
      if (btn.dataset.uiEnhanced) return;
      var label = '';
      Array.prototype.slice.call(btn.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          label = n.textContent.trim();
          var span = document.createElement('span');
          span.className = 'btn-label';
          span.textContent = label;
          btn.replaceChild(span, n);
        }
      });
      if (label) { btn.setAttribute('title', label); btn.setAttribute('aria-label', label); }
      btn.dataset.uiEnhanced = '1';
    });
  }

  /* ---------- Observers ---------- */
  var navMo = null, homeMo = null;
  function watch() {
    var nav = document.getElementById('main-navigation');
    var home = document.getElementById('home-section');
    if (nav && !navMo) {
      navMo = new MutationObserver(function () { enhanceNav(); });
      navMo.observe(nav, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'], attributeOldValue: false });
      // active-state class changes happen on child buttons
      new MutationObserver(function () { syncActiveAria(nav); }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    if (home && !homeMo) {
      homeMo = new MutationObserver(function () { enhanceHome(); });
      homeMo.observe(home, { childList: true });
    }
    var map = document.getElementById('map-section');
    if (map && !map.dataset.uiWatched) {
      map.dataset.uiWatched = '1';
      new MutationObserver(function () { enhanceMapHeader(); }).observe(map, { childList: true });
    }
    enhanceNav(); enhanceHome(); enhanceMapHeader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  // app.js may render after this script runs; re-attempt shortly
  setTimeout(watch, 250); setTimeout(watch, 1000);
})();
