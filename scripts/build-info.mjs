import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] ?? "docs";
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const outputFile = join(outDir, "build-info.json");

function command(value, fallback) {
  try {
    return execSync(value, { encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

let existing = null;
if (process.env.BUILD_INFO_PRESERVE === "1" && existsSync(outputFile)) {
  existing = JSON.parse(readFileSync(outputFile, "utf8"));
}

const info =
  existing?.version === pkg.version
    ? existing
    : {
        version: pkg.version,
        commit: command("git rev-parse --short HEAD", "dev"),
        builtAt: new Date().toISOString(),
        repoUrl: "https://github.com/baditaflorin/substance-sampler",
        paypalUrl: "https://www.paypal.com/paypalme/florinbadita"
      };

mkdirSync(outDir, { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(info, null, 2)}\n`);

const indexFile = join(outDir, "index.html");
const fallbackFile = join(outDir, "404.html");
if (existsSync(indexFile)) {
  copyFileSync(indexFile, fallbackFile);
}
