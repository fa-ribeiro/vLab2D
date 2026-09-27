import { assertEquals, assertThrows } from "@std/assert";

import { type KinematicBodySnapshot, KinematicState, Vector2 } from "../engine/mod.ts";
import { CanvasKinematicRenderer } from "./canvas-kinematic-renderer.ts";

class RecordingCanvasContext {
  readonly calls: unknown[][] = [];

  clearRect(x: number, y: number, width: number, height: number): void {
    this.calls.push(["clearRect", x, y, width, height]);
  }

  beginPath(): void {
    this.calls.push(["beginPath"]);
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.calls.push(["arc", x, y, radius, startAngle, endAngle]);
  }

  fill(): void {
    this.calls.push(["fill"]);
  }
}

Deno.test("CanvasKinematicRenderer maps world coordinates to Canvas coordinates", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  const snapshots: readonly KinematicBodySnapshot[] = [
    {
      id: 7,
      state: new KinematicState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots);

  assertEquals(context.calls, [
    ["clearRect", 0, 0, 200, 100],
    ["beginPath"],
    ["arc", 120, 20, 3, 0, Math.PI * 2],
    ["fill"],
  ]);
});

Deno.test("CanvasKinematicRenderer redraw clears the previous frame", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10);

  renderer.render([]);
  renderer.render([]);

  assertEquals(context.calls, [
    ["clearRect", 0, 0, 200, 100],
    ["clearRect", 0, 0, 200, 100],
  ]);
});

Deno.test("CanvasKinematicRenderer rejects a non-positive display scale", () => {
  const context = new RecordingCanvasContext();

  assertThrows(
    () => new CanvasKinematicRenderer(context, 200, 100, 0),
    RangeError,
    "Pixels per unit must be a positive finite number.",
  );
});
