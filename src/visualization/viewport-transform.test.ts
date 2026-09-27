import { assertEquals, assertThrows } from "@std/assert";

import { ViewportTransform } from "./viewport-transform.ts";

Deno.test("ViewportTransform maps the world origin to the viewport center", () => {
  const transform = new ViewportTransform(200, 100, 10);

  assertEquals(transform.worldToDisplayX(0), 100);
  assertEquals(transform.worldToDisplayY(0), 50);
});

Deno.test("ViewportTransform scales world X coordinates into display coordinates", () => {
  const transform = new ViewportTransform(200, 100, 10);

  assertEquals(transform.worldToDisplayX(2), 120);
  assertEquals(transform.worldToDisplayX(-2), 80);
});

Deno.test("ViewportTransform inverts world Y for display coordinates", () => {
  const transform = new ViewportTransform(200, 100, 10);

  assertEquals(transform.worldToDisplayY(3), 20);
  assertEquals(transform.worldToDisplayY(-3), 80);
});

Deno.test("ViewportTransform rejects an invalid viewport width", () => {
  assertThrows(
    () => new ViewportTransform(0, 100, 10),
    RangeError,
    "Width must be a positive finite number.",
  );
});

Deno.test("ViewportTransform rejects an invalid viewport height", () => {
  assertThrows(
    () => new ViewportTransform(200, 0, 10),
    RangeError,
    "Height must be a positive finite number.",
  );
});

Deno.test("ViewportTransform rejects an invalid display scale", () => {
  assertThrows(
    () => new ViewportTransform(200, 100, 0),
    RangeError,
    "Pixels per unit must be a positive finite number.",
  );
});

Deno.test("ViewportTransform exposes the visible world extent", () => {
  const transform = new ViewportTransform(100, 60, 20);

  assertEquals(transform.minWorldX, -2.5);
  assertEquals(transform.maxWorldX, 2.5);
  assertEquals(transform.minWorldY, -1.5);
  assertEquals(transform.maxWorldY, 1.5);
});
