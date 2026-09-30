import { assertEquals, assertThrows } from "@std/assert";

import { Circle } from "./circle.ts";

Deno.test("Circle stores its radius", () => {
  const circle = new Circle(2.5);

  assertEquals(circle.radius, 2.5);
});

Deno.test("Circle rejects a zero radius", () => {
  assertThrows(() => new Circle(0), RangeError, "Circle radius must be positive.");
});

Deno.test("Circle rejects a negative radius", () => {
  assertThrows(() => new Circle(-1), RangeError, "Circle radius must be positive.");
});

Deno.test("Circle rejects a non-finite radius", () => {
  for (const radius of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertThrows(() => new Circle(radius), RangeError, "Circle radius must be finite.");
  }
});
