import { assertEquals } from "@std/assert";

import { Body } from "../body/body.ts";
import { Circle } from "../geometry/circle.ts";
import { Vector2 } from "../math/vector2.ts";
import type { BodyId } from "../world/body-id.ts";
import type { BodySnapshot } from "../world/body-snapshot.ts";
import type { BodyState } from "../world/body-state.ts";
import { detectBodyCollisionCandidates } from "./detect-body-collision-candidates.ts";

function state(position: Vector2): BodyState {
  return {
    position,
    velocity: new Vector2(0, 0),
    orientation: 0,
    angularVelocity: 0,
  };
}

function snapshot(id: BodyId, body: Body, position: Vector2): BodySnapshot {
  return {
    id,
    definition: body,
    state: state(position),
  };
}

Deno.test("detectBodyCollisionCandidates reports AABB-overlapping pairs", () => {
  const circle = new Body({ shape: new Circle(1) });

  assertEquals(
    detectBodyCollisionCandidates([
      snapshot(1, circle, new Vector2(0, 0)),
      snapshot(2, circle, new Vector2(1.5, 0)),
    ]),
    [{ bodyAId: 1, bodyBId: 2 }],
  );
});

Deno.test("detectBodyCollisionCandidates omits AABB-separated pairs", () => {
  const circle = new Body({ shape: new Circle(1) });

  assertEquals(
    detectBodyCollisionCandidates([
      snapshot(1, circle, new Vector2(0, 0)),
      snapshot(2, circle, new Vector2(3, 0)),
    ]),
    [],
  );
});

Deno.test("detectBodyCollisionCandidates includes narrow-phase false positives", () => {
  const circle = new Body({ shape: new Circle(1) });

  assertEquals(
    detectBodyCollisionCandidates([
      snapshot(1, circle, new Vector2(0, 0)),
      snapshot(2, circle, new Vector2(1.9, 1.9)),
    ]),
    [{ bodyAId: 1, bodyBId: 2 }],
  );
});

Deno.test("detectBodyCollisionCandidates treats touching AABBs as candidates", () => {
  const circle = new Body({ shape: new Circle(1) });

  assertEquals(
    detectBodyCollisionCandidates([
      snapshot(1, circle, new Vector2(0, 0)),
      snapshot(2, circle, new Vector2(2, 0)),
    ]),
    [{ bodyAId: 1, bodyBId: 2 }],
  );
});

Deno.test("detectBodyCollisionCandidates skips shapeless Bodies", () => {
  const shapeless = new Body();
  const circle = new Body({ shape: new Circle(1) });

  assertEquals(
    detectBodyCollisionCandidates([
      snapshot(1, shapeless, new Vector2(0, 0)),
      snapshot(2, circle, new Vector2(0, 0)),
    ]),
    [],
  );
});
