# Project Status

## Current checkpoint

vLab2D now has a small multi-body simulation engine, reproducible SVG visualization, and live Canvas 2D animation with fixed simulation timing.

Canvas is the primary visualization target. SVG remains a useful secondary renderer for static snapshots, debugging captures, exports, and documentation where maintaining it remains reasonable.

Both renderers share `ViewportTransform` for world-to-display coordinate conversion and continuous visible-world geometry.

### Simulation engine

The public engine API currently provides:

- `Vector2`, an immutable two-dimensional vector value.
- `KinematicState`, representing position and velocity at a particular instant.
- `KinematicIntegrator`, a narrow strategy contract for advancing kinematic state.
- `ExplicitEulerIntegrator`.
- `SemiImplicitEulerIntegrator`.
- `KinematicSimulation`, the earlier single-state runtime.
- `BodyId`, an opaque world-local identifier.
- `KinematicBodySnapshot`, a detached observation of body identity and state.
- `KinematicWorld`, which owns and advances multiple identified body states.

`KinematicWorld` owns authoritative body state and advances every body using an injected `KinematicIntegrator`.

External consumers receive detached observations rather than references to internal world storage.

World stepping remains atomic: candidate states for all bodies are calculated and validated before any authoritative state is replaced.

### Shared viewport transformation

`ViewportTransform` owns viewport geometry shared by the visualization paths.

It stores immutable configuration:

- viewport width;
- viewport height;
- display units per world unit.

It also owns a mutable world-space viewport center. The configured world position `(centerWorldX, centerWorldY)` maps to the center of the display; the world origin is centered by default.

The mapping is now:

```text
displayX = width / 2 + (worldX - centerWorldX) × pixelsPerUnit

displayY = height / 2 - (worldY - centerWorldY) × pixelsPerUnit
```

The transform exposes the continuous world-space extent currently visible through the viewport:

```text
minWorldX
maxWorldX
minWorldY
maxWorldY
```

Those bounds move with the viewport center. Continuous extent remains viewport geometry; integer-grid selection remains renderer policy.

```mermaid
flowchart TD
    CENTER["World-space viewport center"]
    TRANSFORM["ViewportTransform"]
    BOUNDS["Continuous visible world bounds"]
    CANVAS["Canvas grid policy"]
    SVG["SVG grid policy"]

    CENTER --> TRANSFORM
    TRANSFORM --> BOUNDS
    BOUNDS --> CANVAS
    BOUNDS --> SVG
```

`setCenter(...)` validates both center coordinates before changing either one, so a rejected update cannot leave a partially changed viewport center.

The transform contains no rendering behavior and has no dependency on SVG, Canvas, browser events, or engine-domain types such as `Vector2`.

### Canvas visualization

`CanvasKinematicRenderer` is the primary live visualization path.

Each frame is rendered in this order:

```text
grid
axes
origin
bodies
```

The renderer exposes two viewport operations:

- `setViewportCenter(worldX, worldY)` delegates world-space centering to `ViewportTransform`;
- `panViewportBy(deltaX, deltaY)` accepts a displacement in Canvas display units and converts it into the corresponding world-center change.

The integer grid, axes, origin marker, and body positions all consume the same transform, so changing the viewport center moves the complete world view coherently.

The live browser example adds pointer-drag panning. Browser input remains host responsibility: the example tracks one active pointer, uses pointer capture, converts CSS-pixel movement into Canvas drawing-buffer units, and sends only display-space deltas to the renderer.

```mermaid
flowchart LR
    POINTER["Pointer drag"]
    HOST["Browser host"]
    DELTA["Canvas display-space delta"]
    RENDERER["CanvasKinematicRenderer"]
    TRANSFORM["ViewportTransform"]

    POINTER --> HOST --> DELTA --> RENDERER --> TRANSFORM
```

The renderer remains unaware of DOM pointer events and performs no simulation calculations or engine-state mutation.

Canvas regression tests cover coordinate mapping, spatial references, viewport centering, display-space panning, frame clearing, and validation behavior.

### SVG visualization

`SvgKinematicRenderer` remains the secondary static visualization path.

It renders the same basic spatial references and consumes the same continuous visible bounds, while retaining SVG-specific output behavior. `setViewportCenter(...)` exposes the same programmatic world-space centering where that shared viewport model maps naturally to SVG. Focused SVG regression tests verify displaced body and axis mapping.

SVG remains useful for reproducible snapshots, debugging captures, exports, and documentation images. Future visualization work should preserve SVG support when doing so remains natural and reasonably inexpensive, but SVG compatibility must not constrain useful Canvas capabilities.

### Fixed-timestep browser loop

Browser rendering is driven by `requestAnimationFrame`, but simulation advancement is independent from display refresh rate.

The browser callback timestamp measures real elapsed time. That time is accumulated and consumed in fixed simulation steps:

```mermaid
flowchart LR
    RAF["requestAnimationFrame(timestamp)"]
    DELTA["Frame delta"]
    ACC["Time accumulator"]
    STEP["0..N fixed world steps"]
    SNAP["Detached snapshots"]
    RENDER["Canvas render"]

    RAF --> DELTA --> ACC --> STEP --> SNAP --> RENDER
    RENDER --> RAF
```

The current simulation timestep is:

```text
1 / 60 second
```

A fast display may render frames without advancing the simulation. A slower display may require multiple fixed simulation steps before one render.

The browser host limits unusually large frame deltas before adding them to the accumulator so a delayed or suspended tab does not attempt excessive simulation catch-up.

Interpolation between fixed simulation states remains deliberately deferred.

## Next step

Introduce inverse display-to-world coordinate mapping as the next small Canvas-first capability.

The first concrete consumer should be a lightweight pointer-coordinate readout in the live Canvas example:

- convert a Canvas display X coordinate into world X;
- convert a Canvas display Y coordinate into world Y;
- preserve the current viewport center and Y-axis inversion;
- convert browser pointer coordinates into Canvas drawing-buffer coordinates in the host before invoking the world-space mapping;
- display the resulting world coordinate without coupling pointer events to `ViewportTransform`.

This gives inverse mapping a real interaction use case rather than adding it speculatively.

Do not yet introduce:

- zoom;
- body picking or selection;
- a camera class;
- transformation matrices;
- renderer interfaces;
- generalized drawing backends.
