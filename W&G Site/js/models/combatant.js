export class Combatant {
  constructor(character) {
    this.id = crypto.randomUUID();
    this.characterId = character.id;
    this.name = character.name;
    this.type = character.type;
    this.portrait = character.portrait;
    this.faction = character.faction;
    this.wounds = {
      current: character.wounds.max,
      max: character.wounds.max
    };
    this.shock = {
      current: 0,
      max: character.shock.max
    };
    this.defense = character.defense;
    this.resilience = character.resilience;
    this.initiative = character.initiative || 0;
    this.active = false;
  }
}
