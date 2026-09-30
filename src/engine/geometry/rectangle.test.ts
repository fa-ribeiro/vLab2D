import { assertEquals, assertThrows } from "@std/assert";

import { Rectangle } from "./rectangle.ts";

Deno.test("Rectangle stores its dimensions", () => {
  const rectangle = new Rectangle(4, 2);

  assertEquals(rectangle.width, 4);
  assertEquals(rectangle.height, 2);
});

Deno.test("Rectangle rejects a zero dimension", () => {
  assertThrows(() => new Rectangle(0, 2), RangeError, "Rectangle width must be positive.");

  assertThrows(() => new Rectangle(4, 0), RangeError, "Rectangle height must be positive.");
});

Deno.test("Rectangle rejects a negative dimension", () => {
  assertThrows(() => new Rectangle(-1, 2), RangeError, "Rectangle width must be positive.");

  assertThrows(() => new Rectangle(4, -1), RangeError, "Rectangle height must be positive.");
});

Deno.test("Rectangle rejects a non-finite dimension", () => {
  for (const dimension of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertThrows(
      () => new Rectangle(dimension, 2),
      RangeError,
      "Rectangle width must be finite.",
    );

    assertThrows(
      () => new Rectangle(4, dimension),
      RangeError,
      "Rectangle height must be finite.",
    );
  }
});
