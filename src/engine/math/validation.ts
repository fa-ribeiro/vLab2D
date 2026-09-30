/**
 * Asserts that a number is finite.
 *
 * This validator checks finiteness only. Other constraints such as sign or
 * integrality should be expressed separately when the caller requires them.
 *
 * @param value The number to validate.
 * @param name Human-readable value name used in the error message.
 * @throws {RangeError} If the value is `NaN` or positive/negative infinity.
 */
export function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite.`);
  }
}

/**
 * Asserts that a number is greater than or equal to zero.
 *
 * This validator does not imply finiteness: positive infinity is
 * non-negative. `NaN` is rejected because it is not ordered relative to zero.
 *
 * @param value The number to validate.
 * @param name Human-readable value name used in the error message.
 * @throws {RangeError} If the value is negative or `NaN`.
 */
export function assertNonNegativeNumber(value: number, name: string): void {
  if (!(value >= 0)) {
    throw new RangeError(`${name} must not be negative.`);
  }
}

/**
 * Asserts that a number is greater than zero.
 *
 * This validator does not imply finiteness: positive infinity is positive.
 * `NaN` is rejected because it is not ordered relative to zero.
 *
 * @param value The number to validate.
 * @param name Human-readable value name used in the error message.
 * @throws {RangeError} If the value is zero, negative, or `NaN`.
 */
export function assertPositiveNumber(value: number, name: string): void {
  if (!(value > 0)) {
    throw new RangeError(`${name} must be positive.`);
  }
}
