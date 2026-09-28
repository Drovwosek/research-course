import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname } from "node:path";

const root = new URL("../", import.meta.url);
const output = new URL("dist/", root);
const version = process.env.GITHUB_SHA?.slice(0, 12) || Date.now().toString(36);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

// Publish only player assets and the lesson files that the player loads.
await cp(new URL("app/", root), new URL("app/", output), {
  recursive: true,
  filter: (source) => !extname(source) || /\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/.test(source),
});
const html = await readFile(new URL("app/index.html", root), "utf8");
await writeFile(new URL("index.html", output), html.replaceAll('="/app/', '="./app/').replace(/(\.css|\.js)"/g, `$1?v=${version}"`));
for (const file of await readdir(new URL("app/", output))) {
  if (!file.endsWith(".js")) continue;
  const path = new URL(`app/${file}`, output);
  const js = await readFile(path, "utf8");
  await writeFile(path, js.replaceAll("__COURSE_BUILD__", version).replace(/(from\s+["']\.\/[^"']+\.js)(["'])/g, `$1?v=${version}$2`));
}
await writeFile(new URL(".nojekyll", output), "");

for (let lesson = 1; lesson <= 5; lesson++) {
  const folder = `07-teaching-kit/lesson-${String(lesson).padStart(2, "0")}/`;
  await mkdir(new URL(folder, output), { recursive: true });
  for (const file of ["01-slides.md", "02-speaker-notes.md"]) {
    await cp(new URL(folder + file, root), new URL(folder + file, output));
  }
}
console.log("Built static course in dist/");
