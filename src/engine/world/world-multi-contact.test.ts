import { assert, assertEquals } from "@std/assert";

import { Body } from "../body/body.ts";
import { Circle } from "../geometry/circle.ts";
import { SemiImplicitEulerIntegrator } from "../kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import { World } from "./world.ts";

function createThreeTouchingCircles(): {
  readonly world: World;
  readonly body: Body;
} {
  return {
    world: new World({
      gravity: new Vector2(0, 0),
      integrator: new SemiImplicitEulerIntegrator(),
    }),
    body: new Body({ shape: new Circle(1) }),
  };
}

Deno.test("World one-batch response can leave a downstream contact closing", () => {
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

  // A↔B sees the incoming velocity and equalizes that pair to 1.5.
  // B↔C is solved from B's old velocity (zero), so it receives no impulse.
  assertEquals(left.velocity, new Vector2(1.5, 0));
  assertEquals(middle.velocity, new Vector2(1.5, 0));
  assertEquals(right.velocity, new Vector2(0, 0));

  // The bodies are still touching, but after the accumulated response B is
  // moving toward C. The downstream contact therefore remains unresolved.
  const downstreamRelativeNormalVelocity = right.velocity.x - middle.velocity.x;

  assertEquals(downstreamRelativeNormalVelocity, -1.5);
});

Deno.test(
  "World one-batch response can leave both contacts closing in a symmetric squeeze",
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

    // Each pair is solved independently from the same pre-response state.
    // A↔B tries to move B right by 1; B↔C tries to move B left by 1. Those
    // middle-body changes cancel when accumulated.
    assertEquals(left.velocity, new Vector2(1, 0));
    assertEquals(middle.velocity, new Vector2(0, 0));
    assertEquals(right.velocity, new Vector2(-1, 0));

    // Both touching contacts are still closing after the one-batch response.
    const leftContactRelativeNormalVelocity = middle.velocity.x - left.velocity.x;
    const rightContactRelativeNormalVelocity = right.velocity.x - middle.velocity.x;

    assertEquals(leftContactRelativeNormalVelocity, -1);
    assertEquals(rightContactRelativeNormalVelocity, -1);
  },
);
