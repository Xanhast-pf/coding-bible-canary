import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "contracts/rules.json"), "utf8"));
const adversarial = JSON.parse(fs.readFileSync(path.join(root, "contracts/adversarial.json"), "utf8"));
const torture = JSON.parse(fs.readFileSync(path.join(root, "contracts/torture-policy.json"), "utf8"));
const automationMatrix = JSON.parse(fs.readFileSync(path.join(root, "contracts/automation-matrix.json"), "utf8"));
const releaseV027 = JSON.parse(fs.readFileSync(path.join(root, "contracts/releases/v0.27.0.json"), "utf8"));
const frameworks = JSON.parse(fs.readFileSync(path.join(root, "contracts/framework-projects.json"), "utf8"));
const workflow = fs.readFileSync(path.join(root, ".github/workflows/canary.yml"), "utf8");

test("canary owns a complete 128-rule independent contract", () => {
  assert.equal(contract.catalogRuleCount, 128);
  assert.equal(contract.rules.length, 128);
  assert.equal(new Set(contract.rules.map(({ ruleId }) => ruleId)).size, 128);
  assert.equal(contract.rules.filter(({ coverage }) => coverage === "automated").length, 27);
  assert.equal(contract.rules.filter(({ coverage }) => coverage === "catalog-only").length, 101);
});

test("adversarial cases reference only automated rule IDs", () => {
  const automated = new Set(
    contract.rules.filter(({ coverage }) => coverage === "automated").map(({ ruleId }) => ruleId),
  );
  assert.equal(new Set(adversarial.cases.map(({ id }) => id)).size, adversarial.cases.length);
  for (const testCase of adversarial.cases) {
    for (const ruleId of [...(testCase.forbid ?? []), ...(testCase.expect ?? [])]) {
      assert.equal(automated.has(ruleId), true, `${testCase.id} references non-automated ${ruleId}`);
    }
  }
});

test("every automated rule has an independent adversarial base contract", () => {
  const automated = contract.rules
    .filter(({ coverage }) => coverage === "automated")
    .map(({ ruleId }) => ruleId);
  const counts = new Map(automated.map((ruleId) => [ruleId, 0]));
  for (const testCase of adversarial.cases) {
    for (const ruleId of testCase.forbid ?? []) {
      if (counts.has(ruleId)) counts.set(ruleId, counts.get(ruleId) + 1);
    }
  }
  for (const ruleId of automated) {
    assert.ok(
      counts.get(ruleId) >= torture.minimumIndependentAdversarialCasesPerAutomatedRule,
      `${ruleId} has no independent adversarial base case`,
    );
  }
});

test("torture policy has four mutation operators and nine ecosystem projects", () => {
  assert.equal(torture.automatedRuleCount, 27);
  assert.equal(torture.canonicalCases, 54);
  assert.equal(torture.generatedVariants.length, 4);
  assert.equal(torture.generatedMutationCases, 216);
  assert.equal(torture.independentAdversarialBaseCases, 27);
  assert.equal(torture.independentAdversarialCasesWithVariants, 135);
  assert.equal(frameworks.projects.length, 9);
  assert.equal(new Set(frameworks.projects.map(({ id }) => id)).size, 9);
});


test("automation matrix independently classifies all 128 rules", () => {
  assert.equal(automationMatrix.catalogRuleCount, 128);
  assert.equal(automationMatrix.rules.length, 128);
  assert.equal(
    new Set(automationMatrix.rules.map(({ ruleId }) => ruleId)).size,
    128,
  );
  const automated = automationMatrix.rules
    .filter(({ status }) => status === "automated")
    .map(({ ruleId }) => ruleId)
    .sort();
  const contracted = contract.rules
    .filter(({ coverage }) => coverage === "automated")
    .map(({ ruleId }) => ruleId)
    .sort();
  assert.deepEqual(automated, contracted);
});

test("published v0.27.0 keeps its frozen 23-rule release contract", () => {
  assert.equal(releaseV027.releaseRef, "v0.27.0");
  assert.equal(releaseV027.automatedRuleCount, 23);
  assert.equal(releaseV027.ruleIds.length, 23);
  assert.equal(new Set(releaseV027.ruleIds).size, 23);
});

test("workflow tests candidate and immutable v0.27.0 without stale v0.25 references", () => {
  assert.match(workflow, /uses: \.\/\.coding-bible-under-test/u);
  assert.match(workflow, /uses: Xanhast-pf\/coding-bible@v0\.27\.0/u);
  assert.doesNotMatch(workflow, /v0\.25\.0/u);
  assert.match(workflow, /repository_dispatch:/u);
  assert.match(workflow, /verify-promotion-gates\.mjs/u);
  assert.match(workflow, /run-mutation-conformance\.mjs/u);
  assert.match(workflow, /run-framework-matrix\.mjs/u);
  assert.match(workflow, /Framework Action parity/u);
  assert.match(workflow, /fixtures\/frameworks\/\$\{\{ matrix\.project \}\}/u);
});
