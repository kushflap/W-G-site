import { state } from "../state/store.js";
import { Combatant } from "../models/combatant.js";
import { saveState } from "../state/storage.js";

export function addCharacterToCombat(character) {
  const combatant = new Combatant(character);
  state.combat.combatants.push(combatant);
  state.combat.active = true;
  sortCombatants();
  saveState();
  return combatant;
}

export function addCombatantFromData(data) {
  state.combat.combatants.push(data);
  state.combat.active = true;
  saveState();
}

export function removeCombatant(id) {
  state.combat.combatants = state.combat.combatants.filter(c => c.id !== id);
  (state.maps || []).forEach(m => { if (Array.isArray(m.tokens)) m.tokens = m.tokens.filter(t => t.combatantId !== id); });
  if (state.combat.turn >= state.combat.combatants.length) state.combat.turn = 0;
  if (!state.combat.combatants.length) state.combat.active = false;
  saveState();
}

export function updateCombatant(id, changes) {
  const combatant = state.combat.combatants.find(c => c.id === id);
  if (!combatant) return;
  Object.assign(combatant, changes);
  saveState();
}

export function updateWounds(id, delta) {
  const c = state.combat.combatants.find(x => x.id === id);
  if (!c) return;
  c.wounds.current = clamp(c.wounds.current + delta, 0, c.wounds.max);
  saveState();
}

export function updateShock(id, delta) {
  const c = state.combat.combatants.find(x => x.id === id);
  if (!c) return;
  c.shock.current = clamp(c.shock.current + delta, 0, c.shock.max);
  saveState();
}

export function sortCombatants() {
  state.combat.combatants.sort((a, b) => Number(b.initiative) - Number(a.initiative));
  state.combat.turn = Math.min(state.combat.turn, Math.max(0, state.combat.combatants.length - 1));
}

export function nextTurn() {
  const list = state.combat.combatants;
  if (!list.length) return;

  state.combat.turn += 1;

  if (state.combat.turn >= list.length) {
    state.combat.turn = 0;
    state.combat.round += 1;
  }

  list.forEach((c, i) => c.active = i === state.combat.turn);
  saveState();
}

export function previousTurn() {
  const list = state.combat.combatants;
  if (!list.length) return;

  state.combat.turn -= 1;

  if (state.combat.turn < 0) {
    state.combat.turn = list.length - 1;
    state.combat.round = Math.max(1, state.combat.round - 1);
  }

  list.forEach((c, i) => c.active = i === state.combat.turn);
  saveState();
}

export function startCombat() {
  state.combat.active = true;
  state.combat.round = 1;
  state.combat.turn = 0;
  state.combat.combatants.forEach((c, i) => c.active = i === 0);
  saveState();
}

export function clearCombat() {
  const ids = new Set((state.combat.combatants || []).map(c => c.id));
  state.combat.active = false;
  state.combat.round = 1;
  state.combat.turn = 0;
  state.combat.combatants = [];
  (state.maps || []).forEach(m => { if (Array.isArray(m.tokens)) m.tokens = m.tokens.filter(t => !ids.has(t.combatantId)); });
  saveState();
}

export function setCombatName(name) {
  state.combat.name = name || "Current Encounter";
  saveState();
}

export function saveEncounter() {
  const encounter = {
    id: crypto.randomUUID(),
    name: state.combat.name || `Encounter ${state.encounters.length + 1}`,
    savedAt: new Date().toISOString(),
    round: state.combat.round,
    combatants: structuredClone(state.combat.combatants)
  };

  state.encounters.unshift(encounter);
  saveState();
  return encounter;
}

export function loadEncounter(id) {
  const encounter = state.encounters.find(e => e.id === id);
  if (!encounter) return;

  state.combat.name = encounter.name;
  state.combat.round = encounter.round || 1;
  state.combat.turn = 0;
  state.combat.active = encounter.combatants.length > 0;
  state.combat.combatants = structuredClone(encounter.combatants);
  state.combat.combatants.forEach((c, i) => c.active = i === 0);
  saveState();
}

export function deleteEncounter(id) {
  state.encounters = state.encounters.filter(e => e.id !== id);
  saveState();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}
