// Clearly labeled demonstration data. These are placeholders for testing the builder/dashboard,
// not a transcription of Wrath & Glory rulebook content.
export const EXAMPLE_DATA = {
  content: {
    talents: [
      { id:"example-talent-veterans-eye", name:"Example: Veteran's Eye", tier:1, description:"Demo talent showing how a general combat option can be tagged and priced.", keywords:["Combat","Veteran"], requiredTags:["Human"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:5,2:5,3:5,4:5,5:5}, extraXp:0, example:true },
      { id:"example-talent-iron-discipline", name:"Example: Iron Discipline", tier:2, description:"Demo talent restricted to disciplined or military characters.", keywords:["Leadership","Military"], requiredTags:["Military"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:0,2:10,3:10,4:10,5:10}, extraXp:0, example:true }
    ],
    psychicAbilities: [
      { id:"example-psychic-veil", name:"Example: Veil of Thought", tier:1, description:"Demo psychic ability for testing Psyker filtering.", keywords:["Psychic","Warp"], requiredTags:["Psyker"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:10,2:10,3:10,4:10,5:10}, extraXp:0, example:true },
      { id:"example-psychic-astral-sight", name:"Example: Astral Sight", tier:2, description:"Demo advanced psychic option requiring both Psyker and sanctioned training.", keywords:["Psychic","Sanctioned"], requiredTags:["Psyker","SanctionedPsyker"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:0,2:15,3:15,4:15,5:15}, extraXp:0, example:true }
    ],
    prayers: [
      { id:"example-prayer-litanies", name:"Example: Litany of Resolve", tier:1, description:"Demo prayer restricted to characters carrying the Ministorum keyword.", keywords:["Prayer","Ecclesiarchy"], requiredTags:["Ministorum"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:5,2:5,3:5,4:5,5:5}, extraXp:0, example:true },
      { id:"example-prayer-martyrs", name:"Example: Litany of the Martyrs", tier:2, description:"Demo prayer showing a two-tag prerequisite.", keywords:["Prayer","Ecclesiarchy","Faith"], requiredTags:["Ministorum","Faithful"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:0,2:10,3:10,4:10,5:10}, extraXp:0, example:true }
    ],
    wargear: [
      { id:"example-wargear-field-kit", name:"Example: Field Utility Kit", tier:1, description:"Demo equipment entry for testing generic wargear.", keywords:["Gear","Utility"], requiredTags:[], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:3,2:3,3:3,4:3,5:3}, extraXp:0, example:true },
      { id:"example-wargear-sanctioned-focus", name:"Example: Sanctioned Focus", tier:2, description:"Demo wargear restricted to sanctioned psykers.", keywords:["Gear","Psychic"], requiredTags:["Psyker","SanctionedPsyker"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:0,2:12,3:12,4:12,5:12}, extraXp:0, example:true }
    ],
    weapons: [
      { id:"example-weapon-service-carbine", name:"Example: Service Carbine", tier:1, description:"Demo weapon for testing equipment selection and XP accounting.", keywords:["Weapon","Ranged","Military"], requiredTags:["Military"], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:4,2:4,3:4,4:4,5:4}, extraXp:0, example:true },
      { id:"example-weapon-xenos-blade", name:"Example: Xenos Blade", tier:2, description:"Demo weapon demonstrating a species/faction restriction.", keywords:["Weapon","Melee","Xenos"], requiredTags:["Xenos"], anyRequiredTags:[], forbiddenTags:["Ministorum"], xpCostByTier:{1:0,2:8,3:8,4:8,5:8}, extraXp:0, example:true }
    ]
  },
  definitions: {
    archetypes: [
      { id:"example-archetype-soldier", name:"Example: Soldier", description:"Demo archetype used to demonstrate Military tagging.", tags:["Military","Human"], xpCostByTier:{1:0,2:20,3:20,4:20,5:20}, extraXp:0, example:true },
      { id:"example-archetype-psyker", name:"Example: Psyker", description:"Demo archetype used to demonstrate psychic eligibility.", tags:["Psyker","SanctionedPsyker","Human"], xpCostByTier:{1:0,2:25,3:25,4:25,5:25}, extraXp:0, example:true },
      { id:"example-archetype-ministorum", name:"Example: Ministorum Acolyte", description:"Demo archetype for prayer filtering.", tags:["Ministorum","Faithful","Human"], xpCostByTier:{1:0,2:20,3:20,4:20,5:20}, extraXp:0, example:true }
    ],
    species: [
      { id:"example-species-human", name:"Example: Human", description:"Demo species that supplies the Human keyword.", tags:["Human"], xpCostByTier:{1:0,2:10,3:10,4:10,5:10}, extraXp:0, example:true },
      { id:"example-species-xenos", name:"Example: Xenos", description:"Demo species that supplies the Xenos keyword.", tags:["Xenos"], xpCostByTier:{1:0,2:10,3:10,4:10,5:10}, extraXp:0, example:true }
    ],
    backgrounds: [
      { id:"example-background-veteran", name:"Example: Veteran", description:"Demo background supplying Veteran and Military tags.", tags:["Veteran","Military"], xpCostByTier:{1:0,2:5,3:5,4:5,5:5}, extraXp:0, example:true },
      { id:"example-background-sanctioned", name:"Example: Sanctioned Training", description:"Demo background supplying Psyker eligibility.", tags:["Psyker","SanctionedPsyker"], xpCostByTier:{1:0,2:5,3:5,4:5,5:5}, extraXp:0, example:true }
    ]
  },
  tags: ["Human","Xenos","Military","Veteran","Psyker","SanctionedPsyker","Ministorum","Faithful","Combat","Psychic","Prayer","Gear","Weapon","Ranged","Melee"]
};

export function seedExamples(state) {
  const version = 1;
  if (state.exampleDataVersion >= version) return false;
  for (const [type, items] of Object.entries(EXAMPLE_DATA.content)) {
    state.content[type] ??= [];
    const ids = new Set(state.content[type].map(x => x.id));
    items.forEach(item => { if (!ids.has(item.id)) state.content[type].push(structuredClone(item)); });
  }
  for (const [type, items] of Object.entries(EXAMPLE_DATA.definitions)) {
    state.definitions[type] ??= [];
    const ids = new Set(state.definitions[type].map(x => x.id));
    items.forEach(item => { if (!ids.has(item.id)) state.definitions[type].push(structuredClone(item)); });
  }
  state.contentTags = [...new Set([...(state.contentTags || []), ...EXAMPLE_DATA.tags])];
  state.exampleDataVersion = version;
  return true;
}
