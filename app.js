const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Актуальный адрес туннеля Cloudflare
const API_BASE = "https://optimization-idle-contacts-developed.trycloudflare.com/api";

let lessonsData = [];
let currentLessonIdx = 0;
let currentVideoIdx = 0;
let currentActiveVideoId = null;
let activeTab = "hw";

// DOM элементы
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

// Нативное уведомление Telegram (без надписи браузера и адреса сайта)
function notify(msg) {
  if (tg && tg.showAlert) {
    tg.showAlert(msg);
  } else {
    alert(msg);
  }
}

// Инициализация при открытии
async function init() {
  try {
    const res = await fetch(`${API_BASE}/lessons`);
    if (!res.ok) throw new Error("Network response was not ok");
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
    console.error("Ошибка загрузки данных:", err);
    if (lessonHeading) lessonHeading.textContent = "Ошибка загрузки данных с сервера";
  }
}

// Выбор урока
function selectLesson(idx) {
  currentLessonIdx = idx;
  currentVideoIdx = 0;
  const lesson = lessonsData[idx];

  lessonHeading.textContent = `Урок ${lesson.lessonNumber}. ${lesson.title}`;

  // 1. Скрываем вкладки, если файлов нет
  if (tabPdf) tabPdf.style.display = lesson.hasPdf ? "inline-flex" : "none";
  if (tabZip) tabZip.style.display = lesson.hasZip ? "inline-flex" : "none";

  // 2. Если вкладка была на скрытом файле, переключаем на домашку
  if ((activeTab === "pdf" && !lesson.hasPdf) || (activeTab === "zip" && !lesson.hasZip)) {
    switchTab("hw");
  } else {
    updateTabContent();
  }

  // 3. Обновляем видео и кнопки частей
  updateVideoControls(lesson);
}

// Управление видео и частями
function updateVideoControls(lesson) {
  const videos = lesson.videos || [];
  if (videos.length === 0) {
    videoPlayer.removeAttribute("src");
    partTitle.textContent = "Нет видео";
    prevPartBtn.style.display = "none";
    nextPartBtn.style.display = "none";
    currentActiveVideoId = null;
    return;
  }

  // Показываем кнопки переключения, только если частей больше одной
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
}

// Кнопка: Предыдущая часть
if (prevPartBtn) {
  prevPartBtn.onclick = () => {
    if (currentVideoIdx > 0) {
      currentVideoIdx--;
      updateVideoControls(lessonsData[currentLessonIdx]);
    }
  };
}

// Кнопка: Следующая часть
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

// Обновление описания и кнопок
function updateTabContent() {
  const lesson = lessonsData[currentLessonIdx];
  if (!lesson) return;

  if (activeTab === "hw") {
    hwContent.textContent = lesson.homeworkText ? lesson.homeworkText : "Письменное задание к этому уроку отсутствует.";
    
    if (sendActionBtn) {
      // Показываем кнопку отправки ДЗ ТОЛЬКО если есть файл домашки
      if (lesson.hwFileId) {
        sendActionBtn.style.display = "block";
        sendActionBtn.textContent = "💬 Отправить файл ДЗ в чат";
        sendActionBtn.className = "action-btn btn-blue";
      } else {
        sendActionBtn.style.display = "none";
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

if (tabHw) tabHw.onclick = () => switchTab("hw");
if (tabPdf) tabPdf.onclick = () => switchTab("pdf");
if (tabZip) tabZip.onclick = () => switchTab("zip");

// Отправка файла в Telegram-чат
if (sendActionBtn) {
  sendActionBtn.onclick = async () => {
    const lesson = lessonsData[currentLessonIdx];
    let fileIdToSend = null;

    if (activeTab === "hw") fileIdToSend = lesson.hwFileId;
    if (activeTab === "pdf") fileIdToSend = lesson.pdfId;
    if (activeTab === "zip") fileIdToSend = lesson.zipId;

    if (!fileIdToSend) {
      notify("Файл к данному уроку не прикреплен.");
      return;
    }

    const uid = tg?.initDataUnsafe?.user?.id;
    if (!uid) {
      notify("Пожалуйста, откройте приложение внутри Telegram.");
      return;
    }

    sendActionBtn.disabled = true;
    const oldText = sendActionBtn.textContent;
    sendActionBtn.textContent = "Отправка в чат...";

    try {
      const res = await fetch(`${API_BASE}/send-to-chat?userId=${uid}&fileId=${fileIdToSend}`, {
        method: "POST"
      });
      if (res.ok) {
        notify("Файл успешно отправлен в диалог с ботом!");
      } else {
        notify("Не удалось отправить файл. Попробуйте позже.");
      }
    } catch (e) {
      notify("Сетевая ошибка при отправке.");
    } finally {
      sendActionBtn.disabled = false;
      sendActionBtn.textContent = oldText;
    }
  };
}

// Автоудаление видео из кэша при закрытии Mini App
window.addEventListener("pagehide", () => {
  if (currentActiveVideoId) {
    navigator.sendBeacon(`${API_BASE}/video/cleanup?fileId=${currentActiveVideoId}`);
  }
});

// Запуск
init();
