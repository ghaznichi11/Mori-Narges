const SUPABASE_URL = "https://tjgwnqfrfggegivekhdj.supabase.co";
const SUPABASE_KEY = "sb_publishable_8Tv1WNTJamWcA389ZifCRA_ZbKku1xT";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_DATE = new Date("2026-09-12T12:15:00+02:00");

let currentUser = null;


/* =========================================================
   HELPERS
   ========================================================= */

function getEl(id) {
  return document.getElementById(id);
}


/* =========================================================
   STATUS
   ========================================================= */

function showStatus(message, success = true) {

  const status = getEl("status");

  if (!status) return;

  status.textContent = message;
  status.style.color = success ? "#9dffbc" : "#ff9d9d";

  setTimeout(() => {
    status.textContent = "";
  }, 3500);
}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function updateCountdown() {

  const distance = TARGET_DATE.getTime() - Date.now();

  const daysEl = getEl("days");
  const hoursEl = getEl("hours");
  const minutesEl = getEl("minutes");
  const secondsEl = getEl("seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
    return;
  }

  if (distance <= 0) {

    daysEl.textContent = "0";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";

    return;
  }

  const days = Math.floor(distance / 86400000);

  const hours =
    Math.floor((distance % 86400000) / 3600000);

  const minutes =
    Math.floor((distance % 3600000) / 60000);

  const seconds =
    Math.floor((distance % 60000) / 1000);

  daysEl.textContent = String(days).padStart(2, "0");
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");
}


/* =========================================================
   DAY NUMBER
   ========================================================= */

function updateDayNumber() {

  const dayNumber = getEl("dayNumber");

  if (!dayNumber) return;

  const startDate = new Date("2026-08-13T00:00:00+02:00");

  const now = new Date();

  const difference =
    now.getTime() - startDate.getTime();

  const day =
    Math.max(
      1,
      Math.floor(difference / 86400000) + 1
    );

  dayNumber.textContent = `Day ${day}`;
}


/* =========================================================
   LOGIN UI
   ========================================================= */

function updateLoginUI(user) {

  const loginScreen = getEl("loginScreen");
  const noteEditor = getEl("noteEditor");

  if (!loginScreen || !noteEditor) {
    return;
  }

  if (user) {

    loginScreen.style.display = "none";
    noteEditor.style.display = "block";

  } else {

    loginScreen.style.display = "block";
    noteEditor.style.display = "none";

  }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {

  const emailInput = getEl("emailInput");
  const passwordInput = getEl("passwordInput");
  const loginStatus = getEl("loginStatus");

  if (!emailInput || !passwordInput || !loginStatus) {
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginStatus.textContent = "";

  if (!email || !password) {

    loginStatus.textContent =
      "ایمیل و رمز را وارد کن.";

    loginStatus.style.color = "#ff9d9d";

    return;
  }


  loginStatus.textContent = "در حال ورود...";

  loginStatus.style.color = "#a99da5";


  const { data, error } =
    await db.auth.signInWithPassword({
      email,
      password
    });


  if (error) {

    console.error(error);

    loginStatus.textContent =
      "ورود ناموفق بود. ایمیل یا رمز را بررسی کن.";

    loginStatus.style.color = "#ff9d9d";

    return;
  }


  currentUser = data.user;


  loginStatus.textContent =
    "ورود موفق بود ❤️";

  loginStatus.style.color = "#9dffbc";


  updateLoginUI(currentUser);

  await loadMessages();
}


/* =========================================================
   LOAD MESSAGES
   ========================================================= */

async function loadMessages() {

  const notesList = getEl("notesList");
  const noteCount = getEl("noteCount");

  if (!notesList || !noteCount) {
    return;
  }


  const { data, error } = await db
    .from("messages")
    .select("*")
    .order("created_at", {
      ascending: true
    });


  if (error) {

    console.error(error);

    return;
  }


  noteCount.textContent =
    `${data.length} یادداشت`;


  if (data.length === 0) {

    notesList.innerHTML = `
      <div class="empty">
        هنوز یادداشتی ثبت نشده… اولینش را بنویسید 🌙
      </div>
    `;

    return;
  }


  notesList.innerHTML =
    data.map(message => `

      <div class="note-card">

        <div class="note-date">
          ${escapeHtml(message.sender || "❤️")}
        </div>

        <div class="note-text">
          ${escapeHtml(message.content || "")}
        </div>

      </div>

    `).join("");
}


/* =========================================================
   SAVE MESSAGE
   ========================================================= */

async function saveMessage() {

  if (!currentUser) {

    showStatus(
      "اول وارد حساب خودت شو ❤️",
      false
    );

    return;
  }


  const noteInput = getEl("noteInput");

  if (!noteInput) {
    return;
  }


  const text =
    noteInput.value.trim();


  if (!text) {

    showStatus(
      "اول چیزی برای امروز بنویس ❤️",
      false
    );

    return;
  }


  const sender =
    currentUser.email
      ?.toLowerCase()
      .includes("narges")
      ? "Narges ❤️"
      : "Mori ❤️";


  const { error } =
    await db
      .from("messages")
      .insert({
        content: text,
        sender: sender
      });


  if (error) {

    console.error(error);

    showStatus(
      "ذخیره انجام نشد.",
      false
    );

    return;
  }


  noteInput.value = "";


  showStatus(
    "یادداشت آنلاین ذخیره شد ❤️☁️"
  );


  await loadMessages();
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* Countdown */

    updateCountdown();

    setInterval(
      updateCountdown,
      1000
    );


    /* Day */

    updateDayNumber();


    /* Year */

    const yearEl = getEl("year");

    if (yearEl) {
      yearEl.textContent =
        new Date().getFullYear();
    }


    /* Login button */

    const loginButton =
      getEl("loginBtn");

    if (loginButton) {

      loginButton.addEventListener(
        "click",
        loginUser
      );

    }


    /* Save button */

    const saveButton =
      getEl("saveBtn");

    if (saveButton) {

      saveButton.addEventListener(
        "click",
        saveMessage
      );

    }


    /* Enter key for password */

    const passwordInput =
      getEl("passwordInput");

    if (passwordInput) {

      passwordInput.addEventListener(
        "keydown",
        event => {

          if (event.key === "Enter") {
            loginUser();
          }

        }
      );

    }


    /* Check existing session */

    const { data } =
      await db.auth.getSession();


    currentUser =
      data.session?.user || null;


    updateLoginUI(
      currentUser
    );


    /* Load notes if already logged in */

    if (currentUser) {

      await loadMessages();

    }


    /* Auth state listener */

    db.auth.onAuthStateChange(
      async (_event, session) => {

        currentUser =
          session?.user || null;


        updateLoginUI(
          currentUser
        );


        if (currentUser) {

          await loadMessages();

        }

      }
    );

  }
);
