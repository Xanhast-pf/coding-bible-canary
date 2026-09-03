import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "contracts/rules.json"), "utf8"));
const adversarial = JSON.parse(fs.readFileSync(path.join(root, "contracts/adversarial.json"), "utf8"));
const workflow = fs.readFileSync(path.join(root, ".github/workflows/canary.yml"), "utf8");

test("canary owns a complete 128-rule independent contract", () => {
  assert.equal(contract.catalogRuleCount, 128);
  assert.equal(contract.rules.length, 128);
  assert.equal(new Set(contract.rules.map(({ ruleId }) => ruleId)).size, 128);
  assert.equal(contract.rules.filter(({ coverage }) => coverage === "automated").length, 23);
  assert.equal(contract.rules.filter(({ coverage }) => coverage === "catalog-only").length, 105);
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

test("workflow tests candidate and immutable v0.27.0 without stale v0.25 references", () => {
  assert.match(workflow, /uses: \.\/\.coding-bible-under-test/u);
  assert.match(workflow, /uses: Xanhast-pf\/coding-bible@v0\.27\.0/u);
  assert.doesNotMatch(workflow, /v0\.25\.0/u);
  assert.match(workflow, /repository_dispatch:/u);
});
