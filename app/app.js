import { parseLecture, parsePresenterNotes, renderMarkdown } from "./lib.js";

const lectures = [
  { id: 1, short: "Основы", title: "Основы Advanced Jobs To Be Done", description: "Работа, выбор решения и проблема. Как исследование помогает принимать продуктовые решения.", accent: "#d95d39" },
  { id: 2, short: "Решение", title: "Как человек нанимает решение", description: "Восстанавливаем Job → Solution → Problem и момент, когда ценность становится заметна.", accent: "#d95d39" },
  { id: 3, short: "Интервью", title: "Рекрут и первое AJTBD-интервью", description: "Ищем реальный прошлый опыт и проводим разговор без подсказки желательного ответа.", accent: "#d95d39" },
  { id: 4, short: "Граф", title: "Уровень работы и основы графа", description: "Различаем Big, Core, Small и Micro Jobs и находим разрывы цепочки.", accent: "#d95d39" },
  { id: 5, short: "Сегмент", title: "Сегментная гипотеза и финальный разбор", description: "Сравниваем интервью и выбираем рискованную гипотезу для следующей проверки.", accent: "#d95d39" },
];

const state = { lessonId: null, slideIndex: 0, lecture: null, slideNotes: [], notesOpen: false, cache: new Map() };
const ids = ["homeButton", "headerActions", "libraryView", "lectureGrid", "playerView", "lectureSwitcher", "lessonNumber", "lessonTitle", "currentSlideNumber", "totalSlides", "progressBar", "slide", "slideKicker", "slideTitle", "slideContent", "slideCue", "previousButton", "nextButton", "slideLabel", "overviewButton", "notesButton", "fullscreenButton", "overviewDialog", "slideMap", "presenterPanel", "presenterNoteTitle", "presenterNoteMeta", "presenterNoteContent", "notesCloseButton", "lessonDialog", "lessonList", "toast"];
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));

async function fetchLesson(id) {
  if (state.cache.has(id)) return state.cache.get(id);
  const base = new URL(`../07-teaching-kit/lesson-${String(id).padStart(2, "0")}`, import.meta.url).href;
  const [slidesResponse, notesResponse] = await Promise.all([fetch(`${base}/01-slides.md`), fetch(`${base}/02-speaker-notes.md`)]);
  if (!slidesResponse.ok || !notesResponse.ok) throw new Error("Не удалось загрузить материалы занятия");
  const parsedLecture = parseLecture(await slidesResponse.text());
  const slides = parsedLecture.slides.filter((slide) => !slide.isIntro);
  const notes = await notesResponse.text();
  const data = {
    lecture: { ...parsedLecture, slides },
    slideNotes: parsePresenterNotes(notes, slides.length),
  };
  state.cache.set(id, data);
  return data;
}

async function renderLibrary() {
  elements.lectureGrid.innerHTML = lectures.map((lecture) => `
    <button class="lecture-card" type="button" data-lesson="${lecture.id}" style="--accent:${lecture.accent}">
      <span class="lecture-index">0${lecture.id}</span><span class="lecture-tag">${lecture.short}</span>
      <strong>${lecture.title}</strong><span class="lecture-description">${lecture.description}</span>
      <span class="lecture-footer"><span class="lecture-meta" data-count-for="${lecture.id}">Загрузка…</span><span class="lecture-action">Открыть <span aria-hidden="true">→</span></span></span>
    </button>`).join("");
  elements.lessonList.innerHTML = lectures.map((lecture) => `<button type="button" data-lesson="${lecture.id}" style="--accent:${lecture.accent}"><span>0${lecture.id}</span><strong>${lecture.title}</strong></button>`).join("");
  for (const lecture of lectures) {
    fetchLesson(lecture.id).then(({ lecture: parsed }) => {
      const count = document.querySelector(`[data-count-for="${lecture.id}"]`);
      if (count) count.textContent = `${parsed.slides.length} слайдов · 120 минут`;
    }).catch(() => {
      const count = document.querySelector(`[data-count-for="${lecture.id}"]`);
      if (count) count.textContent = "Не удалось загрузить";
    });
  }
}

async function openLesson(id, requestedSlide = 0) {
  try {
    const data = await fetchLesson(id);
    state.lessonId = id; state.lecture = data.lecture; state.slideNotes = data.slideNotes;
    state.slideIndex = Math.max(0, Math.min(requestedSlide, state.lecture.slides.length - 1));
    const lecture = lectures.find((item) => item.id === id);
    document.documentElement.style.setProperty("--lesson-accent", lecture.accent);
    elements.lessonNumber.textContent = `Занятие ${id}`; elements.lessonTitle.textContent = lecture.title;
    elements.totalSlides.textContent = String(state.lecture.slides.length).padStart(2, "0");
    elements.libraryView.hidden = true; elements.playerView.hidden = false; elements.headerActions.hidden = false;
    closeDialogs(); renderSlide();
  } catch (error) { showToast(error.message); }
}

function renderSlide() {
  const slide = state.lecture.slides[state.slideIndex];
  const current = state.slideIndex + 1; const total = state.lecture.slides.length;
  const lecture = lectures.find((item) => item.id === state.lessonId);
  elements.slide.classList.remove("compact", "dense", "fit-1", "fit-2", "fit-3", "has-job-card", "job-card-pair");
  const jobCardCount = (slide.body.match(/^:::job-card$/gm) || []).length;
  elements.slide.classList.toggle("has-job-card", jobCardCount > 0);
  elements.slide.classList.toggle("job-card-pair", jobCardCount > 1);
  elements.slide.classList.toggle("has-diagram", /^:::diagram /m.test(slide.body));
  elements.slide.classList.toggle("has-source-image", /^!\[[^\]]*\]\(\/app\/assets\//m.test(slide.body));
  elements.slide.classList.toggle("compact", slide.body.length > 220);
  elements.slide.classList.toggle("dense", slide.body.length > 420);
  elements.slide.classList.remove("slide-enter"); void elements.slide.offsetWidth; elements.slide.classList.add("slide-enter");
  elements.slideKicker.textContent = slide.isIntro ? "Открытие курса" : `${lecture.short} · занятие ${state.lessonId}`;
  elements.slideTitle.textContent = slide.title; elements.slideContent.innerHTML = renderMarkdown(slide.body);
  elements.currentSlideNumber.textContent = String(current).padStart(2, "0");
  elements.slideLabel.textContent = `${slide.isIntro ? "Вводный" : "Слайд"} ${slide.marker}`;
  elements.progressBar.style.width = `${(current / total) * 100}%`;
  elements.previousButton.disabled = state.slideIndex === 0; elements.nextButton.disabled = state.slideIndex === total - 1;
  elements.nextButton.innerHTML = state.slideIndex === total - 1 ? "Конец занятия ✓" : 'Дальше <span aria-hidden="true">→</span>';
  elements.slideCue.hidden = true;
  elements.slideCue.innerHTML = "";
  renderPresenterNote(slide);
  history.replaceState(null, "", `?lesson=${state.lessonId}&slide=${state.slideIndex + 1}`);
  elements.slide.scrollTop = 0;
  document.title = `${slide.title} · AJTBD`; renderSlideMap();
  requestAnimationFrame(fitCurrentSlide);
}

function fitCurrentSlide() {
  if (!state.lecture) return;
  elements.slide.classList.remove("fit-1", "fit-2", "fit-3");
  for (const fitClass of ["fit-1", "fit-2", "fit-3"]) {
    if (elements.slide.scrollHeight <= elements.slide.clientHeight) break;
    elements.slide.classList.add(fitClass);
  }
}

function renderSlideMap() {
  if (!state.lecture) return;
  elements.slideMap.innerHTML = state.lecture.slides.map((slide, index) => `<button type="button" data-slide="${index}" class="${index === state.slideIndex ? "active" : ""}"><span>${slide.marker}</span><strong>${slide.title}</strong></button>`).join("");
}

function renderPresenterNote(slide) {
  const mappedNotes = state.slideNotes[state.slideIndex] || "";
  const noteParts = [];
  if (slide.cues) noteParts.push(`### Подсказка к экрану\n\n${slide.cues}`);
  if (mappedNotes) noteParts.push(mappedNotes);
  elements.presenterNoteTitle.textContent = slide.title;
  elements.presenterNoteMeta.textContent = `Слайд ${slide.marker} · заметки преподавателя`;
  elements.presenterNoteContent.innerHTML = noteParts.length
    ? renderMarkdown(noteParts.join("\n\n---\n\n"))
    : "<p>Для этого слайда отдельной заметки пока нет.</p>";
  elements.presenterNoteContent.scrollTop = 0;
}

function setNotesOpen(open) {
  state.notesOpen = open;
  elements.presenterPanel.hidden = !open;
  elements.playerView.classList.toggle("notes-open", open);
  elements.notesButton.setAttribute("aria-pressed", String(open));
  elements.notesButton.title = open ? "Скрыть заметки (N)" : "Показать заметки (N)";
  requestAnimationFrame(fitCurrentSlide);
}

function moveSlide(delta) {
  if (!state.lecture) return;
  const nextIndex = Math.max(0, Math.min(state.slideIndex + delta, state.lecture.slides.length - 1));
  if (nextIndex !== state.slideIndex) { state.slideIndex = nextIndex; renderSlide(); }
}

function goHome() {
  closeDialogs(); state.lessonId = null; state.lecture = null;
  setNotesOpen(false);
  elements.libraryView.hidden = false; elements.playerView.hidden = true; elements.headerActions.hidden = true;
  document.title = "AJTBD · Лекции"; history.replaceState(null, "", location.pathname);
}

function closeDialogs() { document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close()); }
function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add("visible"); window.setTimeout(() => elements.toast.classList.remove("visible"), 2400); }
function toggleDialog(dialog) {
  if (dialog.open) dialog.close();
  else { closeDialogs(); dialog.showModal(); }
}
async function toggleFullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { showToast("Полноэкранный режим недоступен в этом браузере"); }
}

document.addEventListener("click", (event) => {
  const lessonTarget = event.target.closest("[data-lesson]");
  if (lessonTarget) { openLesson(Number(lessonTarget.dataset.lesson), 0); return; }
  const slideTarget = event.target.closest("[data-slide]");
  if (slideTarget) { state.slideIndex = Number(slideTarget.dataset.slide); elements.overviewDialog.close(); renderSlide(); return; }
  const closeTarget = event.target.closest("[data-close]"); if (closeTarget) document.getElementById(closeTarget.dataset.close).close();
});

elements.homeButton.addEventListener("click", goHome);
elements.lectureSwitcher.addEventListener("click", () => toggleDialog(elements.lessonDialog));
elements.previousButton.addEventListener("click", () => moveSlide(-1)); elements.nextButton.addEventListener("click", () => moveSlide(1));
elements.overviewButton.addEventListener("click", () => toggleDialog(elements.overviewDialog)); elements.notesButton.addEventListener("click", () => setNotesOpen(!state.notesOpen));
elements.notesCloseButton.addEventListener("click", () => setNotesOpen(false));
elements.fullscreenButton.addEventListener("click", toggleFullscreen);
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

document.addEventListener("keydown", (event) => {
  if (!state.lecture || event.metaKey || event.ctrlKey || event.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
  const openDialog = document.querySelector("dialog[open]");
  if (openDialog) {
    if (event.key.toLowerCase() === "o" && openDialog === elements.overviewDialog) openDialog.close();
    return;
  }
  if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); moveSlide(1); }
  else if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); moveSlide(-1); }
  else if (event.key === "Home") { state.slideIndex = 0; renderSlide(); }
  else if (event.key === "End") { state.slideIndex = state.lecture.slides.length - 1; renderSlide(); }
  else if (event.key.toLowerCase() === "o") toggleDialog(elements.overviewDialog);
  else if (event.key.toLowerCase() === "n") setNotesOpen(!state.notesOpen);
  else if (event.key.toLowerCase() === "f") toggleFullscreen();
});

await renderLibrary();
const params = new URLSearchParams(location.search); const initialLesson = Number(params.get("lesson"));
const initialSlide = Math.max(0, Number(params.get("slide") || 1) - 1);
if (lectures.some((lecture) => lecture.id === initialLesson)) openLesson(initialLesson, initialSlide);
window.addEventListener("resize", () => requestAnimationFrame(fitCurrentSlide));
