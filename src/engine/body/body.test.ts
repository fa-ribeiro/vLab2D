import { assertEquals, assertStrictEquals } from "@std/assert";

import { Circle } from "../geometry/circle.ts";
import { Body } from "./body.ts";

Deno.test("Body is shapeless by default", () => {
  const body = new Body();

  assertEquals(body.shape, undefined);
});

Deno.test("Body retains supplied Circle geometry", () => {
  const circle = new Circle(2);

  const body = new Body({ shape: circle });

  assertStrictEquals(body.shape, circle);
});

Deno.test("Circle geometry can be reused by multiple Body definitions", () => {
  const circle = new Circle(2);

  const firstBody = new Body({ shape: circle });
  const secondBody = new Body({ shape: circle });

  assertStrictEquals(firstBody.shape, circle);
  assertStrictEquals(secondBody.shape, circle);
});
