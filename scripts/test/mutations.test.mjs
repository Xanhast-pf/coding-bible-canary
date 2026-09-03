import assert from "node:assert/strict";
import test from "node:test";

import {
  applyGeneratedMutation,
  expandGeneratedMutations,
  generatedMutationNames,
} from "../lib/mutations.mjs";

test("generated mutation operators are unique and syntax-context preserving", () => {
  assert.equal(generatedMutationNames.length, 4);
  assert.equal(new Set(generatedMutationNames).size, 4);

  const source = "export const value = 1;";
  const variants = expandGeneratedMutations({
    id: "TS-001-good",
    language: "ts",
    source,
  });
  assert.equal(variants.length, 4);
  assert.equal(new Set(variants.map(({ source: value }) => value)).size, 4);
  for (const variant of variants) {
    assert.match(variant.source, /export const value = 1/u);
  }
});

test("unknown generated mutation names fail loudly", () => {
  assert.throws(
    () => applyGeneratedMutation("const value = 1;", "ts", "made-up"),
    /Unknown generated mutation/u,
  );
});
