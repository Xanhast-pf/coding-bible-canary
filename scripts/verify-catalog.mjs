import {
  assert,
  automatedRuleIds,
  candidateRulesPath,
  contract,
  importCandidate,
  readJson,
  sameSet,
  writeArtifact,
} from "./lib/conformance.mjs";

const expected = contract();
const catalog = readJson(candidateRulesPath());
const contractIds = expected.rules.map(({ ruleId }) => ruleId);
const catalogIds = catalog.rules.map(({ id }) => id);

assert(expected.catalogRuleCount === 128, "Canary contract must represent 128 rules.");
assert(expected.rules.length === 128, `Expected 128 contract entries, got ${expected.rules.length}.`);
assert(new Set(contractIds).size === contractIds.length, "Canary rule contracts contain duplicate IDs.");
assert(catalog.ruleCount === 128, `Candidate catalog reports ${catalog.ruleCount} rules, expected 128.`);
assert(sameSet(contractIds, catalogIds), "Candidate rule catalog IDs differ from the independent canary contract.");

for (const rule of catalog.rules) {
  assert(typeof rule.title === "string" && rule.title.trim(), `${rule.id} is missing title.`);
  assert(typeof rule.summary === "string" && rule.summary.trim(), `${rule.id} is missing summary.`);
  assert(typeof rule.rationale === "string" && rule.rationale.trim(), `${rule.id} is missing rationale.`);
  assert(typeof rule.bad?.code === "string" && rule.bad.code.trim(), `${rule.id} is missing canonical DON'T code.`);
  assert(typeof rule.good?.code === "string" && rule.good.code.trim(), `${rule.id} is missing canonical DO code.`);
}

const analyzer = await importCandidate("packages/analyzer/src/index.ts");
const candidateAutomated = [...analyzer.analyzerRuleIds].sort();
const expectedAutomated = automatedRuleIds();
assert(expected.automatedRuleCount === 23, "Canary automated rule denominator must be 23.");
assert(
  sameSet(candidateAutomated, expectedAutomated),
  `Candidate automated rule set drifted.\nExpected: ${expectedAutomated.join(", ")}\nActual:   ${candidateAutomated.join(", ")}`,
);

const report = {
  catalogRules: catalogIds.length,
  automatedRules: candidateAutomated.length,
  catalogOnlyRules: expected.rules.filter(({ coverage }) => coverage === "catalog-only").length,
  status: "passed",
};
writeArtifact("catalog-contract.json", report);
console.log(`Catalog contract PASS · ${report.catalogRules}/128 rules represented · ${report.automatedRules}/23 automated`);
