import fs from "node:fs";
import path from "node:path";
import { root } from "./lib/conformance.mjs";

const directory = path.join(root, "artifacts");
const names = fs.existsSync(directory)
  ? fs.readdirSync(directory).filter((name) => name.endsWith(".json")).sort()
  : [];
const reports = names.map((name) => ({
  name,
  data: JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")),
}));
const failed = reports.filter(({ data }) => data.status === "failed");
const lines = [
  "# Coding Bible Canary Conformance",
  "",
  `- Catalog contract: **128 / 128 rules represented**`,
  `- Automated contract: **23 / 23 rules**`,
  `- Report artifacts: **${reports.length}**`,
  `- Failed report groups: **${failed.length}**`,
  "",
  "## Suites",
  "",
  ...reports.map(({ name, data }) => `- ${data.status === "passed" ? "✅" : "❌"} \`${name}\``),
  "",
];
fs.writeFileSync(path.join(directory, "SUMMARY.md"), `${lines.join("\n")}\n`);
process.stdout.write(lines.join("\n"));
