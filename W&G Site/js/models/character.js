export class Character {
  constructor({
    id = crypto.randomUUID(),
    name = "Unnamed Character",
    type = "NPC",
    portrait = "",
    faction = "",
    role = "",
    tier = 1,
    extraXp = 0,
    species = "",
    archetype = "",
    background = "",
    tags = [],
    xpSpent = 0,
    wounds = { current: 0, max: 10 },
    shock = { current: 0, max: 10 },
    defense = 3,
    resilience = 3,
    initiative = 0,
    attributes = {},
    skills = {},
    talents = [],
    psychicAbilities = [],
    prayers = [],
    wargear = [],
    weapons = [],
    notes = ""
  } = {}) {
    Object.assign(this, { id, name, type, portrait, faction, role, tier, extraXp, species, archetype, background, tags, xpSpent, wounds, shock, defense, resilience, initiative, attributes, skills, talents, psychicAbilities, prayers, wargear, weapons, notes });
  }
}
