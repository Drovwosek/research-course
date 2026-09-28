import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { diagramCatalog, nodeTextLayout, renderDiagram } from '../app/diagrams.js';
import { parseLecture, renderMarkdown } from '../app/lib.js';

test('every authored diagram is available and renders as an accessible SVG', async () => {
  const used = new Set();
  for (let lesson = 1; lesson <= 5; lesson++) {
    const path = new URL(`../07-teaching-kit/lesson-${String(lesson).padStart(2, '0')}/01-slides.md`, import.meta.url);
    for (const slide of parseLecture(await readFile(path, 'utf8')).slides) {
      const html = renderMarkdown(slide.body);
      assert.doesNotMatch(html, /:::diagram/);
      for (const [, id] of slide.body.matchAll(/^:::diagram (\S+)$/gm)) {
        used.add(id);
        assert.ok(diagramCatalog[id], `missing ${id}`);
        assert.match(html, /role="img" aria-labelledby=/);
        assert.match(html, /<title[^>]*>.+<\/title>/);
      }
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(diagramCatalog).sort(), 'no orphan illustrations');
});

test('diagram nodes fit the canvas and do not overlap or overflow their text boxes', () => {
  for (const [id, diagram] of Object.entries(diagramCatalog)) {
    assert.doesNotThrow(() => renderDiagram(id), id);
    for (const [i, n] of diagram.nodes.entries()) {
      assert.ok(n.x >= 0 && n.y >= 0 && n.x + n.w <= 1120 && n.y + n.h <= diagram.height, `${id}/${n.id}: outside canvas`);
      assert.ok(nodeTextLayout(n).height <= n.h, `${id}/${n.id}: text exceeds card`);
      for (const other of diagram.nodes.slice(i + 1)) {
        const intersects = n.x < other.x + other.w && n.x + n.w > other.x && n.y < other.y + other.h && n.y + n.h > other.y;
        assert.equal(intersects, false, `${id}: ${n.id} overlaps ${other.id}`);
      }
    }
  }
});

test('the practice hierarchy preserves sibling Small Jobs and subordinate Micro Jobs', () => {
  const nodes = diagramCatalog['graph-practice'].nodes;
  const core = nodes.find(n => n.id === 'core');
  const small = nodes.find(n => n.id === 'small');
  const big = nodes.find(n => n.id === 'big');
  assert.equal(core.y, small.y);
  assert.ok(big.y < core.y);
  assert.ok(nodes.filter(n => n.id.startsWith('micro')).every(n => n.y > core.y));
});
