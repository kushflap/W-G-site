const root = document.getElementById("modal-root");

export function openModal({ title, body, footer = "" }) {
  closeModal();

  root.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="button-icon" data-close>×</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
      </div>
    </div>
  `;

  root.querySelector("[data-close]").onclick = closeModal;
  root.querySelector("[data-modal-backdrop]").onclick = e => {
    if (e.target === e.currentTarget) closeModal();
  };

  return root.querySelector(".modal");
}

export function closeModal() {
  root.innerHTML = "";
}
