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
- Public/non-obvious APIs should use JSDoc-style documentation comments. Prefer Deno's native `deno doc` for generated API documentation and documentation linting. Once the root public module exists, add project tasks for HTML generation and doc linting.

## Planned API documentation workflow

Once the public engine entry module exists, prefer native Deno tooling such as:

```text
deno doc --lint <public-entry-module>
deno doc --html --name="vLab2D - Interactive Visual Lab Engine" --output=<generated-docs-dir> <public-entry-module>
```

The exact module path and generated-documentation directory remain intentionally undecided until the repository structure is created. Generated documentation should be treated as build output rather than hand-edited source documentation.

## Bootstrap task commands — draft pending approval

The v0.0.0 bootstrap currently defines:

```text
deno task fmt
deno task fmt:check
deno task lint
deno task check
deno task test
deno task test:watch
deno task doc:lint
deno task doc:html
deno task verify
```

`verify` runs formatting verification, linting, type checking, public API documentation linting, and tests. Generated API documentation is written under `generated/api/`, which is ignored by Git.

The VS Code workspace enables the Deno language server with `"deno.enable": true` and recommends the official `denoland.vscode-deno` extension.

## Not yet decided

- Operating system used for development
- Browser targets
- Rendering technology (Canvas 2D, SVG, WebGL, etc.)
- Git hosting / repository URL
- Whether any build/bundle step is needed at all

## Environment-recording rule

As soon as any of the above becomes relevant or is chosen, record the exact version/configuration/command here where practical.

Do not guess missing environment details.
