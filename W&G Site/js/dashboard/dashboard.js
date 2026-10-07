import { state } from "../state/store.js";
import { saveState } from "../state/storage.js";
import { CONTENT_TYPES, getContent, allTags, createContentId } from "../data/content.js";
import { openModal, closeModal } from "../ui/modal.js";

const DEF_TYPES = [
  { key: "archetypes", label: "Archetypes" },
  { key: "species", label: "Species" },
  { key: "backgrounds", label: "Backgrounds" }
];

export function renderDashboard() {
  const root = document.getElementById("dashboard-section");
  root.innerHTML = `
    <div class="section-header">
      <div><div class="eyebrow">GM Data Control</div><h1>Content Dashboard</h1><p class="muted">Add and maintain campaign content without editing JavaScript.</p></div>
      <div class="toolbar"><button id="dashboard-export">Export Data</button><button id="dashboard-import">Import Data</button><input id="dashboard-import-file" type="file" accept=".json,application/json" hidden><button id="dashboard-reset" class="button-danger">Reset Content</button></div>
    </div>
    <div class="dashboard-tabs">
      <button class="dashboard-tab active" data-tab="content">Abilities & Gear</button>
      <button class="dashboard-tab" data-tab="definitions">Archetypes / Species</button>
      <button class="dashboard-tab" data-tab="tags">Tags</button>
      <button class="dashboard-tab" data-tab="xp">XP Settings</button>
    </div>
    <div id="dashboard-panel"></div>
  `;

  root.querySelectorAll(".dashboard-tab").forEach(btn => btn.onclick = () => {
    root.querySelectorAll(".dashboard-tab").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    renderTab(btn.dataset.tab);
  });
  root.querySelector("#dashboard-export").onclick = exportContent;
  root.querySelector("#dashboard-import").onclick = () => root.querySelector("#dashboard-import-file").click();
  root.querySelector("#dashboard-import-file").onchange = e => importContent(e.target.files[0]);
  root.querySelector("#dashboard-reset").onclick = () => {
    if (!confirm("Reset all custom dashboard content and definitions? This does not delete characters or encounters.")) return;
    state.content = { talents: [], psychicAbilities: [], prayers: [], wargear: [], weapons: [] };
    state.definitions = { archetypes: [], species: [], backgrounds: [] };
    state.contentTags = [];
    saveState(); renderDashboard();
  };
  renderTab("content");

  function renderTab(tab) {
    const panel = root.querySelector("#dashboard-panel");
    if (tab === "content") renderContent(panel);
    if (tab === "definitions") renderDefinitions(panel);
    if (tab === "tags") renderTags(panel);
    if (tab === "xp") renderXP(panel);
  }

  function renderContent(panel) {
    panel.innerHTML = `
      <div class="dashboard-toolbar card"><div><strong>Content library</strong><span class="muted small"> Each entry can have tier-specific XP and eligibility tags. Example entries are included so you can test the builder immediately.</span></div><button id="add-content" class="button-primary">+ Add Content</button></div>
      <div class="dashboard-filters card"><input id="content-search" placeholder="Search name, description, or tag..."><select id="content-type"><option value="all">All categories</option>${CONTENT_TYPES.map(t => `<option value="${t.key}">${t.label}</option>`).join("")}</select></div>
      <div id="content-table" class="dashboard-table"></div>`;
    const refresh = () => {
      const q = panel.querySelector("#content-search").value.toLowerCase().trim();
      const type = panel.querySelector("#content-type").value;
      const rows = CONTENT_TYPES.flatMap(t => (type === "all" || type === t.key ? getContent(t.key).map(x => ({...x, type:t.key, typeLabel:t.label})) : []))
        .filter(x => !q || `${x.name} ${x.description} ${(x.keywords||[]).join(" ")} ${(x.requiredTags||[]).join(" ")}`.toLowerCase().includes(q));
      panel.querySelector("#content-table").innerHTML = rows.length ? rows.map(x => contentRow(x)).join("") : `<div class="card empty-state">No content entries yet.</div>`;
      panel.querySelectorAll("[data-edit-content]").forEach(b => b.onclick = () => openContentEditor(b.dataset.editContent, b.dataset.type));
      panel.querySelectorAll("[data-delete-content]").forEach(b => b.onclick = () => {
        if (!confirm(`Delete ${b.dataset.name}?`)) return;
        const arr = getContent(b.dataset.type); const i = arr.findIndex(x => x.id === b.dataset.deleteContent); if (i >= 0) arr.splice(i,1);
        saveState(); refresh();
      });
    };
    panel.querySelector("#add-content").onclick = () => openContentEditor(null, "talents", refresh);
    panel.querySelector("#content-search").oninput = refresh;
    panel.querySelector("#content-type").onchange = refresh;
    refresh();
  }

  function contentRow(x) {
    const costs = [1,2,3,4,5].map(t => `${t}:${Number(x.xpCostByTier?.[t] ?? 0)}`).join(" · ");
    return `<div class="dashboard-row card"><div class="dashboard-main"><strong>${esc(x.name)}</strong><span class="badge">${esc(x.typeLabel)}</span>${x.example ? `<span class="badge example-badge">Example</span>` : ""}<span class="muted small">${esc((x.keywords||[]).join(", ") || "No tags")}</span><p class="muted small">${esc(x.description || "")}</p></div><div class="dashboard-costs"><span>XP</span><strong>${costs}</strong></div><div class="toolbar"><button data-edit-content="${x.id}" data-type="${x.type}">Edit</button><button data-delete-content="${x.id}" data-type="${x.type}" data-name="${esc(x.name)}" class="button-danger">Delete</button></div></div>`;
  }

  function openContentEditor(id, initialType, afterSave = () => renderContent(root.querySelector("#dashboard-panel"))) {
    const type = id ? CONTENT_TYPES.find(t => getContent(t.key).some(x => x.id === id))?.key || initialType : initialType;
    const arr = getContent(type);
    const item = arr.find(x => x.id === id) || { id:createContentId(type), name:"", tier:1, description:"", keywords:[], requiredTags:[], anyRequiredTags:[], forbiddenTags:[], xpCostByTier:{1:0,2:0,3:0,4:0,5:0}, extraXp:0 };
    const modal = openModal({ title: id ? "Edit Content" : "Add Content", body: `
      <div class="grid grid-2">
        <div class="field"><label>Category</label><select id="c-type">${CONTENT_TYPES.map(t => `<option value="${t.key}" ${t.key===type?"selected":""}>${t.label}</option>`).join("")}</select></div>
        <div class="field"><label>Name</label><input id="c-name" value="${esc(item.name)}"></div>
        <div class="field"><label>Tier / rank</label><select id="c-tier">${[1,2,3,4,5].map(t=>`<option ${Number(item.tier)===t?"selected":""}>${t}</option>`).join("")}</select></div>
        <div class="field"><label>Extra XP modifier</label><input id="c-extra" type="number" min="0" value="${Number(item.extraXp||0)}"></div>
      </div>
      <div class="field"><label>Description</label><textarea id="c-description" rows="4">${esc(item.description)}</textarea></div>
      <div class="grid grid-2">
        <div class="field"><label>Keywords / tags</label><input id="c-keywords" value="${esc((item.keywords||[]).join(", "))}" placeholder="Aeldari, Psyker, Adeptus Mechanicus"></div>
        <div class="field"><label>Required ALL tags</label><input id="c-required" value="${esc((item.requiredTags||[]).join(", "))}" placeholder="Psyker, Space Marine"></div>
        <div class="field"><label>Required ANY tag</label><input id="c-any" value="${esc((item.anyRequiredTags||[]).join(", "))}" placeholder="Sanctioned Psyker, Navigator"></div>
        <div class="field"><label>Forbidden tags</label><input id="c-forbidden" value="${esc((item.forbiddenTags||[]).join(", "))}" placeholder="Non-Psyker"></div>
      </div>
      <h3>XP cost by character tier</h3>
      <div class="xp-grid">${[1,2,3,4,5].map(t=>`<div class="field"><label>Tier ${t}</label><input id="xp-${t}" type="number" min="0" value="${Number(item.xpCostByTier?.[t] ?? 0)}"></div>`).join("")}</div>
      <p class="muted small">Tags control eligibility. A character receives tags from its archetype, species, background, plus any custom character tags.</p>
    `, footer:`<button id="cancel">Cancel</button><button id="save-content" class="button-primary">Save Content</button>` });
    modal.querySelector("#cancel").onclick = closeModal;
    modal.querySelector("#save-content").onclick = () => {
      const chosenType = modal.querySelector("#c-type").value;
      const data = { ...item,
        id: item.id,
        name: modal.querySelector("#c-name").value.trim() || "Unnamed Entry",
        tier: Number(modal.querySelector("#c-tier").value),
        extraXp: Number(modal.querySelector("#c-extra").value) || 0,
        description: modal.querySelector("#c-description").value,
        keywords: csv(modal.querySelector("#c-keywords").value),
        requiredTags: csv(modal.querySelector("#c-required").value),
        anyRequiredTags: csv(modal.querySelector("#c-any").value),
        forbiddenTags: csv(modal.querySelector("#c-forbidden").value),
        xpCostByTier: Object.fromEntries([1,2,3,4,5].map(t=>[t, Math.max(0, Number(modal.querySelector(`#xp-${t}`).value)||0)]))
      };
      if (chosenType !== type) {
        const old = getContent(type); const oldIndex = old.findIndex(x=>x.id===item.id); if(oldIndex>=0) old.splice(oldIndex,1);
      } else {
        const index = arr.findIndex(x=>x.id===item.id); if(index>=0) arr[index]=data;
      }
      const target = getContent(chosenType); if(!target.some(x=>x.id===data.id)) target.push(data);
      data.keywords.forEach(t=>addTag(t)); data.requiredTags.forEach(t=>addTag(t)); data.anyRequiredTags.forEach(t=>addTag(t)); data.forbiddenTags.forEach(t=>addTag(t));
      saveState(); closeModal(); afterSave();
    };
  }

  function renderDefinitions(panel) {
    panel.innerHTML = `<div class="dashboard-toolbar card"><div><strong>Eligibility definitions</strong><span class="muted small">Give archetypes, species and backgrounds tags. Characters inherit these tags.</span></div><button id="add-definition" class="button-primary">+ Add Definition</button></div><div id="definition-list"></div>`;
    const refresh = () => {
      const rows = DEF_TYPES.flatMap(t => (state.definitions[t.key]||[]).map(x=>({...x,type:t.key,label:t.label})));
      panel.querySelector("#definition-list").innerHTML = rows.length ? rows.map(x=>`<div class="dashboard-row card"><div class="dashboard-main"><strong>${esc(x.name)}</strong><span class="badge">${esc(x.label)}</span><span class="muted small">${esc((x.tags||[]).join(", ") || "No tags")}</span><span class="muted small">XP: ${[1,2,3,4,5].map(t=>`${t}:${Number(x.xpCostByTier?.[t]||0)}`).join(" · ")}</span><p class="muted small">${esc(x.description||"")}</p></div><div class="toolbar"><button data-edit-def="${x.id}" data-type="${x.type}">Edit</button><button class="button-danger" data-del-def="${x.id}" data-type="${x.type}" data-name="${esc(x.name)}">Delete</button></div></div>`).join("") : `<div class="card empty-state">No archetypes, species or backgrounds defined.</div>`;
      panel.querySelectorAll("[data-edit-def]").forEach(b=>b.onclick=()=>openDefinitionEditor(b.dataset.id,b.dataset.type,refresh));
      panel.querySelectorAll("[data-del-def]").forEach(b=>b.onclick=()=>{if(!confirm(`Delete ${b.dataset.name}?`))return; const a=state.definitions[b.dataset.type]; const i=a.findIndex(x=>x.id===b.dataset.delDef); if(i>=0)a.splice(i,1); saveState(); refresh();});
    };
    panel.querySelector("#add-definition").onclick=()=>openDefinitionEditor(null,"archetypes",refresh);
    refresh();
  }

  function openDefinitionEditor(id, initialType, afterSave) {
    const arr=state.definitions[initialType]||[]; const item=arr.find(x=>x.id===id)||{id:crypto.randomUUID(),name:"",description:"",tags:[],xpCostByTier:{1:0,2:0,3:0,4:0,5:0},extraXp:0};
    const modal=openModal({title:id?"Edit Definition":"Add Definition",body:`<div class="grid grid-2"><div class="field"><label>Type</label><select id="d-type">${DEF_TYPES.map(t=>`<option value="${t.key}" ${t.key===initialType?"selected":""}>${t.label}</option>`).join("")}</select></div><div class="field"><label>Name</label><input id="d-name" value="${esc(item.name)}"></div></div><div class="field"><label>Description</label><textarea id="d-description" rows="3">${esc(item.description)}</textarea></div><div class="field"><label>Tags inherited by characters</label><input id="d-tags" value="${esc((item.tags||[]).join(", "))}" placeholder="Psyker, Aeldari, Rogue Trader"></div><div class="field"><label>Extra XP modifier</label><input id="d-extra" type="number" min="0" value="${Number(item.extraXp||0)}"></div><h3>XP cost by character tier</h3><div class="xp-grid">${[1,2,3,4,5].map(t=>`<div class="field"><label>Tier ${t}</label><input id="d-xp-${t}" type="number" min="0" value="${Number(item.xpCostByTier?.[t] ?? 0)}"></div>`).join("")}</div>`,footer:`<button id="cancel">Cancel</button><button id="save" class="button-primary">Save</button>`});
    modal.querySelector("#cancel").onclick=closeModal;
    modal.querySelector("#save").onclick=()=>{const chosen=modal.querySelector("#d-type").value; const data={id:item.id,name:modal.querySelector("#d-name").value.trim()||"Unnamed",description:modal.querySelector("#d-description").value,tags:csv(modal.querySelector("#d-tags").value),extraXp:Number(modal.querySelector("#d-extra").value)||0,xpCostByTier:Object.fromEntries([1,2,3,4,5].map(t=>[t,Math.max(0,Number(modal.querySelector(`#d-xp-${t}`).value)||0)]))}; if(chosen!==initialType){const old=state.definitions[initialType]; const i=old.findIndex(x=>x.id===item.id);if(i>=0)old.splice(i,1);} const target=state.definitions[chosen]; const i=target.findIndex(x=>x.id===data.id);if(i>=0)target[i]=data;else target.push(data);data.tags.forEach(addTag);saveState();closeModal();afterSave();};
  }

  function renderTags(panel) {
    panel.innerHTML=`<div class="card"><h2>Tag Registry</h2><p class="muted">Tags are the glue between character identity and content eligibility.</p><div class="field"><label>Create tag</label><div class="inline-form"><input id="new-tag" placeholder="e.g. Psyker"><button id="add-tag" class="button-primary">Add Tag</button></div></div><div id="tag-list" class="tag-cloud"></div></div>`;
    const refresh=()=>panel.querySelector("#tag-list").innerHTML=allTags().map(tag=>`<span class="tag-chip">${esc(tag)} <button data-remove-tag="${esc(tag)}" title="Remove">×</button></span>`).join("")||`<span class="muted">No tags yet.</span>`;
    panel.querySelector("#add-tag").onclick=()=>{const v=panel.querySelector("#new-tag").value.trim();if(v){addTag(v);panel.querySelector("#new-tag").value="";saveState();refresh();}};
    panel.querySelector("#new-tag").onkeydown=e=>{if(e.key==="Enter")panel.querySelector("#add-tag").click();};
    panel.querySelector("#tag-list").onclick=e=>{const b=e.target.closest("[data-remove-tag]");if(!b)return; const tag=b.dataset.removeTag; state.contentTags=(state.contentTags||[]).filter(x=>x!==tag);saveState();refresh();};
    refresh();
  }

  function renderXP(panel) {
    const s=state.settings;
    panel.innerHTML=`<div class="card"><h2>Character XP Rules</h2><p class="muted">These are campaign settings. Individual content entries still define their own cost at each tier.</p><div class="xp-grid">${[1,2,3,4,5].map(t=>`<div class="field"><label>Tier ${t} starting XP</label><input id="budget-${t}" type="number" min="0" value="${Number(s.xpBudgetsByTier?.[t]||0)}"></div>`).join("")}</div><label class="check-row"><input id="allow-extra" type="checkbox" ${s.allowExtraXp!==false?"checked":""}> Allow extra XP during character creation</label><div class="field"><label>Default extra XP</label><input id="extra-default" type="number" min="0" value="${Number(s.extraXpDefault||0)}"></div><button id="save-xp" class="button-primary">Save XP Settings</button></div>`;
    panel.querySelector("#save-xp").onclick=()=>{[1,2,3,4,5].forEach(t=>s.xpBudgetsByTier[t]=Math.max(0,Number(panel.querySelector(`#budget-${t}`).value)||0));s.allowExtraXp=panel.querySelector("#allow-extra").checked;s.extraXpDefault=Math.max(0,Number(panel.querySelector("#extra-default").value)||0);saveState();toast("XP settings saved.");};
  }
}

function exportContent(){
  const blob=new Blob([JSON.stringify({content:state.content,definitions:state.definitions,contentTags:state.contentTags,settings:state.settings},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="wrath-glory-content.json";a.click();URL.revokeObjectURL(a.href);
}
function addTag(tag){if(!state.contentTags.includes(tag))state.contentTags.push(tag);}
function csv(v){return [...new Set(v.split(",").map(x=>x.trim()).filter(Boolean))];}
function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function toast(msg){const root=document.getElementById("toast-root");root.textContent=msg;root.classList.add("show");setTimeout(()=>root.classList.remove("show"),1800);}

async function importContent(file){
  if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    if(parsed.content) state.content={...state.content,...parsed.content};
    if(parsed.definitions) state.definitions={...state.definitions,...parsed.definitions};
    if(Array.isArray(parsed.contentTags)) state.contentTags=[...new Set([...state.contentTags,...parsed.contentTags])];
    if(parsed.settings) state.settings={...state.settings,...parsed.settings};
    saveState(); toast("Content data imported.");
    const dashboard=document.getElementById("dashboard-section");
    if(dashboard) renderDashboard();
  }catch(e){console.error(e);toast("Import failed. Check the content JSON.");}
}
