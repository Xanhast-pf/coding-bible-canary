import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assert,
  getCodingBibleRoot,
  writeArtifact,
} from "./lib/conformance.mjs";

const fileCount = Number(process.env.CANARY_PERF_FILES ?? 1000);
const maxMs = Number(process.env.CANARY_PERF_MAX_MS ?? 30000);
const cli = path.join(getCodingBibleRoot(), "packages/analyzer/bin/coding-bible.mjs");
const project = fs.mkdtempSync(path.join(os.tmpdir(), "coding-bible-canary-perf-"));

try {
  fs.mkdirSync(path.join(project, "src"), { recursive: true });
  for (let index = 0; index < fileCount; index += 1) {
    fs.writeFileSync(
      path.join(project, "src", `file-${index}.ts`),
      `export const value${index} = ${index};\n`,
    );
  }
  fs.writeFileSync(
    path.join(project, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { strict: true, noEmit: true }, include: ["src/**/*.ts"] }),
  );
  const started = performance.now();
  const result = spawnSync(
    process.execPath,
    [cli, "check", ".", "--json", "--no-cache", "--no-baseline"],
    { cwd: project, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const durationMs = performance.now() - started;
  const report = JSON.parse(result.stdout);
  assert(result.status === 0, `Performance fixture failed with exit ${result.status}: ${result.stderr}`);
  assert(report.summary.findings === 0, `Performance fixture produced ${report.summary.findings} findings.`);
  assert(report.summary.filesAnalyzed === fileCount, `Expected ${fileCount} files analyzed, got ${report.summary.filesAnalyzed}.`);
  assert(durationMs <= maxMs, `Performance regression: ${durationMs.toFixed(0)}ms > ${maxMs}ms for ${fileCount} files.`);
  writeArtifact("performance.json", { durationMs, fileCount, maxMs, status: "passed" });
  console.log(`Performance PASS · ${fileCount} files · ${durationMs.toFixed(0)}ms <= ${maxMs}ms`);
} finally {
  fs.rmSync(project, { recursive: true, force: true });
}
