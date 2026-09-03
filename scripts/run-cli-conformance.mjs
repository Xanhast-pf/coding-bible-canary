import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  assert,
  automatedRuleIds,
  getCodingBibleRoot,
  normalizeFindings,
  root,
  sameSet,
  writeArtifact,
} from "./lib/conformance.mjs";

const cli = path.join(
  getCodingBibleRoot(),
  "packages/analyzer/bin/coding-bible.mjs",
);

const run = (target) => {
  const result = spawnSync(
    process.execPath,
    [cli, "check", target, "--json", "--no-cache", "--no-baseline"],
    { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Could not parse CLI JSON for ${target}.\nstatus=${result.status}\nstdout=${result.stdout}\nstderr=${result.stderr}`,
    );
  }
  return { report, status: result.status, stderr: result.stderr };
};

const bad = run("fixtures/bad");
const good = run("fixtures/good");
const badIds = bad.report.findings.map(({ ruleId }) => ruleId);

assert(bad.status === 1, `Known-bad CLI fixture should exit 1, got ${bad.status}.`);
assert(good.status === 0, `Known-clean CLI fixture should exit 0, got ${good.status}.`);
assert(sameSet(badIds, automatedRuleIds()), `CLI bad fixture did not cover the exact 23-rule automated contract.\n${JSON.stringify([...new Set(badIds)].sort(), null, 2)}`);
assert(bad.report.summary.rulesChecked === 23, `CLI bad fixture checked ${bad.report.summary.rulesChecked} rules, expected 23.`);
assert(good.report.summary.rulesChecked === 23, `CLI good fixture checked ${good.report.summary.rulesChecked} rules, expected 23.`);
assert(good.report.summary.findings === 0, `CLI good fixture produced ${good.report.summary.findings} findings.`);
assert(good.report.summary.diagnostics === 0, `CLI good fixture produced diagnostics.`);

writeArtifact("cli-parity.json", {
  bad: {
    findings: normalizeFindings(bad.report.findings),
    rulesChecked: bad.report.summary.rulesChecked,
    status: bad.status,
  },
  good: {
    findingCount: good.report.summary.findings,
    rulesChecked: good.report.summary.rulesChecked,
    status: good.status,
  },
  status: "passed",
});
console.log(`CLI conformance PASS · 23/23 automated rules rejected · clean fixture zero findings`);
