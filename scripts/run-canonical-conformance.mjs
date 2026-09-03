import {
  assert,
  automatedRuleIds,
  candidateRulesPath,
  extensionForLanguage,
  importCandidate,
  readJson,
  writeArtifact,
} from "./lib/conformance.mjs";

const { analyze } = await importCandidate("packages/analyzer/src/index.ts");
const catalog = readJson(candidateRulesPath());
const byId = new Map(catalog.rules.map((rule) => [rule.id, rule]));
const failures = [];
const rows = [];

for (const ruleId of automatedRuleIds()) {
  const rule = byId.get(ruleId);
  assert(rule, `Missing ${ruleId} from candidate catalog.`);
  for (const variant of ["bad", "good"]) {
    const example = rule[variant];
    const extension = extensionForLanguage(example.language);
    const result = analyze({
      fileName: `canonical/${ruleId}.${variant}.${extension}`,
      language: example.language,
      source: example.code,
    });
    const ids = result.findings.map(({ ruleId: found }) => found);
    const passed =
      variant === "bad" ? ids.includes(ruleId) : result.findings.length === 0;
    rows.push({
      diagnostics: result.diagnostics.length,
      findingCount: result.findings.length,
      findings: ids,
      passed,
      ruleId,
      variant,
    });
    if (!passed) failures.push(rows.at(-1));
  }
}

writeArtifact("canonical-library.json", {
  automatedRules: automatedRuleIds().length,
  cases: rows.length,
  failures,
  status: failures.length ? "failed" : "passed",
});
assert(!failures.length, `Canonical analyzer contracts failed:\n${JSON.stringify(failures, null, 2)}`);
console.log(`Canonical library PASS · ${rows.length}/${automatedRuleIds().length * 2} cases`);
