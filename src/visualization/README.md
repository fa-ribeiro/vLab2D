# Visualization

`src/visualization/` will contain ways to represent simulation information visually.

Visualization is intentionally outside the engine boundary. A renderer or diagnostic overlay may observe the engine's public read-only state, but it must not reach into engine internals or mutate authoritative simulation objects directly.

Different presentation strategies—single-world, side-by-side, overlay, debug views—can grow here as real requirements appear.
