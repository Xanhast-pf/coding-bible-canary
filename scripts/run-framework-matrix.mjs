import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  assert,
  getCodingBibleRoot,
  readJson,
  root,
  writeArtifact,
} from "./lib/conformance.mjs";

const contract = readJson(path.join(root, "contracts/framework-projects.json"));
const cli = path.join(
  getCodingBibleRoot(),
  "packages/analyzer/bin/coding-bible.mjs",
);
const rows = [];
const failures = [];

for (const fixture of contract.projects) {
  const result = spawnSync(
    process.execPath,
    [cli, "check", fixture.path, "--json", "--no-cache", "--no-baseline"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    },
  );

  let report = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    failures.push({
      ecosystem: fixture.ecosystem,
      id: fixture.id,
      reason: "unparseable-report",
      status: result.status,
      stderr: result.stderr,
    });
    continue;
  }

  const row = {
    diagnostics: report.summary.diagnostics,
    ecosystem: fixture.ecosystem,
    filesAnalyzed: report.summary.filesAnalyzed,
    findingCount: report.summary.findings,
    findings: report.findings.map(({ file, ruleId }) => ({
      file: file.replaceAll("\\", "/"),
      ruleId,
    })),
    id: fixture.id,
    rulesChecked: report.summary.rulesChecked,
    status: result.status,
  };
  rows.push(row);

  if (
    result.status !== 0 ||
    report.summary.findings !== 0 ||
    report.summary.diagnostics !== 0 ||
    report.summary.filesAnalyzed < fixture.minimumSourceFiles ||
    report.summary.rulesChecked <= 0
  ) {
    failures.push(row);
  }
}

assert(
  rows.length + failures.filter(({ reason }) => reason).length ===
    contract.projects.length,
  "Framework project denominator drifted.",
);

writeArtifact("framework-matrix.json", {
  failures,
  projects: contract.projects.length,
  rows,
  status: failures.length ? "failed" : "passed",
});
assert(
  !failures.length,
  `Framework/project matrix failed:\n${JSON.stringify(failures, null, 2)}`,
);
console.log(
  `Framework/project matrix PASS · ${rows.length}/${contract.projects.length} clean ecosystem projects`,
);
