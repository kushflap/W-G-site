import { state } from "../state/store.js";

export const CONTENT_TYPES = [
  { key: "talents", label: "Talents" },
  { key: "psychicAbilities", label: "Psychic Abilities" },
  { key: "prayers", label: "Prayers" },
  { key: "wargear", label: "Wargear" },
  { key: "weapons", label: "Weapons" }
];

export function getContent(type) {
  state.content ??= {};
  state.content[type] ??= [];
  return state.content[type];
}

export function getContentItem(type, id) {
  return getContent(type).find(item => item.id === id) || null;
}

export function allContent() {
  return CONTENT_TYPES.flatMap(type => getContent(type.key).map(item => ({ ...item, contentType: type.key, contentTypeLabel: type.label })));
}

export function allTags() {
  const tags = new Set(state.contentTags || []);
  CONTENT_TYPES.forEach(type => getContent(type.key).forEach(item => {
    (item.keywords || []).forEach(tag => tags.add(tag));
    (item.requiredTags || []).forEach(tag => tags.add(tag));
    (item.forbiddenTags || []).forEach(tag => tags.add(tag));
  }));
  (state.definitions?.archetypes || []).forEach(x => (x.tags || []).forEach(t => tags.add(t)));
  (state.definitions?.species || []).forEach(x => (x.tags || []).forEach(t => tags.add(t)));
  (state.definitions?.backgrounds || []).forEach(x => (x.tags || []).forEach(t => tags.add(t)));
  return [...tags].filter(Boolean).sort((a,b) => a.localeCompare(b));
}

export function xpCost(item, tier = 1) {
  const costs = item?.xpCostByTier || {};
  const direct = Number(costs[String(tier)] ?? costs[tier]);
  if (Number.isFinite(direct)) return direct;
  const fallback = Number(item?.xpCost ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
}

export function characterTags(character) {
  const tags = new Set(character?.tags || []);
  const defs = state.definitions || {};
  ["archetypes", "species", "backgrounds"].forEach(group => {
    const characterKey = group === "species" ? "species" : group.slice(0, -1);
    const id = character?.[characterKey];
    const found = (defs[group] || []).find(x => x.id === id);
    (found?.tags || []).forEach(tag => tags.add(tag));
  });
  return [...tags];
}

export function isEligible(item, character) {
  if (!character) return true;
  const tags = new Set(characterTags(character));
  const required = item.requiredTags || [];
  const any = item.anyRequiredTags || [];
  const forbidden = item.forbiddenTags || [];
  const allRequired = required.every(tag => tags.has(tag));
  const anyRequired = !any.length || any.some(tag => tags.has(tag));
  const blocked = forbidden.some(tag => tags.has(tag));
  return allRequired && anyRequired && !blocked;
}

export function createContentId(type) {
  return `${type.slice(0, 3)}-${crypto.randomUUID().slice(0, 8)}`;
}

export function definitionCost(definition, tier = 1) {
  if (!definition) return 0;
  const direct = Number(definition.xpCostByTier?.[String(tier)] ?? definition.xpCostByTier?.[tier]);
  return Number.isFinite(direct) ? direct + Number(definition.extraXp || 0) : Number(definition.xpCost || 0) + Number(definition.extraXp || 0);
}
