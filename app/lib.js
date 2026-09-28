import { renderDiagram } from './diagrams.js';

const cuePrefixes = [
  "Визуальный материал:",
  "Не обещать",
  "Не растягивать",
  "Не перегружать",
  "Снять основные страхи:",
  "Закончить конкретным входом:",
  "Важно:",
  "Акцент:",
];
const screenLabels = new Set(["На экране:", "Подпись:", "Показать:", "Разбор:", "Задача:", "Формат:", "Проверка:", "Вопрос:"]);

export function escapeHtml(value = "") {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderTable(lines) {
  const rows = lines.map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
  const header = rows[0] || [];
  const body = rows.slice(2);
  return `<div class="table-wrap"><table><thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderJobCard(lines) {
  const entries = lines.map((line) => {
    const divider = line.indexOf("|");
    if (divider === -1) return null;
    return [line.slice(0, divider).trim(), line.slice(divider + 1).trim()];
  }).filter(Boolean);
  const values = new Map(entries);
  const activeFields = new Set((values.get("Акцент") || "").split(",").map((field) => field.trim().toLocaleLowerCase("ru")).filter(Boolean));
  const fields = entries.filter(([label]) => !["Работа", "Решение", "Акцент"].includes(label));
  const renderField = ([label, value]) => {
    const isActive = activeFields.has(label.toLocaleLowerCase("ru"));
    return `<div class="job-card-field${isActive ? " is-active" : ""}"><dt>${renderInline(label)}</dt><dd>${renderInline(value)}</dd></div>`;
  };

  return `<article class="job-card">
    <header class="job-card-header">
      <div class="job-card-primary"><span>Работа</span><strong>${renderInline(values.get("Работа") || "Не указана")}</strong></div>
      <div class="job-card-solution"><span>Решение</span><strong>${renderInline(values.get("Решение") || "Не выбрано")}</strong></div>
    </header>
    <dl class="job-card-fields">${fields.map(renderField).join("")}</dl>
  </article>`;
}

export function renderMarkdown(markdown = "") {
  const lines = markdown.replace(/\r/g, "").trim().split("\n");
  const output = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    const sourceImage = line.trim().match(/^!\[([^\]]*)\]\((\/app\/assets\/[a-zA-Z0-9/_.-]+)\)$/);
    if (sourceImage) {
      const imageUrl = new URL(`..${sourceImage[2]}`, import.meta.url).href;
      output.push(`<figure class="source-slide-image"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(sourceImage[1])}" decoding="sync"></figure>`);
      index += 1; continue;
    }
    const diagram = line.trim().match(/^:::diagram ([a-z0-9-]+)$/);
    if (diagram) { output.push(renderDiagram(diagram[1])); index += 1; continue; }
    if (line.trim() === ":::job-card") {
      const card = []; index += 1;
      while (index < lines.length && lines[index].trim() !== ":::") card.push(lines[index++]);
      if (index < lines.length) index += 1;
      output.push(renderJobCard(card)); continue;
    }
    if (line.startsWith("```")) {
      const code = []; index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      index += 1; output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { output.push("<hr>"); index += 1; continue; }
    if (/^\|.+\|$/.test(line) && /^\|?[\s:|-]+\|?$/.test(lines[index + 1] || "")) {
      const table = [line]; index += 1;
      while (index < lines.length && /^\|.+\|$/.test(lines[index])) table.push(lines[index++]);
      output.push(renderTable(table)); continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) { const level = Math.min(heading[1].length + 1, 6); output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`); index += 1; continue; }
    if (/^>\s?/.test(line)) {
      const quote = []; while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ""));
      output.push(`<blockquote>${renderMarkdown(quote.join("\n"))}</blockquote>`); continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = []; while (index < lines.length && /^[-*]\s+/.test(lines[index])) items.push(lines[index++].replace(/^[-*]\s+/, ""));
      output.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`); continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = []; while (index < lines.length && /^\d+\.\s+/.test(lines[index])) items.push(lines[index++].replace(/^\d+\.\s+/, ""));
      output.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`); continue;
    }
    const paragraph = [line]; index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s+|^```|^:::job-card$|^:::diagram |^[-*]\s+|^\d+\.\s+|^>\s?|^\|.+\|$/.test(lines[index])) paragraph.push(lines[index++]);
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }
  return output.join("\n");
}

function separatePresenterCues(body) {
  const bodyParts = []; const cues = [];
  for (const part of body.trim().split(/\n{2,}/)) {
    const trimmed = part.trim();
    const lines = trimmed.split("\n");
    if (screenLabels.has(lines[0])) {
      if (lines.length > 1) bodyParts.push(lines.slice(1).join("\n").trim());
    } else if (cuePrefixes.some((prefix) => trimmed.startsWith(prefix))) {
      cues.push(trimmed);
    } else {
      bodyParts.push(trimmed);
    }
  }
  return { body: bodyParts.join("\n\n"), cues: cues.join("\n\n") };
}

export function parseLecture(markdown) {
  const normalized = markdown.replace(/\r/g, "");
  const lectureTitle = normalized.match(/^#\s+(.+)$/m)?.[1] || "Лекция";
  const goal = normalized.match(/## Цель презентации\s+([\s\S]*?)(?=\n##\s)/)?.[1]?.trim() || "";
  const matches = [...normalized.matchAll(/^###\s+([A-ZА-ЯЁ]|\d+)\.\s+(.+)$/gm)];
  const slides = matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    const { body, cues } = separatePresenterCues(normalized.slice(start, end));
    return { id: `${match[1]}-${index}`, marker: match[1], title: match[2].trim(), body, cues, isIntro: !/^\d+$/.test(match[1]) };
  });
  return { lectureTitle, goal, slides };
}

function extractSlideNumbers(heading) {
  const match = heading.match(/слайд(?:ы|а|ов)?\s+([\d\s,–—-]+)/i);
  if (!match) return [];
  const numbers = new Set();
  for (const part of match[1].split(",")) {
    const range = part.trim().match(/^(\d+)(?:\s*[–—-]\s*(\d+))?$/);
    if (!range) continue;
    const first = Number(range[1]);
    const last = Number(range[2] || range[1]);
    for (let slide = Math.min(first, last); slide <= Math.max(first, last); slide += 1) numbers.add(slide);
  }
  return [...numbers];
}

export function parsePresenterNotes(markdown = "", slideCount = 0) {
  const notes = Array.from({ length: slideCount }, () => []);
  const normalized = markdown.replace(/\r/g, "");
  const matches = [...normalized.matchAll(/^###\s+(.+)$/gm)];

  for (const [index, match] of matches.entries()) {
    const slideNumbers = extractSlideNumbers(match[1]);
    if (!slideNumbers.length) continue;
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    const body = normalized.slice(start, end).trim();
    const section = `### ${match[1]}\n\n${body}`.trim();
    for (const slide of slideNumbers) {
      if (notes[slide - 1]) notes[slide - 1].push(section);
    }
  }

  return notes.map((sections) => sections.join("\n\n---\n\n"));
}
