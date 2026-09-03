# Coding Bible Conformance Canary

An independent external conformance laboratory for
[Coding Bible](https://github.com/Xanhast-pf/coding-bible).

This repository is intentionally **not** part of the Coding Bible monorepo. Its
job is to behave like a hostile real consumer and fail whenever the published or
candidate product drifts from an independently checked-in contract.

## What this canary proves

The canary owns two hard denominators:

- **128 / 128 Coding Bible rules represented** in `contracts/rules.json`;
- **23 / 23 currently automated rules** required to satisfy external detection
  contracts.

Every rule is covered even when it is not automated. `catalog-only` rules must
still exist with complete title, summary, rationale, canonical DON'T code, and
canonical DO code. They are deliberately **not** required to emit analyzer
findings until the canary contract is explicitly promoted to `automated`.

For automated rules, the canary checks several independent surfaces:

1. canonical DON'T examples must fire their rule;
2. canonical DO examples must remain clean;
3. independent adversarial/near-neighbor cases must not create known false
   positives;
4. every canonical bad/good example is re-run through four generated,
   syntax-preserving mutations to catch brittle false negatives and false
   positives;
5. every independent adversarial case is also expanded through those mutation
   operators;
6. nine clean framework/project fixtures exercise React, Apollo, Redux,
   Legend-State, Next.js, TanStack Query, GraphQL, mixed JS/TS, and monorepo
   boundaries without allowing known false positives;
7. the aggregate bad project must exercise the exact automated rule set;
8. the aggregate clean project must stay clean;
9. CLI and browser consumers must preserve the same contract;
10. the GitHub Action must preserve the same external project/SARIF contract;
11. includes, ignores, severities, overrides, rule selection, custom rulebooks,
    malformed source, and cache behavior are tortured independently;
12. changed-line scope must report only newly introduced debt;
13. a 1,000-file clean project provides a generous CI performance regression
    guard rather than a fragile benchmark race.

The suite is intentionally designed so **zero work can never equal success**.
Catalog size, automated-rule count, fixture count, files analyzed, and Action
`rules-checked` outputs are asserted explicitly.

## Two product lanes

### Candidate lane

The workflow checks out `Xanhast-pf/coding-bible` separately and tests the
requested branch/tag/SHA (default: `main`). This exercises analyzer library,
CLI, browser analyzer, current committed Action runtime, configuration, custom
rules, and performance outside the Coding Bible repository.

Manual runs can select another ref. Coding Bible itself can eventually trigger
this workflow using the `coding-bible-candidate` repository-dispatch event and a
specific candidate SHA.

### Published lane

The immutable external Action contract remains pinned to:

```yaml
uses: Xanhast-pf/coding-bible@v0.27.0
```

That lane answers a different question: does the exact artifact users already
consume still behave as promised?

## Detector promotion gate

Canary treats `automated` as a promotion with prerequisites, not a metadata
label. A candidate analyzer is rejected if its automated rule set differs from
the independently checked-in contract. Every automated rule must also have
canonical examples, all required consumer lanes, at least one independent
adversarial base case, and the generated mutation matrix.

New detectors should make the canary harder **before** they make the automated
coverage number larger:

1. represent the rule in `contracts/rules.json`;
2. add independent good/bad/adversarial cases;
3. implement the detector in Coding Bible;
4. change the canary contract from `catalog-only` to `automated`;
5. require canonical, adversarial, CLI/browser, and Action conformance to pass.

If a detector cannot satisfy the negative/adversarial contract without broad
heuristics, it is not ready to be promoted.

## Local canary sanity tests

The canary itself has no runtime dependencies:

```bash
node --test scripts/test/*.test.mjs
```

Deep conformance commands require a checked-out Coding Bible candidate:

```bash
CODING_BIBLE_ROOT=../coding-bible node scripts/verify-catalog.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/run-canonical-conformance.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/verify-promotion-gates.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/run-adversarial-conformance.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/run-mutation-conformance.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/run-framework-matrix.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/run-cli-conformance.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/run-browser-parity.mjs
CODING_BIBLE_ROOT=../coding-bible node scripts/run-config-matrix.mjs
```

The CI candidate job installs Coding Bible's own dependencies before running
these tests so browser/program semantics match the real checkout.

## Conformance artifacts

Candidate runs upload JSON reports plus `artifacts/SUMMARY.md`. These artifacts
are intended to become the measurable trust record for the analyzer: curated
positive coverage, known false-positive resistance, consumer parity, config
behavior, and performance over time.
