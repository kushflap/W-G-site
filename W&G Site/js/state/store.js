export const state = {
  currentPage: "combat",

  campaign: {
    name: "Untitled Campaign",
    notes: ""
  },

  settings: {
    xpBudgetsByTier: { 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
    allowExtraXp: true,
    extraXpDefault: 0
  },

  contentTags: [],
  exampleDataVersion: 0,

  definitions: {
    archetypes: [],
    species: [],
    backgrounds: []
  },

  content: {
    talents: [],
    psychicAbilities: [],
    prayers: [],
    wargear: [],
    weapons: []
  },

  characters: [],

  combat: {
    active: false,
    name: "Current Encounter",
    round: 1,
    turn: 0,
    combatants: []
  },

  encounters: [],

  builder: {
    selectedCharacterId: null,
    selections: {
      talents: [],
      psychicAbilities: [],
      prayers: [],
      wargear: [],
      weapons: []
    }
  }
};

export function normalizeState() {
  state.characters ??= [];
  state.encounters ??= [];
  state.campaign ??= { name: "Untitled Campaign", notes: "" };
  state.settings ??= { xpBudgetsByTier: {1:100,2:200,3:300,4:400,5:500}, allowExtraXp: true, extraXpDefault: 0 };
  state.settings.xpBudgetsByTier ??= {1:100,2:200,3:300,4:400,5:500};
  state.contentTags ??= [];
  state.exampleDataVersion ??= 0;
  state.definitions ??= { archetypes: [], species: [], backgrounds: [] };
  state.definitions.archetypes ??= [];
  state.definitions.species ??= [];
  state.definitions.backgrounds ??= [];
  state.content ??= {};
  ["talents","psychicAbilities","prayers","wargear","weapons"].forEach(k => state.content[k] ??= []);
  state.combat ??= { active: false, name: "Current Encounter", round: 1, turn: 0, combatants: [] };
  state.combat.combatants ??= [];
  state.builder ??= { selectedCharacterId: null, selections: {} };
  state.builder.selections ??= {};
  ["talents","psychicAbilities","prayers","wargear","weapons"].forEach(k => state.builder.selections[k] ??= []);
}
