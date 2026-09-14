const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const API_BASE = "https://optimization-idle-contacts-developed.trycloudflare.com/api";

let allLessons = [];
let monthsMap = new Map();
let currentMonth = null;
let currentSelectedLesson = null;
let currentVideoIdx = 0;
let currentActiveVideoId = null;
let activeTab = "hw";

// Элементы
const monthDropdownBtn = document.getElementById("monthDropdownBtn");
const selectedMonthText = document.getElementById("selectedMonthText");
const monthDropdownMenu = document.getElementById("monthDropdownMenu");

const lessonDropdownBtn = document.getElementById("lessonDropdownBtn");
const selectedLessonText = document.getElementById("selectedLessonText");
const lessonDropdownMenu = document.getElementById("lessonDropdownMenu");

const liveSearchInput = document.getElementById("liveSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchResults = document.getElementById("searchResults");

const videoPlayer = document.getElementById("videoPlayer");
const partTitle = document.getElementById("partTitle");
const prevPartBtn = document.getElementById("prevPartBtn");
const nextPartBtn = document.getElementById("nextPartBtn");

const lessonBadge = document.getElementById("lessonBadge");
const lessonHeading = document.getElementById("lessonHeading");
const hwContent = document.getElementById("hwContent");
const sendActionBtn = document.getElementById("sendActionBtn");
const tabItems = document.querySelectorAll(".tab-item");

function notify(msg) {
  if (tg && tg.showAlert) {
    tg.showAlert(msg);
  } else {
    alert(msg);
  }
}

// 1. Инициализация
async function init() {
  try {
    const res = await fetch(`${API_BASE}/lessons`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    allLessons = await res.json();

    allLessons.sort((a, b) => {
      if (a.monthNumber !== b.monthNumber) return a.monthNumber - b.monthNumber;
      return a.lessonNumber - b.lessonNumber;
    });

    monthsMap.clear();
    allLessons.forEach(l => {
      const m = l.monthNumber || 1;
      if (!monthsMap.has(m)) monthsMap.set(m, []);
      monthsMap.get(m).push(l);
    });

    renderMonthDropdown();

    if (monthsMap.size > 0) {
      const firstMonth = Array.from(monthsMap.keys()).sort((a, b) => a - b)[0];
      selectMonth(firstMonth);
      const list = monthsMap.get(firstMonth);
      if (list && list.length > 0) {
        selectLesson(list[0]);
      }
    }
  } catch (err) {
    console.error("Ошибка загрузки:", err);
    lessonHeading.textContent = "Не удалось подключиться к серверу API";
  }
}

// 2. Дропдаун Модулей
function renderMonthDropdown() {
  monthDropdownMenu.innerHTML = "";
  Array.from(monthsMap.keys()).sort((a, b) => a - b).forEach(m => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = `Модуль ${m}`;
    item.onclick = (e) => {
      e.stopPropagation();
      selectMonth(m);
      monthDropdownMenu.classList.remove("open");
      const list = monthsMap.get(m) || [];
      if (list.length > 0) selectLesson(list[0]);
    };
    monthDropdownMenu.appendChild(item);
  });
}

function selectMonth(m) {
  currentMonth = m;
  selectedMonthText.textContent = `Модуль ${m}`;
  renderLessonDropdown(m);
}

// 3. Дропдаун Уроков
function renderLessonDropdown(m) {
  lessonDropdownMenu.innerHTML = "";
  const lessons = monthsMap.get(m) || [];

  lessons.forEach(l => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = `Урок ${l.lessonNumber}: ${l.title}`;
    item.onclick = (e) => {
      e.stopPropagation();
      selectLesson(l);
      lessonDropdownMenu.classList.remove("open");
    };
    lessonDropdownMenu.appendChild(item);
  });
}

// 4. Выбор урока
function selectLesson(lesson) {
  currentSelectedLesson = lesson;
  currentVideoIdx = 0;

  if (currentMonth !== lesson.monthNumber) {
    selectMonth(lesson.monthNumber);
  }

  selectedLessonText.textContent = `Урок ${lesson.lessonNumber}: ${lesson.title}`;
  lessonBadge.textContent = `Модуль ${lesson.monthNumber} • Урок ${lesson.lessonNumber}`;
  lessonHeading.textContent = lesson.title;

  // Видимость вкладок
  const tabPdf = document.querySelector('[data-tab="pdf"]');
  const tabZip = document.querySelector('[data-tab="zip"]');
  if (tabPdf) tabPdf.style.display = lesson.hasPdf ? "inline-block" : "none";
  if (tabZip) tabZip.style.display = lesson.hasZip ? "inline-block" : "none";

  if ((activeTab === "pdf" && !lesson.hasPdf) || (activeTab === "zip" && !lesson.hasZip)) {
    switchTab("hw");
  } else {
    updateTabContent();
  }

  updateVideoPlayer(lesson);
}

// 5. Плеер видео
function updateVideoPlayer(lesson) {
  const videos = lesson.videos || [];
  if (videos.length === 0) {
    videoPlayer.removeAttribute("src");
    videoPlayer.load();
    partTitle.textContent = "Нет видео";
    prevPartBtn.style.display = "none";
    nextPartBtn.style.display = "none";
    currentActiveVideoId = null;
    return;
  }

  if (videos.length > 1) {
    prevPartBtn.style.display = "inline-block";
    nextPartBtn.style.display = "inline-block";
    prevPartBtn.disabled = (currentVideoIdx === 0);
    nextPartBtn.disabled = (currentVideoIdx === videos.length - 1);
  } else {
    prevPartBtn.style.display = "none";
    nextPartBtn.style.display = "none";
  }

  partTitle.textContent = `Часть ${currentVideoIdx + 1}/${videos.length}`;
  const v = videos[currentVideoIdx];
  currentActiveVideoId = v.id;

  videoPlayer.src = `${API_BASE}/video/stream/${v.id}`;
  videoPlayer.load();
}

prevPartBtn.onclick = () => {
  if (currentVideoIdx > 0) {
    currentVideoIdx--;
    updateVideoPlayer(currentSelectedLesson);
  }
};

nextPartBtn.onclick = () => {
  const vids = currentSelectedLesson?.videos || [];
  if (currentVideoIdx < vids.length - 1) {
    currentVideoIdx++;
    updateVideoPlayer(currentSelectedLesson);
  }
};

// 6. Управление кликами меню
monthDropdownBtn.onclick = (e) => {
  e.stopPropagation();
  lessonDropdownMenu.classList.remove("open");
  monthDropdownMenu.classList.toggle("open");
};

lessonDropdownBtn.onclick = (e) => {
  e.stopPropagation();
  monthDropdownMenu.classList.remove("open");
  lessonDropdownMenu.classList.toggle("open");
};

document.addEventListener("click", () => {
  monthDropdownMenu.classList.remove("open");
  lessonDropdownMenu.classList.remove("open");
  searchResults.style.display = "none";
});

// 7. Вкладки
function switchTab(name) {
  activeTab = name;
  tabItems.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  updateTabContent();
}

tabItems.forEach(item => {
  item.onclick = () => switchTab(item.dataset.tab);
});

function updateTabContent() {
  if (!currentSelectedLesson) return;
  const l = currentSelectedLesson;

  if (activeTab === "hw") {
    hwContent.textContent = l.homeworkText ? l.homeworkText : "Письменное задание к этому уроку отсутствует.";
    if (l.hwFileId) {
      sendActionBtn.style.display = "block";
      sendActionBtn.textContent = "💬 Отправить файл ДЗ в чат";
      sendActionBtn.className = "action-btn btn-blue";
    } else {
      sendActionBtn.style.display = "none";
    }
  } else if (activeTab === "pdf") {
    hwContent.textContent = "📄 Конспект и методические слайды (PDF к уроку).";
    sendActionBtn.style.display = l.hasPdf ? "block" : "none";
    sendActionBtn.textContent = "📄 Отправить PDF в чат";
    sendActionBtn.className = "action-btn btn-red";
  } else if (activeTab === "zip") {
    hwContent.textContent = "📦 Архив исходного кода и готовых проектов (.ZIP).";
    sendActionBtn.style.display = l.hasZip ? "block" : "none";
    sendActionBtn.textContent = "📦 Отправить ZIP в чат";
    sendActionBtn.className = "action-btn btn-green";
  }
}

// 8. Отправка файла в Telegram
sendActionBtn.onclick = async () => {
  if (!currentSelectedLesson) return;
  let fileId = null;

  if (activeTab === "hw") fileId = currentSelectedLesson.hwFileId;
  if (activeTab === "pdf") fileId = currentSelectedLesson.pdfId;
  if (activeTab === "zip") fileId = currentSelectedLesson.zipId;

  if (!fileId) return;

  const uid = tg?.initDataUnsafe?.user?.id;
  if (!uid) {
    notify("Откройте приложение внутри Telegram, чтобы бот отправил файл в ваш диалог.");
    return;
  }

  sendActionBtn.disabled = true;
  const oldText = sendActionBtn.textContent;
  sendActionBtn.textContent = "Отправка в диалог...";

  try {
    const res = await fetch(`${API_BASE}/send-to-chat?userId=${uid}&fileId=${fileId}`, { method: "POST" });
    if (res.ok) {
      notify("✅ Файл отправлен в чат с ботом!");
    } else {
      notify("Ошибка при отправке файла.");
    }
  } catch (e) {
    notify("Сетевой сбой при отправке.");
  } finally {
    sendActionBtn.disabled = false;
    sendActionBtn.textContent = oldText;
  }
};

// 9. Живой поиск в реальном времени с поддержкой опечаток (Fuzzy)
function fuzzyMatch(pattern, str) {
  pattern = pattern.toLowerCase().trim();
  str = str.toLowerCase();
  if (!pattern) return 1.0;
  if (str.includes(pattern)) return 0.95;

  let pIdx = 0;
  let score = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === pattern[pIdx]) {
      score++;
      pIdx++;
      if (pIdx === pattern.length) break;
    }
  }
  return score / pattern.length;
}

liveSearchInput.oninput = (e) => {
  const query = e.target.value;
  clearSearchBtn.style.display = query ? "block" : "none";

  if (!query || query.trim().length < 2) {
    searchResults.style.display = "none";
    searchResults.innerHTML = "";
    return;
  }

  const results = allLessons
    .map(l => ({ lesson: l, score: fuzzyMatch(query, `${l.title} урок ${l.lessonNumber} модуль ${l.monthNumber}`) }))
    .filter(item => item.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (results.length === 0) {
    searchResults.innerHTML = `<div class="search-item"><span class="search-item-title">Ничего не найдено</span></div>`;
    searchResults.style.display = "block";
    return;
  }

  searchResults.innerHTML = "";
  results.forEach(({ lesson }) => {
    const div = document.createElement("div");
    div.className = "search-item";
    div.innerHTML = `
      <span class="search-item-title">Урок ${lesson.lessonNumber}: ${lesson.title}</span>
      <span class="search-item-sub">Модуль ${lesson.monthNumber}</span>
    `;
    div.onclick = (ev) => {
      ev.stopPropagation();
      selectLesson(lesson);
      searchResults.style.display = "none";
      liveSearchInput.value = "";
      clearSearchBtn.style.display = "none";
    };
    searchResults.appendChild(div);
  });
  searchResults.style.display = "block";
};

clearSearchBtn.onclick = () => {
  liveSearchInput.value = "";
  clearSearchBtn.style.display = "none";
  searchResults.style.display = "none";
};

window.addEventListener("pagehide", () => {
  if (currentActiveVideoId) {
    navigator.sendBeacon(`${API_BASE}/video/cleanup?fileId=${currentActiveVideoId}`);
  }
});

init();
