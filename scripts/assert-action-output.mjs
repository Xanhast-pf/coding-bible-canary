import fs from "node:fs";
import {
  assert,
  automatedRuleIds,
  sameSet,
} from "./lib/conformance.mjs";

const mode = process.argv[2];
const expectedContractPath = process.env.EXPECTED_RULE_CONTRACT;
const expectedRuleIds = expectedContractPath
  ? JSON.parse(fs.readFileSync(expectedContractPath, "utf8")).ruleIds.toSorted()
  : automatedRuleIds();
const expectedRuleCount = expectedRuleIds.length;
const findings = Number(process.env.FINDINGS ?? -1);
const errors = Number(process.env.ERRORS ?? -1);
const warnings = Number(process.env.WARNINGS ?? -1);
const diagnostics = Number(process.env.DIAGNOSTICS ?? -1);
const rulesChecked = Number(process.env.RULES_CHECKED ?? -1);
const outcome = process.env.OUTCOME;
const conclusion = process.env.CONCLUSION;

if (mode === "good") {
  assert(outcome === "success", `Clean Action outcome was ${outcome}.`);
  assert(conclusion === "passed", `Clean Action conclusion was ${conclusion}.`);
  assert(findings === 0 && errors === 0 && warnings === 0, "Clean Action fixture produced findings.");
  assert(diagnostics === 0, "Clean Action fixture produced diagnostics.");
  assert(rulesChecked === expectedRuleCount, `Clean Action checked ${rulesChecked} rules, expected ${expectedRuleCount}.`);
  console.log("Action clean contract PASS");
  process.exit(0);
}

if (mode === "bad") {
  assert(outcome === "failure", `Bad Action outcome was ${outcome}.`);
  assert(conclusion === "failed", `Bad Action conclusion was ${conclusion}.`);
  assert(findings >= expectedRuleCount && errors >= 1, "Bad Action fixture was not rejected with findings.");
  assert(diagnostics === 0, "Bad Action fixture produced diagnostics.");
  assert(rulesChecked === expectedRuleCount, `Bad Action checked ${rulesChecked} rules, expected ${expectedRuleCount}.`);
  const sarifPath = process.env.SARIF_PATH;
  assert(sarifPath && fs.existsSync(sarifPath), "Bad Action did not produce SARIF.");
  const sarif = JSON.parse(fs.readFileSync(sarifPath, "utf8"));
  assert(sarif.version === "2.1.0", `Unexpected SARIF version ${sarif.version}.`);
  const actual = (sarif.runs?.[0]?.results ?? []).map(({ ruleId }) => ruleId);
  assert(sameSet(actual, expectedRuleIds), `Action SARIF automated-rule set drifted.\nExpected: ${JSON.stringify(expectedRuleIds, null, 2)}\nActual: ${JSON.stringify([...new Set(actual)].sort(), null, 2)}`);
  console.log(`Action bad/SARIF contract PASS · ${expectedRuleCount}/${expectedRuleCount} automated rules represented`);
  process.exit(0);
}

throw new Error(`Unknown action assertion mode: ${mode}`);
