import { assert, assertAlmostEquals, assertEquals } from "@std/assert";

import { Vector2 } from "./vector2.ts";

function assertVector(actual: Vector2, expectedX: number, expectedY: number): void {
  assertEquals(actual.x, expectedX);
  assertEquals(actual.y, expectedY);
}

Deno.test("Vector2 stores its components", () => {
  const vector = new Vector2(3, -4);

  assertVector(vector, 3, -4);
});

Deno.test("Vector2.add returns the component-wise sum", () => {
  const left = new Vector2(1, 2);
  const right = new Vector2(3, 4);

  const result = left.add(right);

  assertVector(result, 4, 6);
});

Deno.test("Vector2.add does not modify either operand", () => {
  const left = new Vector2(1, 2);
  const right = new Vector2(3, 4);

  const result = left.add(right);

  assert(result !== left);
  assert(result !== right);

  assertVector(left, 1, 2);
  assertVector(right, 3, 4);
});

Deno.test("Vector2.subtract returns the component-wise difference", () => {
  const left = new Vector2(5, 7);
  const right = new Vector2(2, 3);

  const result = left.subtract(right);

  assertVector(result, 3, 4);
});

Deno.test("Vector2.subtract does not modify either operand", () => {
  const left = new Vector2(5, 7);
  const right = new Vector2(2, 3);

  left.subtract(right);

  assertVector(left, 5, 7);
  assertVector(right, 2, 3);
});

Deno.test("Vector2.scale multiplies both components", () => {
  const vector = new Vector2(3, -4);

  const result = vector.scale(2);

  assertVector(result, 6, -8);
});

Deno.test("Vector2.scale supports negative and zero scalars", () => {
  const vector = new Vector2(3, -4);

  assertVector(vector.scale(-2), -6, 8);
  assertVector(vector.scale(0), 0, 0);
});

Deno.test("Vector2.scale does not modify the original vector", () => {
  const vector = new Vector2(3, -4);

  const result = vector.scale(2);

  assert(result !== vector);
  assertVector(vector, 3, -4);
});

Deno.test("Vector2.dot returns the scalar dot product", () => {
  const left = new Vector2(3, 4);
  const right = new Vector2(2, -1);

  assertEquals(left.dot(right), 2);
});

Deno.test("Vector2.rotate uses positive counter-clockwise angles", () => {
  const result = new Vector2(2, 0).rotate(Math.PI / 2);

  assertAlmostEquals(result.x, 0, 1e-12);
  assertAlmostEquals(result.y, 2, 1e-12);
});

Deno.test("Vector2.rotate preserves vector length", () => {
  const vector = new Vector2(3, 4);
  const result = vector.rotate(Math.PI / 3);

  assertAlmostEquals(result.x * result.x + result.y * result.y, 25, 1e-12);
});

Deno.test("Vector2.rotate does not modify the original vector", () => {
  const vector = new Vector2(3, -4);

  const result = vector.rotate(Math.PI / 2);

  assert(result !== vector);
  assertVector(vector, 3, -4);
});
