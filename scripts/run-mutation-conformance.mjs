import {
  assert,
  automatedRuleIds,
  candidateRulesPath,
  extensionForLanguage,
  importCandidate,
  readJson,
  writeArtifact,
} from "./lib/conformance.mjs";
import {
  expandGeneratedMutations,
  generatedMutationNames,
} from "./lib/mutations.mjs";

const { analyze } = await importCandidate("packages/analyzer/src/index.ts");
const catalog = readJson(candidateRulesPath());
const policy = readJson(new URL("../contracts/torture-policy.json", import.meta.url));
const byId = new Map(catalog.rules.map((rule) => [rule.id, rule]));
const failures = [];
const rows = [];

for (const ruleId of automatedRuleIds()) {
  const rule = byId.get(ruleId);
  assert(rule, `Missing ${ruleId} from candidate catalog.`);

  for (const variant of ["bad", "good"]) {
    const example = rule[variant];
    const extension = extensionForLanguage(example.language);
    for (const mutation of expandGeneratedMutations({
      id: `${ruleId}-${variant}`,
      language: example.language,
      source: example.code,
    })) {
      const result = analyze({
        fileName: `mutations/${mutation.id}.${extension}`,
        language: example.language,
        source: mutation.source,
      });
      const ids = result.findings.map(({ ruleId: found }) => found);
      const targeted = ids.includes(ruleId);
      const passed = variant === "bad" ? targeted : !targeted;
      const row = {
        diagnostics: result.diagnostics.length,
        findingCount: result.findings.length,
        findings: ids,
        mutation: mutation.mutation,
        passed,
        ruleId,
        variant,
      };
      rows.push(row);
      if (!passed) failures.push(row);
    }
  }
}

const expectedCases =
  automatedRuleIds().length * generatedMutationNames.length * 2;
assert(
  rows.length === expectedCases,
  `Mutation denominator drifted: ${rows.length} != ${expectedCases}.`,
);
assert(
  expectedCases === policy.generatedMutationCases,
  `Mutation policy denominator ${policy.generatedMutationCases} != ${expectedCases}.`,
);

writeArtifact("mutation-library.json", {
  automatedRules: automatedRuleIds().length,
  cases: rows.length,
  failures,
  falseNegatives: failures.filter(({ variant }) => variant === "bad").length,
  falsePositives: failures.filter(({ variant }) => variant === "good").length,
  mutationsPerCanonicalSide: generatedMutationNames.length,
  status: failures.length ? "failed" : "passed",
});
assert(
  !failures.length,
  `Generated mutation contracts failed:\n${JSON.stringify(failures, null, 2)}`,
);
console.log(
  `Mutation torture PASS · ${rows.length}/${expectedCases} generated violation/repair variants`,
);
