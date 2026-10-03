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

Deno.test("Body uses zero restitution by default", () => {
  const body = new Body();

  assertEquals(body.restitution, 0);
});

Deno.test("Body retains supplied restitution", () => {
  const body = new Body({ restitution: 0.75 });

  assertEquals(body.restitution, 0.75);
});

Deno.test("Body accepts the restitution boundaries", () => {
  assertEquals(new Body({ restitution: 0 }).restitution, 0);
  assertEquals(new Body({ restitution: 1 }).restitution, 1);
});

Deno.test("Body rejects restitution below zero", () => {
  assertThrows(
    () => new Body({ restitution: -0.1 }),
    RangeError,
    "Body restitution must be between 0 and 1.",
  );
});

Deno.test("Body rejects restitution above one", () => {
  assertThrows(
    () => new Body({ restitution: 1.1 }),
    RangeError,
    "Body restitution must be between 0 and 1.",
  );
});

Deno.test("Body rejects non-finite restitution", () => {
  assertThrows(
    () => new Body({ restitution: Number.POSITIVE_INFINITY }),
    RangeError,
    "Body restitution must be finite.",
  );
});

Deno.test("Body uses zero friction by default", () => {
  const body = new Body();

  assertEquals(body.friction, 0);
});

Deno.test("Body retains supplied friction", () => {
  const body = new Body({ friction: 0.75 });

  assertEquals(body.friction, 0.75);
});

Deno.test("Body accepts friction greater than one", () => {
  const body = new Body({ friction: 1.5 });

  assertEquals(body.friction, 1.5);
});

Deno.test("Body rejects negative friction", () => {
  assertThrows(
    () => new Body({ friction: -0.1 }),
    RangeError,
    "Body friction must not be negative.",
  );
});

Deno.test("Body rejects non-finite friction", () => {
  assertThrows(
    () => new Body({ friction: Number.POSITIVE_INFINITY }),
    RangeError,
    "Body friction must be finite.",
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
