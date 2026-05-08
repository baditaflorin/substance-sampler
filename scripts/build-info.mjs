import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] ?? "docs";
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function command(value, fallback) {
  try {
    return execSync(value, { encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

const info = {
  version: pkg.version,
  commit: command("git rev-parse --short HEAD", "dev"),
  builtAt: new Date().toISOString(),
  repoUrl: "https://github.com/baditaflorin/substance-sampler",
  paypalUrl: "https://www.paypal.com/paypalme/florinbadita"
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`);

const indexFile = join(outDir, "index.html");
const fallbackFile = join(outDir, "404.html");
if (existsSync(indexFile)) {
  copyFileSync(indexFile, fallbackFile);
}
