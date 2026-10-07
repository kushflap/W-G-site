export function renderNavigation(currentPage, onNavigate, onExport, onImport) {
  const nav = document.getElementById("main-navigation");

  nav.innerHTML = `
    <div class="brand">WRATH & GLORY</div>
    <button class="nav-button ${currentPage==="combat"?"active":""}" data-page="combat">⚔ Combat</button>
    <button class="nav-button ${currentPage==="characters"?"active":""}" data-page="characters">☠ Characters</button>
    <button class="nav-button ${currentPage==="builder"?"active":""}" data-page="builder">✦ Builder</button>
    <button class="nav-button ${currentPage==="dashboard"?"active":""}" data-page="dashboard">⚙ Dashboard</button>
    <div class="nav-spacer"></div>
    <button class="nav-button" id="export">Export</button>
    <button class="nav-button" id="import">Import</button>
    <input id="import-file" type="file" accept=".json,application/json" hidden>
  `;

  nav.querySelectorAll("[data-page]").forEach(button => {
    button.onclick = () => onNavigate(button.dataset.page);
  });

  nav.querySelector("#export").onclick = onExport;
  nav.querySelector("#import").onclick = () => nav.querySelector("#import-file").click();
  nav.querySelector("#import-file").onchange = e => {
    if (e.target.files[0]) onImport(e.target.files[0]);
  };
}
