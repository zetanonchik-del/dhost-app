const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Ваш актуальный URL туннеля
const API_BASE = "https://optimization-idle-contacts-developed.trycloudflare.com/api";

let lessonsData = [];
let currentLessonIdx = 0;
let currentVideoIdx = 0;
let activeTab = "hw";

// Элементы интерфейса
const lessonPicker = document.getElementById("lessonPicker");
const videoPlayer = document.getElementById("videoPlayer");
const lessonHeading = document.getElementById("lessonHeading");
const hwContent = document.getElementById("hwContent");
const partTitle = document.getElementById("partTitle");
const prevPartBtn = document.getElementById("prevPartBtn");
const nextPartBtn = document.getElementById("nextPartBtn");
const sendActionBtn = document.getElementById("sendActionBtn") || document.querySelector(".action-btn");

// Вкладки
const tabHw = document.querySelector('[data-tab="hw"]');
const tabPdf = document.querySelector('[data-tab="pdf"]');
const tabZip = document.querySelector('[data-tab="zip"]');

// Универсальное красивое уведомление без адреса сайта
function showMessage(text) {
  if (tg && tg.showAlert) {
    tg.showAlert(text);
  } else {
    // Если открыто в обычном браузере без Telegram
    console.log(text);
  }
}

// Инициализация данных
async function init() {
  try {
    const res = await fetch(`${API_BASE}/lessons`);
    if (!res.ok) throw new Error("Ошибка загрузки");
    lessonsData = await res.json();

    lessonPicker.innerHTML = "";
    lessonsData.forEach((l, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `Урок ${l.lessonNumber}: ${l.title}`;
      lessonPicker.appendChild(opt);
    });

    lessonPicker.addEventListener("change", (e) => {
      selectLesson(parseInt(e.target.value, 10));
    });

    if (lessonsData.length > 0) {
      selectLesson(0);
    }
  } catch (err) {
    console.error(err);
    if (lessonHeading) lessonHeading.textContent = "Ошибка загрузки данных с сервера";
  }
}

// Выбор урока
function selectLesson(idx) {
  currentLessonIdx = idx;
  currentVideoIdx = 0;
  const lesson = lessonsData[idx];

  lessonHeading.textContent = `Урок ${lesson.lessonNumber}. ${lesson.title}`;

  // 1. Управление вкладками: скрываем, если файлов нет
  if (tabPdf) tabPdf.style.display = lesson.hasPdf ? "inline-flex" : "none";
  if (tabZip) tabZip.style.display = lesson.hasZip ? "inline-flex" : "none";

  // Если были на вкладке, которой нет у этого урока, переходим на Домашку
  if ((activeTab === "pdf" && !lesson.hasPdf) || (activeTab === "zip" && !lesson.hasZip)) {
    switchTab("hw");
  } else {
    updateTabContent();
  }

  // 2. Управление частями видео
  updateVideoControls(lesson);
}

// Обновление контролов видео
function updateVideoControls(lesson) {
  const videos = lesson.videos || [];
  if (videos.length === 0) {
    videoPlayer.removeAttribute("src");
    videoPlayer.poster = "";
    partTitle.textContent = "Нет видео";
    prevPartBtn.style.display = "none";
    nextPartBtn.style.display = "none";
    return;
  }

  // Показываем кнопки переключения, только если частей больше 1
  if (videos.length > 1) {
    prevPartBtn.style.display = "inline-block";
    nextPartBtn.style.display = "inline-block";
    prevPartBtn.disabled = currentVideoIdx === 0;
    nextPartBtn.disabled = currentVideoIdx === videos.length - 1;
  } else {
    prevPartBtn.style.display = "none";
    nextPartBtn.style.display = "none";
  }

  partTitle.textContent = `Часть ${currentVideoIdx + 1}/${videos.length}`;
  const v = videos[currentVideoIdx];
  videoPlayer.src = `${API_BASE}/video/stream/${v.id}`;
}

// Переключение частей видео
if (prevPartBtn) {
  prevPartBtn.onclick = () => {
    if (currentVideoIdx > 0) {
      currentVideoIdx--;
      updateVideoControls(lessonsData[currentLessonIdx]);
    }
  };
}

if (nextPartBtn) {
  nextPartBtn.onclick = () => {
    const vids = lessonsData[currentLessonIdx].videos || [];
    if (currentVideoIdx < vids.length - 1) {
      currentVideoIdx++;
      updateVideoControls(lessonsData[currentLessonIdx]);
    }
  };
}

// Переключение вкладок
function switchTab(tabName) {
  activeTab = tabName;
  [tabHw, tabPdf, tabZip].forEach(t => t && t.classList.remove("active"));
  
  if (tabName === "hw" && tabHw) tabHw.classList.add("active");
  if (tabName === "pdf" && tabPdf) tabPdf.classList.add("active");
  if (tabName === "zip" && tabZip) tabZip.classList.add("active");

  updateTabContent();
}

// Отображение контента и кнопки действия
function updateTabContent() {
  const lesson = lessonsData[currentLessonIdx];
  if (!lesson) return;

  if (activeTab === "hw") {
    hwContent.textContent = lesson.homeworkText ? lesson.homeworkText : "Письменное задание к этому уроку отсутствует.";
    
    // Скрываем кнопку, если к домашке не прикреплен файл
    if (sendActionBtn) {
      if (lesson.hwFileId) {
        sendActionBtn.style.display = "block";
        sendActionBtn.textContent = "💬 Отправить файл ДЗ в чат";
        sendActionBtn.className = "action-btn btn-blue";
      } else {
        sendActionBtn.style.display = "none"; // Нет файла - нет кнопки!
      }
    }
  } else if (activeTab === "pdf") {
    hwContent.textContent = "Конспект урока в формате PDF.";
    if (sendActionBtn) {
      sendActionBtn.style.display = lesson.hasPdf ? "block" : "none";
      sendActionBtn.textContent = "📄 Отправить PDF в чат";
      sendActionBtn.className = "action-btn btn-red";
    }
  } else if (activeTab === "zip") {
    hwContent.textContent = "Архив исходного кода проекта (.ZIP).";
    if (sendActionBtn) {
      sendActionBtn.style.display = lesson.hasZip ? "block" : "none";
      sendActionBtn.textContent = "📦 Отправить ZIP в чат";
      sendActionBtn.className = "action-btn btn-green";
    }
  }
}

// Слушатели на вкладки
if (tabHw) tabHw.onclick = () => switchTab("hw");
if (tabPdf) tabPdf.onclick = () => switchTab("pdf");
if (tabZip) tabZip.onclick = () => switchTab("zip");

// Отправка файла в чат
if (sendActionBtn) {
  sendActionBtn.onclick = async () => {
    const lesson = lessonsData[currentLessonIdx];
    let fileIdToSend = null;

    if (activeTab === "hw") fileIdToSend = lesson.hwFileId;
    if (activeTab === "pdf") fileIdToSend = lesson.pdfId;
    if (activeTab === "zip") fileIdToSend = lesson.zipId;

    if (!fileIdToSend) {
      showMessage("Файл к данному уроку не прикреплён.");
      return;
    }

    const uid = tg?.initDataUnsafe?.user?.id;
    if (!uid) {
      showMessage("Не удалось определить ID пользователя Telegram.");
      return;
    }

    sendActionBtn.disabled = true;
    sendActionBtn.textContent = "Отправка...";

    try {
      const res = await fetch(`${API_BASE}/send-to-chat?userId=${uid}&fileId=${fileIdToSend}`, { method: "POST" });
      if (res.ok) {
        showMessage("Файл отправлен в диалог с ботом!");
      } else {
        showMessage("Ошибка при отправке файла.");
      }
    } catch (e) {
      showMessage("Сетевая ошибка при отправке.");
    } finally {
      sendActionBtn.disabled = false;
      updateTabContent();
    }
  };
}

init();
