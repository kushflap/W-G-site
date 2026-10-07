import { state } from "../state/store.js";
import { saveState } from "../state/storage.js";
import { CONTENT_TYPES, getContent, isEligible, xpCost, definitionCost, characterTags } from "../data/content.js";
import { filterItems } from "./filters.js";

export function renderBuilder() {
  const container=document.getElementById("builder-section");
  const characters=state.characters;
  const selected=characters.find(c=>c.id===state.builder.selectedCharacterId) || characters[0] || null;
  if(selected){
    state.builder.selectedCharacterId=selected.id;
    CONTENT_TYPES.forEach(type=>{
      state.builder.selections[type.key]=[...(selected[type.key]||[])];
    });
  }
  const budget=selected ? Number(state.settings.xpBudgetsByTier[selected.tier]||0)+Number(selected.extraXp||0) : 0;
  const spent=selected ? totalSpent(selected) : 0;
  container.innerHTML=`
    <div class="section-header"><div><div class="eyebrow">Character Creation</div><h1>Builder</h1><p class="muted">Select a character to apply tier XP and tag eligibility automatically.</p></div><div class="builder-xp ${spent>budget?"over":""}"><span>XP</span><strong>${spent} / ${budget}</strong></div></div>
    <div class="card builder-character-bar"><div class="field"><label>Character</label><select id="builder-character"><option value="">Choose character...</option>${characters.map(c=>`<option value="${c.id}" ${selected?.id===c.id?"selected":""}>${esc(c.name)} · Tier ${c.tier}</option>`).join("")}</select></div>${selected?`<div class="field"><label>Tier</label><select id="builder-tier">${[1,2,3,4,5].map(t=>`<option value="${t}" ${Number(selected.tier)===t?"selected":""}>Tier ${t}</option>`).join("")}</select></div><div class="field"><label>Extra XP</label><input id="builder-extra" type="number" min="0" value="${Number(selected.extraXp||0)}"></div><div class="builder-tags"><label>Active tags</label><div>${characterTags(selected).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join("")||`<span class="muted small">None</span>`}</div></div>`:"<div class="empty-state">Create a character first.</div>"}</div>
    <div class="builder-steps" role="tablist" aria-label="Character creation steps">
      <button class="builder-step active" data-step="identity">01 <span>Identity</span></button>
      <button class="builder-step" data-step="talents">02 <span>Talents</span></button>
      <button class="builder-step" data-step="powers">03 <span>Powers & Prayers</span></button>
      <button class="builder-step" data-step="gear">04 <span>Gear & Weapons</span></button>
      <button class="builder-step" data-step="review">05 <span>Review</span></button>
    </div>
    <div class="card" style="margin-bottom:14px"><div class="grid grid-2"><div class="field"><label>Search all categories</label><input id="builder-search" placeholder="Search by name, description or keyword..."></div><label class="check-row"><input id="eligible-only" type="checkbox" checked> Show only tag-eligible content</label></div><div id="selected-summary" class="selected-list"></div></div>
    <div class="builder-layout" id="builder-layout"></div>`;

  container.querySelector("#builder-character")?.addEventListener("change",e=>{state.builder.selectedCharacterId=e.target.value;saveState();renderBuilder();});
  container.querySelector("#builder-tier")?.addEventListener("change",e=>{if(!selected)return;selected.tier=Number(e.target.value);saveState();renderBuilder();});
  container.querySelector("#builder-extra")?.addEventListener("change",e=>{if(!selected)return;selected.extraXp=Math.max(0,Number(e.target.value)||0);saveState();renderBuilder();});
  container.querySelector("#eligible-only")?.addEventListener("change",renderLists);
  container.querySelector("#builder-search")?.addEventListener("input",renderLists);

  const stepMap = { talents:"talents", psychicAbilities:"powers", prayers:"powers", wargear:"gear", weapons:"gear" };
  let activeStep = "identity";
  container.querySelectorAll(".builder-step").forEach(btn => btn.onclick = () => {
    activeStep = btn.dataset.step;
    container.querySelectorAll(".builder-step").forEach(x => x.classList.toggle("active", x === btn));
    renderLists();
  });

  CONTENT_TYPES.forEach(type=>{
    state.builder.selections[type.key]??=[];
    const panel=document.createElement("div");panel.className="card builder-panel";panel.innerHTML=`<div class="card-header"><div><h2>${type.label}</h2><span class="muted small">${getContent(type.key).length} entries</span></div></div><div class="builder-search"><input data-search="${type.key}" placeholder="Search ${type.label.toLowerCase()}..."><select data-tier="${type.key}"><option value="all">All tiers</option>${[1,2,3,4,5].map(t=>`<option value="${t}">Tier ${t}</option>`).join("")}</select></div><div class="item-list" data-list="${type.key}"></div>`;container.querySelector("#builder-layout").appendChild(panel);
    panel.querySelector(`[data-search="${type.key}"]`).oninput=renderLists;panel.querySelector(`[data-tier="${type.key}"]`).onchange=renderLists;
  });
  renderLists();

  function renderLists(){
    const q=container.querySelector("#builder-search")?.value||"";const eligibleOnly=container.querySelector("#eligible-only")?.checked!==false;
    CONTENT_TYPES.forEach(type=>{const panel=container.querySelector(`[data-list="${type.key}"]`).parentElement;const search=panel.querySelector(`[data-search="${type.key}"]`).value;const tier=panel.querySelector(`[data-tier="${type.key}"]`).value;let items=filterItems(getContent(type.key),{search,tier});if(eligibleOnly)items=items.filter(item=>isEligible(item,selected));const list=panel.querySelector(`[data-list="${type.key}"]`);if(!items.length){list.innerHTML=`<div class="empty-state">No matching eligible entries.</div>`;return;}list.innerHTML=items.map(item=>{const selectedItem=state.builder.selections[type.key].includes(item.id);const cost=selected?xpCost(item,selected.tier)+Number(item.extraXp||0):0;return `<div class="item-row ${selectedItem?"selected-row":""}"><div class="item-info"><strong>${esc(item.name)}</strong><span>Tier ${esc(item.tier||1)} · ${cost} XP · ${esc((item.keywords||[]).join(", "))}</span><p class="muted small">${esc(item.description||"")}</p></div><button>${selectedItem?"Remove":"Add"}</button></div>`;}).join("");list.querySelectorAll("button").forEach((button,i)=>button.onclick=()=>{const item=items[i];const arr=state.builder.selections[type.key];const idx=arr.indexOf(item.id);if(idx>=0)arr.splice(idx,1);else arr.push(item.id);syncCharacter();saveState();renderLists();});});
    renderSelected(q);
    if (activeStep === "review") {
      container.querySelectorAll(".builder-panel").forEach(p => p.hidden = false);
      const review = container.querySelector("#selected-summary");
      review.innerHTML = `<div class="review-grid"><div><strong>Character</strong><span>${esc(selected?.name || "None")}</span></div><div><strong>Tier</strong><span>${selected?.tier || "-"}</span></div><div><strong>XP</strong><span>${spent} / ${budget}</span></div><div><strong>Tags</strong><span>${characterTags(selected).map(esc).join(", ") || "None"}</span></div></div>` + (spent>budget ? `<p class="danger-text">This character is over the available XP budget.</p>` : `<p class="success-text">Character is within the available XP budget.</p>`);
    }
  }
  function syncCharacter(){if(!selected)return;CONTENT_TYPES.forEach(type=>{selected[type.key]=[...(state.builder.selections[type.key]||[])];});selected.xpSpent=totalSpent(selected);}
  function renderSelected(){const root=container.querySelector("#selected-summary");if(!root)return;const chips=[];CONTENT_TYPES.forEach(type=>(state.builder.selections[type.key]||[]).forEach(id=>{const item=getContent(type.key).find(x=>x.id===id);if(item)chips.push(`<span class="badge accent">${esc(item.name)} · ${xpCost(item,selected?.tier||1)+Number(item.extraXp||0)} XP</span>`);}));root.innerHTML=chips.length?chips.join(""):`<span class="muted small">Nothing selected.</span>`;}
}

function totalSpent(character){let total=CONTENT_TYPES.reduce((sum,type)=>(character[type.key]||[]).reduce((s,id)=>{const item=getContent(type.key).find(x=>x.id===id);return s+(item?xpCost(item,character.tier||1)+Number(item.extraXp||0):0);},sum),0); ["archetypes","species","backgrounds"].forEach(group=>{const id=character[group.slice(0,-1)];const def=(state.definitions?.[group]||[]).find(x=>x.id===id); total+=definitionCost(def,character.tier||1);}); return total;}
function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
