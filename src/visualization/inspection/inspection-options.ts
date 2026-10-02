/**
 * Describes renderer-neutral styling for inspection indicators.
 *
 * The style is deliberately plain serializable data so it can later come from
 * launch configuration, runtime controls, or persisted settings.
 */
export interface InspectionStyle {
  /** Stroke color understood by the target renderer. */
  readonly color: string;

  /** Stroke width in display units. */
  readonly lineWidth: number;
}

/**
 * Configures renderer-neutral simulation inspection indicators.
 *
 * The options are deliberately plain serializable data. They describe
 * inspection intent and presentation values without depending on Canvas, SVG,
 * DOM objects, functions, or persistence behavior.
 *
 * Each indicator may partially override the default style. Any omitted style
 * property inherits from defaultStyle.
 */
export interface InspectionOptions {
  /** Fallback style used by indicators without a complete style override. */
  readonly defaultStyle: InspectionStyle;

  /**
   * World-space axis-aligned bounding box for the current physical Body shape.
   *
   * The box follows the Engine's conservative collision bounds. It remains
   * aligned with world X/Y even when the underlying Body geometry rotates.
   */
  readonly aabb: {
    readonly visible: boolean;
    readonly style?: Partial<InspectionStyle>;
  };

  /** Intrinsic Body geometry contour inspection. */
  readonly geometryContour: {
    readonly visible: boolean;
    readonly style?: Partial<InspectionStyle>;
  };

  /** Body-local origin / current BodyState position inspection. */
  readonly bodyOrigin: {
    readonly visible: boolean;

    /** Marker radius in display units. */
    readonly radius: number;

    readonly style?: Partial<InspectionStyle>;
  };

  /** Body-local 0° / +X orientation inspection. */
  readonly orientation: {
    readonly visible: boolean;

    /** Orientation-line length in display units. */
    readonly length: number;

    readonly style?: Partial<InspectionStyle>;
  };

  /** Current BodyState velocity inspection. */
  readonly velocity: {
    readonly visible: boolean;

    /**
     * Time interval represented by the velocity shaft.
     *
     * The vector endpoint is position + velocity × projectionTime.
     */
    readonly projectionTime: number;

    /** Arrowhead size in display units. */
    readonly arrowheadSize: number;

    /**
     * Minimum shaft length in display units required for the vector to be
     * visually useful.
     */
    readonly minimumVisibleLength: number;

    readonly style?: Partial<InspectionStyle>;
  };

  /**
   * Narrow-phase collision minimum-translation-vector inspection.
   *
   * For each colliding physical-shape pair A/B, the vector starts at B's Body
   * origin and points along the collision normal by the penetration depth. It
   * therefore shows the minimum translation that would move B out of A along
   * the detected collision axis.
   */
  readonly collisionMtv: {
    readonly visible: boolean;

    /** Arrowhead size in display units. */
    readonly arrowheadSize: number;

    /**
     * Minimum shaft length in display units required for the vector to be
     * visually useful. Zero-depth touching therefore produces no visible MTV.
     */
    readonly minimumVisibleLength: number;

    readonly style?: Partial<InspectionStyle>;
  };
}
