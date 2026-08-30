# Coding Bible Release Canary

External contract tests for the published [Coding Bible](https://github.com/Xanhast-pf/coding-bible) GitHub Action.

This repository is intentionally split between known-bad and known-clean fixtures. Its workflow stays green only when the pinned public release behaves as expected:

- known-bad code is rejected;
- known-clean code passes;
- all 19 currently automated rule IDs are exercised by the TSX fixture;
- SARIF 2.1.0 is generated with findings;
- changed-line mode ignores historical debt and reports only newly introduced violations;
- no Coding Bible, pnpm, npm, or TypeScript install step is required by the consumer repository.

## Release under test

```yaml
uses: Xanhast-pf/coding-bible@v0.25.0
```

The canary intentionally pins the exact release. Update the pin in `.github/workflows/canary.yml` when validating a new release candidate/tag.

## Why expected failures do not make CI red

The bad-code Action steps use `continue-on-error: true`. The following assertion steps then require their outcome to be `failure`. If Coding Bible unexpectedly accepts bad code, the assertion fails and the canary becomes red.

Likewise, the clean fixture must complete successfully with zero findings. This tests both false negatives and false positives.

## Fixture provenance

The initial `fixtures/bad/all-violations.tsx` and `fixtures/good/all-clean.tsx` cases mirror Coding Bible's own analyzer integration fixtures for v0.25.0, but they are executed here through the **published GitHub Action**, outside the Coding Bible monorepo.
