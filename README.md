# vLab2D

**An interactive visual laboratory for exploring 2D simulations.**

vLab2D is a learning project built with vanilla TypeScript to explore 2D simulation, numerical methods, software architecture, testing, visualization, and interactive experimentation.

The goal is **not** to build a production-grade physics engine. The project grows in small, well-understood steps, implementing relevant concepts from scratch whenever doing so helps the learning process.

Eventually, vLab2D aims to make simulations not only runnable, but **observable**: vectors, collisions, bounding boxes, forces, state changes, and other normally invisible aspects of a simulation should be visible, inspectable, and comparable.

## Project status

**Current checkpoint:** Phase 2 now supports shapeless, Circle, and Rectangle Body definitions. World-owned runtime state includes finite-radian orientation; Canvas and SVG render the resulting geometry in the body's local frame, and Canvas hover, selection, and picking follow the same observed geometry. Canvas picking now adds a small display-space interaction tolerance without changing domain geometry and ranks candidates by distance to visible/pick geometry before using center distance as a tie-breaker.

**Next step:** return to the visual inspection layer from the cleaner rendering/picking boundary, beginning with a small diagnostic capability such as an orientation/local-axis indicator.

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
│   ├── mod.ts            # package-facing composition facade
│   ├── engine/           # self-contained simulation engine
│   ├── simulation/       # deterministic multi-World orchestration
│   ├── runtime/          # host execution and browser scheduling
│   └── visualization/    # static and live visualization
├── tests/                # project-level and integration tests
├── .gitignore
├── deno.json
├── LICENSE
└── README.md
```

The simulation engine is designed as a **self-contained module**. `src/engine/mod.ts` remains its layer-specific public boundary, while `src/mod.ts` re-exports the package-facing concepts used to compose complete experiments.

External systems such as renderers, debuggers, inspectors, user interfaces, and experiment runners interact with the engine through public APIs rather than directly modifying its internal state. Visualization remains outside the engine boundary.

The project currently has two concrete visualization paths:

- `CanvasKinematicRenderer` is the primary visualization target and draws detached engine observations into a browser Canvas 2D context for live visualization;
- `SvgKinematicRenderer` is a secondary companion renderer for static inspection, snapshots, exports, debugging captures, and documentation.

`ViewportTransform` owns bidirectional coordinate mapping, continuous visible-world geometry, mutable world-space centering, and mutable display scale independently from any rendering technology. The SVG renderer still creates and owns its own transform internally. The interactive Canvas path now composes one transform explicitly in `main.ts` and shares that same mutable viewport state with `CanvasKinematicRenderer`, `BodyPicker`, and `CanvasExampleHost`. This keeps drawing, hit testing, panning, zooming, and coordinate inspection coherent without turning the renderer into a façade for unrelated interaction operations.

`BrowserSimulationRuntime` owns the live Canvas example's animation-frame scheduling, frame-delta clamping, fixed-timestep accumulation, and calls to `Simulation.step(...)`. The example-local `CanvasExampleHost` owns pointer and wheel-event orchestration and converts browser CSS coordinates into Canvas drawing-buffer units. It mutates and queries the shared `ViewportTransform` for panning, pointer-anchored zoom, and live world-coordinate inspection; it delegates hit testing to `BodyPicker`; and it passes transient hover and persistent selection identities into `CanvasKinematicRenderer` as per-frame presentation input. The host resolves the selected `BodyId` against the latest detached snapshots each frame to present live read-only position and velocity values without retaining a selected snapshot or reading mutable engine storage. Zoom sensitivity, wheel-delta normalization, minimum/maximum scale, click-versus-drag tolerance, hover state, selection state, and UI formatting remain host/application concerns rather than engine state.

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
