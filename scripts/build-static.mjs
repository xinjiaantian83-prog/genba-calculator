import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(projectRoot, "dist");

const entries = [
  "index.html",
  "privacy.html",
  "css",
  "js",
  "assets",
  "icons",
];

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(projectRoot, entry);
  const target = path.join(distDir, entry);

  try {
    await stat(source);
  } catch {
    continue;
  }

  await cp(source, target, { recursive: true });
}

console.log(`Built static app in ${path.relative(projectRoot, distDir)}`);
