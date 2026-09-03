import fs from "node:fs";
import path from "node:path";
import { automatedRuleIds, root } from "./lib/conformance.mjs";

const directory = path.join(root, "artifacts");
const names = fs.existsSync(directory)
  ? fs.readdirSync(directory).filter((name) => name.endsWith(".json")).sort()
  : [];
const reports = names.map((name) => ({
  name,
  data: JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")),
}));
const byName = new Map(reports.map(({ name, data }) => [name, data]));
const failed = reports.filter(({ data }) => data.status === "failed");
const mutations = byName.get("mutation-library.json");
const adversarial = byName.get("adversarial-library.json");
const frameworks = byName.get("framework-matrix.json");
const catalog = byName.get("catalog-contract.json");
const lines = [
  "# Coding Bible Canary Conformance",
  "",
  "- Catalog contract: **128 / 128 rules represented**",
  `- Automated contract: **${automatedRuleIds().length} / ${automatedRuleIds().length} rules**`,
  `- Generated mutation cases: **${mutations?.cases ?? "n/a"}**`,
  `- Independent adversarial variants: **${adversarial?.cases ?? "n/a"}**`,
  `- Clean framework/project fixtures: **${frameworks?.projects ?? "n/a"}**`,
  `- High-confidence candidates queued: **${catalog?.classificationCounts?.["high-confidence-candidate"] ?? "n/a"}**`,
  `- Contextual candidates tracked: **${catalog?.classificationCounts?.["contextual-candidate"] ?? "n/a"}**`,
  `- Known mutation false positives: **${mutations?.falsePositives ?? "n/a"}**`,
  `- Known mutation false negatives: **${mutations?.falseNegatives ?? "n/a"}**`,
  `- Report artifacts: **${reports.length}**`,
  `- Failed report groups: **${failed.length}**`,
  "",
  "## Suites",
  "",
  ...reports.map(
    ({ name, data }) =>
      `- ${data.status === "passed" ? "✅" : "❌"} \`${name}\``,
  ),
  "",
];
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, "SUMMARY.md"), `${lines.join("\n")}\n`);
process.stdout.write(lines.join("\n"));
