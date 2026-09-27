import { assertEquals, assertThrows } from "@std/assert";

import { type KinematicBodySnapshot, KinematicState, Vector2 } from "../engine/mod.ts";
import { CanvasKinematicRenderer } from "./canvas-kinematic-renderer.ts";

class RecordingCanvasContext {
  readonly calls: unknown[][] = [];

  globalAlpha = 1;

  clearRect(x: number, y: number, width: number, height: number): void {
    this.calls.push(["clearRect", x, y, width, height]);
  }

  beginPath(): void {
    this.calls.push(["beginPath"]);
  }

  moveTo(x: number, y: number): void {
    this.calls.push(["moveTo", x, y]);
  }

  lineTo(x: number, y: number): void {
    this.calls.push(["lineTo", x, y]);
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.calls.push(["arc", x, y, radius, startAngle, endAngle]);
  }

  fill(): void {
    this.calls.push(["fill"]);
  }

  stroke(): void {
    this.calls.push(["stroke"]);
  }

  save(): void {
    this.calls.push(["save"]);
  }

  restore(): void {
    this.calls.push(["restore"]);
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

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 120, 20, 3, 0, Math.PI * 2]]);
});

Deno.test("CanvasKinematicRenderer redraw clears the previous frame", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10);

  renderer.render([]);
  renderer.render([]);

  const clearRectCalls = context.calls.filter(([name]) => name === "clearRect");
  assertEquals(clearRectCalls, [
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

Deno.test("CanvasKinematicRenderer renders world axes through the origin", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10);

  renderer.render([]);

  const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

  assertEquals(
    moveToCalls.some((call) => call[1] === 0 && call[2] === 50),
    true,
  );

  assertEquals(
    lineToCalls.some((call) => call[1] === 200 && call[2] === 50),
    true,
  );

  assertEquals(
    moveToCalls.some((call) => call[1] === 100 && call[2] === 0),
    true,
  );

  assertEquals(
    lineToCalls.some((call) => call[1] === 100 && call[2] === 100),
    true,
  );
});

Deno.test("CanvasKinematicRenderer renders a grid at integer world coordinates", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 100, 60, 20);

  renderer.render([]);

  const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

  assertEquals(
    moveToCalls.some((call) => call[1] === 30 && call[2] === 0),
    true,
  );

  assertEquals(
    lineToCalls.some((call) => call[1] === 30 && call[2] === 60),
    true,
  );

  assertEquals(
    moveToCalls.some((call) => call[1] === 70 && call[2] === 0),
    true,
  );

  assertEquals(
    moveToCalls.some((call) => call[1] === 0 && call[2] === 10),
    true,
  );

  assertEquals(
    moveToCalls.some((call) => call[1] === 0 && call[2] === 50),
    true,
  );
});

Deno.test("CanvasKinematicRenderer marks the world origin at the viewport center", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10);

  renderer.render([]);

  const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

  assertEquals(
    moveToCalls.some((call) => call[1] === 95 && call[2] === 50),
    true,
  );

  assertEquals(
    lineToCalls.some((call) => call[1] === 105 && call[2] === 50),
    true,
  );

  assertEquals(
    moveToCalls.some((call) => call[1] === 100 && call[2] === 45),
    true,
  );

  assertEquals(
    lineToCalls.some((call) => call[1] === 100 && call[2] === 55),
    true,
  );
});

Deno.test("CanvasKinematicRenderer renders relative to the viewport world center", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  renderer.setViewportCenter(3, -2);

  const snapshots: readonly KinematicBodySnapshot[] = [
    {
      id: 7,
      state: new KinematicState(new Vector2(3, -2), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 100, 50, 3, 0, Math.PI * 2]]);
});

Deno.test("CanvasKinematicRenderer moves world axes with the viewport center", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10);

  renderer.setViewportCenter(3, -2);
  renderer.render([]);

  const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

  assertEquals(
    moveToCalls.some((call) => call[1] === 0 && call[2] === 30),
    true,
  );

  assertEquals(
    lineToCalls.some((call) => call[1] === 200 && call[2] === 30),
    true,
  );

  assertEquals(
    moveToCalls.some((call) => call[1] === 70 && call[2] === 0),
    true,
  );

  assertEquals(
    lineToCalls.some((call) => call[1] === 70 && call[2] === 100),
    true,
  );
});

Deno.test("CanvasKinematicRenderer pans by display-space displacement", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  renderer.panViewportBy(20, 10);

  const snapshots: readonly KinematicBodySnapshot[] = [
    {
      id: 7,
      state: new KinematicState(new Vector2(-2, 1), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 100, 50, 3, 0, Math.PI * 2]]);
});

Deno.test("CanvasKinematicRenderer maps display coordinates into world coordinates", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10);

  renderer.setViewportCenter(3, -2);

  assertEquals(renderer.displayToWorldX(100), 3);
  assertEquals(renderer.displayToWorldY(50), -2);

  assertEquals(renderer.displayToWorldX(120), 5);
  assertEquals(renderer.displayToWorldY(20), 1);
});
