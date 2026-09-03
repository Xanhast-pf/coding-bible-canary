import path from "node:path";
import {
  assert,
  importCandidate,
  readJson,
  root,
  writeArtifact,
} from "./lib/conformance.mjs";

const { analyze } = await importCandidate("packages/analyzer/src/index.ts");
const suite = readJson(path.join(root, "contracts/adversarial.json"));
const failures = [];
const rows = [];

for (const testCase of suite.cases) {
  const result = analyze({
    fileName: `adversarial/${testCase.id}.${testCase.language}`,
    language: testCase.language,
    source: testCase.source,
  });
  const ids = result.findings.map(({ ruleId }) => ruleId);
  const forbidden = testCase.forbid.filter((ruleId) => ids.includes(ruleId));
  const missing = (testCase.expect ?? []).filter((ruleId) => !ids.includes(ruleId));
  const passed = !forbidden.length && !missing.length;
  rows.push({ id: testCase.id, findings: ids, forbidden, missing, passed });
  if (!passed) failures.push(rows.at(-1));
}

writeArtifact("adversarial-library.json", {
  cases: rows.length,
  failures,
  status: failures.length ? "failed" : "passed",
});
assert(!failures.length, `Adversarial cases failed:\n${JSON.stringify(failures, null, 2)}`);
console.log(`Adversarial library PASS · ${rows.length}/${rows.length} negative/near-neighbor cases`);
