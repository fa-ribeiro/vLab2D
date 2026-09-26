import { Vector2 } from "../math/vector2.ts";
import { KinematicState } from "./kinematic-state.ts";

export function assertFiniteState(state: KinematicState, name: string): void {
  assertFiniteVector(state.position, `${name} position`);
  assertFiniteVector(state.velocity, `${name} velocity`);
}

export function assertFiniteVector(vector: Vector2, name: string): void {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new RangeError(`${name} must contain finite components.`);
  }
}
