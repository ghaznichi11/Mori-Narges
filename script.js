/* =========================================================
   MORI × NARGES
   Countdown + Supabase Authentication + Memories
   ========================================================= */


/* ================= SUPABASE ================= */

const SUPABASE_URL =
  "https://tjgwnqfrfggegivekhdj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_8Tv1WNTJamWcA389ZifCRA_ZbKku1xT";

const { createClient } = supabase;

const db = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* ================= SETTINGS ================= */

const TARGET_DATE =
  new Date("2026-09-12T12:15:00+02:00");

const START_DATE =
  new Date("2026-08-01T00:00:00+02:00");


/* ================= STATE ================= */

let currentUser = null;

let countdownInterval = null;


/* ================= HELPERS ================= */

function getEl(id) {
  return document.getElementById(id);
}


/* ================= STATUS ================= */

function showStatus(message, success = true) {

  const status = getEl("status");

  if (!status) return;

  status.textContent = message;

  status.style.color =
    success
      ? "#9dffbc"
      : "#ff9d9d";

  setTimeout(() => {

    if (status) {
      status.textContent = "";
    }

  }, 3500);
}


/* ================= LOGIN STATUS ================= */

function showLoginStatus(
  message,
  success = false
) {

  const loginStatus =
    getEl("loginStatus");

  if (!loginStatus) return;

  loginStatus.textContent =
    message;

  loginStatus.style.color =
    success
      ? "#9dffbc"
      : "#ff9d9d";
}


/* ================= COUNTDOWN ================= */

function updateCountdown() {

  const daysEl =
    getEl("days");

  const hoursEl =
    getEl("hours");

  const minutesEl =
    getEl("minutes");

  const secondsEl =
    getEl("seconds");

  if (
    !daysEl ||
    !hoursEl ||
    !minutesEl ||
    !secondsEl
  ) {
    return;
  }

  const distance =
    TARGET_DATE.getTime() -
    Date.now();

  if (distance <= 0) {

    daysEl.textContent = "0";

    hoursEl.textContent = "00";

    minutesEl.textContent = "00";

    secondsEl.textContent = "00";

    return;
  }

  const days =
    Math.floor(
      distance / 86400000
    );

  const hours =
    Math.floor(
      (distance % 86400000) /
      3600000
    );

  const minutes =
    Math.floor(
      (distance % 3600000) /
      60000
    );

  const seconds =
    Math.floor(
      (distance % 60000) /
      1000
    );

  daysEl.textContent =
    String(days).padStart(2, "0");

  hoursEl.textContent =
    String(hours).padStart(2, "0");

  minutesEl.textContent =
    String(minutes).padStart(2, "0");

  secondsEl.textContent =
    String(seconds).padStart(2, "0");
}


/* ================= START COUNTDOWN ================= */

function startCountdown() {

  updateCountdown();

  if (countdownInterval) {

    clearInterval(
      countdownInterval
    );
  }

  countdownInterval =
    setInterval(
      updateCountdown,
      1000
    );
}


/* ================= DAY NUMBER ================= */

function updateDayNumber() {

  const dayNumber =
    getEl("dayNumber");

  if (!dayNumber) return;

  const now =
    new Date();

  const start =
    new Date(START_DATE);

  const difference =
    now.getTime() -
    start.getTime();

  const daysPassed =
    Math.max(
      1,
      Math.floor(
        difference / 86400000
      ) + 1
    );

  dayNumber.textContent =
    `Day ${daysPassed}`;
}


/* ================= LOGIN UI ================= */

function updateLoginUI(user) {

  const loginScreen =
    getEl("loginScreen");

  const noteEditor =
    getEl("noteEditor");

  if (
    !loginScreen ||
    !noteEditor
  ) {
    return;
  }

  if (user) {

    loginScreen.style.display =
      "none";

    noteEditor.style.display =
      "block";

  } else {

    loginScreen.style.display =
      "block";

    noteEditor.style.display =
      "none";
  }
}


/* ================= LOGIN ================= */

async function loginUser() {

  const emailInput =
    getEl("emailInput");

  const passwordInput =
    getEl("passwordInput");

  if (
    !emailInput ||
    !passwordInput
  ) {
    return;
  }

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  if (!email || !password) {

    showLoginStatus(
      "ایمیل و رمز را وارد کن."
    );

    return;
  }

  showLoginStatus(
    "در حال ورود..."
  );

  const {
    data,
    error
  } =
    await db.auth.signInWithPassword({

      email: email,

      password: password

    });

  if (error) {

    console.error(
      "Login error:",
      error
    );

    showLoginStatus(
      "ورود ناموفق بود. ایمیل یا رمز را بررسی کن."
    );

    return;
  }

  currentUser =
    data.user;

  showLoginStatus(
    "ورود موفق بود ❤️",
    true
  );

  updateLoginUI(
    currentUser
  );

  emailInput.value = "";

  passwordInput.value = "";

  await loadMessages();
}


/* ================= LOGOUT ================= */

async function logoutUser() {

  const {
    error
  } =
    await db.auth.signOut();

  if (error) {

    console.error(
      "Logout error:",
      error
    );

    showStatus(
      "خروج انجام نشد.",
      false
    );

    return;
  }

  currentUser = null;

  updateLoginUI(null);

  const notesList =
    getEl("notesList");

  const noteCount =
    getEl("noteCount");

  if (notesList) {

    notesList.innerHTML = `
      <div class="empty">
        برای دیدن یادداشت‌های ما وارد شوید 🌙
      </div>
    `;
  }

  if (noteCount) {

    noteCount.textContent =
      "0 یادداشت";
  }

  showLoginStatus("");
}


/* ================= FORMAT NOTE DATE ================= */

function formatNoteDate(
  createdAt
) {

  if (!createdAt) {
    return "";
  }

  const date =
    new Date(createdAt);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      calendar: "gregory",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  ).format(date);
}


/* ================= LOAD MESSAGES ================= */

async function loadMessages() {

  const notesList =
    getEl("notesList");

  const noteCount =
    getEl("noteCount");

  if (
    !notesList ||
    !noteCount
  ) {
    return;
  }

  notesList.innerHTML = `
    <div class="empty">
      در حال بارگذاری یادداشت‌ها... 🌙
    </div>
  `;

  const {
    data,
    error
  } =
    await db
      .from("messages")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      "Load messages error:",
      error
    );

    notesList.innerHTML = `
      <div class="empty">
        برای دیدن یادداشت‌ها وارد حساب شوید 🌙
      </div>
    `;

    noteCount.textContent =
      "0 یادداشت";

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
    data
      .map(
        message => {

          const dateText =
            formatNoteDate(
              message.created_at
            );

          const photoHtml =
            message.photo_url
              ? `
                <div class="note-photo">
                  <img
                    src="${escapeHtml(message.photo_url)}"
                    alt="عکس یادداشت"
                    loading="lazy"
                  >
                </div>
              `
              : "";

          return `
            <div class="note-card">

              <div class="note-date">
                ${escapeHtml(
                  message.sender || "❤️"
                )}
              </div>

              ${
                dateText
                  ? `
                    <div class="note-time">
                      ${escapeHtml(
                        dateText
                      )}
                    </div>
                  `
                  : ""
              }

              <div class="note-text">
                ${escapeHtml(
                  message.content || ""
                )}
              </div>

              ${photoHtml}

            </div>
          `;
        }
      )
      .join("");
}


/* ================= SAVE MESSAGE ================= */

async function saveMessage() {

  if (!currentUser) {
    showStatus(
      "اول وارد حساب خودت شو ❤️",
      false
    );
    return;
  }

  const noteInput = getEl("noteInput");
  const photoInput = getEl("photoInput");

  if (!noteInput) {
    return;
  }

  const text = noteInput.value.trim();

  if (!text) {
    showStatus(
      "اول چیزی برای امروز بنویس ❤️",
      false
    );
    return;
  }

  let sender = "Mori ❤️";

  const email =
    currentUser.email
      ? currentUser.email.toLowerCase()
      : "";

  if (email.includes("narges")) {
    sender = "Narges ❤️";
  }

  let photoUrl = null;

  /* ================= PHOTO UPLOAD ================= */

  if (
    photoInput &&
    photoInput.files &&
    photoInput.files.length > 0
  ) {

    const file = photoInput.files[0];

    const fileExt =
      file.name.split(".").pop();

    const fileName =
      `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const filePath =
      `memories/${fileName}`;

    showStatus(
      "عکس در حال آپلود است... 📷",
      true
    );

    const {
      error: uploadError
    } = await db.storage
      .from("note-photos")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );

    if (uploadError) {

      console.error(
        "Photo upload error:",
        uploadError
      );

      showStatus(
        "آپلود عکس انجام نشد.",
        false
      );

      return;
    }

    const {
      data: publicUrlData
    } = db.storage
      .from("note-photos")
      .getPublicUrl(filePath);

    photoUrl =
      publicUrlData.publicUrl;
  }

  /* ================= SAVE MESSAGE ================= */

  const {
    error
  } = await db
    .from("messages")
    .insert({

      content: text,

      sender: sender,

      photo_url: photoUrl

    });

  if (error) {

    console.error(
      "Save message error:",
      error
    );

    showStatus(
      "ذخیره انجام نشد.",
      false
    );

    return;
  }

  /* ================= RESET FORM ================= */

  noteInput.value = "";

  if (photoInput) {
    photoInput.value = "";
  }

  const photoName =
    getEl("photoName");

  if (photoName) {
    photoName.textContent = "";
  }

  showStatus(
    "یادداشت و عکس با موفقیت ذخیره شد ❤️📷",
    true
  );

  await loadMessages();
}

/* ================= ESCAPE HTML ================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


/* ================= AUTH STATE ================= */

function setupAuthListener() {

  db.auth.onAuthStateChange(
    async (
      _event,
      session
    ) => {

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


/* ================= INITIALIZATION ================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* Countdown */

    startCountdown();


    /* Day number */

    updateDayNumber();


    /* Year */

    const yearEl =
      getEl("year");

    if (yearEl) {

      yearEl.textContent =
        new Date()
          .getFullYear();
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


    /* Logout button */

    const logoutButton =
      getEl("logoutBtn");

    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        logoutUser
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


    /* Enter key on password */

    const passwordInput =
      getEl("passwordInput");

    if (passwordInput) {

      passwordInput.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter"
          ) {

            loginUser();
          }
        }
      );
    }


    /* Check existing session */

    const {
      data,
      error
    } =
      await db.auth.getSession();

    if (error) {

      console.error(
        "Session error:",
        error
      );
    }

    currentUser =
      data?.session?.user || null;


    /* Update UI */

    updateLoginUI(
      currentUser
    );


    /* Load notes if already logged in */

    if (currentUser) {

      await loadMessages();
    }


    /* Start auth listener */

    setupAuthListener();

  }
);
