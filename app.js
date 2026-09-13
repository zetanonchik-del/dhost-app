const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Укажите URL, выданный утилитой cloudflared
const API_BASE = "https://optimization-idle-contacts-developed.trycloudflare.com/api";

let lessonsData = [];
let currentLessonIdx = 0;
let currentVideoIdx = 0;

const videoPlayer = document.getElementById("videoPlayer");
const lessonPicker = document.getElementById("lessonPicker");
const lessonHeading = document.getElementById("lessonHeading");
const hwContent = document.getElementById("hwContent");
const partTitle = document.getElementById("partTitle");
const prevPartBtn = document.getElementById("prevPartBtn");
const nextPartBtn = document.getElementById("nextPartBtn");

// Загрузка структуры обучения
async function init() {
  try {
    const res = await fetch(`${API_BASE}/lessons`);
    lessonsData = await res.json();
    populateDropdown();
    showLesson(0);
  } catch (e) {
    lessonHeading.innerText = "Ошибка загрузки данных с сервера";
  }
}

function populateDropdown() {
  lessonPicker.innerHTML = "";
  lessonsData.forEach((l, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `Урок ${l.lessonNumber}: ${l.title}`;
    lessonPicker.appendChild(opt);
  });
  lessonPicker.onchange = (e) => showLesson(parseInt(e.target.value));
}

function showLesson(idx) {
  currentLessonIdx = idx;
  currentVideoIdx = 0;
  const lesson = lessonsData[idx];

  lessonHeading.textContent = `Урок ${lesson.lessonNumber}. ${lesson.title}`;
  hwContent.textContent = lesson.homeworkText || "Письменное задание к этому уроку отсутствует.";

  loadPart(currentVideoIdx);
}

function loadPart(partIdx) {
  const lesson = lessonsData[currentLessonIdx];
  if (!lesson.videos || lesson.videos.length === 0) {
    videoPlayer.src = "";
    partTitle.textContent = "Нет видео";
    prevPartBtn.disabled = true;
    nextPartBtn.disabled = true;
    return;
  }

  const v = lesson.videos[partIdx];
  videoPlayer.src = `${API_BASE}/video/stream/${v.id}`;
  partTitle.textContent = `Часть ${partIdx + 1}/${lesson.videos.length}`;

  prevPartBtn.disabled = partIdx === 0;
  nextPartBtn.disabled = partIdx === lesson.videos.length - 1;
}

prevPartBtn.onclick = () => { if (currentVideoIdx > 0) loadPart(--currentVideoIdx); };
nextPartBtn.onclick = () => { if (currentVideoIdx < lessonsData[currentLessonIdx].videos.length - 1) loadPart(++currentVideoIdx); };

// Навигация по вкладкам
document.querySelectorAll(".tab-item").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// Отправка материалов в чат бота
async function triggerSend(fileId) {
  if (!fileId) return alert("Файл к данному уроку не прикреплён.");
  const uid = tg?.initDataUnsafe?.user?.id || 123456789; // Тестовый ID при отладке в браузере

  const res = await fetch(`${API_BASE}/send-to-chat?userId=${uid}&fileId=${fileId}`, { method: "POST" });
  if (res.ok) {
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    alert("Файл отправлен вам в диалог с ботом!");
  } else {
    alert("Не удалось отправить файл.");
  }
}

document.getElementById("btnSendHw").onclick = () => triggerSend(lessonsData[currentLessonIdx].hwFileId);
document.getElementById("btnSendPdf").onclick = () => triggerSend(lessonsData[currentLessonIdx].pdfId);
document.getElementById("btnSendZip").onclick = () => triggerSend(lessonsData[currentLessonIdx].zipId);

init();
