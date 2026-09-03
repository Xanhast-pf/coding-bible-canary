import path from "node:path";
import {
  assert,
  automatedRuleIds,
  contract,
  importCandidate,
  readJson,
  root,
  sameSet,
  writeArtifact,
} from "./lib/conformance.mjs";
import { generatedMutationNames } from "./lib/mutations.mjs";

const expected = contract();
const policy = readJson(path.join(root, "contracts/torture-policy.json"));
const adversarial = readJson(path.join(root, "contracts/adversarial.json"));
const analyzer = await importCandidate("packages/analyzer/src/index.ts");

const expectedAutomated = automatedRuleIds();
const candidateAutomated = [...analyzer.analyzerRuleIds].sort();
assert(
  sameSet(candidateAutomated, expectedAutomated),
  [
    "Detector promotion gate failed.",
    "The candidate analyzer automated-rule set differs from Canary's independent contract.",
    "Add canonical + adversarial Canary coverage and explicitly promote the rule contract before merging a new detector.",
    `Expected: ${expectedAutomated.join(", ")}`,
    `Actual:   ${candidateAutomated.join(", ")}`,
  ].join("\n"),
);

assert(
  expectedAutomated.length === policy.automatedRuleCount,
  `Promotion policy denominator ${policy.automatedRuleCount} != ${expectedAutomated.length}.`,
);
assert(
  generatedMutationNames.length >= 4,
  "Promotion gate requires at least four generated mutation operators.",
);

const adversarialCounts = new Map(expectedAutomated.map((ruleId) => [ruleId, 0]));
for (const testCase of adversarial.cases) {
  for (const ruleId of testCase.forbid ?? []) {
    if (adversarialCounts.has(ruleId)) {
      adversarialCounts.set(ruleId, adversarialCounts.get(ruleId) + 1);
    }
  }
}

const failures = [];
for (const rule of expected.rules.filter(
  ({ coverage }) => coverage === "automated",
)) {
  const missingConsumers = policy.requiredConsumers.filter(
    (consumer) => !rule.consumers.includes(consumer),
  );
  const independentAdversarialCases = adversarialCounts.get(rule.ruleId) ?? 0;
  if (
    !rule.canonicalExamplesRequired ||
    missingConsumers.length ||
    independentAdversarialCases <
      policy.minimumIndependentAdversarialCasesPerAutomatedRule
  ) {
    failures.push({
      canonicalExamplesRequired: rule.canonicalExamplesRequired,
      independentAdversarialCases,
      missingConsumers,
      ruleId: rule.ruleId,
    });
  }
}

writeArtifact("promotion-gates.json", {
  automatedRules: expectedAutomated.length,
  generatedMutationOperators: generatedMutationNames.length,
  minimumIndependentAdversarialCasesPerRule:
    policy.minimumIndependentAdversarialCasesPerAutomatedRule,
  failures,
  status: failures.length ? "failed" : "passed",
});
assert(
  !failures.length,
  `Detector promotion prerequisites failed:\n${JSON.stringify(failures, null, 2)}`,
);
console.log(
  `Promotion gates PASS · ${expectedAutomated.length}/${policy.automatedRuleCount} automated rules have canonical, adversarial, mutation, and consumer contracts`,
);
