(() => {
  'use strict';

  const KEY = 'wrath-glory-campaign-v4';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const uid = p => `${p}-${Math.random().toString(36).slice(2,8)}-${Date.now().toString(36)}`;
  const urlParams = new URLSearchParams(location.search);
  const PLAYER_MODE = urlParams.get('playerView') === '1';
  const COMBAT_WINDOW = urlParams.get('combatView') === '1';
  const MAP_WINDOW_ID = urlParams.get('map') || null;
  const csv = v => [...new Set(String(v||'').split(',').map(x=>x.trim()).filter(Boolean))];
  const TYPES = [
    ['talents','Talents'],['psychicAbilities','Psychic Abilities'],['prayers','Prayers'],['wargear','Wargear'],['weapons','Weapons']
  ];
  const DEF_TYPES = [['archetypes','Archetypes'],['species','Species'],['backgrounds','Backgrounds']];

  const examples = {
    talents:[
      {id:'example-talent-veterans-eye',name:"Example: Veteran's Eye",tier:1,description:'Demo talent for testing keyword filtering.',keywords:['Combat','Veteran'],requiredTags:['Human'],anyRequiredTags:[],forbiddenTags:[],xp:{1:5,2:5,3:5,4:5,5:5},example:true},
      {id:'example-talent-iron-discipline',name:'Example: Iron Discipline',tier:2,description:'Demo talent restricted to military characters.',keywords:['Leadership','Military'],requiredTags:['Military'],anyRequiredTags:[],forbiddenTags:[],xp:{1:0,2:10,3:10,4:10,5:10},example:true}
    ],
    psychicAbilities:[
      {id:'example-psychic-veil',name:'Example: Veil of Thought',tier:1,description:'Demo psychic ability for Psyker filtering.',keywords:['Psychic','Warp'],requiredTags:['Psyker'],anyRequiredTags:[],forbiddenTags:[],xp:{1:10,2:10,3:10,4:10,5:10},example:true},
      {id:'example-psychic-sight',name:'Example: Astral Sight',tier:2,description:'Demo advanced psychic option.',keywords:['Psychic','Sanctioned'],requiredTags:['Psyker','SanctionedPsyker'],anyRequiredTags:[],forbiddenTags:[],xp:{1:0,2:15,3:15,4:15,5:15},example:true}
    ],
    prayers:[
      {id:'example-prayer-resolve',name:'Example: Litany of Resolve',tier:1,description:'Demo prayer for Ministorum characters.',keywords:['Prayer','Ecclesiarchy'],requiredTags:['Ministorum'],anyRequiredTags:[],forbiddenTags:[],xp:{1:5,2:5,3:5,4:5,5:5},example:true},
      {id:'example-prayer-martyrs',name:'Example: Litany of the Martyrs',tier:2,description:'Demo prayer requiring faith.',keywords:['Prayer','Faith'],requiredTags:['Ministorum','Faithful'],anyRequiredTags:[],forbiddenTags:[],xp:{1:0,2:10,3:10,4:10,5:10},example:true}
    ],
    wargear:[
      {id:'example-wargear-field-kit',name:'Example: Field Utility Kit',tier:1,description:'Demo generic equipment.',keywords:['Gear','Utility'],requiredTags:[],anyRequiredTags:[],forbiddenTags:[],xp:{1:3,2:3,3:3,4:3,5:3},example:true},
      {id:'example-wargear-focus',name:'Example: Sanctioned Focus',tier:2,description:'Demo Psyker-only wargear.',keywords:['Gear','Psychic'],requiredTags:['Psyker','SanctionedPsyker'],anyRequiredTags:[],forbiddenTags:[],xp:{1:0,2:12,3:12,4:12,5:12},example:true}
    ],
    weapons:[
      {id:'example-weapon-carbine',name:'Example: Service Carbine',tier:1,description:'Demo ranged weapon.',keywords:['Weapon','Ranged','Military'],requiredTags:['Military'],anyRequiredTags:[],forbiddenTags:[],xp:{1:4,2:4,3:4,4:4,5:4},example:true},
      {id:'example-weapon-xenos',name:'Example: Xenos Blade',tier:2,description:'Demo Xenos-restricted weapon.',keywords:['Weapon','Melee','Xenos'],requiredTags:['Xenos'],anyRequiredTags:[],forbiddenTags:['Ministorum'],xp:{1:0,2:8,3:8,4:8,5:8},example:true}
    ]
  };
  const definitions = {
    archetypes:[
      {id:'example-archetype-soldier',name:'Example: Soldier',description:'Demo military archetype.',tags:['Military','Human'],xp:{1:0,2:20,3:20,4:20,5:20},example:true},
      {id:'example-archetype-psyker',name:'Example: Psyker',description:'Demo psychic archetype.',tags:['Psyker','SanctionedPsyker','Human'],xp:{1:0,2:25,3:25,4:25,5:25},example:true},
      {id:'example-archetype-acolyte',name:'Example: Ministorum Acolyte',description:'Demo faith archetype.',tags:['Ministorum','Faithful','Human'],xp:{1:0,2:20,3:20,4:20,5:20},example:true}
    ],
    species:[
      {id:'example-species-human',name:'Example: Human',description:'Demo Human species.',tags:['Human'],xp:{1:0,2:10,3:10,4:10,5:10},example:true},
      {id:'example-species-xenos',name:'Example: Xenos',description:'Demo Xenos species.',tags:['Xenos'],xp:{1:0,2:10,3:10,4:10,5:10},example:true}
    ],
    backgrounds:[
      {id:'example-background-veteran',name:'Example: Veteran',description:'Demo Veteran background.',tags:['Veteran','Military'],xp:{1:0,2:5,3:5,4:5,5:5},example:true},
      {id:'example-background-sanctioned',name:'Example: Sanctioned Training',description:'Demo sanctioned background.',tags:['Psyker','SanctionedPsyker'],xp:{1:0,2:5,3:5,4:5,5:5},example:true}
    ]
  };

  const defaultState = () => ({
    page:'home', campaign:{name:'Untitled Campaign',notes:''},
    settings:{budgets:{1:100,2:200,3:300,4:400,5:500},allowExtra:true}, tags:[],
    definitions:{archetypes:[],species:[],backgrounds:[]}, content:{talents:[],psychicAbilities:[],prayers:[],wargear:[],weapons:[]},
    characters:[], encounters:[], maps:[], tokenLibrary:[], soundLibraries:{backgrounds:[],effects:[],speeches:[]}, combat:{name:'Current Encounter',active:false,round:1,turn:0,combatants:[]}
  });
  let state = load();
  let previousPage = 'home';
  function load(){
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY)||'null'); } catch(e) { s=null; }
    if(!s) s=defaultState();
    s.settings ??= defaultState().settings; s.settings.budgets ??= defaultState().settings.budgets;
    s.tags ??=[]; s.characters ??=[]; s.encounters ??=[]; s.maps ??=[]; s.tokenLibrary ??=[]; s.soundLibraries ??={backgrounds:[],effects:[],speeches:[]}; s.soundLibraries.backgrounds ??=[]; s.soundLibraries.effects ??=[]; s.soundLibraries.speeches ??=[]; s.maps.forEach(m=>{m.fogRects??=[];m.fogEnabled??=true;if(m.layoutVersion!==5){delete m.toolbarPos;delete m.initiativePanelPos;delete m.mapViewerPos;m.layoutVersion=5;}m.toolbarVisible??=true;m.toolbarMinimized??=false;m.mapViewerMinimized??=false;m.initiativePanelVisible??=true;m.initiativePanelMinimized??=false;m.toolbarOpacity??=.94;m.brushSize??=20;m.drawColor??='#ebd291';m.tool??='none';m.panX??=0;m.panY??=0;m.playerAutoUpdate??=false;m.soundLayers??=[];m.soundMixerVisible??=true;m.soundMixerMinimized??=false;m.soundMixerPos??=null;m.soundMixerSize??=null;m.mapViewerVisible??=true;});
    s.definitions ??=defaultState().definitions; DEF_TYPES.forEach(([k])=>s.definitions[k]??=[]);
    s.content ??={}; TYPES.forEach(([k])=>s.content[k]??=[]);
    s.combat ??=defaultState().combat; s.combat.combatants ??=[]; s.combat.combatants.forEach(c=>{c.dead=!!c.dead;c.shocked=!!c.shocked;if(c.dead)c.shocked=false;}); s.maps.forEach(m=>{m.undoStack??=[];m.tokenLibraryVersion??=3;(m.tokens||[]).forEach(t=>{t.tokenLibraryId??='';if(!t.tokenLibraryId){const matches=(s.tokenLibrary||[]).filter(lib=>(lib.name||'')===(t.name||'')&&((lib.image||'')===(t.image||'')));if(matches.length===1)t.tokenLibraryId=matches[0].id;}});}); s.characters.forEach(c=>{c.tokenId??=''; TYPES.forEach(([k])=>c[k]??=[]);});
    let changed=false;
    for(const [k,arr] of Object.entries(examples)){ for(const x of arr) if(!s.content[k].some(y=>y.id===x.id)){s.content[k].push(structuredClone(x));changed=true;} }
    for(const [k,arr] of Object.entries(definitions)){ for(const x of arr) if(!s.definitions[k].some(y=>y.id===x.id)){s.definitions[k].push(structuredClone(x));changed=true;} }
    const demoTags=['Human','Xenos','Military','Veteran','Psyker','SanctionedPsyker','Ministorum','Faithful','Combat','Psychic','Prayer','Gear','Weapon','Ranged','Melee'];
    s.tags=[...new Set([...(s.tags||[]),...demoTags])]; if(changed) save(s); return s;
  }
  // Persist the complete campaign locally, but do not force every secondary
  // window to clone/serialize the entire campaign on every click. Large map
  // images and token art can be megabytes by themselves, so broadcasting the
  // whole state synchronously was able to stall BOTH windows after a few actions.
  let externalSyncTimer=0;
  function save(s=state){
    localStorage.setItem(KEY, JSON.stringify(s));
  }
  function buildLightStateSync(){
    // Never clone image payloads or undo history for cross-window state sync.
    // The Player Map has its own dedicated lightweight channel below.
    return {
      ...state,
      maps:(state.maps||[]).map(m=>({
        ...m,
        image:'',
        undoStack:[],
        tokens:(m.tokens||[]).map(t=>({...t,image:''}))
      })),
      tokenLibrary:(state.tokenLibrary||[]).map(t=>({...t,image:''}))
    };
  }
  function scheduleStateSync(){
    if(externalSyncTimer || PLAYER_MODE) return;
    externalSyncTimer=window.setTimeout(()=>{
      externalSyncTimer=0;
      try {
        syncChannel?.postMessage({type:'state',state:buildLightStateSync()});
      } catch(e) { console.warn('Campaign state sync skipped safely:',e); }
    },250);
  }
  function cost(x,tier){return Number(x?.xp?.[tier] ?? x?.xpCostByTier?.[tier] ?? x?.xpCost ?? 0)+Number(x?.extraXp||0);}
  function tagsFor(c){
    const out=new Set(c?.tags||[]);
    for(const [group,key] of [['archetypes','archetype'],['species','species'],['backgrounds','background']]){
      const d=(state.definitions[group]||[]).find(x=>x.id===c?.[key]); (d?.tags||[]).forEach(t=>out.add(t));
    } return [...out];
  }
  function eligible(x,c){ if(!c)return true; const tags=new Set(tagsFor(c)); return (x.requiredTags||[]).every(t=>tags.has(t)) && (!(x.anyRequiredTags||[]).length || x.anyRequiredTags.some(t=>tags.has(t))) && !(x.forbiddenTags||[]).some(t=>tags.has(t)); }
  function selectedIds(c){return TYPES.flatMap(([k])=>c?.[k]||[]);}
  function spent(c){ if(!c)return 0; let n=0; for(const [k] of TYPES) for(const id of c[k]||[]){const x=state.content[k].find(y=>y.id===id);if(x)n+=cost(x,c.tier);} for(const [g,key] of [['archetypes','archetype'],['species','species'],['backgrounds','background']]){const d=state.definitions[g].find(x=>x.id===c[key]);if(d)n+=cost(d,c.tier);} return n; }
  function budget(c){return c?Number(state.settings.budgets[c.tier]||0)+Number(c.extraXp||0):0;}
  const PLAYER_SYNC_KEY='wrath-glory-player-refresh-v1';
  const TOKEN_SYNC_KEY='wrath-glory-token-template-v1';
  let externalSyncFrame=0;
  let pendingExternalState=null;
  let syncChannel = null;
  // Player Map updates are deliberately staged. The player window first receives
  // the complete snapshot, keeps the current scene visible, then plays the diff.
  const PLAYER_UPDATE_RECEIVE_DELAY=450;
  let pendingPlayerRefresh=null;
  let playerRefreshTimer=0;
  let lastPlayerRefreshRevision='';
  try { syncChannel = new BroadcastChannel('wg-campaign-sync'); } catch(e) {}
  function acceptPlayerRefresh(msg){
    if(!PLAYER_MODE || !msg || msg.type!=='playerRefresh' || msg.mapId!==MAP_WINDOW_ID || !msg.map) return false;
    const revision=String(msg.revision||'');
    if(revision && revision===lastPlayerRefreshRevision) return true;
    if(revision && pendingPlayerRefresh?.msg?.revision===revision) return true;

    const controller=window.WGPlayerMapController;
    const existing=controller?.getSnapshot?.();
    const incomingMsg=structuredClone(msg);
    if(!incomingMsg.map.image){
      incomingMsg.map.image=window.__WG_PLAYER_PUBLISHED_MAP__?.image || existing?.map?.image || '';
    }
    pendingPlayerRefresh={msg:incomingMsg,previousPlayerMap:existing?.map||null,previousPlayerCombat:existing?.combat||null};
    controller?.showReceivingBadge?.();

    clearTimeout(playerRefreshTimer);
    playerRefreshTimer=setTimeout(()=>{
      playerRefreshTimer=0;
      const pending=pendingPlayerRefresh;
      pendingPlayerRefresh=null;
      if(!pending?.msg?.map)return;
      const incoming=pending.msg;
      lastPlayerRefreshRevision=String(incoming.revision||'');
      window.__WG_PLAYER_PUBLISHED_MAP__=structuredClone(incoming.map);
      window.__WG_PLAYER_PUBLISHED_COMBAT__=structuredClone(incoming.combat || {combatants:[]});
      window.__WG_PLAYER_REFRESH_REVISION__=incoming.revision||Date.now();
      try{
        controller?.applySnapshot?.(incoming.map,incoming.combat,{animated:true,previousMap:pending.previousPlayerMap,previousCombat:pending.previousPlayerCombat,revision:incoming.revision});
      }catch(err){
        console.error('Player Map update failed safely.',err);
        try{controller?.applySnapshot?.(incoming.map,incoming.combat,{animated:false,revision:incoming.revision});}catch(fallbackErr){
          console.error('Player Map fallback failed safely.',fallbackErr);
        }
      }
    }, Number(window.WGPlayerMapTiming?.receiveHold)||700);
    return true;
  }
  let pendingSaveState=null;
  let pendingSaveTimer=0;
  function scheduleCampaignSave(){
    pendingSaveState=state;
    if(pendingSaveTimer) return;
    pendingSaveTimer=window.setTimeout(()=>{
      pendingSaveTimer=0;
      const target=pendingSaveState;
      pendingSaveState=null;
      try { save(target || state); } catch(e) { console.error('Campaign save failed:', e); }
    },180);
  }
  window.addEventListener('pagehide',()=>{
    if(pendingSaveTimer){
      clearTimeout(pendingSaveTimer);
      pendingSaveTimer=0;
      try { save(pendingSaveState || state); } catch(e) {}
      pendingSaveState=null;
    }
  });
  function persist(options={}){
    // Persistence is always deferred. Cross-window campaign sync is opt-in for
    // map operations because maps have a dedicated lightweight Player channel.
    scheduleCampaignSave();
    if(options.syncState!==false) scheduleStateSync();
    try {
      const active=state.maps.find(x=>x.id===state.activeMapId);
      if(options.publishPlayer!==false && active?.playerAutoUpdate) publishPlayerMap(active);
    } catch(e) {
      console.warn('Player Map publish skipped safely:', e);
    }
  }
  function syncFromExternal(next){
    if(!next || PLAYER_MODE) return;
    // Coalesce BroadcastChannel + storage events. Token saves can otherwise cause two
    // complete Combat Tracker rebuilds in the same turn, which is especially expensive
    // when combatants have image-backed token previews.
    pendingExternalState=next;
    if(externalSyncFrame) return;
    externalSyncFrame=requestAnimationFrame(()=>{
      externalSyncFrame=0;
      const incoming=pendingExternalState;
      pendingExternalState=null;
      if(!incoming) return;
      // State sync messages intentionally omit large image payloads.
      // Reuse the local copies in this window when present.
      for(const m of (incoming.maps||[])){
        const local=state.maps?.find(x=>x.id===m.id);
        if(!m.image && local?.image) m.image=local.image;
      }
      for(const t of (incoming.tokenLibrary||[])){
        const local=state.tokenLibrary?.find(x=>x.id===t.id);
        if(!t.image && local?.image) t.image=local.image;
      }
      state=incoming;
      if(COMBAT_WINDOW) renderCombat();
      else if(state.page==='map') renderMap();
    });
  }
  function applyTokenPatch(msg){
    if(!msg || msg.type!=='tokenLibraryPatch' || PLAYER_MODE) return false;
    const lib=msg.token;
    if(!lib?.id) return false;
    const idx=state.tokenLibrary.findIndex(x=>x.id===lib.id);
    if(idx<0) state.tokenLibrary.push(structuredClone(lib)); else state.tokenLibrary[idx]=structuredClone(lib);
    // Keep already placed instances synchronized without rebuilding the whole VTT.
    for(const m of (state.maps||[])) for(const placed of (m.tokens||[])) if(placed.tokenLibraryId===lib.id){
      placed.name=lib.name; placed.image=lib.image||''; placed.size=Number(lib.size)||40; placed.type=lib.type||'NPC';
    }
    if(COMBAT_WINDOW) renderCombat();
    else if(state.page==='map'){
      const m=state.maps.find(x=>x.id===state.activeMapId);
      if(m) renderMapTokens(m);
    }
    return true;
  }
  syncChannel?.addEventListener('message', e=>{
    const msg=e.data||{};
    if(acceptPlayerRefresh(msg)) return;
    if(applyTokenPatch(msg)) return;
    if(msg.type==='state') syncFromExternal(msg.state);
  });
  window.addEventListener('storage', e=>{
    if(e.key===KEY && e.newValue){ try{ syncFromExternal(JSON.parse(e.newValue)); }catch(err){} }
    if(e.key===TOKEN_SYNC_KEY && e.newValue){ try{ applyTokenPatch(JSON.parse(e.newValue)); }catch(err){} }
    if(e.key===PLAYER_SYNC_KEY && e.newValue){ try{ acceptPlayerRefresh(JSON.parse(e.newValue)); }catch(err){} }
  });

  function IC(n,c=''){return `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;}
  const DEAD_SKULL = `<svg class="dead-skull-inline" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C7.6 3 4.5 6 4.5 10c0 2.4 1.1 4.1 2.5 5.1V19h10v-3.9c1.4-1 2.5-2.7 2.5-5.1 0-4-3.1-7-7.5-7z" fill="currentColor"/><path d="M8.6 10.6h2.2l-.4 2.6H8.6zM13.2 10.6h2.2v2.6h-1.8z" fill="#090a0d"/><path d="M9 19v-2.4M12 19v-2.4M15 19v-2.4" stroke="#090a0d" stroke-width="1.6" stroke-linecap="square"/></svg>`;
  const SHOCK_LIGHTNING_GM = `<svg class="shock-lightning-inline" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2.5 5.6 13h5.1l-.9 8.5L18.4 11h-5.2z" fill="currentColor"/></svg>`;
  function shell(){
    $('#main-navigation').innerHTML=`<div class="nav-left"><button class="nav-button" data-page="home">${IC('aquila')} Home</button><button class="nav-button" data-page="combat">${IC('sword')} Combat</button><button class="nav-button" data-page="characters">${IC('skull')} Characters</button><button class="nav-button" data-page="builder">${IC('cog')} Builder</button><button class="nav-button" data-page="dashboard">${IC('tome')} Dashboard</button></div><div class="brand"><strong>Kousha's Table Top</strong><span>${IC('aquila','ic-brand')}</span></div><div class="nav-right"><button class="nav-button" data-page="game-room">${IC('map')} Game Room</button><button class="nav-button" data-page="map-library">${IC('map')} Maps</button><button class="nav-button" data-page="token-library">${IC('shield')} Tokens</button><button class="nav-button" data-page="sounds">${IC('volume')} Sounds</button><button class="nav-button" id="export">${IC('export')} Export</button><button class="nav-button" id="reset">${IC('flame')} Reset</button></div>`;
    $$('#main-navigation [data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page)); $('#export').onclick=exportAll; $('#reset').onclick=()=>{if(confirm('Reset all campaign data and restore examples?')){localStorage.removeItem(KEY);location.reload();}};
    $('#home-section').hidden=true; $('#combat-section').hidden=true; $('#characters-section').hidden=true; $('#builder-section').hidden=true; $('#dashboard-section').hidden=true; $('#map-section').hidden=true; $('#sounds-section').hidden=true; $('#map-library-section').hidden=true; $('#token-library-section').hidden=true;
  }
  function navigate(page){
    // Game Room is the renamed home of the virtual tabletop. Internally the
    // existing map state remains authoritative so old campaign data stays compatible.
    const internalPage=page==='game-room'?'map':page;
    const oldPage=state.page; if(oldPage && oldPage!==internalPage) previousPage=oldPage;
    state.page=internalPage; persist();
    document.body.classList.toggle('map-page',internalPage==='map');
    {const nav=document.getElementById('main-navigation');if(nav)document.documentElement.style.setProperty('--nav-h',Math.ceil(nav.getBoundingClientRect().height||56)+'px');}
    shell();
    const sectionId=page==='game-room'?'map':page;
    const sec=$(`#${sectionId}-section`); if(sec){ sec.hidden=false; sec.classList.remove('page-enter','page-enter-active'); requestAnimationFrame(()=>{sec.classList.add('page-enter','page-enter-active'); setTimeout(()=>sec.classList.remove('page-enter','page-enter-active'),280);}); }
    const activePage=internalPage==='map'?'game-room':page;
    $$('#main-navigation [data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===activePage));
    if(page==='home') renderHome();
    if(page==='combat')renderCombat(); if(page==='characters')renderCharacters(); if(page==='builder')renderBuilder(); if(page==='dashboard')renderDashboard(); if(page==='game-room')renderMap(); if(page==='sounds')renderSounds(); if(page==='map-library')renderMapLibraryPage(); if(page==='token-library')renderTokenLibraryPage();
  }
  function renderHome(){
    const s=$('#home-section');
    s.innerHTML=`<div class="home-page"><div class="home-hero"><div class="eyebrow">WRATH & GLORY · GM COMMAND DECK</div><h1>Kousha's Table Top</h1><p class="muted">Campaign command deck, game room workspaces, libraries and encounter control.</p></div><div class="home-grid">${[
      ['map','Game Room','Open the virtual game room and its movable workspaces.','game-room'],['map','Map Library','Browse saved battlefields with visual previews.','map-library'],['shield','Token Library','Browse and manage reusable token templates.','token-library'],
      ['sword','Combat','Manage encounters, initiative, wounds and turns.','combat'],
      ['skull','Characters','Create and manage player characters and NPCs.','characters'],
      ['cog','Builder','Build characters from your campaign content.','builder'],
      ['tome','Dashboard','Manage campaign content, definitions, tags and XP.','dashboard'],
      ['volume','Sounds','Build sound libraries and create layered audio scenes for your maps.','sounds']
    ].map(x=>`<button class="home-card card" data-home-page="${x[3]}"><span class="home-card-icon">${IC(x[0])}</span><strong>${x[1]}</strong><span class="muted small">${x[2]}</span><span class="home-card-open">Open →</span></button>`).join('')}</div></div>`;
    $$('[data-home-page]',s).forEach(b=>b.onclick=()=>navigate(b.dataset.homePage));
  }


  function removeCombatantAndTokens(combatantId){
    state.combat.combatants=state.combat.combatants.filter(c=>c.id!==combatantId);
    for(const m of (state.maps||[])){
      if(Array.isArray(m.tokens))m.tokens=m.tokens.filter(t=>t.combatantId!==combatantId);
    }
  }

  // COMBAT TRACKER EXTENSION NOTE:
  // This renderer is the floating Map-page combat extension (COMBAT_WINDOW),
  // not the full Combat page module under js/combat/. Keep its token binding
  // logic compatible with reusable state.tokenLibrary templates. A combatant
  // may use the same token template as any other combatant. The map token
  // stores tokenLibraryId so library edits can propagate to placed instances.
  // Keep UI-only refinements in CSS where possible to avoid touching the live
  // token synchronization/persistence path, which previously caused freezes.
  function renderCombat(){
    const s=$('#combat-section'); const c=state.combat;
    s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Encounter</div><h1>${esc(c.name)}</h1><div class="combat-status"><span class="badge accent">Round ${c.round}</span><span class="badge">${c.combatants.length} Combatants</span><span class="badge">${c.active?'Active':'Not Started'}</span></div></div><div class="combat-toolbar">${COMBAT_WINDOW?'<button id="combat-window-back">← Return</button>':''}<button id="rename">Rename</button><button class="button-primary" id="add">${IC('plus')} Add Character</button><button id="start" class="${c.active?'button-danger':''}">${c.active?'End Battle':'Start Combat'}</button><button id="save-enc">Save Encounter</button></div></div><div class="card" style="margin-bottom:14px"><div class="combat-toolbar"><button id="prev">← Previous</button><button class="button-primary" id="next">Next Turn →</button><button id="sort">Sort Initiative</button><button class="button-danger" id="clear">Clear</button></div></div><div class="combat-list" id="combat-list"></div>`;
    if(COMBAT_WINDOW){const b=$('#combat-window-back');if(b)b.onclick=()=>{if(window.opener&&!window.opener.closed){window.close();}else{navigate('map');}};}else{const b=$('#combat-window-back');if(b)b.onclick=()=>navigate(previousPage||'home');}
    $('#rename').onclick=()=>{const n=prompt('Encounter name',c.name);if(n!==null){c.name=n.trim()||'Current Encounter';persist();renderCombat();}};
    $('#add').onclick=()=>pickCharacter(); $('#start').onclick=()=>{if(c.active){c.active=false;c.combatants.forEach(x=>x.active=false);}else{c.active=true;c.round=1;c.turn=0;c.combatants.forEach((x,i)=>x.active=i===0);}persist();renderCombat();}; $('#save-enc').onclick=()=>{state.encounters.unshift({id:uid('enc'),name:c.name,savedAt:new Date().toISOString(),combatants:structuredClone(c.combatants)});persist();alert('Encounter saved.');}; $('#prev').onclick=()=>turn(-1); $('#next').onclick=()=>turn(1);
    // Initiative sorting is explicit, stable, and reversible. It never runs as a side
    // effect of editing a card, because that would make the tracker jump while the GM
    // is typing. The button toggles descending/ascending order.
    c.sortInitiativeDirection ??= 'desc';
    const sortInitiative=()=>{const dir=c.sortInitiativeDirection==='asc'?1:-1;c.combatants.sort((a,b)=>{const d=(Number(b.initiative)||0)-(Number(a.initiative)||0);return d===0?(a._sortOrder??0)-(b._sortOrder??0):d*dir;});persist();renderCombat();};
    c.combatants.forEach((x,i)=>x._sortOrder ??= i);
    $('#sort').textContent=`Sort Initiative ${c.sortInitiativeDirection==='asc'?'↑':'↓'}`;
    $('#sort').onclick=()=>{c.sortInitiativeDirection=c.sortInitiativeDirection==='asc'?'desc':'asc';sortInitiative();};
    $('#clear').onclick=()=>{if(confirm('Clear combat and remove its live tokens from all maps?')){const ids=new Set(c.combatants.map(x=>x.id));c.combatants=[];for(const m of (state.maps||[])){if(Array.isArray(m.tokens))m.tokens=m.tokens.filter(t=>!ids.has(t.combatantId));}c.active=false;c.round=1;c.turn=0;persist();renderCombat();}};
    const list=$('#combat-list'); if(!c.combatants.length){list.innerHTML=`<div class="card combat-empty"><div style="text-align:center"><h2>No combatants</h2><p class="muted">Add a saved character template to begin.</p><button class="button-primary" id="empty-add">${IC('plus')} Add Character</button></div></div>`;$('#empty-add').onclick=pickCharacter;return;}
    // Each combatant card resolves its bound token from the map first, then
    // falls back to combatant.tokenId. This keeps the preview representative
    // of the actual live map token while preserving reusable library templates.
    c.combatants.forEach(x=>{const card=document.createElement('article');card.className=`card combatant-card ${x.active?'active':''} ${x.dead?'is-dead':''} ${x.shocked?'is-shocked':''}`;const bound=(state.maps||[]).flatMap(m=>m.tokens||[]).find(t=>t.combatantId===x.id);const libToken=bound?.tokenLibraryId?state.tokenLibrary.find(t=>t.id===bound.tokenLibraryId):state.tokenLibrary.find(t=>t.id===x.tokenId);card.innerHTML=`<div class="combatant-header"><div class="combatant-identity"><div class="combatant-name-line"><div class="combatant-token-mini combatant-token-avatar">${libToken?.image?`<img src="${esc(libToken.image)}" alt="">`:`<span>${esc((libToken?.name||'∅')[0])}</span>`}</div><div class="combatant-name-block"><div class="eyebrow">${esc(x.type||'NPC')} · ${x.dead?'DEAD':x.shocked?'SHOCKED':'ACTIVE'}</div><h2>${esc(x.name)}</h2><div class="combatant-token-caption muted small">${esc(libToken?.name||'No token assigned')}</div></div></div><div class="muted small combatant-faction">${esc(x.faction||'No faction')}</div></div><div class="combatant-head-actions"><span class="combatant-init-badge">INIT ${Number(x.initiative||0)}</span><button class="combatant-token-btn" data-token-for="${x.id}">${bound?'Change Token':'Assign Token'}</button><button class="combatant-edit-btn" data-edit-combatant="${x.id}">Edit</button><button class="button-danger remove">Remove</button></div></div><div class="combatant-stats-grid"><label><span>Wounds</span><input type="number" value="${x.wounds}" data-f="wounds"></label><label><span>Shock</span><input type="number" value="${x.shock}" data-f="shock"></label><label><span>Defense</span><input type="number" value="${x.defense}" data-f="defense"></label><label><span>Resilience</span><input type="number" value="${x.resilience}" data-f="resilience"></label><label><span>Initiative</span><input type="number" value="${x.initiative}" data-f="initiative"></label></div><div class="combatant-actions"><button data-d="-1">− Wound</button><button data-d="1">+ Wound</button><button data-s="-1">− Shock</button><button data-s="1">+ Shock</button><button class="${x.dead?'button-primary':''} toggle-dead">${x.dead?'Revive':'Mark Dead'}</button><button class="toggle-shocked">${x.shocked?'Clear Shock':'Shocked'}</button></div>`;card.querySelector('.remove').onclick=()=>{removeCombatantAndTokens(x.id);persist();renderCombat();};card.querySelector('.toggle-dead').onclick=()=>{const wasDead=!!x.dead;x.dead=!x.dead;if(x.dead)x.shocked=false;persist({publishPlayer:wasDead});renderCombat();const m=state.maps.find(m=>m.id===state.activeMapId)||state.maps[0];if(m){renderMapTokens(m);}};card.querySelector('.toggle-shocked').onclick=()=>{const wasShocked=!!x.shocked;x.shocked=!x.shocked;if(x.shocked)x.dead=false;persist({publishPlayer:wasShocked});renderCombat();const m=state.maps.find(m=>m.id===state.activeMapId)||state.maps[0];if(m){renderMapTokens(m);}};$$('.combatant-stats-grid input',card).forEach(i=>i.onchange=()=>{x[i.dataset.f]=Number(i.value)||0;persist();});$$('[data-d]',card).forEach(b=>b.onclick=()=>{x.wounds=Math.max(0,x.wounds+Number(b.dataset.d));persist();renderCombat();});$$('[data-s]',card).forEach(b=>b.onclick=()=>{x.shock=Math.max(0,x.shock+Number(b.dataset.s));persist();renderCombat();});card.querySelector('[data-token-for]').onclick=()=>assignTokenToCombatant(x.id);card.querySelector('[data-edit-combatant]').onclick=()=>editCombatantCard(x.id);list.appendChild(card);});
  }
  // Edit a live combatant without touching token-library synchronization. This is deliberately
  // a single save transaction so the Combat Extension cannot enter the recursive re-render loop
  // that previously froze while token templates were being edited.
  function editCombatantCard(combatantId){
    const c=state.combat.combatants.find(x=>x.id===combatantId); if(!c)return;
    const wrap=document.createElement('div');wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal-card combatant-edit-modal"><div class="modal-header"><div><div class="eyebrow">Live Combatant</div><h2>Edit ${esc(c.name||'Combatant')}</h2></div><button id="close-edit-combatant">×</button></div><div class="grid grid-2 combatant-edit-grid">
      <div class="field"><label>Name</label><input id="ec-name" value="${esc(c.name||'')}"></div>
      <div class="field"><label>Type</label><select id="ec-type">${['PC','NPC','Enemy','Ally','Object'].map(v=>`<option ${v===(c.type||'NPC')?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Faction</label><input id="ec-faction" value="${esc(c.faction||'')}"></div>
      <div class="field"><label>Initiative</label><input id="ec-initiative" type="number" value="${Number(c.initiative)||0}"></div>
      <div class="field"><label>Defense</label><input id="ec-defense" type="number" value="${Number(c.defense)||0}"></div>
      <div class="field"><label>Resilience</label><input id="ec-resilience" type="number" value="${Number(c.resilience)||0}"></div>
      <div class="field"><label>Wounds</label><input id="ec-wounds" type="number" min="0" value="${Number(c.wounds)||0}"></div>
      <div class="field"><label>Shock</label><input id="ec-shock" type="number" min="0" value="${Number(c.shock)||0}"></div>
      <div class="field" style="grid-column:1/-1"><label>Notes</label><textarea id="ec-notes" rows="4">${esc(c.notes||'')}</textarea></div>
    </div><div class="modal-actions"><button id="cancel-edit-combatant">Cancel</button><button class="button-primary" id="save-edit-combatant">Save Changes</button></div></div>`;
    document.body.appendChild(wrap);
    const close=()=>wrap.remove(); $('#close-edit-combatant',wrap).onclick=close; $('#cancel-edit-combatant',wrap).onclick=close;
    $('#save-edit-combatant',wrap).onclick=()=>{
      c.name=$('#ec-name',wrap).value.trim()||'Unnamed Combatant'; c.type=$('#ec-type',wrap).value; c.faction=$('#ec-faction',wrap).value.trim();
      c.initiative=Number($('#ec-initiative',wrap).value)||0; c.defense=Number($('#ec-defense',wrap).value)||0; c.resilience=Number($('#ec-resilience',wrap).value)||0;
      c.wounds=Math.max(0,Number($('#ec-wounds',wrap).value)||0); c.shock=Math.max(0,Number($('#ec-shock',wrap).value)||0); c.notes=$('#ec-notes',wrap).value;
      persist(); close();
      // The same editor is shared by the full Combat page and the floating Map-page
      // Combat Tracker Extension. Refresh only the surface that actually exists so
      // editing a card cannot call a renderer for a missing DOM node.
      const m=state.maps.find(m=>m.id===state.activeMapId)||state.maps[0];
      if($('#initiative-panel-list') && m) renderInitiativePanel(m); else renderCombat();
      if(m){renderMapTokens(m);publishPlayerMap(m);}
    };
  }

  function assignTokenToCombatant(combatantId){
    const map=state.maps.find(m=>m.id===state.activeMapId)||state.maps[0]; if(!map)return;
    const c=state.combat.combatants.find(x=>x.id===combatantId); if(!c)return;
    const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<div class="modal-card modal-wide combatant-token-modal"><div class="modal-header"><div><h2>Assign Token</h2><p class="muted small">${esc(c.name)} can use any reusable Token Library entry. Multiple combatants may use the same token.</p></div><button id="close-assign-token">×</button></div><div class="token-library-grid token-picker-grid assign-token-grid">${state.tokenLibrary.map(t=>`<button class="token-picker-card" data-assign-token="${t.id}"><div class="token-picker-icon">${t.image?`<img src="${esc(t.image)}" alt="">`:`<span>${esc((t.name||'?')[0])}</span>`}</div><strong>${esc(t.name)}</strong><span class="muted small">${esc(t.type||'Token')}</span></button>`).join('')||'<div class="empty-state">No tokens in the library.</div>'}</div></div>`;document.body.appendChild(wrap);const close=()=>wrap.remove();$('#close-assign-token',wrap).onclick=close;$$('[data-assign-token]',wrap).forEach(b=>b.onclick=()=>{const t=state.tokenLibrary.find(x=>x.id===b.dataset.assignToken);if(!t)return;const existing=(map.tokens||[]).find(x=>x.combatantId===c.id);if(existing){existing.tokenLibraryId=t.id;existing.name=t.name;existing.image=t.image||'';existing.size=Number(t.size)||40;existing.type=t.type||c.type||'NPC';}else{pushMapUndo(map);map.tokens.push({id:uid('token'),tokenLibraryId:t.id,name:t.name,image:t.image||'',x:map.grid*2,y:map.grid*2,size:Number(t.size)||Math.max(28,map.grid*.8),type:t.type||c.type||'NPC',combatantId:c.id});}c.tokenId=t.id;persist();close();renderCombat();renderMapTokens(map);publishPlayerMap(map);});
  }

  function turn(dir){const c=state.combat;if(!c.combatants.length)return;c.turn+=dir;if(c.turn>=c.combatants.length){c.turn=0;c.round++;}if(c.turn<0){c.turn=c.combatants.length-1;c.round=Math.max(1,c.round-1);}c.combatants.forEach((x,i)=>x.active=i===c.turn);c.active=true;persist();renderCombat();}
  function pickCharacter(){if(!state.characters.length){alert('Create a character first.');navigate('characters');return;}const names=state.characters.map((x,i)=>`${i+1}. ${x.name} · Tier ${x.tier}`).join('\n');const v=prompt(`Choose character number:\n${names}`);const i=Number(v)-1;const ch=state.characters[i];if(!ch)return;state.combat.combatants.push({id:uid('cmb'),name:ch.name,type:ch.type||'NPC',faction:ch.faction||'',wounds:Number(ch.wounds||10),shock:Number(ch.shock||10),shockMax:Number(ch.shock?.max??ch.shock??10),defense:Number(ch.defense||3),resilience:Number(ch.resilience||3),initiative:Number(ch.initiative||0),tokenId:ch.tokenId||'',active:false,dead:false,shocked:false});persist();renderCombat();}

  function renderCharacters(){
    const s=$('#characters-section');s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Library</div><h1>Characters</h1><p class="muted">Create reusable PC, NPC, Enemy and Ally templates.</p></div><button class="button-primary" id="new-char">${IC('plus')} New Character</button></div><div class="character-list" id="char-list"></div>`;
    $('#new-char').onclick=()=>editCharacter(null);const list=$('#char-list');if(!state.characters.length){list.innerHTML='<div class="card empty-state">No characters yet.</div>';return;}state.characters.forEach(ch=>{const card=document.createElement('article');card.className='card character-card';card.innerHTML=`<div><div class="eyebrow">${esc(ch.type)} · Tier ${ch.tier}</div><h2>${esc(ch.name)}</h2><div class="character-meta">${esc(ch.faction||'No faction')} · XP ${spent(ch)}/${budget(ch)}</div><div class="tag-cloud">${tagsFor(ch).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')}</div></div><div class="character-actions"><button class="edit">Edit</button><button class="duplicate">Duplicate</button><button class="add button-primary">Add to Combat</button><button class="delete button-danger">Delete</button></div>`;card.querySelector('.edit').onclick=()=>editCharacter(ch.id);card.querySelector('.duplicate').onclick=()=>{const d=structuredClone(ch);d.id=uid('char');d.name=`${ch.name} Copy`;state.characters.push(d);persist();renderCharacters();};card.querySelector('.add').onclick=()=>{state.combat.combatants.push({id:uid('cmb'),name:ch.name,type:ch.type||'NPC',faction:ch.faction||'',wounds:Number(ch.wounds||10),shock:Number(ch.shock||10),shockMax:Number(ch.shock?.max??ch.shock??10),defense:Number(ch.defense||3),resilience:Number(ch.resilience||3),initiative:Number(ch.initiative||0),tokenId:ch.tokenId||'',active:false,dead:false,shocked:false});persist();navigate('combat');};card.querySelector('.delete').onclick=()=>{if(confirm(`Delete ${ch.name}?`)){state.characters=state.characters.filter(x=>x.id!==ch.id);persist();renderCharacters();}};list.appendChild(card);});
  }
  function editCharacter(id){
    const ch=id?state.characters.find(x=>x.id===id):{id:uid('char'),name:'New Character',type:'NPC',tier:1,extraXp:0,archetype:'',species:'',background:'',tags:[],faction:'',role:'',wounds:10,shock:10,defense:3,resilience:3,initiative:0,tokenId:'',talents:[],psychicAbilities:[],prayers:[],wargear:[],weapons:[]};
    TYPES.forEach(([k])=>ch[k]??=[]);
    const s=$('#characters-section');
    s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Character Editor</div><h1>${id?'Edit':'New'} Character</h1><p class="muted">Build the character and attach campaign content. New talents, prayers, powers, wargear and weapons are saved to the campaign database.</p></div><button id="back">← Back</button></div><div class="card"><div class="grid grid-2"><div class="field"><label>Name</label><input id="n" value="${esc(ch.name)}"></div><div class="field"><label>Type</label><select id="type">${['PC','NPC','Enemy','Ally'].map(x=>`<option ${x===ch.type?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Tier</label><select id="tier">${[1,2,3,4,5].map(x=>`<option ${x===Number(ch.tier)?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Extra XP</label><input id="extra" type="number" min="0" value="${Number(ch.extraXp||0)}"></div><div class="field"><label>Archetype</label><select id="archetype"><option value="">None</option>${state.definitions.archetypes.map(x=>`<option value="${x.id}" ${x.id===ch.archetype?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label>Species</label><select id="species"><option value="">None</option>${state.definitions.species.map(x=>`<option value="${x.id}" ${x.id===ch.species?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label>Background</label><select id="background"><option value="">None</option>${state.definitions.backgrounds.map(x=>`<option value="${x.id}" ${x.id===ch.background?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label>Custom Tags</label><input id="tags" value="${esc((ch.tags||[]).join(', '))}" placeholder="Veteran, Psyker"></div><div class="field"><label>Faction</label><input id="faction" value="${esc(ch.faction)}"></div><div class="field"><label>Role</label><input id="role" value="${esc(ch.role)}"></div><div class="field"><label>Wounds</label><input id="wounds" type="number" value="${ch.wounds}"></div><div class="field"><label>Shock</label><input id="shock" type="number" value="${ch.shock}"></div><div class="field"><label>Defense</label><input id="defense" type="number" value="${ch.defense}"></div><div class="field"><label>Resilience</label><input id="resilience" type="number" value="${ch.resilience}"></div><div class="field"><label>Initiative</label><input id="initiative" type="number" value="${ch.initiative}"></div><div class="field"><label>Default Combat Token</label><select id="token-id"><option value="">None</option>${state.tokenLibrary.map(t=>`<option value="${t.id}" ${t.id===ch.tokenId?'selected':''}>${esc(t.name)} · ${esc(t.type||'NPC')}</option>`).join('')}</select><span class="muted small">This is a character default only. Live combatants receive their own token binding.</span></div></div><div class="xp-summary"><strong>Inherited tags:</strong> <span id="character-inherited-tags">${tagsFor(ch).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')||'<span class="muted">None</span>'}</span></div><section class="character-content-editor"><div class="character-content-heading"><div><div class="eyebrow">Campaign Content</div><h2>Talents, Powers, Prayers & Gear</h2><p class="muted small">Attach existing entries or create new campaign entries directly from this character.</p></div></div><div class="character-content-grid">${TYPES.map(([k,label])=>`<article class="character-content-block" data-content-block="${k}"><div class="character-content-block-head"><div><strong>${label}</strong><span class="muted small" data-content-count="${k}">0 selected</span></div><button type="button" class="button-primary content-new-button" data-content-new="${k}">${IC('plus')} New</button></div><div class="character-content-selected" id="char-content-selected-${k}"></div><div class="character-content-add"><select id="char-content-add-${k}" aria-label="Add existing ${label}"><option value="">Add existing...</option></select><button type="button" data-content-add="${k}">Add</button></div></article>`).join('')}</div></section><div class="toolbar" style="margin-top:18px"><button id="cancel">Cancel</button><button id="save-char" class="button-primary">Save Character</button><button id="builder" class="button-primary">Save & Open Builder</button></div></div>`;
    $('#back').onclick=renderCharacters; $('#cancel').onclick=renderCharacters;

    const refreshContentBlock=k=>{
      const selectedBox=$(`#char-content-selected-${k}`), select=$(`#char-content-add-${k}`), count=$(`[data-content-count="${k}"]`);
      const selected=new Set(ch[k]||[]); const items=state.content[k]||[];
      if(selectedBox) selectedBox.innerHTML=[...selected].map(cid=>{const item=items.find(x=>x.id===cid);if(!item){return `<span class="character-content-chip missing">Unknown entry <button type="button" data-content-remove="${k}" data-content-id="${esc(cid)}" aria-label="Remove unknown entry">×</button></span>`;}return `<span class="character-content-chip"><span>${esc(item.name)}</span><button type="button" data-content-remove="${k}" data-content-id="${esc(cid)}" aria-label="Remove ${esc(item.name)}">×</button></span>`;}).join('')||'<span class="muted small">None selected.</span>';
      if(count) count.textContent=`${selected.size} selected`;
      if(select){select.innerHTML=`<option value="">Add existing...</option>`+items.filter(x=>!selected.has(x.id)).map(x=>`<option value="${x.id}">${esc(x.name)} · Tier ${Number(x.tier||1)}</option>`).join('');}
      $$('[data-content-remove]',selectedBox).forEach(btn=>btn.onclick=()=>{ch[k]=(ch[k]||[]).filter(x=>x!==btn.dataset.contentId);persist();refreshContentBlock(k);});
    };
    TYPES.forEach(([k])=>refreshContentBlock(k));
    $$('[data-content-add]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.contentAdd;const select=$(`#char-content-add-${k}`);const value=select?.value;if(!value)return;ch[k]=[...(ch[k]||[]),value];persist();refreshContentBlock(k);});
    $$('[data-content-new]').forEach(btn=>btn.onclick=()=>createContentForCharacter(btn.dataset.contentNew,ch,()=>refreshContentBlock(btn.dataset.contentNew)));

    function refreshIdentity(){const inherited=$('#character-inherited-tags');if(inherited)inherited.innerHTML=tagsFor(ch).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')||'<span class="muted">None</span>';}
    function collect(){Object.assign(ch,{name:$('#n').value.trim()||'Unnamed Character',type:$('#type').value,tier:Number($('#tier').value),extraXp:Number($('#extra').value)||0,archetype:$('#archetype').value,species:$('#species').value,background:$('#background').value,tags:csv($('#tags').value),faction:$('#faction').value.trim(),role:$('#role').value.trim(),wounds:Number($('#wounds').value)||0,shock:Number($('#shock').value)||0,defense:Number($('#defense').value)||0,resilience:Number($('#resilience').value)||0,initiative:Number($('#initiative').value)||0,tokenId:$('#token-id').value||''});}
    ['type','archetype','species','background','tags'].forEach(id2=>{const el=$(`#${id2}`);el?.addEventListener('change',()=>{collect();refreshIdentity();});el?.addEventListener('input',()=>{collect();refreshIdentity();});});
    $('#save-char').onclick=()=>{collect();if(!id)state.characters.push(ch);persist();renderCharacters();};$('#builder').onclick=()=>{collect();if(!id)state.characters.push(ch);persist();state.builderCharacter=ch.id;navigate('builder');};
  }

  function createContentForCharacter(type,ch,refresh){
    const label=(TYPES.find(x=>x[0]===type)||[type,type])[1];
    const old={id:uid(type.slice(0,3)),name:'',tier:1,description:'',keywords:[],requiredTags:[],anyRequiredTags:[],forbiddenTags:[],xp:{1:0,2:0,3:0,4:0,5:0}};
    const wrap=document.createElement('div');wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal-card modal-wide character-content-modal"><div class="modal-header"><div><h2>New ${esc(label)}</h2><p class="muted small">This entry is saved to the campaign database and attached to ${esc(ch.name||'this character')}.</p></div><button type="button" id="close-character-content">×</button></div><div class="grid grid-2"><div class="field"><label>Name</label><input id="cc-name" value=""></div><div class="field"><label>Content Tier</label><select id="cc-tier">${[1,2,3,4,5].map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div><div class="field" style="grid-column:1/-1"><label>Description</label><textarea id="cc-desc" placeholder="What does this entry do?"></textarea></div><div class="field"><label>Keywords</label><input id="cc-keywords" placeholder="Combat, Veteran"></div><div class="field"><label>Required ALL Tags</label><input id="cc-required" placeholder="Human"></div><div class="field"><label>Required ANY Tags</label><input id="cc-any" placeholder="Psyker, SanctionedPsyker"></div><div class="field"><label>Forbidden Tags</label><input id="cc-forbidden" placeholder="Ministorum"></div>${[1,2,3,4,5].map(t=>`<div class="field"><label>Tier ${t} XP</label><input id="cc-xp-${t}" type="number" min="0" value="0"></div>`).join('')}</div><div class="modal-actions"><button type="button" id="cancel-character-content">Cancel</button><button type="button" class="button-primary" id="save-character-content">Create & Attach</button></div></div>`;
    document.body.appendChild(wrap);const close=()=>wrap.remove();$('#close-character-content',wrap).onclick=close;$('#cancel-character-content',wrap).onclick=close;
    $('#save-character-content',wrap).onclick=()=>{const name=$('#cc-name',wrap).value.trim();if(!name){alert('Enter a name for the new entry.');$('#cc-name',wrap).focus();return;}old.name=name;old.tier=Math.min(5,Math.max(1,Number($('#cc-tier',wrap).value)||1));old.description=$('#cc-desc',wrap).value.trim();old.keywords=csv($('#cc-keywords',wrap).value);old.requiredTags=csv($('#cc-required',wrap).value);old.anyRequiredTags=csv($('#cc-any',wrap).value);old.forbiddenTags=csv($('#cc-forbidden',wrap).value);for(const t of [1,2,3,4,5])old.xp[t]=Math.max(0,Number($(`#cc-xp-${t}`,wrap).value)||0);delete old.example;state.content[type].push(old);ch[type]=[...(ch[type]||[]),old.id];persist();close();refresh?.();};
  }

  function renderBuilder(){
    const s=$('#builder-section');
    const ch=state.characters.find(x=>x.id===state.builderCharacter)||state.characters[0];
    if(ch) state.builderCharacter=ch.id;
    if(!ch){
      s.innerHTML='<div class="section-header"><div><div class="eyebrow">Character Creation</div><h1>Builder</h1></div></div><div class="card empty-state"><h2>Create a character first</h2><button class="button-primary" id="make">'+IC('plus')+' New Character</button></div>';
      $('#make').onclick=()=>navigate('characters');
      return;
    }
    const xpClass=spent(ch)>budget(ch)?'over':'';
    s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Character Creation</div><h1>Builder</h1><p class="muted">Guided creation with tag-aware eligibility and tier XP.</p></div><div class="builder-xp ${xpClass}"><span>XP</span><strong>${spent(ch)} / ${budget(ch)}</strong></div></div>`;
    s.insertAdjacentHTML('beforeend', `<div class="card builder-character-bar"><div class="field"><label>Character</label><select id="bc">${state.characters.map(x=>`<option value="${x.id}" ${x.id===ch.id?'selected':''}>${esc(x.name)} · Tier ${x.tier}</option>`).join('')}</select></div><div class="field"><label>Tier</label><select id="bt">${[1,2,3,4,5].map(t=>`<option ${t===Number(ch.tier)?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label>Extra XP</label><input id="be" type="number" min="0" value="${Number(ch.extraXp||0)}"></div><div><label>Active tags</label><div class="tag-cloud">${tagsFor(ch).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')||'<span class="muted">None</span>'}</div></div></div>`);
    s.insertAdjacentHTML('beforeend','<div class="builder-steps"><button class="builder-step active" data-step="identity">01 <span>Identity</span></button><button class="builder-step" data-step="talents">02 <span>Talents</span></button><button class="builder-step" data-step="powers">03 <span>Powers & Prayers</span></button><button class="builder-step" data-step="gear">04 <span>Gear & Weapons</span></button><button class="builder-step" data-step="review">05 <span>Review</span></button></div><div id="builder-body"></div>');
    $('#bc').onchange=e=>{state.builderCharacter=e.target.value;persist();renderBuilder();};
    $('#bt').onchange=e=>{ch.tier=Number(e.target.value);persist();renderBuilder();};
    $('#be').onchange=e=>{ch.extraXp=Math.max(0,Number(e.target.value)||0);persist();renderBuilder();};
    let step='identity';
    $$('[data-step]').forEach(b=>b.onclick=()=>{step=b.dataset.step;$$('[data-step]').forEach(x=>x.classList.toggle('active',x===b));drawStep();});
    drawStep();

    function drawStep(){
      const body=$('#builder-body');
      if(step==='identity'){
        body.innerHTML=`<div class="card"><h2>Identity</h2><p class="muted">Identity choices supply keywords used by the content filter.</p><div class="grid grid-3"><div><strong>Archetype</strong><p>${esc(defName('archetypes',ch.archetype))||'None'}</p></div><div><strong>Species</strong><p>${esc(defName('species',ch.species))||'None'}</p></div><div><strong>Background</strong><p>${esc(defName('backgrounds',ch.background))||'None'}</p></div></div><div class="field" style="margin-top:16px"><label>Default Combat Token</label><select id="builder-token"><option value="">None</option>${state.tokenLibrary.map(t=>`<option value="${t.id}" ${t.id===ch.tokenId?'selected':''}>${esc(t.name)} · ${esc(t.type||'NPC')}</option>`).join('')}</select><span class="muted small">The token is not bound until a live combatant is created.</span></div><button class="button-primary" id="edit-id">Edit Identity</button></div>`;
        $('#edit-id').onclick=()=>navigate('characters'); $('#builder-token').onchange=e=>{ch.tokenId=e.target.value||'';persist();};
        return;
      }
      if(step==='review'){
        body.innerHTML=`<div class="card"><h2>Review</h2><div class="review-grid"><div><strong>Character</strong><span>${esc(ch.name)}</span></div><div><strong>Tier</strong><span>${ch.tier}</span></div><div><strong>XP</strong><span>${spent(ch)} / ${budget(ch)}</span></div><div><strong>Status</strong><span>${spent(ch)<=budget(ch)?'Within budget':'Over budget'}</span></div></div><h3 style="margin-top:20px">Selections</h3><div class="tag-cloud">${selectedIds(ch).map(id=>`<span class="badge accent">${esc(findName(id))}</span>`).join('')||'<span class="muted">None</span>'}</div></div>`;
        return;
      }
      const kinds=step==='talents'?['talents']:step==='powers'?['psychicAbilities','prayers']:['wargear','weapons'];
      body.innerHTML='<div class="grid grid-2" id="builder-panels"></div>';
      for(const k of kinds){
        const label=TYPES.find(x=>x[0]===k)[1];
        const panel=document.createElement('div');
        panel.className='card builder-panel';
        panel.innerHTML=`<div class="card-header"><div><h2>${label}</h2><span class="muted small">Tag-filtered content</span></div></div><div class="field"><input placeholder="Search ${label.toLowerCase()}..." data-q></div><label class="check-row"><input type="checkbox" data-eligible checked> Only eligible</label><div class="item-list" data-list></div>`;
        $('#builder-panels').appendChild(panel);
        const draw=()=>{
          const q=panel.querySelector('[data-q]').value.toLowerCase();
          const only=panel.querySelector('[data-eligible]').checked;
          let items=state.content[k].filter(x=>(x.name+' '+(x.description||'')+' '+(x.keywords||[]).join(' ')).toLowerCase().includes(q));
          if(only) items=items.filter(x=>eligible(x,ch));
          panel.querySelector('[data-list]').innerHTML=items.length?items.map(x=>{const yes=(ch[k]||[]).includes(x.id);return `<div class="item-row ${yes?'selected-row':''}"><div class="item-info"><strong>${esc(x.name)}</strong><span>Tier ${x.tier} · ${cost(x,ch.tier)} XP · ${(x.keywords||[]).join(', ')}</span><p class="muted small">${esc(x.description)}</p></div><button class="${yes?'button-danger':'button-primary'}">${yes?'Remove':'Add'}</button></div>`;}).join(''):'<div class="empty-state">No matching eligible entries.</div>';
          panel.querySelectorAll('.item-row button').forEach((b,i)=>b.onclick=()=>{const item=items[i];ch[k]??=[];const at=ch[k].indexOf(item.id);if(at>=0)ch[k].splice(at,1);else ch[k].push(item.id);persist();renderBuilder();});
        };
        panel.querySelector('[data-q]').oninput=draw;
        panel.querySelector('[data-eligible]').onchange=draw;
        draw();
      }
    }
  }

  function defName(g,id){return state.definitions[g].find(x=>x.id===id)?.name||'';}
  function findName(id){for(const [k] of TYPES){const x=state.content[k].find(y=>y.id===id);if(x)return x.name;}return id;}

  function snapshotMapForUndo(map){
    return {draw:structuredClone(map.draw||[]),fogRects:structuredClone(map.fogRects||[]),tokens:structuredClone(map.tokens||[]),panX:Number(map.panX||0),panY:Number(map.panY||0),zoom:Number(map.zoom||1)};
  }
  function pushMapUndo(map){
    map.undoStack??=[];
    map.undoStack.push(snapshotMapForUndo(map));
    if(map.undoStack.length>50)map.undoStack.shift();
  }
  function undoMap(map){
    const u=map.undoStack?.pop();
    if(!u)return false;
    map.draw=u.draw||[]; map.fogRects=u.fogRects||[]; map.tokens=u.tokens||[]; map.panX=Number(u.panX||0); map.panY=Number(u.panY||0); map.zoom=Number(u.zoom||1);
    persist({publishPlayer:false});
    renderMap();
    // Undo is a real map state transition. Publish the resulting snapshot so the
    // Player Map can queue it behind any active cinematic transaction instead of
    // silently falling out of sync.
    publishPlayerMap(map);
    return true;
  }
  function bindMapUndoShortcut(){
    if(window.__WG_MAP_UNDO_BOUND__)return;
    window.__WG_MAP_UNDO_BOUND__=true;
    document.addEventListener('keydown',e=>{
      if(!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='z')return;
      if(e.target?.matches?.('input,textarea,select,[contenteditable=\"true\"]'))return;
      const map=state.maps.find(x=>x.id===state.activeMapId);
      if(!map)return;
      e.preventDefault(); e.stopPropagation(); undoMap(map);
    },true);
  }

  function fogState(rect){
    if(rect && rect.state) return rect.state;
    return rect && rect.show ? 'show' : 'dark';
  }
  function addVisibilityRect(map,x,y,w,h,state){
    map.fogRects=map.fogRects||[];
    // New visibility regions are authoritative. Rendering clears the covered
    // area before applying the new state, so effects never stack.
    map.fogRects.push({x,y,w,h,state});
  }
  function applyVisibilityRect(ctx,r,mode,player=false){
    if(!ctx||!r)return;
    ctx.save();
    // Every new region replaces whatever visibility effect was underneath it.
    ctx.globalCompositeOperation='destination-out';
    ctx.clearRect(r.x,r.y,r.w,r.h);
    if(mode!=='show'){
      ctx.globalCompositeOperation='source-over';
      if(player){
        ctx.fillStyle='#000';
      }else if(mode==='fog'){
        ctx.fillStyle='rgba(0,0,0,.58)';
      }else{
        ctx.fillStyle='#000';
      }
      ctx.fillRect(r.x,r.y,r.w,r.h);
    }
    ctx.restore();
  }
  // SOUNDS / AUDIO SCENE SYSTEM
  const AUDIO_DB_NAME='kousha-table-audio-v1';
  let audioDbPromise=null;
  const soundRuntime=new Map();
  let activeSoundMapId=null;
  function stopAllSoundRuntime(){for(const id of [...soundRuntime.keys()])stopRuntime(id);}
  const SOUND_LIBRARIES=[['backgrounds','Background Music & Sounds','Long-form ambience, music and environmental beds.'],['effects','Sound Effects','One-shot impacts, weapons, doors, creatures and other effects.'],['speeches','Pre-made Speeches','Prepared narration, announcements, dialogue and voice lines.']];
  function openAudioDb(){
    if(audioDbPromise)return audioDbPromise;
    audioDbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(AUDIO_DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('blobs'))db.createObjectStore('blobs');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    return audioDbPromise;
  }
  async function audioBlobPut(id,blob){const db=await openAudioDb();return new Promise((res,rej)=>{const tx=db.transaction('blobs','readwrite');tx.objectStore('blobs').put(blob,id);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
  async function audioBlobGet(id){const db=await openAudioDb();return new Promise((res,rej)=>{const tx=db.transaction('blobs','readonly');const q=tx.objectStore('blobs').get(id);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error);});}
  async function audioBlobDelete(id){try{const db=await openAudioDb();return new Promise((res,rej)=>{const tx=db.transaction('blobs','readwrite');tx.objectStore('blobs').delete(id);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}catch(e){return false;}}
  function allSounds(){return SOUND_LIBRARIES.flatMap(([type])=>(state.soundLibraries?.[type]||[]).map(x=>({...x,library:type})))}
  function soundMeta(id,library){return (state.soundLibraries?.[library]||[]).find(x=>x.id===id)||null;}
  function soundName(layer){return soundMeta(layer.soundId,layer.library)?.name||'No sound loaded';}
  function ensureSoundLayer(map){map.soundLayers??=[];return map.soundLayers;}
  function stopRuntime(id){const r=soundRuntime.get(id);if(!r)return;r.audio.pause();if(r.url)URL.revokeObjectURL(r.url);soundRuntime.delete(id);}
  function cleanupSoundRuntime(map){const ids=new Set(ensureSoundLayer(map).map(x=>x.id));for(const id of [...soundRuntime.keys()])if(!ids.has(id))stopRuntime(id);}
  async function ensureRuntimeAudio(layer){
    let r=soundRuntime.get(layer.id);
    if(r?.audio && r.soundId===layer.soundId && r.library===layer.library)return r.audio;
    if(r)stopRuntime(layer.id);
    const meta=soundMeta(layer.soundId,layer.library);if(!meta)return null;
    try{const blob=await audioBlobGet(meta.id);if(!blob)return null;const url=URL.createObjectURL(blob);const audio=new Audio(url);audio.preload='auto';audio.loop=!!layer.loop;audio.volume=Math.max(0,Math.min(1,Number(layer.volume??1)));audio.onended=()=>{if(!audio.loop){layer.playing=false;const b=document.querySelector(`[data-sound-play=\"${CSS.escape(layer.id)}\"]`);if(b)b.textContent='▶';}};r={audio,url,soundId:layer.soundId,library:layer.library};soundRuntime.set(layer.id,r);return audio;}catch(e){console.error('Audio load failed',e);return null;}
  }
  async function setSoundPlaying(map,layer,playing){
    layer.playing=!!playing;
    if(!layer.soundId){layer.playing=false;toast('Load a sound onto this layer first.');return;}
    const audio=await ensureRuntimeAudio(layer);if(!audio){layer.playing=false;toast('Could not load this audio file.');return;}
    audio.loop=!!layer.loop;audio.volume=Math.max(0,Math.min(1,Number(layer.volume??1)));
    if(layer.playing){try{await audio.play();}catch(e){layer.playing=false;toast('The browser blocked playback. Press Play again.');}}else audio.pause();
    const b=document.querySelector(`[data-sound-play=\"${CSS.escape(layer.id)}\"]`);if(b)b.textContent=layer.playing?'❚❚':'▶';
    persist();
  }
  function updateSoundControl(map,layer){const r=soundRuntime.get(layer.id);if(r?.audio){r.audio.volume=Math.max(0,Math.min(1,Number(layer.volume??1)));r.audio.loop=!!layer.loop;}const row=document.querySelector(`[data-sound-layer=\"${CSS.escape(layer.id)}\"]`);if(!row)return;const v=row.querySelector('[data-sound-volume]');if(v)v.value=Math.round(Number(layer.volume??1)*100);const loop=row.querySelector('[data-sound-loop]');if(loop)loop.checked=!!layer.loop;const p=row.querySelector('[data-sound-play]');if(p)p.textContent=layer.playing?'❚❚':'▶';}
  function renderSounds(){
    const s=$('#sounds-section');
    s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Audio Department</div><h1>Sounds</h1><p class="muted">Store your campaign audio once, then layer it into scenes from the Map workspace.</p></div><div class="toolbar"><button id="sounds-refresh">Refresh Libraries</button></div></div><div class="sounds-library-grid">${SOUND_LIBRARIES.map(([type,title,desc])=>`<section class="card sound-library-card" data-sound-library="${type}"><div class="sound-library-header"><div><div class="eyebrow">Library</div><h2>${title}</h2><p class="muted small">${desc}</p></div><label class="button-primary sound-upload-label">${IC('plus')} Add Audio<input type="file" accept="audio/*" multiple data-sound-upload="${type}" hidden></label></div><div class="sound-library-list">${(state.soundLibraries?.[type]||[]).length?(state.soundLibraries[type].map(x=>`<div class="sound-library-item"><div class="sound-file-icon">${IC('volume')}</div><div class="sound-file-main"><strong>${esc(x.name)}</strong><span class="muted small">${esc(x.mime||'audio')} · ${formatBytes(x.size||0)}</span></div><button data-sound-preview="${x.id}" data-sound-library="${type}" title="Preview">▶</button><button data-sound-delete="${x.id}" data-sound-library="${type}" class="button-danger" title="Delete">${IC('trash')}</button></div>`).join('')):`<div class="empty-state sound-library-empty"><p>No files in this library yet.</p></div>`}</div></section>`).join('')}</div><section class="card sounds-mixer-mirror"><div class="section-header" style="margin-bottom:10px"><div><div class="eyebrow">Live Scene</div><h2>Sound Mixer</h2><p class="muted small">A mirror of the Map mixer. Changes here affect the selected map immediately.</p></div></div><div id="sounds-mixer-mirror"></div></section>`;
    $$('[data-sound-upload]',s).forEach(input=>input.onchange=async e=>{for(const file of [...e.target.files||[]])await addSoundFile(e.target.dataset.soundUpload,file);e.target.value='';renderSounds();});
    $$('[data-sound-delete]',s).forEach(b=>b.onclick=async()=>{const type=b.dataset.soundLibrary,id=b.dataset.soundDelete;const x=soundMeta(id,type);if(!x)return;if(!confirm(`Delete "${x.name}" from this library? Layers using it will become unloaded.`))return;state.soundLibraries[type]=state.soundLibraries[type].filter(v=>v.id!==id);await audioBlobDelete(id);for(const m of state.maps||[])for(const l of ensureSoundLayer(m))if(l.soundId===id){stopRuntime(l.id);l.soundId='';l.playing=false;}persist();renderSounds();});
    $$('[data-sound-preview]',s).forEach(b=>b.onclick=async()=>{const meta=soundMeta(b.dataset.soundPreview,b.dataset.soundLibrary);if(!meta)return;const blob=await audioBlobGet(meta.id);if(!blob){toast('Audio data is missing.');return;}const a=new Audio(URL.createObjectURL(blob));a.onended=()=>URL.revokeObjectURL(a.src);a.play().catch(()=>toast('Playback was blocked.'))});
    $('#sounds-refresh').onclick=()=>renderSounds();
    const active=state.maps.find(m=>m.id===state.activeMapId)||state.maps[0]; if(active){renderSoundMixer(active,'sounds-mixer-mirror',{mirror:true});}
  }
  function formatBytes(n){const v=Number(n)||0;if(v<1024)return `${v} B`;if(v<1048576)return `${(v/1024).toFixed(1)} KB`;if(v<1073741824)return `${(v/1048576).toFixed(1)} MB`;return `${(v/1073741824).toFixed(1)} GB`;}
  async function addSoundFile(type,file){
    if(!file?.type?.startsWith('audio/')){toast(`${file?.name||'File'} is not an audio file.`);return;}
    const id=uid('sound');
    try{await audioBlobPut(id,file);state.soundLibraries[type].push({id,name:file.name,mime:file.type,size:file.size,createdAt:Date.now()});persist();toast(`Added ${file.name}`);}catch(e){console.error(e);toast('Could not store that audio file. Your browser may have run out of IndexedDB space.');}
  }
  function openSoundPicker(map,layer,onLoaded){
    const root=$('#modal-root');
    const render=()=>{root.innerHTML=`<div class="modal-backdrop"><div class="modal sound-picker-modal"><div class="modal-header"><div><div class="eyebrow">Audio Assignment</div><h2>Load Sound</h2><p class="muted small">Choose a file from one of the three campaign libraries.</p></div><button id="sound-picker-close">✕</button></div><div class="sound-picker-tabs">${SOUND_LIBRARIES.map(([type,title])=>`<button data-sound-tab="${type}" class="${(root.dataset.soundTab||'backgrounds')===type?'active':''}">${title}</button>`).join('')}</div><div class="sound-picker-list">${(state.soundLibraries[root.dataset.soundTab||'backgrounds']||[]).map(x=>`<button class="sound-picker-item" data-pick-sound="${x.id}" data-pick-library="${root.dataset.soundTab||'backgrounds'}"><span>${IC('volume')}</span><span><strong>${esc(x.name)}</strong><small>${formatBytes(x.size||0)}</small></span><span>Load</span></button>`).join('')||'<div class="empty-state"><p>No audio in this library.</p><button id="sound-picker-go-library">Open Sounds Library</button></div>'}</div></div></div>`;
      root.dataset.soundTab=root.dataset.soundTab||'backgrounds';
      $('#sound-picker-close').onclick=()=>root.innerHTML='';
      $$('[data-sound-tab]',root).forEach(b=>b.onclick=()=>{root.dataset.soundTab=b.dataset.soundTab;render();});
      $$('[data-pick-sound]',root).forEach(b=>b.onclick=()=>{stopRuntime(layer.id);layer.soundId=b.dataset.pickSound;layer.library=b.dataset.pickLibrary;layer.name=soundName(layer);layer.playing=false;persist();root.innerHTML='';onLoaded?.();});
      $('#sound-picker-go-library')?.addEventListener('click',()=>{root.innerHTML='';navigate('sounds');});
    };render();
  }
  function renderSoundMixer(map,targetId='sound-mixer-window',options={}){
    ensureSoundLayer(map);cleanupSoundRuntime(map);
    const box=document.getElementById(targetId);if(!box)return;
    const mirror=!!options.mirror;
    box.classList.add('sound-mixer-window');
    box.innerHTML=`<div class="floating-panel-drag-handle workspace-chrome sound-mixer-header" data-drag-handle="sound-mixer" title="Drag from here">${IC('grip','ic-grip')}<span class="workspace-title">Sound Mixer</span><span class="sound-mixer-count">${map.soundLayers.length} Layers</span><button type="button" class="workspace-minimize" data-sound-minimize aria-label="Minimize Sound Mixer" title="Minimize">−</button><button type="button" class="sound-mixer-close" data-sound-close aria-label="Hide Sound Mixer" title="Hide">×</button></div><div class="sound-mixer-body"><div class="sound-mixer-actions"><button class="button-primary" data-add-sound-layer>${IC('plus')} Add Layer</button>${mirror?`<label class="sound-map-select">Map <select data-sound-map-select>${state.maps.filter(m=>m.active!==false||m.id===map.id).map(m=>`<option value="${m.id}" ${m.id===map.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label>`:''}<span class="muted small">Layers play independently and can overlap.</span></div><div class="sound-layer-list">${map.soundLayers.length?map.soundLayers.map((l,i)=>`<div class="sound-layer-row ${l.playing?'is-playing':''}" data-sound-layer="${l.id}"><div class="sound-layer-order"><button data-layer-up="${l.id}" ${i===0?'disabled':''} title="Move up">▲</button><span>${i+1}</span><button data-layer-down="${l.id}" ${i===map.soundLayers.length-1?'disabled':''} title="Move down">▼</button></div><button class="sound-layer-play" data-sound-play="${l.id}" title="Play / Pause">${l.playing?'❚❚':'▶'}</button><div class="sound-layer-info"><strong>${esc(soundName(l))}</strong><span class="muted small">${l.soundId?esc((l.library||'').replaceAll('_',' ')):'Empty layer'}</span></div><button data-sound-load="${l.id}" title="Load from library">Load</button><label class="sound-volume"><span>Vol</span><input type="range" min="0" max="100" value="${Math.round(Number(l.volume??1)*100)}" data-sound-volume="${l.id}"></label><label class="sound-loop"><input type="checkbox" data-sound-loop="${l.id}" ${l.loop?'checked':''}> Loop</label><button data-layer-remove="${l.id}" class="button-danger" title="Remove layer">${IC('trash')}</button></div>`).join(''):`<div class="empty-state"><h3>No sound layers</h3><p>Add a layer, then load music, ambience, an effect or speech onto it.</p></div>`}</div></div>`;
    box.querySelectorAll('.panel-resize-handle').forEach(h=>h.remove()); box.insertAdjacentHTML('beforeend',`<div class="panel-resize-handle edge-left" data-resize-handle="sound-left" data-resize-dir="w"></div><div class="panel-resize-handle edge-right" data-resize-handle="sound-right" data-resize-dir="e"></div><div class="panel-resize-handle edge-top" data-resize-handle="sound-top" data-resize-dir="n"></div><div class="panel-resize-handle edge-bottom" data-resize-handle="sound-bottom" data-resize-dir="s"></div><div class="panel-resize-handle corner-nw" data-resize-handle="sound-nw" data-resize-dir="nw"></div><div class="panel-resize-handle corner-ne" data-resize-handle="sound-ne" data-resize-dir="ne"></div><div class="panel-resize-handle corner-sw" data-resize-handle="sound-sw" data-resize-dir="sw"></div><div class="panel-resize-handle corner-se" data-resize-handle="sound-se" data-resize-dir="se"></div>`);
    box.classList.toggle('is-hidden-extension',mirror?false:map.soundMixerVisible===false);
    box.classList.toggle('is-minimized',map.soundMixerMinimized===true);
    const minBtn=box.querySelector('[data-sound-minimize]');if(minBtn){minBtn.textContent=map.soundMixerMinimized?'+':'−';minBtn.title=map.soundMixerMinimized?'Restore':'Minimize';}
    box.querySelector('[data-add-sound-layer]').onclick=()=>{const l={id:uid('layer'),soundId:'',library:'backgrounds',name:'',volume:1,loop:false,playing:false};map.soundLayers.push(l);persist();renderSoundMixer(map,targetId,options);openSoundPicker(map,l);};
    box.querySelector('[data-sound-minimize]').onclick=e=>{e.preventDefault();e.stopPropagation();map.soundMixerMinimized=!map.soundMixerMinimized;persist();renderSoundMixer(map,targetId,options);};
    box.querySelector('[data-sound-close]').onclick=e=>{e.preventDefault();e.stopPropagation();if(mirror){box.hidden=true;}else{map.soundMixerVisible=false;persist();renderSoundMixer(map,targetId,options);}};
    box.querySelector('[data-sound-map-select]')?.addEventListener('change',e=>{const next=state.maps.find(m=>m.id===e.target.value);if(next){state.activeMapId=next.id;persist();stopAllSoundRuntime();activeSoundMapId=next.id;renderSounds();}});
    $$('[data-layer-remove]',box).forEach(b=>b.onclick=()=>{const id=b.dataset.layerRemove;stopRuntime(id);map.soundLayers=map.soundLayers.filter(x=>x.id!==id);persist();renderSoundMixer(map,targetId,options);});
    $$('[data-sound-load]',box).forEach(b=>b.onclick=()=>{const l=map.soundLayers.find(x=>x.id===b.dataset.soundLoad);if(l)openSoundPicker(map,l,()=>renderSoundMixer(map,targetId,options));});
    $$('[data-sound-play]',box).forEach(b=>b.onclick=()=>{const l=map.soundLayers.find(x=>x.id===b.dataset.soundPlay);if(l)setSoundPlaying(map,l,!l.playing);});
    $$('[data-sound-volume]',box).forEach(b=>b.oninput=()=>{const l=map.soundLayers.find(x=>x.id===b.dataset.soundVolume);if(!l)return;l.volume=Number(b.value)/100;updateSoundControl(map,l);});
    $$('[data-sound-loop]',box).forEach(b=>b.onchange=()=>{const l=map.soundLayers.find(x=>x.id===b.dataset.soundLoop);if(!l)return;l.loop=b.checked;updateSoundControl(map,l);persist();});
    $$('[data-layer-up]',box).forEach(b=>b.onclick=()=>moveSoundLayer(map,b.dataset.layerUp,-1,targetId,options));
    $$('[data-layer-down]',box).forEach(b=>b.onclick=()=>moveSoundLayer(map,b.dataset.layerDown,1,targetId,options));
    if(!mirror && targetId==='sound-mixer-window') bindSoundMixerWorkspace(map);
  }

  function bindSoundMixerWorkspace(map){
    const box=$('#sound-mixer-window'); if(!box)return;
    if(!map.soundMixerPos){const host=box.offsetParent||document.getElementById('map-vtt');map.soundMixerPos={x:Math.max(8,((host?.clientWidth||900)-620)/2),y:Math.max(8,(host?.clientHeight||600)-310)};}
    if(!map.soundMixerSize)map.soundMixerSize={width:620,height:260};
    applyPanelSize(box,map.soundMixerSize);
    applyFloatingPanelPosition(box,map.soundMixerPos);
    setupFloatingPanelDrag(box,box.querySelector('[data-drag-handle="sound-mixer"]'),map,'soundMixerPos');
    $$('[data-resize-handle]',box).forEach(h=>setupResizablePanel(box,h,map,'soundMixerSize',h.dataset.resizeDir||'se'));
    box.classList.toggle('is-minimized',map.soundMixerMinimized===true);
    if(map.soundMixerMinimized){box.style.setProperty('height','38px','important');box.style.setProperty('min-height','38px','important');box.style.setProperty('max-height','38px','important');}else{const h=Number(map.soundMixerSize?.height)||260;box.style.setProperty('height',Math.max(130,h)+'px','important');box.style.setProperty('min-height','130px','important');box.style.removeProperty('max-height');}
    if(!box.dataset.soundWorkspaceBound){box.dataset.soundWorkspaceBound='1';box.addEventListener('pointerdown',()=>bringWorkspaceToFront(box),true);}
  }

  function moveSoundLayer(map,id,delta,targetId='sound-mixer-window',options={}){const i=map.soundLayers.findIndex(x=>x.id===id),j=i+delta;if(i<0||j<0||j>=map.soundLayers.length)return;[map.soundLayers[i],map.soundLayers[j]]=[map.soundLayers[j],map.soundLayers[i]];persist();renderSoundMixer(map,targetId,options);}

  function renderMap(){
    const s=$('#map-section');
    if(!state.maps.length){
      s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Game Room</div><h1>Game Room</h1><p class="muted">Configure your game room workspaces, then open a battlefield from the Map Library.</p></div><div class="toolbar"><button class="button-primary" id="new-map">${IC('plus')} New Map</button><button id="token-library">${IC('shield')} Token Library</button><button id="map-library">${IC('map')} Map Library</button><button id="edit-game-room">${IC('cog')} Edit Game Room</button></div></div><div class="card empty-state"><h2>No maps yet</h2><p>Upload your first map to begin.</p><button class="button-primary" id="empty-new-map">Upload Map</button></div>`;
      $('#new-map').onclick=()=>createMap(); $('#empty-new-map').onclick=()=>createMap(); $('#token-library').onclick=tokenLibraryModal; $('#map-library').onclick=mapLibraryModal; return;
    }
    const map=state.maps.find(x=>x.id===state.activeMapId)||state.maps[0]; state.activeMapId=map.id; if(activeSoundMapId && activeSoundMapId!==map.id)stopAllSoundRuntime(); activeSoundMapId=map.id;
    s.innerHTML=`<div class="section-header map-header"><div><div class="eyebrow">Game Room</div><h1>${esc(map.name)}</h1><div class="combat-status"><span class="badge accent">Grid ${map.grid}px</span><span class="badge">Zoom ${Math.round((Number(map.zoom)||1)*100)}%</span><span class="badge">${map.tokens.length} Tokens</span><span class="badge">${map.fog.length} Fog strokes</span></div></div><div class="toolbar"><button id="open-combat-window">${IC('sword')} Combat Tracker</button><button id="open-player-map">${IC('eye')} Player Map</button><button id="fullscreen-map">${IC('expand')} Fullscreen</button><select id="map-select">${state.maps.filter(m=>m.active!==false||m.id===map.id).map(m=>`<option value="${m.id}" ${m.id===map.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select><button id="rename-map">${IC('quill')} Rename</button><button class="button-primary" id="new-map">${IC('plus')} New Map</button><button id="token-library">${IC('shield')} Token Library</button><button id="map-library">${IC('map')} Map Library</button><button id="edit-game-room">${IC('cog')} Edit Game Room</button><button class="button-danger" id="delete-map">${IC('trash')} Delete Map</button></div></div>
      <div id="map-vtt" class="map-workspace"><aside id="sound-mixer-window" class="sound-mixer-window workspace-panel"></aside><button class="map-toolbar-toggle" id="map-toolbar-toggle" title="Show / hide toolbar">${IC('menu')} Tools</button><aside class="map-toolbar"><div class="floating-panel-drag-handle workspace-chrome" data-drag-handle="toolbar" title="Drag from here">${IC('grip','ic-grip')} <span class="workspace-title">Tools</span><button type="button" class="workspace-minimize" data-workspace-minimize="toolbar" aria-label="Minimize Tools" title="Minimize">−</button></div><div class="workspace-panel-body toolbar-body"><div class="tool-group toolbar-settings"><div class="tool-title">Interface</div><button id="toolbar-hide">Hide Toolbar</button><label class="field"><span>Toolbar Opacity <strong id="toolbar-opacity-label">${Math.round((map.toolbarOpacity??0.94)*100)}%</strong></span><input id="toolbar-opacity" type="range" min="20" max="100" value="${Math.round((map.toolbarOpacity??0.94)*100)}"></label><label class="check-row"><input id="fog-toggle" type="checkbox" ${map.fogEnabled!==false?"checked":""}> Fog of War</label><label class="check-row"><input id="initiative-panel-toggle" type="checkbox" ${map.initiativePanelVisible!==false?"checked":""}> Initiative Panel</label><label class="check-row"><input id="player-auto-update" type="checkbox" ${map.playerAutoUpdate?"checked":""}> Auto Update Player Map</label><button id="refresh-player-map">${IC('refresh')} Refresh Player Map</button><button id="sound-mixer-toggle">${IC('volume')} Sound Mixer</button></div><div class="tool-group visibility-tool-group"><div class="tool-title">Tools</div><div class="visibility-tool-grid"><button class="map-tool active" data-tool="none">${IC('cursor')} Select / Move Tokens</button><button class="map-tool pan-gesture-tool" data-tool="pan" title="Hold Ctrl and drag to pan">${IC('pan')} Pan Map (Ctrl)</button><button class="map-tool" data-tool="draw">${IC('pencil')} Draw</button><button class="map-tool visibility-fog" data-tool="fog">${IC('fog')} Fog</button><button class="map-tool visibility-show" data-tool="show">${IC('sun')} Show</button><button class="map-tool visibility-dark" data-tool="hide">${IC('dark')} Dark / Hide</button><button class="map-tool" data-tool="erase">${IC('eraser')} Erase Drawing</button></div><div class="brush-controls"><label class="field"><span>Brush / Eraser Size <strong id="brush-size-label">${map.brushSize||20}px</strong></span><input id="brush-size" type="range" min="2" max="150" step="1" value="${map.brushSize||20}"></label><label class="field draw-color-control" id="draw-color-control" style="display:${map.tool==='draw'?'grid':'none'}"><span>Draw Color</span><span class="draw-color-picker-row"><input id="draw-color" type="color" value="${esc(map.drawColor||'#ebd291')}"><output id="draw-color-value">${esc(map.drawColor||'#ebd291')}</output></span></label></div></div><div class="tool-group"><div class="tool-title">Map</div><label class="field"><span>Grid Size</span><input id="grid-size" type="number" min="10" max="200" value="${map.grid}"></label><label class="check-row"><input id="grid-toggle" type="checkbox" ${map.gridVisible!==false?'checked':''}> Show Grid</label><label class="check-row"><input id="player-view" type="checkbox" ${map.playerView?'checked':''}> Player View</label><div class="zoom-controls"><button id="zoom-out">−</button><span id="zoom-label">${Math.round((Number(map.zoom)||1)*100)}%</span><button id="zoom-in">+</button><button id="zoom-reset">100%</button></div><p class="muted small">Hold Ctrl and use the mouse wheel over the map to zoom.</p><button id="fit-map">Fit Map</button></div><div class="tool-group"><div class="tool-title">Tokens</div><button class="button-primary" id="add-token">${IC('plus')} Add Token</button><button id="present-tokens">${IC('shield')} Present Tokens</button><p class="muted small">Select / Move Tokens moves tokens. Click and drag a token directly on the map. Hold Ctrl while dragging anywhere on the map to pan. Pan never becomes a sticky mode.</p></div><div class="tool-group"><div class="tool-title">GM Visibility</div><p class="muted small">Fog creates an opaque unrevealed mask. Show cuts a reveal window through the mask. Dark creates a black area. Players only receive revealed texture.</p><button id="fog-entire-map">Fog Entire Map</button><button id="hide-entire-map">Dark Entire Map</button><button id="show-entire-map">Show Entire Map</button></div></div><div class="panel-resize-handle edge-left" data-resize-handle="toolbar-left" data-resize-dir="w"></div><div class="panel-resize-handle edge-right" data-resize-handle="toolbar-right" data-resize-dir="e"></div><div class="panel-resize-handle edge-top" data-resize-handle="toolbar-top" data-resize-dir="n"></div><div class="panel-resize-handle edge-bottom" data-resize-handle="toolbar-bottom" data-resize-dir="s"></div><div class="panel-resize-handle corner-nw" data-resize-handle="toolbar-nw" data-resize-dir="nw"></div><div class="panel-resize-handle corner-ne" data-resize-handle="toolbar-ne" data-resize-dir="ne"></div><div class="panel-resize-handle corner-sw" data-resize-handle="toolbar-sw" data-resize-dir="sw"></div><div class="panel-resize-handle corner-se" data-resize-handle="toolbar-se" data-resize-dir="se"></div></aside><div id="map-stage-wrap" class="map-stage-wrap"><div id="map-stage" class="map-stage ${map.gridVisible===false?'no-grid':''}" style="--grid:${map.grid}px;--zoom:${Number(map.zoom)||1}"><img id="map-image" class="map-image-layer" alt="" draggable="false"><canvas id="map-draw"></canvas><canvas id="map-fog"></canvas><div id="map-tokens"></div></div><aside id="initiative-panel" class="initiative-panel ${map.initiativePanelVisible===false?'is-collapsed':''}"><div class="floating-panel-drag-handle initiative-drag-handle workspace-chrome" data-drag-handle="initiative" title="Drag from here">${IC('grip','ic-grip')} <span class="workspace-title">Combat Tracker</span><button type="button" class="workspace-minimize" data-workspace-minimize="initiative" aria-label="Minimize Combat Tracker" title="Minimize">−</button></div><div class="workspace-panel-body initiative-body"><div class="initiative-panel-header"><div><div class="tool-title">Combat Tracker</div><strong>${esc(state.combat.name||'Current Encounter')}</strong></div><button id="initiative-sort" class="tracker-header-action" title="Toggle initiative sort order">Sort ${(state.combat?.sortInitiativeDirection||'desc')==='asc'?'↑':'↓'}</button><button id="manage-combat-panel" title="Add or remove combatants">Manage Combat</button><button id="reset-combat-panel" class="button-danger" title="End the current battle">End Battle</button><button id="initiative-panel-close" title="Collapse initiative panel">›</button></div><div class="initiative-panel-round">Round ${Number(state.combat.round||1)} · ${state.combat.active?'Active':'Not Started'}</div><div id="initiative-panel-list" class="initiative-panel-list" role="region" aria-label="Combat tracker list" tabindex="0"></div></div><div class="panel-resize-handle edge-left" data-resize-handle="initiative-left" data-resize-dir="w"></div><div class="panel-resize-handle edge-right" data-resize-handle="initiative-right" data-resize-dir="e"></div><div class="panel-resize-handle edge-top" data-resize-handle="initiative-top" data-resize-dir="n"></div><div class="panel-resize-handle edge-bottom" data-resize-handle="initiative-bottom" data-resize-dir="s"></div><div class="panel-resize-handle corner-nw" data-resize-handle="initiative-nw" data-resize-dir="nw"></div><div class="panel-resize-handle corner-ne" data-resize-handle="initiative-ne" data-resize-dir="ne"></div><div class="panel-resize-handle corner-sw" data-resize-handle="initiative-sw" data-resize-dir="sw"></div><div class="panel-resize-handle corner-se" data-resize-handle="initiative-se" data-resize-dir="se"></div></aside><button id="initiative-panel-tab" class="initiative-panel-tab" title="Show combat tracker">‹ Combat</button></div>`;
    $('#fullscreen-map').onclick=()=>toggleMapFullscreen();
    $('#edit-game-room').onclick=()=>openGameRoomEditor(map);
    $('#reset-combat-panel').onclick=()=>{if(confirm('End this battle? This will remove the live combatants and their placed tokens. Your saved Token Library and Characters are not deleted.')){state.combat.combatants=[];state.combat.active=false;state.combat.round=1;state.combat.turn=0;map.tokens=[];persist();renderMapTokens(map);renderInitiativePanel(map);renderMap();}};
    $('#open-combat-window').onclick=()=>openCombatWindow();
    $('#open-player-map').onclick=()=>openPlayerMap(map);
    const toolbar=$('.map-toolbar'), vtt=$('#map-vtt'), leftRail=$('.map-left-rail'), rightRail=$('.map-right-rail'), stageWrap=$('#map-stage-wrap'), initiative=$('#initiative-panel');
    // Suppress layout transitions while the three windows receive their persisted/default
    // dimensions. Without this lock, a legacy CSS width can animate down from 100% and a
    // ResizeObserver can mistake that transient size for the real window, clamping its x/y.
    vtt?.classList.add('workspace-initializing');
    // Build three true sibling workspaces. The Map Viewer gets its own outer window so its title bar,
    // resize handles, and drag surface cannot be clipped or intertwined with the map content.
    let viewer=vtt?.querySelector('.map-viewer-window');
    if(vtt&&toolbar&&stageWrap&&initiative){
      vtt.appendChild(toolbar);
      vtt.appendChild(initiative);
      const toggle=$('#map-toolbar-toggle'); if(toggle) vtt.appendChild(toggle);
      const initiativeTab=$('#initiative-panel-tab'); if(initiativeTab) vtt.appendChild(initiativeTab);
      if(leftRail) leftRail.remove();
      if(rightRail) rightRail.remove();
      if(!viewer){
        viewer=document.createElement('section');
        viewer.className='map-viewer-window';
        viewer.innerHTML=`<div class="floating-panel-drag-handle map-viewer-drag-handle workspace-chrome" data-drag-handle="map-viewer" title="Drag map viewer">${IC('grip','ic-grip')} <span class="workspace-title">Map Viewer</span><button type="button" class="workspace-minimize" data-workspace-minimize="map-viewer" aria-label="Minimize Map Viewer" title="Minimize">−</button></div>`;
        vtt.appendChild(viewer);
        viewer.appendChild(stageWrap);
        viewer.insertAdjacentHTML('beforeend',`<div class="panel-resize-handle edge-left" data-resize-handle="map-left" data-resize-dir="w"></div><div class="panel-resize-handle edge-right" data-resize-handle="map-right" data-resize-dir="e"></div><div class="panel-resize-handle edge-top" data-resize-handle="map-top" data-resize-dir="n"></div><div class="panel-resize-handle edge-bottom" data-resize-handle="map-bottom" data-resize-dir="s"></div><div class="panel-resize-handle corner-nw" data-resize-handle="map-nw" data-resize-dir="nw"></div><div class="panel-resize-handle corner-ne" data-resize-handle="map-ne" data-resize-dir="ne"></div><div class="panel-resize-handle corner-sw" data-resize-handle="map-sw" data-resize-dir="sw"></div><div class="panel-resize-handle corner-se" data-resize-handle="map-se" data-resize-dir="se"></div>`);
      } else if(stageWrap.parentElement!==viewer){
        viewer.appendChild(stageWrap);
      }
    }
    renderSoundMixer(map);
    bindSoundMixerWorkspace(map);
    if($('#sound-mixer-window')) $('#sound-mixer-window').hidden=map.soundMixerVisible===false;
    const toggle=$('#sound-mixer-toggle'); if(toggle) toggle.onclick=()=>{map.soundMixerVisible=map.soundMixerVisible===false;persist();renderSoundMixer(map);};
    const setToolbarVisible=visible=>{map.toolbarVisible=visible;toolbar.classList.toggle('toolbar-hidden',!visible);const tg=$('#map-toolbar-toggle');tg.innerHTML=IC('menu')+' Show Tools';tg.style.setProperty('display',visible?'none':'block','important');tg.style.setProperty('width','auto','important');persist();};
    $('#map-toolbar-toggle').onclick=()=>setToolbarVisible(!map.toolbarVisible);
    $('#toolbar-hide').onclick=()=>setToolbarVisible(false);
    $('#toolbar-opacity').oninput=e=>{const v=Math.max(.2,Math.min(1,Number(e.target.value)/100));map.toolbarOpacity=v;toolbar.style.setProperty('--toolbar-opacity',v);$('#toolbar-opacity-label').textContent=Math.round(v*100)+'%';};
    $('#toolbar-opacity').onchange=()=>persist();
    $('#fog-toggle').onchange=e=>{map.fogEnabled=e.target.checked;drawMapCanvases(map);persist();}; $('#player-auto-update').onchange=e=>{map.playerAutoUpdate=e.target.checked;persist();}; $('#refresh-player-map').onclick=()=>{persist({publishPlayer:false}); const snapshot=structuredClone(map); const combatSnapshot=structuredClone(state.combat); const msg={type:'playerRefresh',revision:Date.now()+Math.random(),mapId:map.id,map:snapshot,combat:combatSnapshot,force:true}; window.__WG_LAST_PLAYER_REFRESH__=msg; try{syncChannel?.postMessage(msg);}catch(e){} try{localStorage.setItem(PLAYER_SYNC_KEY,JSON.stringify(msg));}catch(e){} if(PLAYER_MODE && MAP_WINDOW_ID===map.id){acceptPlayerRefresh(msg);} }; $('#initiative-panel-toggle').onchange=e=>{map.initiativePanelVisible=e.target.checked;renderInitiativePanel(map);persist();}; $('#initiative-panel-close').onclick=()=>{map.initiativePanelVisible=false;persist();renderInitiativePanel(map);}; $('#initiative-panel-tab').onclick=()=>{map.initiativePanelVisible=true;persist();renderInitiativePanel(map);}; $('#manage-combat-panel').onclick=()=>openCombatManager();
    toolbar.style.setProperty('--toolbar-opacity',Number(map.toolbarOpacity??.94));
    viewer=vtt?.querySelector('.map-viewer-window')||stageWrap;
    const VW=vtt?.clientWidth||window.innerWidth, VH=vtt?.clientHeight||window.innerHeight, G=14, TW=300, IW=310;
    const dTool={w:TW,h:Math.max(260,VH-2*G)}, dInit={w:IW,h:Math.min(640,Math.max(260,VH-2*G))};
    const dView={w:Math.max(320,VW-TW-IW-4*G),h:Math.max(320,VH-2*G)};
    const hadWorkspaceLayout=!!(map.toolbarPos&&map.toolbarSize&&map.mapViewerPos&&map.mapViewerSize&&map.initiativePanelPos&&map.initiativePanelSize);
    const defaultToolbarPos={x:G,y:G};
    const defaultViewerPos={x:G+TW+G,y:G};
    const defaultInitiativePos={x:Math.max(G,VW-IW-G),y:G};
    // Give each new layout a concrete position before applying CSS. This prevents legacy
    // absolute/inset rules from collapsing an uninitialized window onto another panel.
    if(!map.toolbarPos) map.toolbarPos={...defaultToolbarPos};
    if(!map.mapViewerPos) map.mapViewerPos={...defaultViewerPos};
    if(!map.initiativePanelPos) map.initiativePanelPos={...defaultInitiativePos};
    if(!map.toolbarSize) map.toolbarSize={width:dTool.w,height:dTool.h};
    if(!map.mapViewerSize) map.mapViewerSize={width:dView.w,height:dView.h};
    if(!map.initiativePanelSize) map.initiativePanelSize={width:dInit.w,height:dInit.h};
    applyPanelSize(toolbar,map.toolbarSize);
    applyPanelSize(viewer,map.mapViewerSize);
    applyPanelSize(initiative,map.initiativePanelSize);
    applyFloatingPanelPosition(toolbar,map.toolbarPos);
    applyFloatingPanelPosition(viewer,map.mapViewerPos);
    applyFloatingPanelPosition(initiative,map.initiativePanelPos);
    setupFloatingPanelDrag(toolbar,toolbar.querySelector('[data-drag-handle]'),map,'toolbarPos');
    setupFloatingPanelDrag(viewer,viewer.querySelector('[data-drag-handle=map-viewer]'),map,'mapViewerPos');
    setupFloatingPanelDrag(initiative,initiative.querySelector('[data-drag-handle]'),map,'initiativePanelPos');
    const setupPanelResizers=(panel,key)=>$$('[data-resize-handle]',panel).forEach(h=>setupResizablePanel(panel,h,map,key,h.dataset.resizeDir||'se'));
    setupPanelResizers(toolbar,'toolbarSize');
    setupPanelResizers(viewer,'mapViewerSize');
    setupPanelResizers(initiative,'initiativePanelSize');
    const workspaceConfig={toolbar:{panel:toolbar,key:'toolbarMinimized',sizeKey:'toolbarSize'},initiative:{panel:initiative,key:'initiativePanelMinimized',sizeKey:'initiativePanelSize'},'map-viewer':{panel:viewer,key:'mapViewerMinimized',sizeKey:'mapViewerSize'}};
    if(viewer) viewer.classList.toggle('workspace-disabled',map.mapViewerVisible===false); viewer?.style.setProperty('display',map.mapViewerVisible===false?'none':'','important');
    const applyWorkspaceMinimized=(kind,minimized,persistNow=true)=>{const cfg=workspaceConfig[kind];if(!cfg?.panel)return;const size=map[cfg.sizeKey]||{};if(minimized){cfg.panel.dataset.restoreHeight=String(size.height||cfg.panel.offsetHeight||200);cfg.panel.style.setProperty('height','38px','important');cfg.panel.style.setProperty('min-height','38px','important');}else{const h=Number(size.height||cfg.panel.dataset.restoreHeight||cfg.panel.offsetHeight||200);cfg.panel.style.setProperty('height',Math.round(Math.max(130,h))+'px','important');cfg.panel.style.setProperty('min-height','0px','important');}cfg.panel.classList.toggle('is-minimized',!!minimized);const button=cfg.panel.querySelector('[data-workspace-minimize]');if(button){button.textContent=minimized?'+':'−';button.setAttribute('aria-label',(minimized?'Restore ':'Minimize ')+(cfg.panel.querySelector('.workspace-title')?.textContent||'Workspace'));button.title=minimized?'Restore':'Minimize';}map[cfg.key]=!!minimized;if(persistNow)persist();};
    Object.entries(workspaceConfig).forEach(([kind,cfg])=>{const button=cfg.panel.querySelector('[data-workspace-minimize]');if(button)button.onclick=e=>{e.preventDefault();e.stopPropagation();applyWorkspaceMinimized(kind,!cfg.panel.classList.contains('is-minimized'));};applyWorkspaceMinimized(kind,map[cfg.key]===true,false);});
    setToolbarVisible(map.toolbarVisible!==false);
    $('#map-select').onchange=e=>{state.activeMapId=e.target.value;persist();renderMap();}; $('#rename-map').onclick=()=>{const n=prompt('Map name:',map.name);if(n&&n.trim()){map.name=n.trim();persist();renderMap();}}; $('#new-map').onclick=()=>createMap(); $('#token-library').onclick=tokenLibraryModal; $('#map-library').onclick=mapLibraryModal; $('#delete-map').onclick=()=>{if(confirm('Delete this map and all of its tokens/fog?')){state.maps=state.maps.filter(x=>x.id!==map.id);state.activeMapId=state.maps[0]?.id||null;persist();renderMap();}};
    $('#grid-size').onchange=e=>{map.grid=Math.max(8,Math.min(200,Number(e.target.value)||20));persist();renderMap();}; $('#grid-toggle').onchange=e=>{map.gridVisible=e.target.checked;persist();renderMap();}; $('#player-view').onchange=e=>{map.playerView=e.target.checked;persist();renderMap();}; $('#fit-map').onclick=()=>{$('#map-stage').scrollIntoView({behavior:'smooth',block:'center'});}; const mapBounds=()=>{const img=$('#map-image');return {w:Number(map.mapWidth)||img?.naturalWidth||img?.width||$('#map-fog').width||0,h:Number(map.mapHeight)||img?.naturalHeight||img?.height||$('#map-fog').height||0};}; $('#hide-entire-map').onclick=()=>{const b=mapBounds();pushMapUndo(map);map.fog=[];map.fogRects=[{x:0,y:0,w:b.w,h:b.h,state:'dark'}];persist({publishPlayer:false});drawMapCanvases(map);publishPlayerMap(map);}; $('#show-entire-map').onclick=()=>{const b=mapBounds();pushMapUndo(map);map.fog=[];map.fogRects=[{x:0,y:0,w:b.w,h:b.h,state:'show'}];persist({publishPlayer:false});drawMapCanvases(map);publishPlayerMap(map);}; $('#fog-entire-map').onclick=()=>{const b=mapBounds();pushMapUndo(map);map.fog=[];map.fogRects=[{x:0,y:0,w:b.w,h:b.h,state:'fog'}];persist({publishPlayer:false});drawMapCanvases(map);publishPlayerMap(map);};
    // Map tools are mutually exclusive. Pan can be selected from the toolbar OR invoked
    // temporarily with Ctrl+drag. Selecting Pan is a persistent tool choice, but the pan
    // ACTION itself ends on pointer-up/cancel, so it can never trap the map in a drag state.
    // Visibility tools are also persistent: after drawing one Fog/Show/Dark rectangle, the
    // selected tool remains active so the GM can paint multiple areas without reselecting it.
    const transientTool=()=>false;
    const syncToolUI=()=>{
      const transient=new Set(['fog','show','hide']);
      $$('.map-tool').forEach(x=>x.classList.toggle('active',x.dataset.tool===map.tool));
      const color=$('#draw-color-control'); if(color) color.style.display=map.tool==='draw'?'grid':'none';
      const stageWrap=$('#map-stage-wrap');
      stageWrap?.classList.toggle('pan-tool-active',map.tool==='pan');
      $('#map-stage')?.classList.toggle('visibility-mode',transient.has(map.tool));
    };
    $$('.map-tool').forEach(b=>b.onclick=()=>{
      const next=b.dataset.tool;
      const same=map.tool===next;
      map.tool=same?'none':next;
      syncToolUI();
      // Visibility tools are one-shot interactions. Do not persist the temporary
      // tool selection, otherwise a navigation/refresh can reopen on Show/Fog and
      // leave the map looking or feeling stuck.
      if(!transientTool(map.tool)) persist();
    });
    syncToolUI();
    $('#brush-size').oninput=e=>{map.brushSize=Math.max(2,Math.min(150,Number(e.target.value)||20));$('#brush-size-label').textContent=map.brushSize+'px';};
    $('#brush-size').onchange=()=>persist();
    $('#draw-color').oninput=e=>{map.drawColor=e.target.value||'#ebd291';$('#draw-color-value').textContent=map.drawColor;drawMapCanvases(map);};
    $('#draw-color').onchange=()=>persist();
    $('#add-token').onclick=()=>addTokenPrompt(map); $('#present-tokens').onclick=()=>presentTokensModal(map);
    setupMapCanvas(map);
    bindMapUndoShortcut();
    renderMapTokens(map);
    renderInitiativePanel(map);
    // Layout is measured again after the section becomes visible. This prevents the first
    // render from clamping a right-side workspace against a stale narrow width from the
    // previous page, which could otherwise make the tracker appear on top of the toolbar.
    let workspaceDefaultsNeedCommit=!hadWorkspaceLayout;
    const normalizeWorkspaceGeometry=()=>{
      if(window.matchMedia('(max-width:780px)').matches || !vtt) return;
      const hostW=Math.max(1,vtt.clientWidth||vtt.getBoundingClientRect().width||window.innerWidth);
      const hostH=Math.max(1,vtt.clientHeight||vtt.getBoundingClientRect().height||window.innerHeight);
      const minLayoutWidth=Math.max(720,(Number(map.toolbarSize?.width)||TW)+(Number(map.initiativePanelSize?.width)||IW)+320+(4*G));
      // Do not let a transient ResizeObserver measurement from a collapsing/hidden page
      // overwrite good coordinates with x=8. Only normalize against a useful host size.
      if(hostW<minLayoutWidth) return;
      if(workspaceDefaultsNeedCommit){
        // Never commit a layout while the map host is temporarily narrow/hidden during
        // section navigation. Wait for ResizeObserver/animation to report its real width.
        if(hostW<minLayoutWidth) return;
        // Deterministic first layout: use the persisted sizes, but calculate all three
        // positions from the live VTT bounds. This prevents legacy layouts from stacking
        // windows in the same corner or allowing the viewer to collide with the tracker.
        const tw=Math.max(170,Number(map.toolbarSize?.width)||TW);
        const iw=Math.max(170,Number(map.initiativePanelSize?.width)||IW);
        let vw=Math.max(320,Number(map.mapViewerSize?.width)||Math.max(320,dView.w));
        const toolbarX=G;
        const viewerX=toolbarX+tw+G;
        const initiativeX=Math.max(G,hostW-iw-G);
        const availableViewer=Math.max(320,initiativeX-viewerX-G);
        if(vw>availableViewer){
          vw=availableViewer;
          map.mapViewerSize={...(map.mapViewerSize||{}),width:vw};
        }
        map.toolbarPos={x:toolbarX,y:G};
        map.mapViewerPos={x:viewerX,y:G};
        map.initiativePanelPos={x:initiativeX,y:G};
        workspaceDefaultsNeedCommit=false;
      }
      const panels=[
        [toolbar,map.toolbarPos,map.toolbarSize],
        [viewer,map.mapViewerPos,map.mapViewerSize],
        [initiative,map.initiativePanelPos,map.initiativePanelSize]
      ];
      for(const [panel,pos,size] of panels){
        if(!panel || panel.classList.contains('is-resizing') || panel.classList.contains('is-dragging')) continue;
        applyPanelSize(panel,size);
        const w=panel.offsetWidth||170,h=panel.offsetHeight||130;
        const rawX=Number.isFinite(Number(pos?.x))?Number(pos.x):8;
        const rawY=Number.isFinite(Number(pos?.y))?Number(pos.y):8;
        const x=Math.max(8,Math.min(rawX,Math.max(8,hostW-w-8)));
        const y=Math.max(8,Math.min(rawY,Math.max(8,hostH-h-8)));
        pos.x=x; pos.y=y;
        applyFloatingPanelPosition(panel,pos);
      }
      // Legacy layouts are migrated exactly once. Release the initialization lock only after
      // a useful host width has been measured and all three windows have concrete geometry.
      if(!hadWorkspaceLayout) persist();
      if(vtt.classList.contains('workspace-initializing')){
        requestAnimationFrame(()=>vtt.classList.remove('workspace-initializing'));
      }
    };
    requestAnimationFrame(()=>requestAnimationFrame(normalizeWorkspaceGeometry));
    setTimeout(normalizeWorkspaceGeometry,80);
    setTimeout(normalizeWorkspaceGeometry,240);
    window.addEventListener('resize',normalizeWorkspaceGeometry,{passive:true});
    if(window.ResizeObserver){
      const ro=new ResizeObserver(()=>normalizeWorkspaceGeometry());
      ro.observe(vtt);
      vtt.__wgWorkspaceResizeObserver=ro;
    }
  }


  function applyFloatingPanelPosition(el,pos,rightAnchored=false){
    if(!el)return;
    if(window.matchMedia('(max-width:780px)').matches){['left','right','top','bottom'].forEach(p=>el.style.removeProperty(p));return;}
    const host=el.parentElement;
    const hostW=host?.clientWidth||window.innerWidth;
    const hostH=host?.clientHeight||window.innerHeight;
    const pw=el.offsetWidth||240, ph=el.offsetHeight||200;
    let x=Number.isFinite(Number(pos?.x))?Number(pos.x):8;
    let y=Math.max(8,Number(pos?.y)||12);
    x=Math.max(8,Math.min(x,Math.max(8,hostW-pw-8)));
    y=Math.max(8,Math.min(y,Math.max(8,hostH-ph-8)));
    // Inline !important: legacy stylesheet generations pin these panels with !important left/top rules.
    el.style.setProperty('left',Math.round(x)+'px','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('top',Math.round(y)+'px','important');
    el.style.setProperty('bottom','auto','important');
  }

  function applyPanelSize(panel,size){
    if(!panel)return;
    if(window.matchMedia('(max-width:780px)').matches){['width','height','max-width','max-height'].forEach(p=>panel.style.removeProperty(p));return;}
    if(size?.width) panel.style.setProperty('width',Math.round(size.width)+'px','important');
    if(size?.height) panel.style.setProperty('height',Math.round(size.height)+'px','important');
    panel.style.maxWidth='calc(100% - 12px)';
    panel.style.maxHeight='calc(100% - 16px)';
  }
  function setupResizablePanel(panel,handle,map,key,dir='se'){
    if(!panel||!handle)return;
    handle.onpointerdown=e=>{
      if(e.button!==0)return;
      panel.classList.add('is-resizing');
      bringWorkspaceToFront(panel);
      e.preventDefault();e.stopPropagation();
      const host=panel.offsetParent||document.getElementById('map-vtt')||document.body;
      const hr=host.getBoundingClientRect(), pr=panel.getBoundingClientRect();
      const start={x:e.clientX,y:e.clientY,w:pr.width,h:pr.height,left:pr.left-hr.left,top:pr.top-hr.top};
      const minW=170,minH=130,maxW=Math.max(minW,hr.width-16),maxH=Math.max(minH,hr.height-16);
      handle.setPointerCapture?.(e.pointerId);
      const move=ev=>{
        const dx=ev.clientX-start.x,dy=ev.clientY-start.y;
        let w=start.w,h=start.h,left=start.left,top=start.top;
        if(dir.includes('e'))w=start.w+dx;
        if(dir.includes('s'))h=start.h+dy;
        if(dir.includes('w')){w=start.w-dx;left=start.left+dx;}
        if(dir.includes('n')){h=start.h-dy;top=start.top+dy;}
        w=Math.max(minW,Math.min(maxW,w));h=Math.max(minH,Math.min(maxH,h));
        if(dir.includes('w'))left=start.left+(start.w-w);
        if(dir.includes('n'))top=start.top+(start.h-h);
        left=Math.max(4,Math.min(left,Math.max(4,host.clientWidth-w-4)));
        top=Math.max(4,Math.min(top,Math.max(4,host.clientHeight-h-4)));
        panel.style.setProperty('width',Math.round(w)+'px','important');
        panel.style.setProperty('height',Math.round(h)+'px','important');
        panel.style.setProperty('left',Math.round(left)+'px','important');panel.style.setProperty('top',Math.round(top)+'px','important');
        map[key]={width:w,height:h};
        const posKey=key==='toolbarSize'?'toolbarPos':key==='initiativePanelSize'?'initiativePanelPos':key==='soundMixerSize'?'soundMixerPos':'mapViewerPos';
        map[posKey]={x:left,y:top};
      };
      const up=()=>{panel.classList.remove('is-resizing');document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);persist();};
      document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});document.addEventListener('pointercancel',up,{once:true});
    };
  }

  let workspaceZCounter=60;
  function bringWorkspaceToFront(panel){
    if(!panel)return;
    workspaceZCounter=Math.min(999,workspaceZCounter+1);
    panel.style.zIndex=String(workspaceZCounter);
    $$('#map-vtt > .map-toolbar, #map-vtt > .initiative-panel, #map-vtt > .map-viewer-window').forEach(el=>{
      if(el!==panel && !el.style.zIndex) el.style.zIndex='30';
    });
  }
  function setupFloatingPanelDrag(panel,handle,map,key){
    if(!panel||!handle)return;
    panel.addEventListener('pointerdown',()=>bringWorkspaceToFront(panel),true);
    let drag=null;
    handle.onpointerdown=e=>{
      if(e.button!==0)return;
      panel.classList.add('is-dragging');
      if(e.target?.closest?.('.workspace-minimize')){panel.classList.remove('is-dragging');return;}
      e.preventDefault();e.stopPropagation();
      const rect=panel.getBoundingClientRect();
      const parent=panel.offsetParent?.getBoundingClientRect?.()||{left:0,top:0};
      drag={dx:e.clientX-rect.left,dy:e.clientY-rect.top,parentLeft:parent.left,parentTop:parent.top};
      handle.setPointerCapture?.(e.pointerId);
      handle.classList.add('dragging');
      const move=ev=>{
        if(!drag)return;
        const host=panel.offsetParent||document.body;
        const hw=host.clientWidth||window.innerWidth,hh=host.clientHeight||window.innerHeight;
        const pw=panel.offsetWidth,ph=panel.offsetHeight;
        let x=ev.clientX-drag.parentLeft-drag.dx;
        let y=ev.clientY-drag.parentTop-drag.dy;
        const margin=8;
        x=Math.max(margin,Math.min(x,Math.max(margin,hw-pw-margin)));
        y=Math.max(margin,Math.min(y,Math.max(margin,hh-ph-margin)));
        map[key]={x,y};
        applyFloatingPanelPosition(panel,map[key]);
      };
      const up=()=>{if(!drag)return;drag=null;panel.classList.remove('is-dragging');handle.classList.remove('dragging');document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);persist();};
      document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});document.addEventListener('pointercancel',up,{once:true});
    };
  }

  function addCombatantWithTokenPrompt(ch, initiative, map, done){
    const wrap=document.createElement('div'); wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal-card modal-wide combatant-token-modal"><div class="modal-header"><div><h2>Add Combatant</h2><p class="muted small">Choose the starting initiative and a token from the Token Library.</p></div><button id="close-combatant-token">×</button></div><div class="combatant-token-summary"><strong>${esc(ch.name)}</strong><span class="muted small">${esc(ch.type||'NPC')} · Initiative ${Number(initiative||0)}</span></div><div class="field"><label>Token for this live combatant</label><select id="combatant-token-select"><option value="">No token</option>${state.tokenLibrary.map(t=>`<option value="${t.id}">${esc(t.name)} · ${esc(t.type||'Token')} · ${Number(t.size||40)}px</option>`).join('')}</select><span class="muted small">A selected token is placed on the active map and bound to this live combatant.</span></div><div class="modal-actions"><button id="cancel-combatant-token">Cancel</button><button class="button-primary" id="confirm-combatant-token">Add Combatant</button></div></div>`;
    document.body.appendChild(wrap);
    const close=()=>wrap.remove(); $('#close-combatant-token',wrap).onclick=close; $('#cancel-combatant-token',wrap).onclick=close;
    $('#confirm-combatant-token',wrap).onclick=()=>{
      const combatant={id:uid('cmb'),sourceCharacterId:ch.id,name:ch.name,type:ch.type||'NPC',faction:ch.faction||'',wounds:Number(ch.wounds?.current??ch.wounds?.max??ch.wounds??10),shock:Number(ch.shock?.current??ch.shock?.max??ch.shock??10),shockMax:Number(ch.shock?.max??ch.shock??10),defense:Number(ch.defense||3),resilience:Number(ch.resilience||3),initiative:Number.isFinite(Number(initiative))?Number(initiative):Number(ch.initiative||0),tokenId:'',active:false,dead:false};
      state.combat.combatants.push(combatant);
      const tokenId=$('#combatant-token-select',wrap).value;
      const token=state.tokenLibrary.find(t=>t.id===tokenId);
      if(token && map){combatant.tokenId=token.id;pushMapUndo(map);map.tokens.push({id:uid('token'),tokenLibraryId:token.id,name:token.name,image:token.image||'',x:map.grid*2,y:map.grid*2,size:Number(token.size)||Math.max(28,map.grid*.8),type:token.type||ch.type||'NPC',combatantId:combatant.id});}
      persist(); close(); done?.(combatant);
    };
  }

  function openCombatManager(){
    const wrap=document.createElement('div');
    wrap.className='modal-backdrop';
    const library=state.characters||[];
    wrap.innerHTML=`<div class="modal-card modal-wide combat-manager-modal"><div class="modal-header"><div><h2>Manage Combat</h2><p class="muted small">Add saved characters to the current encounter or remove them without leaving the map.</p></div><button id="close-combat-manager">×</button></div><div class="combat-manager-grid"><section><div class="tool-title">Character Library</div><input id="combat-manager-search" placeholder="Search characters..."><div id="combat-manager-library" class="combat-manager-list"></div></section><section><div class="tool-title">In Combat</div><div id="combat-manager-current" class="combat-manager-list"></div></section></div><div class="modal-actions"><button id="done-combat-manager" class="button-primary">Done</button></div></div>`;
    document.body.appendChild(wrap);
    const close=()=>wrap.remove();
    $('#close-combat-manager',wrap).onclick=close; $('#done-combat-manager',wrap).onclick=close;
    const draw=()=>{
      const q=($('#combat-manager-search',wrap).value||'').toLowerCase().trim();
      const available=library.filter(ch=>(ch.name||'').toLowerCase().includes(q));
      $('#combat-manager-library',wrap).innerHTML=available.map(ch=>{const count=(state.combat?.combatants||[]).filter(c=>(c.sourceCharacterId||c.characterId)===ch.id).length;return `<div class="combat-manager-row"><div><strong>${esc(ch.name)}</strong><span class="muted small">${esc(ch.type||'NPC')} · Base Init ${Number(ch.initiative||0)} · W ${Number(ch.wounds?.max??ch.wounds??0)}${count?` · ${count} in Combat`:''}</span></div><div class="combat-manager-add"><label>Init <input type="number" class="manager-init" data-init-for="${ch.id}" value="${Number(ch.initiative||0)}"></label><button data-add-combat="${ch.id}" class="button-primary">+ Add</button></div></div>`}).join('')||'<div class="muted small">No saved characters found.</div>';
      $('#combat-manager-current',wrap).innerHTML=(state.combat?.combatants||[]).map(c=>`<div class="combat-manager-row"><div><strong>${c.dead?'☠ ':''}${esc(c.name)}</strong><span class="muted small">Init ${Number(c.initiative||0)} · W ${Number(c.wounds||0)}${c.dead?' · DEAD':''}</span></div><button data-remove-combat="${c.id}" class="button-danger">Remove</button></div>`).join('')||'<div class="muted small">No combatants in the encounter.</div>';
      $$('[data-add-combat]',wrap).forEach(b=>b.onclick=()=>{const ch=library.find(x=>x.id===b.dataset.addCombat);if(!ch)return;const initEl=wrap.querySelector(`[data-init-for="${ch.id}"]`);const initiative=Number(initEl?.value);const map=state.maps.find(x=>x.id===state.activeMapId)||state.maps[0];addCombatantWithTokenPrompt(ch,initiative,map,()=>{draw();renderInitiativePanel(map);renderMapTokens(map);});});
      $$('[data-remove-combat]',wrap).forEach(b=>b.onclick=()=>{const id=b.dataset.removeCombat;removeCombatantAndTokens(id);if(state.combat.turn>=state.combat.combatants.length)state.combat.turn=Math.max(0,state.combat.combatants.length-1);const m=state.maps.find(x=>x.id===state.activeMapId)||state.maps[0];persist();draw();renderInitiativePanel(m);renderMapTokens(m);});
    };
    $('#combat-manager-search',wrap).oninput=draw; draw();
  }

  function renderInitiativePanel(map){
    const panel=$('#initiative-panel'),list=$('#initiative-panel-list'); if(!panel||!list)return;
    panel.classList.toggle('is-collapsed',map.initiativePanelVisible===false); const tab=$('#initiative-panel-tab'); if(tab)tab.classList.toggle('is-hidden',map.initiativePanelVisible!==false);
    const combat=state.combat||{combatants:[],round:1,active:false};
    combat.sortInitiativeDirection ??= 'desc';
    const dir=combat.sortInitiativeDirection==='asc'?1:-1;
    const ordered=[...(combat.combatants||[])].sort((a,b)=>{const d=(Number(b.initiative||0))-(Number(a.initiative||0));return d===0?0:d*dir;});
    const tokenFor=(combatant)=>{ const bound=(state.maps||[]).flatMap(m=>m.tokens||[]).find(t=>t.combatantId===combatant.id); return bound?.tokenLibraryId ? (state.tokenLibrary||[]).find(t=>t.id===bound.tokenLibraryId) : (state.tokenLibrary||[]).find(t=>t.id===combatant.tokenId); };
    const shockMaxFor=(combatant)=>{ if(Number(combatant.shockMax)>0)return Number(combatant.shockMax); const source=(state.characters||[]).find(ch=>ch.id===combatant.sourceCharacterId); const max=Number(source?.shock?.max||source?.shock||0); return max>0?max:Math.max(1,Number(combatant.shock||0)); };
    // Combat Tracker Extension resources: Wounds and Shock use the same bar interaction model.
    // Current values are authoritative and may exceed their normal maximum; the visual fill is capped at 100%.
    const woundMaxFor=(combatant)=>{ if(Number(combatant.woundsMax)>0)return Number(combatant.woundsMax); const source=(state.characters||[]).find(ch=>ch.id===combatant.sourceCharacterId); const max=Number(source?.wounds?.max||source?.wounds||0); return max>0?max:Math.max(1,Number(combatant.wounds||0)); };
    list.innerHTML=ordered.map((x,i)=>{ const tok=tokenFor(x); const shockMax=shockMaxFor(x); const woundMax=woundMaxFor(x); const preview=tok?.image ? `<img src="${esc(tok.image)}" alt="" loading="lazy">` : `<span>${esc((tok?.name||x.name||'?').charAt(0).toUpperCase())}</span>`; return `<div class="initiative-panel-item ${x.active?'current':''} ${x.dead?'dead':''} ${x.shocked?'shocked':''}"><div class="initiative-panel-index ${x.dead?'dead-icon':''}">${x.dead?'☠':i+1}</div><div class="initiative-panel-main"><div class="tracker-name-row"><div class="tracker-token-mini ${x.dead?'is-dead':''}">${preview}</div><div class="tracker-name-stack"><strong>${esc(x.name||'Unnamed')}</strong><span class="initiative-value">INIT ${Number(x.initiative||0)}${x.dead?' · DEAD':x.shocked?' · SHOCKED':''}</span></div></div><div class="tracker-stat-strip" aria-label="Combatant defensive statistics"><div class="tracker-stat"><span>DEF</span><b>${Number(x.defense||0)}</b></div><div class="tracker-stat"><span>RES</span><b>${Number(x.resilience||0)}</b></div><div class="tracker-stat"><span>SHK</span><b data-shock-stat="${x.id}">${Number(x.shock||0)}</b></div></div><div class="tracker-resource-bar wounds-resource" aria-label="Wounds"><button type="button" class="tracker-resource-btn" data-wound-delta="-1" data-wound-id="${x.id}" title="Decrease Wounds">−</button><div class="tracker-resource-track"><div class="tracker-resource-fill wounds-fill" data-wound-fill="${x.id}" style="width:${Math.max(0,Math.min(100,(Number(x.wounds||0)/Math.max(1,woundMax))*100))}%"></div><span>Wounds <b data-wound-value="${x.id}">${Number(x.wounds||0)}</b><small>/ ${Math.max(1,woundMax)}</small></span></div><button type="button" class="tracker-resource-btn" data-wound-delta="1" data-wound-id="${x.id}" title="Increase Wounds">+</button></div><div class="tracker-resource-bar shock-resource" aria-label="Shock"><button type="button" class="tracker-resource-btn" data-shock-delta="-1" data-shock-id="${x.id}" title="Decrease Shock">−</button><div class="tracker-resource-track"><div class="tracker-resource-fill shock-fill" data-shock-fill="${x.id}" style="width:${Math.max(0,Math.min(100,(Number(x.shock||0)/Math.max(1,shockMax))*100))}%"></div><span>Shock <b data-shock-value="${x.id}">${Number(x.shock||0)}</b><small>/ ${Math.max(1,shockMax)}</small></span></div><button type="button" class="tracker-resource-btn" data-shock-delta="1" data-shock-id="${x.id}" title="Increase Shock">+</button></div><div class="tracker-actions tracker-actions-secondary"><button type="button" class="tracker-edit-btn" data-edit-id="${x.id}" title="Edit combatant">Edit</button><button type="button" class="tracker-dead-btn ${x.dead?'is-dead':''}" data-dead-id="${x.id}">${x.dead?'Revive':'Dead'}</button><button type="button" class="tracker-shocked-btn ${x.shocked?'is-shocked':''}" data-shocked-id="${x.id}">${x.shocked?'Clear Shock':'Shock'}</button><button type="button" class="tracker-remove-btn" data-remove-id="${x.id}" title="Remove combatant">×</button></div></div></div>`; }).join('') || '<div class="muted small" style="padding:12px">No combatants in the tracker.</div>';
    $$('[data-wound-delta]',list).forEach(btn=>btn.onclick=()=>{const c=(state.combat.combatants||[]).find(y=>y.id===btn.dataset.woundId);if(!c)return;c.wounds=Math.max(0,Number(c.wounds||0)+Number(btn.dataset.woundDelta||0));persist();renderInitiativePanel(map);});
    $$('[data-shock-delta]',list).forEach(btn=>btn.onclick=()=>{const c=(state.combat.combatants||[]).find(y=>y.id===btn.dataset.shockId);if(!c)return;c.shock=Math.max(0,Number(c.shock||0)+Number(btn.dataset.shockDelta||0));persist();renderInitiativePanel(map);});
    $$('[data-remove-id]',list).forEach(btn=>btn.onclick=()=>{if(!confirm('Remove this combatant from the encounter?'))return;const id=btn.dataset.removeId;removeCombatantAndTokens(id);state.combat.combatants.forEach(c=>{if(c.active)c.active=false;});if(state.combat.turn>=state.combat.combatants.length)state.combat.turn=Math.max(0,state.combat.combatants.length-1);persist();renderInitiativePanel(map);renderMapTokens(map);});
    $$('[data-dead-id]',list).forEach(btn=>btn.onclick=()=>{const c=(state.combat.combatants||[]).find(y=>y.id===btn.dataset.deadId);if(!c)return;c.dead=!c.dead;if(c.dead)c.shocked=false;persist({publishPlayer:false});renderInitiativePanel(map);renderMapTokens(map);});$$('[data-shocked-id]',list).forEach(btn=>btn.onclick=()=>{const c=(state.combat.combatants||[]).find(y=>y.id===btn.dataset.shockedId);if(!c)return;c.shocked=!c.shocked;if(c.shocked)c.dead=false;persist({publishPlayer:false});renderInitiativePanel(map);renderMapTokens(map);});
    $$('[data-edit-id]',list).forEach(btn=>btn.onclick=()=>editCombatantCard(btn.dataset.editId));
    $('#initiative-sort')?.addEventListener('click',()=>{combat.sortInitiativeDirection=combat.sortInitiativeDirection==='asc'?'desc':'asc';persist();renderInitiativePanel(map);});
  }

  function createMap(){
    const input=document.createElement('input');
    input.type='file';
    input.accept='image/png,image/jpeg,.png,.jpg,.jpeg';
    input.onchange=()=>{
      const f=input.files?.[0];
      if(!f)return;
      const ext=/\.(png|jpe?g)$/i.test(f.name);
      if(!ext || (f.type && !['image/png','image/jpeg'].includes(f.type))){
        alert('Please choose a PNG or JPG/JPEG image.');
        return;
      }
      if(f.size>30*1024*1024){
        alert('This image is over 30 MB. Please choose a smaller map image.');
        return;
      }
      const reader=new FileReader();
      reader.onerror=()=>alert('The browser could not read that image. Please try another PNG or JPG.');
      reader.onload=()=>{
        const src=reader.result;
        const img=new Image();
        img.onerror=()=>alert('That file could not be decoded as an image. Please try another PNG or JPG.');
        img.onload=()=>{
          const maxDim=4096;
          const scale=Math.min(1,maxDim/Math.max(img.naturalWidth,img.naturalHeight));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          const ctx=canvas.getContext('2d');
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          let quality=.82, data=canvas.toDataURL('image/jpeg',quality);
          while(data.length>2.8*1024*1024 && quality>.5){
            quality-=.06;
            data=canvas.toDataURL('image/jpeg',quality);
          }
          try{
            const m={id:uid('map'),name:f.name.replace(/\.(png|jpe?g)$/i,''),image:data,grid:20,gridVisible:true,playerView:false,tool:'none',fog:[],fogRects:[],draw:[],tokens:[],zoom:1,panX:0,panY:0,fogEnabled:true,toolbarVisible:true,toolbarOpacity:.94,mapWidth:canvas.width,mapHeight:canvas.height};
            state.maps.push(m);
            state.activeMapId=m.id;
            persist();
            renderMap();
          }catch(err){
            console.error('Map save failed:',err);
            alert('The image was read successfully, but the browser storage is full. Delete an old map or use a smaller image, then try again.');
          }
        };
        img.src=src;
      };
      reader.readAsDataURL(f);
    };
    input.click();
  }

  function addTokenPrompt(map){ tokenPickerModal(map); }
  function tokenPickerModal(map){
    const wrap=document.createElement('div'); wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal-card modal-wide token-picker"><div class="modal-header"><div><h2>Select Token</h2><p class="muted small">Choose a saved token to place on the current map.</p></div><button id="close-token-picker">×</button></div><div class="token-picker-controls"><input id="token-search" placeholder="Search tokens..."><select id="token-type-filter"><option value="">All Types</option>${['PC','NPC','Enemy','Ally','Object'].map(x=>`<option>${x}</option>`).join('')}</select><select id="token-combatant-binding"><option value="">No live combatant binding</option>${(state.combat?.combatants||[]).map(c=>`<option value="${c.id}">Bind to: ${esc(c.name)} · Init ${Number(c.initiative||0)}</option>`).join('')}</select><button class="button-primary" id="create-token-from-picker">${IC('plus')} New Token</button></div><div id="token-picker-grid" class="token-library-grid token-picker-grid"></div></div>`;
    document.body.appendChild(wrap); const close=()=>wrap.remove(); $('#close-token-picker',wrap).onclick=close; $('#create-token-from-picker').onclick=()=>{close();tokenEditor(null,map);};
    const grid=$('#token-picker-grid',wrap), search=$('#token-search',wrap), filter=$('#token-type-filter',wrap);
    const draw=()=>{const q=search.value.trim().toLowerCase(),type=filter.value; const list=state.tokenLibrary.filter(t=>(!type||t.type===type)&&(!q||(t.name+' '+t.type).toLowerCase().includes(q))); grid.innerHTML=list.map(t=>`<button class="token-picker-card" data-pick="${t.id}"><div class="token-picker-icon">${t.image?`<img src="${esc(t.image)}" alt="">`:`<span>${esc((t.name||'?')[0])}</span>`}</div><strong>${esc(t.name)}</strong><span class="muted small">${esc(t.type)} · ${t.size||40}px</span></button>`).join('')||'<div class="empty-state">No matching saved tokens. Create one to get started.</div>'; $$('[data-pick]',grid).forEach(b=>b.onclick=()=>{const t=state.tokenLibrary.find(x=>x.id===b.dataset.pick);if(t){const binding=$('#token-combatant-binding',wrap)?.value||'';addTokenFromLibrary(map,t,binding);close();}});};
    search.oninput=draw; filter.onchange=draw; draw();
  }
  function addTokenFromLibrary(map,t,combatantId=''){pushMapUndo(map);const c=(state.combat?.combatants||[]).find(x=>x.id===combatantId);map.tokens.push({id:uid('token'),tokenLibraryId:t.id,name:t.name,image:t.image||'',x:map.grid*2,y:map.grid*2,size:t.size||Math.max(28,map.grid*.8),type:t.type||'NPC',combatantId:c?c.id:''});persist();renderMap();}
  function presentTokensModal(map){
    const wrap=document.createElement('div');wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal-card modal-wide"><div class="modal-header"><div><h2>Present Tokens</h2><p class="muted small">Tokens currently placed on ${esc(map.name)}. Remove a token from the map without deleting it from the Token Library.</p></div><button id="close-present-tokens">×</button></div><div id="present-token-list" class="present-token-list"></div></div>`;
    document.body.appendChild(wrap);const close=()=>wrap.remove();$('#close-present-tokens',wrap).onclick=close;
    const draw=()=>{$('#present-token-list',wrap).innerHTML=(map.tokens||[]).map(t=>{const c=(state.combat?.combatants||[]).find(x=>x.id===t.combatantId);return `<div class="present-token-row"><div class="present-token-preview">${t.image?`<img src="${esc(t.image)}" alt="">`:`<span>${esc((t.name||'?')[0])}</span>`}</div><div><strong>${esc(t.name)}</strong><div class="muted small">${esc(t.type||'Token')} · ${c?'Bound to '+esc(c.name):'Unbound'}</div></div><button class="button-danger" data-remove-present="${t.id}">Remove from Map</button></div>`}).join('')||'<div class="empty-state">No tokens are currently on this map.</div>';$$('[data-remove-present]',wrap).forEach(b=>b.onclick=()=>{if(!confirm('Remove this token from the map?'))return;pushMapUndo(map);map.tokens=map.tokens.filter(t=>t.id!==b.dataset.removePresent);persist({syncState:false});renderMapTokens(map);draw();});};draw();
  }
  function openGameRoomEditor(map){
    const wrap=document.createElement('div');wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal-card modal-wide game-room-editor"><div class="modal-header"><div><div class="eyebrow">Game Room Configuration</div><h2>Edit Game Room</h2><p class="muted small">Choose which workspaces are available in this room. Changes are saved for this room.</p></div><button id="close-game-room-editor">×</button></div><div class="game-room-workspace-settings">
      <label class="workspace-setting"><span><strong>Tools</strong><small>Map tools, fog, drawing and interface controls.</small></span><input type="checkbox" id="gr-tools" ${map.toolbarVisible!==false?'checked':''}></label>
      <label class="workspace-setting"><span><strong>Map Viewer</strong><small>The main battlefield viewing workspace.</small></span><input type="checkbox" id="gr-viewer" ${map.mapViewerVisible!==false?'checked':''}></label>
      <label class="workspace-setting"><span><strong>Combat Tracker</strong><small>Initiative, combatants and live conditions.</small></span><input type="checkbox" id="gr-combat" ${map.initiativePanelVisible!==false?'checked':''}></label>
      <label class="workspace-setting"><span><strong>Sound Mixer</strong><small>Layered music, ambience, effects and speeches.</small></span><input type="checkbox" id="gr-sounds" ${map.soundMixerVisible!==false?'checked':''}></label><label class="workspace-setting"><span><strong>Auto Update Player Map</strong><small>Automatically publish map changes to the player view.</small></span><input type="checkbox" id="gr-player-auto" ${map.playerAutoUpdate?'checked':''}></label><label class="workspace-setting"><span><strong>Fog of War</strong><small>Enable GM fog/reveal controls for this room.</small></span><input type="checkbox" id="gr-fog" ${map.fogEnabled!==false?'checked':''}></label><label class="workspace-setting"><span><strong>Grid</strong><small>Show the tactical grid in the Map Viewer.</small></span><input type="checkbox" id="gr-grid" ${map.gridVisible!==false?'checked':''}></label><label class="workspace-setting"><span><strong>Toolbar Opacity</strong><small>Set how strongly the Tools workspace overlays the room.</small></span><input type="range" id="gr-opacity" min="20" max="100" value="${Math.round((map.toolbarOpacity??.94)*100)}"></label><label class="workspace-setting"><span><strong>Remember Sound Mixer Minimized</strong><small>Choose whether the mixer opens collapsed.</small></span><input type="checkbox" id="gr-sound-min" ${map.soundMixerMinimized?'checked':''}></label><label class="workspace-setting"><span><strong>Reset Workspace Layout</strong><small>Return workspace positions and sizes to defaults the next time the room renders.</small></span><input type="checkbox" id="gr-reset-layout"></label>
    </div><div class="modal-actions"><button id="cancel-game-room-editor">Cancel</button><button class="button-primary" id="save-game-room-editor">Save Game Room</button></div></div>`;
    document.body.appendChild(wrap);const close=()=>wrap.remove();$('#close-game-room-editor',wrap).onclick=close;$('#cancel-game-room-editor',wrap).onclick=close;$('#save-game-room-editor',wrap).onclick=()=>{map.toolbarVisible=$('#gr-tools',wrap).checked;map.mapViewerVisible=$('#gr-viewer',wrap).checked;map.initiativePanelVisible=$('#gr-combat',wrap).checked;map.soundMixerVisible=$('#gr-sounds',wrap).checked;map.playerAutoUpdate=$('#gr-player-auto',wrap).checked;map.fogEnabled=$('#gr-fog',wrap).checked;map.gridVisible=$('#gr-grid',wrap).checked;map.toolbarOpacity=Number($('#gr-opacity',wrap).value)/100;map.soundMixerMinimized=$('#gr-sound-min',wrap).checked;if($('#gr-reset-layout',wrap).checked){delete map.toolbarPos;delete map.toolbarSize;delete map.mapViewerPos;delete map.mapViewerSize;delete map.initiativePanelPos;delete map.initiativePanelSize;delete map.soundMixerPos;delete map.soundMixerSize;}persist();close();renderMap();};
  }

  function tokenEditor(id,map){
    const old=id?state.tokenLibrary.find(x=>x.id===id):{id:uid('tok'),name:'New Token',image:'',size:40,type:'NPC'};
    const wrap=document.createElement('div'); wrap.className='modal-backdrop'; wrap.innerHTML=`<div class="modal-card"><div class="modal-header"><h2>${id?'Edit':'New'} Token</h2><button id="close-token">×</button></div><div class="grid grid-2"><div class="field"><label>Name</label><input id="tn" value="${esc(old.name)}"></div><div class="field"><label>Type</label><select id="tt">${['PC','NPC','Enemy','Ally','Object'].map(x=>`<option ${x===old.type?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Size (px)</label><input id="ts" type="number" min="16" max="200" value="${old.size||40}"></div><div class="field" style="grid-column:1/-1"><div class="token-editor-note"><strong>Reusable Token Template</strong><span class="muted small">This library token is reusable. Bind it to a specific live combatant when you place it, so the same token can be used by multiple combatants.</span></div></div><div class="field" style="grid-column:1/-1"><label>Token Image</label><input id="ti" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg"><span class="muted small">Use a transparent PNG for best results.</span></div></div><div class="modal-actions"><button id="cancel-token">Cancel</button><button class="button-primary" id="save-token">Save Token</button></div></div>`; document.body.appendChild(wrap); const close=()=>wrap.remove(); $('#close-token',wrap).onclick=close; $('#cancel-token',wrap).onclick=close; $('#save-token',wrap).onclick=()=>{const file=$('#ti',wrap).files?.[0];const finish=image=>{old.name=$('#tn',wrap).value.trim()||'Token';old.type=$('#tt',wrap).value;old.size=Math.max(16,Number($('#ts',wrap).value)||40);if(image!==undefined)old.image=image; delete old.combatantId; const idx=state.tokenLibrary.findIndex(x=>x.id===old.id);if(idx<0)state.tokenLibrary.push(old);else state.tokenLibrary[idx]=old;
      // Propagate template edits to every placed token created from this library entry.
      for(const m of (state.maps||[])) for(const placed of (m.tokens||[])) if(placed.tokenLibraryId===old.id){placed.name=old.name;placed.image=old.image||'';placed.size=Number(old.size)||40;placed.type=old.type||'NPC';}
      // Save locally, then send a tiny token-only patch. Do not broadcast the entire
      // campaign state here: the Combat Tracker can update its token preview without
      // rebuilding every combatant twice.
      save();
      const patch={type:'tokenLibraryPatch',revision:Date.now()+Math.random(),token:structuredClone(old)};
      try{syncChannel?.postMessage(patch);}catch(e){}
      try{localStorage.setItem(TOKEN_SYNC_KEY,JSON.stringify(patch));}catch(e){}
      if(map?.playerAutoUpdate) publishPlayerMap(map);
      close();
      if(state.page==='map') renderMap();
      else if(COMBAT_WINDOW) renderCombat();
    }; if(file){const r=new FileReader();r.onload=()=>finish(r.result);r.readAsDataURL(file);}else finish(undefined);};
  }
  function tokenLibraryModal(){
    const wrap=document.createElement('div');wrap.className='modal-backdrop library-modal-backdrop';
    wrap.innerHTML=`<div class="modal-card modal-wide library-modal token-library-modal"><div class="modal-header"><div><div class="eyebrow">Armoury</div><h2>Token Library</h2><p class="muted small">Your ready-to-deploy collection of characters, enemies, allies and battlefield objects.</p></div><button id="close-tlib">×</button></div><div class="library-toolbar"><div class="library-search"><span>⌕</span><input id="token-library-search" placeholder="Search tokens..."></div><select id="token-library-type"><option value="">All Types</option>${['PC','NPC','Enemy','Ally','Object'].map(x=>`<option>${x}</option>`).join('')}</select><button class="button-primary" id="new-tok">${IC('plus')} New Token</button></div><div id="token-library-grid" class="token-library-grid token-library-showcase"></div></div>`;
    document.body.appendChild(wrap);const close=()=>wrap.remove();$('#close-tlib').onclick=close;$('#new-tok').onclick=()=>{close();tokenEditor(null,state.maps.find(x=>x.id===state.activeMapId));};
    const grid=$('#token-library-grid',wrap),search=$('#token-library-search',wrap),type=$('#token-library-type',wrap);
    const draw=()=>{const q=search.value.trim().toLowerCase(),f=type.value;const list=state.tokenLibrary.filter(t=>(!f||t.type===f)&&(!q||(t.name+' '+(t.type||'')).toLowerCase().includes(q)));grid.innerHTML=list.map(t=>`<article class="token-lib-card token-showcase-card"><div class="token-showcase-preview"><div class="token-showcase-ring">${t.image?`<img src="${esc(t.image)}" alt="${esc(t.name)}">`:`<span>${esc((t.name||'?')[0])}</span>`}</div><span class="token-type-badge">${esc(t.type||'Token')}</span></div><div class="token-showcase-info"><strong>${esc(t.name)}</strong><span class="muted small">${t.size||40}px · Ready to deploy</span></div><div class="token-showcase-actions"><button data-add="${t.id}">Place</button><button data-edit="${t.id}">Edit</button><button class="button-danger" data-del="${t.id}">Delete</button></div></article>`).join('')||'<div class="empty-state library-empty"><h3>Your armoury is empty</h3><p>Save a token once and it will be ready for every encounter.</p><button class="button-primary" id="empty-token-new">Create First Token</button></div>';
      $('#empty-token-new',grid)?.addEventListener('click',()=>{close();tokenEditor(null,state.maps.find(x=>x.id===state.activeMapId));});
      $$('[data-add]',grid).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===state.activeMapId),t=state.tokenLibrary.find(x=>x.id===b.dataset.add);if(m&&t){addTokenFromLibrary(m,t);close();}});
      $$('[data-edit]',grid).forEach(b=>b.onclick=()=>{const t=state.tokenLibrary.find(x=>x.id===b.dataset.edit);close();tokenEditor(t?.id,state.maps.find(x=>x.id===state.activeMapId));});
      $$('[data-del]',grid).forEach(b=>b.onclick=()=>{if(confirm('Delete saved token?')){state.tokenLibrary=state.tokenLibrary.filter(x=>x.id!==b.dataset.del);persist();draw();}});
    };search.oninput=draw;type.onchange=draw;draw();
  }

  function mapLibraryModal(){
    const wrap=document.createElement('div');wrap.className='modal-backdrop library-modal-backdrop';
    wrap.innerHTML=`<div class="modal-card modal-wide library-modal map-library-modal"><div class="modal-header"><div><div class="eyebrow">War Room Archives</div><h2>Map Library</h2><p class="muted small">Keep your battlefields ready. Preview, open, rename or remove saved maps without touching their tokens or fog data.</p></div><button id="close-maplib">×</button></div><div class="library-toolbar"><div class="library-search"><span>⌕</span><input id="map-library-search" placeholder="Search maps..."></div><button class="button-primary" id="new-map-library">${IC('plus')} Upload Map</button></div><div id="map-library-grid" class="map-library-grid"></div></div>`;
    document.body.appendChild(wrap);const close=()=>wrap.remove();$('#close-maplib').onclick=close;$('#new-map-library').onclick=()=>{close();createMap();};
    const grid=$('#map-library-grid',wrap),search=$('#map-library-search',wrap);
    const draw=()=>{const q=search.value.trim().toLowerCase();const list=state.maps.filter(m=>(m.name||'').toLowerCase().includes(q));grid.innerHTML=list.map(m=>`<article class="map-lib-card ${m.id===state.activeMapId?'is-active':''}"><button class="map-lib-preview" data-open-map="${m.id}" title="Open map"><img src="${esc(m.image)}" alt="${esc(m.name)}"><span class="map-lib-overlay">${m.id===state.activeMapId?'ACTIVE':'OPEN MAP'}</span></button><div class="map-lib-info"><strong>${esc(m.name)}</strong><div class="map-lib-meta"><span>${Number(m.mapWidth||0)} × ${Number(m.mapHeight||0)}</span><span>${(m.tokens||[]).length} tokens</span></div></div><div class="map-lib-actions"><button data-open-map="${m.id}">Open</button><button data-rename-map="${m.id}">Rename</button><button class="button-danger" data-delete-map="${m.id}">Delete</button></div></article>`).join('')||'<div class="empty-state library-empty"><h3>No battlefields saved</h3><p>Upload a PNG or JPG to create your first map.</p><button class="button-primary" id="empty-map-new">Upload First Map</button></div>';
      $('#empty-map-new',grid)?.addEventListener('click',()=>{close();createMap();});
      $$('[data-open-map]',grid).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===b.dataset.openMap);if(m){state.activeMapId=m.id;persist();close();renderMap();}});
      $$('[data-rename-map]',grid).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===b.dataset.renameMap);if(!m)return;const n=prompt('Map name:',m.name);if(n&&n.trim()){m.name=n.trim();persist();draw();}});
      $$('[data-delete-map]',grid).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===b.dataset.deleteMap);if(!m)return;if(confirm(`Delete "${m.name}" and its tokens/fog?`)){state.maps=state.maps.filter(x=>x.id!==m.id);state.activeMapId=state.maps[0]?.id||null;persist();draw();if(!state.maps.length){close();renderMap();}}});
    };search.oninput=draw;draw();
  }

  function renderMapLibraryPage(){
    const s=$('#map-library-section');if(!s)return;
    s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Battlefield Archives</div><h1>Map Library</h1><p class="muted">Browse your saved battlefields visually and open them in the Game Room.</p></div><div class="toolbar"><button class="button-primary" id="page-new-map">${IC('plus')} Upload Map</button></div></div><div class="map-library-page-grid">${state.maps.map(m=>`<article class="map-lib-card map-page-card ${m.active===false?'is-deactivated':''}"><button class="map-lib-preview" data-page-open-map="${m.id}"><img src="${esc(m.image)}" alt="${esc(m.name)}"><span class="map-lib-overlay">${m.active===false?'DEACTIVATED':m.id===state.activeMapId?'ACTIVE':'OPEN GAME ROOM'}</span></button><div class="map-lib-info"><strong>${esc(m.name)}</strong><div class="map-lib-meta"><span>${Number(m.mapWidth||0)} × ${Number(m.mapHeight||0)}</span><span>${(m.tokens||[]).length} tokens</span></div><div class="map-lib-status"><span class="badge">${m.active===false?'Inactive':'Available'}</span></div></div><div class="map-lib-actions"><button data-page-open-map="${m.id}" ${m.active===false?'disabled':''}>Open</button><button data-page-toggle-map="${m.id}">${m.active===false?'Activate':'Deactivate'}</button><button data-page-rename-map="${m.id}">Rename</button><button class="button-danger" data-page-delete-map="${m.id}">Delete</button></div></article>`).join('')||'<div class="empty-state"><h3>No battlefields saved</h3><p>Upload your first map to populate the archive.</p></div>'}</div>`;
    $('#page-new-map').onclick=()=>{createMap();};
    $$('[data-page-open-map]',s).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===b.dataset.pageOpenMap);if(m&&m.active!==false){state.activeMapId=m.id;persist();navigate('game-room');}});
    $$('[data-page-toggle-map]',s).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===b.dataset.pageToggleMap);if(!m)return;m.active=m.active===false; if(!m.active && state.activeMapId===m.id){const next=state.maps.find(x=>x.id!==m.id&&x.active!==false);state.activeMapId=next?.id||null;} if(m.active && !state.activeMapId)state.activeMapId=m.id;persist();renderMapLibraryPage();});
    $$('[data-page-rename-map]',s).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===b.dataset.pageRenameMap);const n=m&&prompt('Map name:',m.name);if(n?.trim()){m.name=n.trim();persist();renderMapLibraryPage();}});
    $$('[data-page-delete-map]',s).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===b.dataset.pageDeleteMap);if(m&&confirm(`Delete "${m.name}" and its tokens/fog?`)){state.maps=state.maps.filter(x=>x.id!==m.id);state.activeMapId=state.maps[0]?.id||null;persist();renderMapLibraryPage();}});
  }
  function renderTokenLibraryPage(){
    const s=$('#token-library-section');if(!s)return;
    s.innerHTML=`<div class="section-header"><div><div class="eyebrow">Armoury</div><h1>Token Library</h1><p class="muted">Reusable tokens for characters, enemies, allies and battlefield objects.</p></div><div class="toolbar"><button class="button-primary" id="page-new-token">${IC('plus')} New Token</button></div></div><div class="token-library-page-grid">${state.tokenLibrary.map(t=>`<article class="token-lib-card token-showcase-card"><div class="token-showcase-preview"><div class="token-showcase-ring">${t.image?`<img src="${esc(t.image)}" alt="${esc(t.name)}">`:`<span>${esc((t.name||'?')[0])}</span>`}</div><span class="token-type-badge">${esc(t.type||'Token')}</span></div><div class="token-showcase-info"><strong>${esc(t.name)}</strong><span class="muted small">${t.size||40}px · Ready to deploy</span></div><div class="token-showcase-actions"><button data-page-place-token="${t.id}">Place</button><button data-page-edit-token="${t.id}">Edit</button><button class="button-danger" data-page-delete-token="${t.id}">Delete</button></div></article>`).join('')||'<div class="empty-state"><h3>Your armoury is empty</h3><p>Create a reusable token template to get started.</p></div>'}</div>`;
    $('#page-new-token').onclick=()=>tokenEditor(null,state.maps.find(x=>x.id===state.activeMapId));
    $$('[data-page-place-token]',s).forEach(b=>b.onclick=()=>{const m=state.maps.find(x=>x.id===state.activeMapId),t=state.tokenLibrary.find(x=>x.id===b.dataset.pagePlaceToken);if(m&&t){addTokenFromLibrary(m,t);navigate('game-room');}});
    $$('[data-page-edit-token]',s).forEach(b=>b.onclick=()=>{const t=state.tokenLibrary.find(x=>x.id===b.dataset.pageEditToken);tokenEditor(t?.id,state.maps.find(x=>x.id===state.activeMapId));});
    $$('[data-page-delete-token]',s).forEach(b=>b.onclick=()=>{if(confirm('Delete saved token?')){state.tokenLibrary=state.tokenLibrary.filter(x=>x.id!==b.dataset.pageDeleteToken);persist();renderTokenLibraryPage();}});
  }

  document.addEventListener('fullscreenchange',()=>{const vtt=$('#map-vtt');if(vtt&&!document.fullscreenElement)vtt.classList.remove('map-fullscreen');});
  function toggleMapFullscreen(){
    const vtt=$('#map-vtt'); if(!vtt)return;
    if(document.fullscreenElement){ document.exitFullscreen?.(); vtt.classList.remove('map-fullscreen'); return; }
    vtt.classList.add('map-fullscreen');
    const target=$('#map-section');
    target?.requestFullscreen?.().catch(()=>{});
  }
  function centerMapView(map){
    const wrap=$('#map-stage-wrap'),stage=$('#map-stage'); if(!wrap||!stage)return;
    const z=Math.max(.25,Math.min(3,Number(map.zoom)||1));
    requestAnimationFrame(()=>{
      const sw=stage.offsetWidth*z, sh=stage.offsetHeight*z;
      wrap.scrollLeft=Math.max(0,(sw-wrap.clientWidth)/2);
      wrap.scrollTop=Math.max(0,(sh-wrap.clientHeight)/2);
    });
  }
  function setupMapCanvas(map){
    const stage=$('#map-stage'), wrap=$('#map-stage-wrap'), fog=$('#map-fog'), draw=$('#map-draw'), img=$('#map-image');
    if(!stage||!img||!wrap)return;
    const zoom=()=>Math.max(.25,Math.min(3,Number(map.zoom)||1));
    const applyZoom=()=>{
      const z=zoom(); map.zoom=z; stage.style.setProperty('--zoom',z);
      stage.style.transform=`translate(${Number(map.panX||0)}px, ${Number(map.panY||0)}px) scale(${z})`; stage.style.transformOrigin='0 0';
      stage.style.marginRight=(stage.offsetWidth*(z-1)+Math.max(0,Number(map.panX||0)))+'px'; stage.style.marginBottom=(stage.offsetHeight*(z-1)+Math.max(0,Number(map.panY||0)))+'px';
      const label=$('#zoom-label'); if(label)label.textContent=Math.round(z*100)+'%';
    };
    img.onload=()=>{
      const w=img.naturalWidth,h=img.naturalHeight; if(!w||!h)return;
      stage.style.width=w+'px'; stage.style.height=h+'px'; img.style.width=w+'px'; img.style.height=h+'px';
      [fog,draw].forEach(c=>{c.width=w;c.height=h;c.style.width=w+'px';c.style.height=h+'px';});
      drawMapCanvases(map); applyZoom();
      if(!map._hasCentered){ map._hasCentered=true; persist({publishPlayer:false, syncState:false}); centerMapView(map); }
    };
    img.onerror=()=>stage.classList.add('map-image-error'); img.src=map.image;
    let action=null,last=null,start=null;
    const pos=e=>{const r=stage.getBoundingClientRect(),z=zoom();return{x:(e.clientX-r.left)/z,y:(e.clientY-r.top)/z};};
    wrap.onpointermove=e=>{if(action==='pan'){map.panX=last.px+(e.clientX-last.x);map.panY=last.py+(e.clientY-last.y);applyZoom();}};
    wrap.onpointerup=e=>{if(action==='pan'){persist({syncState:false,publishPlayer:false});action=null;last=null;wrap.releasePointerCapture?.(e.pointerId);wrap.classList.remove('is-panning');e.preventDefault();}};
    wrap.onpointercancel=()=>{if(action==='pan'){action=null;last=null;wrap.classList.remove('is-panning');}};
    stage.onpointerdown=e=>{
      // Pan has two entry points: the selected toolbar Pan tool, or temporary Ctrl+drag.
      // Ctrl always wins, allowing quick panning without changing the selected tool.
      const tool=map.tool||'none';
      if(e.ctrlKey || tool==='pan'){
        action='pan'; last={x:e.clientX,y:e.clientY,px:Number(map.panX||0),py:Number(map.panY||0)};
        stage.setPointerCapture?.(e.pointerId); wrap.classList.add('is-panning'); e.preventDefault(); e.stopPropagation(); return;
      }
      if(['fog','hide','show'].includes(tool)){
        action='rect'; start=pos(e); last=start; stage.setPointerCapture?.(e.pointerId); e.preventDefault(); drawMapCanvases(map,start,last,true); return;
      }
      if(tool==='draw'||tool==='erase'){
        pushMapUndo(map); action='draw'; last=pos(e); stage.setPointerCapture?.(e.pointerId); paintMap(map,last,last,tool); e.preventDefault();
      }
    };
    stage.onpointermove=e=>{
      if(action==='pan'){map.panX=last.px+(e.clientX-last.x);map.panY=last.py+(e.clientY-last.y);applyZoom();return;}
      if(action==='rect'){const now=pos(e);last=now;drawMapCanvases(map,start,last,true);return;}
      if(action==='draw'){const now=pos(e);paintMap(map,last,now,map.tool||'draw');last=now;}
    };
    stage.onpointerup=e=>{
      try{
        if(action==='pan'){persist({syncState:false,publishPlayer:false});return;}
        if(action==='rect'&&start&&last){
          const selectedTool=map.tool;
          const x=Math.min(start.x,last.x),y=Math.min(start.y,last.y),w=Math.abs(last.x-start.x),h=Math.abs(last.y-start.y);
          if(w>4&&h>4){
            pushMapUndo(map);
            addVisibilityRect(map,x,y,w,h,selectedTool==='show'?'show':(selectedTool==='fog'?'fog':'dark'));
          }
          // Keep the selected visibility tool active after the rectangle is committed.
          // This lets the GM paint multiple Fog/Show/Dark areas in succession. The pointer
          // action is still fully reset below, so the tool never gets stuck in a drag state.
          drawMapCanvases(map);
          syncToolUI();
          // Visibility changes are always player-visible state. Publish them even when
          // Auto Update Player Map is disabled, so revealing a token does not require
          // moving the token or another unrelated map change to wake the Player Map.
          persist({publishPlayer:false, syncState:false});
          publishPlayerMap(map);
        } else if(action==='draw'){persist({syncState:false,publishPlayer:false});}
      }catch(err){
        console.error('Map visibility tool failed safely:',err);
        if(action==='rect'){syncToolUI();try{drawMapCanvases(map);}catch(_){}}
      }
      finally{
        try{stage.releasePointerCapture?.(e.pointerId);}catch(err){}
        action=null;last=null;start=null;wrap.classList.remove('is-panning');
      }
      e.preventDefault();
    };
    stage.onpointercancel=e=>{try{stage.releasePointerCapture?.(e.pointerId);}catch(err){};action=null;last=null;start=null;wrap.classList.remove('is-panning');try{drawMapCanvases(map);}catch(err){console.error(err);}};
    const handleGMMapWheel=e=>{
      // Keep GM-map zoom completely local to this map viewport. Capture the
      // wheel on the whole viewport so Ctrl+wheel cannot fall through to
      // browser/page zoom or another map window.
      if(!e.ctrlKey)return;
      e.preventDefault();
      e.stopPropagation();
      const old=zoom(),factor=e.deltaY<0?1.1:.9,next=Math.max(.25,Math.min(3,old*factor)); if(next===old)return;
      const r=wrap.getBoundingClientRect(),beforeX=(e.clientX-r.left+wrap.scrollLeft)/old,beforeY=(e.clientY-r.top+wrap.scrollTop)/old;
      map.zoom=next;applyZoom();
      requestAnimationFrame(()=>{wrap.scrollLeft=beforeX*next-(e.clientX-r.left);wrap.scrollTop=beforeY*next-(e.clientY-r.top);});persist({syncState:false,publishPlayer:false});
    };
    wrap.addEventListener('wheel',handleGMMapWheel,{passive:false});
    const stopPanOnEscape=e=>{if(e.key==='Escape' && action==='pan'){action=null;last=null;start=null;wrap.classList.remove('is-panning');persist({syncState:false,publishPlayer:false});}};
    document.addEventListener('keydown',stopPanOnEscape,{once:false});
    $('#zoom-in').onclick=()=>{map.zoom=Math.min(3,zoom()*1.15);applyZoom();persist({syncState:false,publishPlayer:false});};
    $('#zoom-out').onclick=()=>{map.zoom=Math.max(.25,zoom()/1.15);applyZoom();persist({syncState:false,publishPlayer:false});};
    $('#zoom-reset').onclick=()=>{map.zoom=1;map.panX=0;map.panY=0;applyZoom();centerMapView(map);persist({syncState:false,publishPlayer:false});};
  }
  function paintMap(map,a,b,tool){
    const dist=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(dist/12));
    for(let i=0;i<=steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
      const radius=Math.max(1,Number(map.brushSize)||20)/2;
      if(tool==='draw')map.draw.push({x,y,radius,kind:'dot'});
      else if(tool==='erase')map.draw=map.draw.filter(d=>Math.hypot(d.x-x,d.y-y)>radius+(Number(d.radius)||2));
    } drawMapCanvases(map);
  }
  function drawMapCanvases(map,previewA=null,previewB=null,previewRect=false){
    const fog=$('#map-fog'),draw=$('#map-draw');if(!fog||!draw)return;
    const fc=fog.getContext('2d'),dc=draw.getContext('2d');
    fc.clearRect(0,0,fog.width,fog.height);dc.clearRect(0,0,draw.width,draw.height);
    // Authoritative visibility rendering. Each rectangle replaces the state beneath it.
    if(map.fogEnabled!==false){
      for(const r of map.fogRects||[]) applyVisibilityRect(fc,r,fogState(r),false);
    }
    if(previewRect&&previewA&&previewB){
      const x=Math.min(previewA.x,previewB.x),y=Math.min(previewA.y,previewB.y),w=Math.abs(previewB.x-previewA.x),h=Math.abs(previewB.y-previewA.y);
      if(map.tool==='hide'){fc.fillStyle='rgba(0,0,0,1)';fc.fillRect(x,y,w,h);}
      else if(map.tool==='show'){fc.globalCompositeOperation='destination-out';fc.fillRect(x,y,w,h);fc.globalCompositeOperation='source-over';}
      else if(map.tool==='fog'){fc.fillStyle='rgba(112,112,112,.48)';fc.fillRect(x,y,w,h);}
      fc.strokeStyle='rgba(235,210,145,.95)';fc.lineWidth=2;fc.strokeRect(x,y,w,h);
    }
    for(const d of map.draw||[]){dc.fillStyle=d.color||map.drawColor||'#ebd291';dc.beginPath();dc.arc(d.x,d.y,Number(d.radius)||2,0,Math.PI*2);dc.fill();}
  }
  function renderMapTokens(map){
    const box=$('#map-tokens');if(!box)return;box.innerHTML='';
    for(const t of map.tokens||[]){
      const el=document.createElement('div');
      el.className='map-token';el.style.left=t.x+'px';el.style.top=t.y+'px';el.style.width=t.size+'px';el.style.height=t.size+'px';el.style.setProperty('--token-size',(Number(t.size)||40)+'px');el.title=t.name;
      const combatant=(state.combat?.combatants||[]).find(c=>c.id===t.combatantId);
      const dead=!!combatant?.dead;
      const shocked=!dead && !!combatant?.shocked;
      el.classList.toggle('is-dead',dead);
      el.classList.toggle('is-shocked',shocked);
      const condition=dead
        ? '<div class="token-dead-state" aria-hidden="true"><div class="token-dead-red"></div><div class="token-dead-skull" title="Dead">'+DEAD_SKULL+'</div></div>'
        : shocked
          ? '<div class="token-shock-state" aria-hidden="true"><div class="token-shock-yellow"></div><div class="token-shock-icon" title="Shocked">'+SHOCK_LIGHTNING_GM+'</div></div>'
          : '';
      el.innerHTML=(t.image?`<img class="token-art" src="${esc(t.image)}" alt="${esc(t.name)}">`:`<span class="token-fallback">${esc((t.name||'?')[0])}</span>`)+condition+(combatant?`<div class="token-name-label">${esc(combatant.name||t.name||'')}</div>`:'');
      el.onpointerdown=e=>{if(e.ctrlKey)return;if((map.tool||'none')!=='none'||e.button!==0)return;e.preventDefault();e.stopPropagation();pushMapUndo(map);const stage=$('#map-stage'),z=Math.max(.25,Math.min(3,Number(map.zoom)||1));const r=stage.getBoundingClientRect();const ox=(e.clientX-r.left)/z-t.x,oy=(e.clientY-r.top)/z-t.y;el.setPointerCapture?.(e.pointerId);const move=ev=>{const rr=stage.getBoundingClientRect();t.x=Math.max(0,(ev.clientX-rr.left)/z-ox);t.y=Math.max(0,(ev.clientY-rr.top)/z-oy);el.style.left=t.x+'px';el.style.top=t.y+'px';};const up=()=>{el.releasePointerCapture?.(e.pointerId);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);persist({syncState:false});};el.addEventListener('pointermove',move);el.addEventListener('pointerup',up,{once:true});el.addEventListener('pointercancel',up,{once:true});};
      el.ondblclick=()=>{if(confirm(`Remove ${t.name} from this map?`)){pushMapUndo(map);map.tokens=map.tokens.filter(x=>x.id!==t.id);persist({syncState:false});renderMap();}};box.appendChild(el);
    }
  }

  function renderDashboard(){
    const s=$('#dashboard-section');s.innerHTML=`<div class="section-header"><div><div class="eyebrow">GM Tools</div><h1>Content Dashboard</h1><p class="muted">Create the data that drives the character builder. Every entry can define keywords, eligibility and tier XP.</p></div><div class="toolbar"><button id="export-content">Export Content</button><button id="import-content">Import Content</button><input id="content-file" type="file" accept="application/json" hidden></div></div><div class="dashboard-tabs">${[['content','Content'],['definitions','Archetypes / Species / Backgrounds'],['tags','Tag Registry'],['xp','XP Rules']].map((x,i)=>`<button class="dashboard-tab ${i===0?'active':''}" data-tab="${x[0]}">${x[1]}</button>`).join('')}</div><div id="dash-body"></div>`;
    $('#export-content').onclick=()=>exportContent();$('#import-content').onclick=()=>$('#content-file').click();$('#content-file').onchange=e=>importContent(e.target.files[0]);let tab='content';$$('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;$$('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));draw();});draw();
    function draw(){const body=$('#dash-body');if(tab==='content')drawContent(body);if(tab==='definitions')drawDefs(body);if(tab==='tags')drawTags(body);if(tab==='xp')drawXP(body);}
    function drawContent(body){let type='talents';body.innerHTML=`<div class="dashboard-tabs">${TYPES.map(x=>`<button class="dashboard-tab ${x[0]===type?'active':''}" data-ct="${x[0]}">${x[1]}</button>`).join('')}</div><div class="dashboard-toolbar"><input id="dq" placeholder="Search content..."><button class="button-primary" id="add-content">${IC('plus')} Add Entry</button></div><div id="content-list"></div>`;const refresh=()=>{const q=$('#dq').value.toLowerCase();$('#content-list').innerHTML=state.content[type].filter(x=>(x.name+' '+(x.description||'')+' '+(x.keywords||[]).join(' ')).toLowerCase().includes(q)).map(x=>`<div class="dashboard-row card"><div class="dashboard-main"><strong>${esc(x.name)}</strong> <span class="badge">Tier ${x.tier}</span> ${x.example?'<span class="badge example-badge">Example</span>':''}<p class="muted small">${esc(x.description)}</p><div class="tag-cloud">${(x.keywords||[]).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')} ${(x.requiredTags||[]).map(t=>`<span class="tag-chip">Requires: ${esc(t)}</span>`).join('')}</div><p class="small">XP: ${[1,2,3,4,5].map(t=>`${t}:${cost(x,t)}`).join(' · ')}</p></div><div class="toolbar"><button data-edit="${x.id}">Edit</button><button class="button-danger" data-del="${x.id}">Delete</button></div></div>`).join('')||'<div class="card empty-state">No entries.</div>';$$('[data-edit]').forEach(b=>b.onclick=()=>contentEditor(type,b.dataset.edit,refresh));$$('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('Delete this entry?')){state.content[type]=state.content[type].filter(x=>x.id!==b.dataset.del);persist();refresh();}});};$$('[data-ct]').forEach(b=>b.onclick=()=>{type=b.dataset.ct;drawContent(body);});$('#add-content').onclick=()=>contentEditor(type,null,refresh);$('#dq').oninput=refresh;refresh();}
    function drawDefs(body){let type='archetypes';body.innerHTML=`<div class="dashboard-toolbar"><select id="dt">${DEF_TYPES.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select><button class="button-primary" id="add-def">${IC('plus')} Add Definition</button></div><div id="def-list"></div>`;$('#dt').value=type;const refresh=()=>{$('#def-list').innerHTML=state.definitions[type].map(x=>`<div class="dashboard-row card"><div class="dashboard-main"><strong>${esc(x.name)}</strong> <span class="badge">${type}</span><p class="muted small">${esc(x.description)}</p><div class="tag-cloud">${(x.tags||[]).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')}</div><p class="small">XP: ${[1,2,3,4,5].map(t=>`${t}:${cost(x,t)}`).join(' · ')}</p></div><div class="toolbar"><button data-edit-def="${x.id}">Edit</button><button class="button-danger" data-del-def="${x.id}">Delete</button></div></div>`).join('')||'<div class="card empty-state">No definitions.</div>';$$('[data-edit-def]').forEach(b=>b.onclick=()=>defEditor(type,b.dataset.editDef,refresh));$$('[data-del-def]').forEach(b=>b.onclick=()=>{if(confirm('Delete this definition?')){state.definitions[type]=state.definitions[type].filter(x=>x.id!==b.dataset.delDef);persist();refresh();}});};$('#dt').onchange=e=>{type=e.target.value;refresh();};$('#add-def').onclick=()=>defEditor(type,null,refresh);refresh();}
    function drawTags(body){const all=[...new Set([...state.tags,...TYPES.flatMap(([k])=>state.content[k].flatMap(x=>[...(x.keywords||[]),...(x.requiredTags||[]),...(x.forbiddenTags||[])]),),...DEF_TYPES.flatMap(([k])=>state.definitions[k].flatMap(x=>x.tags||[]))])].sort();body.innerHTML=`<div class="card"><h2>Tag Registry</h2><p class="muted">Tags are the glue between identity and content eligibility.</p><div class="inline-form"><input id="newtag" placeholder="Psyker, Aeldari, Military"><button class="button-primary" id="addtag">Add Tag</button></div><div class="tag-cloud" style="margin-top:16px">${all.map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')||'<span class="muted">No tags.</span>'}</div></div>`;$('#addtag').onclick=()=>{const v=$('#newtag').value.trim();if(v){state.tags=[...new Set([...state.tags,v])];persist();drawTags(body);}};}
    function drawXP(body){body.innerHTML=`<div class="card"><h2>Character XP Rules</h2><p class="muted">Starting budgets are campaign settings. Every content entry has its own Tier 1–5 cost.</p><div class="xp-grid">${[1,2,3,4,5].map(t=>`<div class="field"><label>Tier ${t} starting XP</label><input id="xb${t}" type="number" value="${state.settings.budgets[t]}"></div>`).join('')}</div><label class="check-row"><input id="allowxp" type="checkbox" ${state.settings.allowExtra?'checked':''}> Allow extra XP</label><button class="button-primary" id="savexp">Save XP Rules</button></div>`;$('#savexp').onclick=()=>{[1,2,3,4,5].forEach(t=>state.settings.budgets[t]=Math.max(0,Number($(`#xb${t}`).value)||0));state.settings.allowExtra=$('#allowxp').checked;persist();alert('XP rules saved.');};}
  }
  function contentEditor(type,id,refresh){const old=state.content[type].find(x=>x.id===id)||{id:uid(type.slice(0,3)),name:'',tier:1,description:'',keywords:[],requiredTags:[],anyRequiredTags:[],forbiddenTags:[],xp:{1:0,2:0,3:0,4:0,5:0}};const name=prompt('Name',old.name);if(name===null)return;old.name=name.trim()||'Unnamed Entry';const desc=prompt('Description',old.description);if(desc!==null)old.description=desc;const kw=prompt('Keywords (comma separated)',(old.keywords||[]).join(', '));if(kw!==null)old.keywords=csv(kw);const req=prompt('Required ALL tags', (old.requiredTags||[]).join(', '));if(req!==null)old.requiredTags=csv(req);const any=prompt('Required ANY tags',(old.anyRequiredTags||[]).join(', '));if(any!==null)old.anyRequiredTags=csv(any);const forb=prompt('Forbidden tags',(old.forbiddenTags||[]).join(', '));if(forb!==null)old.forbiddenTags=csv(forb);for(const t of [1,2,3,4,5]){const v=prompt(`Tier ${t} XP`,String(cost(old,t)));if(v!==null)old.xp[t]=Math.max(0,Number(v)||0);}const tier=prompt('Content tier (1-5)',String(old.tier));if(tier!==null)old.tier=Math.min(5,Math.max(1,Number(tier)||1));if(!id)state.content[type].push(old);persist();refresh();}
  function defEditor(type,id,refresh){const old=state.definitions[type].find(x=>x.id===id)||{id:uid(type.slice(0,3)),name:'',description:'',tags:[],xp:{1:0,2:0,3:0,4:0,5:0}};const name=prompt('Name',old.name);if(name===null)return;old.name=name.trim()||'Unnamed';const desc=prompt('Description',old.description);if(desc!==null)old.description=desc;const tags=prompt('Tags inherited by characters',old.tags.join(', '));if(tags!==null)old.tags=csv(tags);for(const t of [1,2,3,4,5]){const v=prompt(`Tier ${t} XP`,String(cost(old,t)));if(v!==null)old.xp[t]=Math.max(0,Number(v)||0);}if(!id)state.definitions[type].push(old);persist();refresh();}
  function exportAll(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wrath-glory-campaign.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
  function exportContent(){const blob=new Blob([JSON.stringify({content:state.content,definitions:state.definitions,tags:state.tags,settings:state.settings},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wrath-glory-content.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
  async function importContent(file){if(!file)return;try{const x=JSON.parse(await file.text());if(x.content)state.content={...state.content,...x.content};if(x.definitions)state.definitions={...state.definitions,...x.definitions};if(Array.isArray(x.tags))state.tags=[...new Set([...state.tags,...x.tags])];if(x.settings)state.settings={...state.settings,...x.settings};persist();renderDashboard();alert('Content imported.');}catch(e){alert('Import failed: '+e.message);}}

  let lastPlayerPublishedImageByMap=new Map();
  let lastPlayerPublishedTokenImagesByMap=new Map();
  let playerBootstrapMsg=null;
  let playerBootstrapTimer=0;
  function schedulePlayerBootstrap(msg){
    playerBootstrapMsg=msg;
    if(playerBootstrapTimer) return;
    playerBootstrapTimer=window.setTimeout(()=>{
      playerBootstrapTimer=0;
      const pending=playerBootstrapMsg;
      playerBootstrapMsg=null;
      if(!pending) return;
      try { localStorage.setItem(PLAYER_SYNC_KEY,JSON.stringify(pending)); }
      catch(e) { console.warn('Player bootstrap cache write skipped safely:',e); }
    },250);
  }
  function publishPlayerMap(map){
    if(!map) return;
    const revision=Date.now()+Math.random();
    const image=String(map.image||'');
    const previousImage=lastPlayerPublishedImageByMap.get(map.id);
    const knownTokens=lastPlayerPublishedTokenImagesByMap.get(map.id) || new Map();
    const nextKnownTokens=new Map();

    // Build a lightweight map snapshot manually. In particular, do NOT
    // structuredClone the full map and then delete image: that still clones the
    // megabytes of image data before deleting it.
    const mapSnapshot={...map};
    mapSnapshot.image=previousImage===image ? '' : image;
    if(previousImage!==image) lastPlayerPublishedImageByMap.set(map.id,image);
    mapSnapshot.fogRects=structuredClone(map.fogRects||[]);
    mapSnapshot.draw=structuredClone(map.draw||[]);
    mapSnapshot.tokens=(map.tokens||[]).map(token=>{
      const copy={...token};
      const tokenImage=String(token.image||'');
      const previousTokenImage=knownTokens.get(token.id);
      copy.image=previousTokenImage===tokenImage ? '' : tokenImage;
      nextKnownTokens.set(token.id,tokenImage);
      return copy;
    });
    lastPlayerPublishedTokenImagesByMap.set(map.id,nextKnownTokens);

    const msg={type:'playerRefresh',revision,mapId:map.id,map:mapSnapshot,combat:structuredClone(state.combat)};
    window.__WG_LAST_PLAYER_REFRESH__=msg;
    // BroadcastChannel is asynchronous and does not block the GM window.
    try { syncChannel?.postMessage(msg); } catch(e) { console.warn('Player broadcast skipped safely:',e); }
    // localStorage is now only a debounced bootstrap cache for a Player window
    // that opens later. It is never part of the interactive fog/show path.
    schedulePlayerBootstrap(msg);
  }
  function mapPointShown(map,x,y){
    if(map.fogEnabled===false) return true;
    let shown=false;
    for(const r of map.fogRects||[]){ if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h) shown=fogState(r)==='show'; }
    return shown;
  }
  function renderPlayerMap(forcedZoom=null, previousMap=null, previousCombat=null, animationOptions={}){
    if(PLAYER_MODE && !window.__WG_PLAYER_PUBLISHED_MAP__){
      try{
        const pending=JSON.parse(localStorage.getItem(PLAYER_SYNC_KEY)||'null');
        if(pending?.map && pending.map.id===MAP_WINDOW_ID){
          window.__WG_PLAYER_PUBLISHED_MAP__=structuredClone(pending.map);
          window.__WG_PLAYER_PUBLISHED_COMBAT__=structuredClone(pending.combat||{combatants:[]});
          window.__WG_PLAYER_REFRESH_REVISION__=pending.revision||'';
        }
      }catch(e){console.warn('Player Map initial snapshot read failed safely.',e);}
    }
    const map=window.__WG_PLAYER_PUBLISHED_MAP__ || state.maps.find(x=>x.id===MAP_WINDOW_ID)||state.maps.find(x=>x.id===state.activeMapId)||state.maps[0];
    if(!map){
      document.body.className='wg-player-window app-ready';
      document.body.innerHTML='<main class="player-empty"><h1>No map selected</h1><p>Open the player map from the GM Map tab.</p></main>';
      return;
    }
    const snapshot=window.__WG_PLAYER_PUBLISHED_COMBAT__ || state.combat || {combatants:[]};
    const prior=previousMap || window.WGPlayerMapController?.getSnapshot?.()?.map || null;
    window.WGPlayerMapController?.mount?.(map,snapshot,{zoom:forcedZoom??window.__WG_PLAYER_ZOOM__??1,panX:window.__WG_PLAYER_PAN_X__||0,panY:window.__WG_PLAYER_PAN_Y__||0,revision:window.__WG_PLAYER_REFRESH_REVISION__||''});
    if(animationOptions.animated && prior && window.WGPlayerMapController){
      window.WGPlayerMapController.applySnapshot(map,snapshot,{animated:true,previousMap:prior,previousCombat:previousCombat||state.combat,revision:window.__WG_PLAYER_REFRESH_REVISION__});
    }
  }
  function openPlayerMap(map){ const u=new URL(location.href);u.searchParams.set('playerView','1');u.searchParams.set('map',map.id);const w=window.open(u.toString(),'wg-player-map-'+map.id); if(w) w.focus(); else alert('The browser blocked the new tab. Please allow pop-ups for this app.'); }
  function openCombatWindow(){ const u=new URL(location.href);u.searchParams.set('combatView','1');u.searchParams.delete('playerView');u.searchParams.delete('map');const w=window.open(u.toString(),'wg-combat-tracker'); if(w) w.focus(); else alert('The browser blocked the new tab. Please allow pop-ups for this app.'); }

  function boot(){
    document.body.classList.remove('app-ready');
    if(PLAYER_MODE){ renderPlayerMap(); requestAnimationFrame(()=>document.body.classList.add('app-ready')); window.__WG_APP_STARTED__=true; return; }
    shell();
    if(COMBAT_WINDOW){ navigate('combat'); document.body.classList.add('wg-combat-window'); } else navigate(state.page||'home');
    requestAnimationFrame(()=>document.body.classList.add('app-ready'));
    window.__WG_APP_STARTED__=true;
  }
  try { boot(); } catch(e) { console.error(e); document.body.classList.add('app-ready'); const root=$('#app');root.innerHTML=`<main style="padding:32px;color:#e7e2d7;background:#090a0d;min-height:100vh;font-family:system-ui"><h1>Application Error</h1><pre style="white-space:pre-wrap">${esc(e.stack||e.message||e)}</pre></main>`; }
})();
