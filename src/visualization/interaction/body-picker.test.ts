import { assertEquals, assertThrows } from "@std/assert";

import {
  Body,
  type BodyId,
  type BodySnapshot,
  type BodyState,
  Circle,
  Rectangle,
  Vector2,
} from "../../engine/mod.ts";
import { BodyPicker } from "./body-picker.ts";
import { ViewportTransform } from "../viewport/viewport-transform.ts";

function createBodyState(position: Vector2, velocity: Vector2, orientation = 0): BodyState {
  return { position, velocity, orientation, angularVelocity: 0 };
}

function createBodySnapshot(
  id: BodyId,
  position: Vector2,
  velocity = new Vector2(0, 0),
  definition = new Body(),
  orientation = 0,
): BodySnapshot {
  return {
    id,
    definition,
    state: createBodyState(position, velocity, orientation),
  };
}

Deno.test("BodyPicker rejects a non-positive shapeless body radius", () => {
  const transform = new ViewportTransform(200, 100, 10);

  assertThrows(
    () => new BodyPicker(transform, 0),
    RangeError,
    "Shapeless body radius must be a positive finite number.",
  );
});

Deno.test("BodyPicker rejects a negative or non-finite pick tolerance", () => {
  const transform = new ViewportTransform(200, 100, 10);

  assertThrows(
    () => new BodyPicker(transform, 6, -1),
    RangeError,
    "Pick tolerance must be a non-negative finite number.",
  );

  assertThrows(
    () => new BodyPicker(transform, 6, Number.POSITIVE_INFINITY),
    RangeError,
    "Pick tolerance must be a non-negative finite number.",
  );
});

Deno.test("BodyPicker finds a shapeless body at a display-space point", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 120, 20), 7);
  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 127, 20), undefined);
});

Deno.test("BodyPicker applies pick tolerance around shapeless presentation geometry", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6, 4);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 130, 20), 7);
  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 131, 20), undefined);
});

Deno.test("BodyPicker follows shared viewport transformation changes", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6);

  transform.setCenter(3, -2);
  transform.setPixelsPerUnit(20);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(4, -1))];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 120, 30), 7);
});

Deno.test("BodyPicker returns the nearest hit body", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 10);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(1, new Vector2(0, 0)),
    createBodySnapshot(2, new Vector2(1, 0)),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 108, 50), 2);
});

Deno.test("BodyPicker prefers nearest geometry over nearest body center", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6, 4);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      1,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(10, 2) }),
    ),
    createBodySnapshot(
      2,
      new Vector2(4.5, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(0.2) }),
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 151, 50), 1);
});

Deno.test("BodyPicker uses Circle geometry radius", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(2) }),
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 115, 50), 7);
});

Deno.test("BodyPicker applies pick tolerance around Circle geometry", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6, 4);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(2) }),
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 124, 50), 7);
  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 125, 50), undefined);
});

Deno.test("BodyPicker Circle picking follows shared viewport scale", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(1) }),
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 115, 50), undefined);

  transform.setPixelsPerUnit(20);

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 115, 50), 7);
});

Deno.test("BodyPicker uses Rectangle geometry extent", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 119, 59), 7);
  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 121, 50), undefined);
  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 100, 61), undefined);
});

Deno.test("BodyPicker measures Rectangle pick tolerance as Euclidean edge distance", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6, 5);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 123, 63), 7);
  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 124, 64), undefined);
});

Deno.test("BodyPicker follows Rectangle orientation", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
      Math.PI / 2,
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 100, 69), 7);
  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 119, 50), undefined);
});

Deno.test("BodyPicker Rectangle picking follows shared viewport scale", () => {
  const transform = new ViewportTransform(200, 100, 10);
  const picker = new BodyPicker(transform, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(2, 1) }),
    ),
  ];

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 115, 50), undefined);

  transform.setPixelsPerUnit(20);

  assertEquals(picker.findBodyAtDisplayPoint(snapshots, 115, 50), 7);
});
