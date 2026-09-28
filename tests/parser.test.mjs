import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseLecture, parsePresenterNotes, renderMarkdown } from "../app/lib.js";

test("all course slide files produce a non-empty lecture", async () => {
  const expectedMinimums = [16, 12, 15, 14, 15];
  for (let lesson = 1; lesson <= 5; lesson += 1) {
    const path = new URL(`../07-teaching-kit/lesson-${String(lesson).padStart(2,"0")}/01-slides.md`, import.meta.url);
    const parsed = parseLecture(await readFile(path,"utf8"));
    assert.match(parsed.lectureTitle,new RegExp(`Занятие ${lesson}`));
    assert.ok(parsed.slides.length >= expectedMinimums[lesson - 1]);
    assert.ok(parsed.slides.every((slide) => slide.title));
    assert.ok(parsed.slides.slice(lesson === 1 ? 2 : 0).every((slide) => slide.body));
  }
});

test("the complete course currently exposes 72 slides", async () => {
  let total = 0;
  for (let lesson = 1; lesson <= 5; lesson += 1) {
    const path = new URL(`../07-teaching-kit/lesson-${String(lesson).padStart(2,"0")}/01-slides.md`, import.meta.url);
    total += parseLecture(await readFile(path,"utf8")).slides.length;
  }
  assert.equal(total,72);
});

test("lesson one keeps the opening questions then follows AJTBD fundamentals", async () => {
  const source = await readFile(new URL("../07-teaching-kit/lesson-01/01-slides.md",import.meta.url),"utf8");
  const parsed = parseLecture(source);
  assert.equal(parsed.slides.length,16);
  assert.ok(parsed.slides.every((slide) => !slide.isIntro));
  assert.deepEqual(parsed.slides.slice(0,7).map((slide) => slide.title),["Зачем и когда мы идём в исследования?", "С чего начинается исследование?", "Виды исследований", "Исследуем работы человека, чтобы принимать продуктовые решения", "Работа — желаемый переход из А в Б", "Состояние А: почему человеку нужен этот результат", "Триггер запускает действие"]);
});

test("the first lecture keeps every slide in the player", async () => {
  const source = await readFile(new URL("../07-teaching-kit/lesson-01/01-slides.md",import.meta.url),"utf8");
  const playableSlides = parseLecture(source).slides.filter((slide) => !slide.isIntro);
  assert.equal(playableSlides.length,16);
  assert.equal(playableSlides[0].marker,"1");
  assert.equal(playableSlides[0].title,"Зачем и когда мы идём в исследования?");
});

test("visual production directions move into presenter cues", () => {
  const parsed = parseLecture("# Lecture\n\n### 1. Title\n\nVisible text.\n\nВизуальный материал: draw a chart.");
  assert.equal(parsed.slides[0].body,"Visible text.");
  assert.match(parsed.slides[0].cues,/draw a chart/);
});

test("screen labels are removed while their content stays on the slide", () => {
  const parsed = parseLecture("# Lecture\n\n### 1. Title\n\nНа экране:\n\nMain statement.\n\nВопрос:\n\nWhat happened?");
  assert.doesNotMatch(parsed.slides[0].body,/На экране|Вопрос:/);
  assert.match(parsed.slides[0].body,/Main statement/);
  assert.match(parsed.slides[0].body,/What happened/);
});

test("markdown renderer escapes source HTML and renders tables", () => {
  const html = renderMarkdown("<script>alert(1)</script>\n\n| A | B |\n|---|---|\n| one | two |");
  assert.doesNotMatch(html,/<script>/); assert.match(html,/&lt;script&gt;/); assert.match(html,/<table>/);
});

test("markdown renderer builds job cards and highlights selected fields safely", () => {
  const html = renderMarkdown([
    ":::job-card",
    "Работа | Купить <билеты>",
    "Решение | агрегатор",
    "Контекст | семья с детьми",
    "Критерии успеха | без ночной пересадки",
    "Акцент | Критерии успеха",
    ":::",
  ].join("\n"));
  assert.match(html,/class="job-card"/);
  assert.match(html,/class="job-card-field is-active"/);
  assert.match(html,/Критерии успеха/);
  assert.match(html,/Купить &lt;билеты&gt;/);
  assert.doesNotMatch(html,/<билеты>/);
});

test("presenter notes map explicit single, range, and comma-separated slide references", () => {
  const notes = parsePresenterNotes([
    "### Opening — слайды 1–2",
    "First note.",
    "### Practice — слайды 3, 5–6",
    "Practice note.",
  ].join("\n\n"), 6);
  assert.match(notes[0],/First note/);
  assert.match(notes[1],/First note/);
  assert.match(notes[2],/Practice note/);
  assert.equal(notes[3],"");
  assert.match(notes[4],/Practice note/);
  assert.match(notes[5],/Practice note/);
});

test("every course slide has presenter notes for split view", async () => {
  for (let lesson = 1; lesson <= 5; lesson += 1) {
    const folder = `../07-teaching-kit/lesson-${String(lesson).padStart(2,"0")}`;
    const slides = parseLecture(await readFile(new URL(`${folder}/01-slides.md`,import.meta.url),"utf8")).slides;
    const notes = parsePresenterNotes(await readFile(new URL(`${folder}/02-speaker-notes.md`,import.meta.url),"utf8"),slides.length);
    assert.equal(notes.length,slides.length);
    assert.deepEqual(notes.map((note,index) => note ? null : index + 1).filter(Boolean),[],`lesson ${lesson} has slides without notes`);
  }
});

test("presenter notes change on every slide", async () => {
  for (let lesson = 1; lesson <= 5; lesson += 1) {
    const folder = `../07-teaching-kit/lesson-${String(lesson).padStart(2,"0")}`;
    const slides = parseLecture(await readFile(new URL(`${folder}/01-slides.md`,import.meta.url),"utf8")).slides;
    const notes = parsePresenterNotes(await readFile(new URL(`${folder}/02-speaker-notes.md`,import.meta.url),"utf8"),slides.length);
    assert.equal(new Set(notes).size,slides.length,`lesson ${lesson} repeats presenter notes between slides`);
  }
});

test("player contains an accessible split-screen presenter panel", async () => {
  const html = await readFile(new URL("../app/index.html",import.meta.url),"utf8");
  assert.match(html,/id="presenterPanel"/);
  assert.match(html,/aria-label="Заметки преподавателя"/);
  assert.match(html,/id="notesButton"[^>]+aria-pressed="false"/);
  assert.doesNotMatch(html,/id="notesDialog"/);
});

test("the app viewport stays fixed while presenter notes own the scroll", async () => {
  const css = await readFile(new URL("../app/styles.css",import.meta.url),"utf8");
  assert.match(css,/html, body \{[^}]*height: 100%[^}]*overflow: hidden/);
  assert.match(css,/\.app-shell \{[^}]*height: 100dvh[^}]*overflow: hidden/);
  assert.match(css,/\.player \{[^}]*height: 100%[^}]*overflow: hidden/);
  assert.match(css,/\.presenter-note-content \{[^}]*overflow-y: auto/);
});
