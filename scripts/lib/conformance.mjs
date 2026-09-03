import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const root = path.resolve(new URL("../..", import.meta.url).pathname);

export const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, "utf8"));

export const contract = () => readJson(path.join(root, "contracts/rules.json"));

export const automatedRuleIds = () =>
  contract().rules
    .filter(({ coverage }) => coverage === "automated")
    .map(({ ruleId }) => ruleId)
    .sort();

export const getArg = (name, fallback = null) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};

export const getCodingBibleRoot = () => {
  const value =
    getArg("--coding-bible-root") ??
    process.env.CODING_BIBLE_ROOT ??
    ".coding-bible-under-test";
  return path.resolve(process.cwd(), value);
};

export const importCandidate = async (relativePath) =>
  import(pathToFileURL(path.join(getCodingBibleRoot(), relativePath)).href);

export const candidateRulesPath = () =>
  path.join(getCodingBibleRoot(), "apps/web/public/rules.json");

export const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

export const sameSet = (left, right) =>
  JSON.stringify([...new Set(left)].sort()) ===
  JSON.stringify([...new Set(right)].sort());

export const writeArtifact = (fileName, value) => {
  const directory = path.join(root, "artifacts");
  fs.mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
};

export const extensionForLanguage = (language) =>
  ({ js: "js", jsx: "jsx", ts: "ts", tsx: "tsx" })[language] ?? "ts";

export const normalizeFindings = (findings) =>
  findings
    .map(({ ruleId, confidence, impact, severity, filePath, file, location }) => ({
      confidence: confidence ?? null,
      file: (filePath ?? file ?? "").replaceAll("\\", "/"),
      impact: impact ?? null,
      line: location?.line ?? null,
      ruleId,
      severity: severity ?? null,
    }))
    .sort((a, b) =>
      a.ruleId.localeCompare(b.ruleId) ||
      a.file.localeCompare(b.file) ||
      (a.line ?? 0) - (b.line ?? 0),
    );
