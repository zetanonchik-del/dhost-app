const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Замените на постоянный домен вашего сервера
const API_BASE = "https://optimization-idle-contacts-developed.trycloudflare.com/api";

let allLessons = [];
let monthsMap = new Map();
let currentMonth = null;
let currentSelectedLesson = null;
let currentLang = "ru";

let currentVideoIdx = 0;
let currentPdfIdx = 0;
let currentZipIdx = 0;
let currentHwFileIdx = 0;
let activeTab = "hw";

// Локализация для 3 языков
const I18N = {
  ru: {
    module: "Модуль:",
    lesson: "Урок:",
    selectLesson: "Выберите урок...",
    modulePrefix: "Модуль",
    lessonPrefix: "Урок",
    searchPlaceholder: "Поиск урока по теме или слову...",
    notFound: "Ничего не найдено",
    tabHw: "📝 Домашка",
    tabPdf: "📄 Конспекты PDF",
    tabZip: "📦 Исходный код",
    noVideos: "Нет видео",
    videoBadge: "Видео",
    pdfBadge: "Конспект",
    zipBadge: "Архив",
    fileBadge: "Файл",
    openPdf: "👁 Открыть PDF",
    downloadZip: "📥 Скачать ZIP",
    openFile: "👁 Открыть файл",
    sendToChat: "💬 Отправить в чат",
    sending: "Отправка в чат...",
    sentSuccess: "✅ Файл отправлен в ваш диалог с ботом!",
    sentError: "Ошибка при отправке файла.",
    netError: "Сетевой сбой при отправке.",
    loadPdfError: "Не удалось загрузить PDF файл.",
    hwAttached: "📎 Прикрепленный файл:",
    pdfDocDesc: "Конспект урока в формате PDF: \"%s\". Нажмите «Открыть PDF», чтобы читать его прямо в приложении!",
    zipDocDesc: "Архив исходного кода проекта: \"%s\"."
  },
  uz: {
    module: "Modul:",
    lesson: "Dars:",
    selectLesson: "Darsni tanlang...",
    modulePrefix: "Modul",
    lessonPrefix: "Dars",
    searchPlaceholder: "Dars nomi yoki mavzusini qidiring...",
    notFound: "Hech narsa topilmadi",
    tabHw: "📝 Uyga vazifa",
    tabPdf: "📄 Taqdimotlar PDF",
    tabZip: "📦 Dars fayllari",
    noVideos: "Video mavjud emas",
    videoBadge: "Video",
    pdfBadge: "Taqdimot",
    zipBadge: "Arxiv",
    fileBadge: "Fayl",
    openPdf: "👁 PDF-ni ochish",
    downloadZip: "📥 ZIP-ni yuklash",
    openFile: "👁 Faylni ochish",
    sendToChat: "💬 Botga yuborish",
    sending: "Yuborilmoqda...",
    sentSuccess: "✅ Fayl botingizga yuborildi!",
    sentError: "Faylni yuborishda xatolik yuz berdi.",
    netError: "Tarmoq xatosi.",
    loadPdfError: "PDF faylini yuklab bo'lmadi.",
    hwAttached: "📎 Biriktirilgan fayl:",
    pdfDocDesc: "Dars taqdimoti (PDF): \"%s\". Uni bevosita ilova ichida o'qish uchun «PDF-ni ochish» tugmasini bosing!",
    zipDocDesc: "Dars kodlari arxivi: \"%s\"."
  },
  en: {
    module: "Module:",
    lesson: "Lesson:",
    selectLesson: "Select lesson...",
    modulePrefix: "Module",
    lessonPrefix: "Lesson",
    searchPlaceholder: "Search lesson by topic...",
    notFound: "Nothing found",
    tabHw: "📝 Homework",
    tabPdf: "📄 Slides PDF",
    tabZip: "📦 Source Code",
    noVideos: "No videos",
    videoBadge: "Video",
    pdfBadge: "Slide",
    zipBadge: "Archive",
    fileBadge: "File",
    openPdf: "👁 Open PDF",
    downloadZip: "📥 Download ZIP",
    openFile: "👁 Open File",
    sendToChat: "💬 Send to Chat",
    sending: "Sending to chat...",
    sentSuccess: "✅ File sent to your bot chat!",
    sentError: "Error sending file.",
    netError: "Network error.",
    loadPdfError: "Failed to load PDF file.",
    hwAttached: "📎 Attached file:",
    pdfDocDesc: "Lesson summary PDF: \"%s\". Click «Open PDF» to view it inside the app!",
    zipDocDesc: "Project source archive: \"%s\"."
  }
};

function t(key) {
  return I18N[currentLang]?.[key] || I18N.ru[key] || key;
}

// Элементы интерфейса
const lblModule = document.getElementById("lblModule");
const lblLesson = document.getElementById("lblLesson");
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

const tabHw = document.getElementById("tabHw");
const tabPdf = document.getElementById("tabPdf");
const tabZip = document.getElementById("tabZip");
const tabItems = document.querySelectorAll(".tab-item");

// PDF Modal
const pdfModal = document.getElementById("pdfModal");
const pdfModalTitle = document.getElementById("pdfModalTitle");
const closePdfModal = document.getElementById("closePdfModal");
const pdfPrevPage = document.getElementById("pdfPrevPage");
const pdfNextPage = document.getElementById("pdfNextPage");
const pdfPageNum = document.getElementById("pdfPageNum");
const pdfCanvas = document.getElementById("pdfCanvas");
const pdfLoading = document.getElementById("pdfLoading");

let currentPdfDoc = null;
let currentPdfPage = 1;

function notify(msg) {
  if (tg && tg.showAlert) {
    tg.showAlert(msg);
  } else {
    alert(msg);
  }
}

async function init() {
  // Синхронизируем язык с Telegram ботом
  const uid = tg?.initDataUnsafe?.user?.id;
  try {
    const langRes = await fetch(`${API_BASE}/user-lang?userId=${uid || ""}`);
    if (langRes.ok) {
      const langData = await langRes.json();
      if (langData.language && I18N[langData.language]) {
        currentLang = langData.language;
      }
    }
  } catch (e) {
    console.warn("Не удалось получить язык пользователя:", e);
  }

  applyLanguage();

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

function applyLanguage() {
  lblModule.textContent = t("module");
  lblLesson.textContent = t("lesson");
  selectedLessonText.textContent = t("selectLesson");
  liveSearchInput.placeholder = t("searchPlaceholder");
  tabHw.textContent = t("tabHw");
  tabPdf.textContent = t("tabPdf");
  tabZip.textContent = t("tabZip");
  sendActionBtn.textContent = t("sendToChat");
}

function renderMonthDropdown() {
  monthDropdownMenu.innerHTML = "";
  Array.from(monthsMap.keys()).sort((a, b) => a - b).forEach(m => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = `${t("modulePrefix")} ${m}`;
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
  selectedMonthText.textContent = `${t("modulePrefix")} ${m}`;
  renderLessonDropdown(m);
}

function renderLessonDropdown(m) {
  lessonDropdownMenu.innerHTML = "";
  const lessons = monthsMap.get(m) || [];

  lessons.forEach(l => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = `${t("lessonPrefix")} ${l.lessonNumber}: ${l.title}`;
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

  selectedLessonText.textContent = `${t("lessonPrefix")} ${lesson.lessonNumber}: ${lesson.title}`;
  lessonBadge.textContent = `${t("modulePrefix")} ${lesson.monthNumber} • ${t("lessonPrefix")} ${lesson.lessonNumber}`;
  lessonHeading.textContent = lesson.title;

  updateTabsVisibility(lesson);
  updateVideoControls();
  updateTabContent();
}

// Скрытие вкладок, если материалы отсутствуют
function updateTabsVisibility(lesson) {
  const hasHw = lesson.hasHw;
  const hasPdf = lesson.hasPdf;
  const hasZip = lesson.hasZip;

  tabHw.style.display = hasHw ? "block" : "none";
  tabPdf.style.display = hasPdf ? "block" : "none";
  tabZip.style.display = hasZip ? "block" : "none";

  // Если текущая вкладка скрыта — переключаемся на первую доступную
  if (activeTab === "hw" && !hasHw) {
    if (hasPdf) switchTab("pdf");
    else if (hasZip) switchTab("zip");
  } else if (activeTab === "pdf" && !hasPdf) {
    if (hasHw) switchTab("hw");
    else if (hasZip) switchTab("zip");
  } else if (activeTab === "zip" && !hasZip) {
    if (hasHw) switchTab("hw");
    else if (hasPdf) switchTab("pdf");
  }
}

function updateVideoControls() {
  const videos = currentSelectedLesson?.videos || [];
  if (videos.length === 0) {
    videoPlayer.removeAttribute("src");
    videoPlayer.load();
    videoPartTitle.textContent = t("noVideos");
    prevVideoBtn.disabled = true;
    nextVideoBtn.disabled = true;
    return;
  }

  prevVideoBtn.disabled = (currentVideoIdx === 0);
  nextVideoBtn.disabled = (currentVideoIdx === videos.length - 1);
  videoPartTitle.textContent = `${t("videoBadge")}: ${currentVideoIdx + 1}/${videos.length}`;

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
      fileTitleHeader.textContent = `${t("hwAttached")} ${curHw.title}`;
      subPartTitle.textContent = `${t("fileBadge")} ${currentHwFileIdx + 1}/${hwList.length}`;
      prevSubPartBtn.disabled = (currentHwFileIdx === 0);
      nextSubPartBtn.disabled = (currentHwFileIdx === hwList.length - 1);
      openDirectBtn.style.display = "block";
      openDirectBtn.textContent = curHw.title.toLowerCase().endsWith(".pdf") ? t("openPdf") : t("openFile");
      sendActionBtn.style.display = "block";
    } else {
      fileTitleHeader.textContent = "";
      openDirectBtn.style.display = "none";
      sendActionBtn.style.display = "none";
    }

    mainContentBox.textContent = l.homeworkText ? l.homeworkText : "";
  } 
  else if (activeTab === "pdf") {
    const pdfs = l.pdfs || [];
    const hasPdfs = pdfs.length > 0;
    subPartsBar.style.display = (pdfs.length > 1) ? "flex" : "none";

    if (hasPdfs) {
      const curPdf = pdfs[currentPdfIdx] || pdfs[0];
      fileTitleHeader.textContent = `📄 ${curPdf.title}`;
      subPartTitle.textContent = `${t("pdfBadge")} ${currentPdfIdx + 1}/${pdfs.length}`;
      prevSubPartBtn.disabled = (currentPdfIdx === 0);
      nextSubPartBtn.disabled = (currentPdfIdx === pdfs.length - 1);
      mainContentBox.textContent = t("pdfDocDesc").replace("%s", curPdf.title);
      openDirectBtn.style.display = "block";
      openDirectBtn.textContent = t("openPdf");
      sendActionBtn.style.display = "block";
    }
  } 
  else if (activeTab === "zip") {
    const zips = l.zips || [];
    const hasZips = zips.length > 0;
    subPartsBar.style.display = (zips.length > 1) ? "flex" : "none";

    if (hasZips) {
      const curZip = zips[currentZipIdx] || zips[0];
      fileTitleHeader.textContent = `📦 ${curZip.title}`;
      subPartTitle.textContent = `${t("zipBadge")} ${currentZipIdx + 1}/${zips.length}`;
      prevSubPartBtn.disabled = (currentZipIdx === 0);
      nextSubPartBtn.disabled = (currentZipIdx === zips.length - 1);
      mainContentBox.textContent = t("zipDocDesc").replace("%s", curZip.title);
      openDirectBtn.style.display = "block";
      openDirectBtn.textContent = t("downloadZip");
      sendActionBtn.style.display = "block";
    }
  }
}

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

// Открытие файла: PDF рендерится внутри WebApp
openDirectBtn.onclick = () => {
  const l = currentSelectedLesson;
  if (!l) return;
  let fileObj = null;

  if (activeTab === "hw") fileObj = l.hwFiles?.[currentHwFileIdx];
  if (activeTab === "pdf") fileObj = l.pdfs?.[currentPdfIdx];
  if (activeTab === "zip") fileObj = l.zips?.[currentZipIdx];

  if (!fileObj) return;

  if (fileObj.isVideo) {
    videoPlayer.src = `${API_BASE}/video/stream/${fileObj.id}`;
    videoPlayer.load();
    videoPlayer.play();
    videoPartTitle.textContent = `ДЗ Видео: ${fileObj.title}`;
    return;
  }

  const isPdf = activeTab === "pdf" || fileObj.title.toLowerCase().endsWith(".pdf");
  const url = `${API_BASE}/file/view/${fileObj.id}`;

  if (isPdf) {
    openEmbeddedPdf(url, fileObj.title);
  } else {
    // Архивы ZIP скачиваем через браузер
    if (tg && tg.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, "_blank");
    }
  }
};

// Логика встроенного просмотра PDF (PDF.js)
async function openEmbeddedPdf(pdfUrl, title) {
  pdfModal.style.display = "flex";
  pdfModalTitle.textContent = title;
  pdfLoading.style.display = "block";
  pdfCanvas.style.display = "none";

  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    currentPdfDoc = await loadingTask.promise;
    currentPdfPage = 1;
    renderPdfPage(currentPdfPage);
  } catch (err) {
    console.error("Ошибка загрузки PDF:", err);
    pdfLoading.textContent = t("loadPdfError");
  }
}

async function renderPdfPage(num) {
  if (!currentPdfDoc) return;
  pdfLoading.style.display = "none";
  pdfCanvas.style.display = "block";

  const page = await currentPdfDoc.getPage(num);
  const containerWidth = document.getElementById("pdfCanvasContainer").clientWidth - 20;
  const viewportUnscaled = page.getViewport({ scale: 1.0 });
  const scale = containerWidth / viewportUnscaled.width;
  const viewport = page.getViewport({ scale: Math.max(scale, 1.2) });

  const context = pdfCanvas.getContext("2d");
  pdfCanvas.height = viewport.height;
  pdfCanvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  await page.render(renderContext).promise;

  pdfPageNum.textContent = `${num} / ${currentPdfDoc.numPages}`;
  pdfPrevPage.disabled = (num <= 1);
  pdfNextPage.disabled = (num >= currentPdfDoc.numPages);
}

pdfPrevPage.onclick = () => {
  if (currentPdfPage > 1) {
    currentPdfPage--;
    renderPdfPage(currentPdfPage);
  }
};

nextSubPartBtn.onclick = () => {
  if (currentPdfDoc && currentPdfPage < currentPdfDoc.numPages) {
    currentPdfPage++;
    renderPdfPage(currentPdfPage);
  }
};

closePdfModal.onclick = () => {
  pdfModal.style.display = "none";
  currentPdfDoc = null;
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
  sendActionBtn.textContent = t("sending");

  try {
    const res = await fetch(`${API_BASE}/send-to-chat?userId=${uid}&fileId=${fileId}`, { method: "POST" });
    if (res.ok) {
      notify(t("sentSuccess"));
    } else {
      notify(t("sentError"));
    }
  } catch (e) {
    notify(t("netError"));
  } finally {
    sendActionBtn.disabled = false;
    sendActionBtn.textContent = oldText;
  }
};

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
    .map(l => ({ lesson: l, score: fuzzyMatch(query, `${l.title} ${t("lessonPrefix")} ${l.lessonNumber} ${t("modulePrefix")} ${l.monthNumber}`) }))
    .filter(item => item.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (results.length === 0) {
    searchResults.innerHTML = `<div class="search-item"><span class="search-item-title">${t("notFound")}</span></div>`;
    searchResults.style.display = "block";
    return;
  }

  searchResults.innerHTML = "";
  results.forEach(({ lesson }) => {
    const div = document.createElement("div");
    div.className = "search-item";
    div.innerHTML = `
      <span class="search-item-title">${t("lessonPrefix")} ${lesson.lessonNumber}: ${lesson.title}</span>
      <span class="search-item-sub">${t("modulePrefix")} ${lesson.monthNumber}</span>
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
