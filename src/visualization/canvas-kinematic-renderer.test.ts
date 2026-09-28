import { assertEquals, assertThrows } from "@std/assert";

import { type BodySnapshot, type BodyState, Vector2 } from "../engine/mod.ts";
import { CanvasKinematicRenderer } from "./canvas-kinematic-renderer.ts";

function createBodyState(position: Vector2, velocity: Vector2): BodyState {
  return { position, velocity };
}

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

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(2, 3), new Vector2(0, 0)),
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

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(3, -2), new Vector2(0, 0)),
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

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(-2, 1), new Vector2(0, 0)),
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

Deno.test("CanvasKinematicRenderer renders using the changed viewport scale", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  renderer.setViewportCenter(3, -2);
  renderer.setViewportScale(20);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(4, -1), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 120, 30, 3, 0, Math.PI * 2]]);
});

Deno.test("CanvasKinematicRenderer changes scale around a display-space anchor", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10);

  renderer.setViewportCenter(3, -2);

  const displayX = 140;
  const displayY = 30;

  const worldXBefore = renderer.displayToWorldX(displayX);
  const worldYBefore = renderer.displayToWorldY(displayY);

  renderer.setViewportScaleAroundDisplayPoint(20, displayX, displayY);

  assertEquals(renderer.viewportScale, 20);

  assertEquals(renderer.displayToWorldX(displayX), worldXBefore);

  assertEquals(renderer.displayToWorldY(displayY), worldYBefore);
});

Deno.test("CanvasKinematicRenderer finds a body at a display-space point", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 120, 20), 7);
});

Deno.test("CanvasKinematicRenderer returns undefined outside body markers", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 127, 20), undefined);
});

Deno.test("CanvasKinematicRenderer hit testing follows viewport transformation", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  renderer.setViewportCenter(3, -2);
  renderer.setViewportScale(20);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(4, -1), new Vector2(0, 0)),
    },
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 120, 30), 7);
});

Deno.test("CanvasKinematicRenderer picks the nearest hit body", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 10);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 1,
      state: createBodyState(new Vector2(0, 0), new Vector2(0, 0)),
    },
    {
      id: 2,
      state: createBodyState(new Vector2(1, 0), new Vector2(0, 0)),
    },
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 108, 50), 2);
});

Deno.test("CanvasKinematicRenderer highlights the requested body", () => {
  const context = new RecordingCanvasContext();

  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots, 7);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [
    ["arc", 120, 20, 6, 0, Math.PI * 2],
    ["arc", 120, 20, 10, 0, Math.PI * 2],
  ]);
});

Deno.test("CanvasKinematicRenderer does not highlight another body", () => {
  const context = new RecordingCanvasContext();

  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots, 8);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 120, 20, 6, 0, Math.PI * 2]]);
});

Deno.test("CanvasKinematicRenderer marks the selected body", () => {
  const context = new RecordingCanvasContext();

  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots, undefined, 7);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [
    ["arc", 120, 20, 6, 0, Math.PI * 2],
    ["arc", 120, 20, 14, 0, Math.PI * 2],
  ]);
});

Deno.test("CanvasKinematicRenderer can show hover and selection on the same body", () => {
  const context = new RecordingCanvasContext();

  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    {
      id: 7,
      state: createBodyState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  renderer.render(snapshots, 7, 7);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [
    ["arc", 120, 20, 6, 0, Math.PI * 2],
    ["arc", 120, 20, 10, 0, Math.PI * 2],
    ["arc", 120, 20, 14, 0, Math.PI * 2],
  ]);
});
