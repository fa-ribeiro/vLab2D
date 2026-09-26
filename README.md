# vLab2D

**An interactive visual laboratory for exploring 2D simulations.**

vLab2D is a learning project built with vanilla TypeScript to explore 2D simulation, numerical methods, software architecture, testing, visualization, and interactive experimentation.

The goal is **not** to build a production-grade physics engine. The project grows in small, well-understood steps, implementing relevant concepts from scratch whenever doing so helps the learning process.

Eventually, vLab2D aims to make simulations not only runnable, but **observable**: vectors, collisions, bounding boxes, forces, state changes, and other normally invisible aspects of a simulation should be visible, inspectable, and comparable.

## Project status

**Current checkpoint:** project bootstrap complete; immutable `Vector2` is the first completed engine primitive.

**Next step:** choose and design the next smallest useful engine feature before writing more code.

See [`docs/project/status.md`](docs/project/status.md) for the authoritative current checkpoint and next goal.

## Environment

- **Deno:** 2.9.7
- **TypeScript:** 6.0.3
- **Editor:** Visual Studio Code
- **Language:** vanilla TypeScript
- **Dependencies:** kept to a minimum

Project functionality is implemented from scratch when doing so contributes to the learning goal. Deno and appropriate standard-library utilities, particularly for testing, are considered part of the development platform.

## Project structure

```text
vLab2D/
├── .vscode/
├── docs/
│   └── project/          # project context, decisions, workflow and status
├── src/
│   ├── engine/           # self-contained simulation engine
│   └── visualization/    # rendering and diagnostic visualization
├── tests/                # project-level and integration tests
├── .gitignore
├── deno.json
├── LICENSE
└── README.md
```

The simulation engine is designed as a **self-contained module**. External systems such as renderers, debuggers, inspectors, user interfaces, and experiment runners should interact with the engine through its public API rather than directly modifying its internal state.

Feature-level unit tests are normally colocated with the code they exercise:

```text
src/engine/math/
├── vector2.ts
└── vector2.test.ts
```

The root `tests/` directory is reserved for tests that do not naturally belong to a single module, such as integration or project-level checks.

## Development commands

```sh
deno task fmt          # format supported project files
deno task fmt:check    # verify formatting without modifying files
deno task lint         # run Deno's linter
deno task check        # type-check the project
deno task test         # run tests
deno task test:watch   # re-run tests while files change
deno task doc:lint     # validate public engine API documentation
deno task doc:html     # generate searchable API docs under generated/api
deno task verify       # run the normal quality gate
```

Generated documentation, coverage reports, and other derived artifacts are not committed to the repository.

## Project documentation

The detailed project documentation lives under [`docs/project/`](docs/project/):

- [`project-context.md`](docs/project/project-context.md) — project identity, goals, constraints, and architectural principles
- [`project-map.md`](docs/project/project-map.md) — visual map of the project and its possible evolution
- [`status.md`](docs/project/status.md) — current implementation state and next activity
- [`decisions.md`](docs/project/decisions.md) — durable architectural and project decisions
- [`environment.md`](docs/project/environment.md) — development environment, versions, and tooling constraints
- [`workflow.md`](docs/project/workflow.md) — development process, learning approach, testing standards, and working agreement
- [`handoff.md`](docs/project/handoff.md) — continuity instructions for resuming the project in a new context

These documents are maintained alongside the source code so that the project can be resumed without relying on previous conversation history.

## License

vLab2D is released under the [MIT License](LICENSE).
