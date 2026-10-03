import { assert, assertEquals } from "@std/assert";

import { Body } from "./body.ts";
import { BODY_DEFAULTS } from "./body-config.ts";

Deno.test("BODY_DEFAULTS exposes the canonical Body fallback values", () => {
  assertEquals(BODY_DEFAULTS.type, "dynamic");
  assertEquals(BODY_DEFAULTS.inverseMass.dynamic, 1);
  assertEquals(BODY_DEFAULTS.inverseMass.static, 0);
  assertEquals(BODY_DEFAULTS.restitution, 0);
  assertEquals(BODY_DEFAULTS.friction, 0);
  assert(Object.isFrozen(BODY_DEFAULTS));
  assert(Object.isFrozen(BODY_DEFAULTS.inverseMass));
});

Deno.test("Body resolves omitted configuration through BODY_DEFAULTS", () => {
  const dynamicBody = new Body();
  const staticBody = new Body({ type: "static" });

  assertEquals(dynamicBody.type, BODY_DEFAULTS.type);
  assertEquals(dynamicBody.inverseMass, BODY_DEFAULTS.inverseMass.dynamic);
  assertEquals(dynamicBody.restitution, BODY_DEFAULTS.restitution);
  assertEquals(dynamicBody.friction, BODY_DEFAULTS.friction);
  assertEquals(staticBody.inverseMass, BODY_DEFAULTS.inverseMass.static);
});
