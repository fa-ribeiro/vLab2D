# Working Environment

Last updated: 2026-09-27

## Known

- Primary learning language: **TypeScript**.
- TypeScript version: **6.0.3**.
- Runtime/toolchain: **Deno 2.9.7**.
- Editor/IDE: **Visual Studio Code**.
- Development style: **vanilla TypeScript**.
- Static visualization technology: **SVG**.
- Live browser visualization technology: **Canvas 2D**.
- Browser animation scheduling: **`requestAnimationFrame`**.
- Dependency policy: keep external dependencies to a minimum; implement project functionality from scratch where doing so serves the learning goal.
- Allowed/expected exceptions include Deno itself and appropriate Deno standard-library utilities, especially for testing.
- Project type: hobby / learning project.
- This project follows a completed CHIP-8 exercise used to learn TypeScript.

## Tooling implications

- Do not introduce frameworks or third-party libraries merely for convenience.
- Prefer built-in browser/platform APIs and Deno capabilities when they are sufficient.
- Testing should prefer Deno's native test runner and appropriate Deno standard-library test/assertion utilities.
- Public/non-obvious APIs should use JSDoc-style documentation comments.
- The public engine root module is documented with Deno's native `deno doc`, with project tasks for documentation linting and searchable HTML generation.
- Browser-facing TypeScript uses DOM library types in addition to the Deno environment types.

## Browser development

The Canvas example runs in a browser rather than directly in the Deno runtime.

Deno's browser bundling support is used to produce browser-consumable output under `generated/`.

The generated files remain derived artifacts and are not committed.

The current browser workflow is:

```text
TypeScript / HTML source
        ↓
Deno browser bundle
        ↓
generated browser files
        ↓
local static server
        ↓
browser
```

The project currently uses Canvas 2D because it is a built-in browser API and provides a natural immediate-mode drawing model for live simulation visualization without introducing an external rendering dependency.

SVG remains useful alongside Canvas for static rendering and reproducible output.

## Tooling notes

- Prefer Deno's native formatter, linter, type checker, test runner, task runner, documentation generator, and browser-bundling capabilities where appropriate.
- The authoritative task definitions live in `deno.json`.
- The root `README.md` provides the concise human-facing command reference.
- Public API documentation is generated and linted with native `deno doc` tooling.
- Generated API documentation is written under `generated/api/`.
- Generated browser assets are also written under `generated/`.
- `generated/` is treated as derived output rather than hand-edited source.
- The VS Code workspace enables the Deno language server and recommends the official Deno extension.

## Not yet decided

- Operating system used for development
- Supported browser/version targets
- Whether the current Deno browser-bundling path will remain the long-term browser build approach
- Whether richer rendering technologies such as WebGL will ever be needed

## Environment-recording rule

As soon as an environment choice becomes relevant or is adopted, record the exact version, configuration, or command here where practical.

Do not guess missing environment details.
