# Engine

`src/engine/` is the boundary of the self-contained simulation engine.

## Responsibility

The engine will eventually own and advance authoritative simulation state. It must remain independent from rendering, UI layout, debugging panels, and other presentation concerns.

External code should interact with the engine through its public entry point, `mod.ts`:

- **observation/query APIs** expose safe read-only information;
- **command/control APIs** request validated state changes;
- mutable internal state must not leak to consumers.

We will add internal folders only when concrete features require them. For example, an `integrators/` folder should appear when integrators actually exist, not because we expect them someday.
