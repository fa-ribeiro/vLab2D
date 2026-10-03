/**
 * Describes how a Body participates in World motion.
 *
 * Dynamic Bodies are advanced by the World's physical integration and have
 * positive inverse mass. Static Bodies are immovable World geometry and have
 * zero inverse mass.
 *
 * A future kinematic Body type may also have zero inverse mass while moving by
 * prescribed motion rather than physical integration. Body type and inverse
 * mass are therefore related concepts, but they do not represent the same
 * property.
 */
export type BodyType = "dynamic" | "static";
