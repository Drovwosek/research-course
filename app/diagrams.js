// Semantic slide illustrations. Coordinates use one shared 1120px canvas.
// Text and relationships live here; slide Markdown explicitly selects a diagram.
const node = (id, x, y, w, h, title, body = '', tone = 'paper', extra = {}) => ({ id, x, y, w, h, title, body, tone, ...extra });
const edge = (from, to, extra = {}) => ({ from, to, ...extra });
const label = (x, y, text, extra = {}) => ({ x, y, text, ...extra });
const figure = (description, nodes, edges = [], extra = {}) => ({ description, nodes, edges, height: 440, ...extra });

function flow(description, items, extra = {}) {
  const gap = 34;
  const w = (1100 - gap * (items.length - 1)) / items.length;
  return figure(description, items.map((item, i) => node(`n${i}`, 10 + i * (w + gap), 100, w, 180, item[0], item[1], item[2] || 'paper')),
    items.slice(1).map((_, i) => edge(`n${i}`, `n${i + 1}`)), { height: 340, ...extra });
}

function hierarchy(focus = 'all', blank = false) {
  const active = (id, tone) => focus === 'all' || focus === id ? tone : 'paper';
  const text = (normal) => blank ? 'Заполните по своему случаю' : normal;
  return figure('Big Job выше Core Job. Small Job находится рядом с Core Job, на той же высоте. Micro Jobs расположены под Core Job. Уровни зависят от охвата продукта.', [
    node('big', 322, 8, 476, 83, 'Big Job · зачем?', text('Результат, ради которого нужна Core Job'), active('big', 'job')),
    node('core', 48, 169, 540, 85, 'Core Job · охват продукта', text('Самая высокая работа, выполняемая целиком'), active('core', 'solution')),
    node('small', 760, 169, 340, 85, 'Small Job · что ещё?', text('Соседняя работа вне продукта'), active('small', 'expectation')),
    ...[0, 1, 2].map((i) => node(`micro${i}`, 22 + i * 199, 333, 181, 85, `Micro Job ${i + 1}`, blank ? 'Какой шаг?' : ['Первый шаг', 'Второй шаг', 'Третий шаг'][i], active('micro', 'job'))),
  ], [edge('big', 'core', { fromSide: 'bottom', toSide: 'top' }), edge('big', 'small', { fromSide: 'bottom', toSide: 'top' }),
    ...[0, 1, 2].map((i) => edge('core', `micro${i}`, { fromSide: 'bottom', toSide: 'top' }))], {
    labels: [label(620, 206, 'Один', { size: 18 }), label(620, 232, 'уровень', { size: 18 }), label(700, 372, 'КАК ВЫПОЛНЯЕТСЯ CORE JOB')],
  });
}

const diagrams = {
  'research-recruit': flow('Рекрут связан с интервью: от гипотезы работы через проверку опыта и приглашение к разговору и заметкам.', [
    ['Гипотеза', 'Какую работу изучаем?', 'job'], ['Опыт', 'Кто недавно её выполнял?'], ['Приглашение', 'Нейтральная тема разговора'], ['Интервью', 'Конкретный прошлый случай', 'solution'], ['Заметки', 'Факты, цитаты, неизвестное', 'expectation'],
  ]),
  'interview-route': figure('Короткое учебное интервью из шести блоков. Глубокий блок по выбранной работе занимает центральное место.', [
    node('n0', 10, 10, 335, 130, '01 · Рамка', 'Установить контакт; объяснить разговор'),
    node('n1', 393, 10, 335, 130, '02 · Квалификация', 'Проверить реальный прошлый опыт'),
    node('n2', 776, 10, 334, 130, '03 · Навигация', 'Выбрать работу для разбора', 'job'),
    node('n3', 776, 248, 334, 151, '04 · Глубокий блок', 'Результат, критерии, контекст, триггер, эмоции', 'job'),
    node('n4', 393, 248, 335, 151, '05 · Опыт с решением', 'Выбор, Problem, Aha Moment', 'solution'),
    node('n5', 10, 248, 335, 151, '06 · Завершение', 'Уточнения и следующий контакт'),
  ], [edge('n0', 'n1'), edge('n1', 'n2'), edge('n2', 'n3', { fromSide: 'bottom', toSide: 'top' }), edge('n3', 'n4', { fromSide: 'left', toSide: 'right' }), edge('n4', 'n5', { fromSide: 'left', toSide: 'right' })]),
  'graph-practice': hierarchy('all', true),
};

diagrams['graph-example'] = figure('Учебная гипотеза графа для доставки продуктов. Все связи пунктирные, потому что это не результат интервью. Работа выше: приготовить ужин; Core Job: получить продукты домой; соседняя работа: выбрать блюдо.', [
  node('big', 310, 0, 510, 100, 'Big Job', 'Хочу приготовить ужин для семьи', 'job'),
  node('core', 32, 173, 551, 100, 'Core Job · доставка', 'Хочу получить продукты домой к началу готовки', 'solution'),
  node('small', 751, 173, 359, 100, 'Small Job · вне сервиса', 'Хочу выбрать блюдо для ужина', 'expectation'),
  node('m1', 10, 346, 183, 85, 'Micro Job', 'Собрать корзину', 'job'),
  node('m2', 222, 346, 183, 85, 'Micro Job', 'Оплатить заказ', 'job'),
  node('m3', 434, 346, 183, 85, 'Micro Job', 'Получить заказ', 'job'),
], [edge('big', 'core', { fromSide: 'bottom', toSide: 'top', dashed: true }), edge('big', 'small', { fromSide: 'bottom', toSide: 'top', dashed: true }),
  ...['m1', 'm2', 'm3'].map((to) => edge('core', to, { fromSide: 'bottom', toSide: 'top', dashed: true })),
  edge('m1', 'm2', { dashed: true }), edge('m2', 'm3', { dashed: true })], {
  height: 460, labels: [label(723, 365, 'ВОЗМОЖНЫЙ РАЗРЫВ'), label(723, 398, 'Продукты приехали после', { size: 21 }), label(723, 428, 'начала готовки', { size: 21 })],
});

diagrams['segment-clusters'] = figure('Учебные карточки: одинаковая формулировка работы ещё не означает один сегмент. Первые два случая объединены по приоритету времени; третий отличается приоритетом цены.', [
  node('a', 31, 95, 321, 239, 'Случай А', 'Хочу получить продукты домой.\n1. До начала готовки.\n2. Полный состав заказа.\n3. Цена.', 'job'),
  node('b', 379, 95, 321, 239, 'Случай Б', 'Хочу получить продукты домой.\n1. До прихода гостей.\n2. Без замен.\n3. Цена.', 'job'),
  node('c', 787, 95, 311, 239, 'Случай В', 'Хочу получить продукты домой.\n1. Минимальная цена.\n2. Все позиции.\nВремя гибкое.', 'expectation'),
], [], {
  height: 420, groups: [{ x: 10, y: 40, w: 711, h: 350, tone: 'job', dashed: true }, { x: 766, y: 40, w: 344, h: 350, tone: 'expectation', dashed: true }],
  labels: [label(31, 72, 'ГИПОТЕЗА ГРУППЫ · ВРЕМЯ ВАЖНЕЕ'), label(789, 72, 'ДРУГОЙ ПРИОРИТЕТ'), label(31, 366, 'Похожие работы + близкий порядок критериев', { size: 20 }), label(789, 366, 'Цена важнее времени', { size: 20 })],
});

diagrams['next-risk'] = flow('От гипотезы через последствия ошибки к дешёвому опровержению и следующему действию.', [
  ['Гипотеза', 'Что должно оказаться правдой?', 'job'],
  ['Риск ошибки', 'Что разрушится, если это неверно?', 'problem'],
  ['Опровержение', 'Какой факт заставит отказаться?', 'expectation'],
  ['Следующий шаг', 'У кого и каким тестом ищем этот факт?', 'solution'],
]);

function board(description, items) {
  return figure(description, items.map((item, i) => node(`card${i}`, 10 + (i % 2) * 565, 10 + Math.floor(i / 2) * 209, 535, 186, item[0], item[1], item[2] || 'paper')), [], { height: 430 });
}

function checklist(description, items) {
  return figure(description, items.map((text, i) => node(`check${i}`, 80, 8 + i * 81, 960, 67, `□  ${text}`)), [], { height: items.length * 81 + 10 });
}

diagrams['recruit-screen'] = figure('Отбираем респондента по реальному прошлому опыту и вложенным ресурсам. Готовность когда-нибудь попробовать не подтверждает выполнение работы.', [
  node('yes', 10, 20, 600, 311, 'Подходящий прошлый опыт', '□ Выполнял похожую работу.\n□ Может вспомнить конкретный случай.\n□ Тратил деньги, время или усилия.\n□ Может рассказать о выборе и результате.', 'solution'),
  node('weak', 685, 20, 425, 311, 'Недостаточный сигнал', '«Мне было бы интересно».\n«Когда-нибудь попробую».\nЭто намерение; прошлый опыт ещё не установлен.', 'expectation'),
], [], { height: 370 });

diagrams['neutral-invitation'] = figure('Учебный пример нейтрального приглашения: тема, прошлый опыт, отсутствие продажи и ограничение по времени.', [
  node('message', 10, 45, 680, 291, 'Сообщение респонденту', 'Здравствуйте! Изучаю, как люди выбирают и покупают продукты с доставкой. Хотелось бы обсудить ваш последний заказ. Это не продажа; мне важен ваш прошлый опыт. Удобно поговорить 30–45 минут?', 'paper'),
  node('frame', 770, 45, 340, 291, 'Что задаёт рамку', 'Тема: покупка продуктов.\nЭпизод: последний заказ.\nЦель: понять опыт.\nВремя: 30–45 минут.', 'solution'),
], [], { height: 380 });

diagrams['research-notes'] = board('Учебный макет заметок. Цитату, факт из рассказа, интерпретацию и предположение записываем раздельно.', [
  ['Цитата', '«Я боялся, что заказ не успеет к приходу гостей».', 'job'],
  ['Факт из рассказа', 'Заказ оформлен к 18:00. Доставлен в 18:40.', 'solution'],
  ['Интерпретация', 'Вероятно, предсказуемое время было главным критерием.', 'expectation'],
  ['Предположение', 'Готов доплачивать за точность доставки. Ещё не проверено.', 'problem'],
]);

diagrams['interview-roles'] = figure('Практика в тройке: интервьюер разговаривает с респондентом, наблюдатель оценивает вопросы и качество фиксации.', [
  node('interviewer', 10, 15, 440, 115, 'Интервьюер', 'Уточняет один прошлый случай', 'job'),
  node('respondent', 670, 15, 440, 115, 'Респондент', 'Вспоминает свой реальный опыт', 'solution'),
  node('observer', 272, 255, 576, 157, 'Наблюдатель', '□ Не подсказывают ли ответ?\n□ Уточняют ли критерии?\n□ Разделяют ли факты и трактовки?', 'expectation'),
], [edge('interviewer', 'respondent', { label: '10 минут разговора' }), edge('interviewer', 'observer', { fromSide: 'bottom', toSide: 'top', dashed: true }), edge('respondent', 'observer', { fromSide: 'bottom', toSide: 'top', dashed: true })]);

diagrams['lens-evidence'] = figure('Учебный пример итоговой карточки. Из слов респондента выделяем известное, а причинное объяснение и готовность платить оставляем гипотезами.', [
  node('job', 10, 0, 1100, 84, 'Работа · черновая формулировка', 'Хочу получить продукты к началу приготовления ужина', 'job'),
  node('known', 10, 144, 535, 225, 'Из рассказа человека', 'Ожидал заказ к 18:00.\nЗаказ приехал в 18:40.\n«Пришлось начинать готовить позже».\nРешение: сервис доставки.', 'solution'),
  node('unknown', 575, 144, 535, 225, 'Нужно проверить', 'Почему именно 18:00?\nБыла ли скорость важнее цены?\nБыли ли другие решения?\nГотов ли платить за точность?', 'expectation'),
], [], { height: 405 });

diagrams['learning-report'] = figure('Учебная структура финального отчёта: сравнение случаев, сегментная гипотеза и следующий проверяемый риск.', [
  node('evidence', 10, 0, 1100, 118, '1 · Сравнение случаев', 'А: важен срок до готовки. Б: важен срок до гостей. В: важнее минимальная цена. Учебные примеры; не данные исследования.', 'paper'),
  node('hypothesis', 10, 192, 535, 207, '2 · Сегментная гипотеза', 'Возможно, есть группа, для которой предсказуемое время доставки важнее цены. Core Job: получить продукты домой.', 'job'),
  node('risk', 575, 192, 535, 207, '3 · Следующий риск', 'Неизвестно, влияет ли приоритет времени на реальный выбор. Ищем прошлый случай выбора между ценой и точностью.', 'expectation'),
], [edge('evidence', 'hypothesis', { fromSide: 'bottom', toSide: 'top' }), edge('evidence', 'risk', { fromSide: 'bottom', toSide: 'top' })]);

diagrams['peer-checklist'] = checklist('Взаимная проверка исследовательского вывода: источники, предположения, сходства работ, различия критериев и риск.', [
  'У каждого факта есть источник?', 'Предположения отделены от наблюдений?', 'Работы действительно похожи?',
  'Различия и порядок критериев учтены?', 'Назван самый рискованный следующий шаг?',
]);

export const diagramCatalog = diagrams;

const palette = {
  paper: ['#ffffff', '#c9ccc7'], job: ['#d9eef0', '#4a9098'], solution: ['#e0efdf', '#69946a'],
  expectation: ['#f5e8d3', '#b58b55'], problem: ['#f8dfd8', '#c66852'], accent: ['#f1d7ce', '#d95d39'],
};
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function wrapDiagramText(value, maxWidth, fontSize) {
  const maxUnits = maxWidth / fontSize;
  const width = (text) => [...text].reduce((sum, char) => sum + (/\s/.test(char) ? .29 : /[ЖШЩМЮФW@]/.test(char) ? .86 : /[il.,!:;]/.test(char) ? .28 : .57), 0);
  return String(value).split('\n').flatMap((paragraph) => {
    const lines = []; let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && width(next) > maxUnits) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
    return lines;
  });
}

export function nodeTextLayout(item) {
  let layout;
  for (const scale of [1, .95, .9, .85, .8, .75]) {
    const titleSize = (item.titleSize || 24) * scale;
    const bodySize = (item.bodySize || 20) * scale;
    const title = wrapDiagramText(item.title, item.w - 32, titleSize);
    const body = item.body ? wrapDiagramText(item.body, item.w - 32, bodySize) : [];
    const titleHeight = title.length * titleSize * 1.2;
    const bodyHeight = body.length * bodySize * 1.3;
    layout = { title, body, titleSize, bodySize, height: 24 + titleHeight + (body.length ? 8 + bodyHeight : 0) };
    if (layout.height <= item.h) break;
  }
  return layout;
}

function textLines(lines, x, y, size, bold = false) {
  return `<text x="${x}" y="${y}" font-size="${size}"${bold ? ' font-weight="650"' : ''}>${lines.map((line, i) => `<tspan x="${x}" dy="${i ? size * (bold ? 1.2 : 1.3) : 0}">${escape(line)}</tspan>`).join('')}</text>`;
}

function renderNode(item) {
  const [fill, stroke] = palette[item.tone] || palette.paper;
  const layout = nodeTextLayout(item);
  const y = item.y + 12 + layout.titleSize * .85;
  return `<g data-node="${escape(item.id)}"><rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="12" fill="${fill}" stroke="${stroke}"${item.dashed ? ' stroke-dasharray="7 5"' : ''}/>
    ${textLines(layout.title, item.x + 16, y, layout.titleSize, true)}
    ${textLines(layout.body, item.x + 16, y + layout.title.length * layout.titleSize * 1.2 + 8, layout.bodySize)}</g>`;
}

function anchor(item, side) {
  if (side === 'top') return [item.x + item.w / 2, item.y];
  if (side === 'bottom') return [item.x + item.w / 2, item.y + item.h];
  if (side === 'left') return [item.x, item.y + item.h / 2];
  return [item.x + item.w, item.y + item.h / 2];
}

function renderEdge(item, nodes, markerId) {
  const from = nodes.find((n) => n.id === item.from);
  const to = nodes.find((n) => n.id === item.to);
  if (!from || !to) throw new Error(`Unknown diagram edge: ${item.from} → ${item.to}`);
  const [x1, y1] = anchor(from, item.fromSide || 'right');
  const [x2, y2] = anchor(to, item.toSide || 'left');
  const bend = item.fromSide === 'top' || item.fromSide === 'bottom';
  const path = bend ? `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`
    : `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
  const color = (palette[item.tone] || [null, '#8b928b'])[1];
  const tx = item.labelX ?? (x1 + x2) / 2;
  const ty = item.labelY ?? (y1 + y2) / 2 - 12;
  return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2"${item.dashed ? ' stroke-dasharray="7 5"' : ''} marker-end="url(#${markerId})"/>${item.label ? `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="18" class="diagram-edge-label">${escape(item.label)}</text>` : ''}`;
}

export function renderDiagram(id) {
  const diagram = diagrams[id];
  if (!diagram) throw new Error(`Unknown course diagram: ${id}`);
  const markerId = `arrow-${id}`;
  const content = [
    ...(diagram.groups || []).map((g) => `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="18" fill="${(palette[g.tone] || palette.paper)[0]}" fill-opacity=".45" stroke="#adb5ab" stroke-dasharray="${g.dashed ? '7 5' : '0'}"/>`),
    ...(diagram.lines || []).map((l) => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#8b928b" stroke-width="2"${l.arrow ? ` marker-end="url(#${markerId})"` : ''}/>`),
    ...diagram.edges.map((e) => renderEdge(e, diagram.nodes, markerId)),
    ...diagram.nodes.map(renderNode),
    ...(diagram.labels || []).map((l) => `<text x="${l.x}" y="${l.y}" font-size="${l.size || 17}" fill="#60675f"${l.size ? '' : ' letter-spacing="1"'}>${escape(l.text)}</text>`),
  ].join('');
  return `<figure class="semantic-diagram" data-diagram="${escape(id)}"><svg viewBox="0 0 1120 ${diagram.height}" role="img" aria-labelledby="title-${id} desc-${id}" xmlns="http://www.w3.org/2000/svg"><title id="title-${id}">${escape(diagram.description)}</title><desc id="desc-${id}">${escape(diagram.nodes.map((n) => `${n.title}: ${n.body}`).join('. '))}</desc><defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#788176" stroke-width="1.5"/></marker></defs>${content}</svg></figure>`;
}
