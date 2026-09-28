# vLab2D

**An interactive visual laboratory for exploring 2D simulations.**

vLab2D is a learning project built with vanilla TypeScript to explore 2D simulation, numerical methods, software architecture, testing, visualization, and interactive experimentation.

The goal is **not** to build a production-grade physics engine. The project grows in small, well-understood steps, implementing relevant concepts from scratch whenever doing so helps the learning process.

Eventually, vLab2D aims to make simulations not only runnable, but **observable**: vectors, collisions, bounding boxes, forces, state changes, and other normally invisible aspects of a simulation should be visible, inspectable, and comparable.

## Project status

**Current checkpoint:** Phase 1 architectural refactoring is in progress. `Body` is a reusable definition; `BodyInitialConditions` establish world-specific starting values; `BodyState` is the readonly runtime-data contract owned by `KinematicWorld`; and `BodySnapshot` provides detached observations. The obsolete single-state `KinematicSimulation` has been retired. Existing Canvas/SVG behavior, viewport interaction, picking, selection, and selected-body inspection remain intact.

**Next step:** Phase 1B.2 will establish the broader World vocabulary by reviewing `KinematicWorld` → `World` and world-level `acceleration` → `gravity` without adding simulation features.

See the [project documentation](docs/project/README.md) for the authoritative current status, project context, decisions, workflow, and continuity information.

See the [architecture documentation](docs/architecture/README.md) for the current software structure, boundaries, dependencies, state ownership, and runtime data flow.

## Environment

- **Deno:** 2.9.7
- **TypeScript:** 6.0.3
- **Editor:** Visual Studio Code
- **Language:** vanilla TypeScript
- **Static rendering:** SVG
- **Live rendering:** Canvas 2D
- **Dependencies:** kept to a minimum

Project functionality is implemented from scratch when doing so contributes to the learning goal. Deno and appropriate standard-library utilities, particularly for testing, are considered part of the development platform.

## Project structure

```text
vLab2D/
├── .vscode/
├── docs/
│   ├── architecture/     # implemented architecture, boundaries and data flow
│   └── project/          # project context, decisions, workflow and continuity
├── examples/             # runnable examples and visual experiments
├── src/
│   ├── engine/           # self-contained simulation engine
│   └── visualization/    # static and live visualization
├── tests/                # project-level and integration tests
├── .gitignore
├── deno.json
├── LICENSE
└── README.md
```

The simulation engine is designed as a **self-contained module**. External systems such as renderers, debuggers, inspectors, user interfaces, and experiment runners interact with the engine through its public API rather than directly modifying its internal state.

Visualization remains outside the engine boundary.

The project currently has two concrete visualization paths:

- `CanvasKinematicRenderer` is the primary visualization target and draws detached engine observations into a browser Canvas 2D context for live visualization;
- `SvgKinematicRenderer` is a secondary companion renderer for static inspection, snapshots, exports, debugging captures, and documentation.

Both renderers use the shared `ViewportTransform` for bidirectional coordinate mapping, continuous visible-world geometry, mutable world-space centering, and mutable display scale while retaining rendering-technology-specific drawing behavior. Both renderers expose programmatic viewport centering and scale changes. Canvas additionally accepts display-space pan deltas, exposes scalar display-to-world queries for interaction, and can change scale around a display-space anchor without exposing the transform object itself.

The browser Canvas example owns pointer and wheel-event orchestration and converts browser CSS coordinates into Canvas drawing-buffer units. It uses display-space deltas for panning, inverse mapping for a live world-coordinate readout, and bounded exponential wheel/trackpad scaling for pointer-anchored zoom. It also asks `CanvasKinematicRenderer` which rendered body marker, if any, contains the pointer, presents the resulting `BodyId` as ordinary DOM inspection output, and passes transient hover and persistent selection identities into rendering so they receive distinct visual rings. The host resolves the selected `BodyId` against the latest detached snapshots each frame to present live read-only position and velocity values without retaining a selected snapshot or reading mutable engine storage. Zoom sensitivity, wheel-delta normalization, minimum/maximum scale, click-versus-drag tolerance, hover state, selection state, and UI formatting remain host/application concerns rather than engine state.

Canvas and canvas-like interactive rendering drive visualization design. SVG should remain working where support is natural and reasonably inexpensive, but Canvas features should not be compromised merely to preserve SVG parity.

No generic renderer hierarchy is currently required. Shared visualization abstractions will continue to be introduced only when concrete implementations demonstrate their need.

Feature-level unit tests are normally colocated with the code they exercise:

```text
src/engine/math/
├── vector2.ts
└── vector2.test.ts
```

The root `tests/` directory is reserved for tests that do not naturally belong to a single module, such as integration or project-level checks.

## Development commands

```sh
deno task fmt           # format supported project files
deno task fmt:check     # verify formatting without modifying files
deno task lint          # run Deno's linter
deno task check         # type-check the project
deno task test          # run tests
deno task test:watch    # re-run tests while files change
deno task doc:lint      # validate public engine API documentation
deno task doc:html      # generate searchable API docs under generated/api
deno task canvas:build  # bundle the browser Canvas example
deno task canvas:watch  # rebuild the Canvas example when source changes
deno task canvas:serve  # serve the generated Canvas example locally
deno task verify        # run the normal quality gate
```

Generated documentation, browser bundles, visualization output, coverage reports, and other derived artifacts are not committed to the repository.

## Documentation

Documentation is organized into section-level entry points:

- [Project documentation](docs/project/README.md) — project identity, current status, decisions, environment, workflow, conceptual map, and continuity information.
- [Architecture](docs/architecture/README.md) — current software structure, boundaries, dependencies, state ownership, and runtime data flow.

Additional documentation sections should be introduced only when their scope becomes substantial enough to justify a dedicated entry point.

## License

vLab2D is released under the [MIT License](LICENSE).
