# Kousha's Table / RPG Companion

## Player Map Stability & Synchronization Documentation

### Stable baseline: v4

**Status:** Stable. The user has confirmed that the current system works
after the Fog/Show stress test.

## 1. Core architecture

The application has two cooperating views:

-   **GM Map:** authoritative editing and campaign-control surface.
-   **Player Map:** lightweight visual projection for players.

The GM state is authoritative. The Player Map is never an independent
campaign database.

``` text
                    CAMPAIGN STATE
                    authoritative
                          |
             +------------+------------+
             |                         |
             v                         v
       Persistence                  GM Map
       deferred                    editor
                                         |
                                         | lightweight projection
                                         v
                                  +-------------+
                                  | Player Map  |
                                  |   renderer  |
                                  +-------------+
```

## 2. Bugs found and final fixes

### A. Token visibility crossing fog boundaries

**Problem:** If part of a token overlapped fog while another part was
visible, visibility handling could become unstable.

**Final rule:** Every token has an invisible 1x1 center reference point.
Only that point decides the entire token's visibility.

``` text
        TOKEN
   +-------------+
   |             |
   |      *      |  <- invisible 1x1 reference point
   |             |
   +-------------+

   * in shown area -> entire token shown
   * in fog        -> entire token hidden
```

The artwork itself is not used as a visibility authority.

### B. Player Map snapshot backlog

**Problem:** The Player Map could accumulate complete historical
snapshots while long cinematic transitions were still running.

**Final rule:** Pending Player Map updates are coalesced. The newest
state wins. Intermediate states do not need to be replayed.

``` text
old: A -> B -> C -> D -> E
new: current visual + newest pending E
```

This prevents a queue from growing merely because the GM performed
several actions quickly.

### C. Map image change could lock a transition

**Problem:** Loading a replacement background image could leave a
transition open and prevent later updates.

**Final behavior:** Image replacement is a first-class update. The image
loads, visual layers rebuild, the transition is released, and the newest
pending state is processed. Image-load failure must also release the
lock.

### D. Both windows froze after several Fog/Show operations

**Problem:** The browser's normal cache was not the primary issue. Heavy
synchronous work was blocking the JavaScript main thread.

The expensive path included:

-   complete campaign serialization
-   synchronous `localStorage` writes
-   `structuredClone()` of image-heavy objects
-   complete Player Map snapshots
-   unnecessary full-state synchronization

Because the GM and Player Map run in the same browser environment,
blocking the main thread could freeze both views.

**Final fix:** Campaign persistence is deferred/debounced. Map actions
update in-memory state immediately and send lightweight visual updates.
The expensive campaign save happens later and is consolidated.

## 3. Data boundaries

### Persistent campaign state

Contains the complete data required to restore the campaign. It may
include campaign metadata, map data, tokens, fog, drawings, combat
state, configuration, image data/references, and undo/history.

### GM map state

Authoritative map editing state: token positions and states, fog,
drawings, map image, map tools, and combat-related map changes.

### Player Map visual state

Only rendering data should cross this boundary, such as:

-   current map image/reference
-   fog rectangles
-   drawings
-   token visual state and positions
-   relevant combat/visual status

The Player Map should not receive undo history or unrelated campaign
machinery.

## 4. Performance rules

### Never synchronously save the entire campaign after every click

`localStorage` is synchronous and can block the main thread. Persistence
must remain deferred/debounced.

### Avoid unnecessary deep cloning

Do not clone the entire campaign or map for a lightweight Player Map
update. Large embedded images make deep cloning especially expensive.

### Do not stringify huge structures for routine comparison

Avoid patterns such as:

``` js
JSON.stringify(previousMap) === JSON.stringify(nextMap)
```

Use targeted comparisons for image, fog, drawings, tokens, and other
relevant fields.

### Rendering must not persist

`renderMap()` should render only. It must not silently trigger
persistence or create a render -\> save -\> broadcast -\> render loop.

### Do not resend unchanged large images

The Player Map should reuse an already-loaded image when possible and
receive an image payload only when the actual image changes.

## 5. Token lifecycle

Token position, alive/dead state, and visibility are separate
properties.

A valid lifecycle is:

``` text
alive -> dead -> moved -> revived -> moved again
```

A movement must never permanently latch the dead state. A revive must
always be able to restore the live state.

## 6. Map image lifecycle

Expected flow:

``` text
GM changes image
    -> detect image change
    -> load new image
    -> rebuild visual layers
    -> reapply current fog/drawings/tokens
    -> release transition
    -> process newest pending state
```

Changing the background image must not erase or invalidate token, fog,
drawing, or combat state.

## 7. Synchronization rules for future features

1.  GM state is authoritative.
2.  Player Map is a projection.
3.  Latest state wins when updates arrive faster than animation.
4.  Intermediate visual states may be skipped.
5.  A failed asset load must never permanently lock synchronization.
6.  Large payloads must not be copied unless required.
7.  Rendering and persistence remain separate.
8.  New features should use small state mutations and lightweight
    projections.

## 8. Regression checklist

Before and after major changes, test:

### Fog/Show stress

Perform 10-20 alternating Fog and Show actions, including rapid
repetitions.

Expected: both views remain responsive and the final fog state is
correct.

### Mixed actions

Fog -\> move -\> Show -\> move -\> kill -\> Fog -\> revive -\> Show -\>
move.

Expected: no freeze; latest state is correct; dead/revive remains
reversible.

### Image change

Change image -\> Refresh Player Map -\> Fog -\> move -\> Show.

Expected: new image appears and all other map state survives.

### Rapid movement

Move the same token repeatedly before Player Map animation finishes.

Expected: intermediate positions may be skipped; final position is
correct; no backlog or freeze.

### Long session

Perform dozens of mixed actions.

Expected: no progressively increasing delay, no unbounded pending
snapshot queue, and no synchronization feedback loop.

## 9. Stable milestone

The stable build is:

`koushas-table-player-map-clean-stability-v4.zip`

The user has confirmed that the system now works. Treat v4 as the
baseline for the next expansion.

Do not reintroduce full-state Player Map synchronization, synchronous
per-action persistence, whole-map JSON comparisons, or unnecessary deep
cloning.

## 10. Next expansion principle

Build the next feature on top of the stable architecture rather than
modifying the synchronization machinery unless a concrete regression
requires it.

Preferred feature flow:

``` text
new GM action
    -> small authoritative state mutation
    -> lightweight Player Map projection
    -> render
    -> deferred persistence
```

This preserves the stability gained during the v1-v4 debugging cycle.

## 11. Sounds expansion

The Sounds chapter is built on top of the stable v4 map architecture.

### Libraries

Three campaign audio libraries are available from the Home/Sounds chapter:

- Background Music & Sounds
- Sound Effects
- Pre-made Speeches

Audio file metadata is stored with campaign state. The actual audio blobs are stored in browser IndexedDB so large audio files do not repeatedly inflate synchronous `localStorage` campaign saves.

### Map Sound Mixer

Each map can contain an ordered `soundLayers` collection. Every layer is independent and can:

- load one file from any sound library
- play/pause
- control volume
- enable automatic looping
- move up/down in the layer stack
- be removed

Multiple layers can play simultaneously, allowing background music, ambience, effects and speeches to overlap.

The Player Map synchronization channel does not receive audio binaries or the audio library itself. Audio is a GM-side workspace feature unless a future explicit player-audio synchronization feature is added.

### Performance rule

Audio files must not be embedded into routine Player Map snapshots or campaign BroadcastChannel messages. Only small layer metadata is persisted with the campaign. Audio binary storage remains outside the hot synchronization path.

### Regression checklist for Sounds

1. Upload several files into each of the three libraries.
2. Refresh the page and verify the libraries remain populated.
3. Create three mixer layers and load a different library file into each.
4. Start multiple layers simultaneously.
5. Adjust each volume independently.
6. Enable loop on one layer and leave another as one-shot.
7. Reorder layers while audio is playing.
8. Remove a layer while another continues playing.
9. Change maps and verify the previous map's mixer audio does not leak into the new map.
10. Perform normal Fog/Show and token movement stress tests while audio is playing. The map synchronization path must remain responsive.

## 11. Kousha's Table Top / Sounds and Game Room Expansion

The next stable expansion separates reusable assets from the Game Room workspace:

- **Game Room** is the renamed virtual tabletop chapter. It is a workspace host rather than a map-only page.
- **Map Library** is a dedicated chapter for saved battlefield assets and visual previews.
- **Token Library** is a dedicated chapter for reusable token templates and previews.
- **Sounds** contains three audio libraries and the mirrored live mixer.
- **Edit Game Room** controls which Game Room workspaces are enabled for the current room.

### Game Room workspaces

The Game Room may contain independent movable/resizable workspaces for:

- Tools
- Map Viewer
- Combat Tracker
- Sound Mixer

Workspace visibility and geometry are stored per map. Workspace rendering must not become part of Player Map synchronization.

### Sound Mixer geometry contract

The Sound Mixer is a true sibling workspace of the other Game Room panels. It must use the same drag and resize lifecycle as the other panels:

```text
render workspace
    -> restore size
    -> restore position
    -> bind drag
    -> bind resize handles
    -> bind controls
```

Re-rendering the mixer after minimize, restore, layer changes, or visibility changes must rebind its geometry controls. Minimized state collapses the complete workspace to its header rather than merely hiding the body.

The Sounds chapter contains a mirror of the same mixer state. The mirror is a control surface, not a second audio scene.

### Naming / navigation

The application name is **Kousha's Table Top**. The centered navigation title uses an Aquila mark beneath it. The former Map chapter is presented to users as **Game Room**.
