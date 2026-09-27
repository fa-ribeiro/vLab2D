# vLab2D

**An interactive visual laboratory for exploring 2D simulations.**

vLab2D is a learning project built with vanilla TypeScript to explore 2D simulation, numerical methods, software architecture, testing, visualization, and interactive experimentation.

The goal is **not** to build a production-grade physics engine. The project grows in small, well-understood steps, implementing relevant concepts from scratch whenever doing so helps the learning process.

Eventually, vLab2D aims to make simulations not only runnable, but **observable**: vectors, collisions, bounding boxes, forces, state changes, and other normally invisible aspects of a simulation should be visible, inspectable, and comparable.

## Project status

**Current checkpoint:** a multi-body `KinematicWorld` owns authoritative simulation state and exposes detached observations that can be visualized as static SVG output or live Canvas 2D animation. The browser animation loop now advances the simulation with a fixed timestep independently from display refresh rate.

**Next step:** extract the shared world-to-display transformation now demonstrated independently by both SVG and Canvas.

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

- `SvgKinematicRenderer` produces static SVG documents suitable for inspection, snapshots, and documentation;
- `CanvasKinematicRenderer` draws detached engine observations into a browser Canvas 2D context for live visualization.

No generic renderer hierarchy is currently required. Shared visualization abstractions will be introduced only when concrete implementations demonstrate their need.

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
deno task canvas:serve  # serve the generated Canvas example locally
deno task verify        # run the normal quality gate
deno task canvas:build  # bundle the browser Canvas example
deno task canvas:watch  # rebuild the Canvas example when source changes
deno task canvas:serve  # serve the generated Canvas example locally
```

Generated documentation, browser bundles, visualization output, coverage reports, and other derived artifacts are not committed to the repository.

## Documentation

Documentation is organized into section-level entry points:

- [Project documentation](docs/project/README.md) — project identity, current status, decisions, environment, workflow, conceptual map, and continuity information.
- [Architecture](docs/architecture/README.md) — current software structure, boundaries, dependencies, state ownership, and runtime data flow.

Additional documentation sections should be introduced only when their scope becomes substantial enough to justify a dedicated entry point.

## License

vLab2D is released under the [MIT License](LICENSE).
