import type { Circle } from "./circle.ts";
import type { Rectangle } from "./rectangle.ts";

/**
 * Optional intrinsic geometry attached to this reusable definition.
 *
 * The reference is retained directly because supported Body geometry is
 * immutable and reusable.
 */
export type BodyShape = Circle | Rectangle;
