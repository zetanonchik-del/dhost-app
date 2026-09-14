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
let currentPdfIdx = 0;
let currentZipIdx = 0;
let currentHwFileIdx = 0;
let activeTab = "hw";

// DOM
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
const videoPartTitle = document.getElementById("videoPartTitle");
const prevVideoBtn = document.getElementById("prevVideoBtn");
const nextVideoBtn = document.getElementById("nextVideoBtn");

const lessonBadge = document.getElementById("lessonBadge");
const lessonHeading = document.getElementById("lessonHeading");

const subPartsBar = document.getElementById("subPartsBar");
const prevSubPartBtn = document.getElementById("prevSubPartBtn");
const nextSubPartBtn = document.getElementById("nextSubPartBtn");
const subPartTitle = document.getElementById("subPartTitle");

const fileTitleHeader = document.getElementById("fileTitleHeader");
const mainContentBox = document.getElementById("mainContentBox");
const sendActionBtn = document.getElementById("sendActionBtn");
const openDirectBtn = document.getElementById("openDirectBtn");

const tabItems = document.querySelectorAll(".tab-item");

function notify(msg) {
  if (tg && tg.showAlert) {
    tg.showAlert(msg);
  } else {
    alert(msg);
  }
}

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

function selectLesson(lesson) {
  currentSelectedLesson = lesson;
  currentVideoIdx = 0;
  currentPdfIdx = 0;
  currentZipIdx = 0;
  currentHwFileIdx = 0;

  if (currentMonth !== lesson.monthNumber) {
    selectMonth(lesson.monthNumber);
  }

  selectedLessonText.textContent = `Урок ${lesson.lessonNumber}: ${lesson.title}`;
  lessonBadge.textContent = `Модуль ${lesson.monthNumber} • Урок ${lesson.lessonNumber}`;
  lessonHeading.textContent = lesson.title;

  updateVideoControls();
  updateTabContent();
}

function updateVideoControls() {
  const videos = currentSelectedLesson?.videos || [];
  if (videos.length === 0) {
    videoPlayer.removeAttribute("src");
    videoPlayer.load();
    videoPartTitle.textContent = "Нет видео";
    prevVideoBtn.disabled = true;
    nextVideoBtn.disabled = true;
    return;
  }

  prevVideoBtn.disabled = (currentVideoIdx === 0);
  nextVideoBtn.disabled = (currentVideoIdx === videos.length - 1);
  videoPartTitle.textContent = `Видео: ${currentVideoIdx + 1}/${videos.length}`;

  const v = videos[currentVideoIdx];
  videoPlayer.src = `${API_BASE}/video/stream/${v.id}`;
  videoPlayer.load();
}

prevVideoBtn.onclick = () => {
  if (currentVideoIdx > 0) {
    currentVideoIdx--;
    updateVideoControls();
  }
};

nextVideoBtn.onclick = () => {
  const vids = currentSelectedLesson?.videos || [];
  if (currentVideoIdx < vids.length - 1) {
    currentVideoIdx++;
    updateVideoControls();
  }
};

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
    const hwList = l.hwFiles || [];
    const hasMultiple = hwList.length > 1;
    subPartsBar.style.display = hasMultiple ? "flex" : "none";

    if (hwList.length > 0) {
      const curHw = hwList[currentHwFileIdx] || hwList[0];
      fileTitleHeader.textContent = `📎 Прикрепленный файл: ${curHw.title}`;
      subPartTitle.textContent = `Файл ${currentHwFileIdx + 1}/${hwList.length}`;
      prevSubPartBtn.disabled = (currentHwFileIdx === 0);
      nextSubPartBtn.disabled = (currentHwFileIdx === hwList.length - 1);
      openDirectBtn.style.display = "block";
      sendActionBtn.style.display = "block";
    } else {
      fileTitleHeader.textContent = "";
      openDirectBtn.style.display = "none";
      sendActionBtn.style.display = "none";
    }

    mainContentBox.textContent = l.homeworkText ? l.homeworkText : "Письменное задание отсутствует.";
  } 
  else if (activeTab === "pdf") {
    const pdfs = l.pdfs || [];
    const hasPdfs = pdfs.length > 0;
    subPartsBar.style.display = (pdfs.length > 1) ? "flex" : "none";

    if (hasPdfs) {
      const curPdf = pdfs[currentPdfIdx] || pdfs[0];
      fileTitleHeader.textContent = `📄 ${curPdf.title}`;
      subPartTitle.textContent = `Конспект ${currentPdfIdx + 1}/${pdfs.length}`;
      prevSubPartBtn.disabled = (currentPdfIdx === 0);
      nextSubPartBtn.disabled = (currentPdfIdx === pdfs.length - 1);
      mainContentBox.textContent = `Конспект урока в формате PDF: "${curPdf.title}". Нажмите «Открыть файл», чтобы читать его прямо в приложении!`;
      openDirectBtn.style.display = "block";
      openDirectBtn.textContent = "👁 Открыть PDF";
      sendActionBtn.style.display = "block";
    } else {
      fileTitleHeader.textContent = "";
      mainContentBox.textContent = "Конспекты к данному уроку не прикреплены.";
      openDirectBtn.style.display = "none";
      sendActionBtn.style.display = "none";
    }
  } 
  else if (activeTab === "zip") {
    const zips = l.zips || [];
    const hasZips = zips.length > 0;
    subPartsBar.style.display = (zips.length > 1) ? "flex" : "none";

    if (hasZips) {
      const curZip = zips[currentZipIdx] || zips[0];
      fileTitleHeader.textContent = `📦 ${curZip.title}`;
      subPartTitle.textContent = `Архив ${currentZipIdx + 1}/${zips.length}`;
      prevSubPartBtn.disabled = (currentZipIdx === 0);
      nextSubPartBtn.disabled = (currentZipIdx === zips.length - 1);
      mainContentBox.textContent = `Архив исходного кода проекта: "${curZip.title}".`;
      openDirectBtn.style.display = "block";
      openDirectBtn.textContent = "📥 Скачать ZIP";
      sendActionBtn.style.display = "block";
    } else {
      fileTitleHeader.textContent = "";
      mainContentBox.textContent = "Архивы исходного кода к данному уроку не прикреплены.";
      openDirectBtn.style.display = "none";
      sendActionBtn.style.display = "none";
    }
  }
}

// Перелистывание файлов текущей вкладки (1/N)
prevSubPartBtn.onclick = () => {
  if (activeTab === "hw" && currentHwFileIdx > 0) currentHwFileIdx--;
  if (activeTab === "pdf" && currentPdfIdx > 0) currentPdfIdx--;
  if (activeTab === "zip" && currentZipIdx > 0) currentZipIdx--;
  updateTabContent();
};

nextSubPartBtn.onclick = () => {
  const l = currentSelectedLesson;
  if (!l) return;
  if (activeTab === "hw" && currentHwFileIdx < (l.hwFiles?.length || 0) - 1) currentHwFileIdx++;
  if (activeTab === "pdf" && currentPdfIdx < (l.pdfs?.length || 0) - 1) currentPdfIdx++;
  if (activeTab === "zip" && currentZipIdx < (l.zips?.length || 0) - 1) currentZipIdx++;
  updateTabContent();
};

// Открытие файла прямо в приложении / браузере
openDirectBtn.onclick = () => {
  const l = currentSelectedLesson;
  if (!l) return;
  let fileObj = null;

  if (activeTab === "hw") fileObj = l.hwFiles?.[currentHwFileIdx];
  if (activeTab === "pdf") fileObj = l.pdfs?.[currentPdfIdx];
  if (activeTab === "zip") fileObj = l.zips?.[currentZipIdx];

  if (!fileObj) return;

  // Если это видео из домашки - включаем его в плеере!
  if (fileObj.isVideo) {
    videoPlayer.src = `${API_BASE}/video/stream/${fileObj.id}`;
    videoPlayer.load();
    videoPlayer.play();
    videoPartTitle.textContent = `ДЗ Видео: ${fileObj.title}`;
    notify("Видео из ДЗ загружено в плеер выше ⬆️");
    return;
  }

  const url = `${API_BASE}/file/view/${fileObj.id}`;
  if (tg && tg.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, "_blank");
  }
};

// Отправка файла в Telegram-чат
sendActionBtn.onclick = async () => {
  const l = currentSelectedLesson;
  if (!l) return;
  let fileId = null;

  if (activeTab === "hw") fileId = l.hwFiles?.[currentHwFileIdx]?.id;
  if (activeTab === "pdf") fileId = l.pdfs?.[currentPdfIdx]?.id;
  if (activeTab === "zip") fileId = l.zips?.[currentZipIdx]?.id;

  if (!fileId) return;

  const uid = tg?.initDataUnsafe?.user?.id;
  if (!uid) {
    notify("Откройте приложение внутри Telegram.");
    return;
  }

  sendActionBtn.disabled = true;
  const oldText = sendActionBtn.textContent;
  sendActionBtn.textContent = "Отправка в чат...";

  try {
    const res = await fetch(`${API_BASE}/send-to-chat?userId=${uid}&fileId=${fileId}`, { method: "POST" });
    if (res.ok) {
      notify("✅ Файл отправлен в ваш диалог с ботом!");
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

// Меню селекторов
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

// Живой поиск
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

init();




