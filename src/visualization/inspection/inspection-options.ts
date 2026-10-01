/**
 * Selects which renderer-neutral simulation inspection indicators are visible.
 *
 * These options describe diagnostic intent rather than drawing technology.
 * Canvas, SVG, or future visualization targets may render the same indicators
 * using technology-appropriate primitives.
 */
export interface InspectionOptions {
  /** Whether intrinsic Body geometry is outlined as an inspection overlay. */
  readonly showGeometryContour: boolean;

  /** Whether the Body local origin / current BodyState position is marked. */
  readonly showBodyOrigin: boolean;

  /** Whether local 0° / +X orientation is shown from the Body origin. */
  readonly showOrientation: boolean;

  /** Whether current BodyState velocity is shown as a directional vector. */
  readonly showVelocity: boolean;
}
