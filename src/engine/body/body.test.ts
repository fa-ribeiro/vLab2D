import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";

import { Body } from "./body.ts";
import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";

Deno.test("Body is dynamic by default", () => {
  const body = new Body();

  assertEquals(body.type, "dynamic");
});

Deno.test("Body is shapeless by default", () => {
  const body = new Body();

  assertEquals(body.shape, undefined);
});

Deno.test("dynamic Body uses unit inverse mass by default", () => {
  const body = new Body();

  assertEquals(body.inverseMass, 1);
});

Deno.test("dynamic Body retains supplied inverse mass", () => {
  const body = new Body({ inverseMass: 0.25 });

  assertEquals(body.inverseMass, 0.25);
});

Deno.test("static Body uses zero inverse mass by default", () => {
  const body = new Body({ type: "static" });

  assertEquals(body.type, "static");
  assertEquals(body.inverseMass, 0);
});

Deno.test("static Body accepts explicit zero inverse mass", () => {
  const body = new Body({ type: "static", inverseMass: 0 });

  assertEquals(body.inverseMass, 0);
});

Deno.test("dynamic Body rejects zero inverse mass", () => {
  assertThrows(
    () => new Body({ type: "dynamic", inverseMass: 0 }),
    RangeError,
    "Dynamic Body inverse mass must be positive.",
  );
});

Deno.test("dynamic Body rejects negative inverse mass", () => {
  assertThrows(
    () => new Body({ inverseMass: -1 }),
    RangeError,
    "Dynamic Body inverse mass must be positive.",
  );
});

Deno.test("static Body rejects non-zero inverse mass", () => {
  assertThrows(
    () => new Body({ type: "static", inverseMass: 0.5 }),
    RangeError,
    "Static Body inverse mass must be zero.",
  );
});

Deno.test("Body rejects non-finite inverse mass", () => {
  assertThrows(
    () => new Body({ inverseMass: Number.POSITIVE_INFINITY }),
    RangeError,
    "Body inverse mass must be finite.",
  );
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

Deno.test("Body retains supplied Rectangle geometry", () => {
  const rectangle = new Rectangle(4, 2);

  const body = new Body({ shape: rectangle });

  assertStrictEquals(body.shape, rectangle);
});

Deno.test("Rectangle geometry can be reused by multiple Body definitions", () => {
  const rectangle = new Rectangle(4, 2);

  const firstBody = new Body({ shape: rectangle });
  const secondBody = new Body({ shape: rectangle });

  assertStrictEquals(firstBody.shape, rectangle);
  assertStrictEquals(secondBody.shape, rectangle);
});

Deno.test("Body retains supplied RegularPolygon geometry", () => {
  const polygon = new RegularPolygon(5, 2);

  const body = new Body({ shape: polygon });

  assertStrictEquals(body.shape, polygon);
});

Deno.test("RegularPolygon geometry can be reused by multiple Body definitions", () => {
  const polygon = new RegularPolygon(6, 2);

  const firstBody = new Body({ shape: polygon });
  const secondBody = new Body({ shape: polygon });

  assertStrictEquals(firstBody.shape, polygon);
  assertStrictEquals(secondBody.shape, polygon);
});
