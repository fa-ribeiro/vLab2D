import { assert, assertEquals } from "@std/assert";

import { Body } from "./body.ts";
import { BODY_DEFAULTS } from "./body-defaults.ts";

Deno.test("BODY_DEFAULTS exposes the safe Body defaults in one place", () => {
  assertEquals(BODY_DEFAULTS.type, "dynamic");
  assertEquals(BODY_DEFAULTS.dynamicInverseMass, 1);
  assertEquals(BODY_DEFAULTS.staticInverseMass, 0);
  assertEquals(BODY_DEFAULTS.restitution, 0);
  assertEquals(BODY_DEFAULTS.friction, 0);
  assert(Object.isFrozen(BODY_DEFAULTS));
});

Deno.test("Body resolves omitted configuration through BODY_DEFAULTS", () => {
  const dynamicBody = new Body();
  const staticBody = new Body({ type: "static" });

  assertEquals(dynamicBody.type, BODY_DEFAULTS.type);
  assertEquals(dynamicBody.inverseMass, BODY_DEFAULTS.dynamicInverseMass);
  assertEquals(dynamicBody.restitution, BODY_DEFAULTS.restitution);
  assertEquals(dynamicBody.friction, BODY_DEFAULTS.friction);

  assertEquals(staticBody.inverseMass, BODY_DEFAULTS.staticInverseMass);
});
