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

Deno.test(
  "computeCollisionNormalImpulse solves toward a positive normal-velocity target",
  () => {
    const collision: Collision = {
      normal: new Vector2(1, 0),
      penetrationDepth: 1,
    };

    const response = computeCollisionNormalImpulse(
      collision,
      new Vector2(2, 5),
      new Vector2(-2, -7),
      1,
      1,
      2,
    );

    // Initial relative normal velocity is -4. Reaching target +2 requires a
    // relative change of +6, split equally across the two equal inverse masses.
    assertEquals(response.impulse, new Vector2(3, 0));
    assertEquals(response.bodyAVelocityChange, new Vector2(-3, 0));
    assertEquals(response.bodyBVelocityChange, new Vector2(3, 0));
  },
);

Deno.test(
  "computeCollisionNormalImpulse continues toward a positive target after separation begins",
  () => {
    const collision: Collision = {
      normal: new Vector2(1, 0),
      penetrationDepth: 1,
    };

    const response = computeCollisionNormalImpulse(
      collision,
      new Vector2(0, 0),
      new Vector2(0.5, 3),
      1,
      1,
      1.5,
    );

    // Current vn is already +0.5, but the fixed target is +1.5. A solver that
    // stopped merely because the pair is separating would under-solve bounce.
    assertEquals(response.impulse, new Vector2(0.5, 0));
    assertEquals(response.bodyAVelocityChange, new Vector2(-0.5, 0));
    assertEquals(response.bodyBVelocityChange, new Vector2(0.5, 0));
  },
);

Deno.test("computeCollisionNormalImpulse stops when the target is reached", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  const response = computeCollisionNormalImpulse(
    collision,
    new Vector2(-0.5, 0),
    new Vector2(1, 0),
    1,
    1,
    1.5,
  );

  assertEquals(response.impulse, new Vector2(0, 0));
  assertEquals(response.bodyAVelocityChange, new Vector2(0, 0));
  assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
});

Deno.test(
  "computeCollisionNormalImpulse does not pull a pair back toward a lower target",
  () => {
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
      1.5,
    );

    // Current vn is +2, already above the requested +1.5 target. Contact impulses
    // are unilateral: the solver does not pull separating Bodies back together.
    assertEquals(response.impulse, new Vector2(0, 0));
    assertEquals(response.bodyAVelocityChange, new Vector2(0, 0));
    assertEquals(response.bodyBVelocityChange, new Vector2(0, 0));
  },
);

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
      1,
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

Deno.test("computeCollisionNormalImpulse rejects negative target normal velocity", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  assertThrows(
    () =>
      computeCollisionNormalImpulse(
        collision,
        new Vector2(1, 0),
        new Vector2(-1, 0),
        1,
        1,
        -0.1,
      ),
    RangeError,
    "Target normal velocity must not be negative.",
  );
});

Deno.test("computeCollisionNormalImpulse rejects non-finite target normal velocity", () => {
  const collision: Collision = {
    normal: new Vector2(1, 0),
    penetrationDepth: 1,
  };

  assertThrows(
    () =>
      computeCollisionNormalImpulse(
        collision,
        new Vector2(1, 0),
        new Vector2(-1, 0),
        1,
        1,
        Number.POSITIVE_INFINITY,
      ),
    RangeError,
    "Target normal velocity must be finite.",
  );
});
