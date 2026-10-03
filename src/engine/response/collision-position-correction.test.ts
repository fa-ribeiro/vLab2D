import { assertEquals, assertThrows } from "@std/assert";

import type { Collision } from "../collision/collision.ts";
import { Vector2 } from "../math/vector2.ts";
import { computeCollisionPositionCorrections } from "./collision-position-correction.ts";

Deno.test("computeCollisionPositionCorrections splits equal dynamic Bodies evenly", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 2,
  };

  const corrections = computeCollisionPositionCorrections(collision, 1, 1);

  assertEquals(corrections.bodyA, new Vector2(-1, 0));
  assertEquals(corrections.bodyB, new Vector2(1, 0));
});

Deno.test("computeCollisionPositionCorrections weights movement by inverse mass", () => {
  const collision: Collision = {
    normal: new Vector2(0, 1),
    penetrationDepth: 3,
  };

  const corrections = computeCollisionPositionCorrections(collision, 1, 0.5);

  assertEquals(corrections.bodyA, new Vector2(0, -2));
  assertEquals(corrections.bodyB, new Vector2(0, 1));
});

Deno.test("computeCollisionPositionCorrections moves only dynamic A against static B", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 2,
  };

  const corrections = computeCollisionPositionCorrections(collision, 1, 0);

  assertEquals(corrections.bodyA, new Vector2(-2, 0));
  assertEquals(corrections.bodyB, new Vector2(0, 0));
});

Deno.test("computeCollisionPositionCorrections moves only dynamic B against static A", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 2,
  };

  const corrections = computeCollisionPositionCorrections(collision, 0, 1);

  assertEquals(corrections.bodyA, new Vector2(0, 0));
  assertEquals(corrections.bodyB, new Vector2(2, 0));
});

Deno.test("computeCollisionPositionCorrections returns zero for two immovable Bodies", () => {
  const collision: Collision = {
    normal: new Vector2(0, 1),
    penetrationDepth: 3,
  };

  const corrections = computeCollisionPositionCorrections(collision, 0, 0);

  assertEquals(corrections.bodyA, new Vector2(0, 0));
  assertEquals(corrections.bodyB, new Vector2(0, 0));
});

Deno.test("computeCollisionPositionCorrections preserves an arbitrary collision normal", () => {
  const collision: Collision = {
    normal: new Vector2(0.6, 0.8),
    penetrationDepth: 2,
  };

  const corrections = computeCollisionPositionCorrections(collision, 1, 1);

  assertEquals(corrections.bodyA, new Vector2(-0.6, -0.8));
  assertEquals(corrections.bodyB, new Vector2(0.6, 0.8));
});

Deno.test("computeCollisionPositionCorrections returns zero translations for touching", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 0,
  };

  const corrections = computeCollisionPositionCorrections(collision, 1, 1);

  assertEquals(corrections.bodyA, new Vector2(0, 0));
  assertEquals(corrections.bodyB, new Vector2(0, 0));
});

Deno.test("computeCollisionPositionCorrections rejects negative inverse mass", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  assertThrows(
    () => computeCollisionPositionCorrections(collision, -1, 1),
    RangeError,
    "Body A inverse mass must not be negative.",
  );
});

Deno.test("computeCollisionPositionCorrections rejects non-finite inverse mass", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  assertThrows(
    () => computeCollisionPositionCorrections(collision, 1, Number.POSITIVE_INFINITY),
    RangeError,
    "Body B inverse mass must be finite.",
  );
});
