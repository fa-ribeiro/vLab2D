# Project Status

## Current checkpoint

vLab2D has completed its Phase 1 structural refactor and is now well into Phase 2 geometry/orientation learning.

The implemented architecture has four concrete responsibility areas:

```text
Engine / Domain
    reusable definitions + World-owned authoritative state

Simulation / Orchestration
    deterministic coordination of one or more Worlds

Runtime
    browser wall-clock scheduling + fixed-timestep accumulation

Visualization
    detached observation + rendering + visual interaction queries
```

The current package-facing execution path is:

```text
Body definition
    ↓
World
    ↓
Simulation
    ↓
BrowserSimulationRuntime

World snapshots
    ↓
Visualization
```

Phase 2 currently supports shapeless, Circle, and Rectangle body definitions; finite-radian World-owned orientation; geometry-aware Canvas/SVG rendering; orientation-aware Canvas hover/selection feedback; geometry/orientation-aware Canvas picking; and the first optional Canvas inspection overlays.

The latest architecture refinement separates viewport geometry, normal rendering, visual interaction queries, and inspection diagnostics into explicit Visualization responsibilities while keeping Canvas collaborators synchronized through one shared viewport transform.

### Simulation engine

The public engine currently provides:

- `Vector2`, an immutable two-dimensional mathematical value;
- scalar numeric validation helpers under engine math;
- `Circle`, immutable geometry with a positive finite radius in world units;
- `Rectangle`, immutable centered geometry with positive finite width and height in world units;
- `Body`, an immutable reusable definition with optional geometry;
- `BodyShape`, currently the concrete union `Circle | Rectangle`;
- `BodyInitialConditions`, optional world-specific position, velocity, and orientation;
- `BodyState`, readonly runtime data containing position, velocity, and orientation;
- `KinematicIntegrator`, the narrow integration strategy used by World;
- Explicit Euler and Semi-Implicit Euler implementations;
- `BodyId`, an opaque world-local runtime identity;
- `BodySnapshot`, detached observation combining identity, immutable definition, and detached runtime state;
- `World`, authoritative owner of body runtime state and environmental gravity.

The ownership model is:

```text
Body / Circle / Rectangle
    immutable reusable definition data

BodyInitialConditions
    insertion-time state
    position / velocity / orientation

World
    authoritative runtime state owner

BodyState
    position / velocity / orientation

BodySnapshot
    world-local identity
    + shared immutable definition
    + detached runtime state
```

The same `Body` definition may be added multiple times. Each addition receives an independent `BodyId` and independent World-owned runtime state.

World coordinates use mathematical orientation:

```text
+X → right
+Y → up
positive orientation → counter-clockwise
```

Orientation is expressed in radians, defaults to `0`, and accepts any finite value. It is not normalized yet.

Current integrators evolve translational position and velocity and preserve orientation unchanged. Angular velocity, torque, moment of inertia, and rotational integration have not been introduced.

`World.step(dt)` remains atomic: all candidate next states are calculated and validated before any authoritative body state is replaced.

### Simulation orchestration

`Simulation` coordinates a fixed set of `1..N` unique World references.

It owns:

- deterministic World visitation order;
- validation of the shared timestep before World execution;
- per-World active/failed execution status;
- isolation of one World failure from later active Worlds.

It does not own body state, gravity, integrators, rendering, browser scheduling, or interaction state.

### Browser Runtime

`BrowserSimulationRuntime` owns browser execution mechanics:

```text
requestAnimationFrame
wall-clock frame deltas
maximum frame-delta clamping
fixed-timestep accumulation
0..N Simulation.step(dt) calls
host onFrame callback
```

The current Canvas example uses:

```text
fixed timestep:       1 / 60 second
maximum frame delta:  0.25 second
```

Runtime remains independent from Canvas, DOM input, picking, hover, selection, and World snapshots.

### Shared viewport transformation

`ViewportTransform` owns rendering-technology-independent viewport geometry:

- immutable viewport dimensions;
- mutable world-space center;
- mutable display scale (`pixelsPerUnit`);
- continuous visible-world bounds;
- world-to-display coordinate conversion;
- display-to-world coordinate conversion;
- display-space panning geometry;
- anchor-preserving zoom geometry.

It knows nothing about Canvas, SVG, DOM events, World, Body, snapshots, or `Vector2`.

The Canvas and SVG paths now compose it differently because their concrete requirements differ.

#### Canvas

The Canvas composition root creates **one** `ViewportTransform` and shares it among the components that must observe the same viewport state:

```mermaid
flowchart LR
    H["CanvasExampleHost"]
    V["ViewportTransform"]
    P["BodyPicker"]
    R["CanvasKinematicRenderer"]

    H --> V
    H --> P
    H --> R
    V --> P
    V --> R
```

This prevents drawing, hit testing, panning, zooming, and coordinate inspection from drifting apart.

#### SVG

`SvgKinematicRenderer` still creates and owns its transform internally. SVG currently has no separate picker or host interaction collaborator that needs to share the same mutable viewport instance.

The two paths are intentionally not forced into identical constructor/API shapes.

### Canvas visualization

`CanvasKinematicRenderer` now has a focused drawing responsibility.

It renders:

- the integer world grid;
- world axes;
- the world origin marker;
- shapeless fallback markers;
- Circle geometry;
- Rectangle geometry;
- hover presentation;
- selection presentation.

It consumes a `ViewportTransform` supplied by composition and no longer acts as a façade for viewport interaction or picking.

Geometry semantics are:

```text
shapeless Body
    fixed display-space marker radius

Circle
    radius in world units
    display radius = radius × pixelsPerUnit

Rectangle
    centered local width/height in world units
    scaled through pixelsPerUnit
    rotated by BodyState.orientation
```

Canvas display Y points downward, so the renderer applies `-orientation` to represent positive world-space counter-clockwise rotation.

Rectangle hover and selection outlines are drawn inside the same local transformed coordinate frame as the Rectangle itself. The interaction feedback therefore follows the oriented geometry.

Circle orientation is part of runtime pose even though a plain circular outline remains visually unchanged by rotation.

### Canvas body picking

`BodyPicker` is now a separate Visualization collaborator rather than a `CanvasKinematicRenderer` method.

It receives:

```text
shared ViewportTransform
fixed shapeless-body presentation radius
display-space pick tolerance
```

and answers:

```text
Which observed Body is close enough to this display-space point
to be the user's intended target?
```

Picking behavior currently measures display-space distance to visible/pick geometry:

- shapeless Body → fixed circular presentation marker;
- Circle → world-scaled circular geometry;
- Rectangle → world-scaled Rectangle geometry with current orientation.

The Canvas example supplies a small display-space `pickTolerance`, allowing thin or small geometry to remain easy to acquire without changing its domain dimensions.

For a rotated Rectangle, the picker transforms the pointer displacement into body-local coordinates and computes Euclidean distance to the simple centered Rectangle bounds. This yields a true rounded tolerance around corners.

When several bodies lie within tolerance, the nearest geometry wins. If geometry distances tie—most commonly because the pointer lies inside overlapping bodies—the nearest displayed center breaks the tie. Snapshot order is not a picking-priority contract.

Picking remains a visual interaction query. It is **not** collision detection and does not establish collision shapes, broad-phase structures, or physical contact semantics.

### Canvas example host

`CanvasExampleHost` remains example-local.

It owns the concrete browser/application policies that currently have one consumer:

- pointer and wheel events;
- pointer capture;
- browser CSS coordinate to Canvas drawing-buffer conversion;
- click-versus-drag interpretation;
- wheel-delta normalization;
- zoom sensitivity and limits;
- viewport pan/zoom commands;
- world-coordinate pointer readout;
- transient hovered `BodyId`;
- persistent selected `BodyId`;
- selected-body read-only inspection;
- per-frame rendering orchestration.

The host uses `ViewportTransform` directly for coordinate and viewport operations, `BodyPicker` for hit testing, `CanvasKinematicRenderer` for normal drawing, and `CanvasInspectionRenderer` for optional diagnostic overlays.

Normal scene rendering happens first and inspection rendering happens afterward so diagnostics compose as an overlay without clearing or owning the normal scene.

Hover is recomputed against the latest detached observations every frame because bodies can move under a stationary pointer.

Selection stores identity rather than a snapshot. The host resolves the selected `BodyId` against fresh snapshots each frame to present current position and velocity without retaining stale state or reading mutable World storage.

### Canvas inspection visualization

`CanvasInspectionRenderer` is a separate diagnostic renderer. It observes the same detached `BodySnapshot[]` values and the same shared `ViewportTransform` as normal Canvas rendering, but it does not clear the surface or own normal appearance.

Renderer-neutral `InspectionOptions` currently controls three indicators:

```text
showGeometryContour
showBodyOrigin
showOrientation
```

Current semantics are:

- geometry contour — Circle/Rectangle domain boundary, scaled through the viewport;
- body origin — fixed display-space marker at `BodyState.position`;
- orientation — fixed display-space line along Body-local `+X` / `0°`.

A shapeless Body has no geometry contour. Its body origin remains meaningful. The current inspection renderer suppresses its orientation glyph because there is no concrete geometry providing a useful local frame to inspect.

“Body origin” is intentionally not defined as centroid or center of mass. Those concepts may diverge if future geometry, mass distribution, or compound bodies require them.

The visualization source tree is now grouped by responsibility:

```text
src/visualization/
├── inspection/
├── interaction/
├── rendering/
└── viewport/
```

This is an organizational refinement only; it does not introduce a renderer hierarchy or inspection framework.

### SVG visualization

`SvgKinematicRenderer` remains the secondary static renderer.

It renders the same current geometry semantics as Canvas:

- fixed fallback marker for shapeless Bodies;
- world-scaled Circle geometry;
- world-scaled Rectangle geometry;
- orientation expressed through SVG rotation.

It remains useful for deterministic snapshots, debugging captures, exports, and documentation images.

Canvas remains the primary interactive visualization target. SVG parity should be preserved only when the adaptation remains natural and reasonably inexpensive.

### Package facade and composition

`src/mod.ts` remains the package-facing composition facade. Complete examples can compose the established public concepts without depending on deep layer paths.

The Canvas entry point is intentionally small:

```text
create World + Bodies
create Simulation
create ViewportTransform
create normal renderer
create inspection renderer
create picker
create example host
create Runtime
run
```

No generic application, renderer, picker, interaction, or dependency-injection framework has been introduced.

### Deliberately deferred

Current implementation pressure still does not justify:

- collision detection or response;
- forces beyond current World gravity input;
- mass or material properties;
- angular velocity or rotational dynamics;
- compound geometry attachments;
- a generic Shape interface/base hierarchy;
- `Transform2D`;
- `Vector2.rotate()` merely for native Canvas/SVG transform use;
- a generic renderer hierarchy;
- a generic picking framework;
- editable body-state UI;
- a materials/textures/sprites appearance system;
- a diagnostic-overlay plug-in framework;
- configurable inspection colors/styles;
- SVG inspection composition;
- pinch zoom or generalized gesture handling.

Normal rendering, future appearance, interaction feedback, and optional diagnostics remain distinct concerns.

## Next step

The first inspection slice is now established with optional geometry contour, body-origin, and orientation indicators in Canvas.

The next discussion should decide which diagnostic adds the most learning value without turning inspection into a framework. A velocity vector is a natural candidate because it introduces direction **and magnitude** semantics distinct from the plain orientation line.

Continue watching for genuine repetition in local/world transform mathematics before introducing `Vector2.rotate()`, `Transform2D`, or another shared transform helper.
