import { state, normalizeState } from "./store.js";
import { seedExamples } from "../data/examples.js";

const STORAGE_KEY = "wrath-glory-campaign-v2";

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) { normalizeState(); seedExamples(state); saveState(); return true; }

  try {
    Object.assign(state, JSON.parse(saved));
    normalizeState();
    const seeded = seedExamples(state);
    if (seeded) saveState();
    return true;
  } catch (error) {
    console.error("Could not load saved state:", error);
    return false;
  }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

export function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName(state.campaign.name || "campaign")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importStateFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        Object.assign(state, parsed);
        normalizeState();
        saveState();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function safeFileName(value) {
  return String(value).replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
