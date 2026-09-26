# Working Environment

Last updated: 2026-09-26

## Known

- Primary learning language: **TypeScript**.
- TypeScript version: **6.0.3**.
- Runtime/toolchain: **Deno 2.9.7**.
- Editor/IDE: **Visual Studio Code**.
- Development style: **vanilla TypeScript**.
- Dependency policy: keep external dependencies to a minimum; implement project functionality from scratch where doing so serves the learning goal.
- Allowed/expected exceptions include Deno itself and appropriate Deno standard-library utilities, especially for testing.
- Project type: hobby / learning project.
- This project follows a completed CHIP-8 exercise used to learn TypeScript.

## Tooling implications

- Do not introduce frameworks or third-party libraries merely for convenience.
- Prefer built-in browser/platform APIs and Deno capabilities when they are sufficient.
- Testing should prefer Deno's native test runner and appropriate Deno standard-library test/assertion utilities.
- Public/non-obvious APIs should use JSDoc-style documentation comments. The public engine root module is documented with Deno's native `deno doc`, with project tasks for documentation linting and searchable HTML generation.

## Tooling notes

- Prefer Deno's native formatter, linter, type checker, test runner, task runner, and documentation generator.
- The authoritative task definitions live in the repository `deno.json`.
- The root `README.md` provides the concise human-facing command reference.
- Public API documentation is generated and linted with native `deno doc` tooling.
- Generated API documentation is written under `generated/api/` and is treated as derived output rather than hand-edited source documentation.
- The VS Code workspace enables the Deno language server and recommends the official Deno extension.

## Not yet decided

- Operating system used for development
- Browser targets
- Rendering technology (Canvas 2D, SVG, WebGL, etc.)
- Whether any build/bundle step is needed at all

## Environment-recording rule

As soon as any of the above becomes relevant or is chosen, record the exact version/configuration/command here where practical.

Do not guess missing environment details.
