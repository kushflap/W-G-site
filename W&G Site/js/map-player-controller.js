/*
 * Kousha's Table - Player Map Controller
 * ---------------------------------------
 * Single-responsibility controller for the Player Map window.
 *
 * Design rules:
 *   1. Receiving a GM snapshot never rebuilds the Player Map DOM.
 *   2. The current visual scene stays in place while a new snapshot is staged.
 *   3. Fog/drawing use old/new canvas layers so transitions cannot teleport.
 *   4. Tokens are reconciled by stable token id and animated independently.
 *   5. Death + revive are one composite overlay, animated as one object.
 *   6. A token revealed by lifting fog begins its reveal 1 second after the fog
 *      transition starts, so it emerges while the shadow is still receding.
 *
 * This file intentionally does not own campaign state, persistence, or GM tools.
 * It consumes immutable snapshots supplied by app.js.
 */
(() => {
  'use strict';

  const TIMING = Object.freeze({
    receiveHold: 700,
    fog: 7000,
    fogRevealDelay: 1000,
    draw: 5000,
    move: 2200,
    multiTokenMove: 2200,
    exit: 5000,
    appear: 3000,
    hiddenReveal: 1200,
    deathDelay: 2500,
    death: 6500,
    shockDelay: 1800,
    shock: 3600
  });

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const SHOCK_LIGHTNING = '<svg class="wg-pm-lightning" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2.5 5.6 13h5.1l-.9 8.5L18.4 11h-5.2z" fill="currentColor"/></svg>';

  const DEAD_SKULL = '<svg class="wg-pm-skull" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C7.6 3 4.5 6 4.5 10c0 2.4 1.1 4.1 2.5 5.1V19h10v-3.9c1.4-1 2.5-2.7 2.5-5.1 0-4-3.1-7-7.5-7z" fill="currentColor"/><path d="M8.6 10.6h2.2l-.4 2.6H8.6zM13.2 10.6h2.2v2.6h-1.8z" fill="#090a0d"/><path d="M9 19v-2.4M12 19v-2.4M15 19v-2.4" stroke="#090a0d" stroke-width="1.6" stroke-linecap="square"/></svg>';

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clone = value => value == null ? null : structuredClone(value);
  // Visual snapshots never need the campaign's heavyweight history or image
  // buffers cloned again. Keep immutable primitives by reference and clone only
  // the collections that the controller actually reads.
  const copyVisualMap = map => {
    if (!map) return null;
    return {
      ...map,
      fogRects: (map.fogRects || []).map(r => ({ ...r })),
      draw: (map.draw || []).map(d => ({ ...d })),
      tokens: (map.tokens || []).map(t => ({ ...t }))
    };
  };
  const copyCombat = combat => ({
    ...(combat || {}),
    combatants: (combat?.combatants || []).map(c => ({ ...c }))
  });
  const rectsEqual = (a=[], b=[]) => {
    if (a.length !== b.length) return false;
    for (let i=0;i<a.length;i++) {
      const x=a[i], y=b[i];
      if (finite(x?.x)!==finite(y?.x) || finite(x?.y)!==finite(y?.y) ||
          finite(x?.w)!==finite(y?.w) || finite(x?.h)!==finite(y?.h) ||
          fogState(x)!==fogState(y)) return false;
    }
    return true;
  };
  const strokesEqual = (a=[], b=[]) => {
    if (a.length !== b.length) return false;
    for (let i=0;i<a.length;i++) {
      const x=a[i], y=b[i];
      if (finite(x?.x)!==finite(y?.x) || finite(x?.y)!==finite(y?.y) ||
          finite(x?.radius,2)!==finite(y?.radius,2) || (x?.color||'')!==(y?.color||'')) return false;
    }
    return true;
  };

  function rectContains(rect, x, y) {
    if (!rect) return false;
    const rx = finite(rect.x), ry = finite(rect.y), rw = Math.max(0, finite(rect.w)), rh = Math.max(0, finite(rect.h));
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
  }

  function fogState(rect) {
    if (rect && typeof rect.state === 'string') return rect.state;
    return rect && rect.show ? 'show' : 'dark';
  }

  function pointShown(map, x, y) {
    if (!map) return false;
    if (map.fogEnabled === false) return true;
    let shown = false;
    for (const rect of map.fogRects || []) {
      if (rectContains(rect, x, y)) shown = fogState(rect) === 'show';
    }
    return shown;
  }

  // Visibility is sampled from ONE invisible 1px anchor at the exact center
  // of the token. Artwork may overlap several fog/show regions without
  // changing the token's visibility state.
  const TOKEN_VISIBILITY_ANCHOR_CLASS = 'wg-player-token-visibility-anchor';

  function pointForToken(token) {
    const size = Math.max(1, finite(token?.size, 40));
    return {
      x: finite(token?.x) + size / 2,
      y: finite(token?.y) + size / 2
    };
  }

  function tokenVisible(map, token) {
    // Keep visibility in map coordinates rather than inspecting the artwork's
    // bounds. This remains stable during CSS transforms and animations.
    const p = pointForToken(token);
    return pointShown(map, p.x, p.y);
  }

  function drawVisibility(ctx, map, width, height) {
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    if (map?.fogEnabled !== false) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      for (const rect of map.fogRects || []) {
        const x = finite(rect.x), y = finite(rect.y), w = Math.max(0, finite(rect.w)), h = Math.max(0, finite(rect.h));
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.clearRect(x, y, w, h);
        if (fogState(rect) !== 'show') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#000';
          ctx.fillRect(x, y, w, h);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawStrokes(ctx, map, width, height) {
    if (!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    for (const stroke of map?.draw || []) {
      ctx.fillStyle = stroke.color || map?.drawColor || '#ebd291';
      ctx.beginPath();
      ctx.arc(finite(stroke.x), finite(stroke.y), Math.max(0.5, finite(stroke.radius, 2)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function ease(kind) {
    switch (kind) {
      case 'soft': return 'cubic-bezier(.16,.72,.18,1)';
      case 'reveal': return 'cubic-bezier(.12,.76,.18,1)';
      default: return 'cubic-bezier(.18,.75,.22,1)';
    }
  }

  class PlayerMapController {
    constructor() {
      this.mounted = false;
      this.mapId = null;
      this.currentMap = null;
      this.currentCombat = { combatants: [] };
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this.elements = {};
      this.tokenElements = new Map();
      this.pendingCleanup = new Set();
      this.activeTransactionPromises = new Set();
      this.transitionActive = false;
      this.pendingSnapshot = null;
      this.snapshotQueue = [];
      this.queueTimer = null;
      this.queueSettleMs = 350;
      this.revision = '';
      this.imageReadyToken = 0;
      this.panGesture = null;
    }

    mount(map, combat, options = {}) {
      if (!map) return;
      const sameMap = this.mounted && this.mapId === map.id && document.getElementById('player-map-stage');
      if (sameMap) {
        // Mount is a DOM/viewport operation, not a second state application.
        // Re-applying the snapshot here used to race the animated applySnapshot()
        // call from renderPlayerMap(), which could rewind tokens mid-transition.
        this.zoom = Math.max(.25, Math.min(3, finite(options.zoom, this.zoom)));
        this.panX = finite(options.panX, this.panX);
        this.panY = finite(options.panY, this.panY);
        this.applyZoom();
        return;
      }

      this.cancelAnimations();
      this.mounted = true;
      this.mapId = map.id;
      this.currentMap = copyVisualMap(map);
      this.currentCombat = copyCombat(combat);
      this.zoom = Math.max(.25, Math.min(3, finite(options.zoom, 1)));
      this.panX = finite(options.panX);
      this.panY = finite(options.panY);
      this.revision = String(options.revision || '');
      this.buildDOM(map);
      this.bindViewportControls();
      this.loadImageAndRender(map, { initial: true });
    }

    buildDOM(map) {
      document.body.className = 'wg-player-window app-ready';
      document.body.innerHTML = `
        <main id="player-map-window" class="wg-player-shell">
          <div class="player-map-toolbar wg-glass-toolbar">
            <div class="wg-player-toolbar-title"><span class="wg-player-eyebrow">PLAYER SURFACE</span><strong>${esc(map.name)}</strong></div>
            <div class="wg-player-toolbar-controls">
              <button id="player-pan" class="active">Pan</button>
              <button id="player-zoom-out" aria-label="Zoom out">−</button>
              <span id="player-zoom-label">100%</span>
              <button id="player-zoom-in" aria-label="Zoom in">+</button>
              <button id="player-zoom-reset">100%</button>
            </div>
          </div>
          <div class="player-map-stage-wrap">
            <div id="player-map-stage" class="player-map-stage">
              <img class="player-map-image" alt="" draggable="false">
              <canvas id="player-map-draw"></canvas>
              <canvas id="player-map-draw-transition"></canvas>
              <canvas id="player-map-fog"></canvas>
              <canvas id="player-map-fog-transition"></canvas>
              <div id="player-map-tokens"></div>
              <div id="player-map-update-badge" aria-live="polite">RECEIVING MAP CHANGES…</div>
            </div>
          </div>
          <div class="player-map-label"><span>${esc(map.name)}</span><small>PLAYER VIEW</small></div>
        </main>`;

      this.elements = {
        root: document.getElementById('player-map-window'),
        toolbar: document.querySelector('.player-map-toolbar'),
        wrap: document.querySelector('.player-map-stage-wrap'),
        stage: document.getElementById('player-map-stage'),
        image: document.querySelector('.player-map-image'),
        draw: document.getElementById('player-map-draw'),
        drawTransition: document.getElementById('player-map-draw-transition'),
        fog: document.getElementById('player-map-fog'),
        fogTransition: document.getElementById('player-map-fog-transition'),
        tokens: document.getElementById('player-map-tokens'),
        badge: document.getElementById('player-map-update-badge'),
        zoomLabel: document.getElementById('player-zoom-label')
      };
    }

    bindViewportControls() {
      const { stage, wrap } = this.elements;
      if (!stage || !wrap) return;

      const setZoom = next => {
        this.zoom = Math.max(.25, Math.min(3, Number(next) || 1));
        window.__WG_PLAYER_ZOOM__ = this.zoom;
        this.applyZoom();
      };

      document.getElementById('player-zoom-in')?.addEventListener('click', () => setZoom(this.zoom * 1.15));
      document.getElementById('player-zoom-out')?.addEventListener('click', () => setZoom(this.zoom / 1.15));
      document.getElementById('player-zoom-reset')?.addEventListener('click', () => {
        this.panX = 0; this.panY = 0; setZoom(1); this.center();
      });
      document.getElementById('player-pan')?.addEventListener('click', event => {
        event.currentTarget.classList.add('active');
      });

      stage.addEventListener('pointerdown', event => {
        this.panGesture = { x: event.clientX, y: event.clientY, panX: this.panX, panY: this.panY, id: event.pointerId };
        try { stage.setPointerCapture(event.pointerId); } catch (_) {}
        wrap.classList.add('is-panning');
        event.preventDefault();
      });

      stage.addEventListener('pointermove', event => {
        if (!this.panGesture) return;
        this.panX = this.panGesture.panX + (event.clientX - this.panGesture.x);
        this.panY = this.panGesture.panY + (event.clientY - this.panGesture.y);
        window.__WG_PLAYER_PAN_X__ = this.panX;
        window.__WG_PLAYER_PAN_Y__ = this.panY;
        this.applyZoom();
      });

      const endPan = event => {
        if (!this.panGesture) return;
        this.panGesture = null;
        wrap.classList.remove('is-panning');
        try { stage.releasePointerCapture(event?.pointerId); } catch (_) {}
      };
      stage.addEventListener('pointerup', endPan);
      stage.addEventListener('pointercancel', endPan);

      wrap.addEventListener('wheel', event => {
        if (!event.ctrlKey) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = wrap.getBoundingClientRect();
        const cx = event.clientX - rect.left;
        const cy = event.clientY - rect.top;
        const oldZoom = this.zoom;
        const next = Math.max(.25, Math.min(3, oldZoom * (event.deltaY < 0 ? 1.1 : .9)));
        const factor = next / oldZoom;
        this.panX = cx - (cx - this.panX) * factor;
        this.panY = cy - (cy - this.panY) * factor;
        setZoom(next);
      }, { passive: false });
    }

    loadImageAndRender(map, options = {}) {
      const image = this.elements.image;
      if (!image) return;
      const generation = ++this.imageReadyToken;
      const isInitial = options.initial === true;
      const finishImageTransaction = () => {
        // A background-image change used to return from commitStableSnapshot()
        // before finishTransaction() was called. That left transitionActive=true,
        // permanently blocking the snapshot queue. The next Refresh Player Map
        // therefore appeared to do absolutely nothing.
        if (!isInitial) {
          this.transitionActive = false;
          this.activeTransactionPromises.clear();
          this.hideReceivingBadge();
          if (this.snapshotQueue.length) requestAnimationFrame(() => this.drainSnapshotQueue());
        }
      };
      const render = () => {
        if (generation !== this.imageReadyToken || !image.naturalWidth || !image.naturalHeight) return;
        this.prepareCanvases(image.naturalWidth, image.naturalHeight);
        this.renderBaseScene(map);
        this.applyZoom();
        this.renderTokens(map, this.currentCombat, null, null, { animated: false, initial: true });
        this.center();
        finishImageTransaction();
      };
      image.onload = render;
      image.onerror = () => {
        if (generation !== this.imageReadyToken) return;
        this.elements.stage?.classList.add('wg-player-image-error');
        finishImageTransaction();
      };
      image.src = map.image || '';
      if (image.complete) requestAnimationFrame(render);
    }

    prepareCanvases(width, height) {
      const { stage, image, fog, fogTransition, draw, drawTransition } = this.elements;
      if (!stage) return;
      stage.dataset.baseW = String(width);
      stage.dataset.baseH = String(height);
      stage.style.width = `${width}px`;
      stage.style.height = `${height}px`;
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      for (const canvas of [fog, fogTransition, draw, drawTransition]) {
        if (!canvas) continue;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    }

    renderBaseScene(map) {
      const { fog, draw } = this.elements;
      const width = finite(this.elements.stage?.dataset.baseW);
      const height = finite(this.elements.stage?.dataset.baseH);
      drawVisibility(fog?.getContext('2d'), map, width, height);
      drawStrokes(draw?.getContext('2d'), map, width, height);
      this.elements.fogTransition.style.opacity = '0';
      this.elements.drawTransition.style.opacity = '0';
    }

    applyZoom() {
      const { stage, tokens, zoomLabel } = this.elements;
      if (!stage) return;
      const width = finite(stage.dataset.baseW);
      const height = finite(stage.dataset.baseH);
      stage.style.width = `${width * this.zoom}px`;
      stage.style.height = `${height * this.zoom}px`;
      stage.style.transform = `translate(${this.panX}px, ${this.panY}px)`;
      stage.style.transformOrigin = '0 0';
      tokens.style.transform = `scale(${this.zoom})`;
      tokens.style.transformOrigin = '0 0';
      if (zoomLabel) zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    center() {
      const wrap = this.elements.wrap;
      const stage = this.elements.stage;
      if (!wrap || !stage) return;
      requestAnimationFrame(() => {
        const width = stage.offsetWidth;
        const height = stage.offsetHeight;
        wrap.scrollLeft = Math.max(0, (width - wrap.clientWidth) / 2);
        wrap.scrollTop = Math.max(0, (height - wrap.clientHeight) / 2);
      });
    }

    showReceivingBadge() {
      const { badge, stage } = this.elements;
      if (!badge || !stage) return;
      stage.classList.add('wg-player-receiving');
      badge.classList.add('is-visible');
    }

    hideReceivingBadge() {
      const { badge, stage } = this.elements;
      if (!badge || !stage) return;
      badge.classList.remove('is-visible');
      stage.classList.remove('wg-player-receiving');
    }

    applySnapshot(map, combat, options = {}) {
      if (!map) return;

      // Player Map updates are treated as immutable state transactions.  We do
      // not try to interrupt the visual scene whenever the GM performs another
      // action.  Instead we cache the complete snapshots in order, wait briefly
      // for a burst of GM actions to settle, then execute the queue sequentially.
      const normalizedCombat = copyCombat(combat);
      normalizedCombat.combatants = (normalizedCombat.combatants || []).map(c => ({
        ...c,
        dead: !!c.dead,
        shocked: !!c.shocked && !c.dead
      }));

      const incoming = {
        map: copyVisualMap(map),
        combat: normalizedCombat,
        options: { ...options, previousMap: null, previousCombat: null }
      };

      // Initial load is not an action queue operation. It creates the first
      // stable visual scene immediately.
      if (!this.currentMap || !this.mounted || this.mapId !== map.id) {
        this.snapshotQueue.length = 0;
        this.pendingSnapshot = null;
        this.cancelQueueTimer();
        this.commitStableSnapshot(incoming.map, incoming.combat, { ...incoming.options, animated: false });
        return;
      }

      this.showReceivingBadge();
      this.enqueueSnapshot(incoming);
    }

    enqueueSnapshot(snapshot) {
      // Never compare whole snapshots with JSON.stringify(). A map can contain
      // a large embedded image, and doing that comparison for every action was
      // itself enough to lock the main thread after a few updates.
      //
      // The Player Map is a visualizer, not a replay log. Once a cinematic
      // transaction is already running, retaining every intermediate full-map
      // snapshot causes a backlog of expensive deep clones and long animations.
      // Keep only the newest requested state. When the active transaction ends,
      // the player view will transition from its current stable scene directly
      // to this newest state. This also makes rapid move -> kill -> revive (or
      // image -> fog -> move) sequences converge on the actual GM truth instead
      // of getting stuck replaying stale states.
      if (this.snapshotQueue.length) {
        this.snapshotQueue[this.snapshotQueue.length - 1] = snapshot;
      } else {
        this.snapshotQueue.push(snapshot);
      }

      // Hard invariant: there is never more than one pending full snapshot.
      if (this.snapshotQueue.length > 1) {
        this.snapshotQueue.splice(0, this.snapshotQueue.length - 1);
      }

      this.scheduleQueueDrain();
    }

    scheduleQueueDrain() {
      this.cancelQueueTimer();
      this.queueTimer = window.setTimeout(() => {
        this.queueTimer = null;
        this.drainSnapshotQueue();
      }, this.queueSettleMs);
    }

    cancelQueueTimer() {
      if (this.queueTimer != null) {
        clearTimeout(this.queueTimer);
        this.queueTimer = null;
      }
    }

    drainSnapshotQueue() {
      if (this.transitionActive || !this.snapshotQueue.length) return;
      const next = this.snapshotQueue.shift();
      if (!next) return;

      const previousMap = copyVisualMap(this.currentMap);
      const previousCombat = copyCombat(this.currentCombat);
      const animated = !!previousMap && this.mapId === next.map.id;

      this.commitStableSnapshot(next.map, next.combat, {
        ...next.options,
        animated,
        previousMap,
        previousCombat
      });
    }

    commitStableSnapshot(map, combat, options = {}) {
      const animated = options.animated !== false && !!this.currentMap && this.mapId === map.id;
      const previousMap = options.previousMap || this.currentMap;
      const previousCombat = options.previousCombat || this.currentCombat || { combatants: [] };
      const oldMap = copyVisualMap(previousMap);
      const oldCombat = copyCombat(previousCombat);

      this.hideReceivingBadge();
      this.mapId = map.id;
      this.currentMap = copyVisualMap(map);
      this.currentCombat = copyCombat(combat);
      this.revision = String(options.revision || this.revision || '');
      this.updateToolbarTitle(map);

      const currentImageSrc = this.elements.image?.getAttribute('src') || '';
      const normalizeImageSrc = value => {
        if (!value) return '';
        try { return new URL(String(value), document.baseURI).href; }
        catch (_) { return String(value); }
      };
      const imageSame = normalizeImageSrc(currentImageSrc) === normalizeImageSrc(map.image || '');
      if (!imageSame || !this.elements.image?.naturalWidth) {
        this.loadImageAndRender(map, { initial: false });
        return;
      }

      this.prepareCanvases(this.elements.image.naturalWidth, this.elements.image.naturalHeight);
      if (animated && oldMap) {
        this.transitionActive = true;
        this.activeTransactionPromises = new Set();
        this.stageTransition(oldMap, oldCombat, map, this.currentCombat)
          .catch(error => console.error('Player Map transaction failed safely:', error))
          .finally(() => this.finishTransaction());
      } else {
        this.renderBaseScene(map);
        this.renderTokens(map, this.currentCombat, null, null, { animated: false, initial: true });
        this.transitionActive = false;
        this.finishTransaction();
      }
      this.applyZoom();
    }

    updateToolbarTitle(map) {
      const strong = this.elements.root?.querySelector('.wg-player-toolbar-title strong');
      const label = this.elements.root?.querySelector('.player-map-label span');
      if (strong) strong.textContent = map.name || 'Player View';
      if (label) label.textContent = map.name || 'Player View';
    }

    stageTransition(previousMap, previousCombat, nextMap, nextCombat) {
      const { fog, fogTransition, draw, drawTransition, tokens } = this.elements;
      const width = finite(this.elements.stage?.dataset.baseW);
      const height = finite(this.elements.stage?.dataset.baseH);
      if (!fog || !fogTransition || !draw || !drawTransition || !tokens) return Promise.resolve();

      const fogChanged = !rectsEqual(previousMap?.fogRects || [], nextMap?.fogRects || []) ||
        previousMap?.fogEnabled !== nextMap?.fogEnabled;
      const drawChanged = !strokesEqual(previousMap?.draw || [], nextMap?.draw || []);

      // Render both versions first. Only animate a layer when that layer actually
      // changed. This is important for the transaction queue: a token-only action
      // must not wait seven seconds for an unrelated fog animation.
      const oldFogCtx = fogTransition.getContext('2d');
      const oldDrawCtx = drawTransition.getContext('2d');
      drawVisibility(fog.getContext('2d'), nextMap, width, height);
      drawStrokes(draw.getContext('2d'), nextMap, width, height);
      drawVisibility(oldFogCtx, previousMap, width, height);
      drawStrokes(oldDrawCtx, previousMap, width, height);

      fogTransition.style.opacity = fogChanged ? '1' : '0';
      drawTransition.style.opacity = drawChanged ? '1' : '0';
      draw.style.opacity = '1';

      let fogRevealPromise = Promise.resolve();
      if (fogChanged) {
        this.animateElement(fogTransition,
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: TIMING.fog, easing: ease('soft'), fill: 'forwards' }
        );
        fogRevealPromise = this.setTrackedTimeout(TIMING.fogRevealDelay);
      }

      if (drawChanged) {
        this.animateElement(drawTransition,
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: TIMING.draw, easing: ease('soft'), fill: 'forwards' }
        );
        this.animateElement(draw,
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: TIMING.draw, easing: ease('soft'), fill: 'forwards' }
        );
      }

      this.renderTokens(nextMap, nextCombat, previousMap, previousCombat, {
        animated: true,
        initial: false,
        revealPromise: fogRevealPromise
      });

      const cleanup = () => {
        if (!fogTransition.isConnected) return;
        fogTransition.style.opacity = '0';
        drawTransition.style.opacity = '0';
        draw.style.opacity = '1';
      };
      return Promise.allSettled(Array.from(this.activeTransactionPromises))
        .then(() => { cleanup(); });
    }

    renderTokens(nextMap, nextCombat, previousMap, previousCombat, options = {}) {
      const { animated = false } = options;
      const oldTokens = new Map((previousMap?.tokens || []).map(token => [token.id, token]));
      const oldCombatants = new Map((previousCombat?.combatants || []).map(c => [c.id, c]));
      const newCombatants = new Map((nextCombat?.combatants || []).map(c => [c.id, c]));
      const nextTokens = nextMap?.tokens || [];
      const seen = new Set();
      const fogChanged = !rectsEqual(previousMap?.fogRects || [], nextMap?.fogRects || []) ||
        previousMap?.fogEnabled !== nextMap?.fogEnabled;

      for (const token of nextTokens) {
        const oldToken = oldTokens.get(token.id);
        const oldCombatant = oldCombatants.get(token.combatantId);
        const newCombatant = newCombatants.get(token.combatantId);
        const oldShown = oldToken ? tokenVisible(previousMap, oldToken) : false;
        const nextShown = tokenVisible(nextMap, token);
        const wasDead = !!oldCombatant?.dead;
        const isDead = !!newCombatant?.dead;
        const wasShocked = !!oldCombatant?.shocked && !wasDead;
        const isShocked = !!newCombatant?.shocked && !isDead;
        const moved = !!oldToken && (Math.abs(finite(oldToken.x) - finite(token.x)) + Math.abs(finite(oldToken.y) - finite(token.y)) > .5);
        const deathChanged = oldToken && oldCombatant && newCombatant && wasDead !== isDead;

        let element = this.tokenElements.get(token.id);
        if (!element || !element.isConnected) {
          element = this.createTokenElement(token, newCombatant);
          this.elements.tokens.appendChild(element);
          this.tokenElements.set(token.id, element);
        }
        seen.add(token.id);
        this.updateTokenMarkup(element, token, newCombatant);

        if (!animated || !oldToken) {
          element.style.left = `${finite(token.x)}px`;
          element.style.top = `${finite(token.y)}px`;
          element.style.transform = 'translate3d(0,0,0)';
          element.style.opacity = nextShown ? '1' : '0';
          element.style.visibility = nextShown ? 'visible' : 'hidden';
          element.style.filter = 'none';
          this.setConditionStateInstant(element, isDead, isShocked);
          continue;
        }

        element.style.visibility = 'visible';
        element.style.left = '0px';
        element.style.top = '0px';
        element.style.transform = `translate3d(${finite(oldToken.x)}px, ${finite(oldToken.y)}px, 0)`;
        element.style.opacity = oldShown ? '1' : '0';
        element.style.filter = 'none';

        if (oldShown && nextShown && moved) {
          const x0 = finite(oldToken.x), y0 = finite(oldToken.y);
          const x1 = finite(token.x), y1 = finite(token.y);
          this.safeFinish(this.animateElement(element,
            [
              { transform: `translate3d(${x0}px, ${y0}px, 0)`, opacity: 1 },
              { transform: `translate3d(${x1}px, ${y1}px, 0)`, opacity: 1 }
            ],
            { duration: TIMING.multiTokenMove, easing: ease('soft'), fill: 'forwards' }
          ), () => this.commitTokenPosition(element, token, true));
        } else if (oldShown && !nextShown) {
          const x0 = finite(oldToken.x), y0 = finite(oldToken.y);
          const x1 = finite(token.x), y1 = finite(token.y);
          const fade = this.animateElement(element,
            [
              { transform: `translate3d(${x0}px, ${y0}px, 0)`, opacity: 1 },
              { transform: `translate3d(${x1}px, ${y1}px, 0)`, opacity: 0 }
            ],
            { duration: TIMING.exit, easing: ease('soft'), fill: 'forwards' }
          );
          this.safeFinish(fade, () => {
            this.commitTokenPosition(element, token, false);
          });
        } else if (!oldShown && nextShown) {
          // Shadow -> light: the token must not teleport to its new visible position.
          // If the token itself moved out of an already-fogged area, animate it from the
          // last hidden coordinate into the revealed coordinate while it fades in. If the
          // fog itself was just lifted, keep the stronger cinematic reveal: wait for the
          // real fog animation. The reveal promise resolves exactly 1 second after fog begins lifting, so no second delay is added here.
          const oldX = finite(oldToken.x), oldY = finite(oldToken.y);
          const newX = finite(token.x), newY = finite(token.y);
          const movedFromShadow = Math.abs(oldX - newX) + Math.abs(oldY - newY) > .5;

          element.style.left = '0px';
          element.style.top = '0px';
          element.style.transform = `translate3d(${oldX}px, ${oldY}px, 0) scale(.72)`;
          element.style.opacity = '0';
          element.style.visibility = 'visible';
          element.style.filter = 'none';

          const revealAfterFog = fogChanged
            ? Promise.resolve(options.revealPromise || Promise.resolve()).catch(() => {})
            : Promise.resolve();

          revealAfterFog.then(() => {
            const delay = fogChanged ? 0 : 650;
            this.setTrackedTimeout(delay, () => {
              if (!element.isConnected) return;
              const frames = movedFromShadow
                ? [
                    { transform: `translate3d(${oldX}px, ${oldY}px, 0) scale(.92)`, opacity: 0 },
                    { transform: `translate3d(${oldX + (newX - oldX) * .38}px, ${oldY + (newY - oldY) * .38}px, 0) scale(.96)`, opacity: .28, offset: .38 },
                    { transform: `translate3d(${newX}px, ${newY}px, 0) scale(1)`, opacity: 1 }
                  ]
                : [
                    { transform: `translate3d(${newX}px, ${newY}px, 0) scale(.72)`, opacity: 0 },
                    { transform: `translate3d(${newX}px, ${newY}px, 0) scale(1)`, opacity: 1 }
                  ];
              const reveal = this.animateElement(element, frames, {
                duration: movedFromShadow ? TIMING.move : TIMING.hiddenReveal,
                easing: ease('reveal'),
                fill: 'forwards'
              });
              this.safeFinish(reveal, () => this.commitTokenPosition(element, token, true));
              return reveal?.finished || Promise.resolve();
            });
          });
        } else {
          // Unchanged visibility state. Do not hide a token simply because its position
          // did not change. This branch is reached for the most common case: a token
          // staying in the same revealed area between Player Map refreshes.
          element.style.left = `${finite(token.x)}px`;
          element.style.top = `${finite(token.y)}px`;
          element.style.transform = 'translate3d(0,0,0)';
          element.style.opacity = nextShown ? '1' : '0';
          element.style.visibility = nextShown ? 'visible' : 'hidden';
          element.style.filter = 'none';
        }

        // Conditions are independent of token visibility. For visible tokens, always
        // animate from the OLD condition state to the NEW one. Never apply the final
        // state first, because doing so makes the transition appear to teleport.
        const conditionChanged = deathChanged || wasShocked !== isShocked;
        if (!animated || !oldToken || !oldCombatant || !newCombatant || !conditionChanged || !oldShown || !nextShown) {
          this.setConditionStateInstant(element, isDead, isShocked);
        } else {
          // Condition transitions are part of the same transaction as token
          // movement. The transaction must not finish while the dead/shocked
          // overlay is still waiting or animating.
          this.animateConditionTransition(element, {
            wasDead, isDead, wasShocked, isShocked
          });
        }
      }

      // Removed tokens remain as ghosts long enough to fade away instead of teleporting.
      if (animated) {
        for (const [id, oldToken] of oldTokens) {
          if (seen.has(id)) continue;
          const oldShown = tokenVisible(previousMap, oldToken);
          const oldElement = this.tokenElements.get(id);
          if (!oldShown || !oldElement) continue;
          const ghost = oldElement.cloneNode(true);
          ghost.dataset.ghost = '1';
          ghost.style.left = `${finite(oldToken.x)}px`;
          ghost.style.top = `${finite(oldToken.y)}px`;
          ghost.style.visibility = 'visible';
          ghost.style.opacity = '1';
          this.elements.tokens.appendChild(ghost);
          const animation = this.animateElement(ghost,
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: TIMING.exit, easing: ease('soft'), fill: 'forwards' }
          );
          this.safeFinish(animation, () => ghost.remove());
        }
      }
    }

    createTokenElement(token, combatant) {
      const element = document.createElement('div');
      element.className = 'wg-player-token';
      element.dataset.tokenId = token.id;
      // A physical 1px transparent center point. It is never painted or
      // hit-tested. It exists as the token's single visibility reference.
      element.innerHTML = '<div class="wg-player-token-visibility-anchor" aria-hidden="true"></div><div class="wg-player-token-art"></div><div class="wg-player-condition-composite wg-player-death-composite" data-condition="dead" aria-hidden="true"><div class="wg-player-condition-red"></div><div class="wg-player-condition-icon wg-player-death-skull">' + DEAD_SKULL + '</div></div><div class="wg-player-condition-composite wg-player-shock-composite" data-condition="shocked" aria-hidden="true"><div class="wg-player-shock-yellow"></div><div class="wg-player-condition-icon wg-player-shock-icon">' + SHOCK_LIGHTNING + '</div></div><div class="wg-player-token-label"></div>';
      this.updateTokenMarkup(element, token, combatant);
      return element;
    }

    updateTokenMarkup(element, token, combatant) {
      const art = element.querySelector('.wg-player-token-art');
      const label = element.querySelector('.wg-player-token-label');
      const size = Math.max(16, finite(token.size, 40));
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      element.style.setProperty('--wg-token-size', `${size}px`);
      if (art) {
        const imageSrc = token.image ? String(token.image) : '';
        const existingImage = art.querySelector('img');
        const existingFallback = art.querySelector('span');
        if (imageSrc) {
          if (!existingImage) {
            art.innerHTML = `<img src="${esc(imageSrc)}" alt="">`;
          } else if (existingImage.getAttribute('src') !== imageSrc) {
            existingImage.src = imageSrc;
          }
        } else if (!existingFallback) {
          art.innerHTML = `<span>${esc((token.name || '?').charAt(0).toUpperCase())}</span>`;
        } else {
          existingFallback.textContent = (token.name || '?').charAt(0).toUpperCase();
        }
      }
      if (label) label.textContent = combatant?.name || token.name || '';
    }

    setConditionStateInstant(element, dead, shocked) {
      const death = element.querySelector('[data-condition="dead"]');
      const shock = element.querySelector('[data-condition="shocked"]');
      if (death) { death.style.opacity = dead ? '1' : '0'; death.style.transform = dead ? 'scale(1)' : 'scale(.98)'; }
      if (shock) { shock.style.opacity = shocked ? '1' : '0'; shock.style.transform = shocked ? 'scale(1)' : 'scale(.98)'; }
      element.classList.toggle('is-dead', !!dead);
      element.classList.toggle('is-shocked', !!shocked && !dead);
    }

    animateConditionTransition(element, states) {
      const death = element.querySelector('[data-condition="dead"]');
      const shock = element.querySelector('[data-condition="shocked"]');
      if (!death || !shock) return;

      death.style.opacity = states.wasDead ? '1' : '0';
      death.style.transform = states.wasDead ? 'scale(1)' : 'scale(.98)';
      shock.style.opacity = states.wasShocked ? '1' : '0';
      shock.style.transform = states.wasShocked ? 'scale(1)' : 'scale(.98)';

      const duration = 3600;
      const key = (active, target) => active === target
        ? null
        : target
          ? [{opacity:0, transform:'scale(.94)'}, {opacity:1, transform:'scale(1)'}]
          : [{opacity:1, transform:'scale(1)'}, {opacity:0, transform:'scale(.94)'}];

      // Keep the complete condition transition inside one transaction barrier.
      // This is important when a token is moved and killed/revived in the same
      // burst: movement and condition state must commit independently without
      // allowing one to cancel the other.
      const barrier = new Promise(resolve => {
        const timer = window.setTimeout(() => {
          this.pendingCleanup.delete(timer);
          if (!element.isConnected) {
            resolve();
            return;
          }

          const animations = [];
          const deathFrames = key(states.wasDead, states.isDead);
          const shockFrames = key(states.wasShocked, states.isShocked);
          if (deathFrames) animations.push(this.animateElement(death, deathFrames, {
            duration, easing: ease('reveal'), fill:'forwards'
          }));
          if (shockFrames) animations.push(this.animateElement(shock, shockFrames, {
            duration, easing: ease('reveal'), fill:'forwards'
          }));

          Promise.allSettled(animations.map(a => a?.finished)).then(() => {
            if (element.isConnected) {
              this.setConditionStateInstant(element, states.isDead, states.isShocked);
            }
            resolve();
          });
        }, 1200);
        this.pendingCleanup.add(timer);
      });

      this.activeTransactionPromises.add(barrier);
      barrier.finally(() => this.activeTransactionPromises.delete(barrier));
    }

    commitTokenPosition(element, token, visible) {
      if (!element.isConnected) return;

      // WAAPI animations with fill:'forwards' remain attached after their
      // `finished` promise resolves. If we write the final inline position
      // without first releasing that animation, the browser can briefly keep
      // the animation's transform and then snap to the inline left/top value
      // on the next style tick. With several tokens this becomes very visible
      // as a post-animation jump across the map.
      //
      // Cancel only animations owned by this token element. Child condition
      // overlays have their own animations and must not be disturbed.
      try {
        for (const animation of element.getAnimations()) {
          try { animation.cancel(); } catch (_) {}
        }
      } catch (_) {}

      // Commit the endpoint in one coordinate system: layout position carries
      // the permanent coordinates, while transform returns to the neutral
      // origin. This is now performed only after the movement animation has
      // been explicitly released.
      element.style.left = `${finite(token.x)}px`;
      element.style.top = `${finite(token.y)}px`;
      element.style.transform = 'translate3d(0,0,0)';
      element.style.opacity = visible ? '1' : '0';
      element.style.visibility = visible ? 'visible' : 'hidden';
      element.style.filter = 'none';
    }

    safeFinish(animation, callback) {
      if (!animation?.finished) return;
      animation.finished.then(() => { try { callback?.(); } catch (error) { console.error('Player Map animation cleanup failed safely:', error); } }).catch(() => {});
    }

    animateElement(element, keyframes, options) {
      try {
        const animation = element.animate(keyframes, options);
        this.track(animation);
        return animation;
      } catch (error) {
        console.error('Player Map animation failed safely:', error);
        element.style.opacity = keyframes?.at(-1)?.opacity ?? element.style.opacity;
        return { finished: Promise.resolve(), cancel() {} };
      }
    }

    track(animation) {
      if (!animation) return animation;
      this.pendingCleanup.add(animation);
      const finished = animation.finished;
      this.activeTransactionPromises.add(finished);
      const clear = () => {
        this.pendingCleanup.delete(animation);
        this.activeTransactionPromises.delete(finished);
      };
      finished.then(clear, clear);
      return animation;
    }

    setTrackedTimeout(delay, callback) {
      let resolveTimer;
      const done = new Promise(resolve => { resolveTimer = resolve; });
      this.activeTransactionPromises.add(done);
      const timer = window.setTimeout(() => {
        let result;
        try { result = callback?.(); } catch (_) { result = null; }
        Promise.resolve(result).finally(() => {
          this.pendingCleanup.delete(timer);
          this.activeTransactionPromises.delete(done);
          resolveTimer();
        });
      }, delay);
      this.pendingCleanup.add(timer);
      return done;
    }

    finishTransaction() {
      this.transitionActive = false;
      this.activeTransactionPromises.clear();
      this.hideReceivingBadge();
      if (this.snapshotQueue.length) {
        requestAnimationFrame(() => this.drainSnapshotQueue());
      }
    }

    cancelAnimations() {
      for (const item of this.pendingCleanup) {
        try {
          if (typeof item.cancel === 'function') item.cancel();
          else clearTimeout(item);
        } catch (_) {}
      }
      this.pendingCleanup.clear();
    }

    getSnapshot() {
      return this.currentMap ? { map: copyVisualMap(this.currentMap), combat: copyCombat(this.currentCombat) } : null;
    }

    getState() {
      return { zoom: this.zoom, panX: this.panX, panY: this.panY, mapId: this.mapId, revision: this.revision };
    }
  }

  window.WGPlayerMapController = new PlayerMapController();
  window.WGPlayerMapTiming = TIMING;
  window.WGPlayerMapPointShown = pointShown;
})();
