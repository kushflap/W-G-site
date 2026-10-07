import { state } from "../state/store.js";
import { saveState } from "../state/storage.js";
import { Character } from "../models/character.js";

export function createCharacter(data = {}) {
  const character = new Character(data);
  state.characters.push(character);
  saveState();
  return character;
}

export function getCharacter(id) {
  return state.characters.find(c => c.id === id);
}

export function updateCharacter(id, changes) {
  const character = getCharacter(id);
  if (!character) return;
  Object.assign(character, changes);
  saveState();
  return character;
}

export function deleteCharacter(id) {
  state.characters = state.characters.filter(c => c.id !== id);
  saveState();
}

export function duplicateCharacter(id) {
  const source = getCharacter(id);
  if (!source) return null;

  const copy = new Character({
    ...structuredClone(source),
    id: crypto.randomUUID(),
    name: `${source.name} Copy`
  });

  state.characters.push(copy);
  saveState();
  return copy;
}
