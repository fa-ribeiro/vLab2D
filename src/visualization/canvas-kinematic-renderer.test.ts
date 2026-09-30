import { assertEquals, assertThrows } from "@std/assert";

import {
  Body,
  type BodyId,
  type BodySnapshot,
  type BodyState,
  Circle,
  Rectangle,
  Vector2,
} from "../engine/mod.ts";
import { CanvasKinematicRenderer } from "./canvas-kinematic-renderer.ts";

function createBodyState(position: Vector2, velocity: Vector2, orientation = 0): BodyState {
  return { position, velocity, orientation };
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

  fillRect(x: number, y: number, width: number, height: number): void {
    this.calls.push(["fillRect", x, y, width, height]);
  }

  strokeRect(x: number, y: number, width: number, height: number): void {
    this.calls.push(["strokeRect", x, y, width, height]);
  }

  save(): void {
    this.calls.push(["save"]);
  }

  restore(): void {
    this.calls.push(["restore"]);
  }

  translate(x: number, y: number): void {
    this.calls.push(["translate", x, y]);
  }

  rotate(angle: number): void {
    this.calls.push(["rotate", angle]);
  }
}

Deno.test("CanvasKinematicRenderer maps world coordinates to Canvas coordinates", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

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

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(3, -2))];

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

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(-2, 1))];

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

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(4, -1))];

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

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 120, 20), 7);
});

Deno.test("CanvasKinematicRenderer returns undefined outside body markers", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 127, 20), undefined);
});

Deno.test("CanvasKinematicRenderer hit testing follows viewport transformation", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  renderer.setViewportCenter(3, -2);
  renderer.setViewportScale(20);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(4, -1))];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 120, 30), 7);
});

Deno.test("CanvasKinematicRenderer picks the nearest hit body", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 10);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(1, new Vector2(0, 0)),
    createBodySnapshot(2, new Vector2(1, 0)),
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 108, 50), 2);
});

Deno.test("CanvasKinematicRenderer highlights the requested body", () => {
  const context = new RecordingCanvasContext();

  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

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

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

  renderer.render(snapshots, 8);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 120, 20, 6, 0, Math.PI * 2]]);
});

Deno.test("CanvasKinematicRenderer marks the selected body", () => {
  const context = new RecordingCanvasContext();

  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

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

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

  renderer.render(snapshots, 7, 7);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [
    ["arc", 120, 20, 6, 0, Math.PI * 2],
    ["arc", 120, 20, 10, 0, Math.PI * 2],
    ["arc", 120, 20, 14, 0, Math.PI * 2],
  ]);
});

Deno.test("CanvasKinematicRenderer renders Circle radius in world units", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(2, 3),
      new Vector2(0, 0),
      new Body({ shape: new Circle(1.5) }),
    ),
  ];

  renderer.render(snapshots);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 0, 0, 15, 0, Math.PI * 2]]);
});

Deno.test("CanvasKinematicRenderer scales Circle radius with the viewport", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  renderer.setViewportScale(20);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(1) }),
    ),
  ];

  renderer.render(snapshots);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 0, 0, 20, 0, Math.PI * 2]]);
});

Deno.test(
  "CanvasKinematicRenderer keeps shapeless body markers fixed across viewport scale",
  () => {
    const context = new RecordingCanvasContext();
    const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

    renderer.setViewportScale(20);

    const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(0, 0))];

    renderer.render(snapshots);

    const arcCalls = context.calls.filter(([name]) => name === "arc");

    assertEquals(arcCalls, [["arc", 100, 50, 3, 0, Math.PI * 2]]);
  },
);

Deno.test("CanvasKinematicRenderer picks Circle using its rendered geometry radius", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(2) }),
    ),
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 115, 50), 7);
});

Deno.test("CanvasKinematicRenderer sizes interaction rings around Circle geometry", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(2) }),
    ),
  ];

  renderer.render(snapshots, 7, 7);

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [
    ["arc", 0, 0, 20, 0, Math.PI * 2],
    ["arc", 100, 50, 24, 0, Math.PI * 2],
    ["arc", 100, 50, 28, 0, Math.PI * 2],
  ]);
});

Deno.test("CanvasKinematicRenderer scales Circle picking with the viewport", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Circle(1) }),
    ),
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 115, 50), undefined);

  renderer.setViewportScale(20);

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 115, 50), 7);
});

Deno.test("CanvasKinematicRenderer renders Rectangle dimensions in world units", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(2, 1),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
    ),
  ];

  renderer.render(snapshots);

  const fillRectCalls = context.calls.filter(([name]) => name === "fillRect");

  assertEquals(fillRectCalls, [["fillRect", -20, -10, 40, 20]]);
});

Deno.test(
  "CanvasKinematicRenderer applies positive Rectangle orientation counter-clockwise in world space",
  () => {
    const context = new RecordingCanvasContext();
    const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

    const snapshots: readonly BodySnapshot[] = [
      createBodySnapshot(
        7,
        new Vector2(2, 1),
        new Vector2(0, 0),
        new Body({ shape: new Rectangle(4, 2) }),
        Math.PI / 2,
      ),
    ];

    renderer.render(snapshots);

    const translateCalls = context.calls.filter(([name]) => name === "translate");
    const rotateCalls = context.calls.filter(([name]) => name === "rotate");
    const fillRectCalls = context.calls.filter(([name]) => name === "fillRect");

    assertEquals(translateCalls, [["translate", 120, 40]]);
    assertEquals(rotateCalls, [["rotate", -Math.PI / 2]]);
    assertEquals(fillRectCalls, [["fillRect", -20, -10, 40, 20]]);
  },
);

Deno.test(
  "CanvasKinematicRenderer applies Circle orientation even though its outline is symmetric",
  () => {
    const context = new RecordingCanvasContext();
    const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

    const snapshots: readonly BodySnapshot[] = [
      createBodySnapshot(
        7,
        new Vector2(2, 3),
        new Vector2(0, 0),
        new Body({ shape: new Circle(1.5) }),
        Math.PI / 3,
      ),
    ];

    renderer.render(snapshots);

    const translateCalls = context.calls.filter(([name]) => name === "translate");
    const rotateCalls = context.calls.filter(([name]) => name === "rotate");
    const arcCalls = context.calls.filter(([name]) => name === "arc");

    assertEquals(translateCalls, [["translate", 120, 20]]);
    assertEquals(rotateCalls, [["rotate", -Math.PI / 3]]);
    assertEquals(arcCalls, [["arc", 0, 0, 15, 0, Math.PI * 2]]);
  },
);

Deno.test("CanvasKinematicRenderer scales Rectangle dimensions with the viewport", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  renderer.setViewportScale(20);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
    ),
  ];

  renderer.render(snapshots);

  const fillRectCalls = context.calls.filter(([name]) => name === "fillRect");

  assertEquals(fillRectCalls, [["fillRect", -40, -20, 80, 40]]);
});

Deno.test("CanvasKinematicRenderer sizes interaction rings around Rectangle geometry", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(2, 1),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
    ),
  ];

  renderer.render(snapshots, 7, 7);

  const fillRectCalls = context.calls.filter(([name]) => name === "fillRect");
  const strokeRectCalls = context.calls.filter(([name]) => name === "strokeRect");

  assertEquals(fillRectCalls, [["fillRect", -20, -10, 40, 20]]);

  assertEquals(strokeRectCalls, [
    ["strokeRect", -24, -14, 48, 28],
    ["strokeRect", -28, -18, 56, 36],
  ]);
});

Deno.test("CanvasKinematicRenderer applies Rectangle orientation to interaction rings", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 3);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(2, 1),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
      Math.PI / 2,
    ),
  ];

  renderer.render(snapshots, 7, 7);

  const translateCalls = context.calls.filter(([name]) => name === "translate");
  const rotateCalls = context.calls.filter(([name]) => name === "rotate");
  const strokeRectCalls = context.calls.filter(([name]) => name === "strokeRect");

  assertEquals(translateCalls, [["translate", 120, 40]]);
  assertEquals(rotateCalls, [["rotate", -Math.PI / 2]]);
  assertEquals(strokeRectCalls, [
    ["strokeRect", -24, -14, 48, 28],
    ["strokeRect", -28, -18, 56, 36],
  ]);
});

Deno.test("CanvasKinematicRenderer picks Rectangle using its rendered geometry extent", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
    ),
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 119, 59), 7);
});

Deno.test("CanvasKinematicRenderer returns undefined outside Rectangle geometry", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(4, 2) }),
    ),
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 121, 50), undefined);
  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 100, 61), undefined);
});

Deno.test("CanvasKinematicRenderer scales Rectangle picking with the viewport", () => {
  const context = new RecordingCanvasContext();
  const renderer = new CanvasKinematicRenderer(context, 200, 100, 10, 6);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(
      7,
      new Vector2(0, 0),
      new Vector2(0, 0),
      new Body({ shape: new Rectangle(2, 1) }),
    ),
  ];

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 115, 50), undefined);

  renderer.setViewportScale(20);

  assertEquals(renderer.findBodyAtDisplayPoint(snapshots, 115, 50), 7);
});
