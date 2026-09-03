import fs from "node:fs";
import {
  assert,
  automatedRuleIds,
  sameSet,
} from "./lib/conformance.mjs";

const mode = process.argv[2];
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
  assert(rulesChecked === 23, `Clean Action checked ${rulesChecked} rules, expected 23.`);
  console.log("Action clean contract PASS");
  process.exit(0);
}

if (mode === "bad") {
  assert(outcome === "failure", `Bad Action outcome was ${outcome}.`);
  assert(conclusion === "failed", `Bad Action conclusion was ${conclusion}.`);
  assert(findings >= 23 && errors >= 1, "Bad Action fixture was not rejected with findings.");
  assert(diagnostics === 0, "Bad Action fixture produced diagnostics.");
  assert(rulesChecked === 23, `Bad Action checked ${rulesChecked} rules, expected 23.`);
  const sarifPath = process.env.SARIF_PATH;
  assert(sarifPath && fs.existsSync(sarifPath), "Bad Action did not produce SARIF.");
  const sarif = JSON.parse(fs.readFileSync(sarifPath, "utf8"));
  assert(sarif.version === "2.1.0", `Unexpected SARIF version ${sarif.version}.`);
  const actual = (sarif.runs?.[0]?.results ?? []).map(({ ruleId }) => ruleId);
  assert(sameSet(actual, automatedRuleIds()), `Action SARIF automated-rule set drifted.\n${JSON.stringify([...new Set(actual)].sort(), null, 2)}`);
  console.log("Action bad/SARIF contract PASS · 23/23 automated rules represented");
  process.exit(0);
}

throw new Error(`Unknown action assertion mode: ${mode}`);
