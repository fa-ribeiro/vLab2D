# Status

Last updated: 2026-09-26

## Phase

Implementation — **v0.0.0 Project Bootstrap (draft, awaiting user review/approval)**.

## Current project concept

A modular interactive visual 2D physics laboratory focused on learning, experimentation, visual explanation, and fun.

## Confirmed areas of interest

- simple 2D physics simulation
- visually attractive rendering
- optional diagnostic overlays
- configurable indicators/colors
- start/pause/resume/single-step/reset controls
- optional control/options panel
- optional console/logger
- simulation core independent from visualization
- engine owns authoritative mutable state; external systems use read-only observation and validated command APIs rather than direct mutation
- multiple visualization/layout strategies
- multiple synchronized worlds
- side-by-side and overlaid world comparison
- comparing gravity/parameters
- comparing integration algorithms
- sensitivity to initial conditions / chaotic behavior
- project-management practice
- strong continuity between chats
- intentional documentation and code comments focused on non-obvious reasoning/algorithms rather than obvious syntax
- separation of concerns and focused responsibilities
- explicit dependency injection/inversion for meaningful replaceable collaborators
- pragmatic OOP with composition preferred over deep inheritance
- vanilla TypeScript with minimal dependencies
- Deno 2.9.7 / TypeScript 6.0.3 / Visual Studio Code
- explanation of rationale, alternatives, pros/cons, and “why not” for meaningful choices
- industry best practices/patterns explained rather than applied as unexplained rules
- incremental feature implementation with user approval before commit/next feature
- modular/interchangeable behavioral components such as integrators and collision subsystems
- strong testing focused on trust, edge cases, and error handling rather than coverage percentages
- source/folder structure should communicate modularity
- JSDoc-style API/rationale documentation, with the engine public API treated as a strongly documented consumer contract
- native Deno `deno doc` planned for documentation linting and searchable generated HTML API docs
- visual learning aids, especially Mermaid diagrams, when they improve understanding

## Implementation status

A bootstrap draft has been created with:

- root `deno.json` using Deno-native format/lint/check/test/doc tasks
- `.vscode/` workspace configuration recommending/enabling the official Deno extension
- `src/engine/mod.ts` as the engine public entry module
- `src/engine/README.md` documenting the self-contained engine boundary
- `src/visualization/README.md` documenting presentation separation
- `tests/bootstrap.test.ts` as a temporary project-level smoke test
- the continuity pack moved into `docs/project/` inside the source tree
- root `README.md` and `.gitignore`

This bootstrap is **not yet approved or committed**. Per the agreed workflow, do not begin the first physics/math feature until the user reviews and approves v0.0.0.

## Immediate next activity

Review the v0.0.0 bootstrap structure and configuration. Run `deno task verify` in the user's Deno 2.9.7 environment. Resolve any issues, obtain explicit user approval, then commit the bootstrap before starting the first real feature.

## Open questions — deliberately unresolved

- Browser Canvas 2D, SVG, WebGL, or another renderer?
- Exact vanilla TypeScript UI approach once UI work begins?
- Is any build/bundle step needed, or can Deno/browser-native tooling remain sufficient?
- Initial physics representation?
- First integrator?
- Exact engine observation/control API shape (snapshots/views, direct methods, command queue, etc.)?

Do not resolve these merely to fill blanks. Resolve them when they become relevant.

## Current unresolved decisions

- How multi-behavior simulations should be composed: stateful `World` instances with injected policies, CHIP-8-like runtime/simulator objects, or another split. Current preference is to keep state and advancement behavior separable, but no API/design is fixed yet.

## Verification note

The ChatGPT execution container used to prepare the bootstrap does not currently have the `deno` executable installed. JSON configuration files were syntax-validated, but Deno-specific tasks could not be executed in that container. The bootstrap must therefore be verified with `deno task verify` in the user's recorded Deno 2.9.7 environment before approval/commit.
