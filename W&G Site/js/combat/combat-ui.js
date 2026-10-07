import { state } from "../state/store.js";
import { saveState } from "../state/storage.js";
import {
  removeCombatant, updateCombatant, updateWounds, updateShock,
  nextTurn, previousTurn, startCombat, clearCombat,
  saveEncounter, sortCombatants
} from "./combat.js";

export function renderCombat(actions) {
  const container = document.getElementById("combat-section");

  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="eyebrow">Encounter</div>
        <h1>${esc(state.combat.name)}</h1>
        <div class="combat-status">
          <span class="badge accent">Round ${state.combat.round}</span>
          <span class="badge">${state.combat.combatants.length} Combatants</span>
          ${state.combat.active ? '<span class="badge">Active</span>' : '<span class="badge">Not Started</span>'}
        </div>
      </div>
      <div class="combat-toolbar">
        <button id="rename-combat">Rename</button>
        <button id="add-combatant" class="button-primary">+ Add Character</button>
        <button id="start-combat" class="${state.combat.active ? "button-danger" : ""}">${state.combat.active ? "End Battle" : "Start Combat"}</button>
        <button id="save-encounter">Save Encounter</button>
        <button id="encounters">Encounters</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="combat-toolbar">
        <button id="prev-turn">← Previous</button>
        <button id="next-turn" class="button-primary">Next Turn →</button>
        <button id="sort-initiative">Sort Initiative</button>
        <button id="clear-combat" class="button-danger">Clear</button>
      </div>
    </div>

    <div class="combat-list" id="combat-list"></div>
  `;

  document.getElementById("add-combatant").onclick = actions.openCharacterPicker;
  document.getElementById("rename-combat").onclick = () => actions.renameCombat();
  document.getElementById("start-combat").onclick = () => {
    if (state.combat.active) {
      state.combat.active = false;
      state.combat.combatants.forEach(c => c.active = false);
      saveState();
    } else {
      startCombat();
    }
    renderCombat(actions);
  };
  document.getElementById("next-turn").onclick = () => {
    nextTurn();
    renderCombat(actions);
  };
  document.getElementById("prev-turn").onclick = () => {
    previousTurn();
    renderCombat(actions);
  };
  document.getElementById("sort-initiative").onclick = () => {
    sortCombatants();
    renderCombat(actions);
  };
  document.getElementById("clear-combat").onclick = () => {
    if (confirm("Clear all combatants from the current encounter?")) {
      clearCombat();
      renderCombat(actions);
    }
  };
  document.getElementById("save-encounter").onclick = () => {
    saveEncounter();
    actions.toast("Encounter saved.");
  };
  document.getElementById("encounters").onclick = actions.openEncounterPicker;

  const list = document.getElementById("combat-list");

  if (!state.combat.combatants.length) {
    list.innerHTML = `
      <div class="card combat-empty">
        <div style="text-align:center">
          <h2>No combatants</h2>
          <p class="muted">Add a saved character template to begin.</p>
          <button class="button-primary" id="empty-add">+ Add Character</button>
        </div>
      </div>`;
    document.getElementById("empty-add").onclick = actions.openCharacterPicker;
    return;
  }

  state.combat.combatants.forEach(c => list.appendChild(createCombatantCard(c, actions)));
}

function createCombatantCard(c, actions) {
  const card = document.createElement("article");
  card.className = `card combatant-card ${c.active ? "active" : ""}`;

  const woundPct = c.wounds.max ? Math.max(0, Math.min(100, c.wounds.current / c.wounds.max * 100)) : 0;
  const shockPct = c.shock.max ? Math.max(0, Math.min(100, c.shock.current / c.shock.max * 100)) : 0;

  card.innerHTML = `
    <div class="combatant-header">
      <div class="combatant-title">
        <div>
          <div class="eyebrow">${esc(c.type)}</div>
          <h2>${esc(c.name)}</h2>
          <div class="muted small">${esc(c.faction || "No faction")}</div>
        </div>
      </div>
      <div class="toolbar">
        ${c.active ? '<span class="badge accent">CURRENT TURN</span>' : ""}
        <button class="button-danger remove">Remove</button>
      </div>
    </div>

    <div class="stat-row" style="margin-top:15px">
      <div class="stat">
        <label>Wounds</label>
        <input data-field="wounds" type="number" min="0" max="${c.wounds.max}" value="${c.wounds.current}">
        <div class="health-bar"><div style="width:${woundPct}%"></div></div>
        <div class="small muted">${c.wounds.current} / ${c.wounds.max}</div>
      </div>
      <div class="stat">
        <label>Shock</label>
        <input data-field="shock" type="number" min="0" max="${c.shock.max}" value="${c.shock.current}">
        <div class="health-bar shock"><div style="width:${shockPct}%"></div></div>
        <div class="small muted">${c.shock.current} / ${c.shock.max}</div>
      </div>
      <div class="stat">
        <label>Defense</label>
        <input data-field="defense" type="number" min="0" value="${c.defense}">
      </div>
      <div class="stat">
        <label>Resilience</label>
        <input data-field="resilience" type="number" min="0" value="${c.resilience}">
      </div>
    </div>

    <div class="toolbar" style="margin-top:12px">
      <div class="initiative">
        <label>Initiative</label>
        <input data-field="initiative" type="number" value="${c.initiative}">
      </div>
      <div class="quick-buttons" style="align-self:end">
        <button data-action="wound-minus">− Wound</button>
        <button data-action="wound-plus">+ Wound</button>
        <button data-action="shock-minus">− Shock</button>
        <button data-action="shock-plus">+ Shock</button>
      </div>
    </div>
  `;

  card.querySelector(".remove").onclick = () => {
    removeCombatant(c.id);
    renderCombat(actions);
  };

  card.querySelectorAll("[data-field]").forEach(input => {
    input.onchange = () => {
      const field = input.dataset.field;
      const value = Number(input.value);

      if (field === "wounds")
        updateCombatant(c.id, { wounds: {...c.wounds, current: value} });
      else if (field === "shock")
        updateCombatant(c.id, { shock: {...c.shock, current: value} });
      else
        updateCombatant(c.id, {[field]: value});
    };
  });

  card.querySelectorAll("[data-action]").forEach(button => {
    button.onclick = () => {
      const action = button.dataset.action;
      if (action === "wound-minus") updateWounds(c.id, -1);
      if (action === "wound-plus") updateWounds(c.id, 1);
      if (action === "shock-minus") updateShock(c.id, -1);
      if (action === "shock-plus") updateShock(c.id, 1);
      renderCombat(actions);
    };
  });

  return card;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
