# Visualization

`src/visualization/` contains ways to represent simulation information visually.

Visualization is intentionally outside the engine boundary. Renderers and diagnostic views observe information exposed by the engine's public API rather than reaching into engine internals or mutating authoritative simulation state.

## Current implementations

The project currently has two concrete visualization implementations:

- `SvgKinematicRenderer` for static SVG output;
- `CanvasKinematicRenderer` for browser Canvas 2D rendering.

Both consume detached `KinematicBodySnapshot` values exposed by the simulation engine.

`ViewportTransform` provides the world-to-display coordinate mapping shared by both renderers.

Neither renderer advances simulation time or performs physics calculations.

## SVG renderer

`SvgKinematicRenderer` produces a complete SVG document.

It currently renders:

1. a low-opacity coordinate grid at visible integer world coordinates;
2. a horizontal world X axis;
3. a vertical world Y axis;
4. a world-origin marker;
5. body markers above the spatial reference elements.

The SVG renderer is useful as a:

- static visual workbench;
- reproducible snapshot;
- debugging capture;
- export format;
- source image for project documentation.

A runnable example is available at:

```text
examples/kinematic-world-svg.ts
```

It writes:

```text
generated/kinematic-world.svg
```

## Canvas renderer

`CanvasKinematicRenderer` is the first live rendering implementation.

It receives a Canvas 2D drawing context and renders detached body snapshots directly into that context.

Each render:

1. clears the previous frame;
2. maps body positions from world coordinates to display coordinates;
3. draws the current bodies.

Clearing the previous frame is deliberate. Trails should become an explicit visualization capability rather than appearing accidentally because old frames were left on the canvas.

The first browser example is located under:

```text
examples/kinematic-world-canvas/
```

The browser host creates the simulation, advances it, obtains detached body snapshots, and supplies those snapshots to the Canvas renderer.

```mermaid
flowchart LR
    W[KinematicWorld]
    S[Detached snapshots]
    R[CanvasKinematicRenderer]
    C[Canvas 2D]

    W -->|getBodySnapshots| S
    S --> R
    R --> C
```

The browser's animation callback controls repeated execution. The renderer itself has no knowledge of `requestAnimationFrame`.

## Animation timing

The browser host separates rendering cadence from simulation cadence.

`requestAnimationFrame` provides frame timestamps, which are converted into elapsed seconds and accumulated. The host consumes that accumulated time through fixed-size world steps before rendering the latest body snapshots.

```mermaid
flowchart LR
    F[Browser frame]
    D[Elapsed frame time]
    A[Accumulator]
    S[Fixed simulation steps]
    R[Canvas render]

    F --> D --> A --> S --> R
```

The renderer itself remains unaware of this timing mechanism. `CanvasKinematicRenderer` only draws the snapshots it receives.

Variable frame delta is therefore a scheduling input rather than the numerical integration timestep.

## Coordinate systems

The engine uses mathematical world coordinates:

- positive X points right;
- positive Y points up.

SVG and Canvas use display coordinate systems where positive Y points downward.

The shared `ViewportTransform` owns the conversion between those coordinate systems:

```text
displayX = viewportWidth / 2 + worldX × pixelsPerUnit

displayY = viewportHeight / 2 - worldY × pixelsPerUnit
```

The world origin maps to the center of the viewport.

```mermaid
flowchart LR
    WORLD["World coordinates<br/>+X right<br/>+Y up"]

    TRANSFORM["ViewportTransform"]

    DISPLAY["Display coordinates<br/>+X right<br/>+Y down"]

    WORLD --> TRANSFORM --> DISPLAY
```

`ViewportTransform` contains no rendering behavior.

It stores only immutable viewport geometry and scale and exposes numeric coordinate conversion operations.

Both `SvgKinematicRenderer` and `CanvasKinematicRenderer` own a transform internally while retaining their existing public constructor shapes.

This abstraction was introduced only after both concrete renderers independently demonstrated the same coordinate-mapping responsibility.

## Rendering roles

The current renderers have intentionally different output models.

```mermaid
flowchart TD
    S[Kinematic body snapshots]

    SVG[SvgKinematicRenderer]
    CANVAS[CanvasKinematicRenderer]

    DOC[SVG document text]
    CTX[Canvas 2D context]

    S --> SVG --> DOC
    S --> CANVAS --> CTX
```

This is why the project does not yet define a generic renderer interface.

The two concrete implementations should continue to teach us which concepts are genuinely shared and which belong to particular rendering technologies.

## Direction

The next visualization step is to bring the spatial reference information already available in SVG into the live Canvas renderer.

Canvas should gain:

- an integer-coordinate grid;
- world X and Y axes;
- a world-origin marker.

Those elements should use `ViewportTransform` for their coordinate placement.

This will make the animated view easier to interpret while further exercising the shared viewport boundary.

Pan, zoom, renderer interfaces, richer diagnostics, and other visualization abstractions remain deferred until concrete requirements establish their shape.
