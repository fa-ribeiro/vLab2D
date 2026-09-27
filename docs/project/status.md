# Project Status

## Current checkpoint

vLab2D now has a small multi-body simulation engine, reproducible SVG visualization, and live Canvas 2D animation with fixed simulation timing.

Canvas is the primary visualization target. SVG remains a useful secondary renderer for static snapshots, debugging captures, exports, and documentation where maintaining it remains reasonable.

Both renderers share `ViewportTransform` for viewport geometry, bidirectional world/display coordinate conversion, mutable world-space centering, and mutable display scale. The Canvas path additionally supports anchored interactive zoom without moving the world point underneath the chosen display-space anchor.

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

It stores immutable viewport dimensions:

- viewport width;
- viewport height.

It owns mutable viewport state:

- the world-space viewport center;
- display units per world unit (`pixelsPerUnit`).

The configured world position `(centerWorldX, centerWorldY)` maps to the center of the display; the world origin is centered by default.

The forward mapping is:

```text
displayX = width / 2 + (worldX - centerWorldX) × pixelsPerUnit

displayY = height / 2 - (worldY - centerWorldY) × pixelsPerUnit
```

The inverse mapping is:

```text
worldX = centerWorldX + (displayX - width / 2) / pixelsPerUnit

worldY = centerWorldY - (displayY - height / 2) / pixelsPerUnit
```

The transform exposes the continuous world-space extent currently visible through the viewport:

```text
minWorldX
maxWorldX
minWorldY
maxWorldY
```

Those bounds are derived from the current center and scale. Increasing `pixelsPerUnit` zooms in by showing a smaller world-space extent; decreasing it zooms out.

```mermaid
flowchart TD
    CENTER["World-space viewport center"]
    SCALE["Display scale"]
    TRANSFORM["ViewportTransform"]
    BOUNDS["Continuous visible world bounds"]
    CANVAS["Canvas grid policy"]
    SVG["SVG grid policy"]

    CENTER --> TRANSFORM
    SCALE --> TRANSFORM
    TRANSFORM --> BOUNDS
    BOUNDS --> CANVAS
    BOUNDS --> SVG
```

`setCenter(...)` validates both center coordinates before changing either one. `setPixelsPerUnit(...)` validates a new positive finite scale while preserving the current world-space center.

For anchor-aware zoom, `setPixelsPerUnitAroundDisplayPoint(...)` changes scale and center together so the world coordinate underneath the supplied display-space anchor remains unchanged. Requested scale, anchor coordinates, and candidate center are validated before any viewport state is committed, preserving the update atomically.

The transform contains no rendering behavior and has no dependency on SVG, Canvas, browser events, wheel-delta conventions, or engine-domain types such as `Vector2`.

### Canvas visualization

`CanvasKinematicRenderer` is the primary live visualization path.

Each frame is rendered in this order:

```text
grid
axes
origin
bodies
```

The renderer exposes focused viewport operations and queries:

- `setViewportCenter(worldX, worldY)` delegates world-space centering to `ViewportTransform`;
- `setViewportScale(pixelsPerUnit)` changes scale while preserving the current world-space center;
- `panViewportBy(deltaX, deltaY)` accepts a displacement in Canvas display units and converts it into the corresponding world-center change;
- `viewportScale` exposes the current scale read-only for host interaction policy;
- `setViewportScaleAroundDisplayPoint(...)` changes scale while preserving the world point underneath a Canvas display-space anchor;
- `displayToWorldX(displayX)` and `displayToWorldY(displayY)` expose the transform's inverse scalar mapping without leaking the transform object itself.

The integer grid, axes, origin marker, and body positions all consume the same transform, so panning and zooming move and magnify the complete world view coherently.

The live browser example adds pointer-drag panning, pointer-coordinate inspection, and wheel/trackpad zoom. Browser input remains host responsibility: the example tracks one active pointer, uses pointer capture, converts browser CSS coordinates into Canvas drawing-buffer coordinates, normalizes wheel deltas, calculates an exponential zoom factor, clamps the requested scale to host-defined limits, and passes the resulting absolute scale and display-space anchor to the renderer.

```mermaid
flowchart LR
    INPUT["Pointer / wheel input"]
    HOST["Browser host"]
    POLICY["Coordinate conversion + zoom policy"]
    RENDERER["CanvasKinematicRenderer"]
    TRANSFORM["ViewportTransform"]
    OUTPUT["World-coordinate output"]

    INPUT --> HOST --> POLICY --> RENDERER --> TRANSFORM
    TRANSFORM --> RENDERER --> HOST --> OUTPUT
```

The anchor-aware transform preserves the world coordinate underneath the pointer while the scale changes. The host currently prevents page scrolling during Canvas wheel zoom and owns scale limits and sensitivity; those are interaction policy rather than transform invariants.

The world-coordinate readout remains ordinary DOM presentation owned by the host. Formatting such as decimal precision does not enter `ViewportTransform` or the renderer.

The renderer remains unaware of DOM pointer and wheel events and performs no simulation calculations or engine-state mutation.

Canvas regression tests cover forward and inverse coordinate mapping, spatial references, viewport centering, programmatic scale changes, display-space panning, anchor-preserving scale changes, frame clearing, and validation behavior.

### SVG visualization

`SvgKinematicRenderer` remains the secondary static visualization path.

It renders the same basic spatial references and consumes the same continuous visible bounds, while retaining SVG-specific output behavior. `setViewportCenter(...)` exposes shared programmatic world-space centering, and `setViewportScale(...)` exposes shared programmatic viewport scale changes where those geometry operations map naturally to SVG.

The shared transform has inverse coordinate mathematics and anchor-aware scale geometry, but the SVG renderer does not expose Canvas-oriented inverse or anchored-interaction queries because no concrete SVG consumer currently needs them. Focused SVG regression tests verify displaced mapping and programmatic scale changes.

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

Use the completed interactive viewport as the foundation for the next small inspection capability.

The leading candidate is body picking: determine which body, if any, is underneath a pointer position by using the existing display-to-world mapping and detached world observations.

Keep the first picking step deliberately narrow:

- define the minimum geometric query needed to identify a body under a world-space point;
- keep authoritative simulation state inside `KinematicWorld`;
- avoid giving the renderer ownership of selection state;
- separate hit testing from any later selected-body UI or inspector;
- use the existing Canvas/browser coordinate boundary rather than introducing a camera or event abstraction.

Do not yet introduce:

- persistent selection state or selection UI;
- drag-to-move bodies;
- a camera class;
- transformation matrices;
- renderer interfaces;
- generalized drawing backends.
