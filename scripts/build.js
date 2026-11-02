import { mkdir, cp, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const target = resolve("dist");
if (dirname(target) !== process.cwd()) throw new Error("Export outside project");
await rm(target, { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const file of ["index.html", "style.css", "src", "favicon.svg"])
  await cp(file, `dist/${file}`, { recursive: true });
console.log(
  "Static export complete. No dependencies or environment variables.",
);
