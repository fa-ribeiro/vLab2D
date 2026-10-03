import { assertEquals, assertThrows } from "@std/assert";

import type { Collision } from "../collision/collision.ts";
import { Vector2 } from "../math/vector2.ts";
import { computeCollisionNormalImpulse } from "./collision-normal-impulse.ts";

Deno.test(
  "computeCollisionNormalImpulse removes closing normal velocity for equal Bodies",
  () => {
    const collision: Collision = {
      normal: new Vector2(1, 0),
      penetrationDepth: 1,
    };

    const response = computeCollisionNormalImpulse(
      collision,
      new Vector2(2, 1),
      new Vector2(-2, -3),
      1,
      1,
    );

    assertEquals(response.impulse, new Vector2(2, 0));
    assertEquals(response.bodyAVelocityChange, new Vector2(-2, 0));
    assertEquals(response.bodyBVelocityChange, new Vector2(2, 0));
  },
);

Deno.test("computeCollisionNormalImpulse weights velocity change by inverse mass", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  const response = computeCollisionNormalImpulse(
    collision,
    new Vector2(4, 0),
    new Vector2(0, 0),
    0.25,
    0.75,
  );

  assertEquals(response.impulse, new Vector2(4, 0));
  assertEquals(response.bodyAVelocityChange, new Vector2(-1, 0));
  assertEquals(response.bodyBVelocityChange, new Vector2(3, 0));
});

Deno.test(
  "computeCollisionNormalImpulse gives a dynamic Body the full response against static",
  () => {
    const collision: Collision = {
      normal: new Vector2(0, 1),
      penetrationDepth: 1,
    };

    const response = computeCollisionNormalImpulse(
      collision,
      new Vector2(4, 3),
      new Vector2(0, 0),
      1,
      0,
    );

    assertEquals(response.impulse, new Vector2(0, 3));
    assertEquals(response.bodyAVelocityChange, new Vector2(0, -3));
    assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
  },
);

Deno.test("computeCollisionNormalImpulse supports static A against dynamic B", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  const response = computeCollisionNormalImpulse(
    collision,
    new Vector2(0, 0),
    new Vector2(-3, 2),
    0,
    1,
  );

  assertEquals(response.impulse, new Vector2(3, 0));
  assertEquals(response.bodyAVelocityChange, new Vector2(0, 0));
  assertEquals(response.bodyBVelocityChange, new Vector2(3, 0));
});

Deno.test("computeCollisionNormalImpulse leaves separating Bodies unchanged", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  const response = computeCollisionNormalImpulse(
    collision,
    new Vector2(-1, 0),
    new Vector2(1, 0),
    1,
    1,
  );

  assertEquals(response.impulse, new Vector2(0, 0));
  assertEquals(response.bodyAVelocityChange, new Vector2(0, 0));
  assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
});

Deno.test("computeCollisionNormalImpulse leaves tangential relative velocity unchanged", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  const response = computeCollisionNormalImpulse(
    collision,
    new Vector2(0, 2),
    new Vector2(0, -3),
    1,
    1,
  );

  assertEquals(response.impulse, new Vector2(0, 0));
  assertEquals(response.bodyAVelocityChange, new Vector2(0, 0));
  assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
});

Deno.test(
  "computeCollisionNormalImpulse returns zero response for two zero-inverse-mass Bodies",
  () => {
    const collision: Collision = {
      normal: new Vector2(1, 0),
      penetrationDepth: 1,
    };

    const response = computeCollisionNormalImpulse(
      collision,
      new Vector2(0, 0),
      new Vector2(0, 0),
      0,
      0,
    );

    assertEquals(response.impulse, new Vector2(0, 0));
    assertEquals(response.bodyAVelocityChange, new Vector2(0, 0));
    assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
  },
);

Deno.test("computeCollisionNormalImpulse rejects negative inverse mass", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  assertThrows(
    () => computeCollisionNormalImpulse(collision, new Vector2(0, 0), new Vector2(0, 0), -1, 1),
    RangeError,
    "Body A inverse mass must not be negative.",
  );
});

Deno.test("computeCollisionNormalImpulse rejects non-finite inverse mass", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  assertThrows(
    () =>
      computeCollisionNormalImpulse(
        collision,
        new Vector2(0, 0),
        new Vector2(0, 0),
        1,
        Number.POSITIVE_INFINITY,
      ),
    RangeError,
    "Body B inverse mass must be finite.",
  );
});
