import { assert, assertEquals } from "@std/assert";

import { Body } from "../../src/engine/body/body.ts";
import { Circle } from "../../src/engine/geometry/circle.ts";
import { SemiImplicitEulerIntegrator } from "../../src/engine/kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../../src/engine/math/vector2.ts";
import { WORLD_DEFAULTS } from "../../src/engine/world/world-config.ts";
import { World } from "../../src/engine/world/world.ts";

function createThreeTouchingCircles(velocityIterations = WORLD_DEFAULTS.velocityIterations): {
  readonly world: World;
  readonly body: Body;
} {
  return {
    world: new World({
      gravity: new Vector2(0, 0),
      integrator: new SemiImplicitEulerIntegrator(),
      velocityIterations,
    }),
    body: new Body({ shape: new Circle(1) }),
  };
}

Deno.test("World one velocity iteration reproduces one-batch contact response", () => {
  const { world, body } = createThreeTouchingCircles(1);

  const leftId = world.addBody(body, {
    position: new Vector2(0, 0),
    velocity: new Vector2(3, 0),
  });
  const middleId = world.addBody(body, {
    position: new Vector2(2, 0),
  });
  const rightId = world.addBody(body, {
    position: new Vector2(4, 0),
  });

  world.step(0);

  const left = world.getBodyState(leftId);
  const middle = world.getBodyState(middleId);
  const right = world.getBodyState(rightId);

  assert(left !== undefined);
  assert(middle !== undefined);
  assert(right !== undefined);

  assertEquals(left.velocity, new Vector2(1.5, 0));
  assertEquals(middle.velocity, new Vector2(1.5, 0));
  assertEquals(right.velocity, new Vector2(0, 0));
});

Deno.test(
  "World default velocity iterations propagate response through coupled contacts",
  () => {
    const { world, body } = createThreeTouchingCircles();

    const leftId = world.addBody(body, {
      position: new Vector2(0, 0),
      velocity: new Vector2(3, 0),
    });
    const middleId = world.addBody(body, {
      position: new Vector2(2, 0),
    });
    const rightId = world.addBody(body, {
      position: new Vector2(4, 0),
    });

    world.step(0);

    const left = world.getBodyState(leftId);
    const middle = world.getBodyState(middleId);
    const right = world.getBodyState(rightId);

    assert(left !== undefined);
    assert(middle !== undefined);
    assert(right !== undefined);

    // Eight batch passes approach the common inelastic velocity 1 while
    // preserving the snapshot/accumulate/apply structure inside each pass.
    assertEquals(left.velocity, new Vector2(1.0078125, 0));
    assertEquals(middle.velocity, new Vector2(0.99609375, 0));
    assertEquals(right.velocity, new Vector2(0.99609375, 0));

    // The downstream B↔C contact is no longer closing. The small remaining A↔B
    // error documents that a fixed iteration count is an approximation rather
    // than an exact simultaneous constraint solve.
    assertEquals(right.velocity.x - middle.velocity.x, 0);
    assertEquals(middle.velocity.x - left.velocity.x, -0.01171875);
  },
);

Deno.test(
  "World batch velocity iterations preserve symmetry while reducing closing speed",
  () => {
    const { world, body } = createThreeTouchingCircles();

    const leftId = world.addBody(body, {
      position: new Vector2(0, 0),
      velocity: new Vector2(2, 0),
    });
    const middleId = world.addBody(body, {
      position: new Vector2(2, 0),
    });
    const rightId = world.addBody(body, {
      position: new Vector2(4, 0),
      velocity: new Vector2(-2, 0),
    });

    world.step(0);

    const left = world.getBodyState(leftId);
    const middle = world.getBodyState(middleId);
    const right = world.getBodyState(rightId);

    assert(left !== undefined);
    assert(middle !== undefined);
    assert(right !== undefined);

    assertEquals(left.velocity, new Vector2(0.0078125, 0));
    assertEquals(middle.velocity, new Vector2(0, 0));
    assertEquals(right.velocity, new Vector2(-0.0078125, 0));

    // The central body remains exactly centered in velocity space and the outer
    // bodies remain exact mirror images because every pass is solved as a batch.
    assertEquals(middle.velocity.x, 0);
    assertEquals(left.velocity.x, -right.velocity.x);

    // Each contact's closing speed has fallen from 2 initially (and 1 after the
    // former one-batch response) to a small residual determined by the finite
    // iteration count.
    assertEquals(middle.velocity.x - left.velocity.x, -0.0078125);
    assertEquals(right.velocity.x - middle.velocity.x, -0.0078125);
  },
);

Deno.test(
  "World multi-contact restitution keeps the impact-time bounce target across iterations",
  () => {
    const world = new World({
      gravity: new Vector2(0, 0),
      integrator: new SemiImplicitEulerIntegrator(),
    });
    const body = new Body({
      shape: new Circle(1),
      restitution: 0.9,
    });

    const leftId = world.addBody(body, {
      position: new Vector2(0, 0),
      velocity: new Vector2(2, 0),
    });
    const middleId = world.addBody(body, {
      position: new Vector2(2, 0),
    });
    const rightId = world.addBody(body, {
      position: new Vector2(4, 0),
      velocity: new Vector2(-2, 0),
    });

    world.step(0);

    const left = world.getBodyState(leftId);
    const middle = world.getBodyState(middleId);
    const right = world.getBodyState(rightId);

    assert(left !== undefined);
    assert(middle !== undefined);
    assert(right !== undefined);

    // Both contacts capture initial vn = -2. With restitution 0.9, each fixed
    // target is therefore +1.8. Eight symmetric batch passes approach that
    // target without redefining it from progressively smaller intermediate
    // velocities.
    assertEquals(left.velocity, new Vector2(-1.78515625, 0));
    assertEquals(middle.velocity, new Vector2(0, 0));
    assertEquals(right.velocity, new Vector2(1.78515625, 0));

    assertEquals(middle.velocity.x - left.velocity.x, 1.78515625);
    assertEquals(right.velocity.x - middle.velocity.x, 1.78515625);

    // Most importantly, the outer Bodies have actually reversed direction.
    // The former iterative-restitution implementation incorrectly converged
    // toward zero horizontal velocity instead.
    assert(left.velocity.x < 0);
    assert(right.velocity.x > 0);
  },
);
