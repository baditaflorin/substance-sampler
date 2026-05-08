import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const docs = join(root, "docs");
const generated = [
  "assets",
  "index.html",
  "404.html",
  "favicon.svg",
  "manifest.webmanifest",
  "sw.js",
  "build-info.json"
];

for (const entry of generated) {
  const target = join(docs, entry);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}
