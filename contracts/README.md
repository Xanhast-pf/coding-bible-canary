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
