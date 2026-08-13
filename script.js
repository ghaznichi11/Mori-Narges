const TARGET_DATE = new Date("2026-09-12T00:00:00").getTime();
const NOTES_KEY = "mori_narges_daily_notes";

function getEl(...selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function updateCountdown() {
  const now = Date.now();
  const distance = TARGET_DATE - now;

  const daysEl = getEl("#days", ".days", "[data-unit='days']");
  const hoursEl = getEl("#hours", ".hours", "[data-unit='hours']");
  const minutesEl = getEl("#minutes", ".minutes", "[data-unit='minutes']");
  const secondsEl = getEl("#seconds", ".seconds", "[data-unit='seconds']");

  if (distance <= 0) {
    if (daysEl) daysEl.textContent = "0";
    if (hoursEl) hoursEl.textContent = "0";
    if (minutesEl) minutesEl.textContent = "0";
    if (secondsEl) secondsEl.textContent = "0";
    return;
  }

  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance % 86400000) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);

  if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
}

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function setupNotes() {
  const notes = loadNotes();

  const fields = document.querySelectorAll(
    "textarea[data-date], input[data-date], [contenteditable='true'][data-date]"
  );

  fields.forEach((field) => {
    const date = field.dataset.date;
    if (!date) return;

    if (notes[date] !== undefined) {
      if ("value" in field) {
        field.value = notes[date];
      } else {
        field.textContent = notes[date];
      }
    }

    const save = () => {
      const value = "value" in field ? field.value : field.textContent;
      notes[date] = value;
      saveNotes(notes);
    };

    field.addEventListener("input", save);
    field.addEventListener("change", save);
  });

  document.querySelectorAll("[data-save-note]").forEach((button) => {
    button.addEventListener("click", () => {
      const date = button.dataset.saveNote;
      const field = document.querySelector(`[data-date="${date}"]`);
      if (!field) return;

      const value = "value" in field ? field.value : field.textContent;

      notes[date] = value;
      saveNotes(notes);

      const oldText = button.textContent;
      button.textContent = "Saved ✓";

      setTimeout(() => {
        button.textContent = oldText;
      }, 1200);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  setupNotes();
});
