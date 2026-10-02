import type { Circle } from "./circle.ts";
import type { Rectangle } from "./rectangle.ts";
import type { RegularPolygon } from "./regular-polygon.ts";

/**
 * Intrinsic geometry currently supported by a Body definition.
 */
export type BodyShape = Circle | Rectangle | RegularPolygon;
