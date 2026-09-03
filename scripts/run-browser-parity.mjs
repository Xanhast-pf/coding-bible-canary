import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  assert,
  automatedRuleIds,
  getCodingBibleRoot,
  root,
  sameSet,
  writeArtifact,
} from "./lib/conformance.mjs";

const candidateRoot = getCodingBibleRoot();
const { analyzeBrowserInput } = await import(
  pathToFileURL(
    path.join(candidateRoot, "apps/web/src/analyzer/analyzeBrowserInput.ts"),
  ).href
);
const requireFromCandidate = createRequire(
  pathToFileURL(path.join(candidateRoot, "package.json")),
);
const typescriptLibDirectory = path.dirname(requireFromCandidate.resolve("typescript"));
const libraryFiles = Object.fromEntries(
  fs
    .readdirSync(typescriptLibDirectory)
    .filter((fileName) => /^lib(?:\..+)?\.d\.ts$/u.test(fileName))
    .map((fileName) => [
      fileName,
      fs.readFileSync(path.join(typescriptLibDirectory, fileName), "utf8"),
    ]),
);

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const tsconfig = read("tsconfig.json");
const analyzeProject = (kind) =>
  analyzeBrowserInput(
    {
      files: [
        { fileName: "tsconfig.json", source: tsconfig },
        { fileName: `fixtures/${kind}/types.ts`, source: read(`fixtures/${kind}/types.ts`) },
        {
          fileName: `fixtures/${kind}/all-${kind === "bad" ? "violations" : "clean"}.tsx`,
          source: read(
            `fixtures/${kind}/all-${kind === "bad" ? "violations" : "clean"}.tsx`,
          ),
        },
      ],
      mode: "project",
    },
    libraryFiles,
  );

const bad = analyzeProject("bad");
const good = analyzeProject("good");
const badFindings = bad.files.flatMap(({ result }) => result.findings);
const goodFindings = good.files.flatMap(({ result }) => result.findings);
const badIds = badFindings.map(({ ruleId }) => ruleId);

assert(sameSet(badIds, automatedRuleIds()), `Browser bad fixture did not cover the exact automated contract.\n${JSON.stringify([...new Set(badIds)].sort(), null, 2)}`);
assert(goodFindings.length === 0, `Browser clean fixture produced ${goodFindings.length} findings.`);
assert(bad.configurationDiagnostics.length === 0, `Browser bad fixture produced configuration diagnostics: ${bad.configurationDiagnostics.join(" | ")}`);
assert(good.configurationDiagnostics.length === 0, `Browser good fixture produced configuration diagnostics: ${good.configurationDiagnostics.join(" | ")}`);

writeArtifact("browser-parity.json", {
  analyzer: bad.analyzer,
  bad: { findingCount: badFindings.length, ruleIds: [...new Set(badIds)].sort() },
  good: { findingCount: 0 },
  status: "passed",
});
console.log(`Browser conformance PASS · ${automatedRuleIds().length}/${automatedRuleIds().length} automated rules represented · clean fixture zero findings`);
