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


/*
  اگر روز شروع شمارش را می‌دانی،
  این تاریخ را تغییر بده.

  فعلاً فقط برای نمایش Day استفاده می‌شود.
*/

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

function showLoginStatus(message, success = false) {

  const loginStatus =
    getEl("loginStatus");

  if (!loginStatus) return;

  loginStatus.textContent = message;

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
    TARGET_DATE.getTime() - Date.now();


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
    clearInterval(countdownInterval);
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


  if (!loginScreen || !noteEditor) {
    return;
  }


  if (user) {

    /* User is logged in */

    loginScreen.style.display =
      "none";

    noteEditor.style.display =
      "block";


  } else {

    /* User is logged out */

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


  if (!emailInput || !passwordInput) {
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


  showLoginStatus(
    ""
  );

}


/* ================= LOAD MESSAGES ================= */

async function loadMessages() {

  const notesList =
    getEl("notesList");


  const noteCount =
    getEl("noteCount");


  if (!notesList || !noteCount) {
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
        message => `

          <div class="note-card">

            <div class="note-date">
              ${escapeHtml(
                message.sender || "❤️"
              )}
            </div>

            <div class="note-text">
              ${escapeHtml(
                message.content || ""
              )}
            </div>

          </div>

        `
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


  const noteInput =
    getEl("noteInput");


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


  let sender =
    "Mori ❤️";


  const email =
    currentUser.email
      ? currentUser.email.toLowerCase()
      : "";


  if (
    email.includes("narges")
  ) {

    sender =
      "Narges ❤️";

  }


  const {
    error
  } =
    await db
      .from("messages")
      .insert({

        content: text,

        sender: sender

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


  noteInput.value = "";


  showStatus(
    "یادداشت آنلاین ذخیره شد ❤️☁️",
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


    /* Listen for login/logout */

    setupAuthListener();

  }
);
const VAPID_PUBLIC_KEY = "BO7EwkKI52w7GApI7qw0LVtj2yP6AaX7mbN6IRQbxe6w3qbOzdR7Rci45CEjuwkuHy19GVSwAx8ngAgyhLkjcHM";
/* ================= PUSH NOTIFICATIONS ================= */

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);

  return Uint8Array.from(
    [...rawData].map(char => char.charCodeAt(0))
  );
}


async function enableNotifications() {

  const button = getEl("notificationBtn");

  if (!button) {
    console.error("notificationBtn not found");
    return;
  }

  if (!currentUser) {
    alert("اول وارد حساب خودت شو ❤️");
    return;
  }

  if (!("Notification" in window)) {
    alert("این مرورگر از Notification پشتیبانی نمی‌کند.");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    alert("Service Worker در این مرورگر فعال نیست.");
    return;
  }

  if (!("PushManager" in window)) {
    alert("Push Notification در این مرورگر پشتیبانی نمی‌شود.");
    return;
  }

  try {

    button.disabled = true;
    button.textContent = "در حال فعال‌سازی...";

    /* 1. Ask notification permission */

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {

      button.disabled = false;
      button.textContent = "🔔 فعال کردن اعلان‌ها";

      alert("اجازه اعلان‌ها داده نشد.");

      return;
    }


    /* 2. Get Service Worker */

    const registration =
      await navigator.serviceWorker.ready;


    /* 3. Create Push Subscription */

    let subscription =
      await registration.pushManager.getSubscription();


    if (!subscription) {

      subscription =
        await registration.pushManager.subscribe({

          userVisibleOnly: true,

          applicationServerKey:
            urlBase64ToUint8Array(
              VAPID_PUBLIC_KEY
            )

        });

    }


    /* 4. Convert subscription */

    const subscriptionJson =
      subscription.toJSON();


    const endpoint =
      subscriptionJson.endpoint;

    const p256dh =
      subscriptionJson.keys?.p256dh;

    const auth =
      subscriptionJson.keys?.auth;


    if (!endpoint || !p256dh || !auth) {

      throw new Error(
        "Push subscription keys are missing."
      );

    }


    /* 5. Save subscription in Supabase */

    const { error } =
      await db
        .from("push_subscriptions")
        .upsert(
          {
            user_id: currentUser.id,
            endpoint: endpoint,
            p256dh: p256dh,
            auth: auth
          },
          {
            onConflict: "endpoint"
          }
        );


    if (error) {

      console.error(
        "Save push subscription error:",
        error
      );

      throw error;
    }


    /* 6. Success */

    button.disabled = false;

    button.textContent =
      "🔔 اعلان‌ها فعال هستند ❤️";

    showStatus(
      "اعلان‌ها با موفقیت فعال شدند ❤️🔔",
      true
    );

    console.log(
      "Push subscription saved successfully ❤️",
      subscriptionJson
    );


  } catch (error) {

    console.error(
      "Notification setup error:",
      error
    );

    button.disabled = false;

    button.textContent =
      "🔔 فعال کردن اعلان‌ها";

   alert(
  "خطای واقعی:\n\n" +
  (error?.message || String(error))
);

  }

}


/* ================= NOTIFICATION BUTTON ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const notificationButton =
      getEl("notificationBtn");

    if (notificationButton) {

      notificationButton.addEventListener(
        "click",
        enableNotifications
      );

    }

  }
);
