import {
  type BodyId,
  type BodySnapshot,
  Circle,
  Rectangle,
  RegularPolygon,
} from "../../engine/mod.ts";
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
   * @throws {RangeError} If the shapeless body radius is not positive and
   * finite or the pick tolerance is negative or not finite.
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
   * Shapeless bodies use their circular presentation marker. Physical Circle,
   * Rectangle, and RegularPolygon bodies use their transformed domain geometry.
   * Candidate bodies are ranked by distance to geometry, with center distance
   * used only as a tie-breaker.
   *
   * @param snapshots Detached body observations to test.
   * @param displayX Horizontal point coordinate in display units.
   * @param displayY Vertical point coordinate in display units.
   * @returns The identifier of the nearest candidate body, or `undefined`.
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

      const geometryDistanceSquared = this.#geometryDistanceSquared(
        snapshot,
        deltaX,
        deltaY,
        centerDistanceSquared,
      );

      if (geometryDistanceSquared > toleranceSquared) {
        continue;
      }

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

  #geometryDistanceSquared(
    snapshot: BodySnapshot,
    deltaX: number,
    deltaY: number,
    centerDistanceSquared: number,
  ): number {
    const shape = snapshot.definition.shape;

    if (shape instanceof Circle) {
      return this.#displayCircleDistanceSquared(
        centerDistanceSquared,
        shape.radius * this.#transform.pixelsPerUnit,
      );
    }

    if (shape instanceof Rectangle) {
      const localPoint = this.#displayDeltaToBodyLocal(
        deltaX,
        deltaY,
        snapshot.state.orientation,
      );

      return this.#rectangleGeometryDistanceSquared(
        localPoint.x,
        localPoint.y,
        shape.width,
        shape.height,
      );
    }

    if (shape instanceof RegularPolygon) {
      const localPoint = this.#displayDeltaToBodyLocal(
        deltaX,
        deltaY,
        snapshot.state.orientation,
      );

      return this.#regularPolygonGeometryDistanceSquared(shape, localPoint.x, localPoint.y);
    }

    if (shape === undefined) {
      return this.#displayCircleDistanceSquared(
        centerDistanceSquared,
        this.#shapelessBodyRadius,
      );
    }

    return shape satisfies never;
  }

  #displayCircleDistanceSquared(centerDistanceSquared: number, radius: number): number {
    const distanceFromCenter = Math.sqrt(centerDistanceSquared);
    const distanceFromGeometry = Math.max(0, distanceFromCenter - radius);

    return distanceFromGeometry * distanceFromGeometry;
  }

  #rectangleGeometryDistanceSquared(
    localX: number,
    localY: number,
    worldWidth: number,
    worldHeight: number,
  ): number {
    const halfWidth = (worldWidth * this.#transform.pixelsPerUnit) / 2;
    const halfHeight = (worldHeight * this.#transform.pixelsPerUnit) / 2;

    const outsideX = Math.max(Math.abs(localX) - halfWidth, 0);
    const outsideY = Math.max(Math.abs(localY) - halfHeight, 0);

    return outsideX * outsideX + outsideY * outsideY;
  }

  #regularPolygonGeometryDistanceSquared(
    shape: RegularPolygon,
    localX: number,
    localY: number,
  ): number {
    // RegularPolygon is convex. A point is inside when it stays on one
    // consistent side of every directed edge. If it is outside, the shortest
    // point-to-segment distance gives the same Euclidean geometry-distance
    // quantity already used by the picker for tolerance and candidate ranking.
    let windingSign = 0;
    let inside = true;
    let minimumEdgeDistanceSquared = Number.POSITIVE_INFINITY;

    for (let index = 0; index < shape.vertices.length; index++) {
      const nextIndex = (index + 1) % shape.vertices.length;

      const start = shape.vertices[index];
      const end = shape.vertices[nextIndex];

      const startX = start.x * this.#transform.pixelsPerUnit;
      const startY = -start.y * this.#transform.pixelsPerUnit;
      const endX = end.x * this.#transform.pixelsPerUnit;
      const endY = -end.y * this.#transform.pixelsPerUnit;

      const edgeX = endX - startX;
      const edgeY = endY - startY;
      const pointX = localX - startX;
      const pointY = localY - startY;

      const cross = edgeX * pointY - edgeY * pointX;

      if (cross !== 0) {
        const currentSign = cross > 0 ? 1 : -1;

        if (windingSign === 0) {
          windingSign = currentSign;
        } else if (currentSign !== windingSign) {
          inside = false;
        }
      }

      minimumEdgeDistanceSquared = Math.min(
        minimumEdgeDistanceSquared,
        pointToSegmentDistanceSquared(localX, localY, startX, startY, endX, endY),
      );
    }

    return inside ? 0 : minimumEdgeDistanceSquared;
  }

  #displayDeltaToBodyLocal(
    deltaX: number,
    deltaY: number,
    orientation: number,
  ): { readonly x: number; readonly y: number } {
    const cos = Math.cos(orientation);
    const sin = Math.sin(orientation);

    return {
      x: deltaX * cos - deltaY * sin,
      y: deltaX * sin + deltaY * cos,
    };
  }
}

function pointToSegmentDistanceSquared(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const edgeX = endX - startX;
  const edgeY = endY - startY;
  const lengthSquared = edgeX * edgeX + edgeY * edgeY;

  const projection = ((pointX - startX) * edgeX + (pointY - startY) * edgeY) / lengthSquared;

  const clampedProjection = Math.max(0, Math.min(1, projection));

  const closestX = startX + edgeX * clampedProjection;
  const closestY = startY + edgeY * clampedProjection;

  const deltaX = pointX - closestX;
  const deltaY = pointY - closestY;

  return deltaX * deltaX + deltaY * deltaY;
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
