import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { parseLecture, renderMarkdown, sourceImageUrl } from '../app/lib.js';

test('lecture screenshots have both original PNGs and deployable lossless WebP assets', async () => {
  let count = 0;
  for (let lesson = 1; lesson <= 5; lesson++) {
    const path = new URL(`../07-teaching-kit/lesson-${String(lesson).padStart(2, '0')}/01-slides.md`, import.meta.url);
    const source = await readFile(path, 'utf8');
    assert.doesNotMatch(source, /:::diagram/, `lesson ${lesson} still uses an authored diagram`);
    for (const slide of parseLecture(source).slides) {
      for (const [, description, asset] of slide.body.matchAll(/!\[([^\]]+)\]\((\/app\/assets\/[^)]+\.png)\)/g)) {
        assert.ok(description.length > 20, 'source attribution must be present');
        for (const extension of ['png', 'webp']) {
          const file = new URL(`..${asset.replace(/\.png$/, `.${extension}`)}`, import.meta.url);
          assert.ok((await stat(file)).size > 0, `${asset}: missing ${extension}`);
        }
        const html = renderMarkdown(slide.body);
        assert.match(html, /<img[^>]+alt="[^"]+"/);
        assert.ok(html.includes(sourceImageUrl(asset)));
        count++;
      }
    }
  }
  assert.ok(count >= 40, `only ${count} source screenshots`);
});

test('source image URLs remain under the course directory on GitHub Pages', () => {
  const actual = new URL(sourceImageUrl('/app/assets/zamesin/segmentation-page-21.png'));
  const expected = new URL('../app/assets/zamesin/segmentation-page-21.webp', import.meta.url);
  assert.equal(actual.pathname, expected.pathname);
});
