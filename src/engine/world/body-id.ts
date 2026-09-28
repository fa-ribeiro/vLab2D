/**
 * Identifies a body instance owned by a `World`.
 *
 * Body identifiers are unique within the world that created them. Callers
 * should treat the numeric value as an identifier rather than assign meaning
 * to it.
 */
export type BodyId = number;
