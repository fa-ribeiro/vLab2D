import { assertEquals, assertThrows } from "@std/assert";

import type { Collision } from "../collision/collision.ts";
import { Vector2 } from "../math/vector2.ts";
import { computeCollisionFrictionImpulse } from "./collision-friction-impulse.ts";

const collision: Collision = {
  normal: new Vector2(1, 0),
  penetrationDepth: 1,
};

Deno.test(
  "computeCollisionFrictionImpulse cancels tangential motion within Coulomb limit",
  () => {
    const response = computeCollisionFrictionImpulse(
      collision,
      new Vector2(3, 1),
      new Vector2(0, 0),
      1,
      0,
      new Vector2(3, 0),
      1,
    );

    assertEquals(response.impulse, new Vector2(0, 1));
    assertEquals(response.bodyAVelocityChange, new Vector2(0, -1));
    assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
  },
);

Deno.test("computeCollisionFrictionImpulse clamps sliding friction by normal impulse", () => {
  const response = computeCollisionFrictionImpulse(
    collision,
    new Vector2(3, 4),
    new Vector2(0, 0),
    1,
    0,
    new Vector2(3, 0),
    0.5,
  );

  assertEquals(response.impulse, new Vector2(0, 1.5));
  assertEquals(response.bodyAVelocityChange, new Vector2(0, -1.5));
  assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
});

Deno.test("computeCollisionFrictionImpulse weights velocity change by inverse mass", () => {
  const response = computeCollisionFrictionImpulse(
    collision,
    new Vector2(3, 4),
    new Vector2(0, 0),
    0.25,
    0.75,
    new Vector2(4, 0),
    10,
  );

  assertEquals(response.impulse, new Vector2(0, 4));
  assertEquals(response.bodyAVelocityChange, new Vector2(0, -1));
  assertEquals(response.bodyBVelocityChange, new Vector2(0, 3));
});

Deno.test("computeCollisionFrictionImpulse returns zero for frictionless contact", () => {
  const response = computeCollisionFrictionImpulse(
    collision,
    new Vector2(3, 4),
    new Vector2(0, 0),
    1,
    0,
    new Vector2(3, 0),
    0,
  );

  assertEquals(response.impulse, new Vector2(0, 0));
  assertEquals(response.bodyAVelocityChange, new Vector2(0, 0));
  assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
});

Deno.test("computeCollisionFrictionImpulse returns zero without normal impulse", () => {
  const response = computeCollisionFrictionImpulse(
    collision,
    new Vector2(0, 4),
    new Vector2(0, 0),
    1,
    0,
    new Vector2(0, 0),
    1,
  );

  assertEquals(response.impulse, new Vector2(0, 0));
});

Deno.test("computeCollisionFrictionImpulse returns zero without tangential motion", () => {
  const response = computeCollisionFrictionImpulse(
    collision,
    new Vector2(3, 0),
    new Vector2(0, 0),
    1,
    0,
    new Vector2(3, 0),
    1,
  );

  assertEquals(response.impulse, new Vector2(0, 0));
});

Deno.test("computeCollisionFrictionImpulse returns zero for two immovable Bodies", () => {
  const response = computeCollisionFrictionImpulse(
    collision,
    new Vector2(0, 4),
    new Vector2(0, 0),
    0,
    0,
    new Vector2(3, 0),
    1,
  );

  assertEquals(response.impulse, new Vector2(0, 0));
});

Deno.test("computeCollisionFrictionImpulse rejects negative friction", () => {
  assertThrows(
    () =>
      computeCollisionFrictionImpulse(
        collision,
        new Vector2(0, 0),
        new Vector2(0, 0),
        1,
        1,
        new Vector2(1, 0),
        -0.1,
      ),
    RangeError,
    "Friction must not be negative.",
  );
});

Deno.test("computeCollisionFrictionImpulse rejects non-finite friction", () => {
  assertThrows(
    () =>
      computeCollisionFrictionImpulse(
        collision,
        new Vector2(0, 0),
        new Vector2(0, 0),
        1,
        1,
        new Vector2(1, 0),
        Number.POSITIVE_INFINITY,
      ),
    RangeError,
    "Friction must be finite.",
  );
});
