import { type BodyId, type BodySnapshot, Rectangle } from "../../engine/mod.ts";
import { ViewportTransform } from "../viewport/viewport-transform.ts";

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
  readonly #pickTolerance: number;

  /**
   * Creates a body picker.
   *
   * @param transform The shared world-to-display viewport transform.
   * @param shapelessBodyRadius The fixed display-space radius used by the
   * presentation marker for shapeless bodies.
   * @param pickTolerance The non-negative display-space distance outside body
   * geometry that still counts as a pick.
   * @throws {RangeError} If the shapeless body radius is not positive and finite
   * or the pick tolerance is negative or not finite.
   */
  public constructor(transform: ViewportTransform, shapelessBodyRadius = 4, pickTolerance = 0) {
    assertPositiveFinite(shapelessBodyRadius, "Shapeless body radius");
    assertNonNegativeFinite(pickTolerance, "Pick tolerance");

    this.#transform = transform;
    this.#shapelessBodyRadius = shapelessBodyRadius;
    this.#pickTolerance = pickTolerance;
  }

  /**
   * Finds the body nearest to a display-space point within the pick tolerance.
   *
   * Shapeless bodies use their fixed circular presentation marker. Circle and
   * Rectangle bodies use their world-space geometry transformed by the current
   * viewport scale. Rectangle picking transforms the display-space point into
   * the body-local coordinate frame before measuring distance to local bounds.
   *
   * Candidate bodies are ranked first by distance from the pointer to their
   * displayed geometry. When those distances are equal, the nearest display-
   * space body center wins.
   *
   * @param snapshots Detached body observations to test.
   * @param displayX Horizontal point coordinate in display units.
   * @param displayY Vertical point coordinate in display units.
   * @returns The identifier of the nearest candidate body, or `undefined` when
   * no body lies within the pick tolerance.
   */
  public findBodyAtDisplayPoint(
    snapshots: readonly BodySnapshot[],
    displayX: number,
    displayY: number,
  ): BodyId | undefined {
    let nearestBodyId: BodyId | undefined;
    let nearestGeometryDistanceSquared = Number.POSITIVE_INFINITY;
    let nearestCenterDistanceSquared = Number.POSITIVE_INFINITY;

    const toleranceSquared = this.#pickTolerance * this.#pickTolerance;

    for (const snapshot of snapshots) {
      const bodyX = this.#transform.worldToDisplayX(snapshot.state.position.x);
      const bodyY = this.#transform.worldToDisplayY(snapshot.state.position.y);

      const deltaX = displayX - bodyX;
      const deltaY = displayY - bodyY;
      const centerDistanceSquared = deltaX * deltaX + deltaY * deltaY;

      const shape = snapshot.definition.shape;

      // Picking measures distance to the body's visible/pick geometry rather
      // than distance to its center. A point inside the geometry therefore has
      // zero geometry distance and is already an exact hit before tolerance is
      // considered.
      let geometryDistanceSquared: number;

      if (shape instanceof Rectangle) {
        const halfWidth = (shape.width * this.#transform.pixelsPerUnit) / 2;
        const halfHeight = (shape.height * this.#transform.pixelsPerUnit) / 2;

        // Rendering rotates Rectangle-local coordinates by -orientation because
        // display Y points down. Picking applies the inverse display rotation so
        // distance can be measured against the simple local Rectangle bounds.
        const cos = Math.cos(snapshot.state.orientation);
        const sin = Math.sin(snapshot.state.orientation);

        const localX = deltaX * cos - deltaY * sin;
        const localY = deltaX * sin + deltaY * cos;

        // Each outside component is zero while the point lies inside that
        // Rectangle axis. Their Euclidean length is therefore the shortest
        // distance to the local Rectangle boundary. This produces a true rounded
        // tolerance around corners instead of simply inflating width and height.
        const outsideX = Math.max(Math.abs(localX) - halfWidth, 0);
        const outsideY = Math.max(Math.abs(localY) - halfHeight, 0);

        geometryDistanceSquared = outsideX * outsideX + outsideY * outsideY;
      } else {
        const radius = shape === undefined
          ? this.#shapelessBodyRadius
          : shape.radius * this.#transform.pixelsPerUnit;

        const distanceFromCenter = Math.sqrt(centerDistanceSquared);
        const distanceFromGeometry = Math.max(0, distanceFromCenter - radius);

        geometryDistanceSquared = distanceFromGeometry * distanceFromGeometry;
      }

      if (geometryDistanceSquared > toleranceSquared) {
        continue;
      }

      // Geometry distance is the primary ranking metric. Center distance only
      // breaks ties, which commonly occur when the pointer lies inside multiple
      // overlapping bodies and every containing geometry has distance zero.
      const geometryIsNearer = geometryDistanceSquared < nearestGeometryDistanceSquared;
      const geometryDistanceIsEqual =
        geometryDistanceSquared === nearestGeometryDistanceSquared;
      const centerIsNearer = centerDistanceSquared < nearestCenterDistanceSquared;

      if (geometryIsNearer || (geometryDistanceIsEqual && centerIsNearer)) {
        nearestBodyId = snapshot.id;
        nearestGeometryDistanceSquared = geometryDistanceSquared;
        nearestCenterDistanceSquared = centerDistanceSquared;
      }
    }

    return nearestBodyId;
  }
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number.`);
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
