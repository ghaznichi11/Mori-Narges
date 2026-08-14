// ============================================================
// MORI × NARGES — Firebase-powered countdown + daily memories
// ============================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const FIREBASE_VERSION = "12.0.0";

const firebaseConfig = {
  apiKey: "AIzaSyAT16ui8k956Kth52UwZM0ojsba6uhaAEg",
  authDomain: "mori-narges.firebaseapp.com",
  projectId: "mori-narges",
  storageBucket: "mori-narges.firebasestorage.app",
  messagingSenderId: "383822912336",
  appId: "1:383822912336:web:f45a3693732b166debaa55",
  measurementId: "G-1YQ9H08EZW"
};

// Your two Firebase users
const MORI_UID = "ClAvSTSHHXQ0QdsnTmFoqFFYkr62";
const NARGES_UID = "kVkFDNF1o0ckYNsBmdvjMrc5i7k2";

// Flight / meeting countdown
const TARGET_DATE = new Date("2026-09-12T12:15:00+02:00");

let firebaseAuth = null;
let firestoreDb = null;
let currentUser = null;

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function getEl(id) {
  return document.getElementById(id);
}

function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUserName(uid) {
  if (uid === MORI_UID) return "Mori";
  if (uid === NARGES_UID) return "Narges";
  return "Unknown";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

// ------------------------------------------------------------
// Countdown
// ------------------------------------------------------------

function updateCountdown() {
  const now = Date.now();
  const target = TARGET_DATE.getTime();
  const distance = target - now;

  const daysEl = getEl("days");
  const hoursEl = getEl("hours");
  const minutesEl = getEl("minutes");
  const secondsEl = getEl("seconds");

  if (distance <= 0) {
    if (daysEl) daysEl.textContent = "0";
    if (hoursEl) hoursEl.textContent = "00";
    if (minutesEl) minutesEl.textContent = "00";
    if (secondsEl) secondsEl.textContent = "00";
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

  const dayNumber = getEl("dayNumber");

  if (dayNumber) {
    const start = new Date("2026-08-13T00:00:00+02:00").getTime();
    const total = target - start;
    const elapsed = Math.max(0, now - start);
    const daysPassed = Math.floor(elapsed / 86400000);

    const remainingDayNumber = Math.max(1, 30 - daysPassed);
    dayNumber.textContent = `Day ${remainingDayNumber}`;
  }
}

// ------------------------------------------------------------
// Login UI
// ------------------------------------------------------------

function createLoginPanel() {
  if (getEl("firebaseLoginPanel")) return;

  const todayCard = document.querySelector(".today");

  if (!todayCard) return;

  const panel = document.createElement("div");

  panel.id = "firebaseLoginPanel";

  panel.style.cssText = `
    margin-bottom:20px;
    padding:18px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.12);
    background:rgba(255,255,255,.04);
  `;

  panel.innerHTML = `
    <div style="font-size:12px;letter-spacing:.12em;color:#aaa;margin-bottom:8px;">
      PRIVATE ROOM 🔐
    </div>

    <div id="loginMessage" style="font-size:14px;color:#ddd;margin-bottom:14px;">
      برای نوشتن خاطره روزانه وارد حساب خودت شو ❤️
    </div>

    <div id="loginFormArea">
      <input
        id="loginEmail"
        type="email"
        placeholder="Email"
        autocomplete="email"
        style="
          width:100%;
          padding:12px;
          margin-bottom:8px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(0,0,0,.2);
          color:white;
        "
      >

      <input
        id="loginPassword"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
        style="
          width:100%;
          padding:12px;
          margin-bottom:10px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(0,0,0,.2);
          color:white;
        "
      >

      <button
        id="loginBtn"
        type="button"
        style="
          padding:11px 16px;
          border:0;
          border-radius:10px;
          cursor:pointer;
        "
      >
        ورود ❤️
      </button>
    </div>

    <div id="loggedInArea" style="display:none;">
      <span id="loggedInText"></span>
      <button
        id="logoutBtn"
        type="button"
        style="
          margin-right:10px;
          padding:8px 12px;
          border:1px solid rgba(255,255,255,.15);
          border-radius:9px;
          background:rgba(255,255,255,.06);
          color:white;
          cursor:pointer;
        "
      >
        خروج
      </button>
    </div>
  `;

  todayCard.prepend(panel);

  getEl("loginBtn").addEventListener("click", loginUser);
  getEl("logoutBtn").addEventListener("click", logoutUser);
}

async function loginUser() {
  const email = getEl("loginEmail")?.value.trim();
  const password = getEl("loginPassword")?.value;

  if (!email || !password) {
    showStatus("ایمیل و رمز را وارد کن.", false);
    return;
  }

  try {
    const { signInWithEmailAndPassword } = await import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
    );

    await signInWithEmailAndPassword(firebaseAuth, email, password);

    showStatus("ورود موفق بود ❤️");
  } catch (error) {
    console.error(error);

    showStatus(
      "ورود ناموفق بود. ایمیل یا رمز را بررسی کن.",
      false
    );
  }
}

async function logoutUser() {
  try {
    const { signOut } = await import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
    );

    await signOut(firebaseAuth);

    showStatus("از حساب خارج شدی.");
  } catch (error) {
    console.error(error);
  }
}

function updateLoginUI(user) {
  const formArea = getEl("loginFormArea");
  const loggedInArea = getEl("loggedInArea");
  const loggedInText = getEl("loggedInText");
  const loginMessage = getEl("loginMessage");

  if (!formArea || !loggedInArea) return;

  if (!user) {
    formArea.style.display = "block";
    loggedInArea.style.display = "none";
    loginMessage.textContent =
      "برای نوشتن خاطره روزانه وارد حساب خودت شو ❤️";

    return;
  }

  const name = getUserName(user.uid);

  formArea.style.display = "none";
  loggedInArea.style.display = "block";

  loggedInText.textContent =
    `وارد شدی به عنوان ${name} ❤️`;

  loginMessage.textContent =
    "حالا می‌توانی جواب خودت را برای خاطره امروز بنویسی.";
}

// ------------------------------------------------------------
// Firestore — Daily Memories
// ------------------------------------------------------------

async function findTodayMemory() {
  const {
    collection,
    query,
    where,
    getDocs
  } = await import(
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
  );

  const dateKey = formatDateKey();

  const memoriesRef = collection(
    firestoreDb,
    "daily_memories"
  );

  const q = query(
    memoriesRef,
    where("date", "==", dateKey)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0];
}

async function loadTodayMemory() {
  if (!currentUser) return;

  const noteInput = getEl("noteInput");

  if (!noteInput) return;

  try {
    const documentSnapshot = await findTodayMemory();

    if (!documentSnapshot) {
      noteInput.value = "";
      return;
    }

    const data = documentSnapshot.data();
    const fieldName =
      currentUser.uid === MORI_UID
        ? "moriAnswer"
        : "nargesAnswer";

    noteInput.value = data[fieldName] || "";

    updateArchive(data);
  } catch (error) {
    console.error(error);

    showStatus(
      "مشکلی در خواندن خاطره امروز پیش آمد.",
      false
    );
  }
}

function updateArchive(data) {
  const notesList = getEl("notesList");
  const noteCount = getEl("noteCount");

  if (!notesList) return;

  const mori = data?.moriAnswer || "";
  const narges = data?.nargesAnswer || "";

  let count = 0;

  if (mori) count++;
  if (narges) count++;

  if (noteCount) {
    noteCount.textContent =
      `${count} یادداشت`;
  }

  if (count === 0) {
    notesList.innerHTML = `
      <div class="empty">
        هنوز جوابی ثبت نشده… اولینش را بنویسید 🌙
      </div>
    `;
    return;
  }

  notesList.innerHTML = `
    ${
      mori
        ? `
      <div class="memory-item">
        <strong>Mori ❤️</strong>
        <p>${escapeHtml(mori)}</p>
      </div>
    `
        : ""
    }

    ${
      narges
        ? `
      <div class="memory-item">
        <strong>Narges ❤️</strong>
        <p>${escapeHtml(narges)}</p>
      </div>
    `
        : ""
    }
  `;
}

async function saveTodayMemory() {
  if (!currentUser) {
    showStatus(
      "اول وارد حساب خودت شو ❤️",
      false
    );
    return;
  }

  const noteInput = getEl("noteInput");

  if (!noteInput) return;

  const text = noteInput.value.trim();

  if (!text) {
    showStatus(
      "اول چیزی برای امروز بنویس ❤️",
      false
    );
    return;
  }

  const {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp
  } = await import(
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
  );

  const dateKey = formatDateKey();

  const memoriesRef = collection(
    firestoreDb,
    "daily_memories"
  );

  const q = query(
    memoriesRef,
    where("date", "==", dateKey)
  );

  const snapshot = await getDocs(q);

  const fieldName =
    currentUser.uid === MORI_UID
      ? "moriAnswer"
      : "nargesAnswer";

  try {
    if (snapshot.empty) {
      await setDoc(
        doc(memoriesRef),
        {
          date: dateKey,
          prompt:
            "What are you most looking forward to about seeing each other? ❤️",
          moriAnswer:
            fieldName === "moriAnswer" ? text : "",
          nargesAnswer:
            fieldName === "nargesAnswer" ? text : "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );
    } else {
      const existingDoc = snapshot.docs[0];

      await updateDoc(
        existingDoc.ref,
        {
          [fieldName]: text,
          updatedAt: serverTimestamp()
        }
      );
    }

    showStatus("یادداشت آنلاین ذخیره شد ❤️☁️");

    await loadTodayMemory();
  } catch (error) {
    console.error(error);

    showStatus(
      "ذخیره انجام نشد. دوباره امتحان کن.",
      false
    );
  }
}

// ------------------------------------------------------------
// Firebase initialization
// ------------------------------------------------------------

async function initializeFirebase() {
  try {
    const {
      initializeApp
    } = await import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
    );

    const {
      getAuth,
      onAuthStateChanged
    } = await import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
    );

    const {
      getFirestore
    } = await import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
    );

    const firebaseApp =
      initializeApp(firebaseConfig);

    firebaseAuth =
      getAuth(firebaseApp);

    firestoreDb =
      getFirestore(firebaseApp);

    onAuthStateChanged(
      firebaseAuth,
      async (user) => {
        currentUser = user || null;

        updateLoginUI(currentUser);

        if (currentUser) {
          if (
            currentUser.uid !== MORI_UID &&
            currentUser.uid !== NARGES_UID
          ) {
            showStatus(
              "این حساب برای این سایت مجاز نیست.",
              false
            );

            await logoutUser();
            return;
          }

          const userName =
            getUserName(currentUser.uid);

          const noteInput =
            getEl("noteInput");

          if (noteInput) {
            noteInput.placeholder =
              `امروز می‌خواهی چه چیزی برای ${
                userName === "Mori"
                  ? "نرگس"
                  : "مرتضی"
              } بنویسی؟ ❤️`;
          }

          await loadTodayMemory();
        }
      }
    );

  } catch (error) {
    console.error(error);

    showStatus(
      "اتصال به Firebase برقرار نشد.",
      false
    );
  }
}

// ------------------------------------------------------------
// Start app
// ------------------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {
    updateCountdown();

    setInterval(
      updateCountdown,
      1000
    );

    createLoginPanel();

    const saveButton =
      getEl("saveBtn");

    if (saveButton) {
      saveButton.addEventListener(
        "click",
        saveTodayMemory
      );
    }

    const yearEl =
      getEl("year");

    if (yearEl) {
      yearEl.textContent =
        new Date().getFullYear();
    }

    initializeFirebase();
  }
);
