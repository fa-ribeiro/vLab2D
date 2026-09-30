import { assertThrows } from "@std/assert";

import {
  assertFiniteNumber,
  assertNonNegativeNumber,
  assertPositiveNumber,
} from "./validation.ts";

Deno.test("assertFiniteNumber accepts finite numbers", () => {
  for (const value of [-3.5, 0, 7]) {
    assertFiniteNumber(value, "Value");
  }
});

Deno.test("assertFiniteNumber rejects non-finite numbers", () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertThrows(() => assertFiniteNumber(value, "Value"), RangeError, "Value must be finite.");
  }
});

Deno.test("assertNonNegativeNumber accepts zero and positive values", () => {
  for (const value of [0, 2.5, Number.POSITIVE_INFINITY]) {
    assertNonNegativeNumber(value, "Value");
  }
});

Deno.test("assertNonNegativeNumber rejects negative values and NaN", () => {
  for (const value of [-1, Number.NEGATIVE_INFINITY, Number.NaN]) {
    assertThrows(
      () => assertNonNegativeNumber(value, "Value"),
      RangeError,
      "Value must not be negative.",
    );
  }
});

Deno.test("assertPositiveNumber accepts positive values", () => {
  for (const value of [0.5, 2, Number.POSITIVE_INFINITY]) {
    assertPositiveNumber(value, "Value");
  }
});

Deno.test("assertPositiveNumber rejects zero, negative values, and NaN", () => {
  for (const value of [0, -1, Number.NEGATIVE_INFINITY, Number.NaN]) {
    assertThrows(
      () => assertPositiveNumber(value, "Value"),
      RangeError,
      "Value must be positive.",
    );
  }
});
