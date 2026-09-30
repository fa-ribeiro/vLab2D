import { assertFiniteNumber, assertNonNegativeNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";
import type { BodyState } from "../world/body-state.ts";

export function assertFiniteBodyState(state: BodyState, name: string): void {
  assertFiniteVector(state.position, `${name} position`);
  assertFiniteVector(state.velocity, `${name} velocity`);
  assertFiniteNumber(state.orientation, `${name} orientation`);
}

export function assertFiniteVector(vector: Vector2, name: string): void {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new RangeError(`${name} must contain finite components.`);
  }
}

export function assertValidTimestep(dt: number): void {
  assertFiniteNumber(dt, "The timestep");
  assertNonNegativeNumber(dt, "The timestep");
}
