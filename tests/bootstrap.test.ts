import "../src/engine/mod.ts";

Deno.test("bootstrap: the engine public module can be loaded by the test runner", (): void => {
  // This smoke test intentionally has no domain assertion yet. Importing the
  // public engine module above proves that the test runner can discover this
  // file and resolve the project's initial module boundary.
});
