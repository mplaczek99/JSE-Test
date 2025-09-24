# DESIGN

## Approach
The solution reads two JSON files (`event_details.json`, `references.json`) and prints exactly one JSON object. For Task 1, it strictly parses `YYYY-MM-DD` dates and counts appearances of the fixed colors (`RED`, `BLUE`, `GREEN`) of June 2024 and March 2025, always emitting those keys with zero defaults. For Task 2, it builds fast lookups by `id_a` and `id_b`, collects the **unique** set of referenced events, and derives: (a) the sum of `value`, (b) the earliest valid date’s **name** with alphabetical tie-breaks, (c) the minimum `value` event’s **name** with alphabetical tie-breaks, and (d) alphabetically sorted names for events with `value > 25`. All outputs are deterministic.

## Trade-offs
- **Simplicity over layers:** Uses small, pure helper functions and synchronous file reads for clarity (fine for small inputs typical of a code test).
- **Strictness:** Date parsing rejects invalid dates to avoid JS date leniency; unknown colors are ignored to match the required output shape.
- **Determinism:** Alphabetical tie-breaks and stable sorting ensure reproducible results; we choose the alphabetically earliest **name** when multiple references map to the same event.

## What I’d do next
- Convert to async I/O and add streaming for very large files for future cases.
- Add a small test suite with fixtures covering edge cases (invalid dates, duplicate refs, missing ids).
- Parameterize months/colors via CLI flags while preserving the required default output shape possibly.
