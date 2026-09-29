# Engine

`src/engine/` is the boundary of the self-contained simulation engine.

## Responsibility

The engine owns and advances authoritative World state. It remains independent from rendering, UI layout, browser scheduling, debugging panels, and other presentation concerns.

`src/engine/mod.ts` is the public boundary of the **engine layer**:

- **observation/query APIs** expose safe read-only information;
- **command/control APIs** request validated state changes;
- mutable internal state must not leak to consumers.

Code composing the complete vLab2D package should normally import from the root [`src/mod.ts`](../mod.ts) facade instead. The engine entry point remains useful for narrower layer dependencies such as Simulation and Visualization.

Internal folders continue to appear only when concrete responsibilities justify them. Existing names such as `kinematics/` should not be reorganized merely to match a speculative final tree.
