KOUSHA'S TABLE
==============
A local-first GM toolkit: combat tracker, character builder, content dashboard
and a virtual tabletop. Styled in an Imperial-gothic (Warhammer 40K) theme.

Local-first HTML/CSS/JavaScript campaign manager for a Wrath & Glory campaign.

RUNNING LOCALLY
---------------

Do not open index.html directly if your browser blocks JavaScript modules.

From the project folder run:

    python -m http.server 8000

Then open:

    http://localhost:8000

No internet connection, database, hosting account, or backend is required.

MOBILE / LAN
------------

On the same Wi-Fi network, start the server on the computer and open:

    http://YOUR-COMPUTER-LAN-IP:8000

Example:

    http://192.168.1.25:8000

You may need to allow Python through the computer firewall. Do not expose the
server directly to the public internet.

CURRENT FEATURES
----------------

COMBAT
- Add saved character templates to combat.
- Editable Wounds, Shock, Defense, Resilience and Initiative.
- Quick +/- Wound and Shock controls.
- Initiative sorting.
- Start Combat / End Battle.
- Previous/next turn and round tracking.
- Active-turn highlighting.
- Rename encounter.
- Save/load/delete encounters.

CHARACTERS
- Reusable character templates.
- PC / NPC / Enemy / Ally types.
- Tier 1-5.
- Extra XP budget.
- Archetype, species and background selection.
- Custom character tags.
- Faction, role, portrait and notes.
- Combat profile fields.
- XP budget and current XP spending display.
- Save and immediately add to combat.

CHARACTER BUILDER
- Select a character and build directly onto that template.
- Talents.
- Psychic abilities.
- Prayers.
- Wargear.
- Weapons.
- Tier filtering.
- Search.
- Eligibility filtering.
- Automatic tag inheritance.
- Tier-specific XP costs.
- Selected-content XP tracking.

CONTENT DASHBOARD
-----------------

Open the "Dashboard" tab in the main navigation.

Abilities & Gear:
- Add, edit and delete talents.
- Add, edit and delete psychic abilities.
- Add, edit and delete prayers.
- Add, edit and delete wargear.
- Add, edit and delete weapons.
- Give every entry a cost for Tier 1, 2, 3, 4 and 5.
- Optional extra XP modifier.
- Add keywords/tags.
- Require ALL tags.
- Require ANY tag.
- Forbid tags.

Archetypes / Species:
- Create custom archetypes.
- Create custom species.
- Create custom backgrounds.
- Give each definition its own inherited tags.
- Give each definition tier-specific XP costs.

Tags:
- Maintain a campaign tag registry.
- Tags can be created while entering content.

XP Settings:
- Define the starting XP budget for Tier 1-5.
- Enable/disable extra XP.
- Set the default extra XP amount.

CONTENT IMPORT / EXPORT
-----------------------

The Dashboard can export a content-only JSON file and import one again.
This is useful for preparing large datasets with a local coding model.

The full campaign Export/Import in the main navigation continues to include
characters, combat, encounters, settings, definitions and content.

TAG ELIGIBILITY
---------------

A character's effective tags come from:
- Custom character tags.
- Archetype tags.
- Species tags.
- Background tags.

For a content entry:
- requiredTags means ALL listed tags are required.
- anyRequiredTags means at least ONE listed tag is required.
- forbiddenTags blocks the entry when ANY listed tag is present.

If no eligibility tags are defined, the content is available to everyone.

XP MODEL
--------

Character XP budget:

    tier starting XP + character extra XP

XP spent includes the selected:
- archetype
- species
- background
- talents
- psychic abilities
- prayers
- wargear
- weapons

For each selected item, the application uses its XP value for the character's
current tier and then adds the item's optional extra XP modifier.

IMPORTANT
---------

The application architecture supports official Wrath & Glory data, but the
starter content database is intentionally empty. Populate copyrighted rules
content from your authorized rulebook/source rather than treating example
values as official rules.

DATA FILES / MODELING
---------------------

DATA_SCHEMA.txt explains the JSON structures intended for local coding models.

The application stores campaign data in browser LocalStorage. The current
architecture deliberately keeps rules/content separate from UI logic so that
large datasets can be added without rewriting the builder.

PROJECT STRUCTURE
-----------------

index.html
README.txt
DATA_SCHEMA.txt

css/
  variables.css
  main.css
  layout.css
  components/
  sections/

js/
  app.js
  state/
  models/
  combat/
  characters/
  builder/
  dashboard/
  data/
  ui/


MAP / VIRTUAL TABLETOP
- Open the Map tab to upload PNG/JPG battle maps.
- Maps are stored locally in browser storage. Keep images reasonably sized.
- Move tool drags tokens. Draw creates GM annotations. Hide paints fog; Show reveals it.
- Token Library stores reusable PC/NPC/Enemy/Ally/Object icons.
- Double-click a token on the map to remove it from that map.
- Player View is a local preview of the current map visibility. A future multiplayer layer can expose this view to connected players.

MAP UPLOAD FIX
- PNG/JPG/JPEG map uploads are validated before import.
- Large maps are resized to a maximum 4096px dimension and compressed for browser-local storage.
- The uploader now reports readable errors instead of silently failing.
- Recommended map size: under 10 MB source file, with the browser-stored version automatically optimized.


THEME (css/theme-40k.css)
-------------------------
- Palette lives in css/variables.css (iron, brass, dried blood, parchment).
- css/theme-40k.css is loaded last and holds all component styling, scrollbars
  and the map-window chrome.
- Icons are an inline SVG sprite at the top of index.html. In JS, use IC('name')
  (e.g. IC('sword')) to place one.
- Background art: assets/images/backgrounds/kousha-table-bg.jpg (pre-blurred).
  The unblurred original is kept beside it.
- Optional display font: drop Cinzel.woff2 into assets/fonts/ (or install Cinzel
  system-wide). Without it the theme falls back to Palatino / Georgia.

DEVELOPER CONTINUATION GUIDE
============================
This section is intentionally written for another coding model taking over the
project. Treat it as an implementation contract, not just a feature list.

PRODUCT GOAL
------------
Kousha's Table is a local-first Wrath & Glory GM application. It combines:
- character/template building
- campaign content management
- encounter/combat tracking
- a freeform virtual tabletop (VTT)
- reusable Token Library
- reusable Map Library
- a GM Map and a separate Player Map view

The project is intentionally plain HTML/CSS/JavaScript and must remain runnable
without a backend or internet connection.

NON-NEGOTIABLE DEVELOPMENT RULES
--------------------------------
1. ALWAYS use the newest ZIP/build supplied by the user as the source of truth.
2. Preserve existing working features when making a focused change.
3. Do not replace the app with a simplified rewrite.
4. Keep the application local-first and offline-capable.
5. Prefer small modular patches over duplicating systems.
6. Do not couple GM Map and Player Map zoom/pan state.
7. Do not make Token Library entries exclusive to one combatant. They are
   reusable templates and many combatants may use the same token.
8. A placed live map token should keep tokenLibraryId when it originates from
   the library. This is what allows library edits to propagate to placed copies.
9. Avoid full campaign re-renders during live token-template edits. Token edits
   previously froze the Combat Tracker because the full persistence/broadcast
   path was triggered while the editor was active. Token-template synchronization
   must stay narrow and must not recursively rebuild the tracker.
10. Test syntax and archive integrity before delivering a build. If browser
    automation is unavailable or hangs, say so instead of claiming a browser test.

CURRENT ARCHITECTURE
--------------------
index.html is the application shell. js/app.js contains the legacy/combined
application flow and, importantly, the floating Map-page Combat Tracker
extension used by the COMBAT_WINDOW query mode.

There is also a newer modular combat implementation:
- js/combat/combat.js       state/actions for combat
- js/combat/combat-ui.js    full Combat page renderer
- js/models/combatant.js    combatant model
- js/state/store.js         state defaults/normalization
- js/state/storage.js       persistence

IMPORTANT: the floating Combat Tracker Extension on the Map/VTT page is not
the same renderer as js/combat/combat-ui.js. Its renderer lives in js/app.js
and is activated through the combatView/COMBAT_WINDOW flow. When the user says
"Combat Tracker Extension", patch that surface specifically unless they ask for
the full Combat page too.

STATE / TOKEN MODEL
-------------------
Top-level state includes:
- characters[]
- encounters[]
- maps[]
- tokenLibrary[]
- combat { name, active, round, turn, combatants[] }

A Token Library item is a reusable template. Important fields include:
- id
- name
- image
- type
- size

A live map token may include:
- id
- tokenLibraryId
- name
- image
- x / y
- size
- type
- combatantId

combatantId binds a live map token to a current combatant.
tokenLibraryId identifies the reusable source template.

Do not confuse these two IDs:
- tokenLibraryId = reusable asset/template identity
- combatantId = current encounter/live combat identity

One library token may be assigned to many combatants. One combatant should have
at most one bound live token per map in the current design.

TOKEN EDIT SYNCHRONIZATION
--------------------------
Live token editing is now intentionally decoupled from full combat rendering.
When a library token changes:
1. Save the token template.
2. Propagate the token-template update to placed map copies using the same
   tokenLibraryId.
3. Refresh only the affected map/token UI and lightweight tracker data.
4. Do NOT call a broad render/persist/broadcast loop from inside the token editor
   if it can cause the Combat Tracker to rebuild recursively.

This separation was required because live token editing previously froze the
entire Combat Tracker.

COMBAT TRACKER EXTENSION
------------------------
The floating extension is designed as a compact control surface for the GM.
Each combatant card displays:
- bound token preview
- combatant name/type/faction
- initiative
- token assignment/change control
- wounds/shock/defense/resilience values
- wound/shock quick controls
- dead/remove controls

The extension's bound-token preview is deliberately fixed at 24x24 CSS pixels.
This is a UI invariant so card rows do not jump when the panel width changes or
when the app is viewed on a narrow screen. Do not reintroduce responsive sizes
for .tracker-token-mini unless the user explicitly asks for that.

COMBAT RULES ALREADY IMPLEMENTED
---------------------------------
- recurring combatants are allowed; do not add a uniqueness restriction
- Start Combat / End Battle behavior exists
- End/Clear combat removes live combatant tokens but preserves library templates
- previous/next turn and round tracking
- initiative sorting
- active combatant highlighting
- wounds and shock controls
- reusable token assignment
- token assignment can be changed independently for each combatant

VTT / WORKSPACE MODEL
---------------------
The Map page uses independent floating workspaces/windows for the VTT tools.
The important conceptual siblings are:
- Map Viewer
- Toolbar
- Combat Tracker Extension

They should remain independently movable/resizable and should not become nested
inside each other's layout rails during future refactors.

Workspace requirements already requested by the user:
- top drag bar
- eight-direction resize
- independent background/surface
- internal scrolling
- minimize collapses the complete workspace surface/background
- independent z-index / bring-to-front behavior
- windows may overlap

MAP SYSTEM
----------
The GM Map supports:
- PNG/JPG/JPEG upload
- grid
- zoom
- pan
- drawing
- erase
- fog/hide/show/dark visibility states
- token placement/movement
- Token Library
- Map Library
- live combatant token bindings

GM Map and Player Map MUST have independent:
- zoom
- panX
- panY

Wheel events must be scoped to the map under the pointer and must not leak to
the other map or browser/page. Do not introduce a global wheel handler that
mutates shared zoom state.

PLAYER MAP
----------
Player Map is a separate view/renderer and must not depend on DOM elements that
only exist in the GM document. This caused a historical bug where the dead skull
was visible on GM Map but missing on Player Map because the Player Map document
replacement removed the SVG symbol definitions.

The dead marker therefore uses a self-contained inline SVG skull rather than a
shared external SVG <use> definition.

Dead token presentation:
- red death layer
- separate skull layer
- skull approximately 75% of token dimensions on the map
- lower opacity than the token itself
- animated appearance

Do not replace the self-contained Player Map skull with a dependency on a symbol
in the original page unless the Player Map rendering architecture changes.

PAN TOOL
--------
Pan Map is a toggleable tool, not a permanent interaction mode.
Required behavior:
- pointer capture must be released after pan
- pointerup/pointercancel must restore normal interaction
- Escape exits pan mode
- switching to another tool exits pan mode
- user must never become permanently trapped in pan mode

TOKEN LIBRARY
-------------
Token Library is a persistent visual library of reusable tokens.
It supports:
- visual previews
- search/filtering
- reusable assignment
- editing
- deleting
- placing a token on the map
- PC/NPC/Enemy/Ally/Object style categories

Map tokens created from the library should retain tokenLibraryId.

MAP LIBRARY
-----------
Map Library is a persistent visual library of saved maps.
It supports:
- map thumbnails/previews
- search
- active-map indication
- opening/selecting a map
- rename
- delete
- upload

A map's own data should remain attached to that map, including its grid,
tokens, fog/drawing state and related map settings.

MAP SWITCHER
------------
The map switcher/control must occupy a stable layout slot. Changing to a map
with a long or short name must not move neighboring controls. Avoid auto-width
layout changes that cause controls to jump when the selected map changes.

DEATH / COMBATANT TOKEN RELATIONSHIP
------------------------------------
Combatant dead state and live map token dead presentation are related but not
identical UI layers. Changing a combatant to dead should update the live token's
presentation and Player Map publication without destroying its library binding.
Reviving should remove the dead presentation without replacing the token.

CODE COMMENTING EXPECTATIONS
----------------------------
When modifying complex logic, add a short comment explaining WHY the code is
structured that way, especially for:
- synchronization boundaries
- Player Map DOM replacement
- tokenLibraryId vs combatantId
- independent map zoom/pan
- workspace drag/resize behavior
- pan tool pointer capture

Avoid comments that merely restate obvious syntax. Comments should protect
future coding models from reintroducing already-fixed regressions.

KNOWN HISTORICAL REGRESSIONS TO AVOID
-------------------------------------
- Player Map dead red layer appeared but skull disappeared.
- GM and Player Map zoom affected each other.
- Pan Map became stuck and prevented all other interaction.
- Map selector controls moved when switching between maps.
- Editing a Token Library token froze the entire Combat Tracker.
- Token Library tokens were incorrectly treated as single-combatant assets.
- Combat extension UI changes were accidentally applied to the wrong Combat
  page instead of the floating Map-page extension.
- Workspace changes accidentally removed independent drag/resize behavior.
- Replacing the latest build with an older archive caused regressions.

SAFE CHANGE STRATEGY
--------------------
For a requested UI-only change:
1. Identify the exact renderer/surface first.
2. Prefer CSS for sizing/spacing/visual changes.
3. Do not touch persistence or synchronization code unless necessary.
4. Preserve existing IDs/classes used by event handlers.
5. Run a syntax check after JavaScript edits.
6. Verify ZIP/archive integrity.
7. If possible, run a browser smoke test for the affected interaction.
8. Never claim a browser interaction test passed if the browser runtime did not
   actually complete it.

USER PREFERENCE
---------------
The user prefers implementation over long explanations. When asked to make a
change, modify the actual latest build and provide the resulting ZIP. Preserve
working features and avoid unnecessary rewrites.


UI INVARIANT: COMBAT EXTENSION TOKEN PREVIEW
- The bound-token preview beside each combatant name is intentionally responsive but compact.
- Current Map-page Combat Tracker Extension CSS uses clamp(36px, 4.5vw, 48px), with a 38px minimum on narrow panels.
- The preview must remain supporting identity information, not the dominant element of the card.
- Preserve the existing tokenLibraryId resolution and live-edit synchronization when changing this UI.

COMBAT TRACKER EXTENSION
------------------------
The floating Combat Tracker Extension on the Map/VTT page is rendered by
renderInitiativePanel(map), not renderCombat(). Do not confuse it with the full
Combat page renderer.

Each extension card currently exposes:
- bound token preview beside the combatant name
- combatant name and live initiative value
- Defense, Resilience and current Shock
- current Wounds with +/- controls
- Edit, Dead/Revive and Remove controls

The Edit action uses editCombatantCard(id). That editor is shared with the full
Combat page, so it must detect whether #initiative-panel-list exists and refresh
the correct surface. Never blindly call renderCombat() from Map-page extension
code.

INITIATIVE SORTING
------------------
state.combat.sortInitiativeDirection stores 'desc' or 'asc'. The Map-page
extension displays a Sort button in its header and toggles the order without
changing the combatant objects. Initiative remains visible on every card and is
editable through the Edit dialog. Do not auto-sort while the user is typing or
editing a card because that causes the list to jump unexpectedly.

MAP PAN GESTURE
---------------
GM Map panning supports both a toolbar-selected Pan tool and a temporary Ctrl gesture.
- Select Pan Map in the toolbar for normal Pan-tool mode.
- Hold Ctrl and drag on the GM map for temporary pan without changing the selected tool.
- Releasing the pointer/ending the drag always releases the pan action naturally.
- The pan action must never leave a pointer capture or active drag state behind.
- Ctrl+drag on a token must pan the map instead of moving the token, so the token
  pointer handler intentionally lets Ctrl events bubble to the map stage.
- Drawing, fog, show, dark and erase remain ordinary mutually-exclusive tools.
- Ctrl+mouse-wheel remains scoped to the map viewport for zoom and must not alter
  the other map/player view.
- Player Map uses its own pan/zoom state and remains isolated from GM Map state.

INTERACTION COMPATIBILITY AUDIT
-------------------------------
When changing VTT interactions, check these boundaries together:
1. Map tool selection must not create a sticky pan state.
2. Token dragging must yield to Ctrl+drag map panning.
3. GM and Player Map wheel handlers must prevent propagation and use separate state.
4. Workspace drag/resize handlers must remain independent of map stage gestures.
5. Combat Tracker edits must not trigger full campaign re-render loops.
6. Token Library edits must update token templates and placed instances without
   rebuilding unrelated combat UI repeatedly.
7. Dead-token rendering must work in both GM and Player Map, including the
   self-contained Player Map skull layer.
8. Map switching must not change toolbar/control positions.

VTT INTERACTION RULES - LATEST
================================
PAN TOOL
--------
The GM Map supports BOTH pan entry methods:
1. Select "Pan Map" from the toolbar. The selected tool remains Pan until another
   map tool is selected, but the actual pointer-drag action ends on pointer-up or
   pointer-cancel.
2. Hold Ctrl and drag anywhere on the GM map. Ctrl-pan is temporary and does not
   change the selected map tool.

Ctrl has priority over token dragging. If Ctrl is held while pressing a token, the
map pans instead of moving the token. Never reintroduce a sticky pan action that
captures future clicks after the pointer is released.

DRAW COLOR
----------
The Draw tool exposes a color picker only while Draw is selected. The selected
color is stored as map.drawColor. New strokes store their own color on each draw
point so changing the picker does not recolor existing drawings. Eraser, Fog,
Show and Dark do not show the draw-color control.

WORKSPACE RESIZING
------------------
The Map-page Toolbar and Combat Tracker Extension are true floating workspaces.
Each has eight resize handles: N, S, E, W, NE, NW, SE, SW. Resize handles are
kept INSIDE the panel bounds because the panels use overflow:auto; handles placed
outside the bounds can be clipped and become unusable. Do not restore negative
outside offsets for these handles.

The resize handler updates both the workspace size and its stored position when
resizing from west/north edges. Preserve the existing pointer-capture lifecycle
and always release resize listeners on pointerup/pointercancel.

COMPATIBILITY RULE
------------------
Map tool selection, Ctrl-pan, token dragging, drawing, fog/visibility painting,
workspace dragging and workspace resizing must remain independent interaction
systems. Do not attach a global pointer handler that consumes events intended for
a workspace handle or toolbar button.

WORKSPACE RESIZE CONTRACT (IMPORTANT)
--------------------------------------
The VTT Toolbar, Combat Tracker, and Map Viewer are independent floating panels.
Each panel owns exactly eight resize hitboxes: W, E, N, S, NW, NE, SW, SE.
The hitboxes are children of the panel itself and are positioned against that panel's
own border box. Do NOT use a single generic .panel-resize-handle bottom/left/right
position rule, because it causes all eight handles to overlap and makes resizing appear
to work only from one side.

Resize implementation:
- CSS gives every edge/corner a distinct hit rectangle inside the panel boundary.
- Corner hitboxes are above edge hitboxes and use diagonal cursors.
- JavaScript setupResizablePanel() receives the direction from data-resize-dir.
- W/N resizing changes both size and saved position; E/S changes size only.
- Resize state is .is-resizing and is excluded from layout normalization while active.
- Do not attach resize listeners to the internal scrolling body. The panel border owns them.
- Do not move resize handles outside the panel with negative offsets.

When changing workspace CSS, preserve these invariants before making other layout changes.


RESIZE HITBOX VISIBILITY CONTRACT
---------------------------------
Resize hitboxes are fully invisible. They remain pointer-interactive and retain their
resize cursors, but they must never display a translucent strip on hover or while resizing.
The visible panel border is the only visual resize boundary. Do not restore hover opacity or
a background color to .panel-resize-handle.

PLAYER MAP REFRESH ANIMATION CONTRACT
-------------------------------------
Player Map refreshes now cross-fade map visibility changes using the previous fog
state, animate existing tokens from their previous coordinates to their new coordinates,
and animate newly visible/newly added tokens into view. When a combatant becomes dead,
the red dead layer and skull animate into place instead of appearing instantly.

Resize hitboxes remain functional but paint no visible bars. They are transparent pointer
hit areas with resize cursors only.

PLAYER MAP REFRESH ANIMATION CONTRACT
-------------------------------------
Player Map refreshes are staged instead of instantly replacing the scene.
The Player window first receives the complete map/combat snapshot, displays a short
"RECEIVING MAP CHANGES" phase, then renders the new state underneath animation layers.

Animation behavior:
- Revealed/hidden fog transitions use the previous fog canvas as a fading overlay.
- Draw changes use the previous drawing as a fading overlay.
- Moved tokens transition from their previous coordinates to their new coordinates.
- Newly visible/new tokens fade and scale into view.
- Tokens that disappear from the snapshot fade out instead of vanishing instantly.
- A newly dead combatant receives the red death wash and skull through a slower entrance.
- Refresh animation duration is intentionally measured in seconds, not milliseconds,
  so the GM can visibly follow what changed.
- Refreshes arriving during the receive window are coalesced to the newest complete snapshot.
- The GM Refresh Player Map action suppresses its automatic duplicate publish, preventing
  two consecutive snapshots from collapsing the animation into an instant final state.

Do not bypass acceptPlayerRefresh() for Player Map updates. It is the receive/diff/animation
boundary and must remain the single entry point for player refresh messages.

PLAYER MAP ARCHITECTURE (REWRITTEN)
-----------------------------------
The Player Map no longer rebuilds its DOM for every refresh. It is owned by
js/map-player-controller.js, a self-contained state reconciler.

Refresh pipeline:
1. GM sends one immutable player snapshot.
2. Player window shows RECEIVING MAP CHANGES and holds the current scene.
3. The new snapshot is staged under the current visual scene.
4. Fog/drawing use old/new canvas layers and crossfade slowly.
5. Tokens reconcile by stable token id and animate only the changed properties.
6. Death/revive uses one composite overlay containing BOTH the red layer and skull.
7. Hidden -> shown tokens wait for the fog transition to finish, then wait 2 more
   seconds before materialising.
8. Canceled animations are safely swallowed so rapid refreshes cannot create
   unhandled promise rejections or freeze the map.

GM visibility tools:
- Fog / Show / Dark are transient one-shot tools.
- They are never persisted as the selected tool.
- While active, token hit-testing is disabled so a token under the brush cannot
  steal the pointer event from the rectangle tool.
- Pointer cleanup is performed in finally blocks and visibility commits clear the
  temporary tool BEFORE persistence.

Animation timing is centralized in WGPlayerMapTiming rather than scattered through
CSS selectors. This is deliberate: future timing changes should be made in one place.

COMBAT CONDITION CONTRACT
-------------------------
Dead and Shocked are mutually exclusive combatant conditions.
- Setting Dead true always clears Shocked.
- Setting Shocked true always clears Dead.
- Player Map defensively normalizes incoming snapshots so legacy data cannot display both.
- GM Map renders both conditions directly on the token; conditions never control token existence.

PLAYER MAP MULTI-TOKEN PERFORMANCE NOTES
----------------------------------------
- Player Map token movement animations use compositor-friendly transform/opacity instead of animating left/top and blur on every frame. This is important when several token images move simultaneously.
- Normal visible token movement uses a shorter 2.2 second transform transition so several tokens can move concurrently without creating a large layout/paint workload.
- Fog-to-token reveal begins exactly 1 second after the fog transition starts. The reveal timer is the single one-second beat; the token reveal code does not add another delay.
- Player snapshots are still coalesced by the receive staging layer. Rapid successive map changes should settle to the latest complete snapshot rather than stacking a full animation pipeline for every intermediate state.
- Do not reintroduce per-frame left/top movement or blur filters for Player Map tokens. Those properties are substantially more expensive when many image-backed tokens animate together.
