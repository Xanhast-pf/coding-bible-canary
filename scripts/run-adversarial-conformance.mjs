import path from "node:path";
import {
  assert,
  importCandidate,
  readJson,
  root,
  writeArtifact,
} from "./lib/conformance.mjs";
import {
  expandGeneratedMutations,
  generatedMutationNames,
} from "./lib/mutations.mjs";

const { analyze } = await importCandidate("packages/analyzer/src/index.ts");
const suite = readJson(path.join(root, "contracts/adversarial.json"));
const policy = readJson(path.join(root, "contracts/torture-policy.json"));
const failures = [];
const rows = [];

for (const testCase of suite.cases) {
  const variants = [
    {
      id: `${testCase.id}--base`,
      language: testCase.language,
      mutation: "base",
      source: testCase.source,
    },
    ...expandGeneratedMutations(testCase),
  ];

  for (const variant of variants) {
    const result = analyze({
      fileName: `adversarial/${variant.id}.${variant.language}`,
      language: variant.language,
      source: variant.source,
    });
    const ids = result.findings.map(({ ruleId }) => ruleId);
    const forbidden = testCase.forbid.filter((ruleId) => ids.includes(ruleId));
    const missing = (testCase.expect ?? []).filter(
      (ruleId) => !ids.includes(ruleId),
    );
    const passed = !forbidden.length && !missing.length;
    const row = {
      findings: ids,
      forbidden,
      id: variant.id,
      missing,
      mutation: variant.mutation,
      passed,
    };
    rows.push(row);
    if (!passed) failures.push(row);
  }
}

const variantsPerCase = generatedMutationNames.length + 1;
const expectedCases = suite.cases.length * variantsPerCase;
assert(
  rows.length === expectedCases,
  `Adversarial denominator drifted: ${rows.length} != ${expectedCases}.`,
);
assert(
  suite.cases.length === policy.independentAdversarialBaseCases,
  `Adversarial base denominator ${suite.cases.length} != ${policy.independentAdversarialBaseCases}.`,
);
assert(
  expectedCases === policy.independentAdversarialCasesWithVariants,
  `Adversarial variant denominator ${expectedCases} != ${policy.independentAdversarialCasesWithVariants}.`,
);

writeArtifact("adversarial-library.json", {
  baseCases: suite.cases.length,
  cases: rows.length,
  failures,
  status: failures.length ? "failed" : "passed",
  variantsPerBaseCase: variantsPerCase,
});
assert(
  !failures.length,
  `Adversarial cases failed:\n${JSON.stringify(failures, null, 2)}`,
);
console.log(
  `Adversarial library PASS · ${rows.length}/${expectedCases} independent negative/near-neighbor variants`,
);
