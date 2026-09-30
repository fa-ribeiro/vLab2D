import { type BodyId, type BodySnapshot, Rectangle } from "../engine/mod.ts";
import { ViewportTransform } from "./viewport-transform.ts";

/**
 * Resolves display-space pointer positions against detached body snapshots.
 *
 * Picking is a visualization interaction concern rather than a rendering
 * operation. The picker shares the same ViewportTransform used by rendering so
 * pan and zoom state cannot drift between what is drawn and what can be picked.
 */
export class BodyPicker {
  readonly #transform: ViewportTransform;
  readonly #shapelessBodyRadius: number;

  /**
   * Creates a body picker.
   *
   * @param transform The shared world-to-display viewport transform.
   * @param shapelessBodyRadius The fixed display-space radius used by the
   * presentation marker for shapeless bodies.
   * @throws {RangeError} If the shapeless body radius is not positive and finite.
   */
  public constructor(transform: ViewportTransform, shapelessBodyRadius = 4) {
    assertPositiveFinite(shapelessBodyRadius, "Shapeless body radius");

    this.#transform = transform;
    this.#shapelessBodyRadius = shapelessBodyRadius;
  }

  /**
   * Finds the nearest body whose current display-space extent contains a point.
   *
   * Shapeless bodies use their fixed circular presentation marker. Circle and
   * Rectangle bodies use their world-space geometry transformed by the current
   * viewport scale. Rectangle picking transforms the display-space point into
   * the body-local coordinate frame before testing local bounds.
   *
   * When multiple bodies contain the point, the body with the nearest display-
   * space center is returned.
   *
   * @param snapshots Detached body observations to test.
   * @param displayX Horizontal point coordinate in display units.
   * @param displayY Vertical point coordinate in display units.
   * @returns The identifier of the nearest hit body, or `undefined` when no
   * body contains the point.
   */
  public findBodyAtDisplayPoint(
    snapshots: readonly BodySnapshot[],
    displayX: number,
    displayY: number,
  ): BodyId | undefined {
    let nearestBodyId: BodyId | undefined;
    let nearestDistanceSquared = Number.POSITIVE_INFINITY;

    for (const snapshot of snapshots) {
      const bodyX = this.#transform.worldToDisplayX(snapshot.state.position.x);
      const bodyY = this.#transform.worldToDisplayY(snapshot.state.position.y);

      const deltaX = displayX - bodyX;
      const deltaY = displayY - bodyY;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;

      const shape = snapshot.definition.shape;

      let hit: boolean;

      if (shape instanceof Rectangle) {
        const halfWidth = (shape.width * this.#transform.pixelsPerUnit) / 2;
        const halfHeight = (shape.height * this.#transform.pixelsPerUnit) / 2;

        // Rendering rotates Rectangle-local coordinates by -orientation because
        // display Y points down. Picking applies the inverse display rotation so
        // the point can be tested against the simple local Rectangle bounds.
        const cos = Math.cos(snapshot.state.orientation);
        const sin = Math.sin(snapshot.state.orientation);

        const localX = deltaX * cos - deltaY * sin;
        const localY = deltaX * sin + deltaY * cos;

        hit = Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
      } else {
        const radius = shape === undefined
          ? this.#shapelessBodyRadius
          : shape.radius * this.#transform.pixelsPerUnit;

        hit = distanceSquared <= radius * radius;
      }

      if (hit && distanceSquared < nearestDistanceSquared) {
        nearestBodyId = snapshot.id;
        nearestDistanceSquared = distanceSquared;
      }
    }

    return nearestBodyId;
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
