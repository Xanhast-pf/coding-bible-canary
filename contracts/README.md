# Canary rule contracts

`rules.json` is the independent golden coverage contract for the canary.

Every Coding Bible rule must appear exactly once. `automated` means the canary
expects the analyzer to detect the canonical DON'T example and keep the canonical
DO example clean across the supported analyzer consumers. `catalog-only` means
the rule is still part of the conformance surface—metadata, examples, and catalog
identity are required—but the canary deliberately does not demand a detector.

The contract is intentionally checked in rather than generated from Coding Bible
at test time. A new rule or detector therefore requires an explicit canary change.
That prevents both sides of an assertion from drifting together.


## Torture policy

`torture-policy.json` is the detector-promotion contract. It fixes the automated
denominator, required consumer lanes, minimum independent adversarial coverage,
and generated mutation operators. A new detector cannot silently enter the
automated set without updating this external contract.

`framework-projects.json` contains deliberately clean ecosystem-shaped projects.
They are false-positive pressure tests, not claims that every ecosystem pack is
already automated.


## Automation classification

`automation-matrix.json` is Canary's independent 128-rule automation assessment.
It distinguishes current automation from high-confidence candidates, contextual
candidates, intentional human/agent review, and responsibilities that belong to
another tool. The candidate's automated set must match both `rules.json` and the
matrix before promotion succeeds.

Historical releases keep frozen contracts under `contracts/releases/`. This
allows candidate `main` to add detectors while the immutable published lane keeps
testing exactly what that release promised.
