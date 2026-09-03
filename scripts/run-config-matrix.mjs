import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assert,
  getCodingBibleRoot,
  writeArtifact,
} from "./lib/conformance.mjs";

const cli = path.join(getCodingBibleRoot(), "packages/analyzer/bin/coding-bible.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "coding-bible-canary-config-"));
const rows = [];

const write = (project, relativePath, source) => {
  const destination = path.join(project, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, source);
};
const run = (project, extra = []) => {
  const result = spawnSync(
    process.execPath,
    [cli, "check", ".", "--json", "--no-baseline", ...extra],
    { cwd: project, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  let report = null;
  if (result.stdout.trim()) report = JSON.parse(result.stdout);
  return { report, status: result.status, stderr: result.stderr };
};

try {
  {
    const project = path.join(tempRoot, "severity");
    write(project, "coding-bible.config.json", JSON.stringify({
      include: ["src/**/*"],
      ignore: ["src/ignored/**"],
      packs: { typescript: "warning" },
      overrides: [{ files: ["src/strict/**"], rules: { "TS-001": "error" } }],
    }));
    write(project, "src/warning.ts", "const value: any = 1;\n");
    write(project, "src/strict/error.ts", "const value: any = 1;\n");
    write(project, "src/ignored/debt.ts", "const value: any = 1;\n");
    const result = run(project);
    assert(result.status === 1, "Severity/override matrix should fail on the error finding.");
    const found = result.report.findings.map(({ file, ruleId, severity }) => [file.replaceAll("\\", "/"), ruleId, severity]);
    assert(found.some(([file, id, severity]) => file.endsWith("src/warning.ts") && id === "TS-001" && severity === "warning"), "Expected TS-001 warning override.");
    assert(found.some(([file, id, severity]) => file.endsWith("src/strict/error.ts") && id === "TS-001" && severity === "error"), "Expected TS-001 strict error override.");
    assert(!found.some(([file]) => file.includes("ignored")), "Ignored source leaked into findings.");
    rows.push({ case: "severity-include-ignore-override", status: "passed" });
  }

  {
    const project = path.join(tempRoot, "selection");
    write(project, "sample.ts", "const value: any = parseInt(raw, 10);\n");
    const result = run(project, ["--rules", "TS-001"]);
    assert(result.status === 1, "Rule-selection fixture should fail TS-001.");
    assert(result.report.summary.rulesChecked === 1, `Expected one selected rule, got ${result.report.summary.rulesChecked}.`);
    assert(result.report.findings.length === 1 && result.report.findings[0].ruleId === "TS-001", "Rule allowlist leaked another finding.");
    rows.push({ case: "rule-selection", status: "passed" });
  }

  {
    const project = path.join(tempRoot, "custom-rulebook");
    write(project, "coding-bible.config.json", JSON.stringify({
      customRuleFiles: ["config/company.json"],
      rules: { "ACME-001": "warning" },
    }));
    write(project, "config/company.json", JSON.stringify({
      formatVersion: 1,
      name: "canary-company",
      rules: [{
        confidence: "certain",
        id: "ACME-001",
        impact: "high",
        match: { kind: "import", source: "@vendor/raw-analytics" },
        message: "Do not import the raw client.",
        rationale: "Company boundary.",
        suggestion: "Use @company/analytics.",
        title: "Use company analytics",
      }],
    }));
    write(project, "src/bad.ts", 'import analytics from "@vendor/raw-analytics"; void analytics;\n');
    const result = run(project);
    assert(result.status === 0, `Warning-only custom policy should exit 0, got ${result.status}.`);
    const finding = result.report.findings.find(({ ruleId }) => ruleId === "ACME-001");
    assert(finding?.severity === "warning", "Custom rulebook warning was not preserved.");
    rows.push({ case: "custom-rulebook", status: "passed" });
  }

  {
    const project = path.join(tempRoot, "malformed");
    write(project, "broken.ts", "export const broken = (\n");
    const result = run(project);
    assert(result.status === 1, "Malformed source should exit 1.");
    assert(result.report.summary.diagnostics > 0, "Malformed source produced no diagnostics.");
    rows.push({ case: "malformed-source", status: "passed" });
  }

  {
    const project = path.join(tempRoot, "cache");
    write(project, "src/clean.ts", "export const value = 1;\n");
    const first = run(project, []);
    const second = run(project, []);
    assert(first.status === 0 && second.status === 0, "Cache fixture should remain clean.");
    assert(second.report.summary.cacheHits >= first.report.summary.cacheHits, "Warm scan did not preserve/increase cache hits.");
    rows.push({ case: "cache-warm-scan", status: "passed", firstHits: first.report.summary.cacheHits, secondHits: second.report.summary.cacheHits });
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

writeArtifact("config-matrix.json", { cases: rows, status: "passed" });
console.log(`Config matrix PASS · ${rows.length}/${rows.length} cases`);
