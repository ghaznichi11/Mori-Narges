const SUPABASE_URL = "https://tjgwnqfrfggegivekhdj.supabase.co";
const SUPABASE_KEY = "sb_publishable_8Tv1WNTJamWcA389ZifCRA_ZbKku1xT";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_DATE = new Date("2026-09-12T12:15:00+02:00");

let currentUser = null;

function getEl(id) {
  return document.getElementById(id);
}

function showStatus(message, success = true) {
  const status = getEl("status");

  if (!status) return;

  status.textContent = message;
  status.style.color = success ? "#9dffbc" : "#ff9d9d";

  setTimeout(() => {
    status.textContent = "";
  }, 3500);
}

function updateCountdown() {
  const distance = TARGET_DATE.getTime() - Date.now();

  const daysEl = getEl("days");
  const hoursEl = getEl("hours");
  const minutesEl = getEl("minutes");
  const secondsEl = getEl("seconds");

  if (distance <= 0) {
    daysEl.textContent = "0";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance % 86400000) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);

  daysEl.textContent = String(days).padStart(2, "0");
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");
}

function updateLoginUI(user) {
  const loginScreen = getEl("loginScreen");

  if (!loginScreen) return;

  loginScreen.style.display = user ? "none" : "flex";
}

async function loginUser() {
  const email = getEl("emailInput").value.trim();
  const password = getEl("passwordInput").value;
  const loginStatus = getEl("loginStatus");

  if (!email || !password) {
    loginStatus.textContent = "ایمیل و رمز را وارد کن.";
    loginStatus.style.color = "#ff9d9d";
    return;
  }

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginStatus.textContent = "ورود ناموفق بود. ایمیل یا رمز را بررسی کن.";
    loginStatus.style.color = "#ff9d9d";
    return;
  }

  currentUser = data.user;
  loginStatus.textContent = "ورود موفق بود ❤️";
  loginStatus.style.color = "#9dffbc";

  updateLoginUI(currentUser);
  await loadMessages();
}

async function loadMessages() {
  const notesList = getEl("notesList");
  const noteCount = getEl("noteCount");

  const { data, error } = await db
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  noteCount.textContent = `${data.length} یادداشت`;

  if (data.length === 0) {
    notesList.innerHTML = `
      <div class="empty">
        هنوز یادداشتی ثبت نشده… اولینش را بنویسید 🌙
      </div>
    `;
    return;
  }

  notesList.innerHTML = data.map(message => `
    <div class="note-card">
      <div class="note-date">
        ${message.sender || "❤️"}
      </div>
      <div class="note-text">
        ${escapeHtml(message.content || "")}
      </div>
    </div>
  `).join("");
}

async function saveMessage() {
  if (!currentUser) {
    showStatus("اول وارد حساب خودت شو ❤️", false);
    return;
  }

  const noteInput = getEl("noteInput");
  const text = noteInput.value.trim();

  if (!text) {
    showStatus("اول چیزی برای امروز بنویس ❤️", false);
    return;
  }

  const sender =
    currentUser.email?.toLowerCase().includes("narges")
      ? "Narges ❤️"
      : "Mori ❤️";

  const { error } = await db
    .from("messages")
    .insert({
      content: text,
      sender: sender
    });

  if (error) {
    console.error(error);
    showStatus("ذخیره انجام نشد.", false);
    return;
  }

  noteInput.value = "";
  showStatus("یادداشت آنلاین ذخیره شد ❤️☁️");

  await loadMessages();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", async () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const loginButton = getEl("loginBtn");

  if (loginButton) {
    loginButton.addEventListener("click", loginUser);
  }

  const saveButton = getEl("saveBtn");

  if (saveButton) {
    saveButton.addEventListener("click", saveMessage);
  }

  const yearEl = getEl("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const { data } = await db.auth.getSession();

  currentUser = data.session?.user || null;

  updateLoginUI(currentUser);

  if (currentUser) {
    await loadMessages();
  }

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateLoginUI(currentUser);

    if (currentUser) {
      loadMessages();
      updateCountdown();
setInterval(updateCountdown, 1000);
      const TARGET_DATE = new Date("2026-09-12T12:15:00+02:00");
    }
  });
});
