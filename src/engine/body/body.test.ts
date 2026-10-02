import { assertEquals, assertStrictEquals } from "@std/assert";

import { Body } from "./body.ts";
import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";

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
